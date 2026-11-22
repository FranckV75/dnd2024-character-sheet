// =============================================================================
// STATUS-BAR.JS (données) - Place de la barre du haut (#save-status), en caractères
//
// Une mesure d'écran, pas une règle du jeu : les messages qui doivent tenir dans la barre sans être
// coupés choisissent leur phrase la plus complète qui tient dans cette place (js/rules/odyssey.js,
// js/ui/weapons.js). Largeurs : css/toolbar.css (« Mode d'emploi » : menu « Gestion »).
// À ne pas confondre avec js/ui/status-bar.js, qui déplie un message coupé quand on le touche.
// =============================================================================

/** Tablette, menu « Gestion » replié : une ligne (591 px à 768 px, une centaine de caractères) */
export const STATUS_ROOM = 95;
/** Tablette, menu « Gestion » ouvert : deux lignes (place réservée par css/toolbar.css) */
export const STATUS_ROOM_OPEN = 180;
/** Ordinateur : colonne étroite à côté des boutons, deux lignes courtes */
export const STATUS_ROOM_NARROW = 56;

/**
 * Place d'un message selon l'écran (simple choix entre les trois mesures ci-dessus).
 * @param {boolean} compact - tablette (matchMedia(COMPACT_QUERY), js/ui/toolbar.js) ; sinon ordinateur
 * @param {boolean} [menuOpen] - le message répond à une case du menu « Gestion », ouvert
 * @returns {number} caractères
 */
export function statusRoom(compact, menuOpen = false) {
    if (!compact) return STATUS_ROOM_NARROW;
    return menuOpen ? STATUS_ROOM_OPEN : STATUS_ROOM;
}
