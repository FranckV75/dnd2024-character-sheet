// =============================================================================
// PERSISTENCE.JS - SAUVEGARDE LOCALE ET FICHIERS JSON
//
// Mêmes clés localStorage que la v3 : à la bascule, la fiche déjà enregistrée
// dans le navigateur de chaque joueur sera retrouvée automatiquement.
// Le stockage est injectable pour pouvoir tester sans navigateur.
// =============================================================================

import { migrateCharacter, stripHTML } from './migrate.js';

export const STORAGE_KEYS = {
    character: 'dd2024_char',
    lastSaved: 'dd2024_last_saved',
    activeName: 'dd2024_active_char_name'
};

const defaultStorage = () => (typeof localStorage !== 'undefined' ? localStorage : null);

/**
 * Lit le personnage enregistré dans le navigateur.
 * @param {Storage} [storage]
 * @returns {{ character: Object, report: string[] } | null} null si rien d'enregistré
 */
export function loadLocal(storage = defaultStorage()) {
    let text = null;
    try {
        text = storage?.getItem(STORAGE_KEYS.character) ?? null;
    } catch {
        return null;
    }
    if (!text) return null;
    try {
        return migrateCharacter(JSON.parse(text));
    } catch {
        return { ...migrateCharacter({}), report: ['Sauvegarde locale illisible : fiche vierge chargée.'] };
    }
}

/**
 * Enregistre le personnage dans le navigateur.
 * @param {Object} character
 * @param {Storage} [storage]
 * @param {Date} [now]
 * @returns {boolean} false si le stockage est indisponible ou plein
 */
export function saveLocal(character, storage = defaultStorage(), now = new Date()) {
    try {
        storage.setItem(STORAGE_KEYS.character, JSON.stringify(character));
        storage.setItem(STORAGE_KEYS.lastSaved, now.toISOString());
        const name = characterName(character);
        if (name) storage.setItem(STORAGE_KEYS.activeName, name);
        return true;
    } catch {
        return false;
    }
}

/**
 * Nom lisible du personnage (sans mise en forme, espaces normalisés).
 * Un nom v3 sur plusieurs lignes (« Kor<br>gul », « <div>Kor</div><div>gul</div> ») donne
 * « Kor gul », comme le nom que la v3 enregistrait en ligne.
 * @param {Object} character
 * @returns {string}
 */
export function characterName(character) {
    const lines = String(character?.char_name || '').replace(/<br\s*\/?>|<\/(div|p|li)>/gi, ' ');
    return stripHTML(lines).replace(/\s+/g, ' ').trim();
}

/**
 * Contenu d'un fichier d'export (même mise en forme que la v3).
 * @param {Object} character
 * @returns {string}
 */
export function serializeCharacter(character) {
    return JSON.stringify(character, null, 2);
}

/**
 * Nom du fichier d'export : DD2024_<Prénom>_<jj-mm-aaaa>.json
 * @param {Object} character
 * @param {Date} [date]
 * @returns {string}
 */
export function exportFileName(character, date = new Date()) {
    const firstName = (characterName(character).split(' ')[0] || 'perso').replace(/[\\/:*?"<>|]/g, '');
    const pad = (n) => String(n).padStart(2, '0');
    return `DD2024_${firstName}_${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}.json`;
}

/**
 * Lit le contenu d'un fichier ou d'un texte collé.
 * @param {string} text
 * @returns {{ character: Object, report: string[] }}
 * @throws {Error} message en français si le texte n'est pas une fiche
 */
export function parseCharacterFile(text) {
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error('Ce fichier n\'est pas une fiche valide (JSON illisible).');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Ce fichier ne contient pas une fiche de personnage.');
    }
    return migrateCharacter(data);
}
