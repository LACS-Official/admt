# Findings & Decisions: AI Copilot & Diagnostics

## Requirements
- **Dual Mode (Chat & Agent)**:
  - Chat Mode: Pure text conversation, no executable ADB actions.
  - Agent Mode: Generates structured ADB commands to execute. Requires a switch in the UI.
- **Safety Gate**:
  - Displays command card with checkable list, danger level, risk warning, and thought process.
  - Requires user's explicit click/approval to run.
  - Blacklists harmful commands (e.g. `rm -rf`, formatting system directories, etc.) in backend.
- **Logcat Crash Diagnostics**:
  - One-click diagnostic button in the Logs Panel.
  - Automatically fetches logs, filters crash stacks/error events, formats prompt, and triggers the AI window to open and analyze.
- **Free API Platforms**:
  - Siliconflow (for fast Chinese open-source models, Qwen2.5/GLM-4).
  - Gemini 1.5 Flash (for huge context Logcat crash diagnostics).
  - User-provided custom Keys / Endpoint configuration (already existing in `aiConfig`).

## Research Findings
- **AIChatPanel (`src/components/Console/AIChatPanel.tsx`)**:
  - Already contains UI layout with a sidebar (history) and main chat window.
  - Already handles custom markdown parsing for code blocks and has a simple "run in command line window" button (`handleRunCommand(rawCode)` via emit `"execute-command-from-ai"`).
  - Uses `aiService.ts` for model requests.
- **aiService (`src/services/aiService.ts`)**:
  - Connects to providers: `openai`, `local`, `zhipu`, `anthropic`, `google` (Gemini).
  - Translates message history to respective API formats.
  - Enabled status resides in the global application config store `useAppStore`.
- **LogsPanel (`src/components/Others/LogsPanel.tsx`)**:
  - Contains filters, levels, search keywords, and lists of logs.
  - We can append an AI analysis trigger next to logs or when a crash is selected.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Toggle Switch in Fluent UI | Use Fluent UI `Switch` or a segmented ButtonGroup to control `isAgentMode` in the store or UI state |
| JSON Prompting in Agent Mode | Force JSON schema by prepending a system message instructing the model to output a strict JSON structure containing `thought`, `danger_level`, `risk_warning`, and `actions` array |
| Fallback Chat Renderer | If JSON parsing fails in Agent Mode, fallback to rendering it as a standard markdown message so the UI doesn't crash |
| Backend Command Verification | Implement a Tauri command `check_adb_command_safety` in Rust to inspect command safety before launching via the shell |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
|       |            |

## Resources
- [AIChatPanel.tsx](file:///e:/tauri/admt/src/components/Console/AIChatPanel.tsx)
- [aiService.ts](file:///e:/tauri/admt/src/services/aiService.ts)
- [aiChatStore.ts](file:///e:/tauri/admt/src/stores/aiChatStore.ts)
- [LogsPanel.tsx](file:///e:/tauri/admt/src/components/Others/LogsPanel.tsx)

## Visual/Browser Findings
- Currently running on Windows Tauri environment.
- The UI is designed with `@fluentui/react-components` (v9).
