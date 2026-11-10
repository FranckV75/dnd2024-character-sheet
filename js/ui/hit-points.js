// =============================================================================
// HIT-POINTS.JS (interface) - PV en jeu : boutons − / + et pavé « Dégâts / Soins »
//
//  - PV actuels et PV temporaires : un bouton − et un bouton + de chaque côté de la case ;
//    un appui long répète, de plus en plus vite (js/ui/stepper.js ; règle : stepHitPoints).
//  - Bouton « Dégâts / Soins » sous les PV actuels : un pavé de chiffres (js/ui/number-pad.js),
//    puis Dégâts, Soins ou PV temporaires (applyDamage, applyHealing, applyTemporary). Chaque
//    résultat rappelle ce qui en découle (concentration, 0 PV, jets contre la mort).
// Champs de jeu : tout reste utilisable fiche verrouillée. Masqué à l'impression.
// =============================================================================

import { el, icon } from './dom.js';
import { wrapWithSteppers } from './stepper.js';
import { openNumberPad } from './number-pad.js';
import {
    hitPointState, applyDamage, applyHealing, applyTemporary, stepHitPoints, MAX_AMOUNT
} from '../rules/hit-points.js';

/**
 * @param {{ root: HTMLElement, store: Object }} ctx
 */
export function initHitPoints({ root, store }) {
    const current = root.querySelector('#f-hp_current');
    const temp = root.querySelector('#f-hp_temp');
    const step = (key) => (delta) => {
        const patch = stepHitPoints(store.get(), key, delta);
        if (!Object.keys(patch).length) return false;
        store.update(patch);
        return true;
    };
    if (temp) wrapWithSteppers(temp, { noun: 'PV temporaire', onStep: step('hp_temp'), rowClass: 'hp-stepper' });
    if (current) {
        const { row } = wrapWithSteppers(current, { noun: 'PV', onStep: step('hp_current'), rowClass: 'hp-stepper' });
        row.after(el('button', {
            type: 'button', class: 'btn-chip hp-pad-btn', 'aria-haspopup': 'dialog',
            on: { click: () => openPad(store) }
        }, icon('swords'), el('span', { text: 'Dégâts / Soins' })));
    }
}

/** Résumé : « Korgul : 32 / 39 PV · 5 PV temporaires » */
function summaryText(record) {
    const { current, max, temp } = hitPointState(record);
    const name = String(record?.char_name ?? '').replace(/<[^>]*>/g, '').trim();
    const pv = current === null ? '— PV' : max !== null ? `${current} / ${max} PV` : `${current} PV`;
    const text = temp > 0 ? `${pv} · ${temp} PV temporaire${temp > 1 ? 's' : ''}` : pv;
    return name ? `${name} : ${text}` : text;
}

/** Une ligne « Dégâts 8 : PV 30 → 27, PV temporaires 5 → 0. » */
function changeText(verb, amount, result) {
    const { before, after } = result;
    const parts = [];
    if (before.current !== after.current) parts.push(`PV ${before.current} → ${after.current}`);
    if (before.temp !== after.temp) parts.push(`PV temporaires ${before.temp} → ${after.temp}`);
    return `${verb} ${amount} : ${parts.length ? parts.join(', ') : 'aucun changement'}.`;
}

/** Règle de PV → action du pavé */
function padAction(label, verb, className, rule) {
    return {
        label, className,
        run: (record, amount) => {
            const outcome = rule(record, amount);
            if (!outcome.ok) return outcome;
            return {
                ok: true, patch: outcome.patch,
                lines: [
                    { text: changeText(verb, amount, outcome), className },
                    ...outcome.notes.map((text) => ({ text, className: outcome.dead ? 'is-error' : '' }))
                ]
            };
        }
    };
}

function openPad(store) {
    openNumberPad({
        store,
        title: 'Dégâts / Soins',
        summary: summaryText,
        max: MAX_AMOUNT,
        actions: [
            padAction('Dégâts', 'Dégâts', 'is-damage', applyDamage),
            padAction('Soins', 'Soins', 'is-heal', applyHealing),
            padAction('PV temp.', 'PV temporaires', 'is-temp', applyTemporary)
        ]
    });
}
