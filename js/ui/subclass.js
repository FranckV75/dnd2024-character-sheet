// =============================================================================
// SUBCLASS.JS - Capacités de sous-classe dans « Capacités de classe » (onglet Aptitudes & Traits)
//
// Liste les capacités atteintes de la sous-classe choisie (texte, niveau, ce que la fiche en
// fait), puis celles à venir, repliées. Lecture seule : rien n'est écrit dans la fiche ; le
// champ libre « Capacités de classe » du joueur reste en dessous, inchangé.
// Règles et textes : js/rules/subclass-features.js, js/data/subclass-features.js.
// =============================================================================

import { el, icon } from './dom.js';
import { deriveCharacter } from '../rules/character.js';
import { subclassFeatures, automationKind, SUBCLASS_LEVEL } from '../rules/subclass-features.js';

/** Étiquette de ce que la fiche fait de la capacité */
const KIND_LABELS = { calc: 'Calculé', partial: 'En partie', reminder: 'Rappel' };

const SOURCE_LABELS = { PHB2024: 'Manuel des joueurs 2024', 'Odyssée': 'Odyssée des Seigneurs Dragons' };

/** « Niv. 3 » (le niveau du livre de l'Odyssée, s'il diffère, est dit sous le texte) */
function levelText(feature) {
    return `Niv. ${feature.level}`;
}

function featureItem(feature, { upcoming = false } = {}) {
    const kind = automationKind(feature);
    return el('li', { class: 'subclass-feature', 'data-kind': kind },
        el('div', { class: 'subclass-feature-head' },
            el('span', { class: 'subclass-level', text: levelText(feature) }),
            el('span', { class: 'subclass-feature-name', text: feature.name }),
            upcoming ? null : el('span', { class: 'feat-tag', 'data-kind': kind, text: KIND_LABELS[kind] })),
        el('p', { class: 'subclass-feature-text', text: feature.text }),
        feature.bookLevel ? el('p', {
            class: 'subclass-feature-note',
            text: `Niveau ${feature.bookLevel} dans le livre de l'Odyssée (règles de 2014) : la sous-classe s'obtient au niveau ${SUBCLASS_LEVEL} en 2024.`
        }) : null,
        feature.automation && !upcoming ? el('p', { class: 'subclass-feature-auto' },
            icon('gear'), el('span', { text: `Dans la fiche : ${feature.automation.text}${feature.automation.partial ? ' Le reste : rappel seulement.' : ''}` })) : null,
        feature.options.length ? el('ul', { class: 'subclass-options', 'aria-label': `Options : ${feature.name}` },
            feature.options.map(option => el('li', {},
                el('span', { class: 'subclass-feature-name', text: option.name }),
                el('span', { class: 'subclass-option-text', text: ` : ${option.text}` })))) : null);
}

/** Phrase quand rien n'est à lister */
function emptyMessage(character, derived) {
    if (!derived.classSlug) return '';
    const typed = String(character.char_subclass ?? '').replace(/<[^>]*>/g, '').trim();
    if (typed) return `Sous-classe « ${typed} » non reconnue : choisissez-la dans le menu « Sous-classe » en haut de la fiche pour voir ses capacités.`;
    return derived.level >= SUBCLASS_LEVEL
        ? 'Choisissez une sous-classe dans le menu « Sous-classe » en haut de la fiche : ses capacités s\'afficheront ici.'
        : `La sous-classe s'obtient au niveau ${SUBCLASS_LEVEL} : ses capacités s'afficheront ici.`;
}

/**
 * Contenu du bloc pour un personnage (pur DOM, sans état).
 * @param {Object} character
 * @returns {{ nodes: Node[], signature: string }}
 */
function build(character) {
    const derived = deriveCharacter(character);
    const { subclass, reached, upcoming } = subclassFeatures(derived);
    if (!subclass) {
        const message = emptyMessage(character, derived);
        return { signature: JSON.stringify(['empty', message]), nodes: message ? [el('p', { class: 'subclass-empty', text: message })] : [] };
    }
    const signature = JSON.stringify([subclass.key, reached.map(f => [f.id, f.automation?.text]), upcoming.map(f => f.id)]);
    const nodes = [
        el('p', { class: 'subclass-title' }, icon('star'),
            el('span', { text: `Sous-classe : ${subclass.name}` }),
            el('span', { class: 'subclass-source', text: SOURCE_LABELS[subclass.source] ?? subclass.source })),
        reached.length
            ? el('ul', { class: 'subclass-list' }, reached.map(feature => featureItem(feature)))
            : el('p', { class: 'subclass-empty', text: `Aucune capacité avant le niveau ${upcoming[0]?.level ?? SUBCLASS_LEVEL}.` }),
        upcoming.length ? el('details', { class: 'subclass-upcoming' },
            el('summary', {}, icon('hourglass'), el('span', {
                text: `À venir : ${upcoming.length} capacité${upcoming.length > 1 ? 's' : ''} (niveau${upcoming.length > 1 ? 'x' : ''} ${[...new Set(upcoming.map(f => f.level))].join(', ')})`
            })),
            el('ul', { class: 'subclass-list' }, upcoming.map(feature => featureItem(feature, { upcoming: true })))) : null
    ];
    return { signature, nodes: nodes.filter(Boolean) };
}

/**
 * @param {{ root: HTMLElement, store: Object }} ctx
 */
export function initSubclassFeatures({ root, store }) {
    const container = root.querySelector('#subclass-features');
    if (!container) return;
    let rendered = null;
    const render = (character) => {
        const { signature, nodes } = build(character);
        if (signature === rendered) return;
        rendered = signature;
        // Bloc « À venir » ouvert : il le reste si la liste ne change pas de sous-classe
        container.replaceChildren(...nodes);
        container.hidden = nodes.length === 0;
    };
    render(store.get());
    store.subscribe((character) => render(character));
}
