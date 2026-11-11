// =============================================================================
// COMPANIONS.JS - Cartes des compagnons de sous-classe dans « Compagnons & familiers »
// (onglet Aptitudes & Traits), au-dessus du texte libre du joueur (lot 7)
//
// Bête primordiale du Maître des bêtes, stimfée du Conclave des Amazones, pseudodragon et dragon lié
// du Serment du Seigneur Dragon : statistiques calculées par js/rules/subclass-companions.js.
// Seuls les PV actuels s'écrivent dans la fiche (clé subclass_companions) ; ils restent modifiables
// quand la fiche est verrouillée (suivi en jeu). Le champ libre « Compagnons & familiers » ne change pas.
// =============================================================================

import { el, signed } from './dom.js';
import { derivedOf } from './derived.js';
import { companionCards, setCompanionHpPatch } from '../rules/subclass-companions.js';
import { foldButton, bindFolding, applyFolds } from './fold.js';
import { wrapWithSteppers } from './stepper.js';

/** Case de la ligne CA / PV / Vitesse / Initiative */
function stat(label, value, detail, extraClass = '') {
    return el('div', { class: `companion-stat${extraClass}` },
        el('span', { class: 'companion-stat-label', text: label }),
        typeof value === 'string' ? el('span', { class: 'companion-stat-value', text: value }) : value,
        detail ? el('span', { class: 'companion-stat-detail', text: detail }) : null);
}

/** PV : boutons − / + autour de la saisie des PV actuels (0 à max), puis « / max » */
function hpStat(card, stepHp) {
    const id = `companion-hp-${card.key.replace(/[^a-z0-9]+/gi, '-')}`;
    const input = el('input', {
        id, type: 'number', class: 'input companion-hp-input', inputmode: 'numeric', min: '0', max: String(card.hp.max),
        value: String(card.hp.current), 'data-companion-hp': card.key, 'data-hp-max': String(card.hp.max),
        'aria-label': `PV actuels : ${card.name} (maximum ${card.hp.max})`
    });
    const value = el('span', { class: 'companion-stat-value companion-hp' }, input,
        el('span', { class: 'companion-hp-max', text: `/ ${card.hp.max}` }));
    wrapWithSteppers(input, { noun: `PV (${card.name})`, rowClass: 'companion-hp-stepper', onStep: (delta) => stepHp(card.key, delta) });
    return stat('PV', value, card.hp.dice, ' is-hp');
}

/** Caractéristiques : score (modificateur) et sauvegarde */
function abilityTable(card) {
    if (!card.abilities.length) return null;
    return el('div', { class: 'companion-abilities', role: 'table', 'aria-label': `Caractéristiques : ${card.name}` },
        el('div', { class: 'companion-abilities-row is-head', role: 'row' },
            el('span', { role: 'columnheader', class: 'companion-abilities-label', text: '' }),
            card.abilities.map(a => el('span', { role: 'columnheader', text: a.label }))),
        el('div', { class: 'companion-abilities-row', role: 'row' },
            el('span', { role: 'rowheader', class: 'companion-abilities-label', text: 'Valeur' }),
            card.abilities.map(a => el('span', { role: 'cell', text: `${a.score} (${signed(a.mod)})` }))),
        el('div', { class: 'companion-abilities-row', role: 'row' },
            el('span', { role: 'rowheader', class: 'companion-abilities-label', text: 'Sauv.' }),
            card.abilities.map(a => el('span', { role: 'cell', text: signed(a.save) }))));
}

/** Liste de traits ou d'actions (nom en Cinzel, texte en Alegreya ; grisé si inactif) */
function entryList(title, entries) {
    if (!entries.length) return null;
    return [
        el('p', { class: 'companion-section', text: title }),
        el('ul', { class: 'companion-entries', 'aria-label': title },
            entries.map(entry => el('li', { class: entry.inactive ? 'companion-entry is-inactive' : 'companion-entry' },
                el('span', { class: 'companion-entry-name', text: entry.name }),
                el('span', { class: 'companion-entry-text', text: ` ${entry.text}` }))))
    ];
}

function cardNode(card, stepHp) {
    // Pastille à chevron : replie la carte (seuls le nom et le type restent), retenu sur cet appareil
    return el('article', { class: 'companion-card', 'aria-label': card.name, 'data-fold-key': `companion:${card.key}` },
        el('div', { class: 'companion-head' },
            foldButton(card.name),
            el('p', { class: 'companion-name', text: card.name }),
            el('p', { class: 'companion-type', text: card.subtitle })),
        card.missing ? el('p', { class: 'companion-missing', text: card.missing }) : null,
        el('div', { class: 'companion-stats' },
            card.ac ? stat('CA', String(card.ac.value), card.ac.detail) : null,
            card.hp ? hpStat(card, stepHp) : null,
            card.speed ? stat('Vitesse', card.speed) : null,
            card.initiative ? stat('Initiative', card.initiative) : null),
        abilityTable(card),
        card.lines.length ? el('ul', { class: 'companion-lines' },
            card.lines.map(([label, text]) => el('li', {},
                el('span', { class: 'companion-line-label', text: `${label} : ` }),
                el('span', { class: 'companion-entry-text', text })))) : null,
        ...(entryList('Traits', card.traits) ?? []),
        ...(entryList('Actions', card.actions) ?? []),
        card.notes.map(note => el('p', { class: 'companion-note', text: note })));
}

/**
 * @param {{ root: HTMLElement, store: Object }} ctx
 */
export function initCompanions({ root, store }) {
    const container = root.querySelector('#companion-cards');
    if (!container) return;
    let rendered = null;
    // PV actuels mis à jour sur place : toucher la case PV d'une autre carte juste après une saisie
    // fonctionne (les cartes ne sont reconstruites que si autre chose change)
    const syncHp = (cards) => {
        for (const card of cards) {
            const input = card.hp ? container.querySelector(`[data-companion-hp="${card.key}"]`) : null;
            if (input && input !== document.activeElement && input.value !== String(card.hp.current)) input.value = String(card.hp.current);
        }
    };
    // Boutons − / + : un PV de plus ou de moins, entre 0 et le maximum ; false à une borne
    const stepHp = (key, delta) => {
        const card = companionCards(derivedOf(store.get()), store.get()).find((c) => c.key === key);
        if (!card?.hp) return false;
        const next = Math.max(0, Math.min(card.hp.max, card.hp.current + delta));
        if (next === card.hp.current) return false;
        const patch = setCompanionHpPatch(store.get(), key, String(next), card.hp.max);
        if (!Object.keys(patch).length) return false;
        store.update(patch);
        return true;
    };
    const render = (character) => {
        const cards = companionCards(derivedOf(character), character);
        const signature = JSON.stringify(cards.map(card => (card.hp ? { ...card, hp: { ...card.hp, current: null } } : card)));
        if (signature === rendered) {
            syncHp(cards);
            return;
        }
        rendered = signature;
        // Saisie des PV qui avait le focus : elle le retrouve après la reconstruction
        const focused = container.contains(document.activeElement) ? document.activeElement?.dataset?.companionHp : null;
        container.replaceChildren(...cards.map((card) => cardNode(card, stepHp)));
        container.hidden = cards.length === 0;
        applyFolds(container);
        if (focused) container.querySelector(`[data-companion-hp="${focused}"]`)?.focus();
    };
    // Cartes repliables (fold.js)
    bindFolding(container);
    // PV actuels modifiés (validés en quittant la case ou avec Entrée) : clé subclass_companions
    container.addEventListener('change', (event) => {
        const input = event.target.closest('[data-companion-hp]');
        if (!input) return;
        const patch = setCompanionHpPatch(store.get(), input.dataset.companionHp, input.value, Number(input.dataset.hpMax));
        if (Object.keys(patch).length) store.update(patch);
        // Valeur ramenée entre 0 et le maximum, ou illisible : la case réaffiche les PV retenus
        const kept = companionCards(derivedOf(store.get()), store.get()).find(card => card.key === input.dataset.companionHp);
        if (kept?.hp) input.value = String(kept.hp.current);
    });
    render(store.get());
    store.subscribe((character) => render(character));
}
