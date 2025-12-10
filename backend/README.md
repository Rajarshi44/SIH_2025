# Sohojpaat Backend - WebSocket Real-time Communication

This backend implements a real-time WebSocket server for the Sohojpaat Jute Ribboning Machine Dashboard.

## Architecture

```
Dashboard (Browser) ←→ WebSocket ←→ Next.js Server ←→ WebSocket ←→ ESP32
```

## Features

✅ **Dual WebSocket Channels**
- `/ws/device` - ESP32 connections
- `/ws/dashboard` - Browser dashboard connections

✅ **Authentication**
- JWT tokens for dashboard users
- Static token for ESP32 devices

✅ **Real-time Communication**
- Commands: START, STOP, SET_SPEED, RESET
- Telemetry: Motor stats (voltage, current, RPM, status)
- Status updates and ACK messages

✅ **Heartbeat Mechanism**
- Ping/pong every 25 seconds
- Automatic reconnection
- Dead connection cleanup

## Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
JWT_SECRET=your-secret-key-here
DEVICE_TOKEN=your-device-token-here
PORT=3000
```

### 3. Run Development Server

```bash
npm run dev
```

The server will start on:
- HTTP: `http://localhost:3000`
- WebSocket: `ws://localhost:3000/ws`

## API Endpoints

### Authentication

**POST /api/login**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "userId": "user_1",
    "username": "admin"
  }
}
```

Demo credentials:
- Username: `admin`, Password: `admin123`
- Username: `operator`, Password: `operator123`

### Motor Commands

**POST /api/command/start**
```json
{
  "motor": "A" // or "B"
}
```

**POST /api/command/stop**
```json
{
  "motor": "A"
}
```

**POST /api/command/set-speed**
```json
{
  "motor": "A",
  "speed": 75 // 0-100
}
```

All command endpoints require `Authorization: Bearer <token>` header.

### Telemetry

**GET /api/telemetry/latest**

Returns current connection statistics.

## WebSocket Communication

### ESP32 Connection

Connect to: `ws://SERVER_IP:3000/ws/device?device_id=esp32_1&token=YOUR_DEVICE_TOKEN`

#### Send Telemetry (ESP32 → Server → Dashboard)

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
  "temperature": 35.5,
  "vibration": 0.02,
  "isJammed": false,
  "timestamp": "2025-12-10T10:30:00Z"
}
```

#### Receive Commands (Dashboard → Server → ESP32)

```json
{
  "type": "command",
  "command": "START", // START | STOP | SET_SPEED | RESET
  "motor": "A",
  "value": 75, // only for SET_SPEED
  "timestamp": "2025-12-10T10:30:00Z"
}
```

#### Send Status Updates

```json
{
  "type": "status",
  "state": "RUNNING", // IDLE | RUNNING | ERROR
  "message": "Motor A started successfully"
}
```

#### Send ACK

```json
{
  "type": "ack",
  "message": "Command executed",
  "success": true
}
```

### Dashboard Connection

Connect to: `ws://SERVER_IP:3000/ws/dashboard?token=JWT_TOKEN`

Dashboard receives:
- Real-time telemetry from ESP32
- Status updates
- Command acknowledgments

Dashboard can send:
- Motor commands (same format as REST API)
- Status requests

## ESP32 Arduino Code Integration

### WiFi + WebSocket Connection

```cpp
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* ws_host = "192.168.1.100"; // Your server IP
const uint16_t ws_port = 3000;
const char* ws_path = "/ws/device?device_id=esp32_1&token=esp32-device-token-xyz";

WebSocketsClient webSocket;

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
  
  // Connect to WebSocket
  webSocket.begin(ws_host, ws_port, ws_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(3000);
}

void loop() {
  webSocket.loop();
  
  // Send telemetry every 1 second
  static unsigned long lastTelemetry = 0;
  if (millis() - lastTelemetry > 1000) {
    sendTelemetry();
    lastTelemetry = millis();
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected");
      break;
    case WStype_CONNECTED:
      Serial.println("[WS] Connected");
      break;
    case WStype_TEXT:
      handleCommand((char*)payload);
      break;
  }
}

void sendTelemetry() {
  StaticJsonDocument<512> doc;
  doc["type"] = "telemetry";
  
  JsonObject motorA = doc.createNestedObject("motorA");
  motorA["voltage"] = readMotorVoltage(MOTOR_A);
  motorA["current"] = readMotorCurrent(MOTOR_A);
  motorA["rpm"] = readMotorRPM(MOTOR_A);
  motorA["status"] = getMotorStatus(MOTOR_A);
  
  JsonObject motorB = doc.createNestedObject("motorB");
  motorB["voltage"] = readMotorVoltage(MOTOR_B);
  motorB["current"] = readMotorCurrent(MOTOR_B);
  motorB["rpm"] = readMotorRPM(MOTOR_B);
  motorB["status"] = getMotorStatus(MOTOR_B);
  
  doc["timestamp"] = getISOTimestamp();
  
  String json;
  serializeJson(doc, json);
  webSocket.sendTXT(json);
}

void handleCommand(char* payload) {
  StaticJsonDocument<256> doc;
  deserializeJson(doc, payload);
  
  if (doc["type"] == "command") {
    String command = doc["command"];
    String motor = doc["motor"];
    int value = doc["value"] | 0;
    
    if (command == "START") {
      startMotor(motor == "A" ? MOTOR_A : MOTOR_B);
    } else if (command == "STOP") {
      stopMotor(motor == "A" ? MOTOR_A : MOTOR_B);
    } else if (command == "SET_SPEED") {
      setMotorSpeed(motor == "A" ? MOTOR_A : MOTOR_B, value);
    }
    
    // Send ACK
    sendAck("Command executed: " + command);
  }
}

void sendAck(String message) {
  StaticJsonDocument<128> doc;
  doc["type"] = "ack";
  doc["message"] = message;
  doc["success"] = true;
  
  String json;
  serializeJson(doc, json);
  webSocket.sendTXT(json);
}
```

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

Set these in production:
- `JWT_SECRET` - Strong secret key for JWT
- `DEVICE_TOKEN` - Strong token for ESP32
- `PORT` - Server port (default: 3000)
- `NODE_ENV=production`

## Performance Targets

✅ Latency: <80ms round-trip  
✅ Supports: 1 ESP32 + 10 concurrent dashboards  
✅ Auto-reconnection for unstable WiFi  
✅ No duplicate WebSocket servers in dev mode

## Troubleshooting

### WebSocket connection fails
- Check firewall settings
- Verify correct IP address
- Ensure port 3000 is open
- Check JWT token validity

### ESP32 not sending data
- Verify device token matches `.env.local`
- Check WiFi connection
- Verify WebSocket URL format
- Check Serial monitor for errors

### Dashboard not receiving updates
- Verify JWT token in localStorage
- Check browser console for WebSocket errors
- Ensure WebSocket connection is established
- Check Network tab in DevTools

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Server                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │             WebSocket Server (/ws)                      │ │
│  │  ┌──────────────────┐    ┌──────────────────┐         │ │
│  │  │  /ws/device      │    │  /ws/dashboard   │         │ │
│  │  │  (ESP32)         │    │  (Browser)       │         │ │
│  │  └──────────────────┘    └──────────────────┘         │ │
│  │           ▲                       ▲                     │ │
│  │           │                       │                     │ │
│  │           ▼                       ▼                     │ │
│  │  ┌────────────────────────────────────────┐           │ │
│  │  │      Connection Manager                 │           │ │
│  │  │  - Track devices & dashboards          │           │ │
│  │  │  - Route messages                      │           │ │
│  │  │  - Heartbeat monitoring                │           │ │
│  │  └────────────────────────────────────────┘           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  REST API Routes                        │ │
│  │  /api/login        - Authentication                     │ │
│  │  /api/command/*    - Motor commands                     │ │
│  │  /api/telemetry/*  - Data queries                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
           ▲                                    ▲
           │                                    │
           ▼                                    ▼
    ┌────────────┐                      ┌─────────────┐
    │   ESP32    │                      │  Dashboard  │
    │  Device    │                      │  (Browser)  │
    └────────────┘                      └─────────────┘
```

## License

MIT
