// =============================================================================
// FEEDBACK.JS - Réactions de la fiche au jeu (styles : css/feedback.css)
//  1. Rage active : <html data-rage="on">. Les cadres des armes, des points de vie et de
//     la ressource de classe s'embrasent (halo de braise dessiné par un calque .rage-aura
//     ajouté ici) et la pastille « Rage » devient incandescente. Au moment même où la Rage
//     s'allume (et seulement alors), <html data-rage-lit> déclenche l'embrasement puis
//     quelques respirations de la braise.
//  2. Jauge des points de vie sous « PV actuels » : décorative, les nombres font foi.
//  3. Valeur calculée qui change après une saisie (modificateur, bonus d'attaque, CA...) :
//     brève pulsation dorée. Jamais au chargement ni après un import (fiche remplacée).
// Les mouvements lancés ici respectent prefers-reduced-motion (relu à chaque usage).
// =============================================================================

import { classSlug, parseNumber } from '../rules/character.js';
import { effectiveBuffs } from '../rules/weapons.js';
import { el } from './dom.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const HP_FIELDS = ['hp_current', 'hp_max', 'hp_temp'];

/** Allumage de la Rage : embrasement (identique à css/feedback.css), puis respirations
 *  de la braise (5,5 × 2,6 s), avant que tout ne reste allumé sans bouger (ms) */
const RAGE_IGNITE_MS = 800;
const RAGE_LIT_MS = 15000;

/** Durée de la pulsation dorée (identique à css/feedback.css), plus une marge. Une valeur
 *  ne repulse pas avant la fin de sa pulsation : moins de 3 éclats par seconde, même
 *  pendant une frappe rapide ou une touche maintenue. */
const PULSE_MS = 420;
const PULSE_CLEANUP_MS = PULSE_MS + 80;

/** Valeurs calculées surveillées : sorties de la fiche et cases calculées des armes */
const WATCHED = '[data-out], .weapons-calc';

/**
 * @param {{ root: HTMLElement, store: Object, setStatus: (message: string) => void }} ctx
 */
export function initFeedback(ctx) {
    const { root, store } = ctx;
    initRage(root, store);
    initHpGauge(root, store);
    initValuePulse(root, store);
}

// ---------------------------------------------------------------------------
// 1. Rage
// ---------------------------------------------------------------------------

/**
 * Rage réellement active : bonus allumé ET proposé par la classe actuelle
 * (un bonus resté allumé après un changement de classe ne compte plus).
 * @param {Object} character
 * @returns {boolean}
 */
function rageActive(character) {
    return effectiveBuffs(classSlug(character.char_class), character.combat_buffs).rage;
}

function initRage(root, store) {
    const html = document.documentElement;

    // Cadres qui s'embrasent : les armes, les trois cases de points de vie et le compteur
    // de la ressource de classe (« Rages » : la Rage n'est active que pour un barbare).
    // Le halo est un calque à part (position absolue, sans effet sur la mise en page).
    const boxes = [
        root.querySelector('#weapons-feature'),
        ...HP_FIELDS.map(key => root.querySelector(`#f-${key}`)?.closest('.box')),
        root.querySelector('#class-resource')
    ];
    for (const box of boxes) {
        if (!box) continue;
        box.classList.add('rage-box');
        box.append(el('span', { class: 'rage-aura', 'aria-hidden': 'true' }));
    }

    // Allumage : embrasement (« ignite »), respirations (« breathe »), puis plus rien ne bouge
    let timers = [];
    const settle = () => {
        timers.forEach(clearTimeout);
        timers = [];
        delete html.dataset.rageLit;
    };
    const ignite = () => {
        settle();
        if (reducedMotion.matches || document.visibilityState !== 'visible') return;
        html.dataset.rageLit = 'ignite';
        timers.push(setTimeout(() => { html.dataset.rageLit = 'breathe'; }, RAGE_IGNITE_MS));
        timers.push(setTimeout(settle, RAGE_LIT_MS));
    };

    let previous = null;
    const apply = (character, changedKeys) => {
        const value = rageActive(character) ? 'on' : 'off';
        if (html.dataset.rage !== value) html.dataset.rage = value;
        // Seulement quand la Rage s'allume vraiment : ni au chargement, ni quand une fiche
        // déjà en Rage remplace la fiche (import, nouvelle fiche), ni au retour sur l'onglet
        if (value === 'off') settle();
        else if (previous === 'off' && changedKeys !== null) ignite();
        previous = value;
    };
    store.subscribe(apply);
    apply(store.get(), null);
}

// ---------------------------------------------------------------------------
// 2. Jauge des points de vie
// ---------------------------------------------------------------------------

/** Teinte de la jauge (roue des couleurs) : 120 = vert à pleine santé, 60 = jaune, 30 = orange, 0 = rouge */
const HP_HUE_FULL = 120;

/**
 * Proportions de la jauge (de 0 à 1) à partir des valeurs saisies, même absentes ou
 * incohérentes (texte, négatif, plus que le maximum).
 * @param {Object} character
 * @returns {{ known: boolean, fill: number, tempStart: number, tempSize: number, over: boolean }}
 */
function hpGaugeModel(character) {
    const max = parseNumber(character.hp_max, NaN);
    const current = parseNumber(character.hp_current, NaN);
    const temp = Math.max(0, parseNumber(character.hp_temp, 0));
    if (!(max > 0) || Number.isNaN(current)) {
        return { known: false, fill: 0, tempStart: 0, tempSize: 0, over: false };
    }
    const fill = Math.min(1, Math.max(0, current / max));
    // PV temporaires : segment placé après les PV actuels ; s'il n'y a plus la place,
    // il recouvre la fin de la jauge (il reste toujours visible en entier)
    const tempSize = Math.min(1, temp / max);
    const tempStart = Math.max(0, Math.min(fill, 1 - tempSize));
    return { known: true, fill, tempStart, tempSize, over: current > max };
}

/**
 * Teinte de la jauge : dégradé continu du vert (pleins PV) au rouge (0 PV), en passant
 * par le jaune et l'orange.
 * @param {number} ratio PV actuels / PV maximum (0 à 1)
 * @returns {number} teinte en degrés
 */
const hpHue = (ratio) => Math.round(Math.max(0, Math.min(1, ratio)) * HP_HUE_FULL);

function initHpGauge(root, store) {
    const tile = root.querySelector('#f-hp_current')?.closest('.box');
    if (!tile) return;

    const gauge = el('span', { class: 'hp-gauge', 'aria-hidden': 'true' },
        el('span', { class: 'hp-gauge-fill' }),
        el('span', { class: 'hp-gauge-temp' }));
    tile.classList.add('hp-tile');
    tile.append(gauge);

    let signature = '';
    const apply = (character) => {
        const model = hpGaugeModel(character);
        // Jauge masquée (valeurs absentes) : teinte de pleine santé, pour ne pas partir du rouge
        const hue = hpHue(model.known ? model.fill : 1);
        const next = [model.known, model.fill, model.tempStart, model.tempSize, model.over, hue].join('|');
        if (next === signature) return;
        signature = next;

        gauge.dataset.state = model.known ? 'known' : 'unknown';
        gauge.dataset.over = String(model.over);
        gauge.dataset.temp = String(model.tempSize > 0);
        gauge.style.setProperty('--hp-fill', model.fill.toFixed(4));
        gauge.style.setProperty('--hp-hue', String(hue));
        gauge.style.setProperty('--hp-temp-start', model.tempStart.toFixed(4));
        gauge.style.setProperty('--hp-temp-size', model.tempSize.toFixed(4));
    };
    store.subscribe(apply);
    apply(store.get());
}

// ---------------------------------------------------------------------------
// 3. Pulsation dorée des valeurs calculées
// ---------------------------------------------------------------------------

function initValuePulse(root, store) {
    /** Dernier texte connu de chaque valeur : une pulsation seulement s'il a changé */
    const seen = new WeakMap();
    const timers = new WeakMap();
    /** Début de la dernière pulsation de chaque valeur */
    const started = new WeakMap();
    const pending = new Set();
    let frame = 0;
    // Fiche remplacée (import, chargement en ligne, nouvelle fiche) : pas de pulsation
    let replaced = false;

    for (const node of root.querySelectorAll(WATCHED)) seen.set(node, node.textContent);

    const pulse = (node) => {
        // Pulsation encore en cours : elle va au bout, sans repartir de zéro (pas de
        // clignotement rapide pendant la frappe)
        const now = performance.now();
        if (now - (started.get(node) ?? -Infinity) < PULSE_MS) return;
        started.set(node, now);
        // Deux classes identiques en alternance : une nouvelle pulsation repart de zéro
        // même si la classe de la précédente n'est pas encore retirée (sans relire la mise en page)
        const next = node.classList.contains('is-pulsing-a') ? 'is-pulsing-b' : 'is-pulsing-a';
        node.classList.remove('is-pulsing-a', 'is-pulsing-b');
        node.classList.add(next);
        clearTimeout(timers.get(node));
        // Retrait par minuterie et non sur « animationend » : une valeur d'un onglet masqué
        // n'anime rien et ne doit pas pulser plus tard, à l'ouverture de l'onglet
        timers.set(node, setTimeout(() => node.classList.remove(next), PULSE_CLEANUP_MS));
    };

    // Regroupement par image : une seule passe même si une saisie change trente valeurs
    const flush = () => {
        frame = 0;
        const quiet = replaced || reducedMotion.matches;
        replaced = false;
        for (const node of pending) {
            const text = node.textContent;
            const before = seen.get(node);
            seen.set(node, text);
            // Valeur apparue (ligne d'arme ajoutée) : mémorisée, sans pulsation
            if (quiet || before === undefined || before === text || !node.isConnected) continue;
            pulse(node);
        }
        pending.clear();
    };
    const schedule = () => {
        if (!frame) frame = requestAnimationFrame(flush);
    };

    const observer = new MutationObserver((records) => {
        for (const record of records) {
            const target = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
            const node = target?.closest(WATCHED);
            if (node) pending.add(node);
        }
        if (pending.size) schedule();
    });
    const options = { childList: true, characterData: true, subtree: true };
    for (const node of root.querySelectorAll('[data-out]')) observer.observe(node, options);
    // Lignes des armes : recréées quand on en ajoute ou retire une, d'où le tableau entier
    const weaponsBody = root.querySelector('#weapons-feature tbody');
    if (weaponsBody) observer.observe(weaponsBody, options);

    store.subscribe((_state, changedKeys) => {
        if (changedKeys !== null) return;
        replaced = true;
        schedule(); // efface l'indicateur même si aucune valeur affichée n'a changé
    });
}
