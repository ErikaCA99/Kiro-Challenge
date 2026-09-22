# Implementation Plan: Pomodoro Timer

## Overview

Refine and complete the existing partial Pomodoro Timer implementation by introducing a `useTimer` custom hook, a `NotificationService`, an updated `Timer` component, a new `ControlBar` component, and updating `Header` and `HomeScreen` to wire everything together. Property-based and unit tests use `fast-check` and Jest.

## Tasks

- [ ] 1. Create `NotificationService` and `formatTime` utility
  - [ ] 1.1 Create `services/notification-service.ts` with the `INotificationService` interface and `NotificationService` implementation
    - Use `expo-av` `Audio.Sound.createAsync` to play `assets/audio/click.mp3`
    - Unload sound after playback via `setOnPlaybackStatusUpdate`
    - Catch any error and fall back to `Alert.alert('Session Complete', …)`
    - _Requirements: 6.1, 6.4_
  - [ ] 1.2 Create `utils/format-time.ts` exporting a pure `formatTime(seconds: number): string` function
    - Zero-pad both minutes and seconds to two digits
    - Return `"MM:SS"` format
    - _Requirements: 5.3, 5.4_
  - [ ]* 1.3 Write property test for `formatTime` (Property 1)
    - **Property 1: Time formatting round-trip**
    - **Validates: Requirements 5.3, 5.4**
    - File: `utils/__tests__/format-time.properties.test.ts`
    - Use `fc.integer({ min: 0, max: 5999 })` → format → parse → assert equals original
    - Tag: `// Feature: pomodoro-timer, Property 1: time formatting round-trip`
  - [ ]* 1.4 Write unit tests for `formatTime`
    - Test 1500 → `"25:00"`, 0 → `"00:00"`, 545 → `"09:05"`, 30 → `"00:30"`
    - File: `utils/__tests__/format-time.test.ts`
    - _Requirements: 5.3, 5.4_

- [ ] 2. Implement `useTimer` custom hook
  - [ ] 2.1 Create `hooks/use-timer.ts` with `TimerMode`, `TimerState`, `TimerActions` types and `MODE_DURATIONS` map
    - Define `TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak'`
    - Define `MODE_DURATIONS` with values `{ pomodoro: 1500, shortBreak: 300, longBreak: 900 }`
    - Initialize `timeRemaining = 1500`, `isActive = false`, `isComplete = false`, `mode = 'pomodoro'`
    - _Requirements: 1.1, 1.3, 7.1, 7.2_
  - [ ] 2.2 Implement `start()` action in `useTimer`
    - No-op guard when `timeRemaining === 0` or `isActive === true`
    - Sets `isActive = true` and `isComplete = false`
    - _Requirements: 2.1, 2.5, 3.1_
  - [ ] 2.3 Implement `pause()` action in `useTimer`
    - No-op when `isActive === false`
    - Sets `isActive = false`, preserves `timeRemaining`
    - _Requirements: 2.2, 3.1_
  - [ ] 2.4 Implement `reset()` action in `useTimer`
    - Sets `timeRemaining = MODE_DURATIONS[mode]`, `isActive = false`, `isComplete = false`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ] 2.5 Implement `setMode()` action and `useEffect` countdown interval in `useTimer`
    - `setMode(m)` calls internal reset with new mode's duration, sets `mode = m`
    - `useEffect` on `[isActive]`: start `setInterval` at 1000 ms when `isActive === true`
    - On each tick: decrement `timeRemaining`; when it reaches 0 set `isActive = false`, `isComplete = true`, call `NotificationService.notify()`
    - Cleanup `clearInterval` on every effect re-run and unmount
    - _Requirements: 2.1, 6.1, 6.2, 7.3, 7.4, 7.5_
  - [ ]* 2.6 Write property test for `start()` no-op at zero (Property 3)
    - **Property 3: Start is a no-op when time is zero**
    - **Validates: Requirements 2.5, 3.3**
    - File: `hooks/__tests__/use-timer.properties.test.ts`
    - Tag: `// Feature: pomodoro-timer, Property 3: start is a no-op when time is zero`
  - [ ]* 2.7 Write property test for countdown decrement (Property 2)
    - **Property 2: Countdown decrements by exactly 1 per tick**
    - **Validates: Requirements 2.1, 5.1**
    - `fc.integer({ min: 1, max: 5999 })` → simulate one tick → assert `result === input - 1`
    - File: `hooks/__tests__/use-timer.properties.test.ts`
    - Tag: `// Feature: pomodoro-timer, Property 2: countdown decrements by exactly 1 per tick`
  - [ ]* 2.8 Write property test for `reset()` (Property 4)
    - **Property 4: Reset always restores full session duration**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - `fc.record({ timeRemaining: fc.integer({ min: 0, max: 5999 }), isActive: fc.boolean(), mode: fc.constantFrom('pomodoro', 'shortBreak', 'longBreak') })` → call `reset()` → assert `timeRemaining === MODE_DURATIONS[mode] && !isActive`
    - Tag: `// Feature: pomodoro-timer, Property 4: reset always restores full session duration`
  - [ ]* 2.9 Write property test for `pause()` (Property 5)
    - **Property 5: Pause preserves remaining time**
    - **Validates: Requirements 2.2, 3.1**
    - `fc.integer({ min: 1, max: 5999 })` as `timeRemaining` with `isActive = true` → call `pause()` → assert `!isActive && timeRemaining === original`
    - Tag: `// Feature: pomodoro-timer, Property 5: pause preserves remaining time`
  - [ ]* 2.10 Write property test for `setMode()` (Property 6)
    - **Property 6: Mode change resets to correct duration**
    - **Validates: Requirements 1.1, 4.1**
    - `fc.constantFrom('pomodoro', 'shortBreak', 'longBreak')` → call `setMode(mode)` from any state → assert `timeRemaining === MODE_DURATIONS[mode] && !isActive`
    - Tag: `// Feature: pomodoro-timer, Property 6: mode change resets to correct duration`
  - [ ]* 2.11 Write property test for session completion notification (Property 7)
    - **Property 7: Session completion triggers notification exactly once**
    - **Validates: Requirements 6.1, 6.2**
    - Simulate full countdown from any `timeRemaining > 0` to 0 → assert `notifyMock` called exactly once
    - Tag: `// Feature: pomodoro-timer, Property 7: session completion triggers notification exactly once`
  - [ ]* 2.12 Write unit tests for `useTimer`
    - Initializes to 1500 s, inactive, not complete
    - `start()` sets `isActive = true`; `pause()` sets `isActive = false`, preserves time
    - `reset()` restores full duration, `isActive = false`
    - `start()` is no-op when `timeRemaining === 0`
    - `setMode('shortBreak')` sets `timeRemaining = 300`
    - Session completion invokes `NotificationService.notify` mock exactly once
    - File: `hooks/__tests__/use-timer.test.ts`
    - _Requirements: 1.1–1.3, 2.1–2.5, 3.1–3.3, 4.1–4.4, 6.1–6.2, 7.1–7.5_

- [ ] 3. Checkpoint — ensure hook and service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Update UI components
  - [ ] 4.1 Update `components/Timer.tsx` to accept `timeRemaining` and `isComplete` props
    - Use `formatTime` from `utils/format-time.ts` instead of inline formatting
    - Show `"00:00"` and a "Session complete" label when `isComplete === true`
    - Remove internal formatting logic
    - _Requirements: 5.3, 5.4, 5.5, 6.3_
  - [ ] 4.2 Update `components/Header.tsx` to accept `mode: TimerMode` and `onModeChange: (mode: TimerMode) => void` props
    - Replace index-based `currentTime`/`setCurrentTime` props with typed `TimerMode`
    - Map `TimerMode` values to display labels (`'pomodoro'` → `"Pomodoro"`, etc.)
    - _Requirements: 1.1_
  - [ ] 4.3 Create `components/ControlBar.tsx` with Start/Pause toggle and Reset button
    - Props: `isActive`, `isComplete`, `onStartPause`, `onReset`
    - Start/Pause button disabled (no-op) when `isComplete === true`
    - Button label switches between `"START"` and `"PAUSE"` based on `isActive`
    - _Requirements: 2.3, 2.4, 4.1–4.3_
  - [ ]* 4.4 Write unit tests for `Timer` component
    - Renders `"25:00"` for 1500, `"00:00"` for 0, `"09:05"` for 545, `"00:30"` for 30
    - Shows "Session complete" label when `isComplete === true`
    - File: `components/__tests__/Timer.test.tsx`
    - _Requirements: 5.3, 5.4, 6.3_
  - [ ]* 4.5 Write unit tests for `ControlBar` component
    - Shows "START" when `isActive = false`, "PAUSE" when `isActive = true`
    - Start/Pause button is disabled when `isComplete = true`
    - Reset button always visible
    - File: `components/__tests__/ControlBar.test.tsx`
    - _Requirements: 2.3, 2.4, 4.1–4.3_

- [ ] 5. Wire everything together in `HomeScreen`
  - [ ] 5.1 Update `app/(tabs)/index.tsx` to use `useTimer` and updated components
    - Replace existing state variables and `useEffect` interval with `useTimer()`
    - Replace raw `TouchableOpacity` start/stop button with `<ControlBar>`
    - Pass `timeRemaining` and `isComplete` to `<Timer>`
    - Pass `mode` and `onModeChange` (mapped to `setMode`) to `<Header>`
    - Remove inline `playSound` function (now handled by `NotificationService`)
    - _Requirements: 1.1–1.3, 2.1–2.5, 3.1–3.3, 4.1–4.4, 6.1–6.4, 7.1–7.5_
  - [ ]* 5.2 Write integration tests for `HomeScreen`
    - Renders with `"25:00"` visible and Start button visible on load
    - After pressing Start and advancing fake timers 1 s, display shows `"24:59"`; pressing Pause holds display
    - Pressing Reset from any state restores `"25:00"` and Start button
    - Advancing fake timers 1500 s from Start calls `NotificationService.notify` mock once and shows `"25:00"`
    - File: `app/__tests__/HomeScreen.integration.test.tsx`
    - _Requirements: 1.1–1.3, 2.1–2.5, 4.1–4.3, 6.1–6.3_

- [ ] 6. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with a minimum of 100 iterations per property
- Unit tests use Jest + `@testing-library/react-native`
- Use `jest.useFakeTimers()` for all timer-related tests
- Mock `expo-av` with `jest.mock('expo-av')` to prevent real audio in tests
- The `fast-check` package must be added as a dev dependency before running property tests: `npx expo install --dev fast-check`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.2", "2.1"] },
    { "id": 1, "tasks": ["1.1", "1.3", "1.4", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["2.5"] },
    { "id": 3, "tasks": ["2.6", "2.7", "2.8", "2.9", "2.10", "2.11", "2.12", "4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "4.5", "5.1"] },
    { "id": 5, "tasks": ["5.2"] }
  ]
}
```
