// =============================================================================
// LOGIC.JS - CALCULS D&D PURS (SANS ACCÈS DOM)
// =============================================================================

/**
 * Calcule le modificateur de caractéristique selon les règles D&D
 * @param {number} score - Score de caractéristique (1-30)
 * @returns {number} - Modificateur (-5 à +10)
 */
function calcMod(score) {
    return Math.floor((score - 10) / 2);
}

/**
 * Calcule le bonus de maîtrise en fonction du niveau
 * @param {number} level - Niveau du personnage (1-20)
 * @returns {number} - Bonus de maîtrise (+2 à +6)
 */
function calculateProficiencyBonus(level) {
    return Math.ceil(level / 4) + 1;
}

/**
 * Calcule le bonus d'une compétence
 * @param {number} statMod - Modificateur de la statistique associée
 * @param {boolean} isProficient - Le personnage est-il formé à cette compétence ?
 * @param {number} proficiencyBonus - Bonus de maîtrise du personnage
 * @returns {number} - Bonus total de compétence
 */
function calculateSkillBonus(statMod, isProficient, proficiencyBonus) {
    return statMod + (isProficient ? proficiencyBonus : 0);
}

/**
 * Détermine les ressources de classe en fonction de la classe et du niveau
 * Retourne un objet au lieu de modifier le DOM directement
 * @param {number} level - Niveau du personnage
 * @param {string} className - Nom de la classe
 * @param {Object} mods - Modificateurs de caractéristiques { str, dex, con, int, wis, cha }
 * @returns {Object} - { count: number, label: string }
 */
function getClassResourceInfo(level, className, mods) {
    if (!className) return { count: 0, label: "" };

    let clsClean = className.trim().toLowerCase();
    let count = 0;
    let label = "";

    if (clsClean.includes('barbar')) {
        label = "Rages";
        count = 2;
        if (level >= 3) count = 3;
        if (level >= 6) count = 4;
        if (level >= 12) count = 5;
        if (level >= 17) count = 6;
    }
    else if (clsClean.includes('bard')) {
        label = "Inspiration Bardique";
        count = Math.max(1, mods['cha']);
    }
    else if (clsClean.includes('clerc') || clsClean.includes('cleric')) {
        label = "Conduit Divin";
        count = 2;
        if (level >= 6) count = 3;
        if (level >= 18) count = 4;
    }
    else if (clsClean.includes('druid')) {
        label = "Formes Sauvages";
        count = 2;
        if (level >= 6) count = 3;
        if (level >= 14) count = 4;
    }
    else if (clsClean.includes('ensorceleur') || clsClean.includes('sorcer')) {
        label = "Sorcellerie Innée";
        count = 2;
    }
    else if (clsClean.includes('moine') || clsClean.includes('monk')) {
        label = "Points de KI";
        count = level;
    }
    else if (clsClean.includes('paladin')) {
        if (level >= 3) {
            label = "Conduit Divin";
            count = 2;
            // 2024 Paladin: 2 CD à lvl 3, 3 CD à lvl 11.
            if (level >= 11) count = 3;
        }
    }
    else if (clsClean.includes('rôdeur') || clsClean.includes('ranger')) {
        label = "Ennemi Juré";
        // Rôdeur (Ranger) 2024 : Favored Enemy uses (Hunter's Mark free casts)
        // Lvl 1: 2, Lvl 5: 3, Lvl 9: 4, Lvl 13: 5, Lvl 17: 6
        count = 2;
        if (level >= 5) count = 3;
        if (level >= 9) count = 4;
        if (level >= 13) count = 5;
        if (level >= 17) count = 6;
    }

    return { count, label };
}

/**
 * Calcule les statistiques dérivées (Initiative, DD Sorts, Attaque Sorts)
 * Version pure qui retourne un objet au lieu de modifier le DOM
 * @param {Object} stats - { dex, int, wis, cha, level, spellAbility }
 * @returns {Object} - { initiative, spellDC, spellAttack }
 */
function calculateDerivedStats(stats) {
    const { dex, int, wis, cha, level, spellAbility } = stats;
    const pb = calculateProficiencyBonus(level);

    // Initiative = Modificateur de Dextérité
    const initiative = dex;

    // DD Sorts et Attaque Sorts
    let spellDC = null;
    let spellAttack = null;

    if (spellAbility && spellAbility !== 'none') {
        let abilityMod = 0;
        switch (spellAbility) {
            case 'int': abilityMod = int; break;
            case 'wis': abilityMod = wis; break;
            case 'cha': abilityMod = cha; break;
        }

        spellDC = 8 + pb + abilityMod;
        spellAttack = pb + abilityMod;
    }

    return { initiative, spellDC, spellAttack };
}
