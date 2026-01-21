abstract class Item {
    id: string;
    name: string;
    cost: number;

    constructor(id: string, name: string, cost: number) {
        this.id = id;
        this.name = name;
        this.cost = cost;
    }
}