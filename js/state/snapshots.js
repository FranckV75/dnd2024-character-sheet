// =============================================================================
// SNAPSHOTS.JS - Sauvegardes de secours datées, sur l'appareil (sans DOM)
//
// La fiche garde ses derniers états (MAX_SNAPSHOTS) dans une clé du navigateur à part
// (SNAPSHOTS_KEY), jamais dans la sauvegarde ni en ligne : un retour en arrière reste possible
// après une erreur de saisie, un import ou un chargement malheureux.
// Moments : ouverture de la fiche, avant un repos long, avant tout remplacement de la fiche
// (import, nouvelle fiche, chargement depuis le compte, retour à un état).
//
// Sécurité des données :
//  - un état dont le contenu est déjà dans la liste n'est pas ajouté (ouvrir dix fois la fiche, ou
//    revenir à un état, ne vide pas la liste) ; les réglages d'affichage (fond, thème) ne comptent pas ;
//  - une fiche vierge n'est jamais gardée ;
//  - place limitée (MAX_TOTAL_CHARS) : les plus anciens partent d'abord ; stockage plein : on retire
//    les plus anciens jusqu'à ce que l'écriture passe, sinon on renonce sans rien casser ;
//  - la fiche elle-même passe toujours avant : saveFreeingSnapshots libère la place des états quand
//    son enregistrement échoue (main.js), mais seulement si cela permet de l'enregistrer, et remet
//    ensuite les plus récents qui tiennent encore ;
//  - deux onglets : chaque écriture relit la liste juste avant (au pire un état est perdu, jamais la fiche).
// Testé sans navigateur : tests/snapshots.test.js.
// =============================================================================

import { canonicalJSON } from '../cloud/sync.js';
import { createDefaultCharacter } from './schema.js';
import { characterName, parseCharacterFile } from './persistence.js';

export const SNAPSHOTS_KEY = 'dd2024_char_snapshots';
export const MAX_SNAPSHOTS = 10;
/** Place maximale des états gardés (caractères ; une fiche fait d'ordinaire 10 000 à 20 000) */
export const MAX_TOTAL_CHARS = 500_000;

/** Moment de la sauvegarde → texte affiché */
export const SNAPSHOT_REASONS = Object.freeze({
    open: 'Ouverture de la fiche',
    'long-rest': 'Avant un repos long',
    import: 'Avant un import',
    new: 'Avant une nouvelle fiche',
    cloud: 'Avant un chargement depuis le compte',
    restore: 'Avant un retour en arrière',
    replace: 'Avant un remplacement de la fiche'
});

/** Source d'un remplacement de la fiche (store.replace, meta.source) → moment de la sauvegarde */
export function reasonForReplace(source) {
    switch (source) {
        case 'file': return 'import';
        case 'new': return 'new';
        case 'cloud': return 'cloud';
        case 'snapshot': return 'restore';
        default: return 'replace';
    }
}

const defaultStorage = () => (typeof localStorage !== 'undefined' ? localStorage : null);

/** Texte comparé pour reconnaître une fiche vierge : les réglages d'affichage (fond, thème) ne comptent pas */
const contentText = (character) => canonicalJSON({ ...character, _visual_prefs: undefined });

let blankText = null;
/** Texte d'une fiche vierge (calculé une fois) */
function blank() {
    blankText ??= contentText(createDefaultCharacter());
    return blankText;
}

/** Un état bien formé (une valeur abîmée dans la liste est ignorée, jamais une erreur) */
function isEntry(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
        && typeof value.text === 'string' && typeof value.at === 'string'
        && !Number.isNaN(Date.parse(value.at));
}

/**
 * États gardés, du plus récent au plus ancien.
 * @param {Storage} [storage]
 * @returns {Array<{ at: string, reason: string, name: string, level: string, cls: string, text: string }>}
 */
export function readSnapshots(storage = defaultStorage()) {
    let list;
    try {
        list = JSON.parse(storage?.getItem(SNAPSHOTS_KEY) || '[]');
    } catch {
        return [];
    }
    if (!Array.isArray(list)) return [];
    return list.filter(isEntry).map((entry) => ({
        at: entry.at,
        reason: Object.hasOwn(SNAPSHOT_REASONS, entry.reason) ? entry.reason : 'replace',
        name: typeof entry.name === 'string' ? entry.name : '',
        level: typeof entry.level === 'string' ? entry.level : '',
        cls: typeof entry.cls === 'string' ? entry.cls : '',
        text: entry.text
    }));
}

/** Écrit la liste ; stockage plein : retire les plus anciens jusqu'à ce que ça passe (garde au moins `keep`) */
function writeList(storage, list, keep = 1) {
    let current = list;
    for (;;) {
        try {
            if (current.length) storage.setItem(SNAPSHOTS_KEY, JSON.stringify(current));
            else storage.removeItem(SNAPSHOTS_KEY);
            return current;
        } catch {
            if (current.length <= keep) return null;
            current = current.slice(0, -1);
        }
    }
}

/** Le texte enregistré d'un état a-t-il ce contenu (réglages d'affichage exclus) ? */
function sameContent(text, content) {
    try {
        return contentText(JSON.parse(text)) === content;
    } catch {
        return false;
    }
}

/** Texte court d'un champ de la fiche (niveau, classe) */
const shortText = (value) => (typeof value === 'string' || typeof value === 'number' ? String(value).trim().slice(0, 60) : '');

/**
 * Garde l'état de la fiche.
 * @param {Object} character
 * @param {string} reason - clé de SNAPSHOT_REASONS
 * @param {{ storage?: Storage, now?: Date, max?: number, maxChars?: number }} [options]
 * @returns {{ saved: boolean, why?: 'blank'|'same'|'too-big'|'storage' }}
 */
export function takeSnapshot(character, reason, {
    storage = defaultStorage(), now = new Date(), max = MAX_SNAPSHOTS, maxChars = MAX_TOTAL_CHARS
} = {}) {
    if (!character || typeof character !== 'object' || !storage) return { saved: false, why: 'storage' };
    let text;
    try {
        if (contentText(character) === blank()) return { saved: false, why: 'blank' };
        text = JSON.stringify(character);
    } catch {
        return { saved: false, why: 'storage' };
    }
    if (text.length > maxChars) return { saved: false, why: 'too-big' };
    const existing = readSnapshots(storage);
    const content = contentText(character);
    if (existing.some((old) => sameContent(old.text, content))) return { saved: false, why: 'same' };
    const entry = {
        at: now.toISOString(),
        reason: Object.hasOwn(SNAPSHOT_REASONS, reason) ? reason : 'replace',
        name: characterName(character),
        level: shortText(character.char_level),
        cls: shortText(character.char_class),
        text
    };
    const list = [entry];
    let total = text.length;
    for (const old of existing) {
        if (list.length >= max || total + old.text.length > maxChars) break;
        list.push(old);
        total += old.text.length;
    }
    return writeList(storage, list) ? { saved: true } : { saved: false, why: 'storage' };
}

/**
 * Enregistre la fiche ; stockage plein : libère la place des sauvegardes de secours, mais
 * seulement si cela permet de l'enregistrer (sinon la liste est remise telle quelle), puis remet
 * les états les plus récents qui tiennent encore.
 * @param {() => boolean} save - enregistre la fiche (saveLocal), false si le stockage a refusé
 * @param {Storage} [storage]
 * @returns {{ saved: boolean, dropped: number }} dropped : nombre d'états perdus
 */
export function saveFreeingSnapshots(save, storage = defaultStorage()) {
    if (save()) return { saved: true, dropped: 0 };
    let text;
    try {
        text = storage?.getItem(SNAPSHOTS_KEY) ?? null;
    } catch {
        return { saved: false, dropped: 0 };
    }
    if (text === null) return { saved: false, dropped: 0 };
    const list = readSnapshots(storage);
    try {
        storage.removeItem(SNAPSHOTS_KEY);
    } catch {
        return { saved: false, dropped: 0 };
    }
    if (!save()) {
        try {
            storage.setItem(SNAPSHOTS_KEY, text);
        } catch {
            // La place libérée n'a pas servi : elle est encore libre, rien d'autre à faire
        }
        return { saved: false, dropped: 0 };
    }
    const kept = writeList(storage, list, 0) ?? [];
    return { saved: true, dropped: list.length - kept.length };
}

/**
 * Fiche d'un état gardé, lue comme un fichier importé (même conversion des anciens formats).
 * @param {{ text: string }} entry
 * @returns {{ character: Object, report: string[] }}
 * @throws {Error} message en français si l'état est illisible
 */
export function snapshotCharacter(entry) {
    return parseCharacterFile(entry?.text ?? '');
}

/**
 * Date et heure lisibles d'un état (heure de l'appareil) : « 10/11/2026 à 14 h 05 ».
 * @param {string} at - date ISO
 * @returns {string}
 */
export function formatSnapshotDate(at) {
    const date = new Date(at);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} à ${date.getHours()} h ${pad(date.getMinutes())}`;
}
