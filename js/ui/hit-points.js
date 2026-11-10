// =============================================================================
// HIT-POINTS.JS (interface) - PV en jeu : boutons − / + et pavé « Dégâts / Soins »
//
//  - PV actuels et PV temporaires : un bouton − et un bouton + de chaque côté de la case ;
//    un appui long répète, de plus en plus vite (js/rules/hit-points.js : stepHitPoints).
//  - Bouton « Dégâts / Soins » sous les PV actuels : un pavé de chiffres, puis Dégâts, Soins ou
//    PV temporaires (applyDamage, applyHealing, applyTemporary). La fenêtre reste ouverte pour
//    enchaîner ; chaque résultat rappelle ce qui en découle (concentration, 0 PV, jets contre la
//    mort).
// Champs de jeu : tout reste utilisable fiche verrouillée. Masqué à l'impression.
// =============================================================================

import { el, icon } from './dom.js';
import { openModal } from './modal.js';
import {
    hitPointState, applyDamage, applyHealing, applyTemporary, stepHitPoints, MAX_AMOUNT
} from '../rules/hit-points.js';

/** Appui long : premier pas après HOLD_DELAY, puis répétitions de plus en plus rapprochées */
const HOLD_DELAY = 450;
const REPEAT_SLOW = 140;
const REPEAT_FAST = 50;
const FAST_AFTER = 8;

/**
 * @param {{ root: HTMLElement, store: Object }} ctx
 */
export function initHitPoints({ root, store }) {
    const current = root.querySelector('#f-hp_current');
    const temp = root.querySelector('#f-hp_temp');
    if (current) addSteppers(current, store, 'hp_current', 'PV');
    if (temp) addSteppers(temp, store, 'hp_temp', 'PV temporaire');
    if (current) {
        const button = el('button', {
            type: 'button', class: 'btn-chip hp-pad-btn', 'aria-haspopup': 'dialog',
            on: { click: () => openPad(store) }
        }, icon('swords'), el('span', { text: 'Dégâts / Soins' }));
        current.closest('.hp-stepper').after(button);
    }
}

/** Boutons − et + autour d'une case de PV */
function addSteppers(input, store, key, noun) {
    const row = el('div', { class: 'hp-stepper' });
    input.before(row);
    const minus = stepButton(store, key, -1, `Retirer 1 ${noun}`, 'minus');
    const plus = stepButton(store, key, 1, `Ajouter 1 ${noun}`, 'plus');
    row.append(minus, input, plus);
}

function stepButton(store, key, delta, label, iconName) {
    const button = el('button', {
        type: 'button', class: 'btn-icon hp-step', 'aria-label': label, title: `${label} (appui long : plusieurs)`
    }, icon(iconName));
    const step = () => {
        const patch = stepHitPoints(store.get(), key, delta);
        if (Object.keys(patch).length) store.update(patch);
        return Object.keys(patch).length > 0;
    };

    // Clic (souris, clavier, toucher bref) : un pas. Appui long : répétition, et le clic qui suit
    // le relâchement est ignoré (sinon un pas de trop)
    let timer = null;
    let repeated = false;
    const stop = () => {
        clearTimeout(timer);
        timer = null;
    };
    button.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        stop();
        repeated = false;
        let count = 0;
        const repeat = () => {
            repeated = true;
            count += 1;
            if (!step()) {
                stop();
                return;
            }
            timer = setTimeout(repeat, count >= FAST_AFTER ? REPEAT_FAST : REPEAT_SLOW);
        };
        timer = setTimeout(repeat, HOLD_DELAY);
    });
    // Geste fini sans clic (doigt sorti du bouton) : le prochain clic, au clavier par exemple, compte
    const end = () => {
        stop();
        if (repeated) setTimeout(() => { repeated = false; }, 0);
    };
    for (const type of ['pointerup', 'pointerleave', 'pointercancel']) button.addEventListener(type, end);
    // Menu du système à l'appui long (tablette) : sans objet ici
    button.addEventListener('contextmenu', (event) => event.preventDefault());
    button.addEventListener('click', () => {
        if (repeated) {
            repeated = false;
            return;
        }
        step();
    });
    return button;
}

/** Résumé : « Korgul : 32 / 39 PV · 5 PV temporaires » */
function summaryText(record) {
    const { current, max, temp } = hitPointState(record);
    const name = String(record?.char_name ?? '').replace(/<[^>]*>/g, '').trim();
    const pv = current === null ? '— PV' : max !== null ? `${current} / ${max} PV` : `${current} PV`;
    const text = temp > 0 ? `${pv} · ${temp} PV temporaire${temp > 1 ? 's' : ''}` : pv;
    return name ? `${name} : ${text}` : text;
}

/** Une ligne « PV 30 → 27 (PV temporaires 5 → 0) » */
function changeText(verb, amount, result) {
    const { before, after } = result;
    const parts = [];
    if (before.current !== after.current) parts.push(`PV ${before.current} → ${after.current}`);
    if (before.temp !== after.temp) parts.push(`PV temporaires ${before.temp} → ${after.temp}`);
    return `${verb} ${amount} : ${parts.length ? parts.join(', ') : 'aucun changement'}.`;
}

function openPad(store) {
    let amount = '';
    const summary = el('p', { class: 'hp-pad-summary' });
    const display = el('output', { class: 'hp-pad-display', 'aria-live': 'polite', 'aria-label': 'Montant' });
    const result = el('div', { class: 'hp-pad-result', 'aria-live': 'polite' });

    const render = () => {
        summary.textContent = summaryText(store.get());
        display.textContent = amount || '0';
        display.classList.toggle('is-empty', !amount);
    };
    const press = (digit) => {
        const next = amount === '0' ? digit : amount + digit;
        if (Number(next) <= MAX_AMOUNT) amount = next;
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

    const key = (text, onClick, extra = {}) => el('button', {
        type: 'button', class: `btn hp-pad-key ${extra.class ?? ''}`.trim(), 'aria-label': extra.label ?? null, on: { click: onClick }
    }, text);
    const keys = el('div', { class: 'hp-pad-keys' },
        ...['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((d) => key(d, () => press(d))),
        key('C', clear, { label: 'Effacer le montant' }),
        key('0', () => press('0')),
        key('⌫', back, { label: 'Effacer le dernier chiffre' })
    );

    const run = (fn, verb, className) => () => {
        const outcome = fn(store.get(), amount);
        if (!outcome.ok) {
            result.replaceChildren(el('p', { class: 'hp-pad-line is-error', text: outcome.reason }));
            return;
        }
        if (Object.keys(outcome.patch).length) store.update(outcome.patch);
        result.replaceChildren(
            el('p', { class: `hp-pad-line ${className}`, text: changeText(verb, amount, outcome) }),
            ...outcome.notes.map((note) => el('p', { class: outcome.dead ? 'hp-pad-note is-error' : 'hp-pad-note', text: note }))
        );
        amount = '';
        render();
    };
    const actions = el('div', { class: 'hp-pad-actions' },
        el('button', { type: 'button', class: 'btn hp-pad-damage', on: { click: run(applyDamage, 'Dégâts', 'is-damage') } }, 'Dégâts'),
        el('button', { type: 'button', class: 'btn hp-pad-heal', on: { click: run(applyHealing, 'Soins', 'is-heal') } }, 'Soins'),
        el('button', { type: 'button', class: 'btn hp-pad-temp', on: { click: run(applyTemporary, 'PV temporaires', 'is-temp') } }, 'PV temp.')
    );

    // Clavier (ordinateur) : chiffres, retour arrière, Suppr
    const onKey = (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (/^\d$/.test(event.key)) press(event.key);
        else if (event.key === 'Backspace') back();
        else if (event.key === 'Delete') clear();
        else return;
        event.preventDefault();
    };

    // Fiche changée ailleurs : le résumé suit. Fiche remplacée (autre onglet, compte, import,
    // « Revenir à… ») : le montant tapé pour l'ancienne fiche est effacé
    const unsubscribe = store.subscribe((state, changedKeys) => {
        if (changedKeys === null) {
            amount = '';
            result.replaceChildren(el('p', { class: 'hp-pad-line is-error', text: 'La fiche a été remplacée : vérifiez le personnage et retapez le montant.' }));
        }
        render();
    });
    const pad = el('div', { class: 'hp-pad' }, summary, display, keys, actions, result);
    render();
    openModal({
        title: 'Dégâts / Soins',
        body: [pad],
        focusField: false,
        onClose: unsubscribe
    });
    // Le focus est sur un bouton de la fenêtre : les touches sont écoutées sur toute la fenêtre
    pad.closest('dialog')?.addEventListener('keydown', onKey);
}
