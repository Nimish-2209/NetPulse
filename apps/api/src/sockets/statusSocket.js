import { Server } from "socket.io";

let io;

function teamRoom(teamId) {
  return `team:${teamId}`;
}

export function configureStatusSocket(server, { isAllowedOrigin }) {
  io = new Server(server, {
    cors: {
      origin(origin, callback) {
        callback(null, isAllowedOrigin(origin));
      }
    }
  });

  io.on("connection", (socket) => {
    socket.on("team:join", (teamId) => {
      if (teamId) socket.join(teamRoom(teamId));
    });

    socket.on("team:leave", (teamId) => {
      if (teamId) socket.leave(teamRoom(teamId));
    });
  });

  return io;
}

export function emitToTeam(teamId, event, payload) {
  if (!io || !teamId) return;
  io.to(teamRoom(teamId)).emit(event, payload);
}
