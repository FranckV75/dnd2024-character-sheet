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
