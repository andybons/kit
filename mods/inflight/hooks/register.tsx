import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AgentRow, PrRow, RunRow, ShellRow } from '../types'
import { inflightRuns, parseNotification, toPr } from './model'
import type { RawPr, RawRun } from './model'

const PANE = 'inflight'
const AGENT_POLL_MS = 3_000
const GH_POLL_MS = 45_000
const WORKFLOWS = ['deploy.yml', 'roll-golden-warmpool.yml']
const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/

const agents = atom({ plugin: 'inflight', key: 'agents' } as const, [])
const prs = atom({ plugin: 'inflight', key: 'prs' } as const, {})
const runs = atom({ plugin: 'inflight', key: 'runs' } as const, {})
const shells = atom({ plugin: 'inflight', key: 'shells' } as const, [])
const problem = atom({ plugin: 'inflight', key: 'problem' } as const, null)

const AGENT_STATE = {
  running: 'run',
  pending: 'wait',
  paused: 'wait',
  waiting: 'wait',
  failed: 'fail',
} as const

function repoList(value: unknown): string[] {
  return String(value ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(s => REPO_PATTERN.test(s))
}

async function gh<T>($: EngineInterface, args: string[]): Promise<T> {
  const r = await $.process.run(['gh', ...args], {
    env: { GH_PROMPT_DISABLED: '1', GH_NO_UPDATE_NOTIFIER: '1' },
    timeoutMs: 20_000,
  })
  if (r.exitCode !== 0) {
    throw new Error(`gh ${args[0]} ${args[1]}: ${r.stderr.trim().split('\n')[0] ?? 'failed'}`)
  }
  return JSON.parse(r.stdout) as T
}

const PR_FIELDS = 'number,title,url,isDraft,autoMergeRequest,statusCheckRollup'
const RUN_FIELDS = 'status,conclusion,displayTitle,url,updatedAt'

const memo = { lastAgents: '', isPolling: false }

async function refreshAgents($: EngineInterface) {
  try {
    const rows: AgentRow[] = []
    for (const a of await $.agent.list()) {
      const status = AGENT_STATE[a.status as keyof typeof AGENT_STATE]
      if (status) rows.push({ id: a.id, label: a.description || a.name || a.type, type: a.type, status })
    }
    const key = JSON.stringify(rows)
    if (key === memo.lastAgents) return
    memo.lastAgents = key
    await update($, agents, () => rows)
  } catch {}
}

async function collect<T>(
  keys: string[],
  fetch: (key: string) => Promise<T>,
  errors: string[],
): Promise<Record<string, T>> {
  const out: Record<string, T> = {}
  await Promise.all(
    keys.map(async key => {
      try {
        out[key] = await fetch(key)
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err))
      }
    }),
  )
  return out
}

async function refreshGh($: EngineInterface, repos: string[], deployRepo: string | undefined) {
  if (memo.isPolling) return
  memo.isPolling = true
  const errors: string[] = []
  try {
    const now = await $.clock.now()
    const prRows = await collect(
      repos,
      async repo => {
        const list = await gh<RawPr[]>($, [
          'pr', 'list', '--repo', repo, '--author', '@me', '--state', 'open',
          '--limit', '30', '--json', PR_FIELDS,
        ])
        return list.map(p => toPr(repo, p))
      },
      errors,
    )
    const runRows = deployRepo
      ? await collect(
          WORKFLOWS,
          async w => {
            const list = await gh<RawRun[]>($, [
              'run', 'list', '--repo', deployRepo, '--workflow', w,
              '--limit', '100', '--json', RUN_FIELDS,
            ])
            return inflightRuns(w, list, now)
          },
          errors,
        )
      : {}
    await update($, prs, prev => ({ ...prev, ...prRows }))
    await update($, runs, prev => ({ ...prev, ...runRows }))
    await update($, problem, () => errors[0] ?? null)
  } finally {
    memo.isPolling = false
  }
}

export const register: Register = (on, options) => {
  const repos = repoList(options.repos)
  const deployRepo = repoList(options.deploy_repo)[0]

  on('session.start', async ($, e, next) => {
    if (!e.isInteractive) return next(e)
    await $.command.register({ name: 'inflight', description: 'Open the inflight pane' })
    $.ui.open({ id: PANE, title: 'Inflight' }).catch(() => undefined)
    refreshAgents($).catch(() => undefined)
    refreshGh($, repos, deployRepo).catch(() => undefined)
    $.clock.every(AGENT_POLL_MS, () => void refreshAgents($).catch(() => undefined))
    $.clock.every(GH_POLL_MS, () => void refreshGh($, repos, deployRepo).catch(() => undefined))

    return next(e)
  })

  on('command.run', { command: 'inflight' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Inflight' })

    return { text: 'Inflight pane opened.' }
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    const result = ran.result as { backgroundTaskId?: string } | undefined
    const id = result?.backgroundTaskId
    if (id) {
      const row: ShellRow = { id, command: (e.description || e.command.split('\n')[0] || '').slice(0, 200) }
      await update($, shells, list => [...list.filter(s => s.id !== id), row])
    }

    return ran
  }).catch(($, e, next) => next(e))

  on('prompt.submit', async ($, e, next) => {
    if (e.origin?.kind === 'task-notification') {
      const done = parseNotification(e.text)
      if (done && done.status !== 'running') {
        await update($, shells, list => list.filter(s => s.id !== done.id))
      }
    }

    return next(e)
  }).catch(($, e, next) => next(e))

  on('classic.Stop', async ($, e, next) => {
    const live = e.background_tasks?.map(t => t.id)
    if (live) await update($, shells, list => list.filter(s => live.includes(s.id)))

    return next(e)
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const [agentRows, prMap, runMap, shellRows, err] = await Promise.all([
      read($, agents), read($, prs), read($, runs), read($, shells), read($, problem),
    ])
    const prRows = repos.flatMap(r => prMap[r] ?? [])
    const runRows = WORKFLOWS.flatMap(w => runMap[w] ?? [])
    const prMissing = repos.filter(r => !(r in prMap))
    const runMissing = deployRepo ? WORKFLOWS.filter(w => !(w in runMap)) : []
    const gap = (missing: string[], empty: string) =>
      missing.length === 0 ? empty : err ? `unavailable: ${missing.join(', ')}` : 'loading'
    const more = (n: number, max: number) =>
      n > max ? <Text dimColor>  +{n - max} more</Text> : null
    const GLYPH = { green: '✓', red: '✗', running: '●', none: '○' } as const
    const COLOR = { green: 'success', red: 'error', running: 'warning', none: 'inactive' } as const
    const AGENT_COLOR = { run: 'warning', wait: 'inactive', fail: 'error' } as const

    return (
      <Box flexDirection="column">
        <Text bold>Subagents</Text>
        {agentRows.length === 0 && <Text dimColor>  none</Text>}
        {agentRows.slice(0, 8).map(a => (
          <Text key={a.id} wrap="truncate-end">
            <Text color={AGENT_COLOR[a.status]}>{a.status.padEnd(4)}</Text> {a.label} <Text dimColor>{a.type}</Text>
          </Text>
        ))}
        {more(agentRows.length, 8)}

        <Text bold>{'\n'}Pull requests</Text>
        {(prRows.length === 0 || prMissing.length > 0) && (
          <Text dimColor wrap="truncate-end">  {gap(prMissing, 'none open')}</Text>
        )}
        {prRows.slice(0, 12).map(p => (
          <Box key={`${p.repo}#${p.number}`} flexDirection="column">
            <Text wrap="truncate-end">
              <Text color={COLOR[p.ci]}>{GLYPH[p.ci]}</Text> {p.repo.split('/')[1]}#{p.number}{' '}
              <Text color={p.isAutoMerge ? 'success' : 'inactive'}>{p.isAutoMerge ? 'auto' : 'manual'}</Text>
              {p.isDraft ? <Text dimColor> draft</Text> : null} {p.title}
            </Text>
            {p.failing.length > 0 && (
              <Text dimColor wrap="truncate-end">    {p.failing.slice(0, 2).join(', ')}</Text>
            )}
          </Box>
        ))}
        {more(prRows.length, 12)}

        <Text bold>{'\n'}Deploys</Text>
        {(runRows.length === 0 || runMissing.length > 0) && (
          <Text dimColor wrap="truncate-end">  {gap(runMissing, 'none running, none failed in 6h')}</Text>
        )}
        {runRows.slice(0, 6).map(r => (
          <Text key={r.url} wrap="truncate-end">
            <Text color={r.state === 'failed' ? 'error' : 'warning'}>{r.state === 'failed' ? '✗' : '●'}</Text>{' '}
            {r.workflow.replace('.yml', '')} <Text dimColor>{r.title}</Text>
          </Text>
        ))}
        {more(runRows.length, 6)}

        <Text bold>{'\n'}Background shells</Text>
        {shellRows.length === 0 && <Text dimColor>  none</Text>}
        {shellRows.slice(0, 6).map(s => (
          <Text key={s.id} wrap="truncate-end">
            <Text color="warning">●</Text> {s.command}
          </Text>
        ))}
        {more(shellRows.length, 6)}

        {err && <Text color="error" wrap="truncate-end">{'\n'}{err}</Text>}
      </Box>
    )
  })
}
