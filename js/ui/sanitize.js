// =============================================================================
// SANITIZE.JS - Nettoyage du HTML avant affichage (protection contre l'injection)
//
// Le texte riche des joueurs (gras, couleurs, retours à la ligne) et les textes
// de règles (descriptions de dons) passent par DOMPurify, chargé dans index.html.
// Si DOMPurify n'a pas pu se charger (hors ligne), on n'affiche que le texte brut.
// =============================================================================

/** Balises produites par l'édition riche (v3 : execCommand → <font>, <div>...) */
const RICH_CONFIG = {
    ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'br', 'span', 'sub', 'sup', 'mark', 'div', 'p', 'font'],
    ALLOWED_ATTR: ['style', 'class', 'color', 'size']
};

/** Textes de règles : mise en forme simple et liens */
const RULES_CONFIG = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'a', 'span'],
    ALLOWED_ATTR: ['href']
};

function escapeText(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function plainText(html) {
    return escapeText(new DOMParser().parseFromString(String(html ?? ''), 'text/html').body.textContent || '');
}

function purify(html, config) {
    const purifier = globalThis.DOMPurify;
    return purifier?.sanitize ? purifier.sanitize(String(html ?? ''), config) : plainText(html);
}

/**
 * HTML sûr pour un champ de texte riche saisi par le joueur.
 * @param {string} html
 * @returns {string}
 */
export function sanitizeRich(html) {
    return purify(html, RICH_CONFIG);
}

/**
 * HTML sûr pour un texte de règles (description de don...).
 * @param {string} html
 * @returns {string}
 */
export function sanitizeRulesText(html) {
    return purify(html, RULES_CONFIG);
}
