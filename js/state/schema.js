// =============================================================================
// SCHEMA.JS - FORMAT DU PERSONNAGE (identique au format de sauvegarde v3)
//
// Le personnage est un dictionnaire « à plat » : une clé par champ de la fiche.
// Ce format est partagé avec la v3 (même base Supabase, mêmes fichiers JSON),
// donc on n'en renomme ni n'en supprime jamais une clé.
// =============================================================================

import { ABILITY_IDS, SKILLS } from '../data/constants.js';

/** Champs texte simples (listes déroulantes ou saisies sans mise en forme) */
export const PLAIN_TEXT_FIELDS = [
    'char_class', 'char_subclass', 'char_background', 'char_species',
    'heroic_inspiration', 'hd_type', 'hd_current', 'gp', 'sp', 'cp', 'ep', 'pp'
];

/** Champs « riches » : texte libre pouvant contenir de la mise en forme HTML (gras, couleur...) */
export const RICH_TEXT_FIELDS = [
    'char_name', 'char_size', 'char_xp', 'alignment',
    'ac', 'initiative', 'passive_perception', 'speed', 'hp_max', 'hp_current', 'hp_temp',
    'class_features', 'traits_feats', 'companions', 'synergy', 'appearance', 'backstory',
    'equipment', 'profs_weapons', 'profs_tools', 'langs'
];

/** Cases à cocher (toujours des booléens après migration) */
export const BOOLEAN_FIELDS = [
    ...ABILITY_IDS.map(id => `${id}_save_prof`),
    ...SKILLS.map(s => `skill_prof_${s.id}`),
    ...SKILLS.map(s => `skill_exp_${s.id}`),
    'ds_s1', 'ds_s2', 'ds_s3', 'ds_f1', 'ds_f2', 'ds_f3',
    'prof_armor_light', 'prof_armor_med', 'prof_armor_heavy', 'prof_armor_shield'
];

/** Paliers de dons (niveau d'acquisition D&D 2024) */
export const FEAT_LEVELS = [1, 4, 8, 12, 16, 19];

/**
 * Second don d'origine de l'Humain (trait Polyvalent, PHB 2024) : clé feat_0, acquise au niveau 1,
 * en plus du don de l'historique (feat_1). Clé ajoutée par la v4 seulement quand on la remplit
 * (absente de la fiche vierge) ; elle ne compte que pour un personnage d'espèce Humain.
 */
export const HUMAN_FEAT_SLOT = 0;

/**
 * Dons de classe en plus (PHB 2024, « Ability Score Improvement » répété) : Guerrier aux niveaux 6
 * et 14, Roublard au niveau 10. Clés feat_6, feat_14, feat_10 ajoutées par la v4 seulement quand
 * on les remplit (absentes de la fiche vierge) ; elles ne comptent que pour cette classe.
 */
export const CLASS_FEAT_SLOTS = Object.freeze({
    2: Object.freeze({ classes: Object.freeze(['fighter', 'paladin', 'ranger']), style: true }),
    6: Object.freeze({ classes: Object.freeze(['fighter']) }),
    7: Object.freeze({ classes: Object.freeze(['fighter']), subclass: 'champion', style: true }),
    10: Object.freeze({ classes: Object.freeze(['rogue']) }),
    14: Object.freeze({ classes: Object.freeze(['fighter']) })
});

/**
 * Style de combat (PHB 2024, capacité « Fighting Style ») : clé feat_2, un don de la catégorie
 * Style de combat, acquis au niveau 1 pour le Guerrier et au niveau 2 pour le Paladin et le Rôdeur
 * (featSlotLevelFor, js/rules/feats.js). Le Champion en reçoit un second au niveau 7 (feat_7).
 * Le Paladin et le Rôdeur peuvent prendre à la place Guerrier béni ou Guerrier druidique.
 */
export const STYLE_FEAT_SLOT = 2;

/** Emplacements de dons dans l'ordre de la fiche : celui de l'Humain juste après le niveau 1,
 *  le style de combat ensuite, ceux de classe à leur niveau */
export const FEAT_SLOT_ORDER = [1, HUMAN_FEAT_SLOT, STYLE_FEAT_SLOT, 4, 6, 7, 8, 10, 12, 14, 16, 19];

/**
 * Niveau auquel un emplacement est acquis (feat_0 : niveau 1)
 * @param {number|string} slot - numéro de l'emplacement (feat_<numéro>)
 * @returns {number}
 */
export function featSlotLevel(slot) {
    const n = Number(slot);
    return n === HUMAN_FEAT_SLOT ? 1 : n;
}

/** Valeurs par défaut des lignes des tableaux dynamiques */
export const EMPTY_WEAPON = {
    name: '', prop: '', prof: '', ammo: '', note: '',
    category: '', atkKey: '', baseDmg: '', weaponConfig: ''
};

export const EMPTY_SPELL = {
    lvl: '0', name: '', time: '', range: '', note: '',
    c: false, r: false, m: false, prep: false, school: ''
};

export const EMPTY_ARMOR = {
    name: '', type: 'none', ca: '', str: '', stealth: false,
    weight: '', price: '', comment: '', equipped: false
};

/**
 * Personnage vierge.
 * @returns {Object}
 */
export function createDefaultCharacter() {
    const record = {
        char_name: '',
        char_class: '',
        char_subclass: '',
        char_background: '',
        char_species: '',
        char_level: '1',
        char_size: '',
        char_xp: '0',
        alignment: '',

        ac: '',
        initiative: '',
        passive_perception: '',
        speed: '9m',
        heroic_inspiration: '',

        hp_max: '',
        hp_current: '',
        hp_temp: '0',
        hd_type: '',
        hd_current: '0',
        fatigue_level: 0,

        spell_ability: 'none',
        spell_class_filter: '',

        heroic_destiny: '',
        glory_score: '0',
        vanity_score: '0',

        gp: '0', sp: '0', cp: '0', ep: '0', pp: '0',

        dynamic_weapons: [],
        dynamic_spells: [],
        dynamic_armors: [],

        // --- Champs propres à la v4 (ignorés sans dommage par la v3) ---
        // Bonus de combat actifs : { rage: true, sneakAttack: false, hunterMark: false }
        combat_buffs: {},
        // Emplacements de sorts par niveau de sort : { "1": { max: 4, used: 1 }, ... }
        // max absent = valeur du manuel pour la classe et le niveau
        spell_slots_state: {}
    };

    for (const id of ABILITY_IDS) record[`${id}_score`] = '10';
    for (const field of RICH_TEXT_FIELDS) if (!(field in record)) record[field] = '';
    for (const field of BOOLEAN_FIELDS) record[field] = false;
    for (const level of FEAT_LEVELS) record[`feat_${level}`] = '';

    return record;
}
