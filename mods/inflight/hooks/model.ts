import type { Ci, PrRow, RunRow } from '../types'

export type Rollup = {
  __typename?: string
  name?: string
  workflowName?: string
  status?: string
  conclusion?: string
  startedAt?: string
  context?: string
  state?: string
}

export type RawPr = {
  number: number
  title: string
  url: string
  isDraft: boolean
  autoMergeRequest: unknown
  statusCheckRollup: Rollup[] | null
}

export type RawRun = {
  status: string
  conclusion: string
  displayTitle: string
  url: string
  updatedAt: string
}

export const SIX_HOURS_MS = 6 * 60 * 60 * 1000

const PASSED = ['SUCCESS', 'NEUTRAL', 'SKIPPED']

function checkState(c: Rollup): 'pass' | 'fail' | 'run' {
  if (c.__typename === 'StatusContext') {
    if (c.state === 'SUCCESS') return 'pass'
    return c.state === 'PENDING' || c.state === 'EXPECTED' ? 'run' : 'fail'
  }
  if (c.status !== 'COMPLETED') return 'run'
  return PASSED.includes(c.conclusion ?? '') ? 'pass' : 'fail'
}

const rank = (c: Rollup) => (c.startedAt?.startsWith('0001') ? '9999' : (c.startedAt ?? ''))

export function summarize(rollup: Rollup[] | null): { ci: Ci; failing: string[] } {
  const latest = new Map<string, Rollup>()
  for (const c of rollup ?? []) {
    const key = `${c.workflowName ?? ''}/${c.name ?? c.context ?? ''}`
    const seen = latest.get(key)
    if (!seen || rank(c) >= rank(seen)) latest.set(key, c)
  }
  const states = [...latest.entries()].map(([key, c]) => ({ key, c, s: checkState(c) }))
  const failing = states.filter(x => x.s === 'fail').map(x => x.c.name ?? x.c.context ?? x.key)
  if (failing.length > 0) return { ci: 'red', failing }
  if (states.some(x => x.s === 'run')) return { ci: 'running', failing }
  return { ci: states.length > 0 ? 'green' : 'none', failing }
}

export function toPr(repo: string, raw: RawPr): PrRow {
  const { ci, failing } = summarize(raw.statusCheckRollup)
  return {
    repo,
    number: raw.number,
    title: raw.title,
    url: raw.url,
    isDraft: raw.isDraft,
    ci,
    failing,
    isAutoMerge: raw.autoMergeRequest != null,
  }
}

const FAILED = ['failure', 'timed_out', 'startup_failure']

export function inflightRuns(workflow: string, raws: RawRun[], now: number): RunRow[] {
  const rows: RunRow[] = []
  const seen = new Set<string>()
  for (const r of raws) {
    if (seen.has(r.url)) continue
    seen.add(r.url)
    const isRecent = now - Date.parse(r.updatedAt) <= SIX_HOURS_MS
    const state = r.status !== 'completed' ? 'running' : FAILED.includes(r.conclusion) && isRecent ? 'failed' : null
    if (state) rows.push({ workflow, title: r.displayTitle, url: r.url, state, updatedAt: r.updatedAt })
  }
  return rows
}

export function parseNotification(text: string): { id: string; status: string } | null {
  const id = /<task-id>([^<]+)<\/task-id>/.exec(text)?.[1]
  const status = /<status>([^<]+)<\/status>/.exec(text)?.[1]
  return id && status ? { id, status } : null
}
