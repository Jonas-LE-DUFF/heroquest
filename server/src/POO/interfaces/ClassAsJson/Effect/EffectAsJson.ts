import { AbilityType } from "../../../enums/AbilityType";
import { EffectDuration } from "../../../enums/Effects/EffectDuration";
import { EffectType } from "../../../enums/Effects/EffectType";

interface EffectAsJson {
    name: string;
    isBuff: boolean;
    effectType: EffectType;
    duration: EffectDuration;
    ability?: AbilityType | undefined;
}

export type { EffectAsJson };