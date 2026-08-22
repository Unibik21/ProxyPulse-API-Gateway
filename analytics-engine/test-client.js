import { WebSocket } from "ws";
const ws = new WebSocket('ws://localhost:8090');
ws.on('open', () => console.log('Connected'));
ws.on('message', (data) => console.log(JSON.parse(data.toString())));