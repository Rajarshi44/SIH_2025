# Motor Direction Control Update

## Changes Made

### 1. ESP32 Firmware (`sih.ino`)

Added three new command handlers in the `handleCommand()` function:

- **SET_DIRECTION**: Takes a direction parameter ("forward" or "reverse")
- **FORWARD**: Directly sets motor to forward direction
- **REVERSE**: Directly sets motor to reverse direction

All commands call the existing `setMotorDirection()` function and send acknowledgment back to the dashboard.

### 2. Frontend API Routes

Created three new API routes:

- `/api/command/set-direction` - Generic direction setter
- `/api/command/forward` - Set motor to forward
- `/api/command/reverse` - Set motor to reverse

### 3. Motor Service (`src/services/api.ts`)

Added three new methods to `motorService`:

```typescript
setDirection(motor: string, direction: "forward" | "reverse")
setForward(motor: string)
setReverse(motor: string)
```

### 4. Motor Control Component (`src/components/MotorControl.tsx`)

Updated the `handleDirectionToggle()` function to use the new `motorService.setDirection()` method instead of a direct fetch call.

## Usage

### From Dashboard UI

1. Click the direction button in the Motor Control card
2. The button shows the current direction (Forward/Reverse)
3. Direction can only be changed when the motor is stopped
4. Visual feedback with arrow icons (→ for forward, ← for reverse)

### From API

```javascript
// Set direction generically
POST /api/command/set-direction
{ "motor": "A", "direction": "forward" }

// Or use specific endpoints
POST /api/command/forward
{ "motor": "A" }

POST /api/command/reverse
{ "motor": "B" }
```

### ESP32 Commands

The ESP32 now responds to:

```json
{"type": "command", "command": "SET_DIRECTION", "motor": "A", "direction": "forward"}
{"type": "command", "command": "FORWARD", "motor": "A"}
{"type": "command", "command": "REVERSE", "motor": "B"}
```

## Testing

1. Upload the updated `sih.ino` to your ESP32
2. Start the Next.js frontend: `npm run dev`
3. Open the dashboard and toggle motor directions
4. Monitor the Serial Monitor to see direction change confirmations

## Notes

- Direction can only be changed when the motor is stopped (safety feature)
- The `setMotorDirection()` function updates the motor pins immediately if the motor is running
- Direction state is tracked locally in the UI component
- Each direction change is logged in the activity log
