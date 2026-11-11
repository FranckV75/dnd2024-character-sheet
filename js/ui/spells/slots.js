// =============================================================================
// SPELLS/SLOTS.JS - Emplacements de sorts du grimoire (onglet Magie)
//
// Cases cochées = emplacements utilisés : contrôle de JEU (utilisable verrouillé). Les boutons
// + / − du nombre d'emplacements sont réservés à l'édition. État enregistré dans
// spell_slots_state ; règles (nombres du manuel, ajustements) dans js/rules/spells.js.
// =============================================================================

import { derivedOf } from '../derived.js';
import { slotView, toggleSlotUsed, adjustSlotMax, slotLevels, nextFreeSlotLevel } from '../../rules/spells.js';
import { el, icon } from '../dom.js';

/** État des emplacements enregistré dans la fiche ({} s'il est absent ou illisible) */
export function slotStateOf(character) {
    const state = character.spell_slots_state;
    return state && typeof state === 'object' && !Array.isArray(state) ? state : {};
}

/**
 * @param {{ store: Object, view: { level: string } }} deps - view : filtre de niveau du grimoire
 *   (le groupe de ce niveau est mis en avant)
 * @returns {{ element: HTMLElement, render(character: Object, d: Object): void }}
 */
export function createSpellSlots({ store, view }) {
    const slotsBox = el('div', { class: 'spell-slots', role: 'group', 'aria-label': 'Emplacements de sorts' });
    let slotsSignature = null;

    const rulebookSlots = (level) => derivedOf(store.get()).spellSlots[level] ?? 0;
    const slotState = () => slotStateOf(store.get());

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

    function render(character, d) {
        const state = slotStateOf(character);
        const levels = slotLevels(d.spellSlots, d.classSlug, state);
        const views = levels.map(info => ({ info, ...slotView(state, info.level, info.rulebook) }));
        const signature = views.map(v => `${v.info.level}:${v.max}:${v.info.label}`).join('|');

        if (signature !== slotsSignature) {
            // Nombre d'emplacements changé : reconstruction, en gardant le focus sur le même bouton
            const focusedLabel = slotsBox.contains(document.activeElement) ? document.activeElement.getAttribute('aria-label') : null;
            slotsSignature = signature;
            // Ajout manuel d'un niveau au-dessus de ceux du manuel (comme le « + » de la v3) : Arcanum
            // mystique de l'Occultiste, multiclasse...
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

    return { element: slotsBox, render };
}
