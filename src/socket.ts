import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server | null = null;

const onlineUsers = new Map<string, string>();

/**
 * initialize the socket
 */
export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("register", (userId: string) => {
      onlineUsers.set(userId, socket.id);
      console.log("User registered:", userId);
    });

    socket.on("disconnect", () => {
      for (const [userId, sId] of onlineUsers.entries()) {
        if (sId === socket.id) {
          onlineUsers.delete(userId);
          console.log("User disconnected:", userId);
          break;
        }
      }
    });
  });

  return io;
}

/** 
 * Helper to get socket instance
 */
export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

/** 
 * Send message to specific user
 */
export function sendToUser(userId: string, event: string, data: any) {
  const socketId = onlineUsers.get(userId);
  if (!socketId) return false;
  io?.to(socketId).emit(event, data);
  return true;
}
