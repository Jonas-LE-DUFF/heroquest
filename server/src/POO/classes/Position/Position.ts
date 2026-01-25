class Position {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    isValid(BoardWidth: number, BoardHeight: number): boolean {
        return this.x >= 0 && this.x < BoardWidth && this.y >= 0 && this.y < BoardHeight;
    }
}

export { Position };