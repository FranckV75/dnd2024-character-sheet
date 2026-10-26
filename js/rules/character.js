// =============================================================================
// CHARACTER.JS - STATISTIQUES DÉRIVÉES D'UN PERSONNAGE (FONCTIONS PURES)
// Prend un personnage au format de sauvegarde (dictionnaire « à plat » v3)
// et calcule tout ce que la fiche affiche : modificateurs, sauvegardes,
// compétences, CA, sorts, ressources de classe...
// =============================================================================

import { DD_RULES } from '../data/dd-rules.js';
import { EQUIPMENT_DATA } from '../data/equipment.js';
import { ABILITY_IDS, SKILLS } from '../data/constants.js';
import {
    calcMod, calculateProficiencyBonus, calculateSkillBonus, getClassResourceInfo,
    parseWeaponConfig, resolveWeaponAttackStat, calcWeaponAttack, calcWeaponDamage,
    getRageBonus, isMartialArtsWeapon, getMartialArtsDie
} from './logic.js';

/**
 * Extrait le premier entier d'une valeur saisie librement ("19", "+3", "<b>19</b>", "3?").
 * @param {*} value
 * @param {number} fallback - Valeur si aucun nombre n'est trouvé
 * @returns {number}
 */
export function parseNumber(value, fallback = 0) {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
    if (typeof value !== 'string') return fallback;
    const match = value.replace(/<[^>]*>/g, '').match(/-?\d+/);
    return match ? parseInt(match[0], 10) : fallback;
}

/**
 * Identifiant interne d'une classe à partir de son nom (FR, EN ou identifiant).
 * @param {string} className - ex. "Barbare", "Barbarian", "barbarian"
 * @returns {string} - ex. "barbarian", ou "" si inconnue
 */
export function classSlug(className) {
    if (!className) return '';
    const clean = className.toString().trim().toLowerCase();
    for (const [slug, cls] of Object.entries(DD_RULES.classes)) {
        if (slug === clean || cls.name.toLowerCase() === clean || cls.nameFr.toLowerCase() === clean) {
            return slug;
        }
    }
    return '';
}

/**
 * Dé de vie de la classe (D&D 2024).
 * @param {string} className
 * @returns {string} - ex. "d12", ou "" si classe inconnue
 */
export function hitDieForClass(className) {
    const slug = classSlug(className);
    return slug ? DD_RULES.classes[slug].hitDice : '';
}

/**
 * Emplacements de sorts par niveau de sort.
 * @param {string} className
 * @param {number} level
 * @returns {Object} - ex. { 1: 4, 2: 2 } ; {} pour un non-lanceur
 */
export function spellSlotsFor(className, level) {
    return DD_RULES.getSpellSlots(className, level);
}

const ARMOR_TYPE_ALIASES = {
    'légère': 'light', 'light': 'light',
    'interméd.': 'medium', 'intermédiaire': 'medium', 'medium': 'medium',
    'lourde': 'heavy', 'heavy': 'heavy',
    'bouclier': 'shield', 'shield': 'shield',
    'bonus': 'bonus',
    'maîtrise': 'proficiency'
};

/**
 * Catégorie normalisée d'une armure de la sauvegarde.
 * Les anciennes sauvegardes n'ont pas de champ `type` : il est alors déduit du nom.
 * Un type explicite « none » (Standard / Aucun) n'est jamais remplacé par le nom.
 * @param {{ type?: string, name?: string }} armor
 * @returns {'light'|'medium'|'heavy'|'shield'|'bonus'|'proficiency'|''}
 */
export function armorCategory(armor) {
    const rawType = (armor?.type ?? '').toString().trim().toLowerCase();
    const declared = ARMOR_TYPE_ALIASES[rawType];
    if (declared) return declared;
    // « none » (Standard / Aucun) ou valeur inconnue : aucun effet sur la CA, comme en v3
    if (rawType) return '';
    const name = (armor?.name || '').toString().replace(/<[^>]*>/g, '').trim().toLowerCase();
    const known = EQUIPMENT_DATA.armors.find(a => a.name.toLowerCase() === name);
    return known ? ARMOR_TYPE_ALIASES[known.type.toLowerCase()] || '' : '';
}

/**
 * Classe d'Armure (D&D 2024) selon les armures équipées et la Défense sans armure.
 * - Légère : base + DEX ; Intermédiaire : base + DEX (max 2) ; Lourde : base seule
 * - Bouclier : un seul compte (le meilleur), et seulement si le personnage est formé
 *   aux boucliers (PHB 2024) ; « Bonus » : s'ajoute ; « Maîtrise » : ajoute le bonus de maîtrise
 * - Sans armure : 10 + DEX, ou Barbare 10 + DEX + CON (bouclier autorisé),
 *   ou Moine 10 + DEX + SAG (uniquement sans bouclier)
 * @param {{ armors: Array, className: string, mods: Object, pb: number, shieldTrained?: boolean }} params
 * @returns {{ value: number, source: string }}
 */
export function computeArmorClass({ armors = [], className = '', mods, pb, shieldTrained = true }) {
    let bodyAC = null;
    let bodySource = '';
    let bonus = 0;
    let hasShield = false;
    let shieldBonus = 0;

    for (const armor of armors) {
        if (!armor || !armor.equipped) continue;
        const category = armorCategory(armor);
        const value = parseNumber(armor.ca, 0);
        let total = null;

        if (category === 'shield') { hasShield = true; shieldBonus = Math.max(shieldBonus, value); }
        else if (category === 'bonus') bonus += value;
        else if (category === 'proficiency') bonus += pb;
        else if (category === 'light') total = value + mods.dex;
        else if (category === 'medium') total = value + Math.min(2, mods.dex);
        else if (category === 'heavy') total = value;

        if (total !== null && (bodyAC === null || total > bodyAC)) {
            bodyAC = total;
            bodySource = (armor.name || '').toString().replace(/<[^>]*>/g, '').trim() || 'Armure';
        }
    }

    if (bodyAC === null) {
        const slug = classSlug(className);
        bodyAC = 10 + mods.dex;
        bodySource = 'Sans armure';
        if (slug === 'barbarian' && 10 + mods.dex + mods.con > bodyAC) {
            bodyAC = 10 + mods.dex + mods.con;
            bodySource = 'Défense sans armure (Barbare)';
        } else if (slug === 'monk' && !hasShield && 10 + mods.dex + mods.wis > bodyAC) {
            bodyAC = 10 + mods.dex + mods.wis;
            bodySource = 'Défense sans armure (Moine)';
        }
    }

    if (hasShield && shieldTrained) bonus += shieldBonus;
    const source = hasShield && !shieldTrained ? `${bodySource} — bouclier non maîtrisé : sans effet` : bodySource;
    return { value: bodyAC + bonus, source };
}

/**
 * DD de sauvegarde et bonus d'attaque des sorts.
 * @param {string} ability - 'int' | 'wis' | 'cha' | 'none'
 * @param {Object} mods
 * @param {number} pb
 * @returns {{ ability: string, dc: number, attack: number } | null}
 */
export function computeSpellcasting(ability, mods, pb) {
    if (!ability || !(ability in mods)) return null;
    return { ability, dc: 8 + pb + mods[ability], attack: pb + mods[ability] };
}

/**
 * Effets de l'Épuisement (D&D 2024) : -2 par niveau aux tests de d20, -1,5 m de vitesse par niveau,
 * mort au niveau 6.
 * @param {number} level - 0 à 6
 * @returns {{ level: number, d20Penalty: number, speedPenaltyM: number, dead: boolean }}
 */
export function exhaustionEffects(level) {
    const lvl = Math.max(0, Math.min(6, parseNumber(level, 0)));
    return { level: lvl, d20Penalty: -2 * lvl, speedPenaltyM: 1.5 * lvl, dead: lvl >= 6 };
}

/**
 * Palier de renommée de L'Odyssée des Seigneurs Dragons selon les points (identique à la v3).
 * @param {*} points
 * @returns {string}
 */
export function renownTier(points) {
    const pts = parseNumber(points, 0);
    if (pts >= 19) return 'Divin';
    if (pts >= 15) return 'Culte';
    if (pts >= 11) return 'Idolâtré';
    if (pts >= 6) return 'Reconnaissance urbaine';
    if (pts >= 1) return 'Célébrité locale';
    return 'Inconnu';
}

/**
 * Nombre de d6 de l'Attaque sournoise du Roublard.
 * @param {number} level
 * @returns {number}
 */
export function sneakAttackDice(level) {
    return Math.ceil(level / 2);
}

/**
 * État d'un emplacement de don (niveaux 1, 4, 8, 12, 16, 19) selon le niveau du personnage.
 * Sert seulement à l'affichage : aucun calcul de la fiche ne tient compte des dons
 * (les valeurs de caractéristique sont saisies à la main), un don prévu en avance
 * ne change donc rien aux statistiques.
 * @param {number} slotLevel - Niveau de l'emplacement
 * @param {*} characterLevel - Niveau du personnage (nombre ou saisie libre, ex. "<b>4</b>")
 * @param {*} choice - Valeur enregistrée (feat_<niveau>) : identifiant du don ou texte libre
 * @returns {'active'|'pending'|'planned'|'upcoming'}
 *   active : niveau atteint, don choisi ; pending : niveau atteint, don à choisir ;
 *   planned : niveau pas encore atteint, don déjà prévu ; upcoming : niveau pas encore atteint, rien de prévu
 */
export function featSlotState(slotLevel, characterLevel, choice) {
    const level = Math.max(1, Math.min(20, parseNumber(characterLevel, 1)));
    const reached = parseNumber(slotLevel, 1) <= level;
    const chosen = String(choice ?? '').replace(/<[^>]*>/g, '').trim() !== '';
    if (reached) return chosen ? 'active' : 'pending';
    return chosen ? 'planned' : 'upcoming';
}

/**
 * Attaque et dégâts d'une arme du tableau, avec les bonus de combat actifs.
 * @param {Object} weapon - Ligne de `dynamic_weapons`
 * @param {{ mods: Object, pb: number, level: number, classSlug: string }} stats - issu de deriveCharacter()
 * @param {{ rage?: boolean, sneakAttack?: boolean, hunterMark?: boolean, heavyWeaponMaster?: boolean }} [buffs]
 * @returns {{ attack: {text: string, tooltip: string}, damage: {text: string, tooltip: string} } | null}
 *          null si l'arme n'est pas rattachée au manuel (pas de calcul possible)
 */
export function computeWeapon(weapon, stats, buffs = {}) {
    const name = (weapon?.name || '').toString().replace(/<[^>]*>/g, '').trim();
    if (!weapon?.atkKey || !name) return null;

    const { mods, pb, level, classSlug: slug } = stats;
    const config = parseWeaponConfig(weapon.weaponConfig);
    const prop = (weapon.prop || '').toString().replace(/<[^>]*>/g, '');
    const isRanged = prop.toLowerCase().includes('munitions');
    const { stat } = resolveWeaponAttackStat(weapon.atkKey, prop, mods, config.statOverride || '');

    const extraDmg = [];
    if (buffs.rage && stat === 'FOR') extraDmg.push({ die: String(getRageBonus(level)), type: 'Rage' });
    if (buffs.hunterMark) extraDmg.push({ die: '1d6', type: 'Force' });
    // Cogneur lourd (PHB 2024, « Expert en armes lourdes ») : arme Lourde, bonus de maîtrise
    if (buffs.heavyWeaponMaster && prop.toLowerCase().split(/[,;]/).some(p => p.trim().startsWith('lourde'))) {
        extraDmg.push({ die: String(pb), type: 'Cogneur lourd' });
    }
    if (buffs.sneakAttack && (prop.toLowerCase().includes('finesse') || isRanged)) {
        extraDmg.push({ die: `${sneakAttackDice(level)}d6`, type: 'Sournoise' });
    }

    let dieOverride = config.dmgDieOverride || '';
    if (slug === 'monk' && isMartialArtsWeapon(weapon.category || '', isRanged, prop)) {
        dieOverride = dieOverride || getMartialArtsDie(level);
    }

    return {
        attack: calcWeaponAttack(weapon.atkKey, prop, mods, pb, config.magicBonus || 0, config.statOverride || ''),
        damage: calcWeaponDamage(weapon.baseDmg || '', prop, mods, config.magicBonus || 0, config.statOverride || '',
            dieOverride, config.dmgTypeOverride || '', weapon.atkKey, extraDmg)
    };
}

/**
 * Calcule toutes les statistiques dérivées d'un personnage.
 * @param {Object} record - Personnage au format de sauvegarde (v3)
 * @returns {Object}
 */
export function deriveCharacter(record = {}) {
    const level = Math.max(1, Math.min(20, parseNumber(record.char_level, 1)));
    const pb = calculateProficiencyBonus(level);
    const className = (record.char_class || '').toString();

    const scores = {};
    const mods = {};
    const saves = {};
    for (const id of ABILITY_IDS) {
        scores[id] = parseNumber(record[`${id}_score`], 10);
        mods[id] = calcMod(scores[id]);
        const proficient = record[`${id}_save_prof`] === true;
        saves[id] = { proficient, bonus: mods[id] + (proficient ? pb : 0) };
    }

    const skills = {};
    for (const skill of SKILLS) {
        const expertise = record[`skill_exp_${skill.id}`] === true;
        // Règle D&D : l'Expertise implique la maîtrise
        const proficient = expertise || record[`skill_prof_${skill.id}`] === true;
        skills[skill.id] = {
            stat: skill.stat,
            proficient,
            expertise,
            bonus: calculateSkillBonus(mods[skill.stat], proficient, expertise, pb)
        };
    }

    return {
        level,
        pb,
        className,
        classSlug: classSlug(className),
        scores,
        mods,
        saves,
        skills,
        initiative: mods.dex,
        passivePerception: 10 + skills.perception.bonus,
        armorClass: computeArmorClass({
            armors: record.dynamic_armors || [], className, mods, pb,
            shieldTrained: record.prof_armor_shield === true
        }),
        spellcasting: computeSpellcasting(record.spell_ability, mods, pb),
        spellSlots: spellSlotsFor(className, level),
        classResource: getClassResourceInfo(level, className, mods),
        hitDie: hitDieForClass(className),
        exhaustion: exhaustionEffects(record.fatigue_level),
        renownTier: renownTier(record.glory_score)
    };
}
