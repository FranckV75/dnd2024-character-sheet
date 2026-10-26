// =============================================================================
// AUTOCOMPLETE.JS - Liste de suggestions sous un champ de saisie (partagée)
//
// Usage :
//   attachAutocomplete(input, {
//       getItems: (query) => [{ label: 'Hache à deux mains', detail: '1d12 tran.', value: obj }],
//       onSelect: (item) => { ... }
//   });
// Clavier : ↑ ↓ pour naviguer, Entrée pour choisir, Échap pour fermer.
// =============================================================================

import { el } from './dom.js';

let counter = 0;

/**
 * @param {HTMLInputElement} input
 * @param {{ getItems: (query: string) => Array<{label: string, detail?: string, value?: any}>, onSelect: (item: any) => void, minChars?: number, maxItems?: number }} options
 * @returns {() => void} Fonction qui détache l'auto-complétion
 */
export function attachAutocomplete(input, { getItems, onSelect, minChars = 2, maxItems = 12 }) {
    const listId = `autocomplete-${++counter}`;
    const list = el('ul', { class: 'autocomplete-list', id: listId, role: 'listbox', 'aria-label': 'Suggestions', hidden: true });
    let items = [];
    let active = -1;

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', listId);
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('autocomplete', 'off');

    function hide() {
        followViewport(false);
        list.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        active = -1;
    }

    /**
     * Sous le champ, ou au-dessus s'il n'y a pas la place en dessous dans la partie visible de
     * l'écran (clavier virtuel ouvert sur tablette) et qu'il y en a davantage au-dessus.
     * La liste doit être affichée (hidden = false) pour être mesurée.
     */
    function position() {
        const rect = input.getBoundingClientRect();
        list.style.left = `${rect.left + window.scrollX}px`;
        list.style.minWidth = `${Math.max(rect.width, 220)}px`;
        const visual = window.visualViewport;
        const viewTop = visual ? visual.offsetTop : 0;
        const viewBottom = viewTop + (visual ? visual.height : window.innerHeight);
        const height = list.offsetHeight;
        const below = viewBottom - rect.bottom;
        const above = rect.top - viewTop;
        // La liste a 4 px de marge haute (components.css) : au-dessus, elle s'arrête 4 px avant le champ
        const top = height > below && above > below ? rect.top - height - 8 : rect.bottom;
        list.style.top = `${top + window.scrollY}px`;
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

    function highlight(index) {
        active = index;
        [...list.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === index)));
        if (index >= 0) {
            input.setAttribute('aria-activedescendant', `${listId}-${index}`);
            list.children[index].scrollIntoView({ block: 'nearest' });
        }
    }

    function choose(index) {
        const item = items[index];
        hide();
        if (item) onSelect(item);
    }

    function show() {
        const query = input.value.trim();
        items = query.length >= minChars ? getItems(query).slice(0, maxItems) : [];
        if (items.length === 0) {
            hide();
            return;
        }
        list.replaceChildren(...items.map((item, i) => el('li', {
            id: `${listId}-${i}`, role: 'option', 'aria-selected': 'false',
            on: { mousedown: (e) => { e.preventDefault(); choose(i); } }
        }, el('span', { class: 'autocomplete-label', text: item.label }),
        item.detail ? el('span', { class: 'autocomplete-detail', text: item.detail }) : null)));
        // Nom de la liste relu à chaque ouverture : le libellé du champ peut changer (renumérotation)
        const inputName = input.getAttribute('aria-label') || input.labels?.[0]?.textContent?.trim() || '';
        list.setAttribute('aria-label', inputName ? `Suggestions : ${inputName}` : 'Suggestions');
        list.hidden = false;
        position();
        // La saisie peut déplacer le champ (ligne créée ou agrandie juste après) : position revue à l'image suivante
        requestAnimationFrame(reposition);
        followViewport(true);
        input.setAttribute('aria-expanded', 'true');
        active = -1;
    }

    const onKey = (event) => {
        if (list.hidden) return;
        if (event.key === 'ArrowDown') { event.preventDefault(); highlight(Math.min(items.length - 1, active + 1)); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); highlight(Math.max(0, active - 1)); }
        // Entrée : la suggestion surlignée, ou la seule proposée (comme la v3)
        else if (event.key === 'Enter' && (active >= 0 || items.length === 1)) { event.preventDefault(); choose(Math.max(0, active)); }
        else if (event.key === 'Escape') { event.preventDefault(); hide(); }
    };

    input.addEventListener('input', show);
    input.addEventListener('keydown', onKey);
    input.addEventListener('blur', hide);
    document.body.append(list);

    return () => {
        input.removeEventListener('input', show);
        input.removeEventListener('keydown', onKey);
        input.removeEventListener('blur', hide);
        followViewport(false);
        list.remove();
    };
}
