# ESP32 WebSocket Setup Guide

## ✅ Firmware Successfully Converted!

Your ESP32 firmware has been converted from Blynk to WebSocket communication.

## 📋 Required Libraries

Install these in Arduino IDE (Sketch → Include Library → Manage Libraries):

1. **WebSocketsClient** by Markus Sattler
   - Search: "WebSocketsClient"
   - Install: "WebSockets by Markus Sattler"

2. **ArduinoJson** by Benoit Blanchon
   - Search: "ArduinoJson"
   - Version: 6.x or 7.x

3. **Adafruit INA219** 
   - Search: "Adafruit INA219"
   - Also installs: Adafruit BusIO

4. **WiFi** (Built-in with ESP32)

## 🔧 Configuration Steps

### Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (e.g., `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```

### Step 2: Update ESP32 Code

Open `sih.ino` and modify these lines:

```cpp
// Line ~11-13
const char ssid[] = "Deepam";          // Keep your WiFi name
const char pass[] = "buddy1234";       // Keep your WiFi password

// Line ~16 - IMPORTANT: Change this!
const char* ws_host = "192.168.1.100"; // YOUR COMPUTER'S IP HERE!
```

### Step 3: Verify Arduino IDE Settings

1. **Board**: ESP32 Dev Module
2. **Upload Speed**: 115200
3. **Flash Frequency**: 80MHz
4. **Port**: Select your ESP32's COM port

### Step 4: Upload the Code

1. Connect ESP32 to computer via USB
2. Click "Upload" button (→)
3. Wait for "Done uploading" message

## 🧪 Testing

### 1. Open Serial Monitor

- Tools → Serial Monitor
- Set baud rate to **115200**

### 2. You Should See:

```
=== Setup begin ===

=== I2C Scanner ===
I2C device found at 0x40
I2C device found at 0x41
Found 2 device(s)
==================

PWM & motor pins initialized
Connecting to WiFi........
✅ WiFi connected!
IP address: 192.168.1.105
Connecting to WebSocket server...
[WS] ✅ Connected to server!
📊 A: 12.50V 120mA | B: 12.45V 85mA
```

### 3. Common Issues

**Problem: "WiFi connection failed"**
- Check WiFi name and password
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Move ESP32 closer to router

**Problem: "I2C device NOT found"**
- Check INA219 wiring (SDA=21, SCL=22)
- Verify I2C addresses (0x40, 0x41)
- Check power supply to INA219

**Problem: "WebSocket not connecting"**
- Verify server IP address
- Ensure backend server is running (`npm run dev`)
- Check firewall settings
- Verify both devices on same network

## 🎯 Pin Connections (Same as Blynk Version)

### Motor Driver (L298N)
```
Motor A:
  ENA → GPIO 25 (PWM)
  IN1 → GPIO 26
  IN2 → GPIO 27

Motor B:
  ENB → GPIO 33 (PWM)
  IN3 → GPIO 32
  IN4 → GPIO 35
```

### Current Sensors (INA219)
```
Motor A Sensor (0x40):
  VCC → 3.3V
  GND → GND
  SDA → GPIO 21
  SCL → GPIO 22
  VIN+ → Motor A +
  VIN- → Motor A -

Motor B Sensor (0x41):
  VCC → 3.3V
  GND → GND
  SDA → GPIO 21
  SCL → GPIO 22
  VIN+ → Motor B +
  VIN- → Motor B -
```

## 📊 Message Format

### Commands Received (from Dashboard)

**START Motor:**
```json
{
  "type": "command",
  "command": "START",
  "motor": "A"
}
```

**STOP Motor:**
```json
{
  "type": "command",
  "command": "STOP",
  "motor": "B"
}
```

**SET_SPEED (0-100%):**
```json
{
  "type": "command",
  "command": "SET_SPEED",
  "motor": "A",
  "value": 75
}
```

### Telemetry Sent (to Dashboard)

Sent every **500ms**:
```json
{
  "type": "telemetry",
  "motorA": {
    "voltage": 12.5,
    "current": 1.2,
    "rpm": 1500,
    "status": "running"
  },
  "motorB": {
    "voltage": 12.4,
    "current": 0.8,
    "rpm": 1450,
    "status": "running"
  },
  "isJammed": false,
  "timestamp": "2025-12-10T10:30:45.000Z"
}
```

## 🚀 Quick Test Sequence

1. **Start Backend Server:**
   ```bash
   cd frontend
   npm run dev
   ```
   Server should show: `[WebSocket] Server initialized on /ws`

2. **Upload ESP32 Code:**
   - Arduino IDE → Upload
   - Open Serial Monitor (115200 baud)

3. **Verify Connection:**
   - ESP32 Serial: `[WS] ✅ Connected to server!`
   - Server Terminal: `[Device] Connected: esp32_1 from 192.168.1.105`

4. **Test from Dashboard:**
   - Open http://localhost:3000/dashboard
   - Login: admin / admin123
   - Click motor toggle switch
   - Watch Serial Monitor for `📥 Command: START, Motor: A`

## 🔍 Debugging Tips

### Check WebSocket Connection
```
Serial Monitor should show:
- WiFi IP address
- [WS] ✅ Connected to server!
- 📊 Telemetry data every 500ms
```

### Check Server Logs
```
Terminal should show:
- [Device] Registered: esp32_1 from 192.168.1.105
- [Telemetry] Broadcast to 1 dashboard(s)
- [Command] Forwarded to 1 device(s)
```

### Check Dashboard
```
Browser console should show:
- [WebSocket] Telemetry from esp32_1
- Real-time voltage/current updates
- Motor status changes
```

## ⚙️ Advanced Configuration

### Change Telemetry Rate
```cpp
// Line ~56
const unsigned long telemetryInterval = 500;  // Change to 1000 for 1 second
```

### Adjust Jam Detection
```cpp
// Line ~60
const float JAM_CURRENT_THRESHOLD = 1200.0;  // mA (increase if false positives)
```

### Change Default Motor Speed
```cpp
// Line ~42-43
int motorASpeed = 128;  // 0-255 (128 = 50% speed)
int motorBSpeed = 128;
```

## ✅ Success Indicators

### ✅ WiFi Connected
- Serial: "✅ WiFi connected!"
- Serial: "IP address: 192.168.1.XXX"

### ✅ WebSocket Connected
- Serial: "[WS] ✅ Connected to server!"
- Serial: "📊 Telemetry data..."

### ✅ Motors Responding
- Serial: "📥 Command: START, Motor: A"
- Serial: "Motor A STARTED (speed=128, forward=1)"

### ✅ Dashboard Receiving Data
- Green WiFi indicator
- Real-time voltage/current updates
- RPM changing when motors run

## 🎉 You're Ready!

Your ESP32 is now:
- ✅ Connected to WiFi
- ✅ Communicating via WebSocket
- ✅ Sending telemetry every 500ms
- ✅ Receiving commands from dashboard
- ✅ Detecting motor jams
- ✅ Reporting status updates

Enjoy your real-time IoT dashboard! 🚀
