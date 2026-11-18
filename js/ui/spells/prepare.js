// =============================================================================
// SPELLS/PREPARE.JS - Fenêtre « Préparer mes sorts » (Clerc, Druide, Paladin, Rôdeur)
//
// Ces classes choisissent leurs sorts préparés parmi toute leur liste de classe et les changent
// après un repos long (js/rules/spell-preparation.js, preparesFromClassList). La fenêtre montre
// les sorts de cette liste (data/spells.json), du niveau 1 au plus haut emplacement, une case par
// sort, une recherche par nom et le compteur « Préparés : x / y » du grimoire.
//  - Cocher : la ligne du grimoire passe à « préparé » (clé v3 prep), ou le sort y est ajouté,
//    rempli comme par l'auto-complétion.
//  - Décocher : la ligne reste au grimoire, non préparée. Seule exception : une ligne que la
//    fenêtre vient d'ajouter (même ouverture), restée telle quelle, est retirée (simple retour en
//    arrière). Une ligne écrite ou annotée par le joueur n'est jamais retirée.
//  - Sorts toujours préparés (domaine, cercle, serment, classe, don, espèce) : repère fixe, hors du
//    compte. Autres sorts préparés du grimoire (autre liste, niveau sans emplacement) : en fin de
//    liste, décochables (losange seulement).
// Geste de JEU (après un repos long) : utilisable fiche verrouillée, comme le losange.
// Ouverte par le bouton de la barre du grimoire et par le rappel de fin de repos long (rest.js).
// =============================================================================

import { EMPTY_SPELL } from '../../state/schema.js';
import { loadSpells } from '../../data/spells.js';
import { derivedOf } from '../derived.js';
import { el, icon } from '../dom.js';
import { openModal } from '../modal.js';
import { SPELL_CLASS_OPTIONS, spellCounts, spellLimitWarnings, plainText } from '../../rules/spells.js';
import { classSpellCounts } from '../../rules/class-progression.js';
import {
    SPELL_PREPARATION, preparesFromClassList, highestSlotLevel, grantedSpellKeys, preparationView,
    prepareSpellRows, unprepareSpellRows, setRowPrepared, matchesSpellQuery
} from '../../rules/spell-preparation.js';

/**
 * La fenêtre s'applique-t-elle à ce personnage (classe qui prépare parmi toute sa liste, et qui a
 * des emplacements) ?
 * @param {Object} d - deriveCharacter()
 * @returns {boolean}
 */
export function canPrepareSpells(d) {
    return preparesFromClassList(d?.classSlug) && highestSlotLevel(d?.spellSlots) > 0;
}

const rowsOf = (character) => (Array.isArray(character?.dynamic_spells) ? character.dynamic_spells : []);

/** « Clerc », « Druide »… (libellés du filtre de liste du grimoire) */
const classLabel = (slug) => SPELL_CLASS_OPTIONS.find(([value]) => value === slug)?.[1] ?? '';

const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

/** Règle de changement, en une phrase (PHB 2024, chap. 7) */
function ruleText(slug, maxLevel) {
    const levels = maxLevel > 1 ? `des niveaux 1 à ${maxLevel}` : 'du niveau 1';
    const change = SPELL_PREPARATION[slug]?.count === 'one'
        ? 'Après chaque repos long, vous pouvez remplacer un seul de vos sorts préparés ; en gagnant un niveau, complétez la liste jusqu\'au nombre de la table.'
        : 'Après chaque repos long, vous pouvez changer autant de sorts préparés que vous voulez.';
    return `${change} Seulement des sorts ${levels} (vos emplacements).`;
}

/**
 * Ouvre la fenêtre (rien si le personnage n'est pas concerné).
 * @param {{ store: Object, setStatus: (message: string) => void }} ctx
 */
export async function openPrepareSpells({ store, setStatus }) {
    const db = await loadSpells();
    if (!Array.isArray(db) || db.length === 0) {
        setStatus('⚠️ Base de sorts indisponible : la liste de votre classe ne peut pas s\'afficher.');
        return;
    }
    const start = derivedOf(store.get());
    if (!canPrepareSpells(start)) return;
    const classSlug = start.classSlug;
    const label = classLabel(classSlug);

    // Ligne ajoutée par cette fenêtre pour un sort (sort de la base → ligne), pendant cette ouverture
    const added = new Map();
    // Autres sorts préparés au moment de l'ouverture : ils restent affichés une fois décochés
    // (pour pouvoir les recocher) ; même indice et même nom, sinon la case se désactive
    let others = [];

    const viewOf = (character) => {
        const d = derivedOf(character);
        const granted = grantedSpellKeys(character, d);
        return { d, granted, view: preparationView(rowsOf(character), db, { classSlug, maxLevel: highestSlotLevel(d.spellSlots), granted }) };
    };

    // --- Contrôles ---
    const search = el('input', {
        type: 'search', class: 'input prep-search', placeholder: 'Chercher un sort…', autocomplete: 'off',
        spellcheck: 'false', 'aria-label': 'Chercher un sort par son nom'
    });
    const counter = el('output', { class: 'prep-count', 'aria-live': 'polite' });
    const listBox = el('div', { class: 'prep-list' });
    const noMatch = el('p', { class: 'prep-empty muted', hidden: true, text: 'Aucun sort ne correspond.' });

    /** Une case par sort de la liste : { spell, item, box } */
    const entries = [];
    const sections = [];

    function toggleSpell(spell, checked) {
        const rows = rowsOf(store.get());
        if (checked) {
            const result = prepareSpellRows(rows, spell, db, EMPTY_SPELL);
            if (result.added) added.set(spell, result.added);
            store.update({ dynamic_spells: result.rows });
        } else {
            store.update({ dynamic_spells: unprepareSpellRows(rows, spell, db, added.get(spell) ?? null) });
            added.delete(spell);
        }
    }

    function buildList(view) {
        const groups = view.groups.map((group) => {
            const items = group.items.map((item) => {
                const { spell } = item;
                const tags = [spell.concentration ? ['C', 'Concentration'] : null, spell.ritual ? ['R', 'Rituel'] : null]
                    .filter(Boolean)
                    .map(([letter, title]) => el('abbr', { class: 'prep-tag', title, text: letter }));
                let box = null;
                let li;
                // Nom puis repères C / R, sur la même ligne (le nom passe à la ligne s'il est long)
                const text = el('span', { class: 'prep-text' }, el('span', { class: 'prep-name', text: item.name }), ...tags);
                if (item.state === 'granted') {
                    text.append(el('small', { class: 'prep-note', text: 'toujours préparé, hors du compte' }));
                    li = el('li', { class: 'prep-item is-always', title: 'Toujours préparé : donné par votre classe, votre sous-classe, un don ou votre espèce. Il ne compte pas dans vos sorts préparés.' },
                        el('span', { class: 'prep-mark', 'aria-hidden': 'true', text: '◆' }), text);
                } else {
                    box = el('input', {
                        type: 'checkbox', class: 'round-check',
                        on: { change: (event) => toggleSpell(spell, event.target.checked) }
                    });
                    li = el('li', { class: 'prep-item' }, el('label', { class: 'prep-label' }, box, text));
                }
                entries.push({ spell, li, box });
                return li;
            });
            const section = el('section', { class: 'prep-group', 'aria-label': `Sorts de niveau ${group.level}` },
                el('h3', { class: 'prep-level', text: `Niveau ${group.level}` }),
                el('ul', { class: 'prep-items' }, items));
            sections.push(section);
            return section;
        });

        others = view.others.map((other) => {
            const box = el('input', {
                type: 'checkbox', class: 'round-check',
                on: {
                    change: (event) => {
                        const rows = rowsOf(store.get());
                        if (plainText(rows[other.index]?.name).trim() !== other.name) return;
                        store.update({ dynamic_spells: setRowPrepared(rows, other.index, event.target.checked) });
                    }
                }
            });
            const why = other.level > highestSlotLevel(start.spellSlots) ? `niveau ${other.level}, sans emplacement` : `niveau ${other.level}, hors de la liste ${label ? `du ${label}` : 'de classe'}`;
            const li = el('li', { class: 'prep-item' },
                el('label', { class: 'prep-label' }, box,
                    el('span', { class: 'prep-text' }, el('span', { class: 'prep-name', text: other.name || 'Sort sans nom' }),
                        el('small', { class: 'prep-note', text: why }))));
            return { ...other, box, li };
        });
        const othersSection = others.length
            ? el('section', { class: 'prep-group prep-others', 'aria-label': 'Autres sorts préparés de votre grimoire' },
                el('h3', { class: 'prep-level', text: 'Autres sorts préparés de votre grimoire' }),
                el('ul', { class: 'prep-items' }, others.map(other => other.li)))
            : null;
        listBox.replaceChildren(...groups, ...(othersSection ? [othersSection] : []));
    }

    /** Cases cochées et compteur, d'après la fiche (après chaque changement, ici ou ailleurs) */
    function refresh(character) {
        const { d, granted, view } = viewOf(character);
        const states = new Map(view.groups.flatMap(group => group.items).map(item => [item.spell, item.state]));
        for (const { spell, box } of entries) {
            if (box) box.checked = states.get(spell) === 'prepared';
        }
        const rows = rowsOf(character);
        for (const other of others) {
            const row = rows[other.index];
            const same = plainText(row?.name).trim() === other.name;
            other.box.disabled = !same;
            other.box.checked = same && row.prep === true;
        }
        const counts = spellCounts(rows, '', granted);
        const limits = classSpellCounts(d.classSlug, d.level);
        const warnings = spellLimitWarnings(counts, limits);
        counter.textContent = limits.prepared != null ? `Préparés : ${counts.prepared} / ${limits.prepared}` : `Préparés : ${counts.prepared}`;
        counter.classList.toggle('is-over', warnings.length > 0);
        counter.title = warnings.join(' ');
    }

    function applySearch() {
        const query = search.value;
        let any = false;
        for (const { spell, li } of entries) {
            const shown = matchesSpellQuery(spell, query);
            li.hidden = !shown;
            any ||= shown;
        }
        for (const other of others) {
            const shown = !query.trim() || matchesSpellQuery({ name: other.name }, query);
            other.li.hidden = !shown;
            any ||= shown;
        }
        for (const section of listBox.children) {
            section.hidden = ![...section.querySelectorAll('.prep-item')].some(li => !li.hidden);
        }
        noMatch.hidden = any;
    }
    search.addEventListener('input', applySearch);

    buildList(viewOf(store.get()).view);
    refresh(store.get());

    const rule = ruleText(classSlug, highestSlotLevel(start.spellSlots));
    let unsubscribe = () => {};
    const close = openModal({
        title: 'Préparer mes sorts',
        icon: 'book',
        wide: true,
        // Pas de clavier virtuel à l'ouverture sur tablette : le focus va au bouton Fermer
        focusField: false,
        body: [
            el('p', { class: 'prep-rule', text: label ? `${label} : ${lowerFirst(rule)}` : rule }),
            el('p', { class: 'prep-hint muted', text: 'Un sort coché absent du grimoire y est ajouté ; décoché, il y reste, non préparé. Les sorts mineurs ne se préparent pas.' }),
            el('div', { class: 'prep-controls' }, search, counter),
            listBox,
            noMatch
        ],
        actions: [{ label: 'Fermer', primary: true }],
        onClose: () => {
            unsubscribe();
            setStatus(`Sorts ${counter.textContent.toLowerCase()}`);
        }
    });
    unsubscribe = store.subscribe((character, changedKeys) => {
        // Autre fiche chargée : la fenêtre ne la concerne plus
        if (!changedKeys) close();
        else refresh(character);
    });
}

/**
 * Bouton « Préparer mes sorts » de la barre du grimoire (seulement pour les classes concernées).
 * @param {{ store: Object, setStatus: (message: string) => void }} ctx
 * @returns {{ button: HTMLButtonElement, render(d: Object): void }}
 */
export function createPrepareButton(ctx) {
    const button = el('button', {
        type: 'button', class: 'btn-chip spell-prepare-btn', hidden: true,
        title: 'Choisir vos sorts préparés dans la liste de votre classe (après un repos long)',
        on: { click: () => { openPrepareSpells(ctx); } }
    }, icon('book'), el('span', { class: 'btn-label', text: 'Préparer mes sorts' }));
    return {
        button,
        render(d) {
            button.hidden = !canPrepareSpells(d);
        }
    };
}
