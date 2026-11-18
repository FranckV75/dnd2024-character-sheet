// =============================================================================
// TOOLS.JS (règles) - Outils du manuel et case « Outils » (clé profs_tools, texte riche)
//
// La case « Outils » reste un texte libre, écrit à la main ou rempli par la fenêtre « Choisir dans
// la liste » (js/ui/tools.js). Ici, sans DOM :
//  - toolsInText : les outils du manuel reconnus dans le texte (accents, majuscules et marque
//    du pluriel ignorés, mot entier, même au milieu d'un texte libre ou d'une mise en forme) ;
//  - addToolToText : ajoute un nom en suivant la présentation déjà là (liste à virgules, à « ; »
//    ou à « / », ou une ligne par outil, avec la même puce et le même style de paragraphe) ;
//  - removeToolFromText : retire ce nom précis et son séparateur, rien d'autre ;
//  - backgroundToolExpectation / expectedToolNoted : outil (ou catégorie d'outils au choix) donné
//    par l'historique, et s'il est noté dans la case.
// Données : js/data/tools.js. Fonctions pures.
// =============================================================================

import { TOOLS, TOOL_CATEGORIES, BACKGROUND_TOOLS } from '../data/tools.js';
import { ABILITIES } from '../data/constants.js';

const TOOL_BY_ID = new Map(TOOLS.map((tool) => [tool.id, tool]));

/** Minuscules sans accents, apostrophes droites ; un caractère à la fois (les positions sont gardées) */
function foldChar(ch) {
    if (ch === '’' || ch === '‘' || ch === 'ʼ') return "'";
    if (ch === ' ' || ch === '\t') return ' ';
    return ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
const foldText = (text) => [...String(text ?? '')].map(foldChar).join('');

const isSpace = (ch) => ch === ' ' || ch === ' ' || ch === '\t';
const isWordChar = (ch) => ch !== undefined && /[\p{L}\p{N}]/u.test(ch);

/** Noms et autres écritures à chercher, les plus longs d'abord (« Flûte de pan » avant « Flûte ») */
const NEEDLES = TOOLS
    .flatMap((tool) => [tool.name, ...(tool.aliases ?? [])].map((name, index) => ({
        id: tool.id,
        folded: [...foldText(name)],
        words: foldText(name).split(' ').map((word) => [...word]),
        // Nom à reconnaître avec ses accents (« Dés »)
        exact: tool.exact === true && index === 0 ? name.normalize('NFC').toLowerCase() : null
    })))
    .sort((a, b) => b.folded.length - a.folded.length);

/**
 * Le nom est-il écrit à cet endroit ? Chaque mot peut porter une marque du pluriel en plus
 * (« Outils de voleurs », « Luths », « Jeux de cartes ») ou, dans un nom de plusieurs mots, perdre
 * la sienne (« Outil de voleur », « Carte à jouer »). Les mots courts (« de », « des ») et un nom
 * à lire avec ses accents (« Dés ») sont pris tels quels.
 * @param {string[]} folded - texte replié, un caractère par case
 * @param {boolean[]} taken - caractères déjà pris par un nom plus long
 * @param {number} from - début du nom dans folded
 * @param {{ words: string[][], exact: string|null }} needle
 * @returns {number} fin du nom dans folded (exclue), -1 s'il n'est pas là
 */
function needleEnd(folded, taken, from, needle) {
    const { words } = needle;
    let pos = from;
    for (let w = 0; w < words.length; w++) {
        const word = words[w];
        const isLast = w === words.length - 1;
        const endsAt = (p) => (isLast ? !isWordChar(folded[p]) : folded[p] === ' ');
        const has = (size) => {
            for (let k = 0; k < size; k++) if (folded[pos + k] !== word[k] || taken[pos + k]) return false;
            return true;
        };
        const size = word.length;
        let next = -1;
        if (has(size)) {
            const plural = folded[pos + size] === 's' || folded[pos + size] === 'x';
            if (endsAt(pos + size)) next = pos + size;
            else if (!needle.exact && size >= 3 && plural && !taken[pos + size] && endsAt(pos + size + 1)) next = pos + size + 1;
        }
        if (next < 0 && !needle.exact && words.length > 1 && size >= 5 && word[size - 1] === 's'
            && has(size - 1) && endsAt(pos + size - 1)) next = pos + size - 1;
        if (next < 0) return -1;
        pos = isLast ? next : next + 1;
    }
    return pos;
}

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
/** Lettres accentuées écrites en entités dans un texte importé (« Mat&eacute;riel ») ; la casse compte */
const LETTER_ENTITIES = {
    agrave: 'à', acirc: 'â', ccedil: 'ç', eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', icirc: 'î', iuml: 'ï',
    ocirc: 'ô', ugrave: 'ù', ucirc: 'û', uuml: 'ü', oelig: 'œ',
    Agrave: 'À', Acirc: 'Â', Ccedil: 'Ç', Eacute: 'É', Egrave: 'È', Ecirc: 'Ê', Icirc: 'Î', Ocirc: 'Ô', Ucirc: 'Û',
    rsquo: '’', lsquo: '‘', hellip: '…', ndash: '–', mdash: '—', bull: '•', middot: '·'
};

const PIECE = /<[^>]*>|&(?:#\d+|#x[0-9a-f]+|[a-z]+);|\r\n|[\s\S]/giu;

/**
 * Découpe le texte riche en morceaux : chaque balise, chaque entité, chaque caractère.
 *  - ch : le caractère vu par le lecteur ('' pour une balise de mise en forme, '\n' pour un
 *    retour à la ligne : <br>, retour tapé avec Maj+Entrée, début ou fin de <div> / <p>) ;
 *  - br / newline / block / close : nature du retour à la ligne ou de la balise.
 * @param {string} html
 *  - inline : nom d'une balise de mise en forme (b, font, span…).
 * @returns {{ raw: string, ch: string, br?: boolean, block?: string, inline?: string, close?: boolean }[]}
 */
function pieces(html) {
    const out = [];
    for (const [raw] of String(html ?? '').matchAll(PIECE)) {
        if (raw.length > 1 && raw.startsWith('<')) {
            const tag = /^<(\/?)([a-z0-9]+)/i.exec(raw);
            const name = tag?.[2].toLowerCase();
            if (name === 'br') out.push({ raw, ch: '\n', br: true });
            else if (name === 'div' || name === 'p') out.push({ raw, ch: '\n', block: name, close: tag[1] === '/' });
            else out.push({ raw, ch: '', inline: name, close: tag?.[1] === '/' });
        } else if (raw.length > 1 && raw.startsWith('&')) {
            const code = raw.slice(1, -1).toLowerCase();
            let ch = LETTER_ENTITIES[raw.slice(1, -1)] ?? ENTITIES[code];
            if (ch === undefined && code.startsWith('#')) {
                const point = code[1] === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
                ch = point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '?';
            }
            out.push({ raw, ch: ch ?? '?' });
        } else if (raw === '\n' || raw === '\r' || raw === '\r\n') {
            // Retour à la ligne tapé avec Maj+Entrée : la case l'affiche tel quel (white-space:
            // pre-wrap, css/sheet.css), c'est donc une vraie nouvelle ligne, comme un <br>
            out.push({ raw, ch: '\n', br: true, newline: true });
        } else {
            out.push({ raw, ch: raw });
        }
    }
    return out;
}

/**
 * Texte lu (caractères visibles) et outils reconnus.
 * @returns {{ list: Object[], at: number[], chars: string[], matches: { id: string, start: number, end: number }[] }}
 *   at : indice du morceau de chaque caractère ; start / end : indices dans chars (end exclu)
 */
function read(html) {
    const list = pieces(html);
    const at = [];
    const chars = [];
    list.forEach((piece, index) => {
        if (piece.ch !== '') {
            at.push(index);
            chars.push(piece.ch);
        }
    });
    // Texte replié, avec la position de chaque caractère replié dans chars
    const folded = [];
    const origin = [];
    chars.forEach((ch, index) => {
        for (const f of foldChar(ch)) {
            folded.push(f);
            origin.push(index);
        }
    });
    const taken = new Array(folded.length).fill(false);
    const matches = [];
    for (const needle of NEEDLES) {
        for (let i = 0; i < folded.length; i++) {
            if (folded[i] !== needle.folded[0] || isWordChar(folded[i - 1])) continue;
            const stop = needleEnd(folded, taken, i, needle);
            if (stop < 0) continue;
            const start = origin[i];
            const end = origin[stop - 1] + 1;
            if (needle.exact && chars.slice(start, end).join('').normalize('NFC').toLowerCase() !== needle.exact) continue;
            for (let k = i; k < stop; k++) taken[k] = true;
            matches.push({ id: needle.id, start, end });
        }
    }
    matches.sort((a, b) => a.start - b.start);
    return { list, at, chars, matches };
}

/**
 * Outils du manuel écrits dans la case « Outils ».
 * @param {string} html - valeur de profs_tools
 * @returns {string[]} identifiants (js/data/tools.js), dans l'ordre du texte, sans doublon
 */
export function toolsInText(html) {
    return [...new Set(read(html).matches.map((match) => match.id))];
}

/** Balises de mise en forme restées vides après un retrait */
const EMPTY_INLINE = /<(b|i|u|em|strong|span|font|mark|sub|sup)\b[^>]*><\/\1>/gi;

/** Reste d'une ligne qui ne porte plus d'outil : vide, ou la puce, le tiret ou le numéro seul */
const LINE_MARK_ONLY = /^[\s\u00a0]*(?:[-–—•·*‣◦▪●○+>]|\d{1,2}[.)])?[\s\u00a0]*$/u;

/** Retire une occurrence (voir removeToolFromText) */
function removeMatch({ list, at, chars }, { start, end }) {
    const gone = new Set();
    const drop = (from, to) => { for (let i = from; i < to; i++) gone.add(at[i]); };
    drop(start, end);

    const skipSpacesAfter = (i) => { while (isSpace(chars[i])) i++; return i; };
    const skipSpacesBefore = (i) => { while (i >= 0 && isSpace(chars[i])) i--; return i; };
    const isComma = (ch) => ch === ',' || ch === ';' || ch === '/';
    const isBr = (i) => chars[i] === '\n' && list[at[i]]?.br === true;
    const isEt = (i) => chars[i]?.toLowerCase() === 'e' && chars[i + 1]?.toLowerCase() === 't';

    const after = skipSpacesAfter(end);
    const before = skipSpacesBefore(start - 1);
    const etThenWord = (i) => isEt(i) && isSpace(chars[i + 2]) && isWordChar(chars[skipSpacesAfter(i + 2)]);
    if (chars[after] === '(') {
        // « Luth (offert), Dés » : la précision du joueur reste à sa place, avec sa virgule
        if (before < 0 || chars[before] === '\n') drop(end, after);
    } else if (isComma(chars[after])) {
        // « Luth, Lyre » → « Lyre » ; « Luth, et Lyre » → « Lyre »
        const next = skipSpacesAfter(after + 1);
        drop(end, chars[after] === ',' && etThenWord(next) ? skipSpacesAfter(next + 2) : next);
    } else if (before >= 0 && isComma(chars[before])) {
        // « Lyre, Luth » → « Lyre » ; « Lyre ; Luth » → « Lyre »
        drop(skipSpacesBefore(before - 1) + 1, start);
    } else if (after > end && isEt(after) && isSpace(chars[after + 2]) && isWordChar(chars[skipSpacesAfter(after + 2)])) {
        // « Luth et Lyre » → « Lyre »
        drop(end, skipSpacesAfter(after + 2));
    } else if (before < start - 1 && before >= 1 && isEt(before - 1) && isSpace(chars[before - 2]) && isWordChar(chars[skipSpacesBefore(before - 2)])) {
        // « Lyre et Luth » → « Lyre »
        drop(skipSpacesBefore(before - 2) + 1, start);
    } else if (before < start - 1 && before >= 1 && isEt(before - 1) && chars[skipSpacesBefore(before - 2)] === ','
        && skipSpacesBefore(before - 2) < before - 2) {
        // « Lyre, et Luth » → « Lyre »
        drop(skipSpacesBefore(before - 2), start);
    }

    // Ce qui reste sur la ligne de l'outil : rien, ou seulement la puce ou le tiret du joueur
    // (« - Luth », « • Luth », « 1. Luth ») ? Alors la ligne entière part, avec un seul retour à la ligne.
    let lineStart = start;
    while (lineStart > 0 && chars[lineStart - 1] !== '\n') lineStart--;
    let lineEnd = end;
    while (lineEnd < chars.length && chars[lineEnd] !== '\n') lineEnd++;
    let rest = '';
    for (let i = lineStart; i < lineEnd; i++) if (!gone.has(at[i])) rest += chars[i];
    if (!LINE_MARK_ONLY.test(rest)) return list.filter((_piece, index) => !gone.has(index)).map((piece) => piece.raw).join('');
    drop(lineStart, lineEnd);

    // Ligne en <div> ou <p> restée vide : elle part avec l'outil, pas les autres lignes vides
    const first = at[start];
    const last = at[end - 1];
    let open = first - 1;
    while (open >= 0 && !list[open].block) open--;
    let close = last + 1;
    while (close < list.length && !list[close].block) close++;
    let blockGone = false;
    if (open >= 0 && close < list.length && !list[open].close && list[close].close && list[open].block === list[close].block) {
        blockGone = true;
        for (let i = open + 1; i < close && blockGone; i++) {
            const piece = list[i];
            blockGone = gone.has(i) || piece.ch === '' || piece.br === true || isSpace(piece.ch);
        }
        if (blockGone) for (let i = open; i <= close; i++) gone.add(i);
    }
    if (!blockGone) {
        if (isBr(lineEnd)) {
            drop(lineEnd, lineEnd + 1);
            // Première ligne du texte : pas de ligne vide laissée en tête
            if (chars.slice(0, lineStart).every((ch) => isSpace(ch) || ch === '\n')) {
                let i = lineEnd + 1;
                while (isBr(i) || isSpace(chars[i])) i++;
                if (i < chars.length) drop(lineEnd + 1, i);
            }
        } else if (lineStart > 0 && isBr(lineStart - 1)) {
            drop(lineStart - 1, lineStart);
        }
    }

    return list.filter((_piece, index) => !gone.has(index)).map((piece) => piece.raw).join('');
}

/**
 * Retire un outil de la case : son nom (toutes ses écritures reconnues) et son séparateur
 * (virgule, « ; », « / », « et », retour à la ligne avec sa puce ou son tiret). Le reste du texte,
 * écrit à la main, ne change pas ; une précision entre parenthèses après le nom reste en place.
 * @param {string} html - valeur de profs_tools
 * @param {string} toolId
 * @returns {string}
 */
export function removeToolFromText(html, toolId) {
    let text = String(html ?? '');
    for (let guard = 0; guard < 50; guard++) {
        const state = read(text);
        const match = state.matches.find((m) => m.id === toolId);
        if (!match) break;
        text = removeMatch(state, match);
    }
    if (text === String(html ?? '')) return text;
    let previous;
    do {
        previous = text;
        text = text.replace(EMPTY_INLINE, '');
    } while (text !== previous);
    // Plus rien de visible : case vide
    return read(text).chars.every((ch) => isSpace(ch) || ch === '\n') ? '' : text;
}

/**
 * Morceau après lequel écrire à la suite du dernier mot. Une mise en forme qui ne couvre qu'une
 * partie de la ligne (« Chariots, <b>Luth</b> ») n'est pas prolongée : on écrit après sa balise
 * fermante. Une mise en forme de toute la ligne (texte entier en couleur) est gardée.
 * @param {Object[]} list - morceaux (pieces)
 * @param {number} last - morceau du dernier caractère visible
 * @returns {number}
 */
function endOfLastWord(list, last) {
    let point = last;
    for (let i = last + 1; i < list.length && list[i].inline && list[i].close; i++) {
        let depth = 0;
        let open = -1;
        for (let k = i - 1; k >= 0 && open < 0; k--) {
            if (list[k].inline !== list[i].inline) continue;
            if (list[k].close) depth++;
            else if (depth === 0) open = k;
            else depth--;
        }
        if (open < 0) break;
        let partial = false;
        for (let k = open - 1; k >= 0 && list[k].ch !== '\n' && !partial; k--) {
            partial = list[k].ch !== '' && !isSpace(list[k].ch);
        }
        if (!partial) break;
        point = i;
    }
    return point;
}

/**
 * Ajoute un outil à la case, à la suite, en gardant la présentation déjà là : une ligne par outil
 * si le texte est déjà sur plusieurs lignes, sinon une liste séparée par des virgules.
 * @param {string} html - valeur de profs_tools
 * @param {string} toolId
 * @returns {string} texte inchangé si l'outil y est déjà (ou s'il est inconnu)
 */
export function addToolToText(html, toolId) {
    const text = String(html ?? '');
    const tool = TOOL_BY_ID.get(toolId);
    if (!tool) return text;
    const { list, at, chars, matches } = read(text);
    if (matches.some((match) => match.id === toolId)) return text;

    let lastChar = chars.length - 1;
    while (lastChar >= 0 && (isSpace(chars[lastChar]) || chars[lastChar] === '\n')) lastChar--;
    if (lastChar < 0) return tool.name;

    const lines = chars.join('').split('\n').filter((line) => line.trim() !== '');
    const lastLine = lines[lines.length - 1];
    const byLine = lines.length >= 2 && !/[,;/]/.test(lastLine);
    const lastPiece = at[lastChar];
    const insertAfter = (index, added) => list.map((piece, i) => (i === index ? piece.raw + added : piece.raw)).join('');

    if (!byLine) {
        const last = chars[lastChar];
        // Après « Luth, », « Luth / » ou « Mes outils : » : une espace suffit (celle déjà écrite, s'il y en a une)
        if (/[,;:/]/.test(last)) {
            return isSpace(chars[lastChar + 1]) ? insertAfter(at[lastChar + 1], tool.name) : insertAfter(lastPiece, ` ${tool.name}`);
        }
        // Séparateur déjà choisi par le joueur (« Luth ; Dés », « Luth / Dés »), sinon la virgule ;
        // après une phrase finie (« Aucun. »), pas de virgule
        let separator = ', ';
        if (last === '.' || last === '!') separator = ' ';
        else if (!lastLine.includes(',') && lastLine.includes(';')) separator = /\s;/.test(lastLine) ? ' ; ' : '; ';
        else if (!lastLine.includes(',') && lastLine.includes('/')) separator = /\s\/\s/.test(lastLine) ? ' / ' : '/';
        return insertAfter(endOfLastWord(list, lastPiece), `${separator}${tool.name}`);
    }
    // Une ligne par outil : nouvelle ligne du même genre que la dernière (<div>, <p> ou <br>), avec
    // la même puce ou le même tiret (« - Luth ») et le même style de paragraphe (texte centré…)
    const mark = /^[\s\u00a0]*([-–—•·*‣◦▪●○+>][\s\u00a0]*)/u.exec(lastLine)?.[1] ?? '';
    let next = lastPiece + 1;
    while (next < list.length && !list[next].block) next++;
    if (next < list.length && list[next].close) {
        const tag = list[next].block;
        let open = lastPiece;
        while (open >= 0 && !(list[open].block === tag && !list[open].close)) open--;
        return insertAfter(next, `${open >= 0 ? list[open].raw : `<${tag}>`}${mark}${tool.name}</${tag}>`);
    }
    // Même retour à la ligne que le précédent : <br>, ou celui tapé avec Maj+Entrée
    let previous = lastPiece;
    while (previous >= 0 && !list[previous].br) previous--;
    const lineBreak = previous >= 0 && list[previous].newline ? list[previous].raw : '<br>';
    return insertAfter(endOfLastWord(list, lastPiece), `${lineBreak}${mark}${tool.name}`);
}

/**
 * Outil donné par un historique.
 * @param {string} toolKey - DD_RULES.backgrounds[…].toolProfs[0] (« Gaming Set »…)
 * @returns {null | { toolId: string|null, categoryId: string, label: string }}
 *   toolId : outil précis (null pour un outil au choix dans la catégorie) ; label : « Outils de
 *   voleur », « un type de boîte de jeux au choix »
 */
export function backgroundToolExpectation(toolKey) {
    const entry = BACKGROUND_TOOLS[toolKey];
    if (!entry) return null;
    if (entry.tool) {
        const tool = TOOL_BY_ID.get(entry.tool);
        return tool ? { toolId: tool.id, categoryId: tool.category, label: tool.name } : null;
    }
    const category = TOOL_CATEGORIES.find((c) => c.id === entry.category);
    return category ? { toolId: null, categoryId: category.id, label: category.choice } : null;
}

/**
 * L'outil attendu (ou un outil de la catégorie au choix) est-il écrit dans la case ?
 * @param {string} html - valeur de profs_tools
 * @param {{ toolId: string|null, categoryId: string }|null} expectation
 * @returns {boolean}
 */
export function expectedToolNoted(html, expectation) {
    if (!expectation) return false;
    const ids = toolsInText(html);
    return expectation.toolId
        ? ids.includes(expectation.toolId)
        : ids.some((id) => TOOL_BY_ID.get(id)?.category === expectation.categoryId);
}

/** « Dextérité » */
export const toolAbilityName = (tool) => ABILITIES.find((a) => a.id === tool?.ability)?.name ?? '';

/**
 * Recherche de la fenêtre : nom, autres écritures, catégorie ou caractéristique, accents et
 * majuscules ignorés.
 * @param {Object} tool
 * @param {string} query
 * @returns {boolean}
 */
export function matchesToolQuery(tool, query) {
    const q = foldText(query).trim();
    if (!q) return true;
    const category = TOOL_CATEGORIES.find((c) => c.id === tool.category)?.name;
    return [tool.name, ...(tool.aliases ?? []), category, toolAbilityName(tool)].some((text) => foldText(text).includes(q));
}

/**
 * Outils rangés par catégorie, dans l'ordre du manuel.
 * @returns {{ id: string, name: string, tools: Object[] }[]}
 */
export function toolGroups() {
    return TOOL_CATEGORIES.map((category) => ({
        id: category.id, name: category.name, tools: TOOLS.filter((tool) => tool.category === category.id)
    }));
}
