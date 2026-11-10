// =============================================================================
// NUMBER-PAD.JS - Fenêtre « pavé de chiffres » : gros chiffres, puis un bouton d'action
//
// Sert aux Dégâts / Soins (js/ui/hit-points.js), aux PX gagnés et à la bourse. La fenêtre reste
// ouverte pour enchaîner ; chaque action affiche son résultat. Une fiche remplacée pendant que la
// fenêtre est ouverte (autre onglet, compte, import, « Revenir à… ») efface le montant tapé.
// Clavier d'ordinateur : chiffres, retour arrière, Suppr. Mise en forme : css/stepper.css.
// =============================================================================

import { el } from './dom.js';
import { openModal } from './modal.js';

/**
 * @typedef {Object} PadAction
 * @property {string} label
 * @property {string} [className] - is-damage, is-heal…
 * @property {(record: Object, amount: string) => ({ ok: false, reason: string } |
 *            { ok: true, patch: Object, lines: { text: string, className?: string }[] })} run
 */

/**
 * @param {{ store: Object, title: string, summary: (record: Object) => string, max: number,
 *           actions: PadAction[], before?: HTMLElement[], label?: string }} options
 *   before : éléments placés au-dessus du pavé (choix de la pièce…)
 */
export function openNumberPad({ store, title, summary, max, actions, before = [], label = 'Montant' }) {
    let amount = '';
    const summaryLine = el('p', { class: 'num-pad-summary' });
    const display = el('output', { class: 'num-pad-display', 'aria-live': 'polite', 'aria-label': label });
    const result = el('div', { class: 'num-pad-result', 'aria-live': 'polite' });

    const render = () => {
        summaryLine.textContent = summary(store.get());
        display.textContent = amount || '0';
        display.classList.toggle('is-empty', !amount);
    };
    const press = (digit) => {
        const next = amount === '0' ? digit : amount + digit;
        if (Number(next) <= max) amount = next;
        render();
    };
    const back = () => {
        amount = amount.slice(0, -1);
        render();
    };
    const clear = () => {
        amount = '';
        render();
    };

    const key = (text, onClick, aria) => el('button', {
        type: 'button', class: 'btn num-pad-key', 'aria-label': aria ?? null, on: { click: onClick }
    }, text);
    const keys = el('div', { class: 'num-pad-keys' },
        ...['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((d) => key(d, () => press(d))),
        key('C', clear, 'Effacer le montant'),
        key('0', () => press('0')),
        key('⌫', back, 'Effacer le dernier chiffre')
    );

    const run = (action) => () => {
        const outcome = action.run(store.get(), amount);
        if (!outcome.ok) {
            result.replaceChildren(el('p', { class: 'num-pad-line is-error', text: outcome.reason }));
            return;
        }
        if (Object.keys(outcome.patch).length) store.update(outcome.patch);
        result.replaceChildren(...outcome.lines.map((line, i) =>
            el('p', { class: `${i === 0 ? 'num-pad-line' : 'num-pad-note'} ${line.className ?? ''}`.trim(), text: line.text })));
        amount = '';
        render();
    };
    const buttons = el('div', { class: `num-pad-actions count-${actions.length}` },
        ...actions.map((action) => el('button', {
            type: 'button', class: `btn num-pad-action ${action.className ?? ''}`.trim(), on: { click: run(action) }
        }, action.label)));

    const onKey = (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.target.closest?.('input, select, textarea')) return;
        if (/^\d$/.test(event.key)) press(event.key);
        else if (event.key === 'Backspace') back();
        else if (event.key === 'Delete') clear();
        else return;
        event.preventDefault();
    };

    const unsubscribe = store.subscribe((state, changedKeys) => {
        if (changedKeys === null) {
            amount = '';
            result.replaceChildren(el('p', { class: 'num-pad-line is-error', text: 'La fiche a été remplacée : vérifiez le personnage et retapez le montant.' }));
        }
        render();
    });
    const pad = el('div', { class: 'num-pad' }, summaryLine, ...before, display, keys, buttons, result);
    render();
    openModal({ title, body: [pad], focusField: false, onClose: unsubscribe });
    // Le focus est sur un bouton de la fenêtre : les touches sont écoutées sur toute la fenêtre
    pad.closest('dialog')?.addEventListener('keydown', onKey);
}
