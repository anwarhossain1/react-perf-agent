/**
 * Thin wrapper around the Claude Code CLI in headless mode.
 * Captures the full stream-json trajectory — this doubles as deliverable #4.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Spawn the native binary directly. Never via a shell: on Windows, spawn with
// shell:true does not quote argv, so a multi-line prompt is split on whitespace
// and Claude receives only its first word.
const CLI = process.platform === 'win32'
  ? path.join(process.env.APPDATA, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe')
  : 'claude'

export function runClaude ({ prompt, cwd, allowedTools, systemPrompt, trajectoryPath, model = 'claude-opus-5' }) {
  return new Promise((resolve, reject) => {
    // Windows caps a command line at ~32 KB, and a prompt with source files
    // inlined blows straight past it (ENAMETOOLONG). Anything large goes over
    // stdin, which the CLI reads when -p is given no inline prompt.
    const viaStdin = prompt.length > 6000
    // --allowedTools AUTO-APPROVES tools; it does not remove the others. Passing
    // ['Read','Edit','Write'] therefore still leaves Bash available, and the agent
    // was observed running `npx vite build` itself - which would let the model
    // grade its own work. Capability is only actually removed by --disallowedTools,
    // so every arm states what it is denied and the deny list is the contract.
    //
    // An empty --allowedTools list also leaves the flag argument-less and the CLI
    // exits 1, so a tool-less arm must be expressed purely as a deny list.
    const EVERY_TOOL = ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'Bash', 'PowerShell',
      'WebFetch', 'WebSearch', 'NotebookEdit', 'TodoWrite', 'Task', 'Workflow',
      'Skill', 'ToolSearch', 'Artifact', 'SendMessage', 'Monitor', 'RemoteTrigger',
      'ScheduleWakeup', 'TaskOutput', 'TaskStop', 'ListAgents', 'PushNotification',
      'ReportFindings', 'DesignSync', 'EnterWorktree', 'ExitWorktree',
      'CronCreate', 'CronDelete', 'CronList']
    const denied = EVERY_TOOL.filter((t) => !allowedTools.includes(t))
    const toolArgs = allowedTools.length
      ? ['--allowedTools', ...allowedTools, '--disallowedTools', ...denied]
      : ['--disallowedTools', ...denied]
    const args = ['-p', ...(viaStdin ? [] : [prompt]), '--model', model,
      '--output-format', 'stream-json', '--verbose',
      '--permission-mode', 'acceptEdits',
      ...toolArgs]
    if (systemPrompt) args.push('--append-system-prompt', systemPrompt)

    const p = spawn(CLI, args, { cwd, shell: false })
    if (viaStdin) {
      p.stdin.write(prompt)
      p.stdin.end()
    }
    let stdout = '', stderr = ''
    p.stdout.on('data', d => { stdout += d })
    p.stderr.on('data', d => { stderr += d })
    p.on('error', reject)
    p.on('close', (code) => {
      if (trajectoryPath) {
        fs.mkdirSync(path.dirname(trajectoryPath), { recursive: true })
        fs.writeFileSync(trajectoryPath, stdout)
      }
      const events = stdout.split('\n').filter(Boolean).map(l => {
        try { return JSON.parse(l) } catch { return null }
      }).filter(Boolean)
      const result = events.find(e => e.type === 'result')
      resolve({
        code,
        events,
        text: result?.result ?? '',
        turns: result?.num_turns ?? events.filter(e => e.type === 'assistant').length,
        costUsd: result?.total_cost_usd ?? null,
        usage: result?.usage ?? null,
        toolCalls: events.filter(e => e.type === 'assistant')
          .flatMap(e => (e.message?.content ?? []).filter(c => c.type === 'tool_use').map(c => c.name)),
        stderr: stderr.slice(0, 2000),
      })
    })
  })
}
