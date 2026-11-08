// =============================================================================
// MOTION-PREF.JS - Animations de la fiche : en marche ou coupées
//
// Deux raisons de couper tout ce qui bouge (reflets, flamme de la Rage, objets magiques,
// ouverture animée, étincelles...) :
//  - l'appareil le demande (réglage d'accessibilité : prefers-reduced-motion) ;
//  - le joueur l'a choisi avec le bouton « Animations » de la barre Gestion (toolbar.js).
// Le choix du joueur est retenu sur l'appareil (localStorage, comme le thème), jamais dans la
// sauvegarde de la fiche. Il est posé sur <html data-animations="off"> : dès le chargement par
// js/boot-theme.js (même clé), puis ici. La règle qui fige les animations CSS est dans
// css/motion.css ; les mouvements joués en JavaScript lisent motionOff() avant de partir.
// =============================================================================

const STORAGE_KEY = 'dd2024_motion';
const ATTRIBUTE = 'animations';
const CHANGE_EVENT = 'dd:motionchange';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** L'appareil demande moins d'animations (réglage d'accessibilité) */
export function deviceReducesMotion() {
    return reducedMotion.matches;
}

/** Le joueur a coupé les animations avec le bouton de la barre Gestion */
export function animationsOffByChoice() {
    return document.documentElement.dataset[ATTRIBUTE] === 'off';
}

/** Rien ne doit bouger : appareil ou choix du joueur */
export function motionOff() {
    return reducedMotion.matches || animationsOffByChoice();
}

/**
 * Coupe ou rallume les animations (choix retenu sur cet appareil)
 * @param {boolean} on
 */
export function setAnimations(on) {
    const html = document.documentElement;
    if (on) delete html.dataset[ATTRIBUTE];
    else html.dataset[ATTRIBUTE] = 'off';
    try {
        if (on) localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, 'off');
    } catch {
        // Stockage indisponible (navigation privée) : le choix vaut pour la session
    }
    document.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** Applique le choix retenu (déjà posé par boot-theme.js ; relu ici par sécurité) */
export function initAnimations() {
    let stored = null;
    try {
        stored = localStorage.getItem(STORAGE_KEY);
    } catch {
        // Stockage indisponible : animations en marche
    }
    if (stored === 'off') document.documentElement.dataset[ATTRIBUTE] = 'off';
}

/**
 * Prévient quand l'état change (bouton de la barre, ou réglage de l'appareil)
 * @param {() => void} callback
 */
export function onMotionChange(callback) {
    document.addEventListener(CHANGE_EVENT, callback);
    reducedMotion.addEventListener?.('change', callback);
}
