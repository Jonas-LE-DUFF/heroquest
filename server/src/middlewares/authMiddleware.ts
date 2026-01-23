import { Socket } from "socket.io";

export function authMiddleware(socket: Socket, next: (err?: Error) => void) {
    // Could verify a token here
    const token = socket.handshake.auth.token;
    if (!token) {
        // For now, just allow all connections
    }
    next();
}