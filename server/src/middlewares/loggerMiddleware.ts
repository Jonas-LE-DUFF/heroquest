import { Socket } from "socket.io";
import { logger } from "../utils/logger";

export function loggerMiddleware(socket: Socket, next: (err?: Error) => void) {
  logger.info(
    `middleware logging : [${new Date().toISOString()}] Connection: ${socket.id}`,
  );
  next();
}
