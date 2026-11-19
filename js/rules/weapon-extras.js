// =============================================================================
// WEAPON-EXTRAS.JS (règles) - « Dégâts en plus » d'une arme : fonctions pures, sans DOM
//
// Une arme peut porter jusqu'à 4 dégâts en plus écrits par le joueur (« +2d6 contre les dragons »,
// « +1d6 radiants contre les morts-vivants »), réglés dans la fenêtre « Configuration de l'arme » :
//  - « Toujours »   (mode 'always') : comptés en permanence dans les dégâts de la ligne ;
//  - « À allumer »  (mode 'toggle') : une pastille sous l'arme ; allumée, ses dégâts s'ajoutent.
//
// ENREGISTREMENT : propriété facultative `extraDamage` de weaponConfig (chaîne JSON de chaque ligne
// de dynamic_weapons, format v3), comme `proficiency` (4.15.0) :
//     "extraDamage": [ { "dmg": "2d6", "reason": "contre les dragons", "mode": "always" },
//                      { "dmg": "1d6", "reason": "radiants contre les morts-vivants", "mode": "toggle", "on": true } ]
// Absente quand l'arme n'a aucun dégât en plus (weaponConfig alors identique à avant la 4.43.0).
// L'état allumé (`on: true`, écrit seulement quand il est vrai) est rangé DANS la ligne de l'arme :
// il suit l'arme quand une ligne est retirée, rétablie ou filtrée, voyage avec la fiche, et ne peut
// pas s'accrocher à une autre arme (ce que ferait un numéro de ligne gardé dans combat_buffs).
// Il s'éteint au repos long, comme les bonus de combat (clearExtraDamageOn, js/rules/rest.js).
// La v3 recopie weaponConfig sans le lire : elle garde la propriété, sauf si l'on applique SON
// réglage de l'arme, qui réécrit les quatre propriétés d'origine seulement.
//
// LECTURE TOLÉRANTE : une ligne illisible (fichier retouché à la main, autre format) est ignorée,
// jamais corrigée ni effacée par l'affichage, la bascule d'une pastille ou le repos ; les autres
// réglages de l'arme ne sont pas touchés. Seul « Appliquer », dans la fenêtre de réglage, réécrit
// la liste : il n'y remet que les lignes lisibles (4 au plus) et leurs propriétés connues
// (dmg, reason, mode, on) ; une ligne illisible ou une propriété inconnue disparaît alors.
// Le texte du joueur n'est jamais du HTML : il est affiché tel quel (textContent).
// =============================================================================

import { parseWeaponConfig } from './logic.js';

/** Nom de la propriété dans weaponConfig */
export const EXTRA_DAMAGE_KEY = 'extraDamage';

/** Nombre de dégâts en plus par arme */
export const EXTRA_DAMAGE_MAX = 4;

/** Longueur de la raison (« radiants contre les morts-vivants » : 32 caractères) */
export const EXTRA_REASON_MAX = 40;

/** 'always' : « Toujours » ; 'toggle' : « À allumer » */
export const EXTRA_DAMAGE_MODES = ['always', 'toggle'];

const DIE_SIZES = new Set([4, 6, 8, 10, 12, 20]);
const MAX_TERMS = 3;
const MAX_DICE = 20;
const MAX_FLAT = 99;

/**
 * Valide des dégâts en plus saisis : dés et nombres ajoutés (« 2d6 », « 1d6+2 », « 2 », « d8 »).
 * Un « + » devant, des espaces et des majuscules sont acceptés.
 * @param {*} value
 * @returns {{ ok: boolean, value: string }} value : forme enregistrée (« 1d6+2 »), sans « + » devant
 */
export function normalizeExtraDamage(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return { ok: false, value: '' };
    const text = String(value).trim().toLowerCase().replace(/\s+/g, '').replace(/^\+/, '');
    if (!text) return { ok: false, value: '' };
    const terms = text.split('+');
    if (terms.length > MAX_TERMS) return { ok: false, value: text };
    const clean = [];
    for (const term of terms) {
        const die = term.match(/^(\d{0,2})d(\d{1,2})$/);
        if (die) {
            const count = die[1] === '' ? 1 : Number(die[1]);
            const size = Number(die[2]);
            if (count < 1 || count > MAX_DICE || !DIE_SIZES.has(size)) return { ok: false, value: text };
            clean.push(`${count}d${size}`);
            continue;
        }
        if (!/^\d{1,2}$/.test(term)) return { ok: false, value: text };
        const flat = Number(term);
        if (flat < 1 || flat > MAX_FLAT) return { ok: false, value: text };
        clean.push(String(flat));
    }
    return { ok: true, value: clean.join('+') };
}

/**
 * Caractères sans dessin (espace sans chasse, marque d'ordre des octets) ou qui retournent le sens
 * d'écriture : retirés, pour qu'une raison ne soit jamais faite de « rien » ni écrite à l'envers.
 */
const INVISIBLE = /[\u200b\u2060\ufeff\u202a-\u202e\u2066-\u2069]/g;

/** Raison : texte sur une ligne, espaces resserrés (jamais interprété comme du HTML) */
function cleanReason(value) {
    if (typeof value !== 'string') return '';
    return value.replace(INVISIBLE, '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Des mots dans la case « Dégâts » (« 1d6 feu », « beaucoup ») : toute lettre autre que le « d » des dés */
const WORDS_IN_DAMAGE = /[a-ce-zà-öø-ÿ]/i;

/**
 * Valide une ligne « dégâts en plus ».
 * @param {{ dmg?: string, reason?: string, mode?: string, on?: boolean }} input
 * @returns {{ ok: true, value: { dmg: string, reason: string, mode: 'always'|'toggle', on?: true } }
 *          | { ok: false, errors: { dmg?: string, reason?: string, mode?: string } }}
 *          on n'est écrit que pour une ligne « À allumer » allumée
 */
export function validateExtraLine(input) {
    const errors = {};
    const line = input && typeof input === 'object' ? input : {};
    const dmg = normalizeExtraDamage(line.dmg);
    if (!dmg.ok) {
        // « 1d6 feu » : le type écrit dans la mauvaise case, l'erreur la plus probable
        errors.dmg = typeof line.dmg === 'string' && WORDS_IN_DAMAGE.test(line.dmg)
            ? 'dégâts illisibles. Écrivez seulement les dés et les nombres, par exemple 2d6, 1d6+2 ou 2 : le type de dégâts ou la condition va dans « Raison ».'
            : 'dégâts illisibles. Écrivez par exemple 2d6, 1d6+2 ou 2 (dés : d4, d6, d8, d10, d12, d20).';
    }
    const reason = cleanReason(line.reason);
    if (!reason) errors.reason = 'écrivez la raison (par exemple « contre les dragons »).';
    else if (reason.length > EXTRA_REASON_MAX) errors.reason = `raison trop longue (${EXTRA_REASON_MAX} caractères au plus).`;
    const mode = line.mode === undefined || line.mode === '' ? 'always' : line.mode;
    if (!EXTRA_DAMAGE_MODES.includes(mode)) errors.mode = 'choisissez « Toujours » ou « À allumer ».';
    if (Object.keys(errors).length) return { ok: false, errors };
    return {
        ok: true,
        value: { dmg: dmg.value, reason, mode, ...(mode === 'toggle' && line.on === true ? { on: true } : {}) }
    };
}

/**
 * Valide la liste saisie dans la fenêtre de configuration.
 * @param {Array} lines
 * @returns {{ ok: true, value: Array } | { ok: false, message: string, invalid: Array<{ index: number, field: string }> }}
 *          message : phrases à montrer au joueur ; invalid : champs à signaler
 */
export function validateExtraDamageList(lines) {
    const list = Array.isArray(lines) ? lines : [];
    if (list.length > EXTRA_DAMAGE_MAX) {
        return { ok: false, message: `${EXTRA_DAMAGE_MAX} dégâts en plus au maximum par arme.`, invalid: [] };
    }
    const value = [];
    const messages = [];
    const invalid = [];
    list.forEach((line, index) => {
        const result = validateExtraLine(line);
        if (result.ok) {
            value.push(result.value);
            return;
        }
        for (const [field, text] of Object.entries(result.errors)) {
            messages.push(`Dégât en plus n° ${index + 1} : ${text}`);
            invalid.push({ index, field });
        }
    });
    return messages.length ? { ok: false, message: messages.join(' '), invalid } : { ok: true, value };
}

/**
 * Dégâts en plus d'une arme, lus sans jamais échouer : seules les lignes lisibles sont rendues
 * (4 au plus), avec leur place dans la liste enregistrée (`index`, pour toggleExtraDamage).
 * @param {string|Object} raw - champ weaponConfig
 * @returns {Array<{ index: number, dmg: string, reason: string, mode: 'always'|'toggle', on: boolean }>}
 */
export function readExtraDamage(raw) {
    const list = parseWeaponConfig(raw)?.[EXTRA_DAMAGE_KEY];
    if (!Array.isArray(list)) return [];
    const lines = [];
    list.forEach((entry, index) => {
        if (lines.length >= EXTRA_DAMAGE_MAX) return;
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
        const result = validateExtraLine(entry);
        if (result.ok) lines.push({ index, ...result.value, on: result.value.on === true });
    });
    return lines;
}

/**
 * Dégâts en plus comptés maintenant : les « Toujours », puis les « À allumer » allumés.
 * Même forme que les bonus de combat de computeWeapon ({ die, type }).
 * @param {string|Object} raw - champ weaponConfig
 * @returns {Array<{ die: string, type: string, toggle: boolean }>}
 */
export function activeExtraDamage(raw) {
    const lines = readExtraDamage(raw);
    return [
        ...lines.filter(line => line.mode === 'always'),
        ...lines.filter(line => line.mode === 'toggle' && line.on)
    ].map(line => ({ die: line.dmg, type: line.reason, toggle: line.mode === 'toggle' }));
}

/** Morceau ajouté au texte des dégâts, écrit comme les bonus de combat : « +2d6 (contre les dragons) » */
export function extraDamageText({ die, type }) {
    return ` +${die} (${type})`;
}

/** Libellé d'une ligne (pastille, phrases) : « +2d6 contre les dragons » */
export function extraDamageLabel({ dmg, reason }) {
    return `+${dmg} ${reason}`;
}

/**
 * Dégâts affichés pour une arme sans calcul automatique (écrite à la main, non rattachée au
 * manuel : computeWeapon renvoie null) : l'ancienne valeur enregistrée, puis les dégâts en plus.
 * @param {string} legacy - ancienne valeur « dmg » de la ligne, déjà en texte brut ('' le plus souvent)
 * @param {string|Object} raw - champ weaponConfig
 * @returns {{ text: string, tooltip: string, legacy: boolean, parts: Array<{ die: string, type: string, toggle: boolean }> }}
 *          legacy : la valeur enregistrée est affichée ; parts : dégâts en plus, à la fin du texte
 */
export function offBookDamage(legacy, raw) {
    const base = (legacy ?? '').toString().trim();
    const parts = activeExtraDamage(raw);
    const text = (base + parts.map(extraDamageText).join('')).trim();
    let tooltip = base ? 'Valeur enregistrée : arme hors manuel, pas de calcul automatique' : '';
    if (parts.length) {
        tooltip = (tooltip || 'Arme hors manuel : pas de calcul automatique, seuls les dégâts en plus sont affichés')
            + parts.map(part => ` | +${part.die} ${part.type}`).join('');
    }
    return { text, tooltip, legacy: Boolean(base), parts };
}

/**
 * Allume ou éteint une ligne « À allumer » (nouvelle chaîne weaponConfig ; les autres réglages et
 * les autres lignes, même illisibles, sont recopiés tels quels).
 * @param {string|Object} raw - champ weaponConfig
 * @param {number} index - place de la ligne dans la liste enregistrée (readExtraDamage().index)
 * @returns {string|Object} raw lui-même si la ligne n'existe pas ou n'est pas « À allumer »
 */
export function toggleExtraDamage(raw, index) {
    const line = readExtraDamage(raw).find(entry => entry.index === index);
    if (!line || line.mode !== 'toggle') return raw;
    const config = parseWeaponConfig(raw);
    const list = config[EXTRA_DAMAGE_KEY].map((entry, i) => {
        if (i !== index) return entry;
        const { on: _on, ...rest } = entry;
        return line.on ? rest : { ...rest, on: true };
    });
    return JSON.stringify({ ...config, [EXTRA_DAMAGE_KEY]: list });
}

/** weaponConfig sans aucun état allumé (raw lui-même si rien n'est allumé) */
function clearConfigOn(raw) {
    const config = parseWeaponConfig(raw);
    const list = config?.[EXTRA_DAMAGE_KEY];
    const isOn = (entry) => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry) && entry.on === true;
    if (!Array.isArray(list) || !list.some(isOn)) return raw;
    return JSON.stringify({
        ...config,
        [EXTRA_DAMAGE_KEY]: list.map((entry) => {
            if (!isOn(entry)) return entry;
            const { on: _on, ...rest } = entry;
            return rest;
        })
    });
}

/**
 * Éteint toutes les pastilles « À allumer » du tableau des armes (repos long, comme combat_buffs).
 * @param {Array} weapons - dynamic_weapons
 * @returns {Array} le même tableau si rien n'était allumé (aucune écriture inutile), sinon un
 *          nouveau tableau où seules les lignes concernées sont remplacées
 */
export function clearExtraDamageOn(weapons) {
    if (!Array.isArray(weapons)) return weapons;
    let changed = false;
    const next = weapons.map((weapon) => {
        if (!weapon || typeof weapon !== 'object') return weapon;
        const config = clearConfigOn(weapon.weaponConfig);
        if (config === weapon.weaponConfig) return weapon;
        changed = true;
        return { ...weapon, weaponConfig: config };
    });
    return changed ? next : weapons;
}
