import { Socket } from "socket.io";

export function loggerMiddleware(socket: Socket, next: (err?: Error) => void) {
    console.log(`[${new Date().toISOString()}] Connection: ${socket.id}`);
    next();
}