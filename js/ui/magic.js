// =============================================================================
// MAGIC.JS - Aspect des armes et armures magiques (styles : css/magic.css)
//
// Une arme ou une armure réglée en « Bonus magique » (+1 à +3, engrenage de la ligne) se
// distingue dans son tableau, de plus en plus fort :
//  - +1, éveillée : filet d'or à gauche, voile doré, nom en or, pastille « +1 », reflet rare ;
//  - +2, enchantée : + cadre doré, halo qui respire, nom qui brille, paillettes, étoile ;
//  - +3, légendaire : + cadre épais parcouru d'un trait de lumière, runes qui s'allument,
//    inscription runique qui défile en haut et en bas, braises, rayons derrière la pastille.
// Toucher la pastille (ou régler un nouveau bonus) joue l'enchantement : éclat, onde d'or et
// gerbe d'étincelles, d'autant plus fournie que le bonus est grand ; la barre d'état dit l'effet.
//
// Seul le réglage « Bonus magique » compte (jamais le nom saisi) ; rien n'est écrit dans la
// fiche. Animations coupées (appareil ou bouton « Animations », motion-pref.js) : rien ne
// bouge, les ors, cadres et runes restent. Les décors (calques sans effet sur la mise en page)
// ne sont créés que pour une ligne magique.
// =============================================================================

import { el } from './dom.js';
import { motionOff } from './motion-pref.js';

/** Calque des décors de chaque ligne magique observée */
const fxByRow = new WeakMap();

/** Largeur de la ligne donnée au calque des décors (il part de la case du nom) */
const rowWidths = typeof ResizeObserver === 'function'
    ? new ResizeObserver((entries) => {
        for (const { target } of entries) {
            const fx = fxByRow.get(target);
            if (fx) fx.style.setProperty('--magic-row-width', `${target.getBoundingClientRect().width}px`);
        }
    })
    : null;

/** Bonus magique le plus haut (DMG 2024) */
export const MAGIC_MAX = 3;

/** Attente avant l'enchantement d'un bonus tout juste réglé : la fenêtre est refermée et la
 *  ligne redessinée (ms) */
export const ENCHANT_DELAY_MS = 300;

/** Paillettes et braises (le +2 en montre 5, le +3 toutes : voir css/magic.css) */
const MOTES = 9;

/** Enchantement : étincelles, portée de la gerbe (px) et taille finale de l'onde, par palier */
const BURST = {
    1: { sparks: 7, spread: 80, ring: 7 },
    2: { sparks: 12, spread: 120, ring: 10 },
    3: { sparks: 20, spread: 170, ring: 14 }
};

/** Durée de vie des étincelles (ms), un peu plus que leur animation (css/magic.css) */
const BURST_MS = 1300;

/**
 * Palier magique d'une valeur de bonus : 0 (objet ordinaire) à 3
 * @param {*} bonus
 * @returns {number}
 */
export function magicLevel(bonus) {
    const value = Number(bonus);
    return Number.isInteger(value) && value > 0 ? Math.min(value, MAGIC_MAX) : 0;
}

/**
 * Prépare la case du nom : le champ, suivi de la pastille (cachée tant que l'objet n'est pas
 * magique), et le calque des décors. Le calque part de la case du nom (positionnée par
 * css/magic.css) et prend la largeur de toute la ligne (setMagic).
 * @param {HTMLElement} input - champ du nom
 * @param {(parts: Object) => void} onTap - pastille touchée
 * @returns {{ name: HTMLElement, fx: HTMLElement, gem: HTMLButtonElement, face: HTMLElement, level: number }}
 */
export function createMagicParts(input, onTap) {
    const face = el('span', { class: 'magic-gem-face' });
    const parts = { level: 0 };
    const gem = el('button', {
        type: 'button', class: 'magic-gem', hidden: true,
        on: { click: () => onTap(parts) }
    }, face);
    Object.assign(parts, {
        name: el('span', { class: 'magic-name' }, input, gem),
        fx: el('span', { class: 'magic-fx', 'aria-hidden': 'true', hidden: true }),
        gem,
        face
    });
    return parts;
}

/** Calques des décors (créés une seule fois par ligne, à la première fois qu'elle est magique) */
function decor() {
    const motes = Array.from({ length: MOTES }, (_, i) => {
        const mote = el('span', { class: 'magic-mote' });
        // Réparties sans hasard : même aspect à chaque affichage
        mote.style.left = `${6 + ((i * 37) % 88)}%`;
        mote.style.setProperty('--magic-mote-delay', `${((i * 1.37) % 4).toFixed(2)}s`);
        mote.style.setProperty('--magic-mote-time', `${(3.3 + ((i * 0.71) % 2.4)).toFixed(2)}s`);
        return mote;
    });
    return [
        el('span', { class: 'magic-halo' }),
        el('span', { class: 'magic-bg' },
            el('span', { class: 'magic-glow' }),
            el('span', { class: 'magic-runes' }, el('span', { class: 'magic-runes-light' })),
            el('span', { class: 'magic-glint' }),
            motes),
        el('span', { class: 'magic-sparks' }),
        el('span', { class: 'magic-frame' }),
        el('span', { class: 'magic-beam' }, el('span', { class: 'magic-beam-light' })),
        el('span', { class: 'magic-frieze is-top' }, el('span', { class: 'magic-frieze-text' })),
        el('span', { class: 'magic-frieze is-bottom' }, el('span', { class: 'magic-frieze-text' })),
        el('span', { class: 'magic-fil' })
    ];
}

/**
 * Applique (ou retire) l'aspect magique d'une ligne. Le message (parts.message) est celui
 * qu'écrit la barre d'état quand on touche la pastille.
 * @param {ReturnType<typeof createMagicParts>} parts
 * @param {HTMLTableRowElement} row
 * @param {number} bonus - bonus magique réglé (0 : objet ordinaire)
 * @param {{ label: string, effect: string }} text - nom lisible de l'objet (« l'arme « Hache » »)
 *   et effet du bonus (« +2 aux jets d'attaque et de dégâts »)
 */
export function setMagic(parts, row, bonus, { label, effect }) {
    const level = magicLevel(bonus);
    parts.level = level;
    parts.message = level ? `${label} : objet magique +${level}, ${effect}.` : '';
    if (level && !parts.fx.firstChild) parts.fx.append(...decor());
    if (level) row.dataset.magic = String(level);
    else delete row.dataset.magic;
    // Le calque suit la largeur de la ligne (rotation de la tablette, colonnes qui changent)
    if (level && !fxByRow.has(row)) {
        fxByRow.set(row, parts.fx);
        rowWidths?.observe(row);
    } else if (!level && fxByRow.has(row)) {
        fxByRow.delete(row);
        rowWidths?.unobserve(row);
    }
    parts.fx.hidden = !level;
    parts.gem.hidden = !level;
    if (!level) return;
    if (!rowWidths) parts.fx.style.setProperty('--magic-row-width', `${row.getBoundingClientRect().width}px`);
    if (parts.face.textContent !== `+${level}`) parts.face.textContent = `+${level}`;
    parts.gem.setAttribute('aria-label', `${label} : objet magique +${level}, voir l'effet`);
    parts.gem.title = `Objet magique +${level} : ${effect}`;
}

/**
 * Enchantement : onde d'or et gerbe d'étincelles depuis la pastille, la ligne s'illumine.
 * Rien si les animations sont coupées, la ligne cachée ou l'onglet en arrière-plan.
 * @param {ReturnType<typeof createMagicParts>} parts
 * @param {HTMLTableRowElement} row
 */
export function enchant(parts, row) {
    const burst = BURST[parts.level];
    if (!burst || motionOff() || document.visibilityState !== 'visible') return;
    // Repère : le calque des décors (il commence au bord gauche de la ligne)
    const box = parts.fx.getBoundingClientRect();
    const gem = parts.face.getBoundingClientRect();
    if (!box.width || !gem.width) return;
    const x = gem.left - box.left + gem.width / 2;
    const y = gem.top - box.top + gem.height / 2;
    const layer = el('span', { class: 'magic-burst' });
    layer.style.left = `${x}px`;
    layer.style.top = `${y}px`;
    const rings = parts.level === MAGIC_MAX ? [1, 1.7] : [1];
    for (const [i, scale] of rings.entries()) {
        const ring = el('span', { class: 'magic-ring' });
        ring.style.setProperty('--magic-ring-size', String(burst.ring * scale));
        ring.style.animationDelay = `${i * 150}ms`;
        layer.append(ring);
    }
    for (let i = 0; i < burst.sparks; i++) {
        const spark = el('span', { class: 'magic-spark' });
        const angle = (i / burst.sparks) * Math.PI * 2 + Math.random() * 0.4;
        const distance = burst.spread * (0.45 + Math.random() * 0.55);
        // Gerbe aplatie : la ligne est bien plus large que haute
        spark.style.setProperty('--magic-dx', `${(Math.cos(angle) * distance).toFixed(1)}px`);
        spark.style.setProperty('--magic-dy', `${(Math.sin(angle) * distance * 0.45).toFixed(1)}px`);
        spark.style.animationDelay = `${Math.round(Math.random() * 90)}ms`;
        layer.append(spark);
    }
    // La ligne s'illumine un instant autour de la pastille
    const flash = el('span', { class: 'magic-flash' });
    flash.style.setProperty('--magic-flash-x', `${Math.round((x / box.width) * 100)}%`);
    parts.fx.querySelector('.magic-sparks').append(flash, layer);
    setTimeout(() => {
        layer.remove();
        flash.remove();
    }, BURST_MS);
}
