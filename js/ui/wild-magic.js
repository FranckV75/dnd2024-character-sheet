// =============================================================================
// WILD-MAGIC.JS - Tirages de la Bouffée de Sorcellerie sauvage (onglet Combat), lot 7
//
// Sorcellerie sauvage (niveau 3 ou plus) : bouton « Bouffée ? (d20) » (sur 20, la table est
// tirée aussitôt) et bouton « Table (d100) » (Bouffée automatique de Marée du chaos, ligne
// 01-04, demande du MJ). Le résultat donne la ligne de la table du manuel, sans recopier ses effets.
// Rien n'est enregistré : le résultat disparaît au rechargement. Règles : js/rules/wild-magic.js.
// =============================================================================

import { el } from './dom.js';
import { deriveCharacter } from '../rules/character.js';
import { wildMagicPanel, surgeCheck, surgeTableRoll, surgeResultText } from '../rules/wild-magic.js';

/**
 * @param {{ root: HTMLElement, store: Object }} ctx
 */
export function initWildMagic({ root, store }) {
    const box = root.querySelector('#wild-magic');
    if (!box) return;
    // Ligne du résultat : gardée d'un affichage à l'autre (textContent seulement)
    const result = el('p', { class: 'wild-magic-result', 'aria-live': 'polite' });
    let rendered = null;
    let level = 1;

    const render = (character) => {
        const derived = deriveCharacter(character);
        const panel = wildMagicPanel(character, derived);
        const signature = JSON.stringify(panel);
        if (signature === rendered) return;
        rendered = signature;
        if (!panel) {
            box.replaceChildren();
            box.hidden = true;
            result.textContent = '';
            return;
        }
        level = panel.level;
        box.hidden = false;
        // replaceChildren écrirait « null » en texte : les parties absentes sont retirées
        box.replaceChildren(...[
            el('p', { class: 'label accent wild-magic-title', text: 'Bouffée de Sorcellerie sauvage' }),
            el('div', { class: 'wild-magic-buttons' },
                el('button', {
                    type: 'button', class: 'btn wild-magic-roll', 'data-wild-roll': 'check',
                    text: 'Bouffée ? (d20)', title: 'Après un sort d\'Ensorceleur lancé avec un emplacement (une fois par tour)'
                }),
                el('button', {
                    type: 'button', class: 'btn wild-magic-roll', 'data-wild-roll': 'table',
                    text: 'Table (d100)',
                    title: `Tirage direct sur la table (Bouffée automatique, ligne 01-04, demande du MJ)${panel.keepTwo ? ' : deux résultats, Chaos contrôlé' : ''}`
                })),
            result,
            panel.reminders.length ? el('ul', { class: 'wild-magic-reminders' },
                panel.reminders.map(text => el('li', { text }))) : null
        ].filter(Boolean));
    };

    box.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-wild-roll]');
        if (!button || box.hidden) return;
        const roll = button.dataset.wildRoll === 'table' ? surgeTableRoll(level, Math.random) : surgeCheck(level, Math.random);
        result.textContent = surgeResultText(roll);
    });
    render(store.get());
    store.subscribe((character) => render(character));
}
