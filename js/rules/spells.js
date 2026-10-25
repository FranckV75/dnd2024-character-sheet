// =============================================================================
// SPELLS.JS (règles) - Grimoire : fonctions pures (aucun accès au DOM)
//  - recherche de sorts dans la base (insensible aux accents, filtre de classe)
//  - conversion d'un sort de la base en ligne du tableau (clés v3 inchangées)
//  - filtre par niveau, tri d'affichage, compteurs
//  - emplacements de sorts : maximum effectif, cases utilisées, ajustements
//
// Règles D&D 2024 (Player's Handbook, chap. 7) : un sort mineur se lance sans
// emplacement (il n'a donc pas à être « préparé ») ; un sort de niveau 1+ dépense
// un emplacement de son niveau ou plus. Les emplacements de Magie de pacte
// (Occultiste) sont tous du même niveau et reviennent après un repos court ou long.
// =============================================================================

import { DD_RULES } from '../data/dd-rules.js';

/** Classes proposées dans le filtre de classe du grimoire (identifiants de la base de sorts) */
export const SPELL_CLASS_OPTIONS = [
    ['bard', 'Barde'],
    ['cleric', 'Clerc'],
    ['druid', 'Druide'],
    ['sorcerer', 'Ensorceleur'],
    ['wizard', 'Magicien'],
    ['warlock', 'Occultiste/Sorcier'],
    ['paladin', 'Paladin'],
    ['ranger', 'Rôdeur']
];

export const SPELL_LEVELS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Nombre maximal d'emplacements réglable à la main pour un niveau de sort */
export const MAX_SLOTS_PER_LEVEL = 20;

// ---------------------------------------------------------------------------
// Texte
// ---------------------------------------------------------------------------

const ENTITIES = { nbsp: ' ', lt: '<', gt: '>', quot: '"', apos: "'", amp: '&', rsquo: '’', lsquo: '‘', hellip: '…' };

function decodeEntities(text) {
    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
        if (code[0] === '#') {
            const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
            return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
        }
        return ENTITIES[code.toLowerCase()] ?? match;
    });
}

/**
 * Texte brut d'une valeur saisie (retire les balises d'anciennes sauvegardes v3).
 * @param {*} value
 * @returns {string}
 */
export function plainText(value) {
    if (value === null || value === undefined) return '';
    return decodeEntities(String(value).replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

// Balises que l'on trouve dans les cellules contenteditable de la v3 (innerHTML)
const V3_TAG = /<\/?(?:b|i|u|s|strike|strong|em|span|div|br|font|p|a|sub|sup|small|big|mark|code|li|ul|ol|h[1-6])\b[^<>]*>/gi;
const ENTITY = /&(?:#x[0-9a-f]+|#\d+|[a-z]+);/gi;

/**
 * La valeur ressemble-t-elle au innerHTML d'une ancienne cellule v3 ?
 * Le innerHTML échappe toujours &, < et > dans le texte : une valeur qui contient
 * un de ces caractères hors d'une balise v3 ou d'une entité a été saisie en v4
 * (texte brut) et n'est donc pas du HTML.
 * @param {*} text
 * @returns {boolean}
 */
export function looksLikeLegacyHtml(text) {
    const s = String(text ?? '');
    if (s.search(V3_TAG) === -1 && s.search(ENTITY) === -1) return false;
    const outside = s.replace(V3_TAG, '').replace(ENTITY, '');
    return !/[<>&]/.test(outside);
}

/**
 * Valeur à afficher dans une cellule texte du grimoire.
 * Le texte saisi en v4 est rendu exactement tel qu'enregistré (« Dégâts <niv. sup.> +1d6 »,
 * espaces compris) ; seul le HTML des anciennes sauvegardes v3 est converti en texte brut.
 * Seul cas ambigu : une valeur v4 composée uniquement de texte et d'entités (« A &amp; B »)
 * est lue comme du HTML v3, comme l'aurait fait la v3.
 * @param {*} value
 * @returns {string}
 */
export function cellText(value) {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (!looksLikeLegacyHtml(s)) return s;
    return plainText(s.replace(/<br\s*\/?>/gi, ' ').replace(/<\/?(?:p|div|li|h[1-6])\b[^<>]*>/gi, ' '));
}

/**
 * Description d'un sort de la base (HTML simple : <br>, <strong>, <a>...) en texte brut,
 * avec des retours à la ligne. Le résultat s'affiche avec textContent, jamais en HTML.
 * @param {string} html
 * @returns {string}
 */
export function descToPlainText(html) {
    if (!html) return '';
    const text = String(html)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<[^>]*>/g, '');
    return decodeEntities(text)
        .replace(/[ \t ]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Forme de comparaison : minuscules, sans accents ni ligatures, espaces réduits.
 * @param {*} value
 * @returns {string}
 */
export function normalizeText(value) {
    return plainText(value).toLowerCase()
        .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[’‘]/g, "'");
}

/**
 * Noms possibles d'un sort de la base (« Amis|Faux amis » → deux noms).
 * @param {{ name?: string }} spell
 * @returns {string[]}
 */
export function spellNames(spell) {
    return String(spell?.name || '').split('|').map(n => n.trim()).filter(Boolean);
}

/** Nom affiché d'un sort de la base (premier nom quand il y en a plusieurs) */
export function spellDisplayName(spell) {
    return spellNames(spell)[0] || '';
}

/**
 * Libellé du niveau d'un sort.
 * @param {number|string} level
 * @returns {string} - « Sort mineur » ou « Niveau 3 »
 */
export function spellLevelLabel(level) {
    const n = parseInt(level, 10);
    return !Number.isFinite(n) || n <= 0 ? 'Sort mineur' : `Niveau ${n}`;
}

// ---------------------------------------------------------------------------
// Classe du grimoire
// ---------------------------------------------------------------------------

/**
 * Le filtre de classe effectif : la valeur choisie, sinon la classe du personnage
 * si c'est une classe de lanceur de sorts, sinon aucune (toutes les classes).
 * @param {string} filterValue - character.spell_class_filter
 * @param {string} characterClassSlug - ex. 'wizard', 'barbarian', ''
 * @returns {string} - identifiant de classe, ou '' pour toutes
 */
export function effectiveSpellClass(filterValue, characterClassSlug) {
    const value = String(filterValue || '').trim();
    if (SPELL_CLASS_OPTIONS.some(([slug]) => slug === value)) return value;
    if (characterClassSlug && DD_RULES.casterType[characterClassSlug]) {
        return SPELL_CLASS_OPTIONS.some(([slug]) => slug === characterClassSlug) ? characterClassSlug : '';
    }
    return '';
}

// ---------------------------------------------------------------------------
// Recherche dans la base de sorts
// ---------------------------------------------------------------------------

/**
 * Sorts de la base correspondant à la saisie.
 * - insensible à la casse et aux accents, sur le nom français (et ses variantes) ou anglais ;
 * - limité à la liste de sorts d'une classe si `classSlug` est donné ;
 * - les noms qui commencent par la saisie passent en premier, puis ordre alphabétique.
 * @param {Array<Object>} spells - base de sorts (loadSpells)
 * @param {string} query
 * @param {{ classSlug?: string, limit?: number }} [options]
 * @returns {Array<Object>}
 */
export function searchSpells(spells, query, { classSlug = '', limit = 15 } = {}) {
    const q = normalizeText(query);
    if (!q || !Array.isArray(spells)) return [];
    const scored = [];
    for (const spell of spells) {
        if (!spell) continue;
        if (classSlug && !(spell.classes || []).includes(classSlug)) continue;
        const names = spellNames(spell).map(normalizeText);
        const vo = normalizeText(spell.vo);
        let rank = -1;
        if (names.some(n => n.startsWith(q))) rank = 0;
        else if (vo.startsWith(q)) rank = 1;
        else if (names.some(n => n.includes(q)) || vo.includes(q)) rank = 2;
        if (rank >= 0) scored.push({ spell, rank });
    }
    scored.sort((a, b) => a.rank - b.rank || String(a.spell.name).localeCompare(String(b.spell.name), 'fr'));
    return scored.slice(0, limit).map(s => s.spell);
}

/**
 * Retrouve dans la base le sort d'une ligne du tableau (nom français, variante ou nom anglais).
 * @param {Array<Object>} spells
 * @param {string} name
 * @returns {Object|null}
 */
export function findSpellByName(spells, name) {
    const wanted = normalizeText(name);
    if (!wanted || !Array.isArray(spells)) return null;
    return spells.find(s => spellNames(s).some(n => normalizeText(n) === wanted))
        || spells.find(s => normalizeText(s?.vo) === wanted)
        || null;
}

/**
 * Remplit une ligne du tableau à partir d'un sort de la base.
 * Les clés restent exactement celles de la v3 ; la note et les clés inconnues sont conservées.
 * @param {Object} spell - sort de la base
 * @param {Object} [row] - ligne existante de dynamic_spells
 * @returns {Object} nouvelle ligne
 */
export function spellToRow(spell, row = {}) {
    const level = parseInt(spell?.level, 10);
    return {
        ...row,
        lvl: String(Number.isFinite(level) && level >= 0 && level <= 9 ? level : 0),
        name: spellDisplayName(spell),
        school: String(spell?.school || ''),
        time: String(spell?.castTime || ''),
        range: String(spell?.range || ''),
        c: Boolean(spell?.concentration),
        r: Boolean(spell?.ritual),
        m: String(spell?.components || '').toUpperCase().split(/[\s,]+/).includes('M')
    };
}

// ---------------------------------------------------------------------------
// Lignes du tableau : niveau, vide, filtre, tri, compteurs
// ---------------------------------------------------------------------------

/**
 * Niveau d'une ligne ('0' à '9'), lisible même pour une ancienne sauvegarde.
 * @param {Object} row
 * @returns {string}
 */
export function rowLevel(row) {
    const n = parseInt(plainText(row?.lvl), 10);
    return Number.isFinite(n) && n >= 0 && n <= 9 ? String(n) : '0';
}

/** Une ligne sans nom, temps d'incantation ni portée est « vide » (comme en v3) */
export function isSpellRowEmpty(row) {
    return !plainText(row?.name) && !plainText(row?.time) && !plainText(row?.range);
}

/** Un sort mineur est toujours disponible : il ne compte jamais comme « préparé » */
export function isPrepared(row) {
    return row?.prep === true && rowLevel(row) !== '0';
}

/**
 * La ligne est-elle affichée avec le filtre de niveau ? Les lignes vides restent visibles
 * (une ligne que l'on vient d'ajouter ne disparaît pas).
 * @param {Object} row
 * @param {string} levelFilter - '' (tous) ou '0' à '9'
 * @returns {boolean}
 */
export function matchesLevelFilter(row, levelFilter) {
    if (levelFilter === '' || levelFilter === null || levelFilter === undefined) return true;
    return isSpellRowEmpty(row) || rowLevel(row) === String(levelFilter);
}

const SORT_KEYS = {
    lvl: (row) => parseInt(rowLevel(row), 10),
    name: (row) => normalizeText(row?.name),
    school: (row) => normalizeText(row?.school)
};

/**
 * Ordre d'affichage des lignes (le tableau enregistré n'est jamais réordonné).
 * Les lignes vides restent à la fin, dans leur ordre ; à égalité, l'ordre enregistré est gardé.
 * @param {Array<Object>} rows
 * @param {{ col: 'lvl'|'name'|'school'|null, dir: 'asc'|'desc' }} [sort]
 * @returns {number[]} indices de `rows` dans l'ordre d'affichage
 */
export function sortedSpellIndices(rows, sort = {}) {
    const indices = (rows || []).map((_, i) => i);
    const key = SORT_KEYS[sort?.col];
    if (!key) return indices;
    const sign = sort.dir === 'desc' ? -1 : 1;
    const filled = indices.filter(i => !isSpellRowEmpty(rows[i]));
    const empty = indices.filter(i => isSpellRowEmpty(rows[i]));
    filled.sort((a, b) => {
        const va = key(rows[a]);
        const vb = key(rows[b]);
        const cmp = typeof va === 'number' ? va - vb : va.localeCompare(vb, 'fr');
        return cmp * sign || a - b;
    });
    return [...filled, ...empty];
}

/**
 * Tri suivant après un clic sur un en-tête : croissant → décroissant → ordre enregistré.
 * @param {{ col: string|null, dir: string }} current
 * @param {string} col
 * @returns {{ col: string|null, dir: 'asc'|'desc' }}
 */
export function nextSort(current, col) {
    if (current?.col !== col) return { col, dir: 'asc' };
    if (current.dir === 'asc') return { col, dir: 'desc' };
    return { col: null, dir: 'asc' };
}

/**
 * Compteurs du grimoire.
 * @param {Array<Object>} rows
 * @param {string} levelFilter
 * @returns {{ total: number, visible: number, prepared: number }}
 *          total / visible : sorts renseignés (les lignes vides ne comptent pas)
 */
export function spellCounts(rows, levelFilter = '') {
    let total = 0;
    let visible = 0;
    let prepared = 0;
    for (const row of rows || []) {
        if (isSpellRowEmpty(row)) continue;
        total++;
        if (matchesLevelFilter(row, levelFilter)) visible++;
        if (isPrepared(row)) prepared++;
    }
    return { total, visible, prepared };
}

/**
 * Texte du compteur : « 12 sorts · 5 préparés » ou, filtré, « 3 / 12 sorts · 5 préparés ».
 * @param {{ total: number, visible: number, prepared: number }} counts
 * @param {boolean} filtered
 * @returns {string}
 */
export function formatSpellCount({ total, visible, prepared }, filtered = false) {
    const spells = `${filtered ? `${visible} / ` : ''}${total} sort${total > 1 ? 's' : ''}`;
    return `${spells} · ${prepared} préparé${prepared > 1 ? 's' : ''}`;
}

/**
 * Nouvelle ligne vide (copie de EMPTY_SPELL), au niveau du filtre actif s'il y en a un.
 * @param {Object} emptySpell - EMPTY_SPELL
 * @param {string} levelFilter
 * @returns {Object}
 */
export function newSpellRow(emptySpell, levelFilter = '') {
    const row = { ...emptySpell };
    if (SPELL_LEVELS.includes(String(levelFilter))) row.lvl = String(levelFilter);
    return row;
}

// ---------------------------------------------------------------------------
// Emplacements de sorts (character.spell_slots_state)
//   { "1": { max?: number, used: number }, ... } ; max absent = valeur du manuel
// ---------------------------------------------------------------------------

function toCount(value) {
    const n = typeof value === 'number' ? value : parseInt(value, 10);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/**
 * Nombre d'emplacements d'un niveau : réglage manuel s'il existe, sinon valeur du manuel.
 * @param {Object} state - spell_slots_state
 * @param {number|string} level
 * @param {number} rulebookCount - deriveCharacter().spellSlots[level] (0 si absent)
 * @returns {number}
 */
export function effectiveSlotMax(state, level, rulebookCount = 0) {
    const manual = toCount(state?.[String(level)]?.max);
    return manual !== null ? Math.min(manual, MAX_SLOTS_PER_LEVEL) : Math.max(0, toCount(rulebookCount) ?? 0);
}

/**
 * État affiché d'un niveau : maximum et emplacements utilisés (bornés au maximum,
 * par exemple si le niveau du personnage a baissé).
 * @param {Object} state
 * @param {number|string} level
 * @param {number} rulebookCount
 * @returns {{ max: number, used: number }}
 */
export function slotView(state, level, rulebookCount = 0) {
    const max = effectiveSlotMax(state, level, rulebookCount);
    const used = Math.min(max, toCount(state?.[String(level)]?.used) ?? 0);
    return { max, used };
}

function withLevel(state, level, entry) {
    return { ...(state && typeof state === 'object' ? state : {}), [String(level)]: entry };
}

/**
 * Clic sur la case n° `index` : les cases sont remplies de gauche à droite
 * (cocher la 3e = 3 utilisés ; décocher la 3e = 2 utilisés), comme en v3.
 * @param {Object} state
 * @param {number|string} level
 * @param {number} index - 0 = première case
 * @param {boolean} checked - nouvel état de la case
 * @param {number} rulebookCount
 * @returns {Object} nouvel état (l'ancien n'est pas modifié)
 */
export function toggleSlotUsed(state, level, index, checked, rulebookCount = 0) {
    const { max } = slotView(state, level, rulebookCount);
    const used = Math.max(0, Math.min(max, checked ? index + 1 : index));
    return withLevel(state, level, { ...(state?.[String(level)] || {}), used });
}

/**
 * Ajoute (delta = 1) ou retire (delta = -1) un emplacement à un niveau.
 * Les emplacements utilisés sont ramenés au nouveau maximum ; revenir à la valeur
 * du manuel efface le réglage manuel (le maximum suivra alors les montées de niveau).
 * @param {Object} state
 * @param {number|string} level
 * @param {number} delta
 * @param {number} rulebookCount
 * @returns {Object} nouvel état
 */
export function adjustSlotMax(state, level, delta, rulebookCount = 0) {
    const current = slotView(state, level, rulebookCount);
    const max = Math.max(0, Math.min(MAX_SLOTS_PER_LEVEL, current.max + delta));
    const entry = { ...(state?.[String(level)] || {}), used: Math.min(current.used, max) };
    if (max === Math.max(0, toCount(rulebookCount) ?? 0)) delete entry.max;
    else entry.max = max;
    return withLevel(state, level, entry);
}

/**
 * Niveaux de sorts à afficher dans le suivi des emplacements, avec leur libellé :
 * ceux du manuel pour la classe et le niveau, plus ceux ajoutés à la main
 * (max > 0 dans spell_slots_state : Chevalier occulte, Escroc arcanique, multiclasse...).
 * Occultiste : les emplacements du manuel sont ceux de la Magie de pacte.
 * @param {Object} spellSlots - deriveCharacter().spellSlots, ex. { 1: 4, 2: 2 }
 * @param {string} classSlug
 * @param {Object} [state] - spell_slots_state
 * @returns {Array<{ level: string, rulebook: number, label: string, pact: boolean }>}
 */
export function slotLevels(spellSlots, classSlug = '', state = {}) {
    const pactClass = DD_RULES.casterType[classSlug] === 'pact';
    const levels = new Map();
    for (const [level, count] of Object.entries(spellSlots || {})) {
        const rulebook = toCount(count) ?? 0;
        if (rulebook > 0) levels.set(String(level), rulebook);
    }
    for (const [level, entry] of Object.entries(state && typeof state === 'object' ? state : {})) {
        if (!levels.has(level) && (toCount(entry?.max) ?? 0) > 0) levels.set(level, 0);
    }
    return [...levels]
        .filter(([level]) => SPELL_LEVELS.includes(level) && level !== '0')
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([level, rulebook]) => {
            const pact = pactClass && rulebook > 0;
            return {
                level, rulebook, pact,
                label: pact ? `Magie de pacte (repos court) · niv. ${level}` : `Niv. ${level}`
            };
        });
}

/**
 * Premier niveau de sort (1 à 9) qui n'a pas encore de suivi d'emplacements.
 * @param {Array<{ level: string }>} shown - résultat de slotLevels()
 * @returns {string} - '' si les neuf niveaux sont déjà suivis
 */
export function nextFreeSlotLevel(shown) {
    const used = new Set((shown || []).map(s => String(s.level)));
    return SPELL_LEVELS.slice(1).find(level => !used.has(level)) || '';
}
