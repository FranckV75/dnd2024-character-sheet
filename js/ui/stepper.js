// =============================================================================
// STEPPER.JS - Boutons − / + autour d'une case de nombre (PV, Épuisement, Inspiration…)
//
// Un toucher ou un clic : un pas. Appui long : répétition, de plus en plus rapide ; le clic qui
// suit le relâchement est ignoré (sinon un pas de trop). Pas de menu du système à l'appui long.
// La règle du pas (bornes, valeur écrite) appartient à l'appelant : onStep(delta) rend true si
// la valeur a changé (sinon la répétition s'arrête).
// Mise en forme : css/stepper.css.
// =============================================================================

import { el, icon } from './dom.js';

const HOLD_DELAY = 450;
const REPEAT_SLOW = 140;
const REPEAT_FAST = 50;
const FAST_AFTER = 8;

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
            if (!onStep()) {
                stop();
                return;
            }
            timer = setTimeout(repeat, count >= FAST_AFTER ? REPEAT_FAST : REPEAT_SLOW);
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
 * Entoure une case de boutons − et + (rangée .stepper).
 * @param {HTMLElement} input
 * @param {{ noun: string, onStep: (delta: number) => boolean, className?: string, rowClass?: string }} options
 * @returns {{ row: HTMLElement, minus: HTMLButtonElement, plus: HTMLButtonElement }}
 */
export function wrapWithSteppers(input, { noun, onStep, className = '', rowClass = '' }) {
    const row = el('div', { class: `stepper ${rowClass}`.trim() });
    input.before(row);
    const minus = stepButton({ label: `Retirer 1 ${noun}`, iconName: 'minus', onStep: () => onStep(-1), className });
    const plus = stepButton({ label: `Ajouter 1 ${noun}`, iconName: 'plus', onStep: () => onStep(1), className });
    row.append(minus, input, plus);
    return { row, minus, plus };
}
