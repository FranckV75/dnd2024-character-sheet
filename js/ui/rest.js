// =============================================================================
// REST.JS - Repos court (dés de vie) et repos long
//
// Deux boutons « de jeu » (utilisables fiche verrouillée) dans la boîte Repos.
// Les règles (soins, ressources récupérées...) sont dans js/rules/rest.js ;
// ce module demande les choix du joueur, lance les dés (Math.random) et
// envoie le patch au store en une seule fois.
// =============================================================================

import { el, signed, icon, setIconLabel } from './dom.js';
import { openModal, confirmModal } from './modal.js';
import { deriveCharacter } from '../rules/character.js';
import {
    hitDiceState, hitDiceHealing, parseManualHitDice, canStartRest, planShortRest, planLongRest
} from '../rules/rest.js';

const rollDie = (faces) => Math.floor(Math.random() * faces) + 1;
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
const agree = (n, word) => `${word}${n > 1 ? 's' : ''}`;

/** Ligne de liste précédée d'une icône dorée (sans icône : un losange, posé par rest.css) */
const iconLine = (text, name, className) => el('li', { class: [name ? 'has-icon' : '', className].filter(Boolean).join(' ') || null },
    name ? icon(name) : null, el('span', { text }));

/** Avertissement : triangle dessiné puis texte */
const warning = (text) => el('p', { class: 'rest-warning' }, icon('warning'), el('span', { text }));

// ---------------------------------------------------------------------------
// Repos court
// ---------------------------------------------------------------------------

/** Ressources rendues par le repos court, d'après le résumé de planShortRest */
function recoveryLines(summary, done) {
    const state = done ? 'récupérée' : 'récupérable';
    const lines = [];
    if (summary.resourcesRestored > 0) {
        lines.push(`${summary.resourceLabel} : ${plural(summary.resourcesRestored, 'utilisation')} ${agree(summary.resourcesRestored, state)}`);
    }
    if (summary.pactSlotsRestored > 0) {
        lines.push(`Magie de pacte : ${plural(summary.pactSlotsRestored, 'emplacement')} de sort ${agree(summary.pactSlotsRestored, done ? 'récupéré' : 'récupérable')}`);
    }
    return lines;
}

/** Rappel pour les capacités à appliquer soi-même (Restauration arcanique, Récupération naturelle) */
function slotRecoveryHint(summary) {
    const r = summary.slotRecovery;
    return r
        ? `${r.name} (une fois par repos long) : décochez vous-même des emplacements de sorts dont les niveaux cumulés font au plus ${r.maxLevels}, aucun de niveau 6 ou plus.`
        : null;
}

function openShortRest(store) {
    const character = store.get();
    const d = deriveCharacter(character);
    const hd = hitDiceState(character);
    const preview = planShortRest(character).summary;
    const dieLabel = hd.faces ? `d${hd.faces}` : 'type de dé non choisi';
    const sorcerousMax = d.classSlug === 'sorcerer' && d.level >= 5 ? Math.floor(d.level / 2) : 0;

    // --- Champs ---
    const diceInput = el('input', {
        id: 'rest-dice', class: 'input center rest-dice-input', type: 'number', inputmode: 'numeric',
        min: '0', max: String(hd.available), value: String(Math.min(1, hd.available))
    });
    const manualInput = el('input', {
        id: 'rest-manual', class: 'input', type: 'text', inputmode: 'numeric', autocomplete: 'off',
        placeholder: 'ex. 12, ou 7 5', 'aria-describedby': 'rest-manual-help'
    });
    const manualPreview = el('output', { class: 'rest-preview', for: 'rest-manual rest-dice', 'aria-live': 'polite' });
    const error = el('p', { class: 'rest-error', role: 'alert', hidden: true });
    const sorcererBox = sorcerousMax ? el('input', { type: 'checkbox', class: 'round-check', id: 'rest-sorcerer' }) : null;

    const readDice = () => Math.max(0, Math.min(hd.available, parseInt(diceInput.value, 10) || 0));
    const refreshPreview = () => {
        const n = readDice();
        const parsed = n > 0 && manualInput.value.trim()
            ? parseManualHitDice(manualInput.value, n, hd.faces, hd.conMod) : null;
        manualPreview.textContent = parsed?.ok ? `→ +${parsed.healing} PV` : '';
    };
    const step = (delta) => {
        diceInput.value = String(Math.max(0, Math.min(hd.available, readDice() + delta)));
        refreshPreview();
    };
    const showError = (message) => {
        error.textContent = message;
        error.hidden = false;
        return false;
    };
    diceInput.addEventListener('input', () => { error.hidden = true; refreshPreview(); });
    manualInput.addEventListener('input', () => { error.hidden = true; refreshPreview(); });

    // --- Contenu ---
    const also = recoveryLines(preview, false);
    const hint = slotRecoveryHint(preview);
    const body = [
        !canStartRest(character) && warning('Règle 2024 : il faut au moins 1 PV pour commencer un repos court.'),
        el('p', { text: `Dés de vie disponibles : ${hd.available} / ${hd.level} (${dieLabel}). Chaque dé rend son résultat ${signed(hd.conMod)} (Constitution), au moins 1 PV par dé.` }),
        hd.available > 0 && el('div', { class: 'rest-field' },
            el('label', { class: 'label', for: 'rest-dice', text: 'Dés à dépenser' }),
            el('div', { class: 'rest-stepper' },
                el('button', { type: 'button', class: 'btn-icon', 'aria-label': 'Un dé de moins', on: { click: () => step(-1) } }, icon('minus')),
                diceInput,
                el('button', { type: 'button', class: 'btn-icon', 'aria-label': 'Un dé de plus', on: { click: () => step(1) } }, icon('plus')),
                el('span', { class: 'muted', text: `/ ${hd.available}` }))),
        hd.available > 0 && el('div', { class: 'rest-field' },
            el('label', { class: 'label', for: 'rest-manual', text: 'Total des dés (si vous les lancez vous-même)' }),
            el('div', { class: 'rest-manual' }, manualInput, manualPreview),
            el('small', {
                id: 'rest-manual-help', class: 'muted',
                text: 'Le total des dés, ou chaque résultat séparé par un espace. Le modificateur de Constitution est ajouté automatiquement.'
            })),
        hd.available === 0 && warning('Plus aucun dé de vie disponible : ils reviennent tous au repos long.'),
        error,
        (also.length > 0 || sorcererBox || hint) && el('div', { class: 'rest-also' },
            el('span', { class: 'label', text: 'Ce repos rend aussi' }),
            el('ul', {},
                also.map(text => iconLine(text)),
                sorcererBox && el('li', { class: 'has-icon' }, el('label', { class: 'rest-check' }, sorcererBox,
                    el('span', { text: `Utiliser Restauration ensorcelée : jusqu'à ${sorcerousMax} points de sorcellerie (une fois par repos long)` }))),
                hint && iconLine(hint, 'sparkle', 'muted')))
    ];

    let result = null;
    const finish = (healing, rollText) => {
        const plan = planShortRest(store.get(), {
            diceSpent: readDice(), healing, sorcerousRestoration: Boolean(sorcererBox?.checked)
        });
        if (Object.keys(plan.patch).length) store.update(plan.patch);
        result = { summary: plan.summary, rollText };
    };

    openModal({
        title: 'Repos court (1 h)',
        icon: 'hourglass',
        // Focus sur « Lancer les dés » : les boutons − / + suffisent, pas de clavier virtuel à l'ouverture
        focusField: false,
        body,
        actions: [
            { label: 'Annuler' },
            {
                label: 'Saisir le total',
                icon: 'feather',
                onClick: () => {
                    const n = readDice();
                    if (n === 0) return finish(0, '');
                    const parsed = parseManualHitDice(manualInput.value, n, hd.faces, hd.conMod);
                    if (!parsed.ok) {
                        manualInput.focus();
                        return showError(parsed.error);
                    }
                    return finish(parsed.healing, `Résultat saisi : ${parsed.rolls.join(' + ')}`);
                }
            },
            {
                label: 'Lancer les dés',
                icon: 'sparkle',
                primary: true,
                onClick: () => {
                    const n = readDice();
                    if (n === 0) return finish(0, '');
                    if (!hd.faces) return showError('Choisissez d’abord le type de dé de vie (case « Dés de vie »), ou saisissez le total.');
                    const rolls = Array.from({ length: n }, () => rollDie(hd.faces));
                    return finish(hitDiceHealing(rolls, hd.conMod), `${n} × d${hd.faces} : ${rolls.join(' + ')}`);
                }
            }
        ],
        // Le résumé s'ouvre une fois cette fenêtre fermée (le focus est d'abord rendu au bouton)
        onClose: () => {
            if (result) setTimeout(() => showShortRestSummary(result, hd.conMod), 0);
        }
    });
}

function showShortRestSummary({ summary, rollText }, conMod) {
    // [texte, icône] : jet de dés, points de vie, dés restants, puis ressources récupérées (losange)
    const lines = [];
    if (summary.diceSpent > 0) {
        lines.push([`${rollText} (${signed(conMod)} par dé) : +${summary.healing} PV`, 'sparkle']);
        if (summary.hpAfter !== null) {
            const max = summary.hpMax !== null ? ` / ${summary.hpMax}` : '';
            lines.push([`PV : ${summary.hpBefore ?? 0} → ${summary.hpAfter}${max}`]);
        }
    }
    lines.push([`Dés de vie restants : ${summary.diceLeft}`]);
    for (const text of recoveryLines(summary, true)) lines.push([text]);
    const hint = slotRecoveryHint(summary);

    openModal({
        title: 'Repos court terminé',
        icon: 'hourglass',
        body: el('ul', { class: 'rest-summary' },
            lines.map(([text, name]) => iconLine(text, name)),
            hint && iconLine(hint, 'sparkle', 'muted')),
        actions: [{ label: 'OK', primary: true }]
    });
}

// ---------------------------------------------------------------------------
// Repos long
// ---------------------------------------------------------------------------

function longRestMessage(summary) {
    const effects = [
        summary.hpMax !== null ? `PV au maximum (${summary.hpMax})` : 'PV maximum non renseignés : PV actuels inchangés',
        'PV temporaires à 0',
        summary.hitDiceRecovered > 0
            ? `${plural(summary.hitDiceRecovered, 'dé')} de vie ${agree(summary.hitDiceRecovered, 'récupéré')} (tous)`
            : 'dés de vie déjà au complet',
        summary.exhaustionBefore > 0 ? `épuisement ${summary.exhaustionBefore} → ${summary.exhaustionAfter}` : null,
        'emplacements de sorts et ressources de classe récupérés',
        'jets contre la mort et bonus de combat remis à zéro'
    ].filter(Boolean);
    let message = `8 heures de repos, dont au moins 6 de sommeil. Effets : ${effects.join(', ')}.`;
    if (summary.heroicInspiration) message += ' Humain (Ingénieux) : vous gagnez l’Inspiration héroïque.';
    message += ' Pensez à changer vos sorts préparés si besoin.';
    if (!summary.canStart) message = `Attention, règle 2024 : il faut au moins 1 PV pour commencer un repos long. ${message}`;
    return message;
}

async function longRest(store, setStatus) {
    const ok = await confirmModal({
        title: 'Repos long (8 h)',
        icon: 'bed',
        message: longRestMessage(planLongRest(store.get()).summary),
        confirmLabel: 'Se reposer',
        confirmIcon: 'bed'
    });
    if (!ok) return;
    store.update(planLongRest(store.get()).patch);
    setStatus('Repos long terminé');
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initRest(ctx) {
    const { root, store, setStatus } = ctx;
    const container = root.querySelector('#rest-feature');
    if (!container) return;

    // Boutons de JEU : jamais masqués ni désactivés par le mode verrouillé
    const hint = el('output', { class: 'muted rest-hint', 'aria-live': 'polite' });
    const render = (character) => {
        const { available, level } = hitDiceState(character);
        const text = `${plural(available, 'dé')} de vie ${agree(available, 'disponible')} sur ${level}`;
        if (hint.textContent !== text) hint.textContent = text;
    };

    container.classList.add('rest-feature');
    const shortButton = el('button', {
        type: 'button', class: 'btn rest-btn',
        on: { click: () => openShortRest(store) }
    });
    const longButton = el('button', {
        type: 'button', class: 'btn rest-btn',
        on: { click: () => { longRest(store, setStatus); } }
    });
    // Une icône par repos : soleil (courte pause dans la journée), lit (la nuit) ;
    // la lune est celle du titre de la section
    setIconLabel(shortButton, 'hourglass', 'Repos court (1 h)');
    setIconLabel(longButton, 'bed', 'Repos long (8 h)');
    container.replaceChildren(el('div', { class: 'rest-actions' }, shortButton, longButton), hint);

    store.subscribe((character) => render(character));
    render(store.get());
}
