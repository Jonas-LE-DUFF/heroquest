import { SpellElement } from "../../enums/SpellElement";

interface SpellAsJson {
    id: string;
    name: string;
    element: SpellElement;
}

export type { SpellAsJson };