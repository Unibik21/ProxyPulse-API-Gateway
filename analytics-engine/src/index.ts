import { startConsumer } from './consumer.js';
import { startWebSocketServer } from './websocket.js';

async function main() {
  startWebSocketServer();
  await startConsumer(); 
}

main().catch((err) => {
  console.error('Analytics engine crashed:', err);
  process.exit(1);
});