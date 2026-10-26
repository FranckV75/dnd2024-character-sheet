// =============================================================================
// MOTION.JS - Mouvements de la fiche (styles : css/motion.css)
//
//  - Ouverture (une seule fois, au chargement) : la page apparaît en fondu, la barre de
//    gestion descend se poser, puis les cadres de l'onglet affiché montent en cascade,
//    dans l'ordre de lecture (de haut en bas, de gauche à droite) ; le filet sous les
//    onglets s'ouvre depuis le centre. Moins de 0,7 s.
//  - Changement d'onglet (événement 'dd:tabchange' de tabs.js) : le panneau arrive en
//    glissant du côté de l'onglet choisi.
//  - Survol d'une carte (ordinateur) : seules les cartes compactes réagissent (cases de
//    valeurs, caractéristiques, hexagone de la CA... jamais les sections de tableaux ou de
//    texte). La carte se soulève de 2 px avec une ombre plus profonde (sauf fiche
//    verrouillée : rien n'y est modifiable). Si la souris s'y pose vraiment (immobile un
//    demi-instant), un reflet doré la traverse une fois : au plus un reflet toutes les 9 s
//    sur toute la fiche, et une seule fois par carte tant qu'on reste sur l'onglet. Un clic
//    ou une saisie dans la carte l'éteint aussitôt. La carte où l'on écrit reste soulevée
//    jusqu'à la fin de la saisie. Rien ne bouge pendant un glisser ni pendant la frappe.
//  - Thème clair / sombre : dévoilement circulaire (theme.js) ; mode cinéma : css/motion.css.
//
// Tout est coupé si l'utilisateur limite les animations (prefers-reduced-motion).
// Les mouvements passent par l'API Web Animations (element.animate) : ils s'ajoutent aux
// styles sans toucher aux propriétés transition / animation des feuilles de style. La
// carte soulevée utilise la propriété translate (et non transform, laissée libre) et une
// ombre ajoutée à la sienne (composite 'add').
// Jamais de transform sur .sheet ni sur ses ancêtres (voir motion.css).
// =============================================================================

/** Départ vif, arrivée tout en douceur */
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** Attente maximale des polices et de l'illustration avant l'ouverture (ms) */
const INTRO_WAIT_MS = 350;
/** Réglages de la cascade d'ouverture (ms et px) */
const INTRO = { pageFade: 320, bar: 460, card: 400, rise: 14, delayMin: 40, delayDown: 170, delayAcross: 40, rule: 460 };
/** Changement d'onglet (ms et px) */
const TAB = { duration: 300, shift: 14 };
/**
 * Survol (ms et px) : soulèvement et ses durées ; reflet après une vraie pause de la souris
 * (immobile à 3 px près), au plus un sur la fiche par intervalle, éteint en un instant ;
 * hauteur maximale d'une carte qui réagit ; pauses après la frappe et le défilement.
 */
const HOVER = {
    lift: 2, up: 220, down: 320,
    sheenStill: 550, stillSlop: 3, sheenGap: 9000, sheenOut: 120,
    compact: 220, typingPause: 1000, scrollPause: 250
};

/** Cartes de la fiche, et ce qui fait d'une carte une grande section (aucun effet de survol) */
const CARD = '.box, .ability';
const BULKY = 'table, textarea, [contenteditable]';

/** Champs de saisie de texte : leur carte reste soulevée pendant la saisie (pas les cases à
 *  cocher ni les listes, qui gardent le focus après un simple clic) */
const EDITABLE = 'input:not([type="checkbox"], [type="radio"], [type="button"], [type="range"], [type="file"]), textarea, [contenteditable="true"]';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

/** Survol actif seulement après l'ouverture */
let hoverReady = false;

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initMotion({ root }) {
    if (!root || typeof root.animate !== 'function') {
        reveal();
        return;
    }
    root.addEventListener('dd:tabchange', (event) => slidePanel(event.detail));
    initHover(root);
    playIntro(root).catch((error) => {
        // Quoi qu'il arrive, la page ne reste pas invisible
        reveal();
        console.error('Ouverture animée interrompue :', error);
    });
}

// ---------------------------------------------------------------------------
// Ouverture
// ---------------------------------------------------------------------------

/** La page est visible (fin de l'attente de motion.css) et le survol peut s'animer */
function reveal() {
    document.documentElement.dataset.motion = 'ready';
    hoverReady = true;
}

/** La page attend-elle encore, invisible (animation motion-hold de motion.css) ? */
function pageHeld() {
    return typeof document.getAnimations === 'function'
        && document.getAnimations().some(a => a.animationName === 'motion-hold');
}

/**
 * @param {HTMLElement} root
 */
async function playIntro(root) {
    if (reducedMotion.matches || document.visibilityState !== 'visible' || !pageHeld()) {
        // Une image plus tard : le thème mémorisé (appliqué juste avant) s'affiche d'un coup,
        // sans la transition de couleur du fond (coupée tant que data-motion est absent).
        // Onglet en arrière-plan : pas d'image dessinée, la minuterie prend le relais.
        await Promise.race([nextFrame(), wait(100)]);
        reveal();
        return;
    }
    // Polices et illustration prêtes (dans une limite courte) : rien ne change sous les yeux
    await Promise.race([readyAssets(), wait(INTRO_WAIT_MS)]);
    await nextFrame();
    // Filet de sécurité déjà écoulé : la page est visible, pas de seconde apparition
    if (!pageHeld()) {
        reveal();
        return;
    }

    // Transitions lancées pendant la construction (jauges...) : achevées d'un coup,
    // la page apparaît directement dans son état final
    if (typeof CSSTransition === 'function') {
        for (const animation of document.getAnimations()) {
            if (animation instanceof CSSTransition) animation.finish();
        }
    }

    const html = document.documentElement;
    html.dataset.motion = 'intro';
    const animations = [
        // Le fondu porte sur <body> et non sur .sheet : posé sur la fiche, il couperait
        // le verre dépoli (backdrop-filter) de la fiche transparente pendant l'apparition
        document.body.animate({ opacity: [0, 1] }, { duration: INTRO.pageFade, easing: 'ease-out', fill: 'backwards' })
    ];
    const bar = document.getElementById('app-bar');
    if (bar) {
        animations.push(bar.animate({ translate: ['0px -10px', '0px 0px'] },
            { duration: INTRO.bar, easing: EASE_OUT, fill: 'backwards' }));
    }
    const order = cascadeOrder(root);
    for (const [item, delay] of order) {
        animations.push(item.animate(
            { opacity: [0, 1], translate: [`0px ${INTRO.rise}px`, '0px 0px'] },
            { duration: INTRO.card, delay, easing: EASE_OUT, fill: 'backwards' }));
        const title = sectionTitle(item);
        if (title) {
            // Le filet d'or du titre se trace de gauche à droite, juste après son cadre
            animations.push(title.animate({ transform: ['scaleX(0)', 'none'], transformOrigin: ['0 50%', '0 50%'] },
                { duration: INTRO.card, delay: delay + 80, easing: EASE_OUT, fill: 'backwards', pseudoElement: '::after' }));
        }
    }
    animations.push(...tabsRule(root, order));
    await Promise.allSettled(animations.map(a => a.finished));
    reveal();
}

/**
 * Double filet sous les onglets : il apparaît avec la rangée d'onglets (et non seul, avant
 * tout le reste), le second trait s'ouvrant depuis le centre comme le trait de l'onglet actif.
 * @param {HTMLElement} root
 * @param {Array<[HTMLElement, number]>} order
 * @returns {Animation[]}
 */
function tabsRule(root, order) {
    const tabs = root.querySelector('.tabs');
    const delays = order.filter(([item]) => item.parentElement === tabs).map(([, delay]) => delay);
    if (!tabs || delays.length === 0) return [];
    const delay = Math.min(...delays);
    const animations = [tabs.animate({ borderBottomColor: ['transparent', getComputedStyle(tabs).borderBottomColor] },
        { duration: INTRO.rule, delay, easing: EASE_OUT, fill: 'backwards' })];
    if (supportsPseudoAnimation()) {
        animations.push(tabs.animate({ transform: ['scaleX(0)', 'none'] },
            { duration: INTRO.rule, delay: delay + 40, easing: EASE_OUT, fill: 'backwards', pseudoElement: '::after' }));
    }
    return animations;
}

/**
 * Éléments de la cascade et leur délai : en-tête, onglets, puis chaque cadre de l'onglet
 * affiché (les cadres imbriqués suivent leur parent). Le délai croît vers le bas et vers
 * la droite ; ce qui est sous le bord de l'écran n'est pas animé.
 * @param {HTMLElement} root
 * @returns {Array<[HTMLElement, number]>}
 */
function cascadeOrder(root) {
    const panel = root.querySelector('.tab-panel:not([hidden])');
    const cards = panel
        ? [...panel.querySelectorAll(CARD)].filter(el => !el.parentElement.closest(CARD))
        : [];
    const items = [root.querySelector('.sheet-header'), ...root.querySelectorAll('.tabs > .tab'), ...cards].filter(Boolean);
    const sheet = root.getBoundingClientRect();
    const height = window.innerHeight || 1;
    const order = [];
    for (const item of items) {
        const box = item.getBoundingClientRect();
        if (box.width === 0 || box.top > height) continue;
        const down = clamp(box.top / height);
        const across = clamp((box.left - sheet.left) / (sheet.width || 1));
        order.push([item, Math.round(INTRO.delayMin + down * INTRO.delayDown + across * INTRO.delayAcross)]);
    }
    return order;
}

/** Titre de section dont le filet d'or peut se tracer (animations de pseudo-éléments prises en charge) */
function sectionTitle(card) {
    if (!supportsPseudoAnimation()) return null;
    return card.querySelector(':scope > h3, :scope > .weapons-head > h3');
}

let pseudoSupport = null;
function supportsPseudoAnimation() {
    if (pseudoSupport === null) {
        try {
            pseudoSupport = new KeyframeEffect(null, null, { pseudoElement: '::after' }).pseudoElement === '::after';
        } catch {
            pseudoSupport = false;
        }
    }
    return pseudoSupport;
}

/** Polices chargées et illustration de fond décodée */
function readyAssets() {
    const waits = [];
    if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);
    const html = document.documentElement;
    if (html.dataset.appBg === 'on') {
        const match = getComputedStyle(html).getPropertyValue('--app-bg-image').trim().match(/^url\((["']?)(.+)\1\)$/);
        if (match) {
            const image = new Image();
            image.src = match[2];
            waits.push(image.decode().catch(() => {}));
        }
    }
    return Promise.all(waits).catch(() => {});
}

// ---------------------------------------------------------------------------
// Changement d'onglet
// ---------------------------------------------------------------------------

/** Animation en cours par panneau (relancée proprement si l'on change vite d'onglet) */
const panelMoves = new WeakMap();

/**
 * @param {{ panel: HTMLElement, direction: number }} detail
 */
function slidePanel({ panel, direction } = {}) {
    if (!panel || reducedMotion.matches) return;
    panelMoves.get(panel)?.cancel();
    const shift = (direction || 1) * TAB.shift;
    panelMoves.set(panel, panel.animate(
        { opacity: [0, 1], translate: [`${shift}px 0px`, '0px 0px'] },
        { duration: TAB.duration, easing: EASE_OUT }));
}

// ---------------------------------------------------------------------------
// Survol des cartes
// ---------------------------------------------------------------------------

/**
 * @param {HTMLElement} root
 */
function initHover(root) {
    let hovered = null;      // carte sous la souris
    let pressed = false;     // bouton de la souris enfoncé (clic, glisser, sélection)
    let stale = false;       // survol à remettre à jour au prochain mouvement de la souris
    let lastKey = -Infinity;
    let lastScroll = -Infinity;
    let lastSheen = -Infinity;          // dernier reflet, toutes cartes confondues
    let sheened = new WeakSet();        // cartes déjà traversées par un reflet sur cet onglet
    let still = { x: 0, y: 0 };         // dernière position « posée » de la souris
    let sheenTimer = 0;
    let printing = false;
    const raised = new Set();           // cartes soulevées
    const lifts = new WeakMap();        // carte → animation en cours ou maintenue

    const enabled = () => hoverReady && !printing && finePointer.matches && !reducedMotion.matches;
    const busy = () => pressed || performance.now() - lastKey < HOVER.typingPause;
    const locked = () => document.body.dataset.locked === 'true';

    /**
     * Carte compacte la plus extérieure qui contient `node` (dans la fiche) ; les grandes
     * sections (tableaux, textes, plus hautes que HOVER.compact) ne réagissent pas
     */
    const cardOf = (node) => {
        let card = node instanceof Element ? node.closest(CARD) : null;
        while (card && card.parentElement && card.parentElement.closest(CARD)) card = card.parentElement.closest(CARD);
        if (!card || !root.contains(card)) return null;
        return card.offsetHeight <= HOVER.compact && !card.querySelector(BULKY) ? card : null;
    };

    /** Carte du champ en cours de saisie */
    const editedCard = () => {
        const active = document.activeElement;
        return active instanceof Element && active.matches(EDITABLE) ? cardOf(active) : null;
    };

    /** Hauteur de soulèvement actuelle d'une carte, de 0 (posée) à 1 (soulevée) */
    const liftLevel = (card) => {
        const match = /^\S+\s+(-?[\d.e-]+)px/.exec(getComputedStyle(card).translate);
        return match ? clamp(-Number(match[1]) / HOVER.lift) : 0;
    };

    /** Pose d'une carte soulevée à `level` : décalage et ombre ajoutée à la sienne */
    const pose = (level, shadow) => ({
        translate: `0px ${-HOVER.lift * level}px`,
        boxShadow: `0px ${10 * level}px ${22 * level}px ${-10 * level}px ${shadow}`
    });

    /**
     * Soulève ou repose une carte, en repartant de sa position actuelle (mouvement interrompu).
     * Mouvement réduit demandé (ou fiche verrouillée) : la carte reprend sa place d'un coup.
     */
    const lift = (card, up) => {
        const previous = lifts.get(card);
        const level = previous ? liftLevel(card) : 0;
        previous?.cancel();
        lifts.delete(card);
        if (!up && (level === 0 || reducedMotion.matches)) return;
        const shadow = getComputedStyle(document.documentElement).getPropertyValue('--motion-lift-shadow').trim() || 'transparent';
        const animation = card.animate([pose(level, shadow), pose(up ? 1 : 0, shadow)], {
            duration: up ? HOVER.up : HOVER.down,
            easing: EASE_OUT,
            fill: up ? 'forwards' : 'none',
            composite: 'add'
        });
        lifts.set(card, animation);
        if (!up) {
            animation.finished
                .then(() => { if (lifts.get(card) === animation) lifts.delete(card); })
                .catch(() => {});
        }
    };

    /**
     * Cartes soulevées : celle sous la souris, et celle où l'on écrit si elle l'était déjà
     * (elle ne retombe pas sous le texte quand la souris s'en va ; un champ atteint au
     * clavier ne soulève rien). Fiche verrouillée : rien ne se soulève.
     */
    const sync = () => {
        const keep = new Set();
        if (enabled() && !locked()) {
            if (hovered) keep.add(hovered);
            const edited = editedCard();
            if (edited && raised.has(edited)) keep.add(edited);
        }
        for (const card of raised) {
            if (keep.has(card)) continue;
            raised.delete(card);
            lift(card, false);
        }
        for (const card of keep) {
            if (raised.has(card)) continue;
            raised.add(card);
            lift(card, true);
        }
    };

    /** Reflet : seulement sur une souris posée, rarement, et jamais sur une carte en cours de saisie */
    const sheen = (card) => {
        const now = performance.now();
        if (card !== hovered || !enabled() || busy() || now - lastScroll < HOVER.scrollPause) return;
        if (now - lastSheen < HOVER.sheenGap || sheened.has(card)) return;
        if (card.contains(document.activeElement) && document.activeElement.matches(EDITABLE)) return;
        lastSheen = now;
        sheened.add(card);
        card.classList.add('motion-sheen');
    };

    /** (Re)lance l'attente du reflet : la souris doit rester immobile sur la carte */
    const armSheen = () => {
        clearTimeout(sheenTimer);
        const card = hovered;
        if (card) sheenTimer = setTimeout(() => sheen(card), HOVER.sheenStill);
    };

    /** Éteint en un instant le reflet d'une carte (clic, saisie) */
    const stopSheen = (card) => {
        if (!card || !card.classList.contains('motion-sheen')) return;
        if (!supportsPseudoAnimation()) {
            card.classList.remove('motion-sheen');
            return;
        }
        const opacity = getComputedStyle(card, '::after').opacity;
        const fade = card.animate({ opacity: [opacity, '0'] },
            { duration: HOVER.sheenOut, easing: 'ease-out', fill: 'forwards', pseudoElement: '::after' });
        fade.finished
            .then(() => {
                card.classList.remove('motion-sheen');
                fade.cancel();
            })
            .catch(() => {});
    };

    const update = (node) => {
        const card = enabled() ? cardOf(node) : null;
        if (card === hovered) return;
        hovered = card;
        sync();
        armSheen();
    };

    root.addEventListener('pointerover', (event) => {
        if (event.pointerType !== 'mouse') return;
        still = { x: event.clientX, y: event.clientY };
        if (busy()) stale = true;
        else update(event.target);
    });
    root.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') return;
        if (stale && !busy()) {
            stale = false;
            update(event.target);
        }
        // Le reflet attend une vraie pause : tout mouvement de plus de quelques pixels
        // relance l'attente (une souris qui traverse la fiche ne fait rien briller)
        if (hovered && Math.hypot(event.clientX - still.x, event.clientY - still.y) > HOVER.stillSlop) {
            still = { x: event.clientX, y: event.clientY };
            armSheen();
        }
    });
    root.addEventListener('pointerleave', (event) => {
        if (event.pointerType !== 'mouse') return;
        if (busy()) stale = true;
        else update(null);
    });

    // Glisser : l'état est figé du clic jusqu'au relâchement, puis recalé sous la souris.
    // Un clic dans une carte éteint son reflet.
    document.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse') pressed = true;
        clearTimeout(sheenTimer);
        stopSheen(cardOf(event.target));
    }, true);
    const release = (event) => {
        if (!pressed) return;
        pressed = false;
        if (!busy()) update(document.elementFromPoint(event.clientX, event.clientY));
    };
    document.addEventListener('pointerup', release, true);
    document.addEventListener('pointercancel', release, true);

    // Saisie commencée (clavier compris) : le reflet de la carte s'éteint
    document.addEventListener('focusin', (event) => {
        if (event.target instanceof Element && event.target.matches(EDITABLE)) stopSheen(cardOf(event.target));
    });
    // Fin de saisie (champ quitté) : la carte retombe si elle n'est plus sous la souris.
    // Après coup : pendant focusout, le champ suivant n'a pas encore le focus.
    document.addEventListener('focusout', () => setTimeout(sync));

    // Verrouillage de la fiche : les cartes soulevées se reposent (et inversement)
    document.addEventListener('dd:lockchange', () => sync());

    // Frappe et défilement : pas de mouvement sous les yeux pendant la saisie,
    // pas de reflet sur les cartes qui défilent sous une souris immobile
    document.addEventListener('keydown', () => {
        lastKey = performance.now();
        stale = true;
        clearTimeout(sheenTimer);
    }, true);
    document.addEventListener('scroll', () => {
        lastScroll = performance.now();
    }, { capture: true, passive: true });

    root.addEventListener('animationend', endSheen);
    root.addEventListener('animationcancel', endSheen);

    // Plus de survol possible (préférence changée, souris débranchée) ou onglet changé
    // (la carte survolée vient d'être masquée) : tout redescend, puis le survol est recalé
    // au prochain mouvement de la souris
    const reset = () => {
        hovered = null;
        stale = true;
        clearTimeout(sheenTimer);
        sync();
    };
    reducedMotion.addEventListener?.('change', reset);
    finePointer.addEventListener?.('change', reset);
    root.addEventListener('dd:tabchange', () => {
        // Nouvel onglet : chaque carte peut de nouveau briller une fois
        sheened = new WeakSet();
        reset();
    });

    // Impression : les cartes reprennent leur place tout de suite (rien de décalé sur le
    // papier) et plus rien ne se soulève jusqu'à la fin de l'impression
    window.addEventListener('beforeprint', () => {
        printing = true;
        clearTimeout(sheenTimer);
        for (const card of raised) {
            lifts.get(card)?.cancel();
            lifts.delete(card);
        }
        for (const card of root.querySelectorAll('.motion-sheen')) card.classList.remove('motion-sheen');
        raised.clear();
        hovered = null;
        stale = true;
    });
    window.addEventListener('afterprint', () => {
        printing = false;
    });
}

/** Reflet terminé : la classe est retirée pour pouvoir le rejouer plus tard */
function endSheen(event) {
    if (event.animationName === 'motion-sheen') event.target.classList.remove('motion-sheen');
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

const clamp = (value) => Math.min(1, Math.max(0, value));
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
