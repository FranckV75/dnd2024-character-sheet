// =============================================================================
// REST.JS - REPOS COURT ET REPOS LONG (FONCTIONS PURES, D&D 2024)
//
// Règles du Manuel des joueurs 2024 (glossaire, « Short Rest » / « Long Rest ») :
//  - Repos court : on peut dépenser des dés de vie ; chaque dé rend 1 dé + modificateur
//    de Constitution, avec un minimum de 1 PV par dé. Les capacités « repos court »
//    se rechargent selon leur description (une utilisation ou toutes).
//  - Repos long : tous les PV et TOUS les dés de vie dépensés sont récupérés,
//    l'Épuisement baisse de 1, les PV temporaires disparaissent (ils durent
//    « jusqu'à la fin d'un repos long »).
//  - Pour commencer l'un ou l'autre, il faut avoir au moins 1 PV.
//
// Chaque fonction renvoie un « patch » pour store.update() : un objet neuf,
// le personnage reçu n'est jamais modifié.
// =============================================================================

import { deriveCharacter, parseNumber } from './character.js';

export const DEATH_SAVE_KEYS = ['ds_s1', 'ds_s2', 'ds_s3', 'ds_f1', 'ds_f2', 'ds_f3'];

const CLASS_RES_KEY = /^class_res_\d+$/;

/**
 * Nombre de faces d'un dé de vie ("d10" → 10).
 * @param {string} hdType - valeur de `hd_type`
 * @param {string} [fallback] - dé de la classe si `hd_type` est vide
 * @returns {number} - 0 si inconnu
 */
export function hitDieFaces(hdType, fallback = '') {
    for (const value of [hdType, fallback]) {
        const match = String(value ?? '').replace(/<[^>]*>/g, '').match(/d\s*(\d+)/i);
        if (match) return parseInt(match[1], 10);
    }
    return 0;
}

/**
 * État des dés de vie : `hd_current` contient le nombre de dés DÉJÀ UTILISÉS (comme en v3).
 * @param {Object} character
 * @returns {{ level: number, used: number, available: number, faces: number, conMod: number }}
 */
export function hitDiceState(character) {
    const d = deriveCharacter(character);
    const used = Math.max(0, Math.min(d.level, parseNumber(character.hd_current, 0)));
    return {
        level: d.level,
        used,
        available: d.level - used,
        faces: hitDieFaces(character.hd_type, d.hitDie),
        conMod: d.mods.con
    };
}

/**
 * PV rendus par des dés de vie : chaque dé rend (résultat + mod. CON), minimum 1.
 * @param {number[]} rolls - résultats des dés
 * @param {number} conMod - modificateur de Constitution
 * @returns {number}
 */
export function hitDiceHealing(rolls, conMod) {
    const mod = Number.isFinite(conMod) ? Math.trunc(conMod) : 0;
    return (rolls || []).reduce((total, roll) => total + Math.max(1, Math.trunc(Number(roll) || 0) + mod), 0);
}

/**
 * Lit les résultats saisis à la main : soit le total des dés ("12"), soit chaque dé ("5 4 3").
 * Avec un seul total, le minimum de 1 PV par dé est appliqué globalement
 * (exact dès que le modificateur de Constitution est positif ou nul).
 * @param {string} text
 * @param {number} diceCount - nombre de dés dépensés
 * @param {number} faces - faces du dé de vie (0 = inconnu, pas de contrôle du maximum)
 * @param {number} conMod
 * @returns {{ ok: true, healing: number, rolls: number[] } | { ok: false, error: string }}
 */
export function parseManualHitDice(text, diceCount, faces, conMod) {
    const values = String(text ?? '').match(/-?\d+/g)?.map(Number) || [];
    if (values.length === 0) return { ok: false, error: 'Saisissez le résultat des dés.' };

    if (values.length === diceCount && diceCount > 1) {
        const bad = values.find(v => v < 1 || (faces && v > faces));
        if (bad !== undefined) return { ok: false, error: `Chaque dé doit valoir entre 1 et ${faces || '…'}.` };
        return { ok: true, healing: hitDiceHealing(values, conMod), rolls: values };
    }
    if (values.length !== 1) {
        return { ok: false, error: `Saisissez le total des dés, ou ${diceCount} résultat(s) séparés par des espaces.` };
    }
    const total = values[0];
    const max = faces ? diceCount * faces : Infinity;
    if (total < diceCount || total > max) {
        return { ok: false, error: `Le total doit être compris entre ${diceCount} et ${faces ? max : '…'}.` };
    }
    return { ok: true, healing: Math.max(diceCount, total + diceCount * conMod), rolls: [total] };
}

/**
 * Lit un nombre de PV saisi librement ; null si la case ne contient aucun nombre.
 * @param {*} value
 * @returns {number|null}
 */
export function readHitPoints(value) {
    return parseNumber(value, null);
}

/**
 * Le personnage peut-il commencer un repos ? (il faut au moins 1 PV ; PV non renseignés = oui)
 * @param {Object} character
 * @returns {boolean}
 */
export function canStartRest(character) {
    const hp = readHitPoints(character.hp_current);
    return hp === null || hp >= 1;
}

/** Indices (croissants) des cases de ressource de classe cochées, parmi les `count` affichées */
function usedResourceSlots(character, count) {
    const used = [];
    for (let i = 0; i < count; i++) if (character[`class_res_${i}`] === true) used.push(i);
    return used;
}

/**
 * Copie de spell_slots_state avec les emplacements utilisés remis à 0 ; null si rien à changer.
 * @param {Object} state
 * @param {(level: string) => boolean} [shouldReset] - niveaux à remettre à 0 (tous par défaut)
 */
function resetSpellSlots(state, shouldReset = () => true) {
    if (!state || typeof state !== 'object') return null;
    let changed = false;
    const next = {};
    for (const [level, entry] of Object.entries(state)) {
        if (shouldReset(level) && entry && typeof entry === 'object' && Number(entry.used) > 0) {
            next[level] = { ...entry, used: 0 };
            changed = true;
        } else {
            next[level] = entry;
        }
    }
    return changed ? next : null;
}

/** Nombre total d'emplacements de sorts utilisés (sur les niveaux retenus par `includes`) */
function usedSpellSlots(state, includes = () => true) {
    if (!state || typeof state !== 'object') return 0;
    return Object.entries(state).reduce((n, [level, e]) =>
        n + (includes(level) && e && typeof e === 'object' ? Math.max(0, Number(e.used) || 0) : 0), 0);
}

/**
 * Capacité qui permet de récupérer des emplacements de sorts au repos court (une fois par repos long),
 * à cocher par le joueur : Restauration arcanique (Magicien) ou Récupération naturelle
 * (Druide du Cercle de la Terre, niv. 6+). Niveaux cumulés ≤ moitié du niveau (arrondi supérieur),
 * aucun emplacement de niveau 6+.
 * @returns {{ name: string, maxLevels: number } | null}
 */
function slotRecoveryFeature(character, d) {
    const maxLevels = Math.ceil(d.level / 2);
    if (d.classSlug === 'wizard') return { name: 'Restauration arcanique', maxLevels };
    const subclass = String(character.char_subclass ?? '').replace(/<[^>]*>/g, '').toLowerCase();
    if (d.classSlug === 'druid' && d.level >= 6 && /terre|land/.test(subclass)) {
        return { name: 'Récupération naturelle', maxLevels };
    }
    return null;
}

/**
 * Calcule un repos court.
 * @param {Object} character
 * @param {{ diceSpent?: number, healing?: number, sorcerousRestoration?: boolean }} [options]
 *        healing = PV rendus par les dés (déjà calculés par hitDiceHealing ou saisis) ;
 *        sorcerousRestoration = Ensorceleur niv. 5+ qui utilise Restauration ensorcelée
 * @returns {{ patch: Object, summary: Object }}
 */
export function planShortRest(character, { diceSpent = 0, healing = 0, sorcerousRestoration = false } = {}) {
    const d = deriveCharacter(character);
    const hd = hitDiceState(character);
    const patch = {};

    // --- Dés de vie et PV ---
    const spent = Math.max(0, Math.min(hd.available, Math.trunc(Number(diceSpent) || 0)));
    const heal = spent > 0 ? Math.max(0, Math.trunc(Number(healing) || 0)) : 0;
    const hpBefore = readHitPoints(character.hp_current);
    const hpMax = readHitPoints(character.hp_max);
    let hpAfter = hpBefore;
    if (heal > 0) {
        const current = hpBefore ?? 0;
        const raised = current + heal;
        hpAfter = hpMax === null ? raised : Math.max(current, Math.min(raised, hpMax));
        if (hpAfter !== hpBefore) patch.hp_current = String(hpAfter);
        // Regagner des PV remet les jets contre la mort à zéro
        for (const key of DEATH_SAVE_KEYS) if (character[key] === true) patch[key] = false;
    }
    if (spent > 0) patch.hd_current = String(hd.used + spent);

    // --- Ressource de classe (cases cochées = utilisations dépensées) ---
    const { count, label, reset } = d.classResource;
    const used = usedResourceSlots(character, count);
    let toRestore = [];
    if (reset === 'all') toRestore = used;
    else if (reset === 'one') toRestore = used.slice(-1);
    else if (sorcerousRestoration && d.classSlug === 'sorcerer' && d.level >= 5) {
        // Restauration ensorcelée : jusqu'à la moitié du niveau d'Ensorceleur (arrondi inférieur)
        toRestore = used.slice(-Math.floor(d.level / 2));
    }
    for (const i of toRestore) patch[`class_res_${i}`] = false;

    // --- Magie de pacte (Sorcier) : seuls les emplacements de pacte reviennent ---
    // Les niveaux de pacte sont ceux que donne la table du Sorcier (niveau 1 à 5) ; un
    // emplacement ajouté à la main sur un autre niveau (Arcanum mystique niv. 6-9,
    // multiclasse…) ne revient qu'au repos long.
    let pactSlotsRestored = 0;
    if (d.classSlug === 'warlock') {
        const isPactLevel = level => Number(d.spellSlots?.[level]) > 0;
        const slots = resetSpellSlots(character.spell_slots_state, isPactLevel);
        if (slots) {
            pactSlotsRestored = usedSpellSlots(character.spell_slots_state, isPactLevel);
            patch.spell_slots_state = slots;
        }
    }

    return {
        patch,
        summary: {
            diceSpent: spent,
            diceLeft: hd.available - spent,
            healing: heal,
            hpBefore,
            hpAfter,
            hpMax,
            resourceLabel: label,
            resourcesRestored: toRestore.length,
            pactSlotsRestored,
            slotRecovery: slotRecoveryFeature(character, d),
            canStart: canStartRest(character)
        }
    };
}

/**
 * Patch d'un repos court (voir planShortRest).
 * @param {Object} character
 * @param {{ diceSpent?: number, healing?: number, sorcerousRestoration?: boolean }} [options]
 * @returns {Object}
 */
export function shortRestPatch(character, options) {
    return planShortRest(character, options).patch;
}

/**
 * Calcule un repos long.
 * @param {Object} character
 * @returns {{ patch: Object, summary: Object }}
 */
export function planLongRest(character) {
    const d = deriveCharacter(character);
    const hd = hitDiceState(character);
    const patch = {};

    const hpMax = readHitPoints(character.hp_max);
    const hpBefore = readHitPoints(character.hp_current);
    if (hpMax !== null) patch.hp_current = String(hpMax);
    patch.hp_temp = '0';

    // 2024 : tous les dés de vie dépensés sont récupérés
    patch.hd_current = '0';

    const exhaustion = Math.max(0, Math.min(6, parseNumber(character.fatigue_level, 0)));
    patch.fatigue_level = Math.max(0, exhaustion - 1);

    const slotsUsed = usedSpellSlots(character.spell_slots_state);
    patch.spell_slots_state = resetSpellSlots(character.spell_slots_state)
        || (character.spell_slots_state && typeof character.spell_slots_state === 'object'
            ? { ...character.spell_slots_state } : {});

    // Ressources de classe : toutes les cases (y compris d'anciennes cases au-delà du nombre affiché)
    let resourcesRestored = 0;
    for (let i = 0; i < d.classResource.count; i++) patch[`class_res_${i}`] = false;
    for (const [key, value] of Object.entries(character)) {
        if (!CLASS_RES_KEY.test(key)) continue;
        if (value === true) resourcesRestored++;
        patch[key] = false;
    }

    for (const key of DEATH_SAVE_KEYS) patch[key] = false;
    patch.combat_buffs = {};

    return {
        patch,
        summary: {
            hpBefore,
            hpMax,
            hitDiceRecovered: hd.used,
            exhaustionBefore: exhaustion,
            exhaustionAfter: patch.fatigue_level,
            spellSlotsRestored: slotsUsed,
            resourceLabel: d.classResource.label,
            resourcesRestored,
            heroicInspiration: /^(humain|human)$/i.test(String(character.char_species ?? '').replace(/<[^>]*>/g, '').trim()),
            canStart: canStartRest(character)
        }
    };
}

/**
 * Patch d'un repos long (voir planLongRest).
 * @param {Object} character
 * @returns {Object}
 */
export function longRestPatch(character) {
    return planLongRest(character).patch;
}
