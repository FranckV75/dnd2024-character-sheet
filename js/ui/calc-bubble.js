/**
 * BULLE DE CALCUL — détail d'une valeur calculée (CA d'une armure, écusson CA)
 *
 * Même cadre que l'infobulle des sorts. S'ouvre au toucher ou au clic, au survol de la souris et
 * au focus clavier ; se ferme en touchant ailleurs, avec Échap, ou en quittant la valeur à la
 * souris. Fonctionne aussi fiche verrouillée (lecture seule).
 */

import { el } from './dom.js';

const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * @param {{ id: string, className?: string }} options
 * @returns {{ attach: Function, hide: Function, refresh: Function, hideOnScroll: Function }}
 */
export function createCalcBubble({ id, className = '' }) {
    const bubble = el('div', { class: `spell-tooltip ${className}`.trim(), id, role: 'tooltip', hidden: true });
    let owner = null;
    let ownerFill = null;
    let hideTimer = null;

    function position(anchor) {
        const rect = anchor.getBoundingClientRect();
        const margin = 8;
        const viewportWidth = document.documentElement.clientWidth;
        const visual = window.visualViewport;
        const viewTop = visual ? visual.offsetTop : 0;
        const height = bubble.offsetHeight;
        // Au-dessus de la valeur s'il y a la place (elle reste lisible), sinon en dessous
        let top = rect.top - viewTop >= height + 2 * margin ? rect.top - height - margin : rect.bottom + margin;
        if (top < viewTop + margin) top = viewTop + margin;
        const left = Math.max(margin, Math.min(rect.left + rect.width / 2 - bubble.offsetWidth / 2, viewportWidth - bubble.offsetWidth - margin));
        bubble.style.left = `${left + window.scrollX}px`;
        bubble.style.top = `${top + window.scrollY}px`;
    }

    /** fill() rend la liste des nœuds à afficher, ou null (rien à montrer) */
    function show(anchor, fill) {
        clearTimeout(hideTimer);
        const content = fill();
        if (!content) return;
        // replaceChildren écrirait « null » en toutes lettres : on ne lui passe que des nœuds
        bubble.replaceChildren(...content.filter(Boolean));
        if (owner && owner !== anchor) owner.removeAttribute('aria-describedby');
        bubble.hidden = false;
        position(anchor);
        owner = anchor;
        ownerFill = fill;
        anchor.setAttribute('aria-describedby', id);
    }

    function hide() {
        clearTimeout(hideTimer);
        bubble.hidden = true;
        if (owner) owner.removeAttribute('aria-describedby');
        owner = null;
        ownerFill = null;
    }

    function scheduleHide() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            if (bubble.matches(':hover') || (owner && owner === document.activeElement)) return;
            hide();
        }, 150);
    }

    /** Bulle ouverte : son contenu suit le calcul (Dextérité modifiée, armure équipée…) */
    function refresh() {
        if (!owner || bubble.hidden) return;
        if (!owner.isConnected || owner.hidden) {
            hide();
            return;
        }
        const content = ownerFill();
        if (!content) {
            hide();
            return;
        }
        bubble.replaceChildren(...content.filter(Boolean));
        position(owner);
    }

    /**
     * Relie une valeur à la bulle.
     * Toucher ou clic : ouvre / ferme. Le focus qui accompagne ce toucher n'ouvre rien (sinon le
     * clic qui suit refermerait aussitôt la bulle) ; le focus au clavier (Tab) l'ouvre.
     */
    function attach(anchor, fill) {
        let pressing = false;
        anchor.addEventListener('pointerdown', () => { pressing = true; });
        anchor.addEventListener('click', () => {
            pressing = false;
            // À la souris, la bulle est déjà ouverte par le survol : le clic la garde ouverte
            if (owner === anchor && !bubble.hidden && !canHover()) hide();
            else show(anchor, fill);
        });
        anchor.addEventListener('mouseenter', () => { if (canHover()) show(anchor, fill); });
        anchor.addEventListener('mouseleave', () => { if (canHover()) scheduleHide(); });
        anchor.addEventListener('focus', () => { if (!pressing) show(anchor, fill); });
        anchor.addEventListener('blur', () => { pressing = false; scheduleHide(); });
    }

    document.addEventListener('pointerdown', (event) => {
        if (bubble.hidden || bubble.contains(event.target) || owner?.contains(event.target)) return;
        hide();
    }, true);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !bubble.hidden) hide();
    });
    bubble.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    bubble.addEventListener('mouseleave', scheduleHide);
    window.addEventListener('resize', hide, { passive: true });
    document.body.append(bubble);

    return {
        attach,
        hide,
        refresh,
        /** Ferme la bulle quand ce conteneur défile (la valeur bougerait sous la bulle) */
        hideOnScroll: (container) => container.addEventListener('scroll', hide, { passive: true })
    };
}
