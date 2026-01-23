import { MonsterCategory } from "../../enums/Categories/MonsterCategory";
import { Monster } from "../Units/Monster";

abstract class MonsterFactory {
    abstract createMonster(monsterType: MonsterCategory): Monster;
}

export { MonsterFactory };