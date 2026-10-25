// =============================================================================
// MIGRATE.JS - NORMALISATION DES SAUVEGARDES (v1 → v3 → v4)
//
// Toute donnée qui entre dans l'application (fichier importé, localStorage,
// Supabase) passe par migrateCharacter(). La fonction :
//  - complète les champs manquants avec les valeurs par défaut,
//  - convertit les anciens formats (dés de vie, armes, armures...),
//  - ne supprime JAMAIS une clé inconnue (elle est conservée telle quelle),
//  - renvoie un rapport lisible de ce qui a été modifié.
// Elle est pure et idempotente : migrer deux fois donne le même résultat.
// =============================================================================

import { DD_RULES } from '../data/dd-rules.js';
import { EQUIPMENT_DATA } from '../data/equipment.js';
import { ABILITY_IDS } from '../data/constants.js';
import {
    createDefaultCharacter, PLAIN_TEXT_FIELDS, BOOLEAN_FIELDS,
    EMPTY_WEAPON, EMPTY_SPELL, EMPTY_ARMOR
} from './schema.js';

/**
 * Retire les balises HTML et décode les entités courantes (champs texte simples).
 * @param {*} value
 * @returns {*}
 */
export function stripHTML(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .trim();
}

/**
 * Normalise un nom d'arme pour la recherche dans le manuel :
 * "Hache à 2 mains (1)" → "hache à deux mains", "Hachettes" → "hachette"
 */
function normalizeWeaponName(name) {
    return stripHTML(name || '').toLowerCase()
        .replace(/\(\d+\)/g, '')
        .replace(/à 2 mains/g, 'à deux mains')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Forme sans « s » final de chaque mot : "hachettes" → "hachette", "maillet d'armes" → "maillet d'arme" */
const singular = (text) => text.split(' ').map(word => (word.length > 3 ? word.replace(/s$/, '') : word)).join(' ');

/**
 * Retrouve une arme du manuel à partir du nom saisi
 * (correspondance exacte après normalisation, au singulier comme au pluriel).
 * @param {string} name
 * @returns {Object|null}
 */
export function findRulebookWeapon(name) {
    const clean = normalizeWeaponName(name);
    if (!clean) return null;
    return DD_RULES.weapons.find(w => w.name.toLowerCase() === clean)
        || DD_RULES.weapons.find(w => singular(w.name.toLowerCase()) === singular(clean))
        || null;
}

function migrateWeapon(raw, report) {
    const weapon = { ...EMPTY_WEAPON, ...(raw && typeof raw === 'object' ? raw : {}) };

    // Anciennes sauvegardes : { name, atk: "+6", dmg: "1D12+4" } sans données de calcul.
    // On rattache l'arme au manuel pour activer le calcul automatique (atk/dmg d'origine conservés).
    if (!weapon.atkKey && weapon.name) {
        const ref = findRulebookWeapon(weapon.name);
        if (ref) {
            weapon.atkKey = ref.atk;
            weapon.baseDmg = ref.dmg;
            if (!weapon.category) weapon.category = ref.category;
            if (!stripHTML(weapon.prop)) weapon.prop = ref.prop;
            if (!stripHTML(weapon.prof)) weapon.prof = ref.prof;
            report.push(`Arme « ${stripHTML(weapon.name)} » rattachée au manuel (${ref.name}) pour le calcul automatique.`);
        }
    }
    if (weapon.weaponConfig && typeof weapon.weaponConfig === 'object') {
        weapon.weaponConfig = JSON.stringify(weapon.weaponConfig);
    }
    return weapon;
}

function migrateArmor(raw, report) {
    const armor = { ...EMPTY_ARMOR, ...(raw && typeof raw === 'object' ? raw : {}) };
    if (!raw || !raw.type) {
        const name = stripHTML(armor.name).toLowerCase();
        const ref = EQUIPMENT_DATA.armors.find(a => a.name.toLowerCase() === name);
        if (ref) {
            armor.type = ref.type;
            report.push(`Armure « ${stripHTML(armor.name)} » : type « ${ref.type} » déduit du manuel.`);
        }
    }
    armor.stealth = armor.stealth === true;
    armor.equipped = armor.equipped === true;
    return armor;
}

function migrateSpell(raw) {
    const spell = { ...EMPTY_SPELL, ...(raw && typeof raw === 'object' ? raw : {}) };
    // Mêmes règles de lecture que la v3 : case cochée si valeur « vraie »,
    // « préparé » sauf si vide, false ou "0" ; niveau vide = sort mineur (0)
    for (const flag of ['c', 'r', 'm']) spell[flag] = Boolean(spell[flag]);
    spell.prep = ![undefined, null, '', false, '0'].includes(spell.prep);
    spell.lvl = stripHTML(String(spell.lvl ?? '')) || '0';
    return spell;
}

const hasNumber = (v) => (typeof v === 'number' ? v !== 0 : typeof v === 'string' && /\d/.test(v));

/**
 * Normalise un personnage provenant de n'importe quelle version.
 * @param {*} input - Données brutes (objet issu d'un JSON)
 * @returns {{ character: Object, report: string[] }}
 */
export function migrateCharacter(input) {
    const report = [];
    const raw = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    if (raw !== input) report.push('Données illisibles : fiche vierge créée.');

    // 1. Valeurs par défaut, puis toutes les clés d'origine (y compris inconnues)
    const character = { ...createDefaultCharacter(), ...raw };

    // 2. Champs texte simples : sans HTML
    for (const field of PLAIN_TEXT_FIELDS) {
        if (typeof character[field] === 'string') character[field] = stripHTML(character[field]);
        else if (character[field] === null || character[field] === undefined) character[field] = '';
        else character[field] = String(character[field]);
    }

    // 3. Cases à cocher : null / absent → false
    for (const field of BOOLEAN_FIELDS) character[field] = character[field] === true;

    // 4. Caractéristiques et niveau toujours lisibles
    for (const id of ABILITY_IDS) {
        if (!hasNumber(character[`${id}_score`])) character[`${id}_score`] = '10';
    }
    if (!hasNumber(character.char_level)) character.char_level = '1';

    // 5. Ancien format des dés de vie : hd_total "D12" / hd_spent "3?"
    if (!raw.hd_type && typeof raw.hd_total === 'string') {
        const die = raw.hd_total.toLowerCase().match(/d(6|8|10|12)/);
        if (die) {
            character.hd_type = `d${die[1]}`;
            report.push(`Dé de vie converti depuis l'ancien format (${raw.hd_total} → ${character.hd_type}).`);
        }
    }
    if (raw.hd_current === undefined && raw.hd_spent !== undefined) {
        const spent = String(raw.hd_spent).match(/\d+/);
        character.hd_current = spent ? spent[0] : '0';
        report.push(`Dés de vie utilisés repris de l'ancien champ (« ${raw.hd_spent} » → ${character.hd_current}).`);
    }

    // 6. Ancien champ des maîtrises d'armes
    if (raw.profs_other && !raw.profs_weapons) {
        character.profs_weapons = raw.profs_other;
        report.push('Maîtrises d\'armes reprises de l\'ancien champ « profs_other ».');
    }

    // 7. Épuisement : nombre entre 0 et 6
    const fatigue = parseInt(character.fatigue_level, 10);
    character.fatigue_level = Number.isFinite(fatigue) ? Math.max(0, Math.min(6, fatigue)) : 0;

    // 8. Champs v4 de type objet (bonus de combat, emplacements de sorts)
    for (const field of ['combat_buffs', 'spell_slots_state']) {
        const value = character[field];
        character[field] = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    // 9. Tableaux dynamiques
    character.dynamic_weapons = Array.isArray(raw.dynamic_weapons) ? raw.dynamic_weapons.map(w => migrateWeapon(w, report)) : [];
    character.dynamic_armors = Array.isArray(raw.dynamic_armors) ? raw.dynamic_armors.map(a => migrateArmor(a, report)) : [];
    character.dynamic_spells = Array.isArray(raw.dynamic_spells) ? raw.dynamic_spells.map(migrateSpell) : [];

    return { character, report };
}
