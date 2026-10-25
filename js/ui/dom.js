// =============================================================================
// DOM.JS - Petits utilitaires de construction d'interface (partagés)
// Règle : on construit le DOM avec du texte, jamais avec du HTML non nettoyé.
// =============================================================================

/**
 * Crée un élément.
 * - attrs.class → className ; attrs.text → textContent ; booléen true → attribut vide ;
 *   false / null / undefined → attribut ignoré ; attrs.on = { click: fn } → écouteurs.
 * @param {string} tag
 * @param {Object} [attrs]
 * @param {...(Node|string|Array)} children
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (value === false || value === null || value === undefined) continue;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key === 'on') for (const [type, fn] of Object.entries(value)) node.addEventListener(type, fn);
        else node.setAttribute(key, value === true ? '' : value);
    }
    node.append(...children.flat().filter(c => c !== null && c !== undefined && c !== false));
    return node;
}

/**
 * Remplit un <select> : une option vide puis [valeur, libellé].
 * @param {HTMLSelectElement} select
 * @param {Array<[string, string]>} options
 * @param {string} [placeholder]
 */
export function fillSelect(select, options, placeholder = '— Choisir —') {
    select.replaceChildren(el('option', { value: '', text: placeholder }),
        ...options.map(([value, label]) => el('option', { value, text: label })));
}

/** "+3" / "-1" */
export const signed = (n) => (n >= 0 ? `+${n}` : String(n));

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Tracés des icônes (grille 16 × 16), dessinés dans la couleur du texte (currentColor) */
const ICONS = {
    gear: [
        ['circle', { cx: '8', cy: '8', r: '4.3' }],
        ['circle', { cx: '8', cy: '8', r: '1.6' }],
        ['path', {
            d: 'M8 1.4V3.7M8 12.3v2.3M1.4 8h2.3M12.3 8h2.3M3.33 3.33l1.63 1.63M11.04 11.04l1.63 1.63M3.33 12.67l1.63-1.63M11.04 4.96l1.63-1.63',
            'stroke-width': '2.2'
        }]
    ],
    trash: [
        ['path', { d: 'M2.5 4h11M6 4V2.5h4V4M3.8 4l.8 9.5h6.8l.8-9.5M6.5 6.5v4.8M9.5 6.5v4.8' }]
    ]
};

/**
 * Petite icône SVG monochrome (suit la couleur du texte, donc les deux thèmes).
 * Décorative : le bouton qui la contient porte son propre nom accessible.
 * @param {'gear'|'trash'} name
 * @returns {SVGSVGElement}
 */
export function icon(name) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    const attrs = {
        viewBox: '0 0 16 16', width: '14', height: '14', 'aria-hidden': 'true', focusable: 'false',
        fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'icon'
    };
    for (const [key, value] of Object.entries(attrs)) svg.setAttribute(key, value);
    for (const [tag, shapeAttrs] of ICONS[name] || []) {
        const shape = document.createElementNS(SVG_NS, tag);
        for (const [key, value] of Object.entries(shapeAttrs)) shape.setAttribute(key, value);
        svg.append(shape);
    }
    return svg;
}
