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
        dynamic_armors: []
    };

    for (const id of ABILITY_IDS) record[`${id}_score`] = '10';
    for (const field of RICH_TEXT_FIELDS) if (!(field in record)) record[field] = '';
    for (const field of BOOLEAN_FIELDS) record[field] = false;
    for (const level of FEAT_LEVELS) record[`feat_${level}`] = '';

    return record;
}
