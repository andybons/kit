export type AgentRow = {
  id: string
  label: string
  type: string
  status: 'run' | 'wait' | 'fail'
}

export type Ci = 'green' | 'red' | 'running' | 'none'

export type PrRow = {
  repo: string
  number: number
  title: string
  url: string
  isDraft: boolean
  ci: Ci
  failing: string[]
  isAutoMerge: boolean
}

export type RunRow = {
  workflow: string
  title: string
  url: string
  state: 'running' | 'failed'
  updatedAt: string
}

export type ShellRow = { id: string; command: string }

declare module 'claude-code' {
  interface PluginState {
    inflight: {
      agents: AgentRow[]
      prs: Record<string, PrRow[]>
      runs: Record<string, RunRow[]>
      shells: ShellRow[]
      problem: string | null
    }
  }
}
