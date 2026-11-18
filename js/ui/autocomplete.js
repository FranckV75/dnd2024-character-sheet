// =============================================================================
// AUTOCOMPLETE.JS - Liste de suggestions sous un champ de saisie (partagée)
//
// Usage :
//   attachAutocomplete(input, {
//       getItems: (query) => [{ label: 'Hache à deux mains', detail: '1d12 tran.', value: obj }],
//       onSelect: (item) => { ... }
//   });
// Clavier : ↑ ↓ pour naviguer, Entrée pour choisir, Échap pour fermer.
//
// Mode « parcourir » (option browse, grimoire) : toucher le champ vide, ou le bouton browse.trigger
// (qui ouvre la liste sans donner le focus au champ : pas de clavier virtuel sur tablette), montre
// toute la liste ; la saisie la resserre, sans minimum de lettres ni nombre maximal. getItems reçoit
// alors { browse: true } et peut rendre des intertitres ({ header: 'Niveau 1' }) et des choix
// inactifs ({ disabled: true, mark: '✓' }). Toucher ailleurs ferme la liste.
// =============================================================================

import { el } from './dom.js';

let counter = 0;

/**
 * @param {HTMLInputElement} input
 * @param {{ getItems: (query: string, context?: { browse: boolean }) => Array<{label?: string, detail?: string, value?: any, header?: string, disabled?: boolean, mark?: string}>,
 *   onSelect: (item: any, context?: { browse: boolean, fromTrigger: boolean }) => void, minChars?: number, maxItems?: number,
 *   browse?: { enabled: () => boolean, trigger?: HTMLElement } }} options
 * @returns {(() => void) & { open?: () => void }} Fonction qui détache l'auto-complétion ;
 *          open() (mode parcourir) ouvre ou ferme la liste depuis le bouton
 */
export function attachAutocomplete(input, { getItems, onSelect, minChars = 2, maxItems = 12, browse = null }) {
    const listId = `autocomplete-${++counter}`;
    const list = el('ul', { class: 'autocomplete-list', id: listId, role: 'listbox', 'aria-label': 'Suggestions', hidden: true });
    let items = [];
    let active = -1;
    // Liste ouverte en mode parcourir ; fromTrigger : par le bouton, champ sans focus
    let browsing = false;
    let fromTrigger = false;
    const trigger = browse?.trigger ?? null;

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', listId);
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('autocomplete', 'off');
    if (trigger) {
        trigger.setAttribute('aria-controls', listId);
        trigger.setAttribute('aria-expanded', 'false');
    }

    function hide() {
        followViewport(false);
        document.removeEventListener('pointerdown', onOutside, true);
        list.hidden = true;
        browsing = false;
        fromTrigger = false;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
            trigger.removeAttribute('aria-activedescendant');
        }
        active = -1;
    }

    // Toucher ailleurs (hors du champ, de la liste et du bouton) ferme la liste
    function onOutside(event) {
        const target = event.target;
        if (list.contains(target) || target === input || trigger?.contains(target)) return;
        hide();
    }

    /**
     * Sous le champ, ou au-dessus s'il n'y a pas la place en dessous dans la partie visible de
     * l'écran (clavier virtuel ouvert sur tablette) et qu'il y en a davantage au-dessus.
     * La liste ne dépasse pas la partie visible de l'écran (défilement interne).
     * La liste doit être affichée (hidden = false) pour être mesurée.
     */
    function position() {
        const rect = input.getBoundingClientRect();
        list.style.left = `${rect.left + window.scrollX}px`;
        list.style.minWidth = `${Math.max(rect.width, 220)}px`;
        const visual = window.visualViewport;
        const viewTop = visual ? visual.offsetTop : 0;
        const viewBottom = viewTop + (visual ? visual.height : window.innerHeight);
        const below = viewBottom - rect.bottom;
        const above = rect.top - viewTop;
        // Hauteur maximale : celle de components.css, réduite à la place disponible (12 px de marge)
        list.style.maxHeight = '';
        const cssMax = parseFloat(getComputedStyle(list).maxHeight) || 280;
        const room = Math.max(below, above) - 12;
        if (room < cssMax) list.style.maxHeight = `${Math.max(120, room)}px`;
        const height = list.offsetHeight;
        // La liste a 4 px de marge haute (components.css) : au-dessus, elle s'arrête 4 px avant le champ
        const top = height > below && above > below ? rect.top - height - 8 : rect.bottom;
        list.style.top = `${top + window.scrollY}px`;
        // Pas plus large que l'écran : la liste revient vers la gauche si besoin
        const overflow = rect.left + list.offsetWidth - (document.documentElement.clientWidth - 8);
        if (overflow > 0) list.style.left = `${Math.max(8, rect.left - overflow) + window.scrollX}px`;
    }

    // Le clavier virtuel s'ouvre ou se ferme, la page défile : la liste suit le champ
    const reposition = () => { if (!list.hidden) position(); };
    function followViewport(on) {
        const visual = window.visualViewport;
        if (!visual) return;
        const method = on ? 'addEventListener' : 'removeEventListener';
        visual[method]('resize', reposition);
        visual[method]('scroll', reposition);
    }

    const selectable = (index) => index >= 0 && index < items.length && !items[index].header && !items[index].disabled;
    // Élément qui porte la navigation au clavier : le bouton quand il a ouvert la liste
    const owner = () => (fromTrigger && trigger ? trigger : input);

    function highlight(index) {
        active = index;
        [...list.children].forEach((li, i) => {
            if (selectable(i)) li.setAttribute('aria-selected', String(i === index));
        });
        if (index >= 0) {
            owner().setAttribute('aria-activedescendant', `${listId}-${index}`);
            list.children[index].scrollIntoView({ block: 'nearest' });
        }
    }

    /** Choix suivant (step 1) ou précédent (step -1) qu'on peut sélectionner */
    function move(step) {
        let index = active;
        for (let i = 0; i < items.length; i++) {
            index += step;
            if (index < 0 || index >= items.length) return;
            if (selectable(index)) {
                highlight(index);
                return;
            }
        }
    }

    function choose(index) {
        if (!selectable(index)) return;
        const item = items[index];
        const context = { browse: browsing, fromTrigger };
        hide();
        onSelect(item, context);
    }

    function itemElement(item, i) {
        if (item.header) {
            return el('li', { id: `${listId}-${i}`, role: 'presentation', class: 'autocomplete-group', text: item.header });
        }
        return el('li', {
            id: `${listId}-${i}`, role: 'option',
            class: item.disabled ? 'is-disabled' : null,
            'aria-selected': item.disabled ? null : 'false',
            'aria-disabled': item.disabled ? 'true' : null,
            on: { click: () => choose(i) }
        }, el('span', { class: 'autocomplete-label', text: item.label }),
        item.detail || item.mark ? el('span', { class: 'autocomplete-detail' },
            item.detail || '', item.mark ? el('span', { class: 'autocomplete-mark', text: ` ${item.mark}` }) : null) : null);
    }

    function show() {
        const query = input.value.trim();
        if (browsing) {
            items = getItems(query, { browse: true });
            if (items.length === 0) items = [{ header: 'Aucun sort de la liste ne correspond' }];
        } else {
            items = query.length >= minChars ? getItems(query, { browse: false }).slice(0, maxItems) : [];
        }
        if (items.length === 0) {
            hide();
            return;
        }
        list.replaceChildren(...items.map(itemElement));
        list.classList.toggle('is-browse', browsing);
        // Nom de la liste relu à chaque ouverture : le libellé du champ peut changer (renumérotation)
        const inputName = input.getAttribute('aria-label') || input.labels?.[0]?.textContent?.trim() || '';
        list.setAttribute('aria-label', inputName ? `Suggestions : ${inputName}` : 'Suggestions');
        const wasHidden = list.hidden;
        list.hidden = false;
        if (wasHidden || browsing) list.scrollTop = 0;
        position();
        // La saisie peut déplacer le champ (ligne créée ou agrandie juste après) : position revue à l'image suivante
        requestAnimationFrame(reposition);
        followViewport(true);
        document.addEventListener('pointerdown', onOutside, true);
        input.setAttribute('aria-expanded', 'true');
        trigger?.setAttribute('aria-expanded', 'true');
        active = -1;
    }

    const canBrowse = () => Boolean(browse) && !input.readOnly && !input.disabled && browse.enabled();

    /** Champ vide touché (focus, clic) : toute la liste */
    function browseIfEmpty() {
        if (input.value.trim() !== '' || !canBrowse()) return;
        if (!list.hidden && browsing && !fromTrigger) return;
        browsing = true;
        fromTrigger = false;
        show();
    }

    const onKey = (event) => {
        if (list.hidden) return;
        if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
        // Entrée : la suggestion surlignée, ou la seule proposée (comme la v3)
        else if (event.key === 'Enter') {
            const only = items.length === 1 && selectable(0);
            if (active >= 0 || only) { event.preventDefault(); choose(Math.max(0, active)); }
        }
        else if (event.key === 'Escape') { event.preventDefault(); hide(); }
    };

    const onInput = () => {
        if (!browsing && input.value.trim() === '' && canBrowse()) browsing = true;
        show();
    };
    const onBlur = () => { if (!fromTrigger) hide(); };
    // La liste ne prend jamais le focus (le champ le garde : clic, barre de défilement)
    const keepFocus = (event) => event.preventDefault();

    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKey);
    input.addEventListener('blur', onBlur);
    if (browse) {
        input.addEventListener('focus', browseIfEmpty);
        input.addEventListener('click', browseIfEmpty);
    }
    list.addEventListener('mousedown', keepFocus);
    document.body.append(list);

    /** Bouton ▾ : ouvre la liste sans focus sur le champ (pas de clavier virtuel), ou la ferme */
    function open() {
        // Liste déjà ouverte par le bouton : il la ferme (ouverte au toucher du champ, voir dessous)
        if (!list.hidden && document.activeElement !== input) {
            hide();
            return;
        }
        if (!canBrowse()) return;
        // Champ en cours de saisie : le clavier virtuel se ferme, la liste prend sa place
        if (document.activeElement === input) input.blur();
        browsing = true;
        fromTrigger = true;
        show();
    }
    trigger?.addEventListener('keydown', onKey);

    const detach = () => {
        input.removeEventListener('input', onInput);
        input.removeEventListener('keydown', onKey);
        input.removeEventListener('blur', onBlur);
        input.removeEventListener('focus', browseIfEmpty);
        input.removeEventListener('click', browseIfEmpty);
        trigger?.removeEventListener('keydown', onKey);
        document.removeEventListener('pointerdown', onOutside, true);
        followViewport(false);
        list.remove();
    };
    detach.open = open;
    detach.hide = hide;
    return detach;
}
