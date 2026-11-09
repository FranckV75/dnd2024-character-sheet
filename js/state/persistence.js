// =============================================================================
// PERSISTENCE.JS - SAUVEGARDE LOCALE ET FICHIERS JSON
//
// Mêmes clés localStorage que la v3 : à la bascule, la fiche déjà enregistrée
// dans le navigateur de chaque joueur sera retrouvée automatiquement.
// Le stockage est injectable pour pouvoir tester sans navigateur.
// =============================================================================

import { migrateCharacter, stripHTML, safeText, isV3Save, importV3DeviceState, isCharacterData, V3_DEVICE_KEYS } from './migrate.js';

export const STORAGE_KEYS = {
    character: 'dd2024_char',
    lastSaved: 'dd2024_last_saved',
    activeName: 'dd2024_active_char_name'
};

/**
 * Copie de secours d'une sauvegarde du navigateur illisible (clé du navigateur seulement, hors
 * format de sauvegarde) : le texte d'origine y est gardé avant qu'une fiche vierge ne le remplace.
 * Une copie plus ancienne et différente n'est jamais écrasée (la nouvelle reçoit un suffixe daté).
 */
export const BACKUP_KEY = 'dd2024_char_backup';

const defaultStorage = () => (typeof localStorage !== 'undefined' ? localStorage : null);

function readItem(storage, key) {
    try {
        return storage?.getItem(key) ?? null;
    } catch {
        return null;
    }
}

/**
 * Garde le texte d'une sauvegarde illisible dans la copie de secours.
 * @returns {string} clé utilisée ('' si le stockage a refusé)
 */
function keepBackup(storage, text, now) {
    let key = BACKUP_KEY;
    const previous = readItem(storage, BACKUP_KEY);
    if (previous !== null && previous !== text) key = `${BACKUP_KEY}_${now.toISOString()}`;
    try {
        storage.setItem(key, text);
        return key;
    } catch {
        return '';
    }
}

/**
 * Lit le personnage enregistré dans le navigateur.
 * Fiche encore au format v3 (premier lancement de la v4) : les emplacements de sorts et
 * les bonus de combat que la v3 gardait à part dans le navigateur sont repris dans la fiche.
 * Les anciennes clés restent en place (un retour à la v3 les utiliserait encore).
 * Sauvegarde illisible (ou valeur que la lecture ne sait pas convertir) : fiche vierge, et le
 * texte d'origine est d'abord copié dans
 * BACKUP_KEY (backupKey dans le résultat ; '' si la copie a échoué).
 * @param {Storage} [storage]
 * @param {Date} [now]
 * @returns {{ character: Object, report: string[], backupKey?: string } | null} null si rien d'enregistré
 */
export function loadLocal(storage = defaultStorage(), now = new Date()) {
    let text = null;
    try {
        text = storage?.getItem(STORAGE_KEYS.character) ?? null;
    } catch {
        return null;
    }
    if (!text) return null;
    let raw;
    try {
        raw = JSON.parse(text);
    } catch {
        raw = undefined;
    }
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        try {
            const result = migrateCharacter(raw);
            if (!isV3Save(raw)) return result;
            const imported = importV3DeviceState(result.character, {
                spellSlots: readItem(storage, V3_DEVICE_KEYS.spellSlots),
                combatBuffs: readItem(storage, V3_DEVICE_KEYS.combatBuffs)
            });
            return { character: imported.character, report: [...result.report, ...imported.report] };
        } catch {
            // Valeur que la lecture ne sait pas convertir (sauvegarde abîmée ou fabriquée) :
            // traitée comme une sauvegarde illisible, sans bloquer le démarrage
        }
    }
    const backupKey = keepBackup(storage, text, now);
    return {
        character: migrateCharacter({}).character,
        report: ['Sauvegarde locale illisible : fiche vierge chargée.'],
        backupKey
    };
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
    const lines = safeText(character?.char_name || '').replace(/<br\s*\/?>|<\/(div|p|li)>/gi, ' ');
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
 * @throws {Error} message en français si le texte n'est pas une fiche (JSON illisible, ou aucune
 *         clé de fiche reconnue : un fichier JSON quelconque ne remplace jamais la fiche)
 */
export function parseCharacterFile(text) {
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error('Ce fichier n\'est pas une fiche valide (JSON illisible).');
    }
    if (!isCharacterData(data)) {
        throw new Error('Ce fichier ne contient pas une fiche de personnage (aucun champ de fiche reconnu). La fiche actuelle n\'a pas été modifiée.');
    }
    try {
        return migrateCharacter(data);
    } catch {
        // Valeur que la lecture ne sait pas convertir : jamais un message technique en anglais
        throw new Error('Cette fiche contient des valeurs illisibles. La fiche actuelle n\'a pas été modifiée.');
    }
}
