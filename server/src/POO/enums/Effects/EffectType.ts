enum EffectType {
    STAT_MODIFIER = "STAT_MODIFIER",       // +2 attack, -1 defense (additive)
    STAT_MULTIPLIER = "STAT_MULTIPLIER",   // x2 movement (multiplicative)
    ABILITY_GRANT = "ABILITY_GRANT",       // phase through walls, monsters
    DEBUFF_GRANT = "DEBUFF_GRANT",         // silence, immobilize
    CONDITIONAL_BUFF = "CONDITIONAL_BUFF"  // courage (needs condition check)
}

export { EffectType };
