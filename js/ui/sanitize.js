// =============================================================================
// SANITIZE.JS - Nettoyage du HTML avant affichage (protection contre l'injection)
//
// Le texte riche des joueurs (gras, couleurs, retours à la ligne) et les textes
// de règles (descriptions de dons) passent par DOMPurify, chargé dans index.html.
// Si DOMPurify n'a pas pu se charger (hors ligne), on n'affiche que le texte brut
// (retours à la ligne conservés) et les champs riches passent en lecture seule
// (richTextAvailable, js/ui/sheet.js et lock.js) : le texte enregistré n'est jamais
// réécrit à partir de cet affichage simplifié.
//
// Aucun attribut data-* ni aria-* n'est gardé : un texte importé ne doit jamais pouvoir
// se faire passer pour un élément de la fiche (data-field, data-out, data-icon…).
// =============================================================================

import { safeText } from '../state/migrate.js';

/** Balises produites par l'édition riche (v3 : execCommand → <font>, <div>...) */
const RICH_CONFIG = {
    ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'br', 'span', 'sub', 'sup', 'mark', 'div', 'p', 'font'],
    // Pas de « class » : une fiche importée ne doit pas pouvoir reprendre les classes de l'application
    ALLOWED_ATTR: ['style', 'color', 'size'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false
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
    ALLOWED_ATTR: ['href'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false
};

function escapeText(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Fin de ligne d'un texte riche : <br> ou fin de bloc (<div>, <p>, <li>) */
const LINE_BREAK = /<br\s*\/?>|<\/(div|p|li)>/gi;

/**
 * Texte brut, retours à la ligne gardés (seule balise produite : <br>, le reste est échappé).
 * @param {*} html
 * @returns {string}
 */
export function plainText(html) {
    const marked = safeText(html).replace(LINE_BREAK, '\n');
    const text = new DOMParser().parseFromString(marked, 'text/html').body.textContent || '';
    return escapeText(text.replace(/\n+$/, '')).replace(/\n/g, '<br>');
}

/**
 * DOMPurify est-il chargé ? Sinon (connexion coupée au premier chargement), les textes longs
 * s'affichent sans mise en forme et ne doivent pas être modifiés : les réenregistrer
 * effacerait leur mise en forme.
 * @returns {boolean}
 */
export function richTextAvailable() {
    return typeof globalThis.DOMPurify?.sanitize === 'function';
}

/** Réglages de DOMPurify (lus par les tests) */
export const SANITIZE_CONFIGS = Object.freeze({ rich: RICH_CONFIG, rules: RULES_CONFIG });

/**
 * Derniers résultats, par DOMPurify chargé puis par réglage : la fiche réaffiche à chaque frappe
 * les mêmes textes longs et les mêmes descriptions de dons, inutile de les renettoyer.
 * Le nettoyage d'un même texte avec le même réglage donne toujours le même résultat.
 */
const CACHE_SIZE = 200;
const cache = new WeakMap();

function cacheFor(purifier, config) {
    let byConfig = cache.get(purifier);
    if (!byConfig) cache.set(purifier, byConfig = new Map());
    let entries = byConfig.get(config);
    if (!entries) byConfig.set(config, entries = new Map());
    return entries;
}

function purify(html, config) {
    const purifier = globalThis.DOMPurify;
    if (!richTextAvailable()) return plainText(html);
    ensureStyleHook(purifier);
    const text = safeText(html);
    const entries = cacheFor(purifier, config);
    if (entries.has(text)) return entries.get(text);
    const clean = purifier.sanitize(text, config);
    // Seulement les chaînes (un DOMPurify d'essai peut rendre autre chose)
    if (typeof clean === 'string') {
        if (entries.size >= CACHE_SIZE) entries.delete(entries.keys().next().value);
        entries.set(text, clean);
    }
    return clean;
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
