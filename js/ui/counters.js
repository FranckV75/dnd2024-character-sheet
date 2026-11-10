// =============================================================================
// COUNTERS.JS (interface) - Boutons − / + des compteurs et pavé « Bourse »
//
//  - Épuisement (0 à 6), Inspiration héroïque ou points de Foi, Points de renommée (Odyssée,
//    0 à 20) : un bouton − et un bouton + autour de la case (js/ui/stepper.js). Une case qui
//    contient du texte (« 2 (Chanceux) ») n'est pas touchée : seule la saisie à la main la change.
//  - Pièces : bouton « Bourse » sous les cinq cases : choisir la pièce, taper le montant, puis
//    Gagner ou Dépenser (pas de monnaie rendue automatiquement).
// Épuisement, Inspiration et pièces sont des champs de jeu (utilisables fiche verrouillée) ;
// les boutons de la renommée sont masqués fiche verrouillée (edit-only), comme sa case.
// Règles : js/rules/counters.js. Mise en forme : css/stepper.css.
// =============================================================================

import { el, icon } from './dom.js';
import { wrapWithSteppers } from './stepper.js';
import { openNumberPad } from './number-pad.js';
import { steppedValue, changeCoins, readCount, COINS, MAX_COIN_ENTRY } from '../rules/counters.js';

const COUNTERS = [
    { key: 'fatigue_level', noun: 'niveau d\'Épuisement', max: 6, asNumber: true },
    { key: 'heroic_inspiration', noun: 'point d\'Inspiration ou de Foi', max: 99 },
    { key: 'glory_score', noun: 'point de renommée', max: 20, className: 'edit-only' }
];

/**
 * @param {{ root: HTMLElement, store: Object }} ctx
 */
export function initCounters({ root, store, setStatus = () => {} }) {
    for (const counter of COUNTERS) {
        const input = root.querySelector(`#f-${counter.key}`);
        if (!input) continue;
        wrapWithSteppers(input, {
            noun: counter.noun,
            className: counter.className ?? '',
            rowClass: 'counter-stepper',
            onStep: (delta) => {
                const value = store.get()[counter.key];
                const next = steppedValue(value, delta, { max: counter.max });
                if (next === null) {
                    // Texte libre (« 2 (Chanceux) ») : rien n'est réécrit, on le dit
                    if (readCount(value) === null && !/^\s*\d+\s*\/\s*\d+\s*$/.test(String(value))) {
                        setStatus(`La case « ${input.getAttribute('aria-label') || label(input)} » contient du texte : modifiez-la à la main.`);
                    }
                    return false;
                }
                store.update({ [counter.key]: counter.asNumber && typeof next === 'number' ? next : String(next) });
                return true;
            }
        });
    }

    const coins = root.querySelector('.coins');
    if (coins) {
        coins.after(el('button', {
            type: 'button', class: 'btn-chip purse-btn', 'aria-haspopup': 'dialog',
            on: { click: () => openPurse(store) }
        }, icon('bag'), el('span', { text: 'Bourse : gagner / dépenser' })));
    }
}

/** Libellé visible de la case (« Épuisement (0-6) ») */
function label(input) {
    return input.id ? document.querySelector(`label[for="${input.id}"]`)?.textContent.replace(/\s+/g, ' ').trim() ?? '' : '';
}

/** « Korgul : 12 PO · 30 PA » (pièces non nulles, de la plus grande à la plus petite) */
function purseText(record) {
    const name = String(record?.char_name ?? '').replace(/<[^>]*>/g, '').trim();
    const parts = [...COINS].reverse()
        .map((coin) => {
            const value = readCount(record?.[coin.key]);
            if (value === 0) return null;
            return value === null ? `${coin.short} à corriger` : `${value} ${coin.short}`;
        })
        .filter(Boolean);
    const text = parts.length ? parts.join(' · ') : 'bourse vide';
    return name ? `${name} : ${text}` : text;
}

function openPurse(store) {
    let selected = 'gp';
    const choices = COINS.map((coin) => el('button', {
        type: 'button', class: 'btn-chip purse-coin', 'aria-pressed': String(coin.key === selected),
        'aria-label': coin.name, 'data-coin': coin.key,
        on: { click: () => select(coin.key) }
    }, el('span', { class: `coin-icon ${coinClass(coin.key)}`, 'aria-hidden': 'true', text: coin.short })));
    const select = (key) => {
        selected = key;
        for (const choice of choices) choice.setAttribute('aria-pressed', String(choice.dataset.coin === key));
    };
    const group = el('div', { class: 'purse-coins', role: 'group', 'aria-label': 'Pièce' }, ...choices);

    const action = (label, sign, className) => ({
        label, className,
        run: (record, amount) => {
            const outcome = changeCoins(record, selected, amount, sign);
            if (!outcome.ok) return outcome;
            const verb = sign > 0 ? 'Gagné' : 'Dépensé';
            return {
                ok: true, patch: outcome.patch,
                lines: [{ text: `${verb} ${amount} ${outcome.coin.short} : ${outcome.before} → ${outcome.after}.`, className }]
            };
        }
    });
    openNumberPad({
        store,
        title: 'Bourse',
        summary: purseText,
        max: MAX_COIN_ENTRY,
        label: 'Nombre de pièces',
        before: [group],
        actions: [action('Dépenser', -1, 'is-damage'), action('Gagner', 1, 'is-heal')]
    });
}

/** Couleur de la pastille, comme sur la fiche */
function coinClass(key) {
    return { cp: 'copper', sp: 'silver', ep: 'electrum', gp: 'gold', pp: 'platinum' }[key];
}
