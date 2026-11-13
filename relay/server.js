// Bubble Bliss relay: passes game messages between a room's host and its friends when
// their browsers can't connect to each other directly (strict home routers, CGNAT, etc).
// Runs on anything with Node.js, including an old Android phone in Termux.
//
// Protocol (WebSocket, text frames):
//   host connects:   /?room=CODE&role=host
//   friend connects: /?room=CODE&role=client
//   friend -> relay:  <payload>                     relay -> host:   <friendId>|<payload>
//   host -> relay:    <friendId>|<payload>          relay -> friend: <payload>
//   relay -> host when a friend arrives/leaves:  <friendId>|{"t":"_join"} / <friendId>|{"t":"_leave"}
'use strict';
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 8787;
const MAX_FRIENDS = 7;          // the game allows host + 7
const MAX_MESSAGE = 64 * 1024;  // game messages are a few KB; anything bigger is refused
const rooms = new Map();        // code -> { host, clients: Map(id -> ws) }

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain', 'access-control-allow-origin': '*' });
  res.end(`Bubble Bliss relay is running. Rooms: ${rooms.size}\n`);
});
const wss = new WebSocketServer({ server, maxPayload: MAX_MESSAGE });

const validCode = c => typeof c === 'string' && /^[A-Z0-9]{5}$/.test(c);
const newId = () => 'r' + Math.random().toString(36).slice(2, 10);

wss.on('connection', (ws, req) => {
  const q = new URL(req.url, 'http://x').searchParams;
  const code = (q.get('room') || '').toUpperCase(), role = q.get('role');
  if (!validCode(code) || (role !== 'host' && role !== 'client')) return ws.close(4000, 'bad request');
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  if (role === 'host') {
    const existing = rooms.get(code);
    if (existing && existing.host.readyState === existing.host.OPEN) return ws.close(4001, 'room already hosted');
    const room = { host: ws, clients: existing ? existing.clients : new Map() };
    rooms.set(code, room);
    log(`room ${code}: host connected`);
    ws.on('message', (data, isBinary) => {
      if (isBinary) return;
      const s = data.toString(), bar = s.indexOf('|');
      if (bar < 1) return;
      const target = room.clients.get(s.slice(0, bar));
      if (target && target.readyState === target.OPEN) target.send(s.slice(bar + 1));
    });
    ws.on('close', () => {
      if (rooms.get(code) !== room) return;
      rooms.delete(code);
      for (const c of room.clients.values()) c.close(4002, 'host left');
      log(`room ${code}: host left, room closed`);
    });
    return;
  }

  // friend
  const room = rooms.get(code);
  if (!room || room.host.readyState !== room.host.OPEN) return ws.close(4004, 'no such room');
  if (room.clients.size >= MAX_FRIENDS) return ws.close(4005, 'room full');
  const id = newId();
  room.clients.set(id, ws);
  room.host.send(`${id}|{"t":"_join"}`);
  log(`room ${code}: friend ${id} joined (${room.clients.size})`);
  ws.on('message', (data, isBinary) => {
    if (isBinary || room.host.readyState !== room.host.OPEN) return;
    room.host.send(`${id}|${data.toString()}`);
  });
  ws.on('close', () => {
    room.clients.delete(id);
    if (room.host.readyState === room.host.OPEN) room.host.send(`${id}|{"t":"_leave"}`);
    log(`room ${code}: friend ${id} left`);
  });
});

// keep connections (and the tunnel) alive, and drop dead ones
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false; ws.ping();
  }
}, 25000);

function log(msg) { console.log(new Date().toISOString().slice(11, 19), msg); }
server.listen(PORT, '127.0.0.1', () => log(`relay listening on http://127.0.0.1:${PORT}`));
