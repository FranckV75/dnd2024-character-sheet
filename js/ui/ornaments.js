// =============================================================================
// ORNAMENTS.JS - Icônes dorées des titres de section et des onglets
//
// Dans index.html, un titre ou un onglet porte data-icon="<nom>" (une clé des icônes de
// dom.js : swords, shield, star, scroll...). L'icône dessinée est ajoutée devant son texte ;
// sa couleur (or) et le filet décoratif des titres sont réglés dans css/sheet.css.
// Un module qui construit lui-même un titre peut lui donner data-icon puis appeler
// decorateIcons() sur son conteneur.
// =============================================================================

import { icon } from './dom.js';

/**
 * Ajoute l'icône de chaque élément [data-icon] de `root` (une seule fois par élément).
 * @param {ParentNode} root
 */
export function decorateIcons(root = document) {
    for (const host of root.querySelectorAll('[data-icon]')) {
        if (host.querySelector(':scope > .icon')) continue;
        host.prepend(icon(host.dataset.icon));
    }
}
