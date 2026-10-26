// =============================================================================
// ARMORS.JS - Tableau des armures (édition, auto-complétion, armure équipée)
//
// Chaque ligne de dynamic_armors garde exactement les clés de la v3
// (name, type, ca, str, stealth, weight, price, comment, equipped) ; les clés
// inconnues d'une ancienne sauvegarde sont conservées.
// La CA de l'hexagone est recalculée par sheet.js à chaque changement du store.
// =============================================================================

import { EMPTY_ARMOR } from '../state/schema.js';
import { stripHTML } from '../state/migrate.js';
import { parseNumber } from '../rules/character.js';
import {
    ARMOR_TYPES, searchArmorCatalogue, armorRowFromCatalogue, armorWarnings, armorTraining, isBlankArmor
} from '../rules/armors.js';
import { el, icon, setIconLabel } from './dom.js';
import { cellText } from './cell-text.js';
import { attachAutocomplete } from './autocomplete.js';
import { confirmModal } from './modal.js';
import { isLocked } from './lock.js';

/** Colonnes de texte libre : clé de la sauvegarde → libellé accessible */
const TEXT_COLUMNS = {
    name: { aria: 'Nom de l\'armure' },
    ca: { aria: 'Classe d\'armure ou bonus' },
    str: { aria: 'Force minimale', inputmode: 'numeric' },
    weight: { aria: 'Poids' },
    price: { aria: 'Prix' },
    comment: { aria: 'Commentaire' }
};

/** Clés de la fiche dont dépendent le tableau et ses avertissements */
const WATCHED_KEYS = new Set([
    'dynamic_armors', 'str_score',
    'prof_armor_light', 'prof_armor_med', 'prof_armor_heavy', 'prof_armor_shield'
]);

const COLUMN_COUNT = 10;
const TYPE_VALUES = new Set(ARMOR_TYPES.map(([value]) => value));

const textOf = (value) => stripHTML(String(value ?? ''));
const armorsOf = (character) => (Array.isArray(character.dynamic_armors) ? character.dynamic_armors : []);
const asObject = (row) => (row && typeof row === 'object' ? row : {});
const typeOf = (row) => textOf(row.type) || 'none';

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initArmors({ root, store, setStatus }) {
    const container = root.querySelector('#armors-feature');
    if (!container) return;

    const tbody = el('tbody');
    const table = el('table', { class: 'data-table armors-table' },
        el('caption', { class: 'armors-sr', text: 'Armures, boucliers et autres avantages défensifs' }),
        el('thead', {}, el('tr', {},
            el('th', { scope: 'col', class: 'col-name', text: 'Nom' }),
            el('th', { scope: 'col', class: 'col-type', text: 'Type' }),
            el('th', { scope: 'col', class: 'col-ca', text: 'CA' }),
            el('th', { scope: 'col', class: 'col-str', text: 'For min.' }),
            el('th', { scope: 'col', class: 'col-check', text: 'Discr. désav.', title: 'Désavantage aux tests de Dextérité (Discrétion)' }),
            el('th', { scope: 'col', class: 'col-weight', text: 'Poids' }),
            el('th', { scope: 'col', class: 'col-price', text: 'Prix' }),
            el('th', { scope: 'col', class: 'col-comment', text: 'Commentaire' }),
            el('th', { scope: 'col', class: 'col-equip', text: 'Équipée / actif' }),
            el('th', { scope: 'col', class: 'col-del' }, el('span', { class: 'armors-sr', text: 'Supprimer' })))),
        tbody);
    const addButton = el('button', {
        type: 'button', class: 'add-row edit-only',
        on: { click: addRow }
    });
    setIconLabel(addButton, 'plus', 'Ajouter une armure');
    container.replaceChildren(el('div', { class: 'table-scroll' }, table), addButton);

    /** Contrôles de chaque ligne affichée : [{ tr, controls }] */
    let rows = [];
    let detachers = [];

    // -----------------------------------------------------------------------
    // Écriture dans le store (jamais de modification directe de store.get())
    // -----------------------------------------------------------------------

    function replaceRow(index, makeRow) {
        const list = armorsOf(store.get());
        if (index < 0 || index >= list.length) return;
        store.update({ dynamic_armors: list.map((row, i) => (i === index ? makeRow(asObject(row)) : row)) });
    }

    const editRow = (index, patch) => replaceRow(index, row => ({ ...row, ...patch }));

    function addRow() {
        if (isLocked()) return;
        // Une ligne de saisie vide est déjà affichée : on y place le curseur
        const list = armorsOf(store.get());
        const entry = rows.find((row, i) => !row.tr.hidden && isBlankArmor(asObject(list[i])));
        if (entry) {
            entry.controls.name.focus();
            return;
        }
        store.update({ dynamic_armors: [...armorsOf(store.get()), { ...EMPTY_ARMOR }] });
        rows.at(-1)?.controls.name.focus();
    }

    async function deleteRow(index) {
        if (isLocked()) return;
        const row = armorsOf(store.get())[index];
        const name = textOf(asObject(row).name).trim();
        if (name) {
            const ok = await confirmModal({
                title: 'Supprimer l\'armure',
                icon: 'trash',
                message: `Supprimer « ${name} » du tableau des armures ?`,
                confirmLabel: 'Supprimer',
                confirmIcon: 'trash',
                danger: true
            });
            if (!ok) return;
        }
        // Le tableau a pu changer pendant la confirmation : on retire la ligne demandée
        const list = armorsOf(store.get());
        const at = list.indexOf(row);
        if (at === -1) return;
        store.update({ dynamic_armors: list.filter((_, i) => i !== at) });
        // Le bouton supprimé a disparu avec la ligne : le focus va au bouton voisin (ou à « Ajouter »)
        if (!document.activeElement || document.activeElement === document.body) {
            (rows[Math.min(at, rows.length - 1)]?.tr.querySelector('.col-del button') || addButton).focus();
        }
        setStatus(name ? `Armure supprimée : ${name}` : 'Ligne d\'armure supprimée');
    }

    // -----------------------------------------------------------------------
    // Construction des lignes
    // -----------------------------------------------------------------------

    function textInput(index, key) {
        const column = TEXT_COLUMNS[key];
        return cellText({
            class: 'cell-input', 'aria-label': `${column.aria} (ligne ${index + 1})`,
            inputmode: column.inputmode, autocomplete: 'off', spellcheck: key === 'comment' ? 'true' : 'false',
            on: { input: (e) => editRow(index, { [key]: e.target.value }) }
        });
    }

    function buildRow(index) {
        const controls = {};
        for (const key of Object.keys(TEXT_COLUMNS)) controls[key] = textInput(index, key);
        controls.name.placeholder = 'Nom…';

        controls.type = el('select', {
            class: 'cell-input', 'aria-label': `Type d'équipement défensif (ligne ${index + 1})`,
            on: { change: (e) => editRow(index, { type: e.target.value }) }
        }, ARMOR_TYPES.map(([value, label]) => el('option', { value, text: label })));

        controls.stealth = el('input', {
            type: 'checkbox', class: 'round-check',
            'aria-label': `Désavantage en Discrétion (ligne ${index + 1})`,
            on: { change: (e) => editRow(index, { stealth: e.target.checked }) }
        });
        controls.equipped = el('input', {
            type: 'checkbox', class: 'round-check', 'data-play': 'true',
            'aria-label': `Équipée / active (ligne ${index + 1})`,
            on: { change: (e) => editRow(index, { equipped: e.target.checked }) }
        });
        // Bouton (et non simple infobulle) : sur tablette, le toucher affiche le message dans la barre d'état
        controls.warn = el('button', {
            type: 'button', class: 'armor-warn', hidden: true,
            on: { click: () => setStatus(controls.warn.dataset.message || '') }
        }, icon('warning'));

        const del = el('button', {
            type: 'button', class: 'btn-icon is-danger edit-only', title: 'Supprimer',
            'aria-label': `Supprimer l'armure (ligne ${index + 1})`,
            on: { click: () => deleteRow(index) }
        }, icon('trash'));

        // Nom saisi au clavier (sans passer par les suggestions) : si c'est exactement une armure
        // du manuel et que le type n'est pas encore choisi, la ligne est complétée comme une suggestion
        controls.name.addEventListener('change', () => {
            const row = asObject(armorsOf(store.get())[index]);
            if (typeOf(row) !== 'none') return;
            const name = textOf(row.name).trim().toLowerCase();
            const entry = name && searchArmorCatalogue(name).find(a => a.name.toLowerCase() === name);
            if (entry) replaceRow(index, current => armorRowFromCatalogue(entry, current));
        });

        detachers.push(attachAutocomplete(controls.name, {
            minChars: 1,
            getItems: (query) => searchArmorCatalogue(query).map(a => ({
                label: a.name, detail: `CA ${a.ca} · ${a.type}`, value: a
            })),
            onSelect: (item) => {
                controls.name.value = item.value.name;
                replaceRow(index, row => armorRowFromCatalogue(item.value, row));
            }
        }));

        const tr = el('tr', {},
            el('td', { class: 'col-name' }, controls.name),
            el('td', { class: 'col-type' }, controls.type),
            el('td', { class: 'col-ca' }, controls.ca),
            el('td', { class: 'col-str' }, controls.str),
            el('td', { class: 'col-check' }, controls.stealth),
            el('td', { class: 'col-weight' }, controls.weight),
            el('td', { class: 'col-price' }, controls.price),
            el('td', { class: 'col-comment' }, controls.comment),
            el('td', { class: 'col-equip' }, el('span', { class: 'armor-equip' }, controls.equipped, controls.warn)),
            el('td', { class: 'col-del' }, del));
        return { tr, controls };
    }

    function rebuild(count) {
        detachers.forEach(detach => detach());
        detachers = [];
        rows = Array.from({ length: count }, (_, i) => buildRow(i));
        tbody.replaceChildren(...(count
            ? rows.map(r => r.tr)
            : [el('tr', {}, el('td', {
                class: 'empty', colspan: String(COLUMN_COUNT),
                text: 'Aucune armure pour l\'instant. Ajoutez une armure, un bouclier ou tout autre avantage défensif (anneau, cape…).'
            }))]));
    }

    // -----------------------------------------------------------------------
    // Mise à jour des valeurs (sans jamais réécrire le champ en cours de saisie)
    // -----------------------------------------------------------------------

    function setText(input, value) {
        if (input === document.activeElement) return;
        if (input.value !== value) input.value = value;
    }

    function setType(select, value) {
        select.querySelector('[data-legacy]')?.remove();
        if (!TYPE_VALUES.has(value)) {
            select.append(el('option', { value, 'data-legacy': 'true', text: `${value} (valeur enregistrée)` }));
        }
        if (select.value !== value) select.value = value;
        // Libellé complet au survol si la colonne est trop étroite pour l'afficher
        select.title = select.selectedOptions[0]?.textContent || '';
    }

    function fill(character) {
        const list = armorsOf(character);
        const warnings = armorWarnings(list, armorTraining(character), parseNumber(character.str_score, 10));
        // Lignes vides enregistrées : une seule reste affichée (ligne de saisie), aucune quand
        // la fiche est verrouillée ; une ligne en cours de saisie reste visible. Les autres sont
        // seulement masquées, la sauvegarde n'est pas réécrite.
        const locked = isLocked();
        let entryShown = false;
        rows.forEach(({ tr, controls }, i) => {
            const row = asObject(list[i]);
            const blank = isBlankArmor(row);
            const shown = !blank || tr.contains(document.activeElement) || (!locked && !entryShown);
            if (blank && shown) entryShown = true;
            tr.hidden = !shown;
            tr.classList.toggle('is-entry', blank);
            controls.name.placeholder = blank ? 'Nouvelle armure…' : 'Nom…';
            for (const key of Object.keys(TEXT_COLUMNS)) setText(controls[key], textOf(row[key]));
            controls.ca.title = textOf(row.ca);
            controls.comment.title = textOf(row.comment);
            setType(controls.type, typeOf(row));
            controls.stealth.checked = row.stealth === true;
            controls.equipped.checked = row.equipped === true;

            const messages = warnings[i] || [];
            controls.warn.hidden = messages.length === 0;
            controls.warn.title = messages.join('\n');
            controls.warn.dataset.message = messages.join(' ');
            controls.warn.setAttribute('aria-label', `Avertissement : ${messages.join(' ')}`);
            tr.classList.toggle('armor-warning', messages.length > 0);
        });
    }

    function applyLocked() {
        const locked = isLocked();
        for (const { controls } of rows) {
            for (const key of Object.keys(TEXT_COLUMNS)) controls[key].readOnly = locked;
            controls.type.disabled = locked;
            controls.stealth.disabled = locked;
            // controls.equipped : contrôle de jeu, reste utilisable en mode verrouillé
        }
    }

    function render(character, changedKeys) {
        const count = armorsOf(character).length;
        if (changedKeys === null || count !== rows.length) {
            rebuild(count);
            applyLocked();
        } else if (!changedKeys.some(key => WATCHED_KEYS.has(key))) {
            return;
        }
        fill(character);
    }

    store.subscribe(render);
    document.addEventListener('dd:lockchange', () => {
        applyLocked();
        fill(store.get());
    });
    render(store.get(), null);
}
