// =============================================================================
// CONDITIONS.JS (interface) - Encadré « États » de l'onglet Combat
//
// Une pastille par état du manuel (js/data/conditions.js) : toucher la pastille coche ou décoche
// l'état (clé facultative « conditions », js/rules/conditions.js) et affiche le rappel de ses effets
// sous les pastilles, avec les états qu'il entraîne (Inconscient → Neutralisé, À terre).
// L'Épuisement reste réglé par niveau dans l'encadré Repos : sa pastille y mène.
// Champs de jeu : toujours modifiables, fiche verrouillée comprise (pas de data-field).
// Encadré repliable (data-fold-box="conditions", js/ui/fold.js).
// =============================================================================

import { el } from './dom.js';
import { CONDITIONS } from '../data/conditions.js';
import { activeConditions, toggleCondition, conditionReminders, CONDITIONS_KEY } from '../rules/conditions.js';
import { exhaustionEffects } from '../rules/character.js';

/**
 * @param {{ root: HTMLElement, store: Object }} ctx
 */
export function initConditions({ root, store }) {
    const host = root.querySelector('#conditions-feature');
    if (!host) return;

    const chips = new Map();
    for (const condition of CONDITIONS) {
        const chip = el('button', {
            type: 'button', class: 'btn-chip condition-chip', 'data-condition': condition.id,
            text: condition.nameFr
        });
        if (condition.tracked) {
            chip.title = 'Niveau d\'Épuisement : encadré Repos';
            chip.addEventListener('click', () => {
                const field = root.querySelector('#f-fatigue_level');
                field?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                // Écran tactile : pas de focus (il ouvrirait le clavier virtuel)
                if (!window.matchMedia('(pointer: coarse)').matches) field?.focus({ preventScroll: true });
            });
        } else {
            chip.setAttribute('aria-pressed', 'false');
            chip.addEventListener('click', () => {
                const on = chip.getAttribute('aria-pressed') !== 'true';
                store.update(toggleCondition(store.get(), condition.id, on));
            });
        }
        chips.set(condition.id, chip);
    }

    const clearButton = el('button', {
        type: 'button', class: 'btn-chip condition-clear', text: 'Tout retirer', hidden: true,
        title: 'Décocher tous les états (l\'Épuisement reste réglé dans Repos)',
        on: { click: () => store.update({ [CONDITIONS_KEY]: [] }) }
    });
    const reminders = el('ul', { class: 'condition-reminders', 'aria-live': 'polite' });

    host.replaceChildren(
        el('div', { class: 'condition-chips', role: 'group', 'aria-label': 'États (toucher pour cocher)' }, ...chips.values()),
        reminders,
        clearButton
    );

    const render = (character) => {
        const active = new Set(activeConditions(character));
        const list = conditionReminders(character);
        const implied = new Set(list.filter((r) => r.impliedBy.length).map((r) => r.id));
        for (const [id, chip] of chips) {
            if (id === 'exhaustion') {
                const { level } = exhaustionEffects(character.fatigue_level);
                chip.textContent = level ? `Épuisement ${level}` : 'Épuisement';
                chip.classList.toggle('is-on', level > 0);
                continue;
            }
            chip.setAttribute('aria-pressed', String(active.has(id)));
            chip.classList.toggle('is-implied', !active.has(id) && implied.has(id));
        }
        clearButton.hidden = active.size === 0;
        reminders.replaceChildren(...list.map((reminder) => el('li', { class: 'condition-reminder' },
            el('strong', { class: 'condition-name', text: reminder.nameFr }),
            reminder.impliedBy.length && !reminder.checked
                ? el('span', { class: 'muted', text: ` (entraîné par ${reminder.impliedBy.join(', ')})` })
                : null,
            el('ul', {}, ...reminder.effects.map((effect) => el('li', { text: effect }))))));
        reminders.hidden = list.length === 0;
    };

    store.subscribe((character, changedKeys) => {
        if (changedKeys === null || changedKeys.includes(CONDITIONS_KEY) || changedKeys.includes('fatigue_level')) render(character);
    });
    render(store.get());
}
