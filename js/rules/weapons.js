// =============================================================================
// WEAPONS.JS (règles) - Tableau des armes : fonctions pures, sans DOM
//  - filtres d'affichage (Courantes / Guerre / Corps à corps / Distance / Magiques)
//  - ligne d'arme remplie à partir du manuel (DD_RULES.weapons)
//  - configuration personnalisée d'une arme (champ weaponConfig, format v3)
//  - bonus de combat proposés selon la classe (Rage, Attaque sournoise, Marque du chasseur)
//    ou selon un don (Cogneur lourd, Expert de la charge)
//  - type de dégâts d'une arme (rappels des dons Trancheur, Broyeur, Perforateur)
//  - ligne vide (rien de saisi), masquée par l'affichage sauf une ligne de saisie
// =============================================================================

import { parseWeaponConfig } from './logic.js';
import { reachedFeatIds, subclassOf, characterLevel } from './feats.js';

export const WEAPON_FILTERS = ['all', 'simple', 'martial', 'melee', 'ranged', 'magic'];

/** Caractéristiques d'attaque proposées dans la configuration (clé v3 → libellé) */
export const WEAPON_STAT_OVERRIDES = ['str', 'dex', 'cha', 'wis', 'int'];

/** Types de dégâts proposés dans la configuration (abréviations v3) */
export const WEAPON_DAMAGE_TYPES = [
    'TRAN', 'CONT', 'PERF', 'FEU', 'FROID', 'NECR', 'RADI', 'FORCE',
    'PSYCH', 'POISON', 'ACIDE', 'FOUDRE', 'TONNERRE'
];

/**
 * Réglage « Maîtrisée » de la configuration (propriété facultative `proficiency` de weaponConfig,
 * ajoutée en 4.15.0) : 'auto' (la fiche décide, rien n'est écrit), 'yes', 'no'. La v3 lit
 * weaponConfig sans regarder les autres propriétés : elle l'ignore.
 */
export const WEAPON_PROFICIENCY_CHOICES = ['auto', 'yes', 'no'];

const DIE_SIZES = new Set([4, 6, 8, 10, 12, 20]);
const MAX_MAGIC_BONUS = 3;

/** Bonus de combat ouverts par chaque classe (clé de combat_buffs) */
const CLASS_BUFFS = {
    barbarian: ['rage'],
    rogue: ['sneakAttack'],
    ranger: ['hunterMark']
};

/** Bonus de combat ouverts par un don : clé de combat_buffs → identifiant du don (js/data/feats.js) */
const FEAT_BUFFS = {
    heavyWeaponMaster: 'maitre_des_armes_lourdes_cogneur_lourd',
    // Expert de la charge (PHB 2024 « Charger », p. 202) : +1d8 aux dégâts d'une attaque au corps à corps
    charger: 'expert_de_la_charge',
    // Style Duel (Manuel des joueurs français p. 209) : +2 aux dégâts à une main, sans autre arme
    dueling: 'duel',
    // Faveur de prouesse martiale (« Boon of Combat Prowess », p. 210) : Visée infaillible, une fois
    // par tour ; allumé = déjà utilisée ce tour (aucun calcul)
    peerlessAim: 'faveur_de_prouesse_martiale',
    // Faveur de l'esprit nocturne (« Boon of the Night Spirit », p. 211) : dans une lumière faible ou
    // les ténèbres ; allumé = repère de Résistance près de la CA (js/rules/feat-effects.js)
    nightSpirit: 'faveur_de_l_esprit_nocturne'
};

/**
 * Boutons ouverts par la sous-classe (lot 5) : clé de combat_buffs → [sous-classe, niveau].
 * Dégâts : subclassBuffDamage (js/rules/subclass-combat.js).
 */
const SUBCLASS_BUFFS = {
    // Berserker (PHB 2024) : Frénésie, avec Témérité pendant la Rage
    frenzy: ['path_of_the_berserker', 3],
    // Traqueur d'ombre : Frappe effroyable (usages en cases, onglet Combat)
    dreadfulStrike: ['gloom_stalker', 3],
    // Errant féerique : Frappes effroyables
    feyStrikes: ['fey_wanderer', 3],
    // Chasseur : Proie du chasseur, option Goût du sang
    colossusSlayer: ['hunter', 3],
    // Maître de guerre : dé de supériorité ajouté aux dégâts par une manœuvre
    superiority: ['battle_master', 3],
    // Guerrier psionique : Frappe psionique
    psionicStrike: ['psi_warrior', 3]
};

/** Début du type de dégâts écrit dans le manuel (« 1d8 tran. ») → abréviation v3 (WEAPON_DAMAGE_TYPES) */
const DAMAGE_TYPE_PREFIXES = [
    ['tran', 'TRAN'], ['cont', 'CONT'], ['perf', 'PERF'], ['perc', 'PERF'], ['feu', 'FEU'], ['froid', 'FROID'],
    ['necr', 'NECR'], ['radi', 'RADI'], ['force', 'FORCE'], ['psy', 'PSYCH'], ['poison', 'POISON'],
    ['acide', 'ACIDE'], ['foudre', 'FOUDRE'], ['tonnerre', 'TONNERRE']
];

/** Champs d'une ligne d'arme qui, remplis, en font une vraie ligne (format v3, voir EMPTY_WEAPON) */
const WEAPON_CONTENT_KEYS = ['name', 'prop', 'prof', 'ammo', 'note', 'atk', 'dmg', 'atkKey', 'baseDmg', 'weaponConfig'];

/** Texte brut (les anciennes sauvegardes peuvent contenir un peu de HTML) */
function plain(value) {
    return (value ?? '').toString()
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim();
}

function fold(value) {
    return plain(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Portée d'une arme d'après ses propriétés (règles D&D 2024, PHB « Weapons ») :
 *  - Munitions : arme à distance uniquement ;
 *  - Lancer : arme de corps à corps qui peut aussi être lancée (attaque à distance),
 *    elle apparaît donc dans les deux filtres (Dague, Hachette, Javeline...) ;
 *  - la Fléchette est classée par le manuel parmi les « armes courantes à distance »
 *    alors qu'elle n'a que la propriété Lancer : elle est à distance uniquement.
 * @param {{ name?: string, prop?: string }} weapon
 * @returns {{ melee: boolean, ranged: boolean }}
 */
export function weaponReach(weapon) {
    const prop = fold(weapon?.prop);
    if (prop.includes('munitions')) return { melee: false, ranged: true };
    if (fold(weapon?.name).startsWith('flechette')) return { melee: false, ranged: true };
    if (prop.includes('lancer')) return { melee: true, ranged: true };
    return { melee: true, ranged: false };
}

/** Noms reconnus de la ligne à mains nues, sans accents : celui du livre français, puis l'ancien */
const UNARMED_NAMES = ['attaque a mains nues', 'frappe a mains nues'];

/**
 * Ligne « Attaque à mains nues » (catalogue DD_RULES.weapons, PHB 2024 « Unarmed Strike ») ? Par sa
 * catégorie « Mains nues » (nom au pluriel ou retouché, rattaché au manuel) ou par son nom. Jusqu'à la
 * 4.37.0, la ligne s'appelait « Frappe à mains nues » : les lignes déjà enregistrées gardent ce nom,
 * qui reste reconnu (le nom enregistré n'est jamais modifié).
 * @param {{ name?: string, category?: string }} weapon
 * @returns {boolean}
 */
export function isUnarmedStrike(weapon) {
    const name = fold(weapon?.name);
    return fold(weapon?.category) === 'mains nues'
        || UNARMED_NAMES.some(prefix => name.startsWith(prefix));
}

/**
 * Arbalète (PHB 2024 « Crossbow Expert » : arbalète de poing, légère, lourde) ?
 * @param {{ name?: string }} weapon
 * @returns {boolean}
 */
export function isCrossbow(weapon) {
    return fold(weapon?.name).startsWith('arbalete');
}

/**
 * Type de dégâts d'une arme : celui imposé dans sa configuration, sinon celui du manuel
 * écrit après le dé (« 1d12 tran. » → 'TRAN'), comme calcWeaponDamage (logic.js).
 * @param {{ baseDmg?: string, weaponConfig?: string|Object }} weapon
 * @returns {string} abréviation de WEAPON_DAMAGE_TYPES, ou '' si inconnu
 */
export function weaponDamageType(weapon) {
    const override = parseWeaponConfig(weapon?.weaponConfig).dmgTypeOverride;
    if (WEAPON_DAMAGE_TYPES.includes(override)) return override;
    const match = fold(weapon?.baseDmg).match(/^(?:\d*d\d+|\d+)\s*([a-z]+)/);
    if (!match) return '';
    return DAMAGE_TYPE_PREFIXES.find(([prefix]) => match[1].startsWith(prefix))?.[1] || '';
}

/**
 * La ligne doit-elle être affichée avec ce filtre ?
 * Une ligne sans nom reste toujours visible (ligne qu'on est en train d'ajouter).
 * @param {Object} weapon - ligne de dynamic_weapons
 * @param {string} filter - 'all' | 'simple' | 'martial' | 'melee' | 'ranged' | 'magic' (bonus magique +1 à +3)
 * @returns {boolean}
 */
export function matchesWeaponFilter(weapon, filter) {
    if (!filter || filter === 'all' || !WEAPON_FILTERS.includes(filter)) return true;
    if (!plain(weapon?.name)) return true;
    const category = fold(weapon?.category);
    switch (filter) {
        case 'simple': return category.includes('courante');
        case 'martial': return category.includes('guerre');
        case 'melee': return weaponReach(weapon).melee;
        case 'ranged': return weaponReach(weapon).ranged;
        case 'magic': return readWeaponConfig(weapon?.weaponConfig).magicBonus > 0;
        default: return true;
    }
}

/**
 * Ligne remplie après un choix dans la liste des armes du manuel.
 * Les clés inconnues de la ligne (anciennes sauvegardes) et ses munitions / notes sont conservées.
 * @param {Object} row - ligne existante
 * @param {{ name: string, atk: string, dmg: string, prop: string, prof: string, category: string }} ref
 * @returns {Object}
 */
export function rowFromRulebookWeapon(row, ref) {
    return {
        ...row,
        name: ref.name,
        atkKey: ref.atk,
        baseDmg: ref.dmg,
        prop: ref.prop,
        prof: ref.prof,
        category: ref.category || ''
    };
}

/**
 * Nom saisi à la main et reconnu dans le manuel : complète les champs de calcul vides,
 * sans toucher au nom tel qu'il a été écrit ni aux champs déjà remplis.
 * @param {Object} row
 * @param {Object|null} ref - résultat de findRulebookWeapon(row.name)
 * @returns {Object} la ligne inchangée si rien n'est à compléter
 */
export function completeRowFromRulebook(row, ref) {
    if (!ref || row.atkKey) return row;
    return {
        ...row,
        atkKey: ref.atk,
        baseDmg: plain(row.baseDmg) ? row.baseDmg : ref.dmg,
        category: plain(row.category) ? row.category : (ref.category || ''),
        prop: plain(row.prop) ? row.prop : ref.prop,
        prof: plain(row.prof) ? row.prof : ref.prof
    };
}

/**
 * Valide un dé de dégâts saisi (« 1d8 », « 2D6 »...). Vide = pas de remplacement.
 * @param {string} value
 * @returns {{ ok: boolean, value: string }}
 */
export function normalizeDamageDie(value) {
    const text = (value ?? '').toString().trim().toLowerCase().replace(/\s+/g, '');
    if (!text) return { ok: true, value: '' };
    const match = text.match(/^(\d{1,2})d(\d{1,2})$/);
    if (!match) return { ok: false, value: text };
    const count = Number(match[1]);
    const size = Number(match[2]);
    if (count < 1 || count > 20 || !DIE_SIZES.has(size)) return { ok: false, value: text };
    return { ok: true, value: `${count}d${size}` };
}

/** Texte d'une ancienne valeur libre (sans transformation autre que trim) */
function legacyText(value) {
    return value === null || value === undefined || typeof value === 'object' ? '' : String(value).trim();
}

/**
 * Configuration d'une arme lue pour le formulaire : valeurs inconnues ramenées à « Auto ».
 * Exception : un dé de dégâts libre saisi en v3 (« 1d8+1d6 », « 2d4 + 1 »...) que la
 * validation stricte refuse est rendu tel quel, pour ne jamais l'effacer en silence
 * (computeWeapon l'utilise toujours et buildWeaponConfig le conserve s'il n'est pas modifié).
 * @param {string|Object} raw - champ weaponConfig (chaîne JSON en v3)
 * @returns {{ statOverride: string, magicBonus: number, dmgDieOverride: string, dmgTypeOverride: string,
 *             proficiency: 'auto'|'yes'|'no' }}
 */
export function readWeaponConfig(raw) {
    const config = parseWeaponConfig(raw);
    const magic = parseInt(config.magicBonus, 10);
    const die = normalizeDamageDie(config.dmgDieOverride);
    return {
        statOverride: WEAPON_STAT_OVERRIDES.includes(config.statOverride) ? config.statOverride : '',
        magicBonus: Number.isFinite(magic) ? Math.max(0, Math.min(MAX_MAGIC_BONUS, magic)) : 0,
        dmgDieOverride: die.ok ? die.value : legacyText(config.dmgDieOverride),
        dmgTypeOverride: WEAPON_DAMAGE_TYPES.includes(config.dmgTypeOverride) ? config.dmgTypeOverride : '',
        proficiency: WEAPON_PROFICIENCY_CHOICES.includes(config.proficiency) ? config.proficiency : 'auto'
    };
}

/**
 * Valide le formulaire de configuration et produit la chaîne JSON à enregistrer (format v3 :
 * {statOverride, magicBonus, dmgDieOverride, dmgTypeOverride}, plus `proficiency` : 'yes' ou 'no'
 * seulement si le joueur a choisi ; « Auto » n'écrit rien et efface un ancien choix). Les autres clés éventuellement
 * présentes dans l'ancienne configuration sont conservées, de même qu'un ancien dé de dégâts
 * libre (format v3) laissé tel quel dans le formulaire.
 * @param {Object} input - valeurs du formulaire
 * @param {string|Object} [previous] - ancienne valeur de weaponConfig
 * @returns {{ ok: true, value: string } | { ok: false, errors: Object<string, string> }}
 */
export function buildWeaponConfig(input, previous = '') {
    const errors = {};
    const previousConfig = parseWeaponConfig(previous);
    const statOverride = (input?.statOverride ?? '').toString();
    if (statOverride && !WEAPON_STAT_OVERRIDES.includes(statOverride)) {
        errors.statOverride = 'Caractéristique inconnue.';
    }
    const magicBonus = Number(input?.magicBonus ?? 0);
    if (!Number.isInteger(magicBonus) || magicBonus < 0 || magicBonus > MAX_MAGIC_BONUS) {
        errors.magicBonus = 'Le bonus magique va de +0 à +3.';
    }
    let die = normalizeDamageDie(input?.dmgDieOverride);
    const legacyDie = legacyText(previousConfig.dmgDieOverride);
    if (!die.ok && legacyDie && legacyText(input?.dmgDieOverride) === legacyDie) {
        die = { ok: true, value: legacyDie };
    }
    if (!die.ok) {
        errors.dmgDieOverride = 'Format attendu : nombre de dés, « d », taille du dé (ex. 1d8, 2d6). Dés : d4, d6, d8, d10, d12, d20.';
    }
    const dmgTypeOverride = (input?.dmgTypeOverride ?? '').toString();
    if (dmgTypeOverride && !WEAPON_DAMAGE_TYPES.includes(dmgTypeOverride)) {
        errors.dmgTypeOverride = 'Type de dégâts inconnu.';
    }
    const proficiency = (input?.proficiency ?? 'auto').toString() || 'auto';
    if (!WEAPON_PROFICIENCY_CHOICES.includes(proficiency)) {
        errors.proficiency = 'Réglage de maîtrise inconnu.';
    }
    if (Object.keys(errors).length) return { ok: false, errors };

    const { proficiency: _previousProficiency, ...kept } = previousConfig;
    return {
        ok: true,
        value: JSON.stringify({
            ...kept,
            statOverride,
            magicBonus,
            dmgDieOverride: die.value,
            dmgTypeOverride,
            ...(proficiency === 'auto' ? {} : { proficiency })
        })
    };
}

/**
 * Bonus de combat proposés pour une classe.
 * @param {string} slug - identifiant de classe (deriveCharacter().classSlug)
 * @returns {string[]} clés de combat_buffs
 */
export function buffsForClass(slug) {
    return CLASS_BUFFS[slug] ? [...CLASS_BUFFS[slug]] : [];
}

/**
 * Bonus réellement appliqués aux dégâts : seulement ceux que la classe actuelle (et, si le
 * personnage est fourni, ses dons) propose ; un bonus resté actif après un changement de
 * classe ou de don n'est plus compté.
 * @param {string} slug
 * @param {Object} buffs - combat_buffs
 * @param {Object} [character] - pour les bonus ouverts par un don (Cogneur lourd, Expert de la charge)
 * @returns {{ rage: boolean, sneakAttack: boolean, hunterMark: boolean, heavyWeaponMaster: boolean, charger: boolean,
 *   dueling: boolean, peerlessAim: boolean, nightSpirit: boolean }}
 */
export function effectiveBuffs(slug, buffs, character, derived) {
    const allowed = character ? buffsForCharacter(slug, character, derived) : buffsForClass(slug);
    const on = (key) => allowed.includes(key) && buffs?.[key] === true;
    return {
        rage: on('rage'), sneakAttack: on('sneakAttack'), hunterMark: on('hunterMark'),
        heavyWeaponMaster: on('heavyWeaponMaster'), charger: on('charger'), dueling: on('dueling'),
        peerlessAim: on('peerlessAim'), nightSpirit: on('nightSpirit'),
        ...Object.fromEntries(Object.keys(SUBCLASS_BUFFS).map(key => [key, on(key)]))
    };
}

/**
 * Bonus de combat ouverts par la sous-classe du personnage, une fois son niveau atteint.
 * @param {Object} character
 * @param {{ subclass: string, level: number }} [derived] - deriveCharacter(character) : sous-classe
 *        reconnue comme partout ailleurs (accents, apostrophes) ; sinon lue dans character
 * @returns {string[]} clés de combat_buffs
 */
export function subclassBuffs(character, derived) {
    const subclass = derived?.subclass ?? subclassOf(character);
    const level = derived?.level ?? characterLevel(character?.char_level);
    return Object.entries(SUBCLASS_BUFFS)
        .filter(([, [id, minLevel]]) => id === subclass && level >= minLevel)
        // Chasseur : pas de bouton Goût du sang si Briseur de hordes est choisi (lot 7, subclass_choices)
        .filter(([key]) => !(key === 'colossusSlayer' && derived?.subclassChoices?.prey === 'horde'))
        .map(([key]) => key);
}

/**
 * Bonus de combat ouverts par les dons du personnage : le don doit être choisi dans un
 * emplacement (feat_<niveau>) que le personnage a atteint. Un don prévu pour plus tard
 * n'ouvre rien.
 * @param {Object} character
 * @returns {string[]} clés de combat_buffs
 */
export function featBuffs(character) {
    const reachedFeats = reachedFeatIds(character);
    return Object.entries(FEAT_BUFFS)
        .filter(([, featId]) => reachedFeats.includes(featId))
        .map(([key]) => key);
}

/**
 * Tous les bonus de combat proposés au personnage : ceux de sa classe, puis ceux de ses dons.
 * @param {string} slug - identifiant de classe
 * @param {Object} character
 * @returns {string[]}
 */
export function buffsForCharacter(slug, character, derived) {
    return [...buffsForClass(slug), ...subclassBuffs(character, derived), ...featBuffs(character)];
}

/**
 * Ligne d'arme vide : rien n'a été saisi (ancienne ligne ajoutée puis laissée vide).
 * @param {Object} weapon
 * @returns {boolean}
 */
export function isBlankWeapon(weapon) {
    if (!weapon || typeof weapon !== 'object') return true;
    return WEAPON_CONTENT_KEYS.every(key => plain(weapon[key]) === '');
}

/**
 * Bascule un bonus de combat (nouvel objet, l'ancien n'est pas modifié).
 * @param {Object} buffs
 * @param {string} key
 * @returns {Object}
 */
export function toggleBuff(buffs, key) {
    const current = buffs && typeof buffs === 'object' ? buffs : {};
    return { ...current, [key]: current[key] !== true };
}

/**
 * Supprime une ligne (nouveau tableau).
 * @param {Array} weapons
 * @param {number} index
 * @returns {Array}
 */
export function removeWeapon(weapons, index) {
    return (weapons || []).filter((_, i) => i !== index);
}

/**
 * Réinsère une ligne supprimée à sa place d'origine (ou à la fin si le tableau a raccourci).
 * @param {Array} weapons
 * @param {number} index
 * @param {Object} row
 * @returns {Array}
 */
export function restoreWeapon(weapons, index, row) {
    const list = [...(weapons || [])];
    list.splice(Math.max(0, Math.min(index, list.length)), 0, row);
    return list;
}
