// =============================================================================
// STYLE-EDITOR.JS - Mise en forme du texte riche (gras, italique, souligné, taille, couleur)
//
// Une petite barre flottante (role="toolbar") apparaît près de la sélection quand du
// texte est sélectionné dans un champ riche modifiable ([data-kind="rich"]
// contenteditable), ou sur clic droit dans ce champ (comme en v3).
//  - Souris : la barre apparaît au relâchement du bouton, au-dessus de la sélection.
//  - Tablette : elle suit la sélection (selectionchange) et se place DESSOUS, pour ne
//    pas recouvrir le menu natif du système (Copier / Coller...).
//  - Clavier : Alt+F10 depuis le champ place le focus dans la barre ; flèches,
//    Début / Fin pour naviguer ; Échap revient au texte. Ctrl+B / I / U restent
//    gérés nativement par le navigateur.
//  - Masquée : Échap, clic ou focus hors du champ, sélection sortie de l'écran,
//    fiche verrouillée, fiche remplacée (chargement, import).
// Chaque commande passe par document.execCommand (seule méthode commune à tous les
// navigateurs pour contenteditable), puis un événement 'input' est envoyé au champ :
// sheet.js l'enregistre (après nettoyage DOMPurify).
// =============================================================================

import { el } from './dom.js';
import { isLocked } from './lock.js';

const RICH_SELECTOR = '[data-kind="rich"]';
const GAP_PX = 8;
const TOUCH_GAP_PX = 14;
const EDGE_PX = 8;
const INTERACTION_GRACE_MS = 400;

/**
 * Couleurs proposées. La valeur hexadécimale est celle qui est enregistrée dans le
 * texte du joueur ; la même valeur est déclarée dans css/style-editor.css (--se-*),
 * qui fait foi (contraste ≥ 3:1 sur le fond clair ET sur le fond sombre).
 */
const COLORS = [
    { id: 'red', label: 'Rouge', hex: '#e04848' },
    { id: 'orange', label: 'Orange', hex: '#c8711a' },
    { id: 'green', label: 'Vert', hex: '#2f9a4e' },
    { id: 'blue', label: 'Bleu', hex: '#3b7ddd' },
    { id: 'purple', label: 'Violet', hex: '#a65fd6' },
    { id: 'pink', label: 'Rose', hex: '#c94f9a' }
];

/**
 * Couleur « témoin » appliquée puis aussitôt retirée pour « Couleur par défaut » :
 * execCommand('foreColor') découpe proprement les couleurs existantes autour de la
 * sélection ; il suffit ensuite d'effacer le témoin pour que le texte reprenne la
 * couleur du thème, sans perdre gras / italique (contrairement à removeFormat).
 */
const COLOR_SENTINEL = '#010203';
const SIZE_NORMAL = '3';

const compact = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, '');
const isSentinelColor = (value) => [COLOR_SENTINEL, 'rgb(1,2,3)'].includes(compact(value));
const isNormalSize = (value) => [SIZE_NORMAL, 'medium'].includes(compact(value));

/** Couleur de la pastille (variable CSS), avec repli sur la valeur JS */
function colorValue(color) {
    const fromCss = getComputedStyle(document.documentElement).getPropertyValue(`--se-${color.id}`).trim();
    return /^#[0-9a-f]{6}$/i.test(fromCss) ? fromCss.toLowerCase() : color.hex;
}

/** Rectangle à l'écran d'une plage (y compris un simple curseur) */
function rangeRect(range) {
    const rect = range.getBoundingClientRect();
    if (rect.width || rect.height) return rect;
    const rects = range.getClientRects();
    if (rects.length) return rects[0];
    const node = range.startContainer.nodeType === Node.ELEMENT_NODE
        ? range.startContainer : range.startContainer.parentElement;
    return node ? node.getBoundingClientRect() : null;
}

/**
 * Retire une mise en forme (attribut color / size ou propriété CSS équivalente) des
 * balises <font> / <span> touchées par la plage (ou de tout le champ si wholeField :
 * cas d'une valeur témoin unique, à retirer même si le navigateur a déplacé la
 * sélection) ; une balise qui n'a plus d'attribut est remplacée par son contenu.
 * @returns {Range|null} plage couvrant le texte modifié (pour reconstruire la sélection)
 */
function stripFormat(field, range, { attr, cssProp, matches, wholeField = false }) {
    const targets = [...field.querySelectorAll('font, span')].filter(node =>
        (wholeField || (range && range.intersectsNode(node)))
        && (matches(node.getAttribute(attr)) || matches(node.style.getPropertyValue(cssProp))));
    let first = null;
    let last = null;
    for (const node of targets) {
        if (!node.isConnected) continue;
        if (matches(node.getAttribute(attr))) node.removeAttribute(attr);
        if (matches(node.style.getPropertyValue(cssProp))) node.style.removeProperty(cssProp);
        if (node.getAttribute('style') === '') node.removeAttribute('style');
        if (node.attributes.length) {
            first ??= node;
            last = node;
            continue;
        }
        const children = [...node.childNodes];
        if (children.length) {
            first ??= children[0];
            last = children[children.length - 1];
        }
        node.replaceWith(...children);
    }
    if (!first || !field.contains(first) || !field.contains(last)) return null;
    const result = document.createRange();
    result.setStartBefore(first);
    result.setEndAfter(last);
    return result;
}

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initStyleEditor({ root, store, setStatus }) {
    /** Champ riche en cours de mise en forme */
    let field = null;
    /** Dernière sélection connue dans ce champ (restaurée avant chaque commande) */
    let savedRange = null;
    /** Barre ouverte par clic droit / Alt+F10 : reste visible même sans texte sélectionné */
    let pinned = false;
    /** Point du clic droit, utilisé tant que rien n'a défilé */
    let pointAnchor = null;
    /** Doigt / bouton appuyé sur la barre : les changements de sélection sont ignorés */
    let interacting = false;
    let interactTimer = 0;
    /** Sélection à la souris en cours : la barre attend le relâchement */
    let mouseSelecting = false;
    let lastPointerType = 'mouse';
    let frame = 0;

    // ------------------------------------------------------------------ Barre

    const formatButton = (command, label, shortcut, glyphTag) => el('button', {
        type: 'button', class: 'se-btn', 'data-command': command, 'aria-pressed': 'false',
        'aria-label': label, 'aria-keyshortcuts': shortcut, title: `${label} (${shortcut.replace('Control', 'Ctrl')})`
    }, el(glyphTag, { 'aria-hidden': 'true', text: label.charAt(0) }));

    const sizeButton = (size, text, label) => el('button', {
        type: 'button', class: `se-btn se-size se-size-${size}`, 'data-size': size,
        'aria-label': `Taille ${label}`, title: `Taille ${label}`
    }, el('span', { 'aria-hidden': 'true', text }));

    const toolbar = el('div', {
        class: 'style-editor', role: 'toolbar', 'aria-orientation': 'horizontal',
        'aria-label': 'Mise en forme du texte (Échap pour revenir au texte)', hidden: true
    },
    el('div', { class: 'se-group', role: 'group', 'aria-label': 'Style' },
        formatButton('bold', 'Gras', 'Control+B', 'b'),
        formatButton('italic', 'Italique', 'Control+I', 'i'),
        formatButton('underline', 'Souligné', 'Control+U', 'u')),
    el('div', { class: 'se-group', role: 'group', 'aria-label': 'Taille' },
        sizeButton('2', 'P', 'petite'),
        sizeButton(SIZE_NORMAL, 'N', 'normale'),
        sizeButton('5', 'G', 'grande')),
    el('div', { class: 'se-group', role: 'group', 'aria-label': 'Couleur' },
        COLORS.map(color => el('button', {
            type: 'button', class: `se-swatch se-swatch-${color.id}`, 'data-color': color.id,
            'aria-label': `Couleur : ${color.label.toLowerCase()}`, title: color.label
        })),
        el('button', {
            type: 'button', class: 'se-swatch se-swatch-default', 'data-color': 'default',
            'aria-label': 'Couleur par défaut', title: 'Couleur par défaut'
        })));
    root.append(toolbar);

    const buttons = () => [...toolbar.querySelectorAll('button')];
    const isVisible = () => !toolbar.hidden;
    const inToolbar = (node) => node instanceof Node && toolbar.contains(node);
    const richOf = (node) => (node instanceof Element ? node.closest(RICH_SELECTOR) : null);

    // Navigation clavier « roving tabindex » : un seul bouton dans l'ordre de tabulation
    const setCurrent = (button) => {
        for (const b of buttons()) b.tabIndex = b === button ? 0 : -1;
    };
    setCurrent(buttons()[0]);

    // ------------------------------------------------------------------ Sélection

    /** Champ riche modifiable contenant toute la sélection, ou null */
    function selectionInRich() {
        const selection = document.getSelection();
        if (!selection || !selection.rangeCount) return null;
        const range = selection.getRangeAt(0);
        const node = range.commonAncestorContainer;
        const target = richOf(node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement);
        if (!target || !root.contains(target) || !target.isContentEditable) return null;
        return { target, range };
    }

    function restoreRange() {
        if (!field || !savedRange || !field.contains(savedRange.startContainer)
            || !field.contains(savedRange.endContainer)) return false;
        const selection = document.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
        return true;
    }

    function saveCurrentRange() {
        const info = selectionInRich();
        if (info && info.target === field) savedRange = info.range.cloneRange();
    }

    /** Curseur à la fin du champ (barre ouverte sans sélection dans ce champ) */
    function caretAtEnd(target) {
        const range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(false);
        return range;
    }

    // ------------------------------------------------------------------ Affichage

    function canEdit() {
        return !isLocked() && Boolean(field) && field.isConnected && field.isContentEditable;
    }

    function hide() {
        if (inToolbar(document.activeElement)) {
            if (canEdit()) field.focus({ preventScroll: true });
            else document.activeElement.blur();
        }
        toolbar.hidden = true;
        pinned = false;
        pointAnchor = null;
    }

    function updatePressed() {
        if (!selectionInRich()) return;
        for (const button of toolbar.querySelectorAll('[data-command]')) {
            let state = false;
            try {
                state = document.queryCommandState(button.dataset.command);
            } catch {
                state = false;
            }
            button.setAttribute('aria-pressed', String(Boolean(state)));
        }
    }

    /** Partie de la page réellement visible, en coordonnées du viewport de mise en page */
    function visibleArea() {
        const layoutWidth = document.documentElement.clientWidth;
        const vv = window.visualViewport;
        if (vv && vv.width > 0 && vv.height > 0) {
            return {
                top: vv.offsetTop,
                bottom: vv.offsetTop + vv.height,
                left: vv.offsetLeft,
                right: Math.min(vv.offsetLeft + vv.width, layoutWidth || Infinity)
            };
        }
        return { top: 0, bottom: window.innerHeight, left: 0, right: layoutWidth };
    }

    /** Place la barre près de la sélection ; la masque si la sélection n'est plus visible */
    function position() {
        if (!isVisible()) return;
        const anchor = pointAnchor ?? (savedRange ? rangeRect(savedRange) : null);
        if (!anchor || !field) {
            hide();
            return;
        }
        // Zone visible : le champ (qui défile lui-même), l'écran réellement visible (viewport
        // visuel : sans le clavier virtuel de la tablette ni la partie hors zoom), sous la
        // barre de gestion. Coordonnées du viewport de mise en page, comme position: fixed.
        const view = visibleArea();
        const box = field.getBoundingClientRect();
        const appBar = document.getElementById('app-bar')?.getBoundingClientRect();
        const topLimit = Math.max(view.top, appBar && appBar.bottom > 0 ? appBar.bottom : 0);
        const viewBottom = view.bottom;
        const visibleTop = Math.max(box.top, topLimit);
        const visibleBottom = Math.min(box.bottom, viewBottom);
        if (box.width === 0 || anchor.bottom < visibleTop || anchor.top > visibleBottom) {
            hide();
            return;
        }

        const width = toolbar.offsetWidth;
        const height = toolbar.offsetHeight;
        const touch = lastPointerType !== 'mouse';
        const above = anchor.top - height - GAP_PX;
        const below = anchor.bottom + (touch ? TOUCH_GAP_PX : GAP_PX);
        const minTop = topLimit + EDGE_PX;
        const maxTop = Math.max(minTop, viewBottom - height - EDGE_PX);
        let top;
        // Tablette : dessous de préférence ; au-dessus s'il n'y a pas la place (clavier ouvert)
        if (touch) top = below <= maxTop || above < minTop ? below : above;
        else top = above >= minTop ? above : below;
        top = Math.min(Math.max(top, minTop), maxTop);

        const center = anchor.left + (anchor.width || 0) / 2;
        const minLeft = view.left + EDGE_PX;
        const maxLeft = Math.max(minLeft, view.right - width - EDGE_PX);
        const left = Math.min(Math.max(center - width / 2, minLeft), maxLeft);
        toolbar.style.left = `${Math.round(left)}px`;
        toolbar.style.top = `${Math.round(top)}px`;
    }

    function show() {
        if (!canEdit()) {
            hide();
            return;
        }
        toolbar.hidden = false;
        updatePressed();
        position();
    }

    /** Recalcule l'état de la barre d'après la sélection courante */
    function refresh() {
        frame = 0;
        if (interacting || inToolbar(document.activeElement)) return;
        const info = selectionInRich();
        if (!info || isLocked()) {
            if (isVisible()) hide();
            return;
        }
        if (info.target !== field) {
            pinned = false;
            pointAnchor = null;
        }
        field = info.target;
        savedRange = info.range.cloneRange();
        if (!info.range.collapsed) pointAnchor = null;
        if (mouseSelecting) {
            if (!pinned && isVisible()) hide();
            return;
        }
        if (!info.range.collapsed || pinned) show();
        else if (isVisible()) hide();
    }

    const scheduleRefresh = () => {
        if (!frame) frame = requestAnimationFrame(refresh);
    };

    // ------------------------------------------------------------------ Commandes

    /**
     * Exécute une mise en forme sur la sélection mémorisée du champ, puis prévient sheet.js.
     * @param {(target: HTMLElement) => void} action
     * @param {{ needsSelection?: boolean }} [options]
     */
    function run(action, { needsSelection = false } = {}) {
        if (!canEdit()) {
            hide();
            return;
        }
        const returnFocus = inToolbar(document.activeElement) ? document.activeElement : null;
        const target = field;
        target.focus({ preventScroll: true });
        if (!restoreRange()) {
            hide();
            return;
        }
        if (needsSelection && savedRange.collapsed) {
            setStatus('Sélectionnez d’abord le texte à modifier.');
            returnFocus?.focus({ preventScroll: true });
            return;
        }
        try {
            document.execCommand('styleWithCSS', false, false);
        } catch {
            // Commande facultative : certains navigateurs l'ignorent
        }
        action(target);
        target.dispatchEvent(new Event('input', { bubbles: true }));
        saveCurrentRange();
        if (returnFocus && isVisible()) returnFocus.focus({ preventScroll: true });
        updatePressed();
        position();
    }

    /** Applique une commande puis retire la valeur « neutre » qu'elle a posée */
    function applyThenStrip(command, value, strip) {
        run((target) => {
            document.execCommand(command, false, value);
            const selection = document.getSelection();
            const range = selection.rangeCount ? selection.getRangeAt(0) : null;
            if (!range && !strip.wholeField) return;
            const rebuilt = stripFormat(target, range, strip);
            if (rebuilt) {
                selection.removeAllRanges();
                selection.addRange(rebuilt);
            }
        }, { needsSelection: true });
    }

    function onCommand(button) {
        const { command, size, color } = button.dataset;
        if (command) {
            run(() => document.execCommand(command, false, null));
        } else if (size === SIZE_NORMAL) {
            // Taille normale = taille du champ : on retire l'attribut size posé
            applyThenStrip('fontSize', SIZE_NORMAL, { attr: 'size', cssProp: 'font-size', matches: isNormalSize });
        } else if (size) {
            run(() => document.execCommand('fontSize', false, size));
        } else if (color === 'default') {
            // Témoin unique : retiré partout dans le champ, jamais enregistré
            applyThenStrip('foreColor', COLOR_SENTINEL,
                { attr: 'color', cssProp: 'color', matches: isSentinelColor, wholeField: true });
        } else if (color) {
            const choice = COLORS.find(c => c.id === color);
            if (choice) run(() => document.execCommand('foreColor', false, colorValue(choice)));
        }
    }

    // ------------------------------------------------------------------ Événements de la barre

    // Garder la sélection du champ : appuyer sur un bouton ne doit pas prendre le focus
    toolbar.addEventListener('mousedown', (event) => event.preventDefault());
    toolbar.addEventListener('pointerdown', () => {
        interacting = true;
        clearTimeout(interactTimer);
    });
    /** Fin immédiate de l'appui sur la barre (appui ailleurs, fiche verrouillée...) */
    const stopInteraction = () => {
        clearTimeout(interactTimer);
        interactTimer = 0;
        interacting = false;
    };
    // Relâchement n'importe où (y compris hors de la barre : « glisser pour annuler ») ;
    // à la fin du délai, la sélection courante est relue pour ne pas garder une plage périmée
    const endInteraction = () => {
        if (!interacting) return;
        clearTimeout(interactTimer);
        interactTimer = setTimeout(() => {
            interactTimer = 0;
            interacting = false;
            scheduleRefresh();
        }, INTERACTION_GRACE_MS);
    };
    document.addEventListener('pointerup', endInteraction, true);
    document.addEventListener('pointercancel', endInteraction, true);

    toolbar.addEventListener('click', (event) => {
        const button = event.target instanceof Element ? event.target.closest('button') : null;
        if (!button || !toolbar.contains(button)) return;
        setCurrent(button);
        onCommand(button);
    });

    toolbar.addEventListener('keydown', (event) => {
        const list = buttons();
        const index = list.indexOf(document.activeElement);
        let next = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = list[(index + 1) % list.length];
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = list[(index - 1 + list.length) % list.length];
        else if (event.key === 'Home') next = list[0];
        else if (event.key === 'End') next = list[list.length - 1];
        if (!next) return;
        event.preventDefault();
        setCurrent(next);
        next.focus({ preventScroll: true });
    });

    // ------------------------------------------------------------------ Événements du document

    document.addEventListener('selectionchange', scheduleRefresh);

    document.addEventListener('pointerdown', (event) => {
        lastPointerType = event.pointerType || 'mouse';
        if (inToolbar(event.target)) return;
        // Appui hors de la barre (retour dans le texte juste après un bouton) : jamais ignoré
        stopInteraction();
        const target = richOf(event.target);
        mouseSelecting = lastPointerType === 'mouse' && event.button === 0 && Boolean(target);
        if (event.button === 0 && pinned && target === field) {
            pinned = false;
            pointAnchor = null;
        }
        if (isVisible() && target !== field) hide();
    }, true);

    document.addEventListener('pointerup', () => {
        if (!mouseSelecting) return;
        mouseSelecting = false;
        scheduleRefresh();
    }, true);

    // Focus parti ailleurs (Tab, autre champ, fenêtre de dialogue...)
    document.addEventListener('focusin', (event) => {
        if (isVisible() && !inToolbar(event.target) && event.target !== field) hide();
    });

    // Clic droit (souris) : barre affichée au point cliqué, comme en v3. Au doigt, on
    // laisse le menu natif (Copier / Coller) : la barre suit alors la sélection.
    root.addEventListener('contextmenu', (event) => {
        const target = richOf(event.target);
        if (!target || !target.isContentEditable || isLocked() || lastPointerType === 'touch') return;
        event.preventDefault();
        mouseSelecting = false;
        field = target;
        const info = selectionInRich();
        savedRange = info && info.target === target ? info.range.cloneRange() : caretAtEnd(target);
        pinned = true;
        const hasPoint = Boolean(event.clientX || event.clientY);
        pointAnchor = hasPoint && savedRange.collapsed
            ? { left: event.clientX, width: 0, top: event.clientY, bottom: event.clientY } : null;
        show();
    });

    // Alt+F10 : aller dans la barre depuis le champ
    root.addEventListener('keydown', (event) => {
        if (event.key !== 'F10' || !event.altKey) return;
        const target = richOf(event.target);
        if (!target || !target.isContentEditable || isLocked()) return;
        event.preventDefault();
        field = target;
        const info = selectionInRich();
        savedRange = info && info.target === target ? info.range.cloneRange() : caretAtEnd(target);
        pinned = true;
        pointAnchor = null;
        show();
        if (!isVisible()) return;
        (buttons().find(b => b.tabIndex === 0) || buttons()[0]).focus({ preventScroll: true });
    });

    // Échap : fermer la barre (et revenir au texte si le focus était dans la barre)
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !isVisible()) return;
        const fromToolbar = inToolbar(document.activeElement);
        hide();
        if (fromToolbar && canEdit()) restoreRange();
    });

    // Raccourcis natifs Ctrl+B / I / U : mettre à jour l'état des boutons
    root.addEventListener('input', (event) => {
        if (isVisible() && event.target === field) {
            updatePressed();
            position();
        }
    });

    // Défilement (page ou champ) et redimensionnement : suivre la sélection
    let moveFrame = 0;
    const onMove = (event) => {
        if (!isVisible() || moveFrame) return;
        // Défilement du contenu (pas du viewport visuel) : le point du clic droit a bougé
        const scrolled = event.type === 'scroll' && event.currentTarget !== window.visualViewport;
        moveFrame = requestAnimationFrame(() => {
            moveFrame = 0;
            if (scrolled) pointAnchor = null;
            position();
        });
    };
    document.addEventListener('scroll', onMove, { capture: true, passive: true });
    window.addEventListener('resize', onMove);
    window.visualViewport?.addEventListener('resize', onMove);
    // Viewport visuel déplacé (zoom, clavier virtuel) : recaler la barre sans oublier le point
    window.visualViewport?.addEventListener('scroll', onMove);

    // Verrouillage et remplacement de la fiche
    const reset = () => {
        stopInteraction();
        hide();
        field = null;
        savedRange = null;
    };
    document.addEventListener('dd:lockchange', () => {
        if (isLocked()) reset();
    });
    store.subscribe((_state, changedKeys) => {
        if (changedKeys === null) reset();
    });
}
