import dotenv from "dotenv";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp, isAllowedDevOrigin } from "./app.js";
import { connectDB } from "./config/db.js";
import { configureStatusSocket } from "./sockets/statusSocket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../../.env")
});

const app = createApp();
const server = createServer(app);
const PORT = process.env.API_PORT || 4000;

configureStatusSocket(server, { isAllowedOrigin: isAllowedDevOrigin });

await connectDB();

server.listen(PORT, () => {
  console.log(`NetPulse API is running on port ${PORT}`);
});
