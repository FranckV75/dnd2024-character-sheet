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
    // Pas de « class » : une fiche importée ne doit pas pouvoir reprendre les classes de l'application
    ALLOWED_ATTR: ['style', 'color', 'size']
};

/**
 * Propriétés CSS conservées dans un style="…" de texte riche (mise en forme du texte seulement).
 * Tout le reste (position, inset, z-index, background-image…) est retiré.
 */
const STYLE_PROPS = new Set([
    'color', 'background-color', 'font-family', 'font-size', 'font-weight', 'font-style',
    'text-decoration', 'text-decoration-line', 'text-align', 'white-space', 'line-height',
    'margin-top', 'margin-bottom'
]);

/** Valeurs refusées : requêtes réseau (url, image-set, @import) et constructions dynamiques */
const UNSAFE_VALUE = /url\s*\(|image-set|expression|var\s*\(|@import/i;

let styleHookInstalled = false;

/**
 * Filtre des attributs style (installé une seule fois, au premier nettoyage, pour couvrir
 * aussi un DOMPurify chargé tardivement). Seul RICH_CONFIG autorise style : les textes de
 * règles ne sont pas concernés.
 * @param {Object} purifier - DOMPurify
 */
function ensureStyleHook(purifier) {
    if (styleHookInstalled || typeof purifier.addHook !== 'function') return;
    styleHookInstalled = true;
    purifier.addHook('uponSanitizeAttribute', (_node, data) => {
        if (data.attrName !== 'style') return;
        // Élément détaché : l'analyse du style ne déclenche aucune requête
        const probe = document.createElement('span').style;
        probe.cssText = data.attrValue;
        const kept = [];
        // Les raccourcis (font, margin…) sont développés en propriétés détaillées
        for (const prop of [...probe]) {
            const value = probe.getPropertyValue(prop);
            // « initial » : valeur par défaut posée par un raccourci (background: url(…)) : inutile
            if (STYLE_PROPS.has(prop) && value !== 'initial' && !UNSAFE_VALUE.test(value)) kept.push(`${prop}: ${value}`);
        }
        if (kept.length) data.attrValue = `${kept.join('; ')};`;
        else data.keepAttr = false;
    });
}

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
    if (!purifier?.sanitize) return plainText(html);
    ensureStyleHook(purifier);
    return purifier.sanitize(String(html ?? ''), config);
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
