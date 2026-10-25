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
    ],
    // Barre « Gestion »
    menu: [['path', { d: 'M2.5 4h11M2.5 8h11M2.5 12h11' }]],
    lock: [
        ['rect', { x: '3', y: '7', width: '10', height: '7', rx: '1.5' }],
        ['path', { d: 'M5.5 7V5a2.5 2.5 0 0 1 5 0v2M8 10v1.2' }]
    ],
    unlock: [
        ['rect', { x: '3', y: '7', width: '10', height: '7', rx: '1.5' }],
        ['path', { d: 'M5.5 7V5a2.5 2.5 0 0 1 4.9-.7M8 10v1.2' }]
    ],
    eye: [
        ['path', { d: 'M1.5 8S3.9 3.5 8 3.5 14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z' }],
        ['circle', { cx: '8', cy: '8', r: '2' }]
    ],
    close: [['path', { d: 'M4 4l8 8M12 4l-8 8' }]],
    'file-plus': [
        ['path', { d: 'M9.5 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5zM9.5 1.5V5H13M8 7.5v4M6 9.5h4' }]
    ],
    import: [['path', { d: 'M8 2v8M5 7l3 3 3-3M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2' }]],
    export: [['path', { d: 'M8 10V2M5 5l3-3 3 3M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2' }]],
    printer: [
        ['path', { d: 'M4.5 6V2h7v4M4.5 11.5H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1h-1.5' }],
        ['rect', { x: '4.5', y: '9', width: '7', height: '5', rx: '.5' }]
    ],
    moon: [['path', { d: 'M13.5 9.6A5.6 5.6 0 0 1 6.4 2.5a5.6 5.6 0 1 0 7.1 7.1z' }]],
    sun: [
        ['circle', { cx: '8', cy: '8', r: '2.8' }],
        ['path', { d: 'M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3.05 3.05l1.13 1.13M11.82 11.82l1.13 1.13M3.05 12.95l1.13-1.13M11.82 4.18l1.13-1.13' }]
    ],
    image: [
        ['rect', { x: '1.5', y: '2.5', width: '13', height: '11', rx: '1.5' }],
        ['circle', { cx: '5.5', cy: '6', r: '1.2' }],
        ['path', { d: 'M2 12l3.8-3.8 2.7 2.7 2-2 3.5 3.5' }]
    ],
    user: [
        ['circle', { cx: '8', cy: '5.3', r: '2.8' }],
        ['path', { d: 'M2.5 14c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5' }]
    ],
    users: [
        ['circle', { cx: '6', cy: '5.5', r: '2.4' }],
        ['path', { d: 'M1.5 13.5c.6-2.6 2.3-3.8 4.5-3.8s3.9 1.2 4.5 3.8M10.6 3.3a2.4 2.4 0 0 1 0 4.5M12 9.9c1.3.4 2.1 1.6 2.5 3.6' }]
    ],
    logout: [['path', { d: 'M6 2.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H6M10.5 5l3 3-3 3M13.5 8H6' }]],
    cloud: [['path', { d: 'M4.5 12.5h7a3 3 0 0 0 .4-6 4 4 0 0 0-7.7 1 2.5 2.5 0 0 0 .3 5z' }]]
};

/**
 * Petite icône SVG monochrome (suit la couleur du texte, donc les deux thèmes).
 * Décorative : le bouton qui la contient porte son propre nom accessible.
 * @param {string} name une clé de ICONS (gear, trash, lock, printer...)
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

/**
 * Remplace le contenu d'un bouton par une icône suivie de son libellé.
 * @param {HTMLElement} button
 * @param {string} name une clé de ICONS
 * @param {string} text
 */
export function setIconLabel(button, name, text) {
    button.replaceChildren(icon(name), el('span', { class: 'btn-label', text }));
}
