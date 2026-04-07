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
 * Calcule le bonus d'une compétence avec support Expertise
 * @param {number} statMod - Modificateur de la statistique associée
 * @param {boolean} isProficient - Le personnage est-il formé à cette compétence ?
 * @param {boolean} hasExpertise - Le personnage a-t-il l'Expertise (double maîtrise) ?
 * @param {number} proficiencyBonus - Bonus de maîtrise du personnage
 * @returns {number} - Bonus total de compétence
 */
function calculateSkillBonus(statMod, isProficient, hasExpertise, proficiencyBonus) {
    if (hasExpertise) return statMod + (proficiencyBonus * 2);
    if (isProficient) return statMod + proficiencyBonus;
    return statMod;
}

/**
 * Détermine les ressources de classe en fonction de la classe et du niveau
 * Retourne un objet au lieu de modifier le DOM directement
 * @param {number} level - Niveau du personnage
 * @param {string} className - Nom de la classe
 * @param {Object} mods - Modificateurs de caractéristiques { str, dex, con, int, wis, cha }
 * @returns {Object} - { count: number, label: string, reset: string }
 *   reset can be 'none' (no short rest recovery), 'all' (recovers all on short rest), 'one' (recovers 1 on short rest)
 */
function getClassResourceInfo(level, className, mods) {
    if (!className) return { count: 0, label: "", reset: "none" };

    let clsClean = className.trim().toLowerCase();
    let count = 0;
    let label = "";
    let reset = "none"; // Par défaut, pas de récupération au repos court

    if (clsClean.includes('barbar')) {
        label = "Rages";
        count = 2;
        if (level >= 3) count = 3;
        if (level >= 6) count = 4;
        if (level >= 12) count = 5;
        if (level >= 17) count = 6;
        reset = "one"; // D&D 2024 : 1 Rage récupérée au repos court
    }
    else if (clsClean.includes('bard')) {
        label = "Inspiration Bardique";
        count = Math.max(1, mods['cha']);
        reset = level >= 5 ? "all" : "none"; // D&D 2024: Font of Inspiration au niv 5
    }
    else if (clsClean.includes('clerc') || clsClean.includes('cleric')) {
        label = "Conduit Divin";
        count = 2;
        if (level >= 6) count = 3;
        if (level >= 18) count = 4;
        reset = "one"; // D&D 2024: Restaure 1 utilisation au repos court
    }
    else if (clsClean.includes('druid')) {
        label = "Formes Sauvages";
        count = 2;
        if (level >= 6) count = 3;
        if (level >= 14) count = 4;
        reset = "one"; // D&D 2024: Restaure 1 utilisation au repos court
    }
    else if (clsClean.includes('guerrier') || clsClean.includes('fighter')) {
        label = "Second Souffle";
        count = 2;
        if (level >= 4) count = 3;
        if (level >= 10) count = 4;
        reset = "one"; // D&D 2024: Restaure 1 utilisation au repos court
    }
    else if (clsClean.includes('ensorceleur') || clsClean.includes('sorcer')) {
        label = "Points de Sorcellerie";
        count = level; // Ensorceleur génère 1 pt / niveau
        reset = "none";
    }
    else if (clsClean.includes('moine') || clsClean.includes('monk')) {
        label = "Points de Discipline (Ki)";
        count = level;
        reset = "all"; // D&D 2024: Restaure tout au repos court
    }
    else if (clsClean.includes('paladin')) {
        if (level >= 3) {
            label = "Conduit Divin";
            count = 2;
            if (level >= 11) count = 3;
            reset = "one"; // D&D 2024: Restaure 1 utilisation au repos court
        }
    }
    else if (clsClean.includes('rôdeur') || clsClean.includes('ranger')) {
        label = "Marque du Chasseur";
        count = 2;
        if (level >= 5) count = 3;
        if (level >= 9) count = 4;
        if (level >= 13) count = 5;
        if (level >= 17) count = 6;
        reset = "none"; // D&D 2024: Long rest only 
    }

    return { count, label, reset };
}

