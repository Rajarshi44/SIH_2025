const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

// Use ts-node to load TypeScript modules
require("ts-node").register({
  transpileOnly: true,
  project: "./tsconfig.server.json",
});

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize WebSocket server
  const { initializeWebSocketServer } = require("./server/websocket.ts");
  initializeWebSocketServer(server);

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket available on ws://${hostname}:${port}/ws`);
  });
});
