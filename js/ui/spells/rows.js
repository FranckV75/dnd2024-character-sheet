// =============================================================================
// SPELLS/ROWS.JS - Une ligne du tableau des sorts : construction, écriture, verrou, infobulle
//
// createRow construit les éléments d'une ligne (objet « r », réutilisé par indice : il montre
// tour à tour un sort enregistré ou la ligne de saisie) ; writeRow y écrit un sort à chaque
// affichage (valeurs, losange « préparé », repères « Adepte », « Lançable en rituel », « Pas
// d'emplacement », libellés pour les lecteurs d'écran) ; applyRowLock pose le verrou.
// Le losange « préparé » est un contrôle de JEU (utilisable verrouillé) ; toujours préparé
// (liste fixe, sort donné) et sort d'Arcanum mystique (toujours disponible, hors du compte) :
// losange plein fixe, expliqué au toucher.
//  - Lit : la base de sorts (g.spellsDb), le niveau de la ligne de saisie (g.entryLevel,
//    g.view.level), le verrou de la fiche.
//  - Écrit : la fiche, par editRow (entry.js) ; rien d'autre que ses propres éléments.
// =============================================================================

import { plainText, cellText, findSpellByName, rowLevel, SPELL_LEVELS } from '../../rules/spells.js';
import { elementWord } from '../../rules/feat-choices.js';
import { isCastable, missingSlotText } from '../../rules/spell-preparation.js';
import { el, icon } from '../dom.js';
import { cellText as createCellText } from '../cell-text.js';
import { adeptTypes, adeptRule, affinityApplies } from './tooltip.js';
import { editRow, clearEntry, settleDraft } from './entry.js';
import { createPickButton, attachSpellPicker } from './picker.js';

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
/** Losange plein fixe : explication (infobulle, et message au toucher sur tablette). Courte : la
 *  barre du haut (#save-status) tient sur une ligne, ces phrases y tiennent dès 768 px */
const PREP_HELP = {
    list: "Toujours préparé : votre classe ne change sa liste qu'en gagnant un niveau (un sort à la fois).",
    granted: 'Toujours préparé : sort donné (classe, sous-classe, don, espèce), hors du compte des préparés.',
    arcanum: 'Arcanum mystique : toujours disponible, une fois par repos long, hors du compte des préparés.'
};
/** Losange plein fixe : pas un interrupteur (liste fixe, sort donné, Arcanum mystique) */
const FIXED_STATES = new Set(Object.keys(PREP_HELP));
/** Savoir rituel (Magicien) : sort rituel du livre, non préparé. Infobulle (souris), puis version
 *  courte affichée dans la barre du haut quand on touche le repère (tablette) */
const BOOK_RITUAL_HELP = 'Savoir rituel : ce sort de votre livre se lance en rituel sans être préparé (10 minutes de plus, sans emplacement), en lisant le livre.';
const BOOK_RITUAL_TAP = 'Savoir rituel : sort du livre lançable en rituel sans le préparer (+10 min, sans emplacement).';
/** Bouton ✕ de la ligne de saisie : infobulle (souris) ; la phrase dite au toucher est dans entry.js */
const CLEAR_TITLE = "Effacer la ligne : la remettre à zéro (rien d'enregistré n'est supprimé)";

// -----------------------------------------------------------------------
// Infobulle d'une ligne du tableau (survol et focus du nom ; fonctionne aussi verrouillé)
// -----------------------------------------------------------------------

function showTooltip(g, r) {
    if (!g.tooltip.enabled) return;
    const row = g.spellsOf()[r.index];
    const spell = row ? findSpellByName(g.spellsDb, row.name) : null;
    if (!spell) {
        g.tooltip.hide();
        return;
    }
    g.tooltip.showFor(r.name, spell);
}

function scheduleShow(g, r, reason) {
    g.tooltip.cancelHide();
    // Pendant la saisie, la liste de suggestions s'affiche sous le champ : pas d'infobulle
    if (reason === 'hover' && r.name.getAttribute('aria-expanded') === 'true') return;
    showTooltip(g, r);
}

// -----------------------------------------------------------------------
// Construction
// -----------------------------------------------------------------------

/**
 * Éléments d'une ligne du tableau. r.index (rang dans dynamic_spells) et r.state (état
 * « préparé », voir writeRow) sont tenus à jour par l'affichage.
 * @param {import('./context.js').Grimoire} g
 * @param {{ onCast: (r: Object) => void, onDelete: (r: Object) => void }} actions
 *        onCast : bouton « Lancer » (vue au combat) ; onDelete : bouton Supprimer
 * @returns {Object} r - { index, state, tr, prep, lvl, name, adept, affinity, ritual, noSlot,
 *          texts, note, flags, cast, del, clear, pick, detach }
 */
export function createRow(g, { onCast, onDelete }) {
    const { tooltip, setStatus } = g;
    const r = { index: 0 };

    r.prep = el('button', {
        type: 'button', class: 'spell-prep',
        on: {
            click: () => {
                const row = g.spellsOf()[r.index];
                if (!row || rowLevel(row) === '0') return;
                // Toujours préparé : rien à cocher, le toucher (tablette) dit pourquoi
                if (FIXED_STATES.has(r.state)) {
                    setStatus(PREP_HELP[r.state]);
                    return;
                }
                editRow(g, r.index, { prep: row.prep !== true });
                // Ligne en trop d'un niveau d'Arcanum : le toucher (tablette) dit lequel est l'Arcanum
                if (r.prepNote) setStatus(r.prepNote);
            }
        }
    });

    r.lvl = el('select', {
        class: 'cell-input spell-lvl',
        on: { change: () => editRow(g, r.index, { lvl: r.lvl.value }) }
    }, SPELL_LEVELS.map(level => el('option', { value: level, text: level })));

    const textInput = (key) => createCellText({
        class: `cell-input spell-${key}`, autocomplete: 'off', spellcheck: 'false',
        on: {
            input: (event) => {
                if (key === 'name') tooltip.hide();
                editRow(g, r.index, { [key]: event.target.value });
            }
        }
    });

    r.name = textInput('name');
    r.name.placeholder = 'Nom…';
    // Repère « Adepte (feu) » : sort du type choisi avec Adepte élémentaire (writeRow)
    r.adept = el('span', { class: 'spell-adept', hidden: true });
    // Repère « +Cha (+4, feu) » : sort du type choisi avec Affinité élémentaire (writeRow)
    r.affinity = el('span', { class: 'spell-adept', hidden: true });
    // Repère « Lançable en rituel » : sort rituel du livre non préparé (Magicien, writeRow)
    // (bouton : au toucher, l'explication s'affiche dans la barre du haut, comme pour le losange)
    r.ritual = el('button', {
        type: 'button', class: 'spell-adept spell-book-ritual', hidden: true, title: BOOK_RITUAL_HELP, text: 'Lançable en rituel',
        on: { click: () => setStatus(BOOK_RITUAL_TAP) }
    });
    // Repère « Pas d'emplacement » : sort préparé d'un niveau plus haut que les emplacements
    // (bouton : au toucher, la phrase s'affiche dans la barre du haut ; writeRow)
    r.noSlot = el('button', {
        type: 'button', class: 'spell-adept spell-book-ritual spell-no-slot', hidden: true, text: "Pas d'emplacement",
        on: { click: () => setStatus(r.noSlot.title) }
    });
    r.texts = {};
    for (const [key] of TEXT_COLUMNS) r.texts[key] = textInput(key);
    r.note = textInput('note');

    r.flags = {};
    const flagLabels = FLAG_COLUMNS.map(([key, letter, title]) => {
        r.flags[key] = el('input', {
            type: 'checkbox', class: 'round-check',
            on: { change: (event) => editRow(g, r.index, { [key]: event.target.checked }) }
        });
        return el('label', { class: 'spell-flag', title }, r.flags[key], el('span', { 'aria-hidden': 'true', text: letter }));
    });

    // Vue « au combat » : lancer le sort (contrôle de jeu, utilisable verrouillé)
    r.cast = el('button', {
        type: 'button', class: 'btn-chip spell-cast', hidden: true, title: "Lancer : choisir l'emplacement à cocher",
        on: { click: () => onCast(r) }
    }, icon('sparkle'), el('span', { class: 'btn-label', text: 'Lancer' }));

    r.del = el('button', {
        type: 'button', class: 'btn-icon is-danger spell-del', title: 'Supprimer le sort', 'aria-label': 'Supprimer le sort',
        on: { click: () => onDelete(r) }
    }, icon('trash'));

    // Ligne de saisie : ✕ la remet à zéro (voir clearEntry). Le focus reste dans le champ
    // (mousedown) : la saisie en cours n'est pas « quittée » avant l'effacement
    r.clear = el('button', {
        type: 'button', class: 'btn-icon spell-clear', title: CLEAR_TITLE, 'aria-label': 'Effacer la ligne', hidden: true,
        on: { mousedown: (event) => event.preventDefault(), click: () => clearEntry(g, r) }
    }, icon('close'));

    // ▾ : liste des sorts à parcourir, sans focus sur le nom (pas de clavier virtuel)
    r.pick = createPickButton(g, r);

    r.name.addEventListener('mouseenter', () => scheduleShow(g, r, 'hover'));
    r.name.addEventListener('mouseleave', tooltip.scheduleHide);
    r.name.addEventListener('focus', () => scheduleShow(g, r, 'focus'));
    r.name.addEventListener('blur', tooltip.scheduleHide);

    // Suggestions et liste des sorts (spells/picker.js), branchées après l'infobulle
    r.detach = attachSpellPicker(g, r);

    r.tr = el('tr', {},
        el('td', { class: 'col-prep' }, r.prep),
        el('td', { class: 'col-lvl' }, r.lvl),
        el('td', { class: 'col-name' }, el('div', { class: 'spell-name-wrap' }, r.name, r.pick), r.adept, r.affinity, r.ritual, r.noSlot),
        el('td', { class: 'col-school' }, r.texts.school),
        el('td', { class: 'col-time' }, r.texts.time),
        el('td', { class: 'col-range' }, r.texts.range),
        el('td', { class: 'col-crm' }, el('span', { class: 'spell-flags' }, flagLabels)),
        el('td', { class: 'col-note' }, r.note),
        el('td', { class: 'col-cast' }, r.cast),
        el('td', { class: 'col-del edit-only' }, r.del, r.clear));

    // La ligne reste affichée (et à sa place) tant que le focus y est ; le filtre de niveau
    // et le tri sont réappliqués quand le focus la quitte (niveau ou nom modifié, ligne
    // vidée, sort tout juste créé depuis la ligne de saisie)
    r.tr.addEventListener('focusout', (event) => {
        if (r.tr.contains(event.relatedTarget)) return;
        setTimeout(() => {
            if (!r.tr.isConnected || r.tr.contains(document.activeElement)) return;
            if (settleDraft(g, r.index)) return;
            g.redraw();
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

// -----------------------------------------------------------------------
// Écriture
// -----------------------------------------------------------------------

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
 * Losange « préparé » de la ligne : ∞ (sort mineur), ◆ fixe (toujours préparé), ◆ / ◇ à cocher.
 * @param {Object} r - éléments de la ligne
 * @param {{ entry: boolean, cantrip: boolean, always: boolean, prepared: boolean, state: string|null,
 *   wholeList: boolean, what: string, note?: string }} options - what : « nouveau sort », « « Nom » » ou
 *   « ligne N » ; note : infobulle propre du losange à cocher (ligne en trop d'un niveau d'Arcanum)
 */
function writePrep(r, { entry, cantrip, always, prepared, state, wholeList, what, note = '' }) {
    r.prep.classList.toggle('is-entry', entry);
    r.prep.classList.toggle('is-cantrip', !entry && cantrip);
    r.prep.classList.toggle('is-prepared', !entry && !cantrip && prepared);
    r.prep.classList.toggle('is-always', !entry && !cantrip && always);
    if (entry) {
        // Ligne de saisie : simple repère « + » (décoratif), pas encore de sort à préparer
        r.prep.textContent = '';
        r.prep.removeAttribute('aria-pressed');
        r.prep.removeAttribute('aria-label');
        r.prep.title = '';
        r.prep.setAttribute('aria-hidden', 'true');
        r.prep.tabIndex = -1;
        return;
    }
    r.prep.removeAttribute('aria-hidden');
    r.prep.removeAttribute('tabindex');
    if (cantrip) {
        r.prep.textContent = '∞';
        r.prep.removeAttribute('aria-pressed');
        r.prep.title = 'Sort mineur : toujours disponible';
        r.prep.setAttribute('aria-label', `Sort mineur ${what} : toujours disponible`);
    } else if (always) {
        // Repère fixe : pas un interrupteur (le toucher affiche l'explication)
        r.prep.textContent = '◆';
        r.prep.removeAttribute('aria-pressed');
        r.prep.title = PREP_HELP[state];
        r.prep.setAttribute('aria-label', state === 'arcanum' ? `Sort ${what} : Arcanum mystique, toujours disponible` : `Sort ${what} : toujours préparé`);
    } else {
        r.prep.textContent = prepared ? '◆' : '◇';
        r.prep.setAttribute('aria-pressed', String(prepared));
        // Classe à liste fixe : sort noté hors de cette liste (niveau trop haut, autre liste)
        r.prep.title = note || (wholeList
            ? (prepared ? 'Coché : compté dans vos sorts préparés' : "Hors de votre liste fixe (Découvertes magiques, autre liste…) : cochez-le seulement s'il compte dans vos sorts préparés")
            : prepared ? 'Sort préparé'
                : state === 'ritual' ? 'Sort non préparé : lançable en rituel depuis votre livre (Savoir rituel)' : 'Sort non préparé');
        r.prep.setAttribute('aria-label', `Sort ${what} préparé`);
    }
}

/**
 * @param {import('./context.js').Grimoire} g
 * @param {Object} r - éléments de la ligne
 * @param {Object} row - ligne de dynamic_spells (ligne vierge pour la ligne de saisie)
 * @param {{ force: boolean, locked: boolean, entry: boolean, line: number }} options
 *        entry : ligne de saisie ; line : rang de la ligne dans le tableau affiché
 */
export function writeRow(g, r, row, { force, locked, entry, line, elements = [], affinity = null, state = 'unprepared', wholeList = false, noSlot = 0, prepNote = '' }) {
    const name = plainText(row.name);
    const known = entry || (!elements.length && !affinity) ? null : findSpellByName(g.spellsDb, row.name);
    const types = adeptTypes(known, elements);
    r.adept.hidden = types.length === 0;
    const adeptText = types.length ? `Adepte (${types.map(elementWord).join(', ')})` : '';
    if (r.adept.textContent !== adeptText) r.adept.textContent = adeptText;
    if (types.length) r.adept.title = adeptRule(types);
    const affine = affinityApplies(known, affinity);
    r.affinity.hidden = !affine;
    const affinityText = affine ? affinity.mention : '';
    if (r.affinity.textContent !== affinityText) r.affinity.textContent = affinityText;
    if (affine) r.affinity.title = affinity.rule;
    const level = rowLevel(row);
    const what = entry ? 'nouveau sort' : name ? `« ${name} »` : `ligne ${line}`;
    r.state = entry ? null : state;
    r.prepNote = entry ? '' : prepNote;
    r.ritual.hidden = entry || state !== 'ritual';
    r.noSlot.hidden = entry || !noSlot;
    if (noSlot) {
        const text = missingSlotText(noSlot);
        if (r.noSlot.title !== text) r.noSlot.title = text;
    }
    const always = FIXED_STATES.has(state);
    const prepared = state === 'prepared' || always;
    const cantrip = level === '0';

    r.tr.classList.toggle('spell-entry', entry);
    // Ligne de saisie seulement : choix « — » (pas de niveau) en tête du menu
    const blank = r.lvl.options[0]?.value === '';
    if (entry && !blank) r.lvl.prepend(el('option', { value: '', text: '—' }));
    if (!entry && blank) r.lvl.options[0].remove();
    r.lvl.value = entry ? (g.entryLevel ?? g.view.level) : level;
    // ▾ : ligne de saisie et lignes au nom vide, fiche modifiable
    r.pick.hidden = locked || !(entry || name === '');
    // Valeurs affichées telles qu'enregistrées (seul le HTML v3 est nettoyé) : rien n'est perdu
    setValue(r.name, cellText(row.name), force);
    for (const [key] of TEXT_COLUMNS) setValue(r.texts[key], cellText(row[key]), force);
    setValue(r.note, cellText(row.note), force);
    for (const [key] of FLAG_COLUMNS) r.flags[key].checked = row[key] === true;
    r.name.placeholder = entry ? 'Nouveau sort…' : 'Nom…';

    writePrep(r, { entry, cantrip, always, prepared, state, wholeList, what, note: prepNote });

    r.lvl.setAttribute('aria-label', entry ? 'Niveau du nouveau sort' : `Niveau du sort, ligne ${line}`);
    r.name.setAttribute('aria-label', entry ? 'Nom du nouveau sort' : `Nom du sort, ligne ${line}`);
    for (const [key, label] of TEXT_COLUMNS) r.texts[key].setAttribute('aria-label', `${label}, ${what}`);
    r.note.setAttribute('aria-label', `Notes, ${what}`);
    for (const [key, , title] of FLAG_COLUMNS) r.flags[key].setAttribute('aria-label', `${title}, ${what}`);
    r.del.setAttribute('aria-label', `Supprimer le sort ${what}`);
    r.cast.hidden = entry || !isCastable(state);
    r.cast.setAttribute('aria-label', `Lancer le sort ${what}`);
    r.del.disabled = entry;
    applyRowLock(r, locked);
    // Fiche verrouillée : pas de liste des sorts (on ne peut pas éditer)
    if (locked) r.detach.hide();
}
