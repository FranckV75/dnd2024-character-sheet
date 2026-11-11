// =============================================================================
// CLASS-PROGRESSION.JS (interface) - Aptitudes de base de la classe dans « Capacités de classe »
//
// Au-dessus des aptitudes de sous-classe (js/ui/subclass.js), même présentation :
//  - titre « Classe : Barbare, niveau 6 » (sa pastille replie le bloc) ;
//  - colonnes de la table au niveau du personnage (Rages 4, puis 5 au niveau 12…) ;
//  - aptitudes atteintes (chaque pastille de niveau replie la sienne), puis « À venir », repliées.
// Lecture seule : rien n'est écrit dans la fiche. Règles : js/rules/class-progression.js.
// =============================================================================

import { el, icon } from './dom.js';
import { derivedOf } from './derived.js';
import { classProgression } from '../rules/class-progression.js';
import { DD_RULES } from '../data/dd-rules.js';
import { foldButton, bindFolding, applyFolds } from './fold.js';

/** « Rages : 4 (5 au niveau 12) » */
function columnItem(column) {
    return el('li', { class: 'class-column' },
        el('span', { class: 'class-column-name', text: column.name }),
        el('span', { class: 'class-column-value', text: column.value ?? '—' }),
        column.next ? el('span', { class: 'class-column-next', text: `${column.next.value} au niv. ${column.next.level}` }) : null);
}

function featureItem(classSlug, feature, upcoming) {
    const level = `Niv. ${feature.level}`;
    return el('li', { class: 'subclass-feature class-feature', 'data-class-kind': feature.kind, 'data-fold-key': upcoming ? null : `class:${feature.id}` },
        el('div', { class: 'subclass-feature-head' },
            upcoming
                ? el('span', { class: 'subclass-level', text: level })
                : foldButton(`${level}, ${feature.name}`, el('span', { text: level })),
            el('span', { class: 'subclass-feature-name', text: feature.name })),
        feature.text ? el('p', { class: 'subclass-feature-text', text: feature.text }) : null);
}

/**
 * @param {Object} character
 * @returns {{ nodes: Node[], signature: string }}
 */
function build(character) {
    const derived = derivedOf(character);
    const progression = derived.classSlug ? classProgression(derived.classSlug, derived.level) : null;
    if (!progression) return { signature: 'none', nodes: [] };
    const { columns, reached, upcoming } = progression;
    const className = DD_RULES.classes[derived.classSlug]?.nameFr ?? derived.classSlug;
    const signature = JSON.stringify([derived.classSlug, derived.level]);
    const levels = [...new Set(upcoming.map(f => f.level))];
    const nodes = [
        el('p', { class: 'subclass-title class-title' }, icon('swords'),
            el('span', { text: `Classe : ${className}, niveau ${derived.level}` }),
            foldButton(`Aptitudes de base : ${className}`)),
        columns.length ? el('ul', { class: 'class-columns', 'aria-label': `Table de classe au niveau ${derived.level}` }, columns.map(columnItem)) : null,
        el('ul', { class: 'subclass-list' }, reached.map(feature => featureItem(derived.classSlug, feature, false))),
        upcoming.length ? el('details', { class: 'subclass-upcoming class-upcoming' },
            el('summary', {}, icon('hourglass'), el('span', {
                text: `À venir : ${upcoming.length} aptitude${upcoming.length > 1 ? 's' : ''} (niveau${levels.length > 1 ? 'x' : ''} ${levels.join(', ')})`
            })),
            el('ul', { class: 'subclass-list' }, upcoming.map(feature => featureItem(derived.classSlug, feature, true)))) : null
    ];
    return { signature, nodes: nodes.filter(Boolean) };
}

/**
 * @param {{ root: HTMLElement, store: Object }} ctx
 */
export function initClassProgression({ root, store }) {
    const container = root.querySelector('#class-progression');
    if (!container) return;
    let rendered = null;
    const render = (character) => {
        const { signature, nodes } = build(character);
        if (signature === rendered) return;
        // « À venir » ouvert : rouvert après un changement de niveau
        const open = container.querySelector('details.class-upcoming')?.open ?? false;
        rendered = signature;
        container.replaceChildren(...nodes);
        container.hidden = nodes.length === 0;
        container.dataset.foldKey = 'class:base';
        applyFolds(container);
        const details = container.querySelector('details.class-upcoming');
        if (details && open) details.open = true;
    };
    bindFolding(container);
    render(store.get());
    store.subscribe((character, changedKeys) => {
        if (changedKeys === null || changedKeys.some((key) => ['char_class', 'char_level'].includes(key))) render(character);
    });
}
