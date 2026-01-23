// this needs to be a strategy pattern base class for different spell effects

abstract class SpellEffect {
    abstract applyEffect(): void;
}

export { SpellEffect };