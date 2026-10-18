import { expect, test } from 'claude-code/testing'

import { inflightRuns, parseNotification, summarize } from '../hooks/model'

const run = (name: string, status: string, conclusion: string, startedAt: string) => ({
  __typename: 'CheckRun',
  name,
  workflowName: 'CI',
  status,
  conclusion,
  startedAt,
})

test('a superseded cancelled check does not read as red', async () => {
  const { ci } = summarize([
    run('build', 'COMPLETED', 'CANCELLED', '2026-10-18T10:00:00Z'),
    run('build', 'COMPLETED', 'SUCCESS', '2026-10-18T10:05:00Z'),
  ])
  expect(ci).toBe('green')
})

test('the latest failing check is red and named', async () => {
  const { ci, failing } = summarize([
    run('build', 'COMPLETED', 'SUCCESS', '2026-10-18T10:00:00Z'),
    run('build', 'COMPLETED', 'FAILURE', '2026-10-18T10:05:00Z'),
  ])
  expect(ci).toBe('red')
  expect(failing).toEqual(['build'])
})

test('an unfinished check reads as running', async () => {
  expect(summarize([run('build', 'IN_PROGRESS', '', '2026-10-18T10:00:00Z')]).ci).toBe('running')
})

test('runs: running and recent failures stay, old failures and successes go', async () => {
  const now = Date.parse('2026-10-18T12:00:00Z')
  const rows = inflightRuns(
    'deploy.yml',
    [
      { status: 'in_progress', conclusion: '', displayTitle: 'a', url: 'u1', updatedAt: '2026-10-18T11:59:00Z' },
      { status: 'completed', conclusion: 'failure', displayTitle: 'b', url: 'u2', updatedAt: '2026-10-18T08:00:00Z' },
      { status: 'completed', conclusion: 'failure', displayTitle: 'c', url: 'u3', updatedAt: '2026-10-18T03:00:00Z' },
      { status: 'completed', conclusion: 'success', displayTitle: 'd', url: 'u4', updatedAt: '2026-10-18T11:00:00Z' },
    ],
    now,
  )
  expect(rows.map(r => r.url)).toEqual(['u1', 'u2'])
})

test('a task notification names its task and status', async () => {
  const text = '<task-notification>\n<task-id>bl4da7a2h</task-id>\n<status>completed</status>\n</task-notification>'
  expect(parseNotification(text)).toEqual({ id: 'bl4da7a2h', status: 'completed' })
})

test('a queued re-run supersedes the earlier failure', async () => {
  const { ci } = summarize([
    run('build', 'COMPLETED', 'FAILURE', '2026-10-18T10:00:00Z'),
    run('build', 'QUEUED', '', '0001-01-01T00:00:00Z'),
  ])
  expect(ci).toBe('running')
})
