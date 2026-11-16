import { createDetectorServer } from './local.js';
const port = Number(process.env.DETECTOR_PORT || 8790);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid DETECTOR_PORT.');
const server = createDetectorServer();
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Surfare detector API: http://127.0.0.1:${port}/api/health`));
