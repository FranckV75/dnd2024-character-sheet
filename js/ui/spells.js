// =============================================================================
// SPELLS.JS - Grimoire (sorts, filtres, tri, auto-complétion, emplacements, infobulles)
//
// Tout est construit dans <section id="spells-feature"> (onglet Magie).
//  - Les sorts sont lus dans character.dynamic_spells (clés v3 : lvl, name, time,
//    range, note, c, r, m, prep, school) et chaque modification passe par store.update.
//  - Le filtre de niveau et le tri ne changent que l'affichage : l'ordre enregistré
//    du tableau n'est jamais modifié.
//  - Les emplacements de sorts cochés et le losange « préparé » sont des contrôles de JEU
//    (utilisables verrouillé : PHB 2024, la liste des sorts préparés change à chaque repos
//    long) ; les boutons + / − du nombre d'emplacements sont réservés à l'édition.
// Les règles (recherche, conversion, compteurs, emplacements) sont dans js/rules/spells.js.
// =============================================================================

import { EMPTY_SPELL } from '../state/schema.js';
import { deriveCharacter } from '../rules/character.js';
import {
    SPELL_CLASS_OPTIONS, SPELL_LEVELS, plainText, cellText, descToPlainText, spellDisplayName,
    spellLevelLabel, effectiveSpellClass, searchSpells, findSpellByName, spellToRow, rowLevel,
    isSpellRowEmpty, matchesLevelFilter, sortedSpellIndices, nextSort, spellCounts,
    formatSpellCount, newSpellRow, slotView, toggleSlotUsed, adjustSlotMax, slotLevels,
    nextFreeSlotLevel
} from '../rules/spells.js';
import { loadSpells } from '../data/spells.js';
import { el, icon, setIconLabel } from './dom.js';
import { cellText as createCellText } from './cell-text.js';
import { attachAutocomplete } from './autocomplete.js';
import { confirmModal } from './modal.js';
import { isLocked } from './lock.js';

const TOOLTIP_STORAGE_KEY = 'dd2024_spell_tooltips';
const RELEVANT_KEYS = new Set(['dynamic_spells', 'spell_slots_state', 'spell_class_filter', 'char_class', 'char_level']);
const SORT_COLUMNS = {
    lvl: { label: 'Niv.', title: 'niveau' },
    name: { label: 'Nom', title: 'nom' },
    school: { label: 'École', title: 'école' }
};
const TEXT_COLUMNS = [
    ['school', 'École'],
    ['time', 'Temps d\'incantation'],
    ['range', 'Portée']
];
const FLAG_COLUMNS = [
    ['c', 'C', 'Concentration'],
    ['r', 'R', 'Rituel'],
    ['m', 'M', 'Composante matérielle']
];

function readTooltipSetting() {
    try {
        return localStorage.getItem(TOOLTIP_STORAGE_KEY) !== 'false';
    } catch {
        return true;
    }
}

function saveTooltipSetting(enabled) {
    try {
        localStorage.setItem(TOOLTIP_STORAGE_KEY, String(enabled));
    } catch {
        // Stockage indisponible : le réglage ne sera pas mémorisé
    }
}

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initSpells(ctx) {
    const { root, store, setStatus } = ctx;
    const container = root.querySelector('#spells-feature');
    if (!container) return;

    const view = { level: '', sort: { col: null, dir: 'asc' } };
    let tooltipsOn = readTooltipSetting();
    let spellsDb = [];
    const rowEls = [];

    const spellsOf = () => {
        const list = store.get().dynamic_spells;
        return Array.isArray(list) ? list : [];
    };

    function editRow(index, patch) {
        const list = spellsOf();
        if (!list[index]) return;
        const next = list.slice();
        next[index] = { ...list[index], ...patch };
        store.update({ dynamic_spells: next });
    }

    // -----------------------------------------------------------------------
    // Barre de filtres
    // -----------------------------------------------------------------------

    const levelChips = ['', ...SPELL_LEVELS].map(level => el('button', {
        type: 'button', class: 'btn-chip', 'data-level': level, 'aria-pressed': 'false',
        'aria-label': level === '' ? 'Tous les niveaux' : level === '0' ? 'Sorts mineurs (niveau 0)' : `Niveau ${level}`,
        text: level === '' ? 'Tous' : level,
        on: {
            click: () => {
                view.level = level;
                hideTooltip();
                render(store.get(), null, { structural: true });
            }
        }
    }));

    const classSelect = el('select', {
        id: 'spell-class-filter', class: 'input spell-class-select',
        title: 'Liste de sorts proposée par l\'auto-complétion du nom',
        on: { change: () => store.update({ spell_class_filter: classSelect.value }) }
    });

    const tooltipBtn = el('button', {
        type: 'button', class: 'btn-icon spell-tooltip-toggle', 'aria-pressed': String(tooltipsOn),
        'aria-label': 'Infobulles des sorts',
        title: 'Afficher la description d\'un sort au survol ou au focus de son nom',
        on: {
            click: () => {
                tooltipsOn = !tooltipsOn;
                saveTooltipSetting(tooltipsOn);
                tooltipBtn.setAttribute('aria-pressed', String(tooltipsOn));
                if (!tooltipsOn) hideTooltip();
            }
        }
    }, icon('chat'));

    const countOut = el('output', { class: 'spell-count', 'aria-live': 'polite' });

    const toolbar = el('div', { class: 'spells-toolbar' },
        el('div', { class: 'spell-level-chips btn-segments', role: 'group', 'aria-label': 'Filtrer les sorts par niveau' }, levelChips),
        el('div', { class: 'spell-class-filter' },
            el('label', { for: 'spell-class-filter', text: 'Liste de sorts' }),
            classSelect),
        tooltipBtn,
        countOut);

    // -----------------------------------------------------------------------
    // Emplacements de sorts
    // -----------------------------------------------------------------------

    const slotsBox = el('div', { class: 'spell-slots', role: 'group', 'aria-label': 'Emplacements de sorts' });
    let slotsSignature = null;

    const rulebookSlots = (level) => deriveCharacter(store.get()).spellSlots[level] ?? 0;

    function slotState(character = store.get()) {
        const state = character.spell_slots_state;
        return state && typeof state === 'object' && !Array.isArray(state) ? state : {};
    }

    function buildSlotGroup(info, state) {
        const { max, used } = slotView(state, info.level, info.rulebook);
        const boxes = Array.from({ length: max }, (_, i) => el('input', {
            type: 'checkbox', class: 'round-check',
            'aria-label': `Emplacement de niveau ${info.level} n° ${i + 1} utilisé`,
            checked: i < used,
            on: {
                change: (event) => store.update({
                    spell_slots_state: toggleSlotUsed(slotState(), info.level, i, event.target.checked, rulebookSlots(info.level))
                })
            }
        }));
        const adjust = (delta) => store.update({
            spell_slots_state: adjustSlotMax(slotState(), info.level, delta, rulebookSlots(info.level))
        });
        return el('div', { class: 'slot-group', 'data-level': info.level, 'data-pact': info.pact ? 'true' : null },
            el('span', { class: 'label', text: info.label }),
            el('span', { class: 'slot-boxes' }, boxes,
                max === 0 ? el('span', { class: 'slot-none', text: 'aucun' }) : null),
            el('button', {
                type: 'button', class: 'btn-icon edit-only',
                'aria-label': `Retirer un emplacement de niveau ${info.level}`, disabled: max === 0,
                on: { click: () => adjust(-1) }
            }, icon('minus')),
            el('button', {
                type: 'button', class: 'btn-icon edit-only',
                'aria-label': `Ajouter un emplacement de niveau ${info.level}`,
                on: { click: () => adjust(1) }
            }, icon('plus')));
    }

    function renderSlots(character, d) {
        const state = slotState(character);
        const levels = slotLevels(d.spellSlots, d.classSlug, state);
        const views = levels.map(info => ({ info, ...slotView(state, info.level, info.rulebook) }));
        const signature = views.map(v => `${v.info.level}:${v.max}:${v.info.label}`).join('|');

        if (signature !== slotsSignature) {
            // Nombre d'emplacements changé : reconstruction, en gardant le focus sur le même bouton
            const focusedLabel = slotsBox.contains(document.activeElement) ? document.activeElement.getAttribute('aria-label') : null;
            slotsSignature = signature;
            // Ajout manuel d'un niveau : seulement sans emplacements au manuel (Chevalier occulte, Escroc arcanique...)
            const free = levels.some(info => info.rulebook > 0) ? '' : nextFreeSlotLevel(levels);
            slotsBox.replaceChildren(...[
                ...levels.map(info => buildSlotGroup(info, state)),
                levels.length === 0
                    ? el('p', { class: 'slots-empty', text: 'Aucun emplacement de sorts pour cette classe à ce niveau.' })
                    : null,
                free ? el('button', {
                    type: 'button', class: 'btn-chip edit-only slot-add-level',
                    'aria-label': `Ajouter le suivi des emplacements de niveau ${free}`,
                    on: {
                        click: () => store.update({
                            spell_slots_state: adjustSlotMax(slotState(), free, 1, rulebookSlots(free))
                        })
                    }
                }, icon('plus'), el('span', { class: 'btn-label', text: `Emplacements niv. ${free}` })) : null
            ].filter(Boolean));
            if (focusedLabel) {
                [...slotsBox.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === focusedLabel && !b.disabled)?.focus();
            }
        } else {
            for (const v of views) {
                const group = slotsBox.querySelector(`.slot-group[data-level="${v.info.level}"]`);
                group?.querySelectorAll('input[type="checkbox"]').forEach((box, i) => { box.checked = i < v.used; });
            }
        }
        for (const group of slotsBox.querySelectorAll('.slot-group')) {
            group.classList.toggle('is-active', group.dataset.level === view.level);
        }
    }

    // -----------------------------------------------------------------------
    // Tableau
    // -----------------------------------------------------------------------

    const sortButtons = {};
    const headCells = {};
    function sortHeader(col) {
        const button = el('button', {
            type: 'button', class: 'sort-btn',
            on: {
                click: () => {
                    view.sort = nextSort(view.sort, col);
                    hideTooltip();
                    render(store.get(), null, { structural: true });
                }
            }
        }, SORT_COLUMNS[col].label, el('span', { class: 'sort-icon', 'aria-hidden': 'true' }));
        sortButtons[col] = button;
        headCells[col] = el('th', { scope: 'col', class: `col-${col}`, 'aria-sort': 'none' }, button);
        return headCells[col];
    }

    const tbody = el('tbody');
    const table = el('table', { class: 'data-table spells-table', 'aria-label': 'Liste des sorts' },
        el('thead', {}, el('tr', {},
            el('th', { scope: 'col', class: 'col-prep' }, el('abbr', { title: 'Préparé', text: 'P' })),
            sortHeader('lvl'),
            sortHeader('name'),
            sortHeader('school'),
            el('th', { scope: 'col', class: 'col-time', text: 'Temps d\'incant.' }),
            el('th', { scope: 'col', class: 'col-range', text: 'Portée' }),
            el('th', { scope: 'col', class: 'col-crm' },
                el('abbr', { title: 'Concentration', text: 'C' }), ' / ',
                el('abbr', { title: 'Rituel', text: 'R' }), ' / ',
                el('abbr', { title: 'Composante matérielle', text: 'M' })),
            el('th', { scope: 'col', class: 'col-note', text: 'Notes' }),
            el('th', { scope: 'col', class: 'col-del edit-only', 'aria-label': 'Supprimer' }))),
        tbody);
    const tableScroll = el('div', { class: 'table-scroll spells-scroll' }, table);
    const emptyText = el('p', { class: 'spells-empty', hidden: true });

    const addBtn = el('button', {
        type: 'button', class: 'add-row edit-only',
        on: {
            click: () => {
                store.update({ dynamic_spells: [...spellsOf(), newSpellRow(EMPTY_SPELL, view.level)] });
                rowEls[rowEls.length - 1]?.name.focus();
            }
        }
    });
    setIconLabel(addBtn, 'plus', 'Ajouter un sort');

    function createRow() {
        const r = { index: 0 };

        r.prep = el('button', {
            type: 'button', class: 'spell-prep',
            on: {
                click: () => {
                    const row = spellsOf()[r.index];
                    if (!row || rowLevel(row) === '0') return;
                    editRow(r.index, { prep: row.prep !== true });
                }
            }
        });

        r.lvl = el('select', {
            class: 'cell-input spell-lvl',
            on: { change: () => editRow(r.index, { lvl: r.lvl.value }) }
        }, SPELL_LEVELS.map(level => el('option', { value: level, text: level })));

        const textInput = (key) => createCellText({
            class: `cell-input spell-${key}`, autocomplete: 'off', spellcheck: 'false',
            on: {
                input: (event) => {
                    if (key === 'name') hideTooltip();
                    editRow(r.index, { [key]: event.target.value });
                }
            }
        });

        r.name = textInput('name');
        r.name.placeholder = 'Nom…';
        r.texts = {};
        for (const [key] of TEXT_COLUMNS) r.texts[key] = textInput(key);
        r.note = textInput('note');

        r.flags = {};
        const flagLabels = FLAG_COLUMNS.map(([key, letter, title]) => {
            r.flags[key] = el('input', {
                type: 'checkbox', class: 'round-check',
                on: { change: (event) => editRow(r.index, { [key]: event.target.checked }) }
            });
            return el('label', { class: 'spell-flag', title }, r.flags[key], el('span', { 'aria-hidden': 'true', text: letter }));
        });

        r.del = el('button', {
            type: 'button', class: 'btn-icon is-danger spell-del', title: 'Supprimer le sort', 'aria-label': 'Supprimer le sort',
            on: { click: () => deleteRow(r) }
        }, icon('trash'));

        r.name.addEventListener('mouseenter', () => scheduleShow(r, 'hover'));
        r.name.addEventListener('mouseleave', scheduleHide);
        r.name.addEventListener('focus', () => scheduleShow(r, 'focus'));
        r.name.addEventListener('blur', scheduleHide);

        r.detach = attachAutocomplete(r.name, {
            minChars: 2,
            maxItems: 12,
            getItems: (query) => {
                const character = store.get();
                const classSlug = effectiveSpellClass(character.spell_class_filter, deriveCharacter(character).classSlug);
                return searchSpells(spellsDb, query, { classSlug, limit: 12 }).map(spell => ({
                    label: spellDisplayName(spell),
                    detail: `niv. ${spell.level} · ${spell.school}`,
                    value: spell
                }));
            },
            onSelect: (item) => {
                const row = spellsOf()[r.index];
                if (!row) return;
                const filled = spellToRow(item.value, row);
                editRow(r.index, filled);
                r.name.value = filled.name;
            }
        });

        r.tr = el('tr', {},
            el('td', { class: 'col-prep' }, r.prep),
            el('td', { class: 'col-lvl' }, r.lvl),
            el('td', { class: 'col-name' }, r.name),
            el('td', { class: 'col-school' }, r.texts.school),
            el('td', { class: 'col-time' }, r.texts.time),
            el('td', { class: 'col-range' }, r.texts.range),
            el('td', { class: 'col-crm' }, el('span', { class: 'spell-flags' }, flagLabels)),
            el('td', { class: 'col-note' }, r.note),
            el('td', { class: 'col-del edit-only' }, r.del));

        // La ligne reste affichée tant que le focus y est ; le filtre de niveau est réappliqué
        // quand le focus la quitte (niveau modifié pendant que le filtre est actif)
        r.tr.addEventListener('focusout', (event) => {
            if (r.tr.contains(event.relatedTarget)) return;
            setTimeout(() => {
                if (!r.tr.isConnected || r.tr.contains(document.activeElement)) return;
                render(store.get(), ['dynamic_spells']);
            }, 0);
        });
        return r;
    }

    async function deleteRow(r) {
        const index = r.index;
        const row = spellsOf()[index];
        if (!row) return;
        if (!isSpellRowEmpty(row)) {
            const ok = await confirmModal({
                title: 'Supprimer le sort',
                icon: 'trash',
                message: `Supprimer « ${plainText(row.name) || 'ce sort'} » du grimoire ?`,
                confirmLabel: 'Supprimer',
                confirmIcon: 'trash',
                danger: true
            });
            if (!ok) return;
        }
        const list = spellsOf();
        if (list[index] !== row) return; // la fiche a changé entre-temps
        hideTooltip();
        store.update({ dynamic_spells: list.filter((_, i) => i !== index) });
        if (!document.activeElement || document.activeElement === document.body) {
            (rowEls[Math.min(index, rowEls.length - 1)]?.del || addBtn).focus();
        }
    }

    function setValue(input, value, force) {
        if (!force && input === document.activeElement) return;
        if (input.value !== value) input.value = value;
    }

    function applyRowLock(r, locked) {
        r.lvl.disabled = locked;
        r.name.readOnly = locked;
        for (const [key] of TEXT_COLUMNS) r.texts[key].readOnly = locked;
        r.note.readOnly = locked;
        for (const [key] of FLAG_COLUMNS) r.flags[key].disabled = locked;
        // Contrôle de jeu : reste utilisable verrouillé (seuls les sorts mineurs sont inactifs)
        r.prep.disabled = r.prep.classList.contains('is-cantrip');
    }

    function writeRow(r, row, force, locked) {
        const name = plainText(row.name);
        const level = rowLevel(row);
        const what = name ? `« ${name} »` : `ligne ${r.index + 1}`;
        const prepared = row.prep === true;
        const cantrip = level === '0';

        r.lvl.value = level;
        // Valeurs affichées telles qu'enregistrées (seul le HTML v3 est nettoyé) : rien n'est perdu
        setValue(r.name, cellText(row.name), force);
        for (const [key] of TEXT_COLUMNS) setValue(r.texts[key], cellText(row[key]), force);
        setValue(r.note, cellText(row.note), force);
        for (const [key] of FLAG_COLUMNS) r.flags[key].checked = row[key] === true;

        r.prep.classList.toggle('is-cantrip', cantrip);
        r.prep.classList.toggle('is-prepared', !cantrip && prepared);
        if (cantrip) {
            r.prep.textContent = '∞';
            r.prep.removeAttribute('aria-pressed');
            r.prep.title = 'Sort mineur : toujours disponible';
            r.prep.setAttribute('aria-label', `Sort mineur ${what} : toujours disponible`);
        } else {
            r.prep.textContent = prepared ? '◆' : '◇';
            r.prep.setAttribute('aria-pressed', String(prepared));
            r.prep.title = prepared ? 'Sort préparé' : 'Sort non préparé';
            r.prep.setAttribute('aria-label', `Sort ${what} préparé`);
        }

        r.lvl.setAttribute('aria-label', `Niveau du sort, ligne ${r.index + 1}`);
        r.name.setAttribute('aria-label', `Nom du sort, ligne ${r.index + 1}`);
        for (const [key, label] of TEXT_COLUMNS) r.texts[key].setAttribute('aria-label', `${label}, ${what}`);
        r.note.setAttribute('aria-label', `Notes, ${what}`);
        for (const [key, , title] of FLAG_COLUMNS) r.flags[key].setAttribute('aria-label', `${title}, ${what}`);
        r.del.setAttribute('aria-label', `Supprimer le sort ${what}`);
        applyRowLock(r, locked);
    }

    function renderRows(character, force, structural) {
        const rows = Array.isArray(character.dynamic_spells) ? character.dynamic_spells : [];
        const locked = isLocked();
        const countChanged = rows.length !== rowEls.length;

        while (rowEls.length < rows.length) rowEls.push(createRow());
        while (rowEls.length > rows.length) {
            const r = rowEls.pop();
            r.detach();
            r.tr.remove();
        }
        rowEls.forEach((r, i) => {
            r.index = i;
            writeRow(r, rows[i], force, locked);
        });

        if (force || structural || countChanged) {
            const order = sortedSpellIndices(rows, view.sort).map(i => rowEls[i].tr);
            const current = [...tbody.children];
            if (order.length !== current.length || order.some((tr, i) => tr !== current[i])) tbody.append(...order);
            rowEls.forEach((r, i) => { r.tr.hidden = !matchesLevelFilter(rows[i], view.level); });
        } else {
            // Une ligne en cours de saisie ne disparaît pas sous les doigts de l'utilisateur
            const active = document.activeElement;
            rowEls.forEach((r, i) => {
                if (!r.tr.contains(active)) r.tr.hidden = !matchesLevelFilter(rows[i], view.level);
            });
        }

        const visible = rowEls.some(r => !r.tr.hidden);
        tableScroll.hidden = rows.length === 0;
        if (rows.length === 0) {
            emptyText.textContent = locked
                ? 'Aucun sort dans le grimoire.'
                : 'Aucun sort dans le grimoire. Ajoutez-en avec « Ajouter un sort » : la saisie du nom propose les sorts du manuel.';
        } else if (!visible) {
            emptyText.textContent = view.level === '0' ? 'Aucun sort mineur.' : `Aucun sort de niveau ${view.level}.`;
        } else {
            emptyText.textContent = '';
        }
        emptyText.hidden = !emptyText.textContent;

        countOut.textContent = formatSpellCount(spellCounts(rows, view.level), view.level !== '');
    }

    function renderHeader() {
        for (const col of Object.keys(SORT_COLUMNS)) {
            const active = view.sort.col === col;
            const asc = view.sort.dir === 'asc';
            headCells[col].setAttribute('aria-sort', active ? (asc ? 'ascending' : 'descending') : 'none');
            sortButtons[col].querySelector('.sort-icon').textContent = active ? (asc ? '▲' : '▼') : '';
            sortButtons[col].title = active && !asc
                ? 'Revenir à l\'ordre du grimoire'
                : `Trier par ${SORT_COLUMNS[col].title}${active ? ' (ordre décroissant)' : ''}`;
        }
        for (const chip of levelChips) chip.setAttribute('aria-pressed', String(chip.dataset.level === view.level));
    }

    function renderClassFilter(character, d) {
        const value = String(character.spell_class_filter || '');
        const own = SPELL_CLASS_OPTIONS.find(([slug]) => slug === effectiveSpellClass('', d.classSlug));
        const firstLabel = own ? `Classe du personnage (${own[1]})` : 'Toutes les classes';
        if (classSelect.options.length === 0) {
            classSelect.replaceChildren(el('option', { value: '', text: firstLabel }),
                ...SPELL_CLASS_OPTIONS.map(([slug, label]) => el('option', { value: slug, text: label })));
        } else if (classSelect.options[0].textContent !== firstLabel) {
            classSelect.options[0].textContent = firstLabel;
        }
        classSelect.value = SPELL_CLASS_OPTIONS.some(([slug]) => slug === value) ? value : '';
    }

    function render(character, changedKeys, { structural = false } = {}) {
        if (changedKeys && !changedKeys.some(key => RELEVANT_KEYS.has(key))) return;
        const d = deriveCharacter(character);
        renderClassFilter(character, d);
        renderHeader();
        renderRows(character, changedKeys === null && !structural, structural);
        renderSlots(character, d);
    }

    // -----------------------------------------------------------------------
    // Infobulles (survol et focus du nom ; fonctionnent aussi verrouillé)
    // La description est affichée en texte brut (textContent), jamais en HTML.
    // -----------------------------------------------------------------------

    const tooltip = el('div', { class: 'spell-tooltip', id: 'spell-tooltip', role: 'tooltip', hidden: true });
    let hideTimer = null;
    let tooltipOwner = null;

    function fillTooltip(spell) {
        const components = String(spell.components || '').split(/[\s,]+/).filter(Boolean).join(', ');
        const tags = [spell.concentration ? 'Concentration' : '', spell.ritual ? 'Rituel' : ''].filter(Boolean);
        const meta = [
            ['Temps d\'incantation', spell.castTime],
            ['Portée', spell.range],
            ['Durée', spell.duration],
            ['Composantes', components]
        ].filter(([, value]) => value);
        tooltip.replaceChildren(
            el('div', { class: 'spell-tooltip-head' },
                el('strong', { class: 'spell-tooltip-name', text: spellDisplayName(spell) }),
                el('span', { class: 'spell-tooltip-level', text: [spellLevelLabel(spell.level), spell.school].filter(Boolean).join(' · ') }),
                tags.length ? el('span', { class: 'spell-tooltip-tags', text: tags.join(' · ') }) : null),
            el('dl', { class: 'spell-tooltip-meta' }, meta.map(([label, value]) => el('div', {},
                el('dt', { text: label }), el('dd', { text: String(value) })))),
            el('p', { class: 'spell-tooltip-desc', text: descToPlainText(spell.desc) || 'Description non disponible.' }));
    }

    function positionTooltip(anchor) {
        const rect = anchor.getBoundingClientRect();
        const margin = 8;
        const viewportWidth = document.documentElement.clientWidth;
        let top = rect.top - tooltip.offsetHeight - margin;
        if (top < margin) top = rect.bottom + margin;
        const left = Math.max(margin, Math.min(rect.left, viewportWidth - tooltip.offsetWidth - margin));
        tooltip.style.left = `${left + window.scrollX}px`;
        tooltip.style.top = `${top + window.scrollY}px`;
    }

    function showTooltip(r) {
        if (!tooltipsOn) return;
        const row = spellsOf()[r.index];
        const spell = row ? findSpellByName(spellsDb, row.name) : null;
        if (!spell) {
            hideTooltip();
            return;
        }
        if (tooltipOwner && tooltipOwner !== r.name) tooltipOwner.removeAttribute('aria-describedby');
        fillTooltip(spell);
        tooltip.hidden = false;
        positionTooltip(r.name);
        tooltipOwner = r.name;
        r.name.setAttribute('aria-describedby', tooltip.id);
    }

    function scheduleShow(r, reason) {
        clearTimeout(hideTimer);
        // Pendant la saisie, la liste de suggestions s'affiche sous le champ : pas d'infobulle
        if (reason === 'hover' && r.name.getAttribute('aria-expanded') === 'true') return;
        showTooltip(r);
    }

    function hideTooltip() {
        clearTimeout(hideTimer);
        tooltip.hidden = true;
        if (tooltipOwner) tooltipOwner.removeAttribute('aria-describedby');
        tooltipOwner = null;
    }

    function scheduleHide() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            // Pointeur sur l'infobulle (lecture d'une longue description) : elle reste
            if (tooltip.matches(':hover')) return;
            // Le nom garde le focus : l'infobulle reste (accès au clavier)
            if (tooltipOwner && tooltipOwner === document.activeElement) return;
            hideTooltip();
        }, 150);
    }

    // Toucher / clic hors du nom : l'infobulle se ferme (sur tablette, elle ne doit pas
    // masquer les lignes du dessus ; le :hover « collant » d'iOS la garderait sinon).
    // À la souris, un clic dans l'infobulle (sélection de texte) la laisse ouverte.
    document.addEventListener('pointerdown', (event) => {
        if (tooltip.hidden || event.target === tooltipOwner) return;
        if (event.pointerType === 'mouse' && tooltip.contains(event.target)) return;
        hideTooltip();
    }, true);
    tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    tooltip.addEventListener('mouseleave', scheduleHide);
    tableScroll.addEventListener('scroll', hideTooltip, { passive: true });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !tooltip.hidden) hideTooltip();
    });
    document.body.append(tooltip);

    // -----------------------------------------------------------------------
    // Assemblage, abonnements
    // -----------------------------------------------------------------------

    container.replaceChildren(
        // Icône dorée devant le titre, comme les titres de index.html (data-icon, ornaments.js)
        el('h3', { 'data-icon': 'book' }, icon('book'), 'Sorts mineurs & sorts préparés'),
        toolbar,
        slotsBox,
        tableScroll,
        emptyText,
        addBtn);

    store.subscribe((character, changedKeys) => render(character, changedKeys));
    document.addEventListener('dd:lockchange', () => render(store.get(), ['dynamic_spells']));
    render(store.get(), null);

    loadSpells().then((list) => {
        spellsDb = Array.isArray(list) ? list : [];
        if (spellsDb.length === 0) setStatus('⚠️ Base de sorts indisponible : pas de suggestions ni d\'infobulles');
    });
}
