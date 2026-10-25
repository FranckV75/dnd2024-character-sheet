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
        list.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        active = -1;
    }

    function position() {
        const rect = input.getBoundingClientRect();
        list.style.left = `${rect.left + window.scrollX}px`;
        list.style.top = `${rect.bottom + window.scrollY}px`;
        list.style.minWidth = `${Math.max(rect.width, 220)}px`;
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
        position();
        // Nom de la liste relu à chaque ouverture : le libellé du champ peut changer (renumérotation)
        const inputName = input.getAttribute('aria-label') || input.labels?.[0]?.textContent?.trim() || '';
        list.setAttribute('aria-label', inputName ? `Suggestions : ${inputName}` : 'Suggestions');
        list.hidden = false;
        input.setAttribute('aria-expanded', 'true');
        active = -1;
    }

    const onKey = (event) => {
        if (list.hidden) return;
        if (event.key === 'ArrowDown') { event.preventDefault(); highlight(Math.min(items.length - 1, active + 1)); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); highlight(Math.max(0, active - 1)); }
        else if (event.key === 'Enter' && active >= 0) { event.preventDefault(); choose(active); }
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
        list.remove();
    };
}
