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

// =============================================================================
// CALCULS D'ARMES D&D 2024
// =============================================================================

/**
 * Lit la configuration personnalisée d'une ligne d'arme (stockée en dataset).
 * @param {HTMLElement} tr
 * @returns {Object} - { statOverride, magicBonus, dmgDieOverride, dmgTypeOverride }
 */
function getWeaponConfig(tr) {
    try {
        return tr.dataset.weaponConfig ? JSON.parse(tr.dataset.weaponConfig) : {};
    } catch (e) { return {}; }
}

/**
 * Resout la caracteristique d'attaque effective d'une arme.
 * Gere Finesse (prend meilleur FOR/DEX), Munitions (force DEX), override manuel.
 * @param {string} atkKey - "FOR" ou "DEX"
 * @param {string} prop   - Proprietes de l'arme
 * @param {Object} mods   - { str, dex, con, int, wis, cha }
 * @param {string} statOverride - Override manuel ("str","dex","cha") ou ""
 * @returns {{ stat: string, mod: number }}
 */
function resolveWeaponAttackStat(atkKey, prop, mods, statOverride) {
    if (statOverride && mods[statOverride] !== undefined) {
        const labels = { str:'FOR', dex:'DEX', cha:'CHA', int:'INT', wis:'SAG' };
        return { stat: labels[statOverride] || statOverride.toUpperCase(), mod: mods[statOverride] };
    }
    const propLow = (prop || '').toLowerCase();
    if (propLow.includes('finesse')) {
        return mods.dex >= mods.str
            ? { stat: 'DEX', mod: mods.dex }
            : { stat: 'FOR', mod: mods.str };
    }
    if (propLow.includes('munitions')) return { stat: 'DEX', mod: mods.dex };
    return atkKey === 'DEX'
        ? { stat: 'DEX', mod: mods.dex }
        : { stat: 'FOR', mod: mods.str };
}

/**
 * Calcule le bonus d'attaque final d'une arme.
 * @param {string} atkKey     - "FOR" ou "DEX"
 * @param {string} prop       - Proprietes de l'arme
 * @param {Object} mods       - Modificateurs { str, dex, ... }
 * @param {number} pb         - Bonus de maitrise
 * @param {number} magicBonus - Bonus d'arme magique (+0 a +3)
 * @param {string} statOverride
 * @returns {{ text: string, tooltip: string }}
 */
function calcWeaponAttack(atkKey, prop, mods, pb, magicBonus, statOverride) {
    const { stat, mod } = resolveWeaponAttackStat(atkKey, prop, mods, statOverride);
    const magic = parseInt(magicBonus) || 0;
    const total = mod + pb + magic;
    const sign = total >= 0 ? '+' : '';
    let tooltip = stat + ' (' + (mod >= 0 ? '+' : '') + mod + ') + Maitrise (+' + pb + ')';
    if (magic > 0) tooltip += ' + Magie (+' + magic + ')';
    return { text: stat + ' : ' + sign + total, tooltip };
}

/**
 * Calcule la chaine de degats finale d'une arme.
 * @param {string} baseDmg         - Degats bruts ex: "1d12 tran." ou "2d6 cont."
 * @param {string} prop            - Proprietes de l'arme
 * @param {Object} mods            - Modificateurs
 * @param {number} magicBonus      - Bonus magique
 * @param {string} statOverride    - Override de caracteristique
 * @param {string} dmgDieOverride  - Override du de (ex: "1d8" pour Moine)
 * @param {string} dmgTypeOverride - Override du type de degats
 * @param {string} atkKey          - "FOR" ou "DEX"
 * @param {Array}  extraDmg        - Bonus ex: [{die:"1d6", type:"Feu"}]
 * @returns {{ text: string, tooltip: string }}
 */
function calcWeaponDamage(baseDmg, prop, mods, magicBonus, statOverride, dmgDieOverride, dmgTypeOverride, atkKey, extraDmg) {
    const matched = (baseDmg || '').match(/^(\d*d\d+|\d+)\s*([a-z\u00e9\.]+)?/i);
    const baseDie = dmgDieOverride || (matched ? matched[1] : '1d4');
    const baseType = dmgTypeOverride || (matched ? (matched[2] || '') : '');

    const { stat, mod } = resolveWeaponAttackStat(atkKey, prop, mods, statOverride);
    const magic = parseInt(magicBonus) || 0;
    const dmgMod = mod + magic;
    const sign = dmgMod >= 0 ? '+' : '';

    let text = baseDie + ' ' + sign + dmgMod;
    if (baseType) text += ' ' + baseType.replace('.','').toUpperCase();

    let tooltip = 'Des: ' + baseDie + ' | ' + stat + ' (' + (mod >= 0 ? '+' : '') + mod + ')';
    if (magic > 0) tooltip += ' + Magie (+' + magic + ')';

    if (extraDmg && extraDmg.length > 0) {
        extraDmg.forEach(function(e) {
            text += ' +' + e.die;
            if (e.type) text += ' (' + e.type + ')';
            tooltip += ' | +' + e.die + ' ' + (e.type || '');
        });
    }
    return { text: text, tooltip: tooltip };
}

/**
 * Bonus de Rage du Barbare selon le niveau (D&D 2024).
 * @param {number} level
 * @returns {number}
 */
function getRageBonus(level) {
    if (level >= 16) return 4;
    if (level >= 9) return 3;
    return 2;
}

/**
 * Verifie si une arme peut beneficier des Arts Martiaux du Moine (D&D 2024).
 * Regle 2024 : Arme Simple (Courante) de melee SANS la propriete Lourde.
 * @param {string}  category - "Courante" ou "Guerre"
 * @param {boolean} isRanged
 * @param {string}  prop
 * @returns {boolean}
 */
function isMartialArtsWeapon(category, isRanged, prop) {
    if (isRanged) return false;
    if ((category || '').toLowerCase() !== 'courante') return false;
    return !(prop || '').toLowerCase().includes('lourde');
}

/**
 * De d'Arts Martiaux du Moine selon le niveau (D&D 2024).
 * @param {number} level
 * @returns {string}
 */
function getMartialArtsDie(level) {
    if (level >= 17) return '1d12';
    if (level >= 11) return '1d10';
    if (level >= 5) return '1d8';
    return '1d6';
}
