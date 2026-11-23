// =============================================================================
// STEPPER.JS - Boutons − / + autour d'une case de nombre (PV, Épuisement, Inspiration…)
//
// Un toucher ou un clic : un pas. Appui long : répétition, de plus en plus rapide ; le clic qui
// suit le relâchement est ignoré (sinon un pas de trop). Pas de menu du système à l'appui long.
// La règle du pas (bornes, valeur écrite) appartient à l'appelant : onStep(delta) rend true si
// la valeur a changé (sinon la répétition s'arrête).
// Deux dispositions : autour de la case (rangée .stepper, boutons de 36 px au doigt) ou, plus
// discrets, autour du titre de la case (option around : rangée .label-steps, petits boutons
// ronds ; choix de Franck, 23/11/2026, pour les Points de Foi et les Points de renommée).
// Mise en forme : css/stepper.css.
// =============================================================================

import { el, icon } from './dom.js';

const HOLD_DELAY = 450;
const REPEAT_SLOW = 140;
const REPEAT_FAST = 50;
const FAST_AFTER = 8;

/**
 * Attente avant le pas suivant d'un appui long : le rythme (lent, puis rapide après FAST_AFTER
 * pas) compte depuis le DÉBUT du pas, pour que le temps d'affichage de la fiche ne ralentisse
 * pas la répétition sur une tablette lente (un pas tous les 50 ms, et non 50 ms + l'affichage).
 * @param {number} count - pas déjà faits pendant cet appui
 * @param {number} spent - durée du pas qui vient d'être fait (ms)
 * @returns {number} ms
 */
export function repeatDelay(count, spent) {
    const rhythm = count >= FAST_AFTER ? REPEAT_FAST : REPEAT_SLOW;
    return Math.max(0, rhythm - Math.max(0, spent));
}

/**
 * @param {{ label: string, iconName: 'minus'|'plus', onStep: () => boolean, className?: string }} options
 * @returns {HTMLButtonElement}
 */
export function stepButton({ label, iconName, onStep, className = '' }) {
    const button = el('button', {
        type: 'button', class: `btn-icon step-btn ${className}`.trim(), 'aria-label': label, title: `${label} (appui long : plusieurs)`
    }, icon(iconName));

    let timer = null;
    let repeated = false;
    const stop = () => {
        clearTimeout(timer);
        timer = null;
    };
    button.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || button.disabled) return;
        stop();
        repeated = false;
        let count = 0;
        const repeat = () => {
            repeated = true;
            count += 1;
            const started = performance.now();
            if (!onStep()) {
                stop();
                return;
            }
            timer = setTimeout(repeat, repeatDelay(count, performance.now() - started));
        };
        timer = setTimeout(repeat, HOLD_DELAY);
    });
    // Le clic qui suit un appui long est ignoré. Au doigt, il arrive bien après le relâchement
    // (tâche séparée) : l'indicateur n'est donc remis à zéro qu'au prochain appui, ou par ce clic.
    // Un clic venu du clavier (detail 0 : Entrée, Espace) compte toujours.
    for (const type of ['pointerup', 'pointerleave', 'pointercancel']) button.addEventListener(type, stop);
    button.addEventListener('contextmenu', (event) => event.preventDefault());
    button.addEventListener('click', (event) => {
        if (repeated && event.detail !== 0) {
            repeated = false;
            return;
        }
        onStep();
    });
    return button;
}

/**
 * Noms des boutons − et + d'une case (« Retirer 1 point de Foi », « Ajouter 1 point de Foi »).
 * @param {string} noun - ce que compte la case, au singulier
 * @returns {{ minus: string, plus: string }}
 */
export function stepperLabels(noun) {
    return { minus: `Retirer 1 ${noun}`, plus: `Ajouter 1 ${noun}` };
}

/** Boutons − et + de chaque case entourée (renameSteppers, steppersOf) */
const STEPPERS = new WeakMap();

/**
 * Entoure une case de boutons − et + (rangée .stepper), ou son titre (option around : rangée
 * .label-steps à la place du titre, la case reste seule dessous).
 * @param {HTMLElement} input
 * @param {{ noun: string, onStep: (delta: number) => boolean, className?: string, rowClass?: string,
 *   around?: HTMLElement|null }} options - around : titre de la case (son <label>)
 * @returns {{ row: HTMLElement, minus: HTMLButtonElement, plus: HTMLButtonElement }}
 */
export function wrapWithSteppers(input, { noun, onStep, className = '', rowClass = '', around = null }) {
    const labels = stepperLabels(noun);
    const mini = around ? 'is-mini' : '';
    const minus = stepButton({ label: labels.minus, iconName: 'minus', onStep: () => onStep(-1), className: `${className} ${mini}`.trim() });
    const plus = stepButton({ label: labels.plus, iconName: 'plus', onStep: () => onStep(1), className: `${className} ${mini}`.trim() });
    const row = el('div', { class: `${around ? 'label-steps' : 'stepper'} ${rowClass}`.trim() });
    const anchor = around ?? input;
    anchor.before(row);
    row.append(minus, anchor, plus);
    STEPPERS.set(input, { minus, plus });
    return { row, minus, plus };
}

/**
 * Boutons − et + d'une case entourée par wrapWithSteppers (null sinon).
 * @param {HTMLElement} input
 * @returns {{ minus: HTMLButtonElement, plus: HTMLButtonElement }|null}
 */
export function steppersOf(input) {
    return STEPPERS.get(input) ?? null;
}

/**
 * Renomme les boutons − et + qui entourent une case (ce qu'elle compte a changé de nom : « point
 * de Foi » ou « Inspiration héroïque » selon le mode Odyssée, js/ui/odyssey.js).
 * @param {HTMLElement} input - case entourée par wrapWithSteppers
 * @param {string} noun
 */
export function renameSteppers(input, noun) {
    const buttons = steppersOf(input);
    const labels = stepperLabels(noun);
    for (const [button, label] of [[buttons?.minus, labels.minus], [buttons?.plus, labels.plus]]) {
        if (!button || button.getAttribute('aria-label') === label) continue;
        button.setAttribute('aria-label', label);
        button.title = `${label} (appui long : plusieurs)`;
    }
}
