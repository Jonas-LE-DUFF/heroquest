abstract class Item {
    id: string;
    name: string;
    cost: number;
    image: string;

    constructor(id: string, name: string, cost: number, image: string) {
        this.id = id;
        this.name = name;
        this.cost = cost;
        this.image = image;
    }
}

export { Item };