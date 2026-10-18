import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'inflight',
  component: 'Pane',
  requestId: 'inflight',
  viewport: { columns: 100, rows: 40 },
  props: { title: 'Inflight', isFocused: false, bodyColumns: 60, placement: 'inline', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

const pr = [{ number: 7, title: 'keep me', url: 'u', isDraft: false, autoMergeRequest: null, statusCheckRollup: [] }]

test('a failed gh poll keeps the last rows and marks unseen sections unavailable', async ($, on) => {
  const clock = mock.clock(on)
  let isDown = false
  on('command.register', () => ({ value: { command: 'inflight' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('agent.list', () => ({ value: [] }))
  on('process.run', ($, e) => {
    if (isDown || e.argv[1] === 'run') return { value: { exitCode: 1, stdout: '', stderr: 'boom', isStdoutTruncated: false, isStderrTruncated: false } }
    return { value: { exitCode: 0, stdout: JSON.stringify(pr), stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('session.start', () => ({ cwd: '/work' }))

  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await clock.settle()
  isDown = true
  await clock.advance(45_000)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /keep me/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /unavailable: deploy.yml/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /none open|none running/ })).toBeUndefined()
})

test('a deploy failure behind ten newer successes still shows', async ($, on) => {
  const clock = mock.clock(on)
  const mk = (n: number, conclusion: string) => ({
    status: 'completed', conclusion, displayTitle: `run ${n}`, url: `u${n}`, updatedAt: new Date(60_000 - n).toISOString(),
  })
  const runs = [...Array.from({ length: 10 }, (_, n) => mk(n, 'success')), mk(10, 'failure')]
  on('command.register', () => ({ value: { command: 'inflight' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('agent.list', () => ({ value: [] }))
  on('process.run', ($, e) => {
    const at = (flag: string) => e.argv[e.argv.indexOf(flag) + 1]
    const found = e.argv[1] === 'run' ? runs.slice(0, Number(at('--limit'))) : []
    return {
      value: { exitCode: 0, stdout: JSON.stringify(found), stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
    }
  })
  on('session.start', () => ({ cwd: '/work' }))

  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await clock.settle()

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: 'run 10' })).toBeDefined()
})
