import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/api$/, "");

export function createStatusSocket() {
  return io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    autoConnect: true
  });
}
