// =============================================================================
// SPELLS.JS - Grimoire (sorts, filtres, tri, auto-complétion, emplacements, infobulles)
//
// Tout est construit dans <section id="spells-feature"> (onglet Magie).
//  - Les sorts sont lus dans character.dynamic_spells (clés v3 : lvl, name, time,
//    range, note, c, r, m, prep, school) et chaque modification passe par store.update.
//  - Le filtre de niveau et le tri ne changent que l'affichage : l'ordre enregistré
//    du tableau n'est jamais modifié.
//  - Les emplacements de sorts cochés et le losange « préparé » sont des contrôles de JEU
//    (utilisables verrouillé : PHB 2024, la liste des sorts préparés du Clerc, du Druide et du
//    Magicien change à chaque repos long) ; les boutons + / − du nombre d'emplacements sont
//    réservés à l'édition. Barde, Ensorceleur, Occultiste (liste fixe) et sorts donnés par la
//    classe, la sous-classe, un don ou l'espèce : losange plein fixe « toujours préparé », calculé
//    à l'affichage (js/rules/spell-preparation.js), jamais écrit dans la fiche.
//  - Fenêtre « Préparer mes sorts » (bouton de la barre, Clerc, Druide, Paladin, Rôdeur ;
//    spells/prepare.js) : cases à cocher sur toute la liste de la classe, utilisable verrouillé.
//  - Vue « au combat » (bouton de la barre, retenu sur l'appareil) : seulement les sorts mineurs,
//    les sorts préparés (même d'office) et les blocs de sorts donnés, les emplacements restants en
//    clair et un bouton « Lancer » qui coche un emplacement (et propose la Concentration) ; un
//    sort qui a un lancer gratuit suivi par la fiche (don, espèce, Ennemi juré du Rôdeur, sorts de
//    classe du Paladin et de l'Occultiste, Arcanum mystique, quelques sous-classes :
//    js/rules/free-casts.js) propose d'abord « Lancer gratuit », qui coche la case de la capacité
//    au lieu d'un emplacement.
//    Sur écran seulement : l'impression garde tout le grimoire.
//  - Sort préparé d'un niveau sans emplacement : repère « Pas d'emplacement » sous son nom (simple
//    avertissement, js/rules/spell-preparation.js : missingSlotLevel), expliqué au toucher.
//  - Bouton « Retirer les sorts non préparés » sous le tableau (Clerc, Druide, Paladin, Rôdeur,
//    fiche déverrouillée, seulement s'il y a quelque chose à retirer : spells/cleanup.js).
//  - Seuls les sorts renseignés sont affichés, suivis d'UNE ligne de saisie : les lignes
//    vides d'une sauvegarde restent dans la fiche, telles quelles, sans être affichées.
//    La ligne de saisie n'existe pas dans la fiche : la première saisie qui a du contenu
//    (texte, case C / R / M) y crée le sort (à la fin de dynamic_spells), et une nouvelle
//    ligne de saisie apparaît dessous. Choisir seulement un niveau n'ajoute rien ; un sort
//    ainsi créé puis vidé avant de quitter la ligne est retiré (voir settleDraft).
//  - Sorts de dons (lot 6, js/rules/feat-spells.js) : bloc « Sorts de dons » au-dessus du
//    tableau, calculé d'après les dons et leurs choix (onglet Aptitudes & Traits). Il n'est
//    jamais écrit dans dynamic_spells : on ne peut pas l'effacer par erreur, et la liste du
//    joueur reste telle qu'il l'a saisie. Chaque groupe donne le DD et l'attaque de la
//    caractéristique du don ; les cases « lancer gratuit » sont des contrôles de JEU
//    (utilisables verrouillé), vidées au repos long.
//  - Sorts de sous-classe (js/rules/subclass-features.js, données js/data/subclass-spells.js) :
//    bloc « Sorts de sous-classe » juste après, sur le même modèle (serments du Paladin…), jamais
//    écrit dans dynamic_spells ; un sort que le joueur a aussi noté dans sa liste porte un repère.
//  - Sorts de classe (js/rules/class-progression.js : classGrantedSpells) : bloc « Sorts de
//    classe » avant celui des dons (Châtiment divin, Marque du chasseur, Contact avec les plans…),
//    avec la case de leur lancer sans emplacement et celles de l'Arcanum mystique.
//  - Magicien (js/rules/spellbook.js) : ligne « Livre : N sorts » sous la barre (sorts du livre
//    notés comparés aux sorts obtenus sans dépense, simple repère) et rappel du coût de copie ;
//    un sort rituel du livre non préparé porte le repère « Lançable en rituel » (Savoir rituel). Dans
//    la vue au combat, ces rituels quittent le tableau pour une ligne repliable « Rituels du livre
//    (N) » dessous, repliée par défaut (choix retenu sur l'appareil) ; dépliés, chacun garde son
//    bouton « Lancer », en rituel seulement. Écran seulement : l'impression ne change pas.
//  - Personnage sans magie (classe, sous-classe et niveau), sans aucun sort noté ni sort de
//    don ni de sous-classe : le grimoire et les cases « Caractéristique d'incantation / DD / Bonus d'attaque » se
//    replient en un court avis, avec un bouton pour l'ouvrir (sorts d'espèce...).
//    Le choix ouvert / replié est mémorisé dans ce navigateur, hors de la fiche. Pour un
//    personnage sans magie de classe, les cases d'incantation passent après le grimoire.
// Les règles (recherche, conversion, compteurs, emplacements) sont dans js/rules/spells.js.
//
// Ce fichier est le chef d'orchestre : il crée le contexte partagé, assemble les morceaux,
// décide quelles lignes afficher (renderRows) et tient les abonnements. Les morceaux sont dans
// js/ui/spells/ et ceux du tableau reçoivent le même contexte en premier argument (context.js) :
//  - context.js : l'état partagé (filtre, tri, base de sorts, lignes, saisie en cours) ;
//  - table.js : en-tête et tri, rangement des lignes, message « aucun sort », bouton Ajouter ;
//  - rows.js : une ligne du tableau (construction, écriture, verrou, infobulle) ;
//  - entry.js : modification d'une ligne, ligne de saisie et brouillon (editRow, settleDraft…) ;
//  - picker.js : liste des sorts d'une ligne (suggestions, bouton ▾) ;
//  - cast.js : fenêtre « Lancer » ; book.js : livre du Magicien (ligne « Livre », rituels) ;
//  - notice.js : grimoire replié d'un personnage sans magie ;
//  - et, comme avant : barre de filtres (filters.js), emplacements de sorts (slots.js), sorts de
//    classe, de dons, de sous-classe et d'espèce (granted.js), infobulle (tooltip.js), fenêtre « Préparer
//    mes sorts » (prepare.js), bouton « Retirer les sorts non préparés » (cleanup.js), réglages
//    de l'appareil (prefs.js).
// =============================================================================

import { EMPTY_SPELL, FEAT_SLOT_ORDER } from '../state/schema.js';
import { ABILITY_IDS } from '../data/constants.js';
import { loadSpells } from '../data/spells.js';
import {
    plainText, spellNames, findSpellByName, isSpellRowEmpty, hasSpellContent, spellRowsView, spellCounts,
    formatSpellCount, spellLimitWarnings, cantripLimitNote, spellNameKey, newSpellRow
} from '../rules/spells.js';
import { adeptElements } from '../rules/feat-choices.js';
import { classSpellCounts } from '../rules/class-progression.js';
import {
    wholeListSource, fitsWholeList, grantedSpellKeys, spellPrepState, combatPlace,
    highestUsableSlot, mysticArcanumLevel, missingSlotLevel
} from '../rules/spell-preparation.js';
import { castsRitualsFromBook, isRitualSpell } from '../rules/spellbook.js';
import { allFreeCasts } from '../rules/free-casts.js';
import { chosenSpellKeys } from '../rules/spell-choices.js';
import { elementalAffinity } from '../rules/subclass-combat.js';
import { derivedOf } from './derived.js';
import { el, icon } from './dom.js';
import { confirmModal } from './modal.js';
import { isLocked } from './lock.js';
import { createGrimoireContext } from './spells/context.js';
import { createSpellFilters } from './spells/filters.js';
import { createSpellSlots, slotStateOf } from './spells/slots.js';
import { createGrantedSpells } from './spells/granted.js';
import { createPrepareButton } from './spells/prepare.js';
import { createCleanupButton } from './spells/cleanup.js';
import { createSpellTable } from './spells/table.js';
import { createRow, writeRow } from './spells/rows.js';
import { syncClearButtons } from './spells/entry.js';
import { castSpell, castRowAt } from './spells/cast.js';
import { createSpellbook } from './spells/book.js';
import { createGrimoireNotice, hasGivenSpells } from './spells/notice.js';

// Dons et leurs choix : repère « Adepte » (Adepte élémentaire) sur les sorts du type choisi
// Sorts de dons : leurs choix, leurs lancers gratuits (feat_uses) et la caractéristique du DD
const RELEVANT_KEYS = new Set(['dynamic_spells', 'spell_slots_state', 'spell_class_filter', 'char_class', 'char_subclass', 'char_level',
    'feat_choices', 'feat_uses', 'char_species', 'subclass_choices', 'species_choices', 'subclass_uses', ...FEAT_SLOT_ORDER.map(level => `feat_${level}`), ...ABILITY_IDS.map(id => `${id}_score`)]);

/** Vue « au combat » : ce que fait le bouton, dit dans la barre du haut à chaque bascule (tablette) */
const COMBAT_VIEW_HELP = {
    on: "Au combat : seulement vos sorts prêts à lancer ; « Lancer » coche l'emplacement dépensé.",
    off: 'Grimoire complet : tous vos sorts, pour en ajouter ou en modifier.'
};

/**
 * Morceaux assemblés du grimoire, passés aux fonctions d'affichage de ce fichier.
 * @typedef {Object} GrimoireParts
 * @property {HTMLElement} container - <section id="spells-feature">
 * @property {HTMLElement} body - le grimoire lui-même (barre, emplacements, tableau…)
 * @property {Object} filters - barre de filtres (spells/filters.js) ; countOut : compteur de sorts
 * @property {HTMLElement} limitNote - dépassement de la table de la classe, en toutes lettres
 * @property {Object} table - cadre du tableau (spells/table.js)
 * @property {Object} book - livre du Magicien (spells/book.js)
 * @property {Object} notice - grimoire replié (spells/notice.js) ; toggleBtn : bouton qui le rouvre
 * @property {{ onCast: Function, onDelete: Function }} rowActions - boutons « Lancer » et
 *   Supprimer d'une ligne (spells/rows.js : createRow)
 */

/**
 * État « préparé » de chaque ligne de la fiche (losange, bouton « Lancer ») et avertissement
 * « Pas d'emplacement ».
 * @param {import('./spells/context.js').Grimoire} g
 * @param {Object} character
 * @param {Object} derivedNow - valeurs calculées (derivedOf)
 * @param {Object[]} rows - dynamic_spells
 * @returns {{ granted: Set<string>, wholeList: boolean, fits: (row: Object) => boolean, states: string[], noSlots: number[] }}
 */
function rowStates(g, character, derivedNow, rows) {
    // Losange : liste fixe (Barde, Ensorceleur, Occultiste) et sorts donnés, toujours préparés ;
    // un sort noté hors de la liste fixe (Arcanum mystique…) garde son losange à cocher. Les sorts
    // choisis d'une capacité (Maîtrise des sorts, Sorts de prédilection, Découvertes magiques) sont
    // des sorts donnés : la base de sorts relie leur nom enregistré (anglais) au nom de la ligne
    const granted = grantedSpellKeys(character, derivedNow, g.spellsDb);
    const source = wholeListSource(derivedNow);
    const wholeList = source !== null;
    const fits = (row) => fitsWholeList(row, source, findSpellByName(g.spellsDb, row.name));
    // Magicien (Savoir rituel) : un sort rituel du livre non préparé se lance quand même en rituel
    const bookRitual = castsRitualsFromBook(derivedNow.classSlug)
        ? (row) => isRitualSpell(row, findSpellByName(g.spellsDb, row.name))
        : null;
    const states = rows.map(row => spellPrepState(row, { wholeList, granted, fits, bookRitual }));

    // Sort préparé au-dessus des emplacements : simple avertissement (jamais pour un sort qui a
    // son lancer gratuit, ni pour un Arcanum mystique)
    const topSlot = highestUsableSlot(derivedNow.spellSlots, derivedNow.classSlug, slotStateOf(character));
    const arcanumLevel = mysticArcanumLevel(derivedNow.classSlug, derivedNow.level);
    let freeNames = null;
    const hasFreeCast = (row) => {
        freeNames ??= new Set(allFreeCasts(character, derivedNow).flatMap(cast => cast.names));
        if (!freeNames.size) return false;
        const known = findSpellByName(g.spellsDb, row.name);
        return [row.name, ...spellNames(known), known?.vo].some(name => name && freeNames.has(spellNameKey(name)));
    };
    const noSlots = rows.map((row, i) => (missingSlotLevel(row, states[i], { topSlot, arcanumLevel })
        ? missingSlotLevel(row, states[i], { topSlot, arcanumLevel, freeCast: hasFreeCast(row) }) : 0));
    return { granted, wholeList, fits, states, noSlots };
}

/**
 * Affiche les lignes du tableau : une par sort de la fiche plus la ligne de saisie, filtre de
 * niveau, tri et vue « au combat » appliqués, puis le message sous le tableau et les compteurs.
 * @param {import('./spells/context.js').Grimoire} g
 * @param {GrimoireParts} ui
 * @param {Object} character
 * @param {boolean} force - fiche remplacée : même le champ qui a le focus est réécrit
 * @param {boolean} structural - les lignes sont rangées (filtre, tri) même si leur nombre n'a pas changé
 */
function renderRows(g, ui, character, force, structural) {
    const { view, rowEls } = g;
    const { table, book } = ui;
    const rows = Array.isArray(character.dynamic_spells) ? character.dynamic_spells : [];
    const locked = isLocked();
    const countChanged = rows.length + 1 !== rowEls.length;

    while (rowEls.length < rows.length + 1) rowEls.push(createRow(g, ui.rowActions));
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
    const elements = adeptElements(character);
    const derivedNow = derivedOf(character);
    const affinity = elementalAffinity(derivedNow);
    const { granted, wholeList, fits, states, noSlots } = rowStates(g, character, derivedNow, rows);

    // Vue « au combat » : les sorts de niveau 1+ non préparés se retirent de l'écran (classe
    // CSS, l'impression garde tout) ; pas la ligne en cours de saisie, qui ne disparaît pas
    // sous les doigts (son losange vient d'être décoché, par exemple)
    // Les rituels du livre non préparés (Magicien) vont sous la ligne repliable « Rituels du livre »
    const outOfCombat = (i) => view.combat && combatPlace(states[i]) !== 'table' && !pinned.includes(i);
    book.renderRituals(view.combat
        ? order.filter(i => shown.has(i) && combatPlace(states[i]) === 'rituals' && !pinned.includes(i)).map(i => ({ index: i, row: rows[i] }))
        : []);

    rowEls.forEach((r, i) => {
        const isEntry = r === entry;
        writeRow(g, r, isEntry ? newSpellRow(EMPTY_SPELL, g.entryLevel ?? view.level) : rows[i], {
            force, locked, entry: isEntry, line: isEntry ? lines.size + 1 : lines.get(i) ?? i + 1, elements, affinity,
            state: isEntry ? null : states[i], wholeList, noSlot: isEntry ? 0 : noSlots[i]
        });
        if (!isEntry) {
            r.tr.hidden = !shown.has(i);
            r.tr.classList.toggle('is-out-of-combat', outOfCombat(i));
        }
    });
    // Une seule ligne vide à l'écran : la ligne de saisie s'efface pendant qu'une ligne
    // vidée est encore en cours de saisie ; aucune saisie possible verrouillé, ni au combat
    entry.tr.hidden = locked || hasDraft || view.combat;
    ui.body.classList.toggle('is-combat', view.combat);
    syncClearButtons(g);

    const trs = [...order.map(i => rowEls[i].tr), entry.tr];
    if (force || structural || (countChanged && !g.creatingFromEntry)) {
        table.placeRows(trs);
    } else if (countChanged) {
        // Sort créé depuis la ligne de saisie : il reste où il est pendant la frappe (le tri
        // est réappliqué quand le focus quitte la ligne), la nouvelle ligne de saisie va dessous
        table.tbody.append(...trs.filter(tr => tr.parentNode !== table.tbody));
    }

    const counts = spellCounts(rows, view.level, granted, (row) => wholeList && fits(row));
    const anySpell = rows.some(hasSpellContent);
    const anyShown = [...shown].some(i => !outOfCombat(i));
    // Sorts affichés, mais tous retirés par la vue au combat
    const combatEmpty = !anyShown && shown.size > 0;
    ui.container.toggleAttribute('data-no-spells', !anySpell);
    // Vue au combat sans aucun sort à lancer : tableau retiré de l'écran seulement (classe CSS),
    // l'impression garde tout le grimoire
    table.tableScroll.hidden = shown.size === 0 && entry.tr.hidden;
    table.tableScroll.classList.toggle('is-combat-empty', combatEmpty);
    table.renderEmpty({ anySpell, anyShown, combatEmpty, locked, hasGivenSpells: () => hasGivenSpells(character, derivedNow) });
    renderCounts(g, ui, counts, derivedNow);
    // Maîtrise des sorts, Sorts de prédilection : toujours préparés, mais toujours dans le livre
    book.renderNote(rows, derivedNow, granted, chosenSpellKeys(character, derivedNow, g.spellsDb, { from: 'book' }));
}

/**
 * Table de la classe : « Préparés : 7 / 9 », en rouge au-delà ; sorts mineurs en trop :
 * simple rappel (une espèce ou un don en donne d'autres). Les sorts donnés par la classe,
 * la sous-classe ou un don ne comptent pas, même notés au grimoire.
 * @param {import('./spells/context.js').Grimoire} g
 * @param {GrimoireParts} ui
 * @param {Object} counts - compteurs de sorts (js/rules/spells.js : spellCounts)
 * @param {Object} derivedNow - valeurs calculées (derivedOf)
 */
function renderCounts(g, ui, counts, derivedNow) {
    const { countOut } = ui.filters;
    const limits = derivedNow.classSlug ? classSpellCounts(derivedNow.classSlug, derivedNow.level) : null;
    const warnings = spellLimitWarnings(counts, limits);
    const note = cantripLimitNote(counts, limits);
    countOut.textContent = formatSpellCount(counts, g.view.level !== '', limits);
    countOut.classList.toggle('is-over', warnings.length > 0);
    countOut.title = [...warnings, note].filter(Boolean).join(' ');
    ui.limitNote.replaceChildren(
        ...warnings.map((text) => el('span', { text: `${text} ` })),
        ...(note ? [el('span', { class: 'is-info', text: note })] : [])
    );
    ui.limitNote.hidden = !ui.limitNote.textContent;
}

/**
 * Bouton Supprimer d'une ligne : confirmation (sauf ligne vide), puis le focus va à la ligne
 * qui prend sa place.
 * @param {import('./spells/context.js').Grimoire} g
 * @param {GrimoireParts} ui
 * @param {Object} r - éléments de la ligne
 */
async function deleteRow(g, ui, r) {
    const index = r.index;
    const row = g.spellsOf()[index];
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
    const list = g.spellsOf();
    if (list[index] !== row) return; // la fiche a changé entre-temps
    g.tooltip.hide();
    // Rang de la ligne dans le tableau affiché : le focus ira à celle qui prend sa place
    const shownRows = () => [...ui.table.tbody.children].filter(tr => !tr.hidden);
    const rank = Math.max(0, shownRows().indexOf(r.tr));
    // Le focus quitte d'abord le bouton Supprimer : les éléments des lignes sont réutilisés
    // par indice, ce bouton va montrer la ligne suivante de la fiche, peut-être une ligne
    // vide non affichée, qui resterait sinon à l'écran comme « en cours de saisie »
    r.del.blur();
    if (g.draft?.index === index) g.draft = null;
    g.store.update({ dynamic_spells: list.filter((_, i) => i !== index) });
    // Focus sur la ligne affichée à la même place (bouton Supprimer, ou nom de la ligne de
    // saisie), sinon sur le bouton qui rouvre le grimoire s'il vient de se replier
    const shown = shownRows();
    const tr = shown[Math.min(rank, shown.length - 1)];
    const next = tr ? g.rowEls.find(item => item.tr === tr) : null;
    const target = ui.body.hidden ? ui.notice.toggleBtn
        : next ? (next.tr.classList.contains('spell-entry') ? next.name : next.del) : ui.table.addBtn;
    target.focus();
}

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initSpells(ctx) {
    const { root, store, setStatus } = ctx;
    const container = root.querySelector('#spells-feature');
    if (!container) return;

    // Contexte partagé par les morceaux du grimoire (spells/context.js)
    const g = createGrimoireContext({ store, setStatus });
    const { view, tooltip } = g;

    // Bouton « Préparer mes sorts » (spells/prepare.js), affiché pour les classes concernées
    const prepare = createPrepareButton({ store, setStatus });

    // Barre de filtres (spells/filters.js)
    const filters = createSpellFilters({
        store, view, tooltip, actions: [prepare.button],
        onLevel: () => {
            g.entryLevel = null; // la ligne de saisie reprend le niveau du filtre
            tooltip.hide();
            g.redraw();
        },
        onCombat: () => {
            g.redraw();
            setStatus(view.combat ? COMBAT_VIEW_HELP.on : COMBAT_VIEW_HELP.off);
        }
    });

    // Dépassement de la table de la classe (sorts préparés, sorts mineurs) : dit en toutes lettres
    const limitNote = el('p', { class: 'spell-limit-note', role: 'status', hidden: true });
    // Magicien : ligne « Livre : N sorts » et ligne repliable « Rituels du livre » (spells/book.js)
    const book = createSpellbook(g);
    // Emplacements de sorts (spells/slots.js)
    const slots = createSpellSlots({ store, view });
    // Tableau : en-tête, message « aucun sort », bouton « Ajouter un sort » (spells/table.js)
    const table = createSpellTable(g);

    // Bouton « Retirer les sorts non préparés » (spells/cleanup.js) ; les lignes en cours de saisie
    // (sort tout juste créé, ligne qui a le focus) ne sont jamais proposées
    const cleanup = createCleanupButton({
        store, setStatus, keepSnapshot: ctx.keepSnapshot, getSpellsDb: () => g.spellsDb,
        getSkip: () => [g.draft?.index, ...g.rowEls.filter(r => r.tr.contains(document.activeElement)).map(r => r.index)]
            .filter(Number.isInteger)
    });

    // Sorts de classe, de dons, de sous-classe et d'espèce (spells/granted.js), au-dessus du tableau ;
    // leur bouton « Lancer » ouvre la même fenêtre que celui du tableau (spells/cast.js)
    const granted = createGrantedSpells({ store, tooltip, getSpellsDb: () => g.spellsDb, onCast: (spell) => castSpell(g, spell) });

    // -----------------------------------------------------------------------
    // Assemblage
    // -----------------------------------------------------------------------

    const body = el('div', { class: 'spells-body', id: 'spells-body' },
        filters.toolbar,
        limitNote,
        book.note,
        slots.element,
        granted.classBox,
        granted.featBox,
        granted.subclassBox,
        granted.speciesBox,
        table.tableScroll,
        table.emptyText,
        book.rituals,
        table.addBtn,
        cleanup.button);

    // Personnage sans magie : court avis, grimoire ouvert à la demande (spells/notice.js)
    const notice = createGrimoireNotice(g, { root, container, body });

    // Ordre de lecture : titre, avis (replié), bouton ouvrir / replier, grimoire. Le bouton ne
    // change jamais de place dans la page (il garde donc le focus) : la grille de spells.css
    // le pose à droite du titre, grimoire replié comme ouvert (il ne bouge pas à l'écran non plus).
    container.replaceChildren(
        // Icône dorée devant le titre, comme les titres de index.html (data-icon, ornaments.js)
        el('h3', { 'data-icon': 'book' }, icon('book'), 'Sorts mineurs & sorts préparés'),
        notice.notice,
        notice.toggleBtn,
        body);

    /** @type {GrimoireParts} */
    const ui = {
        container, body, filters, limitNote, table, book, notice,
        rowActions: {
            // Bouton « Lancer » d'une ligne (vue au combat) : fenêtre de spells/cast.js
            onCast: (r) => castRowAt(g, r.index, r.state),
            onDelete: (r) => deleteRow(g, ui, r)
        }
    };

    function render(character, changedKeys, { structural = false } = {}) {
        if (changedKeys && !changedKeys.some(key => RELEVANT_KEYS.has(key))) return;
        const d = derivedOf(character);
        filters.renderClassFilter(character, d);
        prepare.render(d);
        table.renderHeader();
        filters.renderChips();
        renderRows(g, ui, character, changedKeys === null && !structural, structural);
        slots.render(character, d);
        cleanup.render(character, d);
        granted.render(character, d);
        notice.render(character, d);
    }
    // Filtre, tri, vue au combat, ligne quittée… : tout est réaffiché, lignes rangées
    g.redraw = () => render(store.get(), null, { structural: true });

    // -----------------------------------------------------------------------
    // Abonnements
    // -----------------------------------------------------------------------

    store.subscribe((character, changedKeys) => {
        // Fiche remplacée (chargement, import) : la saisie en cours ne la concerne plus
        if (!changedKeys) {
            g.draft = null;
            g.entryLevel = null;
        }
        render(character, changedKeys);
    });
    document.addEventListener('dd:lockchange', () => render(store.get(), ['dynamic_spells']));
    render(store.get(), null);

    loadSpells().then((list) => {
        g.spellsDb = Array.isArray(list) ? list : [];
        if (g.spellsDb.length === 0) setStatus('⚠️ Base de sorts indisponible : pas de suggestions ni d\'infobulles');
        // Base chargée : les repères « Adepte » et « +Cha » (Affinité élémentaire) peuvent maintenant
        // s'afficher, et les sorts hors de la liste fixe d'un Barde, Ensorceleur ou Occultiste se repérer
        else render(store.get(), ['dynamic_spells']);
    });
}
