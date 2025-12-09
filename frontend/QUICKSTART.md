# Quick Start Guide

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

Visit: http://localhost:3000

## Build

```bash
npm run build
npm start
```

## Key Changes from React to Next.js

1. **App Router**: Using Next.js 14 App Router (not Pages Router)
2. **Client Components**: All interactive components use `'use client'` directive
3. **TypeScript**: Full TypeScript support with type safety
4. **File-based Routing**:
   - `/` → Dashboard
   - `/logs` → Logs page
   - `/settings` → Settings page
5. **API Proxy**: Configured in `next.config.mjs` for ESP32 communication

## ESP32 Configuration

Make sure your ESP32 is:

- Connected to same network
- Running HTTP server on port 80
- Running WebSocket server on port 81
- CORS enabled for your Next.js origin

## Troubleshooting

### Port already in use

```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### WebSocket connection failed

- Check ESP32 IP address in Settings
- Ensure WebSocket server is running on ESP32
- Check firewall settings
