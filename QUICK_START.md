# 🚀 QUICK START GUIDE

## Step 1: Start the Backend Server

```bash
cd frontend
npm run dev
```

✅ Server running at: **http://localhost:3000**  
✅ WebSocket at: **ws://localhost:3000/ws**

## Step 2: Open Dashboard

1. Open browser: **http://localhost:3000/dashboard**
2. Login with:
   - Username: `admin`
   - Password: `admin123`

## Step 3: Connect ESP32 (Optional)

### Update Arduino Code

Edit `esp32_websocket_client.ino`:

```cpp
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
const char* ws_host = "192.168.1.XXX";  // Your computer's IP
```

### Find Your Computer's IP

**Windows:**

```bash
ipconfig
```

Look for "IPv4 Address"

**Mac/Linux:**

```bash
ifconfig
```

Look for "inet"

### Upload to ESP32

1. Open Arduino IDE
2. Install libraries:
   - `WebSocketsClient` by Markus Sattler
   - `ArduinoJson` by Benoit Blanchon
   - `Adafruit INA219`
3. Select board: ESP32 Dev Module
4. Upload code

## Step 4: Test Real-time Communication

Once ESP32 is connected, you'll see:

- ✅ Real-time voltage/current readings
- ✅ RPM updates every second
- ✅ Motor status (running/idle)
- ✅ Control buttons working

Try clicking:

- **Toggle switch** to start/stop motors
- **Speed slider** to change PWM (0-100%)
- **Direction toggle** to reverse motors
- **Emergency Stop** to stop all motors

## 📊 What You Should See

### In Browser Console:

```
[WebSocket] Connected to dashboard
[WebSocket] Telemetry from esp32_1
```

### In ESP32 Serial Monitor:

```
WiFi connected!
[WS] Connected to server
Sending telemetry...
Motor A voltage: 12.5V, current: 1.2A
```

### In Server Terminal:

```
[Device] Connected: esp32_1 from 192.168.1.105
[Telemetry] Broadcast to 1 dashboard(s)
[Command] Forwarded to 1 device(s)
```

## 🐛 Troubleshooting

### "WebSocket connection failed"

- Check server is running (`npm run dev`)
- Verify you're logged in (JWT token required)
- Check browser console for errors

### "ESP32 not connecting"

- Verify WiFi credentials
- Check server IP address
- Ensure port 3000 is not blocked by firewall
- Check Serial Monitor for WiFi status

### "No telemetry data"

- Check ESP32 is connected (green indicator)
- Verify INA219 sensors are wired correctly
- Check Serial Monitor for sensor errors

### "Commands not working"

- Verify JWT token is valid (login again)
- Check WebSocket connection (should be green)
- Look for errors in browser console

## 🎯 Quick Test Without ESP32

You can test the dashboard without ESP32:

1. Dashboard will work in "demo mode"
2. Motor controls are functional
3. Charts will show placeholder data
4. All UI components are interactive

## 📝 Default Ports

- **HTTP Server**: 3000
- **WebSocket**: 3000 (same port, different protocol)
- **ESP32 connects to**: ws://YOUR_IP:3000/ws/device

## 🔑 Important URLs

| Service               | URL                              |
| --------------------- | -------------------------------- |
| Dashboard             | http://localhost:3000/dashboard  |
| Analytics             | http://localhost:3000/analytics  |
| Logs                  | http://localhost:3000/logs       |
| Settings              | http://localhost:3000/settings   |
| Login API             | http://localhost:3000/api/login  |
| WebSocket (Dashboard) | ws://localhost:3000/ws/dashboard |
| WebSocket (Device)    | ws://localhost:3000/ws/device    |

## ✅ Success Indicators

### ✅ Backend Running

```
[WebSocket] Server initialized on /ws
> Ready on http://localhost:3000
> WebSocket available on ws://localhost:3000/ws
```

### ✅ Dashboard Connected

- Green WiFi indicator in top-right
- "Connected to server" message in console
- Motor cards showing data

### ✅ ESP32 Connected

- Device list shows "esp32_1"
- Serial Monitor: "[WS] Connected to server"
- Dashboard receiving telemetry updates

## 🎉 You're All Set!

The system is now running with:

- ✅ Real-time WebSocket communication
- ✅ JWT authentication
- ✅ Motor control via dashboard
- ✅ Live telemetry streaming
- ✅ Automatic reconnection
- ✅ Error handling

Enjoy your Sohojpaat IoT Dashboard! 🎊
