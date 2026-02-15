enum EffectDuration {
    PERMANENT = "permanent",
    ONE_TURN = "one_turn",
    UNTIL_CONDITION = "until_condition",  // e.g., courage lasts until no enemies in sight
    SPIRIT_CHECK = "spirit_check",         // e.g., sleep lasts until successful spirit check
    UNTIL_DAMAGE_TAKEN = "until_damage_taken", // e.g., shield lasts until the character takes damage
}

export { EffectDuration };
