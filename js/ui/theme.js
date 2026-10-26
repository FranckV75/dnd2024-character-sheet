// =============================================================================
// THEME.JS - Thème clair / sombre (attribut data-theme sur <html>)
// =============================================================================

const STORAGE_KEY = 'dd2024_theme';

/** Dévoilement du nouveau thème : durée (ms) et courbe (départ vif, arrivée douce) */
const REVEAL = { duration: 500, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' };

/**
 * Applique le thème mémorisé (clair par défaut)
 */
export function initTheme() {
    setTheme(readStoredTheme());
}

/**
 * @param {'light'|'dark'} theme
 */
export function setTheme(theme) {
    const value = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = value;
    try {
        localStorage.setItem(STORAGE_KEY, value);
    } catch {
        // Stockage indisponible (navigation privée) : le thème reste valable pour la session
    }
}

/** Thème demandé dont le passage n'a pas encore commencé (clics rapprochés) */
let pendingTheme = null;

/**
 * Bascule clair ↔ sombre (bouton de la barre de gestion). Le nouveau thème s'ouvre en
 * cercle depuis le bouton (View Transitions API, réglages dans css/motion.css) quand le
 * navigateur le permet et que l'utilisateur ne limite pas les animations ; sinon,
 * changement immédiat.
 */
export function toggleTheme() {
    const html = document.documentElement;
    const next = (pendingTheme || html.dataset.theme) === 'dark' ? 'light' : 'dark';
    if (!canAnimate()) {
        setTheme(next);
        return;
    }
    const { x, y, radius } = revealCircle();
    pendingTheme = next;
    const transition = document.startViewTransition(() => {
        // Pendant le passage, les couleurs passent d'un coup à leur valeur finale (motion.css) :
        // le cercle dévoile une image nette au lieu de couleurs encore en transition
        html.dataset.themeFading = 'true';
        setTheme(next);
        if (pendingTheme === next) pendingTheme = null;
    });
    transition.ready
        .then(() => {
            html.animate(
                { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
                { ...REVEAL, pseudoElement: '::view-transition-new(root)' });
        })
        // Passage abandonné (second clic rapide, onglet masqué) : le thème est appliqué quand même
        .catch(() => {});
    transition.finished.catch(() => {}).finally(() => {
        if (pendingTheme === null) delete html.dataset.themeFading;
    });
}

/**
 * Cercle du dévoilement : centré sur le bouton du thème (ou en haut de l'écran s'il est
 * masqué), assez grand pour couvrir tout l'écran à la fin.
 * @returns {{ x: number, y: number, radius: number }}
 */
function revealCircle() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const box = document.getElementById('btn-theme')?.getBoundingClientRect();
    const visible = box && box.width > 0 && box.bottom > 0 && box.top < height;
    const x = Math.round(visible ? box.left + box.width / 2 : width / 2);
    const y = Math.round(visible ? box.top + box.height / 2 : 0);
    const radius = Math.ceil(Math.hypot(Math.max(x, width - x), Math.max(y, height - y)));
    return { x, y, radius };
}

function canAnimate() {
    return typeof document.startViewTransition === 'function'
        && document.visibilityState === 'visible'
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readStoredTheme() {
    try {
        return localStorage.getItem(STORAGE_KEY) || 'light';
    } catch {
        return 'light';
    }
}
