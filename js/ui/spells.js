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
//  - Seuls les sorts renseignés sont affichés, suivis d'UNE ligne de saisie : les lignes
//    vides d'une sauvegarde restent dans la fiche, telles quelles, sans être affichées.
//    La ligne de saisie n'existe pas dans la fiche : la première saisie qui a du contenu
//    (texte, case C / R / M) y crée le sort (à la fin de dynamic_spells), et une nouvelle
//    ligne de saisie apparaît dessous. Choisir seulement un niveau n'ajoute rien ; un sort
//    ainsi créé puis vidé avant de quitter la ligne est retiré (voir settleDraft).
//  - Personnage sans magie (classe, sous-classe et niveau) et sans aucun sort noté : le
//    grimoire et les cases « Caractéristique d'incantation / DD / Bonus d'attaque » se
//    replient en un court avis, avec un bouton pour l'ouvrir (sorts de don ou d'espèce).
//    Le choix ouvert / replié est mémorisé dans ce navigateur, hors de la fiche. Pour un
//    personnage sans magie de classe, les cases d'incantation passent après le grimoire.
// Les règles (recherche, conversion, compteurs, emplacements) sont dans js/rules/spells.js.
// =============================================================================

import { EMPTY_SPELL } from '../state/schema.js';
import { deriveCharacter } from '../rules/character.js';
import {
    SPELL_CLASS_OPTIONS, SPELL_LEVELS, plainText, cellText, descToPlainText, spellDisplayName,
    spellLevelLabel, effectiveSpellClass, searchSpells, findSpellByName, spellToRow, rowLevel,
    isSpellRowEmpty, hasSpellContent, spellRowsView, nextSort, spellCounts,
    formatSpellCount, newSpellRow, slotView, toggleSlotUsed, adjustSlotMax, slotLevels,
    nextFreeSlotLevel, spellcastingStatus, grimoireView
} from '../rules/spells.js';
import { loadSpells } from '../data/spells.js';
import { el, icon, setIconLabel } from './dom.js';
import { cellText as createCellText } from './cell-text.js';
import { attachAutocomplete } from './autocomplete.js';
import { confirmModal } from './modal.js';
import { isLocked } from './lock.js';

const TOOLTIP_STORAGE_KEY = 'dd2024_spell_tooltips';
/** Grimoire ouvert à la demande (personnage sans magie) : réglage du navigateur, pas de la fiche */
const GRIMOIRE_STORAGE_KEY = 'dd2024_grimoire_open';
const RELEVANT_KEYS = new Set(['dynamic_spells', 'spell_slots_state', 'spell_class_filter', 'char_class', 'char_subclass', 'char_level']);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
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

function readGrimoireOpen() {
    try {
        return localStorage.getItem(GRIMOIRE_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

function saveGrimoireOpen(open) {
    try {
        localStorage.setItem(GRIMOIRE_STORAGE_KEY, String(open));
    } catch {
        // Stockage indisponible : le choix ne sera pas mémorisé
    }
}

/** Bref éclat doré (ligne de saisie appelée, grimoire ouvert) ; rien si les animations sont limitées */
function flash(node, className) {
    if (!node || reducedMotion.matches) return;
    node.classList.remove(className);
    void node.offsetWidth; // relance l'animation si elle est déjà en cours
    node.classList.add(className);
    node.addEventListener('animationend', () => node.classList.remove(className), { once: true });
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
    let grimoireOpen = readGrimoireOpen();
    let spellsDb = [];
    // Un élément par ligne de dynamic_spells (même indice), plus la ligne de saisie, toujours
    // le dernier élément (indice = nombre de lignes enregistrées)
    const rowEls = [];
    // Vrai pendant la création d'un sort depuis la ligne de saisie (voir renderRows)
    let creatingFromEntry = false;
    // Niveau choisi dans la ligne de saisie avant d'y écrire (null : celui du filtre actif)
    let entryLevel = null;
    // Sort créé depuis la ligne de saisie, tant que le focus ne l'a pas quittée :
    // { index, json } (json : sa dernière version écrite ici, voir settleDraft)
    let draft = null;

    const spellsOf = () => {
        const list = store.get().dynamic_spells;
        return Array.isArray(list) ? list : [];
    };

    function editRow(index, patch) {
        const list = spellsOf();
        if (index === list.length) {
            // Ligne de saisie : le sort est créé à la première saisie qui a du contenu, au niveau
            // choisi dans la ligne ou à celui du filtre actif. Un niveau seul (liste, flèches du
            // clavier) est gardé pour la ligne, sans rien écrire dans la fiche.
            const row = { ...newSpellRow(EMPTY_SPELL, entryLevel ?? view.level), ...patch };
            if (!hasSpellContent(row)) {
                if ('lvl' in patch) entryLevel = String(patch.lvl);
                return;
            }
            entryLevel = null;
            creatingFromEntry = true;
            try {
                store.update({ dynamic_spells: [...list, row] });
            } finally {
                creatingFromEntry = false;
            }
            draft = { index, json: JSON.stringify(spellsOf()[index]) };
            return;
        }
        if (!list[index]) return;
        const next = list.slice();
        next[index] = { ...list[index], ...patch };
        store.update({ dynamic_spells: next });
        if (draft?.index === index) draft.json = JSON.stringify(spellsOf()[index]);
    }

    /**
     * Le focus quitte la ligne d'un sort créé depuis la ligne de saisie. Vidé entre-temps
     * (texte effacé, case décochée), ce sort est retiré : la fiche revient à son état d'avant
     * la saisie, sans ligne vide invisible. Seul ce sort-là est concerné, et seulement s'il
     * est resté tel que cette saisie l'a laissé (sinon la fiche a changé : rien n'est touché).
     * @param {number} index
     * @returns {boolean} vrai si le sort a été retiré (la fiche est alors déjà réaffichée)
     */
    function settleDraft(index) {
        if (!draft || draft.index !== index) return false;
        const list = spellsOf();
        const row = list[index];
        const untouched = index === list.length - 1 && JSON.stringify(row) === draft.json;
        draft = null;
        if (!untouched || hasSpellContent(row)) return false;
        store.update({ dynamic_spells: list.slice(0, index) });
        return true;
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
                entryLevel = null; // la ligne de saisie reprend le niveau du filtre
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
            // Ajout manuel d'un niveau au-dessus de ceux du manuel (comme le « + » de la v3) : Chevalier
            // occulte, Escroc arcanique, Arcanum mystique de l'Occultiste, multiclasse...
            const free = nextFreeSlotLevel(levels);
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
    // Message sous le tableau ; le conseil de saisie n'est pas imprimé
    const emptyMain = el('span');
    const emptyHint = el('span', { class: 'spells-empty-hint' });
    const emptyText = el('p', { class: 'spells-empty', hidden: true }, emptyMain, emptyHint);

    // Aucune ligne vide n'est ajoutée à la fiche : le bouton amène sur la ligne de saisie,
    // toujours en bas du tableau (le sort sera créé à la première frappe)
    const addBtn = el('button', {
        type: 'button', class: 'add-row edit-only',
        on: {
            click: () => {
                hideTooltip();
                render(store.get(), ['dynamic_spells'], { structural: true });
                const entry = rowEls[spellsOf().length];
                if (!entry || entry.tr.hidden) return;
                entry.name.focus();
                flash(entry.tr, 'is-called');
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

        // La ligne reste affichée (et à sa place) tant que le focus y est ; le filtre de niveau
        // et le tri sont réappliqués quand le focus la quitte (niveau ou nom modifié, ligne
        // vidée, sort tout juste créé depuis la ligne de saisie)
        r.tr.addEventListener('focusout', (event) => {
            if (r.tr.contains(event.relatedTarget)) return;
            setTimeout(() => {
                if (!r.tr.isConnected || r.tr.contains(document.activeElement)) return;
                if (settleDraft(r.index)) return;
                render(store.get(), ['dynamic_spells'], { structural: true });
            }, 0);
        });

        // Toucher une case à côté de son texte (sur tablette, la zone de saisie est moins haute
        // que la ligne) : le curseur va dans la case ; dans la ligne de saisie, sur le nom
        r.tr.addEventListener('click', (event) => {
            const cell = event.target;
            if (cell.tagName !== 'TD') return;
            const field = cell.querySelector('textarea') ?? (r.tr.classList.contains('spell-entry') ? r.name : null);
            field?.focus();
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
        // Rang de la ligne dans le tableau affiché : le focus ira à celle qui prend sa place
        const shownRows = () => [...tbody.children].filter(tr => !tr.hidden);
        const rank = Math.max(0, shownRows().indexOf(r.tr));
        // Le focus quitte d'abord le bouton Supprimer : les éléments des lignes sont réutilisés
        // par indice, ce bouton va montrer la ligne suivante de la fiche, peut-être une ligne
        // vide non affichée, qui resterait sinon à l'écran comme « en cours de saisie »
        r.del.blur();
        if (draft?.index === index) draft = null;
        store.update({ dynamic_spells: list.filter((_, i) => i !== index) });
        // Focus sur la ligne affichée à la même place (bouton Supprimer, ou nom de la ligne de
        // saisie), sinon sur le bouton qui rouvre le grimoire s'il vient de se replier
        const shown = shownRows();
        const tr = shown[Math.min(rank, shown.length - 1)];
        const next = tr ? rowEls.find(item => item.tr === tr) : null;
        const target = body.hidden ? toggleBtn
            : next ? (next.tr.classList.contains('spell-entry') ? next.name : next.del) : addBtn;
        target.focus();
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
        // Contrôle de jeu : reste utilisable verrouillé (seuls les sorts mineurs sont inactifs,
        // et la ligne de saisie, qui n'est pas encore un sort)
        r.prep.disabled = r.prep.classList.contains('is-cantrip') || r.prep.classList.contains('is-entry');
    }

    /**
     * @param {Object} r - éléments de la ligne
     * @param {Object} row - ligne de dynamic_spells (ligne vierge pour la ligne de saisie)
     * @param {{ force: boolean, locked: boolean, entry: boolean, line: number }} options
     *        entry : ligne de saisie ; line : rang de la ligne dans le tableau affiché
     */
    function writeRow(r, row, { force, locked, entry, line }) {
        const name = plainText(row.name);
        const level = rowLevel(row);
        const what = entry ? 'nouveau sort' : name ? `« ${name} »` : `ligne ${line}`;
        const prepared = row.prep === true;
        const cantrip = level === '0';

        r.tr.classList.toggle('spell-entry', entry);
        r.lvl.value = level;
        // Valeurs affichées telles qu'enregistrées (seul le HTML v3 est nettoyé) : rien n'est perdu
        setValue(r.name, cellText(row.name), force);
        for (const [key] of TEXT_COLUMNS) setValue(r.texts[key], cellText(row[key]), force);
        setValue(r.note, cellText(row.note), force);
        for (const [key] of FLAG_COLUMNS) r.flags[key].checked = row[key] === true;
        r.name.placeholder = entry ? 'Nouveau sort…' : 'Nom…';

        r.prep.classList.toggle('is-entry', entry);
        r.prep.classList.toggle('is-cantrip', !entry && cantrip);
        r.prep.classList.toggle('is-prepared', !entry && !cantrip && prepared);
        if (entry) {
            // Ligne de saisie : simple repère « + » (décoratif), pas encore de sort à préparer
            r.prep.textContent = '';
            r.prep.removeAttribute('aria-pressed');
            r.prep.removeAttribute('aria-label');
            r.prep.title = '';
            r.prep.setAttribute('aria-hidden', 'true');
            r.prep.tabIndex = -1;
        } else {
            r.prep.removeAttribute('aria-hidden');
            r.prep.removeAttribute('tabindex');
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
        }

        r.lvl.setAttribute('aria-label', entry ? 'Niveau du nouveau sort' : `Niveau du sort, ligne ${line}`);
        r.name.setAttribute('aria-label', entry ? 'Nom du nouveau sort' : `Nom du sort, ligne ${line}`);
        for (const [key, label] of TEXT_COLUMNS) r.texts[key].setAttribute('aria-label', `${label}, ${what}`);
        r.note.setAttribute('aria-label', `Notes, ${what}`);
        for (const [key, , title] of FLAG_COLUMNS) r.flags[key].setAttribute('aria-label', `${title}, ${what}`);
        r.del.setAttribute('aria-label', `Supprimer le sort ${what}`);
        r.del.disabled = entry;
        applyRowLock(r, locked);
    }

    /**
     * Range les lignes dans l'ordre d'affichage. Déplacer un élément lui fait perdre le focus :
     * la ligne qui a le focus ne bouge donc jamais, les autres se rangent autour d'elle.
     * @param {HTMLTableRowElement[]} order
     */
    function placeRows(order) {
        const current = [...tbody.children];
        if (order.length === current.length && order.every((tr, i) => tr === current[i])) return;
        const anchor = order.find(tr => tr.parentNode === tbody && tr.contains(document.activeElement));
        if (!anchor) {
            tbody.append(...order);
            return;
        }
        const at = order.indexOf(anchor);
        anchor.before(...order.slice(0, at));
        anchor.after(...order.slice(at + 1));
    }

    function renderRows(character, force, structural) {
        const rows = Array.isArray(character.dynamic_spells) ? character.dynamic_spells : [];
        const locked = isLocked();
        const countChanged = rows.length + 1 !== rowEls.length;

        while (rowEls.length < rows.length + 1) rowEls.push(createRow());
        while (rowEls.length > rows.length + 1) {
            const r = rowEls.pop();
            r.detach();
            r.tr.remove();
        }
        const entry = rowEls[rows.length];
        rowEls.forEach((r, i) => { r.index = i; });

        // Lignes affichées : sorts renseignés qui passent le filtre, et la ligne en cours de
        // saisie (elle ne disparaît pas sous les doigts de l'utilisateur, même vidée)
        const active = document.activeElement;
        const pinned = rowEls.filter(r => r !== entry && r.tr.contains(active)).map(r => r.index);
        const { order, shown, hasDraft } = spellRowsView(rows, { level: view.level, sort: view.sort, pinned });
        const lines = new Map(order.filter(i => shown.has(i)).map((i, rank) => [i, rank + 1]));

        rowEls.forEach((r, i) => {
            const isEntry = r === entry;
            writeRow(r, isEntry ? newSpellRow(EMPTY_SPELL, entryLevel ?? view.level) : rows[i], {
                force, locked, entry: isEntry, line: isEntry ? lines.size + 1 : lines.get(i) ?? i + 1
            });
            if (!isEntry) r.tr.hidden = !shown.has(i);
        });
        // Une seule ligne vide à l'écran : la ligne de saisie s'efface pendant qu'une ligne
        // vidée est encore en cours de saisie ; aucune saisie possible verrouillé
        entry.tr.hidden = locked || hasDraft;

        const trs = [...order.map(i => rowEls[i].tr), entry.tr];
        if (force || structural || (countChanged && !creatingFromEntry)) {
            placeRows(trs);
        } else if (countChanged) {
            // Sort créé depuis la ligne de saisie : il reste où il est pendant la frappe (le tri
            // est réappliqué quand le focus quitte la ligne), la nouvelle ligne de saisie va dessous
            tbody.append(...trs.filter(tr => tr.parentNode !== tbody));
        }

        const counts = spellCounts(rows, view.level);
        const anySpell = rows.some(hasSpellContent);
        const anyShown = shown.size > 0;
        container.toggleAttribute('data-no-spells', !anySpell);
        tableScroll.hidden = !anyShown && entry.tr.hidden;
        emptyMain.textContent = '';
        emptyHint.textContent = '';
        if (!anySpell) {
            emptyMain.textContent = locked ? 'Aucun sort dans le grimoire.' : 'Aucun sort pour l\'instant.';
            if (!locked) emptyHint.textContent = ' Tapez un nom dans la ligne ci-dessus : la saisie propose les sorts du manuel.';
        } else if (!anyShown) {
            emptyMain.textContent = view.level === '0' ? 'Aucun sort mineur.' : `Aucun sort de niveau ${view.level}.`;
        }
        emptyText.hidden = !emptyMain.textContent;

        countOut.textContent = formatSpellCount(counts, view.level !== '');
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

    // -----------------------------------------------------------------------
    // Personnage sans magie : court avis, grimoire ouvert à la demande
    // -----------------------------------------------------------------------

    // Cases « Caractéristique d'incantation / DD / Bonus d'attaque » (index.html), repliées avec le grimoire
    const stats = root.querySelector('#spell-stats');
    const noticeMain = el('p', { class: 'grimoire-notice-main' });
    const notice = el('div', { class: 'grimoire-notice', hidden: true },
        noticeMain,
        el('p', {
            class: 'grimoire-notice-hint',
            text: 'Un sort accordé par un don ou une espèce ? Ouvrez le grimoire pour le noter.'
        }));

    const toggleLabel = el('span', { class: 'btn-label' });
    const toggleBtn = el('button', {
        type: 'button', class: 'btn-chip grimoire-toggle', hidden: true, 'aria-expanded': 'false',
        'aria-controls': stats ? 'spells-body spell-stats' : 'spells-body',
        on: {
            click: () => {
                grimoireOpen = toggleBtn.getAttribute('aria-expanded') !== 'true';
                saveGrimoireOpen(grimoireOpen);
                hideTooltip();
                render(store.get(), ['dynamic_spells'], { structural: true });
                if (grimoireOpen) {
                    flash(stats, 'is-revealed');
                    flash(body, 'is-revealed');
                }
            }
        }
    }, icon('book'), toggleLabel, el('span', { class: 'grimoire-chevron', 'aria-hidden': 'true' }));

    function renderGrimoire(character, d) {
        const rows = Array.isArray(character.dynamic_spells) ? character.dynamic_spells : [];
        const status = spellcastingStatus({
            classSlug: d.classSlug, subclass: character.char_subclass, level: d.level,
            spellSlots: d.spellSlots, slotState: slotState(character)
        });
        // Saisie en cours dans le grimoire (ligne vidée) : il ne se replie pas sous les doigts
        const active = document.activeElement;
        const hadFocus = !body.hidden && body.contains(active);
        const typing = hadFocus && active.matches('textarea, input, select');
        const mode = grimoireView(status.casts, typing || rows.some(hasSpellContent), grimoireOpen);
        const quiet = mode === 'quiet';

        container.dataset.grimoire = mode;
        notice.hidden = !quiet;
        body.hidden = quiet;
        if (stats) {
            stats.hidden = quiet;
            placeStats(!status.casts);
        }
        toggleBtn.hidden = mode === 'full';
        // Grimoire replié alors que le focus y était (dernier sort supprimé) : il passe au
        // bouton qui le rouvre, au lieu de se perdre
        if (quiet && hadFocus) toggleBtn.focus();
        toggleBtn.setAttribute('aria-expanded', String(!quiet));
        const label = quiet ? 'Ouvrir le grimoire' : 'Replier le grimoire';
        if (toggleLabel.textContent !== label) toggleLabel.textContent = label;
        const message = status.unlockLevel
            ? `Pas encore de magie : ${status.subclassName}, premiers sorts au niveau ${status.unlockLevel}.`
            : plainText(character.char_class)
                ? 'Pas de magie de classe pour ce personnage.'
                : 'Aucune classe choisie : pas de magie pour l\'instant.';
        if (noticeMain.textContent !== message) noticeMain.textContent = message;
    }

    /**
     * Cases d'incantation (#spell-stats, index.html) avant le grimoire pour un lanceur de sorts,
     * après lui sinon (grimoire ouvert à la demande, sorts de don ou d'espèce) : le bouton
     * ouvrir / replier ne bouge pas sous le doigt, et ce qu'il montre le suit dans l'ordre de
     * lecture. Seule leur place change (même élément, mêmes champs).
     * @param {boolean} after
     */
    function placeStats(after) {
        const inPlace = after ? container.nextElementSibling === stats : container.previousElementSibling === stats;
        if (inPlace) return;
        const focused = stats.contains(document.activeElement) ? document.activeElement : null;
        if (after) container.after(stats);
        else container.before(stats);
        focused?.focus({ preventScroll: true });
    }

    function render(character, changedKeys, { structural = false } = {}) {
        if (changedKeys && !changedKeys.some(key => RELEVANT_KEYS.has(key))) return;
        const d = deriveCharacter(character);
        renderClassFilter(character, d);
        renderHeader();
        renderRows(character, changedKeys === null && !structural, structural);
        renderSlots(character, d);
        renderGrimoire(character, d);
    }

    // -----------------------------------------------------------------------
    // Infobulles (survol et focus du nom ; fonctionnent aussi verrouillé)
    // La description est affichée en texte brut (textContent), jamais en HTML.
    // -----------------------------------------------------------------------

    const tooltip = el('div', { class: 'spell-tooltip', id: 'spell-tooltip', role: 'tooltip', hidden: true });
    let hideTimer = null;
    let tooltipOwner = null;
    /** Le dernier toucher / clic a eu lieu dans l'infobulle */
    let touchedTooltip = false;

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

    /**
     * Au-dessus du nom s'il y a la place, sinon en dessous ; toujours entièrement dans la partie
     * visible de l'écran (clavier virtuel compris) : une longue description qui ne tient pas est
     * raccourcie à la place disponible et défile à l'intérieur de l'infobulle.
     */
    function positionTooltip(anchor) {
        const rect = anchor.getBoundingClientRect();
        const margin = 8;
        const viewportWidth = document.documentElement.clientWidth;
        const visual = window.visualViewport;
        const viewTop = visual ? visual.offsetTop : 0;
        const viewBottom = viewTop + (visual ? visual.height : window.innerHeight);
        tooltip.style.maxHeight = '';
        const natural = tooltip.offsetHeight;
        const above = rect.top - viewTop - 2 * margin;
        const below = viewBottom - rect.bottom - 2 * margin;
        const placeAbove = natural <= above || (natural > below && above > below);
        const room = placeAbove ? above : below;
        if (natural > room) tooltip.style.maxHeight = `${Math.max(120, Math.floor(room))}px`;
        const height = tooltip.offsetHeight;
        let top = placeAbove ? rect.top - height - margin : rect.bottom + margin;
        // Jamais au-dessus du haut de l'écran visible (très petit espace disponible)
        if (top < viewTop + margin) top = viewTop + margin;
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
        touchedTooltip = false;
        tooltip.hidden = true;
        if (tooltipOwner) tooltipOwner.removeAttribute('aria-describedby');
        tooltipOwner = null;
    }

    function scheduleHide() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            // Pointeur ou doigt sur l'infobulle (lecture d'une longue description) : elle reste
            if (tooltip.matches(':hover') || touchedTooltip) return;
            // Le nom garde le focus : l'infobulle reste (accès au clavier)
            if (tooltipOwner && tooltipOwner === document.activeElement) return;
            hideTooltip();
        }, 150);
    }

    // Toucher / clic hors du nom et de l'infobulle : elle se ferme (sur tablette, elle ne doit
    // pas masquer les lignes du dessus ; le :hover « collant » d'iOS la garderait sinon).
    // Dans l'infobulle (faire défiler une longue description du doigt, sélectionner du texte
    // à la souris), elle reste ouverte.
    document.addEventListener('pointerdown', (event) => {
        const inside = !tooltip.hidden && tooltip.contains(event.target);
        // Au doigt, le nom perd le focus en touchant l'infobulle : elle ne doit pas se fermer pour autant
        touchedTooltip = inside && event.pointerType !== 'mouse';
        if (tooltip.hidden || event.target === tooltipOwner || inside) return;
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

    const body = el('div', { class: 'spells-body', id: 'spells-body' },
        toolbar,
        slotsBox,
        tableScroll,
        emptyText,
        addBtn);

    // Ordre de lecture : titre, avis (replié), bouton ouvrir / replier, grimoire. Le bouton ne
    // change jamais de place dans la page (il garde donc le focus) : la grille de spells.css
    // le pose à droite du titre, grimoire replié comme ouvert (il ne bouge pas à l'écran non plus).
    container.replaceChildren(
        // Icône dorée devant le titre, comme les titres de index.html (data-icon, ornaments.js)
        el('h3', { 'data-icon': 'book' }, icon('book'), 'Sorts mineurs & sorts préparés'),
        notice,
        toggleBtn,
        body);

    store.subscribe((character, changedKeys) => {
        // Fiche remplacée (chargement, import) : la saisie en cours ne la concerne plus
        if (!changedKeys) {
            draft = null;
            entryLevel = null;
        }
        render(character, changedKeys);
    });
    document.addEventListener('dd:lockchange', () => render(store.get(), ['dynamic_spells']));
    render(store.get(), null);

    loadSpells().then((list) => {
        spellsDb = Array.isArray(list) ? list : [];
        if (spellsDb.length === 0) setStatus('⚠️ Base de sorts indisponible : pas de suggestions ni d\'infobulles');
    });
}
