import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (socket) => {
  console.log("client connected");

  socket.on("message", (data) => {
    for (const client of wss.clients) {
      if (client !== socket && client.readyState === 1) {
        client.send(data.toString());
      }
    }
  });
});

console.log("WebSocket server on ws://localhost:8080");