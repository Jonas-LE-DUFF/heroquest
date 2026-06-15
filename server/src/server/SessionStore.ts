export interface StoredSession {
    sessionToken: string;
    playerId: string | null;
    gameId: string | null;
}


export class SessionStore {
    private sessions =  new Map<string, StoredSession>();

    save(session: StoredSession): void {
        this.sessions.set(session.sessionToken, session);
    }

    findByToken(sessionToken: string): StoredSession | null {
        return this.sessions.get(sessionToken) || null;
    }

    delete(sessionToken: string): void {
        this.sessions.delete(sessionToken);
    }
}
