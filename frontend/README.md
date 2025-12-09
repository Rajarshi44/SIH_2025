# Jute Ribboning Machine Dashboard - Next.js

A modern, real-time IoT dashboard built with **Next.js 14** for monitoring and controlling a dual-motor jute ribboning machine powered by ESP32.

## 🚀 Features

### 🎮 Motor Control

- **Dual Motor Support**: Independent control for Motor A and Motor B
- **Real-time PWM Control**: Speed adjustment (0-255) with live sliders
- **Start/Stop Toggle**: Instant motor control with visual feedback
- **Live Metrics Display**: RPM, Voltage (V), Current (mA), Load %

### 🚨 Jam Detection

- **Automatic Detection**: Monitors current spikes and RPM drops
- **Visual Alerts**: Color-coded severity (warning/severe)
- **Audio Notifications**: Alert sound on jam events
- **Real-time Toast Notifications**: Dismissible alerts

### 📊 System Health Monitoring

- **WiFi Status**: Connection state indicator
- **Signal Strength**: RSSI with visual bars
- **System Uptime**: Live uptime counter
- **Packet Loss**: Network performance tracking

### 📝 Event Logging

- **Comprehensive Logs**: All motor events timestamped
- **Search & Filter**: Quick log retrieval
- **CSV Export**: Download logs for analysis
- **Event Types**: Start, Stop, Speed Change, Jam Detection

### ⚙️ Settings

- **API Configuration**: Customize REST and WebSocket endpoints
- **Jam Thresholds**: Adjustable current and RPM limits
- **Theme Support**: Dark mode (default)
- **Persistent Settings**: State management with Zustand

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS with custom dark theme
- **State Management**: Zustand
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Real-time**: WebSocket API

## 📦 Installation

\`\`\`bash

# Navigate to frontend directory

cd frontend

# Install dependencies

npm install

# Start development server

npm run dev
\`\`\`

The dashboard will be available at `http://localhost:3000`

## 🔧 Configuration

### API Endpoints

Update in Settings page or modify `src/store/useStore.ts`:

\`\`\`typescript
settings: {
apiEndpoint: 'http://192.168.1.100',
wsEndpoint: 'ws://192.168.1.100:81',
maxCurrentThreshold: 500,
rpmJamThreshold: 50,
theme: 'dark'
}
\`\`\`

### WebSocket Data Format

Expected WebSocket message structure:

\`\`\`json
{
"motorA": {
"rpm": 1234,
"voltage": 12.4,
"current": 350,
"status": "running"
},
"motorB": {
"rpm": 1180,
"voltage": 12.3,
"current": 340,
"status": "running"
},
"system": {
"wifi_rssi": -66,
"uptime": 52314
}
}
\`\`\`

## 📡 REST API Endpoints

The dashboard expects the following REST endpoints:

- `POST /motor/a/start` - Start Motor A
- `POST /motor/a/stop` - Stop Motor A
- `POST /motor/a/speed` - Set Motor A speed (body: `{value: 0-255}`)
- `POST /motor/b/start` - Start Motor B
- `POST /motor/b/stop` - Stop Motor B
- `POST /motor/b/speed` - Set Motor B speed (body: `{value: 0-255}`)

## 🏗️ Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

The optimized build will be in the `.next/` directory.

## 📁 Project Structure

\`\`\`
src/
├── app/ # Next.js App Router pages
│ ├── layout.tsx # Root layout
│ ├── page.tsx # Dashboard page
│ ├── logs/
│ │ └── page.tsx # Logs page
│ └── settings/
│ └── page.tsx # Settings page
├── components/ # React components
│ ├── UI.tsx # Reusable UI components
│ ├── MotorControl.tsx # Motor control panel
│ ├── JamDetector.tsx # Jam detection & alerts
│ ├── SystemHealth.tsx # System status panel
│ ├── Layout.tsx # Dashboard layout
│ └── WebSocketProvider.tsx
├── services/ # API services
│ └── api.ts # REST & WebSocket
└── store/ # State management
└── useStore.ts # Zustand store
\`\`\`

## 🎨 Customization

### Colors

Modify `tailwind.config.ts` to change theme colors:

\`\`\`typescript
colors: {
neon: '#B6FF00', // Primary accent color
dark: { // Background shades
900: '#0a0e1a',
800: '#121825',
700: '#1a2332',
600: '#232e3f',
}
}
\`\`\`

### Jam Detection Logic

Adjust thresholds in Settings or modify detection logic in `src/components/JamDetector.tsx`

## 🌐 Deployment

### Vercel (Recommended)

\`\`\`bash

# Install Vercel CLI

npm i -g vercel

# Deploy

vercel
\`\`\`

### Other Platforms

- Build: `npm run build`
- Start: `npm start`
- Ensure Node.js 18+ is available

## 📝 Environment Variables (Optional)

Create `.env.local`:

\`\`\`env
NEXT_PUBLIC_API_ENDPOINT=http://192.168.1.100
NEXT_PUBLIC_WS_ENDPOINT=ws://192.168.1.100:81
\`\`\`

## 🔐 ESP32 Backend Integration

For the ESP32 side, you'll need to:

1. **HTTP Server**: Implement REST endpoints for motor control
2. **WebSocket Server**: Stream real-time sensor data
3. **CORS**: Enable CORS for the Next.js app origin

Example ESP32 WebSocket (Arduino):
\`\`\`cpp
#include <WebSocketsServer.h>

WebSocketsServer webSocket = WebSocketsServer(81);

void sendSensorData() {
String json = "{\"motorA\":{\"rpm\":" + String(rpmA) +
",\"voltage\":" + String(voltageA) +
",\"current\":" + String(currentA) +
",\"status\":\"running\"}}";
webSocket.broadcastTXT(json);
}
\`\`\`

## 📄 License

MIT

## 💡 Features Roadmap

- [ ] Real-time charts with Chart.js
- [ ] Historical data export
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Machine learning for predictive maintenance

## 🤝 Support

For issues or questions, create an issue in the repository.

---

**Built with ❤️ using Next.js 14 + TypeScript + TailwindCSS**
