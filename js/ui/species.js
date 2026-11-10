// =============================================================================
// SPECIES.JS (interface) - Bloc « Espèce » de l'encadré « Espèce & historique »
//
// Traits de l'espèce choisie en haut de la fiche (atteints, puis « À venir »), avec :
//  - le menu de l'option (lignage elfique, ascendance draconique…) et celui de la caractéristique
//    de ses sorts : réglages de création, verrouillés avec la fiche (data-build-control, lock.js) ;
//  - les repères calculés : Vision dans le noir, Vitesse, Résistances, Souffle (dés et DD).
// Les cases des traits à usages limités sont dans l'onglet Combat (subclass_uses), les sorts dans
// l'onglet Magie (bloc « Sorts d'espèce »). Règles : js/rules/species.js.
// =============================================================================

import { el, icon } from './dom.js';
import { foldButton, bindFolding, applyFolds } from './fold.js';
import { isLocked } from './lock.js';
import { deriveCharacter } from '../rules/character.js';
import { speciesView, setSpeciesChoicePatch } from '../rules/species.js';

const ABILITY_NAMES = { int: 'Intelligence', wis: 'Sagesse', cha: 'Charisme' };
const RESETS = { long: 'repos long', short: 'repos court ou long' };
const meters = (n) => `${String(n).replace('.', ',')} m`;
const fold = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** « 3 fois par repos long » (bonus de maîtrise : sa valeur actuelle) */
function usesText(uses, pb) {
    if (!uses) return '';
    const count = uses.count === 'pb' ? pb : Number(uses.count) || 1;
    return `${count} fois par ${RESETS[uses.reset] ?? uses.reset}`;
}

/** Menu de choix, présenté comme ceux des dons et des sous-classes (.feat-choice) */
function select(key, label, items, value, locked) {
    const id = `species-choice-${key}`;
    return el('div', { class: 'feat-choice' },
        el('label', { class: 'feat-choice-label', for: id, text: label }),
        el('select', { id, class: 'input', 'data-species-choice': key, 'data-build-control': 'true', disabled: locked },
            el('option', { value: '', text: '— Choisir —', selected: !value }),
            items.map(([optionValue, text]) => el('option', { value: optionValue, text, selected: optionValue === value }))));
}

function facts(view) {
    const items = [];
    if (view.darkvision) items.push(`Vision dans le noir ${meters(view.darkvision)}`);
    if (view.speed) items.push(`Vitesse ${meters(view.speed)}`);
    if (view.resistances.length) items.push(`Résistance : ${view.resistances.join(', ')}`);
    if (view.breath) {
        items.push(`Souffle ${view.breath.dice}${view.breath.type ? ` ${view.breath.type}` : ''}, DD ${view.breath.dc}`);
    }
    return items.length
        ? el('ul', { class: 'origin-facts', 'aria-label': 'Repères calculés' },
            items.map(text => el('li', { class: 'feat-tag', 'data-kind': 'calc', text })))
        : null;
}

function traitItem(view, trait, { upcoming = false, locked = false, pb = 2 } = {}) {
    const option = view.option;
    const hostsOption = option && fold(option.label) === fold(trait.name);
    const level = `Niv. ${trait.level}`;
    const uses = usesText(trait.uses, pb);
    let controls = null;
    let extra = [];
    if (hostsOption && !upcoming) {
        if (option.perUse) {
            // Révélation céleste : la forme se choisit à chaque transformation
            extra = [el('ul', { class: 'subclass-options', 'aria-label': `Options : ${trait.name}` },
                option.choices.map(choice => el('li', { class: 'subclass-option' },
                    el('strong', { class: 'subclass-option-name', text: `${choice.name} : ` }),
                    el('span', { class: 'subclass-option-text', text: choice.text }))))];
        } else {
            controls = el('div', { class: 'feat-choices subclass-choices', role: 'group', 'aria-label': `Choix : ${trait.name}` },
                select('option', option.label, option.choices.map(c => [c.id, c.name]), option.selected?.id ?? '', locked),
                option.abilities
                    ? select('ability', 'Caractéristique des sorts', option.abilities.map(id => [id, ABILITY_NAMES[id]]), option.ability ?? '', locked)
                    : null);
            if (option.selected) extra = [el('p', { class: 'subclass-feature-text origin-choice-text' },
                el('strong', { text: `${option.selected.name} : ` }), option.selected.text)];
        }
    }
    return el('li', { class: 'subclass-feature', 'data-kind': 'reminder', 'data-fold-key': upcoming ? null : `species:${view.slug}.${trait.id}` },
        el('div', { class: 'subclass-feature-head' },
            upcoming
                ? el('span', { class: 'subclass-level', text: level })
                : foldButton(`${level}, ${trait.name}`, el('span', { text: level })),
            el('span', { class: 'subclass-feature-name', text: trait.name }),
            uses && !upcoming ? el('span', { class: 'feat-tag', 'data-kind': 'partial', text: uses }) : null),
        el('p', { class: 'subclass-feature-text', text: trait.text }),
        controls,
        ...extra);
}

/** Contenu du bloc (pur DOM) */
function build(character) {
    const derived = deriveCharacter(character);
    const view = speciesView(character, derived);
    if (!view) return { signature: 'none', nodes: [], slug: '' };
    const locked = isLocked();
    const pb = Number(derived.pb) || 2;
    const signature = JSON.stringify([view, locked, pb]);
    const title = el('p', { class: 'subclass-title origin-title' }, icon('paw'),
        el('span', { text: `Espèce : ${view.name}` }),
        foldButton(`Traits de l'espèce ${view.name}`));
    if (!view.known) {
        return {
            signature, slug: view.slug, nodes: [title, el('p', {
                class: 'subclass-empty',
                text: "Espèce de L'Odyssée des Seigneurs Dragons : ses traits ne sont pas encore repris ici. Voir le livre."
            })]
        };
    }
    const hint = view.option && !view.option.perUse && !view.option.selected
        ? el('p', { class: 'origin-check' }, icon('warning'),
            el('span', { class: 'feat-tag', 'data-kind': 'check', text: 'À choisir' }),
            el('span', { text: `${view.option.label} : choix à faire dans le menu ci-dessous (fiche déverrouillée).` }))
        : null;
    const spellsHint = view.spells.some(spell => spell.reached && spell.ability === null)
        ? el('p', { class: 'origin-check' }, icon('warning'),
            el('span', { class: 'feat-tag', 'data-kind': 'check', text: 'À choisir' }),
            el('span', { text: 'Caractéristique des sorts de l\'espèce (Intelligence, Sagesse ou Charisme) : DD et attaque calculés une fois choisie.' }))
        : null;
    const nodes = [
        title,
        facts(view),
        hint,
        spellsHint,
        el('ul', { class: 'subclass-list' }, view.traits.map(trait => traitItem(view, trait, { locked, pb }))),
        view.upcoming.length ? el('details', { class: 'subclass-upcoming' },
            el('summary', {}, icon('hourglass'), el('span', {
                text: `À venir : ${view.upcoming.map(trait => `${trait.name} (niveau ${trait.level})`).join(', ')}`
            })),
            el('ul', { class: 'subclass-list' }, view.upcoming.map(trait => traitItem(view, trait, { upcoming: true })))) : null
    ];
    return { signature, nodes: nodes.filter(Boolean), slug: view.slug };
}

/**
 * @param {{ root: HTMLElement, store: Object }} ctx
 */
export function initSpecies({ root, store }) {
    const container = root.querySelector('#species-traits');
    if (!container) return;
    let rendered = null;
    const render = (character) => {
        const { signature, nodes, slug } = build(character);
        if (signature === rendered) return;
        rendered = signature;
        const focused = container.contains(document.activeElement) ? document.activeElement.dataset?.speciesChoice : null;
        container.replaceChildren(...nodes);
        container.hidden = nodes.length === 0;
        if (slug) container.dataset.foldKey = `species:${slug}`;
        else delete container.dataset.foldKey;
        applyFolds(container);
        if (focused) container.querySelector(`[data-species-choice="${focused}"]`)?.focus();
    };
    bindFolding(container);
    container.addEventListener('change', (event) => {
        const control = event.target.closest('[data-species-choice]');
        if (!control || isLocked()) return;
        const patch = setSpeciesChoicePatch(store.get(), control.dataset.speciesChoice, control.value);
        if (Object.keys(patch).length) store.update(patch);
    });
    render(store.get());
    store.subscribe((character) => render(character));
    // Verrou : lock.js désactive les menus (data-build-control) ; la signature suit pour le prochain rendu
    document.addEventListener('dd:lockchange', () => render(store.get()));
}
