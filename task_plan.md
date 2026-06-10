# Task Plan: AI Copilot & Diagnostics for ADMT

## Goal
Implement a fully functional AI Copilot & Diagnostics system in ADMT that supports dual-mode switching (Agent Mode vs Chat Mode), structured command parsing & execution with safety gates, and smart Logcat crash diagnostics.

## Current Phase
Phase 5: Testing & Verification

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand user intent (Agent + Chat modes, Logcat diagnosis, free API integration)
- [x] Identify constraints and requirements
- [x] Explore current codebase structure (`AIChatPanel.tsx`, `aiService.ts`, `aiChatStore.ts`, `LogsPanel.tsx`)
- [x] Document discoveries in `findings.md`
- **Status:** complete

### Phase 2: Design & Planning
- [x] Define JSON communication schema for Agent Mode
- [x] Define command blacklist and safety verification rules in Rust backend
- [x] Define UX design for command confirmation card and mode toggle in React
- [x] Write detailed design to `implementation_plan.md` and get user approval
- **Status:** complete

### Phase 3: Backend Safety & API Integration (Rust / Tauri)
- [x] Implement command safety checker (blacklist, command sanitization) in Rust backend (`ai.rs`)
- [x] Register new command `verify_command_safety` in Tauri handler (`lib.rs`, `mod.rs`)
- [x] Implement API gateway system instruction routing in `aiService.ts` for Google Gemini and other models
- **Status:** complete

### Phase 4: Frontend UI Components (React + Fluent UI)
- [x] Add `isAgentMode` to `useAIChatStore.ts` and handle cross-tab storage syncing
- [x] Implement Mode Toggle in `AIChatPanel.tsx` header
- [x] Implement Structured JSON Parser & Command execution card with Checkboxes, warning banners, and local console execution log output
- [x] Integrate quick Logcat crash diagnosis button in `AIChatPanel.tsx` (in input area and empty welcome state) to fetch and diagnose Android device crashes
- **Status:** complete

### Phase 5: Testing & Verification
- [ ] Test Chat mode Q&A
- [ ] Test Agent mode with safe ADB commands (e.g., list packages, getprop)
- [ ] Test Agent mode safety validation with blocked commands (e.g., rm -rf, raw dd)
- [ ] Test Logcat crash diagnosis with mock crash dumps
- **Status:** in_progress

## Key Questions
1. How does the "AI Diagnostic" button in LogsPanel communicate with the AIChatPanel? (Answer: Users can click the existing AI explain logs button in LogsPanel, which syncs the prompt. For Android device Logcat, we added a dedicated quick-fetch button directly in the AI Chat Panel for a much cleaner, one-stop device log diagnostic experience.)
2. Should we support local models in Agent mode? (Yes, Qwen 2.5 and local models are fully supported as long as they adhere to the JSON output formatting instructions in our system prompt.)

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use JSON Schema for Agent Mode | Ensures client-side code can parse thoughts, commands, and warning levels instead of trying to extract markdown regex |
| Run ADB Commands via Backend Command Checker | Centralizes safety checks in Rust instead of relying entirely on frontend JavaScript, preventing execution bypass |
| Logcat diagnosis via adb command | Direct adb logcat fetching allows real-time analysis of physical devices on demand |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| TS2339 selectedDevice brand/model check | 1 | Accessed brand and model fields via `selectedDevice.properties?.brand` and `selectedDevice.properties?.model` |
