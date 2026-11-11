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
import { reachedFeatIds } from './feats.js';
import { weaponReach, isUnarmedStrike } from './weapons.js';
import { divineFuryDie } from './subclass-features.js';
import { subclassInitiativeBonuses, subclassSkillBonus, subclassWeaponStat, danceUnarmedDie } from './subclass-calcs.js';
import { subclassBuffDamage } from './subclass-combat.js';
import { subclassChoice } from './subclass-choices.js';
import {
    subclassId, auraOfProtectionBonus, jackOfAllTradesBonus, unarmoredDefenseOptions, weaponProficiency,
    shieldKeepsMartialArts, subclassFinesse
} from './class-features.js';

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
        if (slug === clean || DD_RULES.namesOf(cls).some((name) => name.toLowerCase() === clean)) {
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
 * @param {string} [subclass] - identifiant de sous-classe : Chevalier occulte et Arnaqueur arcanique
 *        (tiers de lanceur, lot 6 des sous-classes)
 * @returns {Object} - ex. { 1: 4, 2: 2 } ; {} pour un non-lanceur
 */
export function spellSlotsFor(className, level, subclass = '') {
    return DD_RULES.getSpellSlots(className, level, subclass);
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

/** Bonus magique maximum d'une armure ou d'un bouclier (+3, DMG 2024) */
export const ARMOR_MAGIC_MAX = 3;

/** Catégories qui peuvent être magiques : armures portées et boucliers */
const MAGIC_CATEGORIES = new Set(['light', 'medium', 'heavy', 'shield']);

/**
 * Bonus magique d'une ligne d'armure (clé facultative « magic ») : entier de 0 à 3.
 * Accepte 1, « 1 », « +1 » ; toute autre valeur vaut 0.
 * @param {{ magic?: number|string }} armor
 * @returns {number}
 */
export function armorMagicBonus(armor) {
    const raw = armor && typeof armor === 'object' ? armor.magic : undefined;
    const text = String(raw ?? '').trim();
    if (!/^\+?\d+$/.test(text)) return 0;
    const value = parseInt(text, 10);
    return value >= 1 && value <= ARMOR_MAGIC_MAX ? value : 0;
}

/** La ligne peut-elle recevoir un bonus magique (armure légère, intermédiaire, lourde, bouclier) ? */
export function armorCanBeMagic(armor) {
    return MAGIC_CATEGORIES.has(armorCategory(armor));
}

/** Entrée du manuel (EQUIPMENT_DATA.armors) dont le nom est exactement celui de la ligne, sinon null */
export function catalogueArmor(armor) {
    const name = (armor?.name ?? '').toString().replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().toLowerCase();
    if (!name) return null;
    return EQUIPMENT_DATA.armors.find(a => a.name.toLowerCase() === name) || null;
}

/**
 * Valeur de base d'une ligne (« 15 » pour une Demi-plate, « 2 » pour un bouclier, « 1 » pour une cape) :
 * le nombre enregistré dans la clé « ca » (anciennes fiches, objets hors manuel), sinon celui du
 * manuel pour un nom connu, sinon 0.
 * @param {{ ca?: string, name?: string }} armor
 * @returns {number}
 */
export function armorBaseValue(armor) {
    const stored = parseNumber(armor?.ca, Number.NaN);
    if (Number.isFinite(stored)) return stored;
    const known = catalogueArmor(armor);
    return known ? parseNumber(known.ca, 0) : 0;
}

/** Don « Maître des armures intermédiaires » (PHB 2024 « Medium Armor Master ») */
export const MEDIUM_ARMOR_MASTER_ID = 'maitre_des_armures_intermediaires';

/**
 * Dextérité maximale ajoutée par une armure intermédiaire : 2, ou 3 avec le don Maître des armures
 * intermédiaires si la valeur de Dextérité est de 16 ou plus (PHB 2024, « Dexterous Wearer »).
 * @param {string[]} feats - dons atteints
 * @param {number} dexScore - valeur de Dextérité
 * @returns {number}
 */
export function mediumArmorDexMax(feats = [], dexScore = 10) {
    return feats.includes(MEDIUM_ARMOR_MASTER_ID) && dexScore >= 16 ? 3 : 2;
}

const MINUS = '−';
const signedAC = (n) => (n < 0 ? `${MINUS}${-n}` : `+${n}`);
/** « + 2 » ou « − 1 » (terme d'une addition) */
const term = (n) => (n < 0 ? `${MINUS} ${-n}` : `+ ${n}`);
const plainName = (armor) => (armor?.name || '').toString().replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

/**
 * Ce qu'une ligne du tableau des armures apporte à la CA, et comment c'est calculé.
 * - kind 'body' : armure portée, value = CA totale de l'armure (« 18 ») ;
 * - kind 'shield' | 'bonus' | 'proficiency' : value = bonus ajouté (« +3 ») ;
 * - kind 'none' : type « Standard / Aucun » ou inconnu, ne compte pas (value null).
 * @param {Object} armor - ligne de dynamic_armors
 * @param {{ mods: Object, pb: number, mediumDexMax?: number }} ctx
 * @returns {{ category: string, kind: string, value: number|null, display: string, formula: string, magic: number }}
 */
export function armorLine(armor, { mods, pb, mediumDexMax = 2 }) {
    const category = armorCategory(armor);
    const base = armorBaseValue(armor);
    const magic = MAGIC_CATEGORIES.has(category) ? armorMagicBonus(armor) : 0;
    const magicText = magic ? ` + ${magic} magique` : '';

    if (category === 'light' || category === 'medium' || category === 'heavy') {
        let dex = 0;
        let dexText = '';
        if (category === 'light') {
            dex = mods.dex;
            dexText = ` ${term(dex)} Dex`;
        } else if (category === 'medium') {
            dex = Math.min(mediumDexMax, mods.dex);
            dexText = ` ${term(dex)} Dex (max ${mediumDexMax})`;
        }
        const value = base + dex + magic;
        const formula = category === 'heavy'
            ? `${magic ? `${base}${magicText} = ${value}` : String(base)} (armure lourde : sans la Dex)`
            : `${base}${dexText}${magicText} = ${value}`;
        return { category, kind: 'body', value, display: String(value), formula, magic };
    }
    if (category === 'shield') {
        // Un bouclier n'enlève jamais de CA (comme avant : une valeur négative est ramenée à 0)
        const value = Math.max(0, base + magic);
        const formula = magic ? `${signedAC(base)} bouclier${magicText} = ${signedAC(value)}` : `${signedAC(base)} bouclier`;
        return { category, kind: 'shield', value, display: signedAC(value), formula, magic };
    }
    if (category === 'bonus') {
        return { category, kind: 'bonus', value: base, display: signedAC(base), formula: `${signedAC(base)} à la CA (bonus fixe)`, magic: 0 };
    }
    if (category === 'proficiency') {
        return { category, kind: 'proficiency', value: pb, display: signedAC(pb), formula: `${signedAC(pb)} à la CA (bonus de maîtrise)`, magic: 0 };
    }
    return {
        category, kind: 'none', value: null, display: '—',
        formula: "Ne compte pas dans la CA : choisissez son type avec l'engrenage (fiche déverrouillée).", magic: 0
    };
}

/**
 * Classe d'Armure (D&D 2024) selon les armures équipées et la Défense sans armure.
 * - Légère : base + DEX ; Intermédiaire : base + DEX (max 2, ou 3 avec Maître des armures
 *   intermédiaires et Dextérité 16+) ; Lourde : base seule
 * - Base : nombre de la clé « ca », sinon valeur du manuel pour un nom connu (armorBaseValue)
 * - Une seule armure portée compte (la meilleure) et un seul bouclier (le meilleur), seulement si le
 *   personnage est formé aux boucliers (PHB 2024) ; « Bonus » : s'ajoute ; « Maîtrise » : ajoute le
 *   bonus de maîtrise
 * - Sans armure : 10 + DEX, ou la meilleure Défense sans armure de la classe ou de la sous-classe
 *   (unarmoredDefenseOptions, class-features.js) : Barbare 10 + DEX + CON (bouclier autorisé),
 *   Moine 10 + DEX + SAG (uniquement sans bouclier), Sorcellerie draconique niveau 3 10 + DEX + CHA
 *   (bouclier autorisé), Collège de la Danse niveau 3 10 + DEX + CHA (uniquement sans bouclier)
 * - Armure ou bouclier magique (+1, +2, +3 : clé facultative « magic » de la ligne) : le bonus
 *   s'ajoute à la CA de cette armure ou de ce bouclier (DMG 2024, « Armor, +1, +2, or +3 » et
 *   « Shield, +1, +2, or +3 »)
 * rows : pour chaque ligne du tableau (même index), son calcul (armorLine) et son état :
 * 'counted' (comptée), 'unequipped' (non équipée), 'outdone' (une autre armure ou un autre bouclier
 * compte davantage), 'untrained' (bouclier non maîtrisé), 'none' (ne compte pas), avec une note.
 * @param {{ armors: Array, className: string, mods: Object, pb: number, shieldTrained?: boolean, mediumDexMax?: number,
 *           defense?: boolean, subclass?: string, level?: number }} params - subclass : identifiant (subclassId)
 * @returns {{ value: number, source: string, rows: Array<{ line: Object, status: string, note: string }> }}
 */
export function computeArmorClass({ armors = [], className = '', mods, pb, shieldTrained = true, mediumDexMax = 2, defense = false, subclass = '', level = 1 }) {
    const list = Array.isArray(armors) ? armors : [];
    const rows = list.map(armor => ({
        line: armorLine(armor && typeof armor === 'object' ? armor : {}, { mods, pb, mediumDexMax }),
        status: 'unequipped', note: ''
    }));

    let body = -1;
    let shield = -1;
    let hasShield = false;
    let bonus = 0;
    rows.forEach((row, i) => {
        const { kind, value } = row.line;
        if (kind === 'none') {
            row.status = 'none';
            return;
        }
        if (!list[i]?.equipped) {
            row.note = kind === 'body' || kind === 'shield'
                ? 'Non équipée : ne compte pas dans la CA.'
                : 'Non active : ne compte pas dans la CA.';
            return;
        }
        if (kind === 'body') {
            if (body === -1 || value > rows[body].line.value) body = i;
        } else if (kind === 'shield') {
            hasShield = true;
            if (shield === -1 || value > rows[shield].line.value) shield = i;
        } else {
            bonus += value;
            row.status = 'counted';
        }
    });
    rows.forEach((row, i) => {
        if (!list[i]?.equipped) return;
        const { kind } = row.line;
        if (kind === 'body') {
            row.status = i === body ? 'counted' : 'outdone';
            if (i !== body) {
                const other = plainName(list[body]) || "l'autre armure";
                row.note = row.line.value === rows[body].line.value
                    ? `Une seule armure compte : « ${other} » est retenue (même CA).`
                    : `Une seule armure compte : « ${other} » donne plus.`;
            }
        } else if (kind === 'shield') {
            if (!shieldTrained) {
                row.status = 'untrained';
                row.note = "Formation aux boucliers non cochée : le bouclier n'apporte aucun bonus.";
            } else if (i !== shield) {
                row.status = 'outdone';
                const other = plainName(list[shield]) || "l'autre bouclier";
                row.note = row.line.value === rows[shield].line.value
                    ? `Un seul bouclier compte : « ${other} » est retenu (même bonus).`
                    : `Un seul bouclier compte : « ${other} » donne plus.`;
            } else {
                row.status = 'counted';
            }
        }
    });

    let bodyAC;
    let bodySource;
    // Défense sans armure perdue à cause du bouclier (Moine, Collège de la Danse) : { value, short }
    let shieldLost = null;
    const unarmored = unarmoredDefenseOptions({ classSlug: classSlug(className), subclass, level, mods });
    // Détail de l'addition (bulle de l'écusson CA) : une part par élément compté, et des remarques
    const parts = [];
    const notes = [];
    if (body !== -1) {
        const { line } = rows[body];
        bodyAC = line.value;
        bodySource = (plainName(list[body]) || 'Armure') + (line.magic ? ` (+${line.magic} magique)` : '');
        parts.push({ label: plainName(list[body]) || 'Armure', value: line.display, formula: line.formula });
        // Défense sans armure plus forte que l'armure portée : on le signale (elle ne marche pas en armure)
        for (const option of unarmored) {
            if (option.value > bodyAC) {
                notes.push(`${option.short} : ${option.value} sans armure, mais elle ne compte pas quand on porte une armure.`);
            }
        }
    } else {
        const dexTerm = `10 ${term(mods.dex)} Dex`;
        bodyAC = 10 + mods.dex;
        bodySource = 'Sans armure';
        let label = 'Sans armure';
        let formula = `${dexTerm} = ${bodyAC}`;
        // La meilleure formule utilisable ; celle du Moine ou de la Danse ne marche pas avec un bouclier
        // (PHB 2024 : ni armure ni bouclier)
        let best = null;
        for (const option of unarmored) {
            if (option.value <= bodyAC) continue;
            if (hasShield && !option.shieldAllowed) {
                if (!shieldLost || option.value > shieldLost.value) shieldLost = option;
                continue;
            }
            if (!best || option.value > best.value) best = option;
        }
        if (best) {
            bodyAC = best.value;
            bodySource = label = best.label;
            formula = `${dexTerm} ${term(best.statMod)} ${best.stat} = ${bodyAC}`;
        }
        // Perdue seulement si elle aurait donné plus que la formule retenue
        if (shieldLost && shieldLost.value <= bodyAC) shieldLost = null;
        if (shieldLost && !best) bodySource = `Sans armure — ${shieldLost.short} perdue : bouclier en main`;
        parts.push({ label, value: String(bodyAC), formula });
    }
    if (shieldLost !== null) {
        const lost = `${shieldLost.short} perdue avec un bouclier : ${shieldLost.value} sans le bouclier.`;
        notes.push(lost);
        rows.forEach((row, i) => {
            if (row.line.kind === 'shield' && list[i]?.equipped) row.note = row.note ? `${row.note} ${lost}` : lost;
        });
    }

    let source = bodySource;
    if (hasShield && !shieldTrained) {
        source = shieldLost !== null ? `${bodySource}, bouclier non maîtrisé : aucun bonus` : `${bodySource} — bouclier non maîtrisé : sans effet`;
        notes.push("Bouclier non maîtrisé (formation aux boucliers non cochée) : il n'ajoute rien.");
    } else if (shield !== -1) {
        const { line } = rows[shield];
        bonus += line.value;
        if (line.magic) source = `${bodySource}, bouclier +${line.magic} magique`;
        parts.push({ label: plainName(list[shield]) || 'Bouclier', value: line.display, formula: line.formula });
    }
    rows.forEach((row, i) => {
        const { kind } = row.line;
        if (row.status === 'counted' && (kind === 'bonus' || kind === 'proficiency')) {
            parts.push({ label: plainName(list[i]) || (kind === 'bonus' ? 'Bonus' : 'Maîtrise'), value: row.line.display, formula: row.line.formula });
        }
    });
    // Style de combat Défense (Manuel des joueurs français p. 209) : +1 en armure légère, intermédiaire ou lourde
    if (defense && body !== -1) {
        bonus += 1;
        parts.push({ label: 'Défense (style de combat)', value: '+1', formula: 'en armure' });
    }
    return { value: bodyAC + bonus, source, rows, parts, notes };
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
 * Effets de l'Épuisement (D&D 2024) : -2 par niveau aux Tests d20, -1,5 m de vitesse par niveau,
 * mort au niveau 6.
 * @param {number} level - 0 à 6
 * @returns {{ level: number, d20Penalty: number, speedPenaltyM: number, dead: boolean }}
 */
export function exhaustionEffects(level) {
    const lvl = Math.max(0, Math.min(6, parseNumber(level, 0)));
    return { level: lvl, d20Penalty: -2 * lvl, speedPenaltyM: 1.5 * lvl, dead: lvl >= 6 };
}

/**
 * Gravité affichée de l'Épuisement (mêmes seuils que la v3) : avertissement à partir du
 * niveau 3, danger à partir du niveau 5 (le niveau 6 est la mort).
 * @param {number} level
 * @returns {'' | 'warning' | 'danger'}
 */
export function exhaustionSeverity(level) {
    const lvl = exhaustionEffects(level).level;
    return lvl >= 5 ? 'danger' : lvl >= 3 ? 'warning' : '';
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
 * État d'un emplacement de don (niveaux 1, 4, 8, 12, 16, 19, et 6, 10, 14 de classe) selon le niveau du personnage.
 * Seuls les dons « actifs » (niveau atteint) comptent dans les calculs de la fiche
 * (reachedFeatIds, js/rules/feats.js) : un don prévu en avance ne change rien aux statistiques.
 * Les valeurs saisies à la main (caractéristiques, PV max, vitesse) ne sont jamais modifiées.
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
 * Dé de la Marque du chasseur : 1d6 ; Rôdeur niveau 20, Tueur implacable (PHB 2024 « Foe Slayer ») : 1d10.
 * @param {{ level: number, classSlug: string }} stats
 * @returns {string}
 */
export function hunterMarkDie({ level, classSlug }) {
    return classSlug === 'ranger' && level >= 20 ? '1d10' : '1d6';
}

/**
 * Attaque et dégâts d'une arme du tableau, avec les bonus de combat actifs.
 * @param {Object} weapon - Ligne de `dynamic_weapons`
 * @param {{ mods: Object, pb: number, level: number, classSlug: string, subclass?: string, feats?: string[] }} stats - issu de deriveCharacter()
 * @param {{ rage?: boolean, sneakAttack?: boolean, hunterMark?: boolean, heavyWeaponMaster?: boolean, charger?: boolean, dueling?: boolean, thrownWeapon?: boolean }} [buffs]
 *        thrownWeapon : pas un bouton ; attaque lancée avec le style Armes de lancer (+2, rappel sous l'arme)
 * @returns {{ attack: {text: string, tooltip: string}, damage: {text: string, tooltip: string},
 *             proficiency: { proficient: boolean, source: string, text: string } } | null}
 *          proficiency : maîtrise de l'arme (weaponProficiency, class-features.js) ; sans elle, pas de
 *          bonus de maîtrise à l'attaque
 *          null si l'arme n'est pas rattachée au manuel (pas de calcul possible)
 */
export function computeWeapon(weapon, stats, buffs = {}) {
    const name = (weapon?.name || '').toString().replace(/<[^>]*>/g, '').trim();
    if (!weapon?.atkKey || !name) return null;

    const { mods, pb, level, classSlug: slug } = stats;
    const config = parseWeaponConfig(weapon.weaponConfig);
    const prop = (weapon.prop || '').toString().replace(/<[^>]*>/g, '');
    const isRanged = prop.toLowerCase().includes('munitions');
    const unarmed = isUnarmedStrike(weapon);
    const monkWeapon = isMonkWeapon(weapon, stats);
    const statOverride = weaponStatOverride(weapon, stats);
    const { stat } = resolveWeaponAttackStat(weapon.atkKey, prop, mods, statOverride);
    // Bonus de maîtrise à l'attaque seulement avec une arme maîtrisée (décision de Franck, PHB 2024)
    const proficiency = weaponProficiency(weapon, stats);

    const extraDmg = [];
    if (buffs.rage && stat === 'FOR') extraDmg.push({ die: String(getRageBonus(level)), type: 'Rage' });
    // Fureur divine (Voie du Zélote, PHB 2024) : pendant la Rage, avec toute arme ou la Frappe à mains
    // nues, quelle que soit la caractéristique ; une fois par tour (première créature touchée)
    const divineFury = buffs.rage ? divineFuryDie(stats) : '';
    if (divineFury) extraDmg.push({ die: divineFury, type: 'Fureur divine 1/tour' });
    if (buffs.hunterMark) extraDmg.push({ die: hunterMarkDie({ level, classSlug: slug }), type: 'Force' });
    // Boutons de sous-classe (lot 5) : Frénésie, Frappe effroyable, Goût du sang… (subclass-combat.js)
    extraDmg.push(...subclassBuffDamage(weapon, stats, buffs, stat));
    // Cogneur lourd (PHB 2024, « Expert en armes lourdes ») : arme Lourde, bonus de maîtrise
    if (buffs.heavyWeaponMaster && prop.toLowerCase().split(/[,;]/).some(p => p.trim().startsWith('lourde'))) {
        extraDmg.push({ die: String(pb), type: 'Cogneur lourd' });
    }
    // Attaque de charge (PHB 2024, « Charger » p. 202) : +1d8 à une attaque au corps à corps,
    // une fois par tour ; une arme de lancer reste une arme de corps à corps (weaponReach)
    if (buffs.charger && weaponReach(weapon).melee) extraDmg.push({ die: '1d8', type: 'Charge' });
    // L'Odysséen (Odyssée, Soldat vagabond, niveau 3) : Lance et Trident comptent comme Finesse
    if (buffs.sneakAttack && (prop.toLowerCase().includes('finesse') || isRanged || subclassFinesse(weapon, stats))) {
        extraDmg.push({ die: `${sneakAttackDice(level)}d6`, type: 'Sournoise' });
    }
    // Style Duel (Manuel des joueurs français p. 209) : +2 aux dégâts, arme de corps à corps tenue à une main sans autre
    // arme ; bouton allumé par le joueur (la fiche ne sait pas ce qu'il tient en main)
    const reach = weaponReach(weapon);
    // (l'attaque à mains nues n'est pas une arme : pas de Duel)
    if (buffs.dueling && reach.melee && !unarmed && !prop.toLowerCase().includes('deux mains')) extraDmg.push({ die: '2', type: 'Duel' });
    // Style Armes de lancer (Manuel des joueurs français p. 209) : +2 aux dégâts d'une attaque à distance avec une arme de
    // Lancer (rappel sous l'arme, featEffects)
    if (buffs.thrownWeapon) extraDmg.push({ die: '2', type: 'Armes de lancer' });
    // Style Archerie (Manuel des joueurs français p. 209) : +2 aux jets d'attaque avec les armes à distance (pas les
    // armes de corps à corps lancées)
    const attackBonuses = (stats.feats ?? []).includes('archerie') && !reach.melee && reach.ranged
        ? [{ value: 2, label: 'Archerie' }] : [];

    let dieOverride = config.dmgDieOverride || '';
    // Arts martiaux : le dé « à la place » de celui de l'arme, donc seulement s'il est plus gros
    if (monkWeapon && !dieOverride) dieOverride = biggerDie(getMartialArtsDie(level), (weapon.baseDmg || '').toString());
    // Attaque à mains nues : le plus gros dé parmi Arts martiaux, Bagarreur de tavernes (1d4) et
    // le style Combat à mains nues (1d6 ; 1d8 sans arme ni bouclier, rappel sous la ligne)
    if (unarmed && !config.dmgDieOverride) dieOverride = unarmedDie(dieOverride, stats.feats ?? []);
    // Collège de la Danse (Dégâts bardiques) : dé d'Inspiration bardique, s'il est plus gros
    const danceDie = config.dmgDieOverride ? '' : danceUnarmedDie(weapon, stats);
    if (danceDie) dieOverride = biggerDie(danceDie, dieOverride) || dieOverride;

    return {
        attack: calcWeaponAttack(weapon.atkKey, prop, mods, pb, config.magicBonus || 0, statOverride, attackBonuses, proficiency.proficient),
        damage: calcWeaponDamage(weapon.baseDmg || '', prop, mods, config.magicBonus || 0, statOverride,
            dieOverride, config.dmgTypeOverride || '', weapon.atkKey, extraDmg),
        proficiency
    };
}

/**
 * Attaque à mains nues ou arme de Moine, pour un Moine qui profite des Arts martiaux (PHB 2024
 * p. 101-102) : sans armure ni bouclier équipés ; armes de Moine = armes courantes de corps à corps
 * et armes de guerre de corps à corps Légères (pas la Fléchette, arme à distance).
 * La Voie du bouclier (Odyssée, guide du joueur p. 46, Technique arésienne, niveau 3) garde les Arts
 * martiaux avec un bouclier (shieldKeepsMartialArts, class-features.js).
 */
function isMonkWeapon(weapon, stats) {
    if (stats.classSlug !== 'monk') return false;
    const worn = stats.wornArmor ?? {};
    if (worn.light || worn.medium || worn.heavy) return false;
    if (worn.shield && !shieldKeepsMartialArts(stats)) return false;
    const prop = (weapon?.prop || '').toString().replace(/<[^>]*>/g, '');
    return isUnarmedStrike(weapon) || isMartialArtsWeapon(weapon?.category || '', !weaponReach(weapon).melee, prop);
}

/** Nombre de faces d'un dé (« 1d8 » → 8 ; dégâts fixes ou illisibles → 0) */
const dieFaces = (die) => Number(String(die).match(/^\s*\d*d(\d+)/i)?.[1] ?? 0);

/** Dé d'Arts martiaux s'il est plus gros que celui de l'arme (« 1d6 cont. »), sinon '' (dé de l'arme) */
function biggerDie(martialDie, baseDmg) {
    return dieFaces(martialDie) > dieFaces(baseDmg) ? martialDie : '';
}

/**
 * Caractéristique d'attaque imposée à une arme du tableau : celle de sa configuration, sinon la
 * Dextérité pour un Moine avec une arme de Moine ou à mains nues, si elle est meilleure que la Force
 * (PHB 2024 p. 102, Arts martiaux « Dexterous Attacks »), ou pour une Lance ou un Trident de L'Odysséen
 * (Odyssée, Soldat vagabond : propriété Finesse, Dextérité si elle est au moins égale à la Force).
 * '' : règle normale de l'arme.
 * Partagée avec les bottes d'armes (weapon-masteries.js) : mêmes chiffres que le tableau.
 * @param {Object} weapon - ligne de dynamic_weapons
 * @param {{ mods: Object, classSlug: string, wornArmor?: Object }} stats - issu de deriveCharacter()
 * @returns {string} 'str' | 'dex' | … | ''
 */
export function weaponStatOverride(weapon, stats) {
    const forced = parseWeaponConfig(weapon?.weaponConfig).statOverride;
    if (forced) return forced;
    if (isMonkWeapon(weapon, stats) && stats.mods.dex > stats.mods.str) return 'dex';
    // Collège de la Danse, Ascendance divine, Voie herculéenne (subclass-calcs.js)
    const bySubclass = subclassWeaponStat(weapon, stats);
    if (bySubclass) return bySubclass;
    return subclassFinesse(weapon, stats) && stats.mods.dex >= stats.mods.str ? 'dex' : '';
}

/**
 * Dé de l'attaque à mains nues : le plus gros parmi celui des Arts martiaux (déjà choisi, ou ''),
 * Bagarreur de tavernes (Manuel des joueurs français p. 200 : 1d4) et Combat à mains nues (p. 209 : 1d6).
 * '' si aucun : l'attaque fait alors 1 + mod. de Force.
 * @param {string} current - '' ou dé déjà retenu (« 1d8 »)
 * @param {string[]} feats - dons atteints
 * @returns {string}
 */
function unarmedDie(current, feats) {
    const dice = [current];
    if (feats.includes('bagarreur_de_tavernes')) dice.push('1d4');
    if (feats.includes('combat_a_mains_nues')) dice.push('1d6');
    return dice.reduce((best, die) => (dieFaces(die) > dieFaces(best) ? die : best), '');
}

/**
 * Calcule toutes les statistiques dérivées d'un personnage.
 * Champs liés aux dons :
 *  - feats : identifiants des dons atteints (reachedFeatIds) ;
 *  - initiative : mod. Dex, + bonus de maîtrise avec Vigilant ; initiativeDetail : « Dex +2, Vigilant +2 » ;
 *  - wornArmor : { light, medium, heavy, shield } — catégories des armures équipées ;
 *    shieldTrained : formation aux boucliers cochée (sans elle, le bouclier est sans effet).
 * Les notes de dons à afficher (rappels, « dont +X ») viennent de featEffects (feat-effects.js).
 * @param {Object} record - Personnage au format de sauvegarde (v3)
 * @returns {Object}
 */
export function deriveCharacter(record = {}) {
    const level = Math.max(1, Math.min(20, parseNumber(record.char_level, 1)));
    const pb = calculateProficiencyBonus(level);
    const className = (record.char_class || '').toString();
    const slug = classSlug(className);
    const subclass = subclassId(record.char_subclass, slug);

    const scores = {};
    const mods = {};
    const saves = {};
    for (const id of ABILITY_IDS) {
        scores[id] = parseNumber(record[`${id}_score`], 10);
        mods[id] = calcMod(scores[id]);
    }
    // Aura de protection (Paladin niveau 6) : à toutes les sauvegardes (class-features.js)
    const aura = auraOfProtectionBonus({ classSlug: slug, level, mods });
    for (const id of ABILITY_IDS) {
        const proficient = record[`${id}_save_prof`] === true;
        saves[id] = { proficient, aura, bonus: mods[id] + (proficient ? pb : 0) + aura };
    }
    // Touche-à-tout (Barde niveau 2) : aux compétences non maîtrisées (pas à l'Initiative)
    const jack = jackOfAllTradesBonus({ classSlug: slug, level, pb });

    const skills = {};
    for (const skill of SKILLS) {
        const expertise = record[`skill_exp_${skill.id}`] === true;
        // Règle D&D : l'Expertise implique la maîtrise
        const proficient = expertise || record[`skill_prof_${skill.id}`] === true;
        const jackBonus = proficient ? 0 : jack;
        // Errant féerique : Sagesse (minimum +1) aux tests de Charisme (subclass-calcs.js)
        const subclassBonus = subclassSkillBonus({ classSlug: slug, subclass, level, mods }, skill.stat);
        skills[skill.id] = {
            stat: skill.stat,
            proficient,
            expertise,
            jack: jackBonus,
            bonus: calculateSkillBonus(mods[skill.stat], proficient, expertise, pb) + jackBonus + subclassBonus
        };
    }

    // Dons atteints (emplacement feat_<N> avec N ≤ niveau). Seules les valeurs calculées par la
    // fiche peuvent intégrer un don ; les valeurs saisies à la main ne sont jamais modifiées.
    const feats = reachedFeatIds(record);
    // Vigilant (PHB 2024 « Alert », p. 200) : bonus de maîtrise ajouté au jet d'Initiative
    const alert = feats.includes('vigilant') ? pb : 0;
    const signedText = (n) => `${n >= 0 ? '+' : ''}${n}`;
    // Traqueur d'ombre (Sagesse), L'Odysséen niveau 13 (Charisme) : subclass-calcs.js
    const initiativeBonuses = subclassInitiativeBonuses({ classSlug: slug, subclass, level, mods });

    const armors = record.dynamic_armors || [];
    const worn = new Set((Array.isArray(armors) ? armors : [])
        .filter(armor => armor && armor.equipped).map(armorCategory));

    return {
        level,
        pb,
        className,
        classSlug: slug,
        subclass,
        // Choix de sous-classe valides (lot 7, clé subclass_choices) : { champ: valeur }
        subclassChoices: subclassChoice(record, { subclass, level }),
        auraOfProtection: aura,
        jackOfAllTrades: jack,
        scores,
        mods,
        saves,
        skills,
        feats,
        initiative: mods.dex + alert + initiativeBonuses.reduce((sum, bonus) => sum + bonus.value, 0),
        initiativeDetail: `Dex ${signedText(mods.dex)}` + (alert ? `, Vigilant ${signedText(alert)}` : '')
            + initiativeBonuses.map(bonus => `, ${bonus.label} ${signedText(bonus.value)}`).join(''),
        wornArmor: {
            light: worn.has('light'), medium: worn.has('medium'), heavy: worn.has('heavy'), shield: worn.has('shield'),
            shieldTrained: record.prof_armor_shield === true
        },
        passivePerception: 10 + skills.perception.bonus,
        armorClass: computeArmorClass({
            armors, className, mods, pb,
            shieldTrained: record.prof_armor_shield === true,
            mediumDexMax: mediumArmorDexMax(feats, scores.dex),
            defense: feats.includes('defense'),
            subclass, level
        }),
        spellcasting: computeSpellcasting(record.spell_ability, mods, pb),
        spellSlots: spellSlotsFor(className, level, subclass),
        classResource: getClassResourceInfo(level, className, mods),
        hitDie: hitDieForClass(className),
        exhaustion: exhaustionEffects(record.fatigue_level),
        renownTier: renownTier(record.glory_score)
    };
}
