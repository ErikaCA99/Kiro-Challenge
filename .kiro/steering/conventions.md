# Pomodoro App — Development Conventions

These conventions apply to all development in this React Native (Expo) project.
Follow them consistently to keep the codebase readable, maintainable, and easy to extend.

---

## Language and Types

**Always use TypeScript** for new files and features. Use `.ts` for pure logic and `.tsx` for components.

Define explicit prop types above each component using a `type` alias — not `interface`, and not inline.

```typescript
// ✅ Correct
type TimerProps = {
  timeRemaining: number;
  isComplete: boolean;
};

export default function Timer({ timeRemaining, isComplete }: TimerProps) { ... }

// ❌ Avoid
export default function Timer({ timeRemaining, isComplete }: { timeRemaining: number; isComplete: boolean }) { ... }
```

Avoid `any`. Use `unknown` with a type guard when the shape is genuinely uncertain.

---

## Components

**Use functional components exclusively.** No class components.

```typescript
// ✅ Correct
export default function ControlBar({ isActive, onStartPause, onReset }: ControlBarProps) {
  return ( ... );
}

// ❌ Avoid
export default class ControlBar extends React.Component { ... }
```

**Keep components small and single-responsibility.** A component should do one thing.
If a component handles both data fetching/logic and rendering, split it.

| File | Responsibility |
|------|---------------|
| `components/Timer.tsx` | Display remaining time in MM:SS — no state |
| `components/ControlBar.tsx` | Render Start/Pause and Reset buttons |
| `components/Header.tsx` | Render session-type selector |
| `hooks/use-timer.ts` | Own all countdown logic and state |
| `app/(tabs)/index.tsx` | Compose components, own no direct timer logic |

**Use `default export`** for components. Use named exports for types, constants, and utilities.

---

## React Hooks

**Use `useState` and `useEffect`** for state and side effects. Do not reach for external state libraries.

```typescript
// ✅ Correct — useState for simple values
const [isActive, setIsActive] = useState(false);
const [timeRemaining, setTimeRemaining] = useState(1500);

// ✅ Correct — useEffect for intervals, always return cleanup
useEffect(() => {
  if (!isActive) return;
  const id = setInterval(() => {
    setTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
  }, 1000);
  return () => clearInterval(id);
}, [isActive]);
```

**Always return a cleanup function from `useEffect`** when it creates a subscription, interval, or timeout.
This prevents memory leaks when a component unmounts or a dependency changes.

**Extract reusable hook logic into custom hooks** in the `hooks/` directory.
Custom hook files use kebab-case: `hooks/use-timer.ts`, `hooks/use-color-scheme.ts`.
Custom hook functions are prefixed with `use`: `useTimer`, `useColorScheme`.

---

## Project Structure and Naming

Follow the existing layout. Do not invent new top-level directories without a clear reason.

```
app/          → Expo Router screens and layouts (_layout.tsx, (tabs)/index.tsx)
components/   → Reusable UI components (Timer.tsx, Header.tsx, ControlBar.tsx)
components/ui/→ Generic low-level primitives (icon-symbol, collapsible)
hooks/        → Custom React hooks (use-timer.ts, use-color-scheme.ts)
constants/    → Shared constants (theme.ts with Colors, Fonts)
services/     → Non-UI logic with external dependencies (notification-service.ts)
utils/        → Pure utility functions (format-time.ts)
assets/       → Static assets: images, audio
```

**File and directory naming:**
- Components: `PascalCase.tsx` — e.g., `Timer.tsx`, `ControlBar.tsx`
- Hooks: `kebab-case.ts` — e.g., `use-timer.ts`
- Utilities and services: `kebab-case.ts` — e.g., `format-time.ts`, `notification-service.ts`
- Constants: `kebab-case.ts` — e.g., `theme.ts`
- Test files: placed in `__tests__/` inside the same directory as the file under test

---

## Styling

**Use `StyleSheet.create`** for all styles. Do not use inline style objects for anything beyond one-off layout overrides, and avoid spreading magic numbers throughout JSX.

```typescript
// ✅ Correct
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
});

// ❌ Avoid
<TouchableOpacity style={{ backgroundColor: '#333', padding: 15, borderRadius: 15 }}>
```

Reference shared colors from `constants/theme.ts` (`Colors.light`, `Colors.dark`) rather than hardcoding hex values in components.

---

## Accessibility

**Every interactive element must have an `accessibilityLabel`** that describes its action.
Use `accessibilityRole` for buttons, links, and other semantic elements.

```typescript
// ✅ Correct
<TouchableOpacity
  onPress={onStartPause}
  accessibilityRole="button"
  accessibilityLabel={isActive ? 'Pause timer' : 'Start timer'}
>
  <Text>{isActive ? 'PAUSE' : 'START'}</Text>
</TouchableOpacity>
```

Maintain sufficient color contrast for text and interactive elements.
Use `accessibilityState={{ disabled: true }}` on controls that are not interactive.

---

## Dependencies

**Prefer libraries already installed in the project** before reaching for something new.

| Need | Use |
|------|-----|
| Audio playback | `expo-av` (already installed) |
| Icons | `@expo/vector-icons` (already installed) |
| Haptic feedback | `expo-haptics` (already installed) |
| Animations | `react-native-reanimated` (already installed) |
| Navigation | `expo-router` + `@react-navigation/*` (already installed) |
| Safe area insets | `react-native-safe-area-context` (already installed) |

**Do not add a new dependency** unless it solves a problem the existing stack genuinely cannot handle.
If a new dependency is necessary, justify it explicitly in the PR/commit description and pin it to an exact version.

---

## Code Quality

**Keep functions short and focused.** If a function needs a comment to explain what it does, consider whether it can be renamed or split instead.

**Name things clearly.** Prefer `timeRemaining` over `time`, `isActive` over `flag`, `handleStartPause` over `handler`.

**Avoid unnecessary complexity.** Do not abstract prematurely. Add abstraction when duplication appears at least twice, not in anticipation of it.

```typescript
// ✅ Clear and direct
function formatTime(seconds: number): string {
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

// ❌ Over-engineered for this use case
function formatTimeUnit(value: number, unit: 'minutes' | 'seconds'): string { ... }
function buildTimeString(parts: string[], separator: string): string { ... }
```

**Async functions that can fail must handle errors.** Use `try/catch` around `expo-av` calls and other async operations that depend on device capabilities.

```typescript
// ✅ Correct
async function notify() {
  try {
    const { sound } = await Audio.Sound.createAsync(require('../assets/audio/click.mp3'));
    await sound.playAsync();
  } catch {
    Alert.alert('Session Complete', 'Your 25-minute session has ended.');
  }
}
```
