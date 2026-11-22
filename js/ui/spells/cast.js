// =============================================================================
// SPELLS/CAST.JS - Fenêtre « Lancer » d'un sort (vue « au combat » du grimoire)
//
// Niveaux d'emplacement possibles (niveau du sort et au-dessus, emplacements de pacte compris),
// lancer en rituel (sans emplacement) pour un sort marqué R, Concentration proposée pour un sort
// marqué C. Un sort qui a un lancer gratuit suivi par la fiche (don, espèce, Ennemi juré du
// Rôdeur, quelques sous-classes : js/rules/free-casts.js) propose d'abord « Lancer gratuit »,
// qui coche la case existante de la capacité au lieu d'un emplacement. Arcanum mystique
// (Occultiste) : dit dans la fenêtre, rien n'est coché.
// Contrôle de JEU : utilisable fiche verrouillée.
//  - Lit : la fiche (emplacements, concentration en cours, lancers gratuits), la base de sorts
//    (g.spellsDb, pour savoir si une ligne du tableau est un rituel).
//  - Écrit : spell_slots_state (un emplacement coché), la case du lancer gratuit, la
//    concentration (js/rules/concentration.js), et un message dans la barre du haut.
// Règles : js/rules/spell-preparation.js (castSlotOptions, castModes, useSpellSlot).
// =============================================================================

import { derivedOf } from '../derived.js';
import { plainText, spellNames, findSpellByName, rowLevel } from '../../rules/spells.js';
import {
    isCastable, castModes, castSlotOptions, useSpellSlot, mysticArcanumLevel, isArcanumSpellLevel, arcanumCastText
} from '../../rules/spell-preparation.js';
import { isRitualSpell } from '../../rules/spellbook.js';
import { concentrationSpell, setConcentrationPatch } from '../../rules/concentration.js';
import { freeCastsFor, useFreeCastPatch, FREE_CAST_RESET_TEXT } from '../../rules/free-casts.js';
import { el } from '../dom.js';
import { openModal } from '../modal.js';
import { frenchSpaces } from '../help.js';
import { slotStateOf } from './slots.js';

/** Fenêtre « Lancer » : ce que fait le bouton « Lancer gratuit », dit dans la fenêtre (tablette) */
const FREE_CAST_HELP = "« Lancer gratuit » : sans emplacement ; c'est la case de la capacité qui se coche, là où elle est déjà sur la fiche.";
/** Où se trouve la case d'un lancer gratuit qui n'est pas sur l'onglet Magie (Ennemi juré du Rôdeur) */
const FREE_CAST_CLASS_PLACE = ' (onglet « Caractéristiques & Combat »)';

/**
 * Lancer la ligne d'indice donné (bouton « Lancer » du tableau, ou de la ligne « Rituels du
 * livre ») : choisir un niveau coche un emplacement de ce niveau, le décocher suffit à annuler.
 * @param {import('./context.js').Grimoire} g
 * @param {number} index - indice dans dynamic_spells
 * @param {string|null} state - état « préparé » de la ligne (js/rules/spell-preparation.js)
 */
export function castRowAt(g, index, state) {
    const row = g.spellsOf()[index];
    if (!row || !isCastable(state)) return;
    // Rituel : case R cochée ou base de sorts, préparé ou non (même règle que le losange)
    const known = findSpellByName(g.spellsDb, row.name);
    const { ritual, ritualOnly } = castModes(state, isRitualSpell(row, known));
    castSpell(g, {
        name: plainText(row.name), level: Number(rowLevel(row)), concentration: row.c === true,
        names: [plainText(row.name), ...spellNames(known), known?.vo],
        ritual, ritualOnly,
        ritualOnlyText: ritualOnly ? 'Sort non préparé : depuis votre livre, il se lance seulement en rituel (Savoir rituel).' : ''
    });
}

/**
 * Fenêtre « Lancer » d'un sort préparé (ligne du tableau, ou sort donné par un don, la
 * sous-classe ou l'espèce : spells/granted.js).
 * @param {{ store: Object, setStatus: (message: string) => void }} g - contexte du grimoire
 * @param {{ name: string, level: number, concentration?: boolean, ritual?: boolean, ritualOnly?: boolean, ritualOnlyText?: string, names?: string[] }} spell
 *        names : tous les noms du sort (noté, français, anglais), pour retrouver ses lancers gratuits
 *        ritualOnly : sort qui ne se lance qu'en rituel (sort donné par la Voie du Cœur sauvage,
 *        rituel du livre non préparé du Magicien) ; ritualOnlyText : la raison, dite dans la fenêtre
 */
export function castSpell({ store, setStatus }, { name: spellName, level, concentration: needsConcentration = false, ritual = false, ritualOnly = false, ritualOnlyText = '', names = [] }) {
    const character = store.get();
    const d = derivedOf(character);
    const name = spellName || 'ce sort';
    const options = ritualOnly ? [] : castSlotOptions(level, d.spellSlots, d.classSlug, slotStateOf(character));
    // Lancers gratuits suivis par la fiche (don, espèce, Ennemi juré…), proposés en premier
    const free = ritualOnly ? [] : freeCastsFor(character, d, [spellName, ...names]);
    const freeLeft = free.some(cast => cast.left > 0);
    const current = concentrationSpell(character);
    // Arcanum mystique (Occultiste) : sort de niveau 6+ sans emplacement de son niveau, lancé une
    // fois par repos long sans emplacement. La fiche n'a pas de case pour lui : la fenêtre le dit
    // (au lieu de « Aucun emplacement »), et le bouton ne change que la concentration
    const arcanum = !ritualOnly && options.length === 0 && isArcanumSpellLevel(level, mysticArcanumLevel(d.classSlug, d.level));
    // Sort impossible à lancer (plus aucun emplacement, pas de rituel) : pas de case Concentration
    const castable = ritual || freeLeft || arcanum || options.some(option => option.left > 0);
    const concentration = castable && needsConcentration && current !== name.slice(0, 80)
        ? el('input', { type: 'checkbox', class: 'round-check', checked: true })
        : null;
    let close = () => {};

    const finish = (patch, message) => {
        const now = store.get();
        if (concentration?.checked) Object.assign(patch, setConcentrationPatch(now, name));
        if (Object.keys(patch).length) store.update(patch);
        setStatus(message);
        close();
    };
    const castAt = (slotLevel) => {
        const now = store.get();
        const next = useSpellSlot(slotStateOf(now), slotLevel, derivedOf(now).spellSlots[slotLevel] ?? 0);
        if (!next) {
            setStatus(`Plus aucun emplacement de niveau ${slotLevel}.`);
            close();
            return;
        }
        finish({ spell_slots_state: next },
            `${name} : emplacement de niveau ${slotLevel} coché. Pour annuler, décochez-le.`);
    };

    const castFree = (cast) => {
        const now = store.get();
        const patch = useFreeCastPatch(now, derivedOf(now), cast.id);
        if (!patch) {
            setStatus(`${cast.label} : plus aucun lancer gratuit, il ${FREE_CAST_RESET_TEXT[cast.reset]}.`);
            close();
            return;
        }
        finish(patch, cast.kind === 'class'
            ? `${name} : lancer gratuit (${cast.label}). Pour annuler, décochez sa case (onglet Combat).`
            : `${name} : lancer gratuit (${cast.label}), sa case est cochée. Pour annuler, décochez-la.`);
    };

    const anyLeft = options.some(option => option.left > 0);
    // « Lancer gratuit (Ennemi juré) — reste 2 » ; épuisé : grisé, avec le repos qui le rend
    const freeButtons = free.map(cast => el('button', {
        type: 'button', class: 'btn spell-cast-level spell-cast-free', disabled: cast.left === 0,
        on: { click: () => castFree(cast) }
    }, el('span', { class: 'btn-label', text: `Lancer gratuit (${cast.label})` }),
    el('small', { class: 'spell-cast-left', text: cast.left === 0 ? `déjà utilisé, ${FREE_CAST_RESET_TEXT[cast.reset]}` : `reste ${cast.left}` })));
    const levelButtons = options.map(option => el('button', {
        type: 'button', class: 'btn spell-cast-level', disabled: option.left === 0,
        on: { click: () => castAt(option.level) }
    }, el('span', { class: 'btn-label', text: `${option.pact ? 'Pacte · ' : ''}Niveau ${option.level}` }),
    el('small', { class: 'spell-cast-left', text: option.left === 0 ? 'plus aucun' : `reste ${option.left}` })));
    const ritualButton = ritual ? el('button', {
        type: 'button', class: 'btn spell-cast-level',
        on: { click: () => finish({}, `${name} lancé en rituel : 10 minutes de plus, aucun emplacement dépensé.`) }
    }, el('span', { class: 'btn-label', text: 'En rituel' }), el('small', { class: 'spell-cast-left', text: '+10 min, sans emplacement' })) : null;

    const arcanumButton = arcanum ? el('button', {
        type: 'button', class: 'btn spell-cast-level spell-cast-free',
        on: { click: () => finish({}, `${name} : Arcanum mystique, sans emplacement. Rien n'est coché, à vous de le retenir.`) }
    }, el('span', { class: 'btn-label', text: 'Arcanum mystique' }), el('small', { class: 'spell-cast-left', text: 'sans emplacement, 1 fois par repos long' })) : null;

    const facts = [`Sort de niveau ${level}`, needsConcentration ? 'Concentration' : '', ritual ? 'Rituel' : ''].filter(Boolean).join(' · ');
    // Sort qui se lance seulement en rituel : cas permis, dit en texte normal (pas en rouge)
    const ritualNote = ritualOnly ? ritualOnlyText || 'Ce sort se lance seulement en rituel.' : '';
    const missing = ritualOnly || arcanum ? ''
        : options.length === 0
        ? `Aucun emplacement de niveau ${level} ou plus.`
        : anyLeft ? '' : `Plus aucun emplacement de niveau ${level} ou plus : ils reviennent au repos ${options.every(o => o.pact) ? 'court ou long' : 'long'}.`;
    close = openModal({
        title: `Lancer ${name}`,
        icon: 'sparkle',
        focusField: false,
        body: [
            // Ce que fait un bouton de niveau, dit en clair (pas d'infobulle au toucher)
            el('p', { text: `${facts}. ${anyLeft ? "Touchez le niveau de l'emplacement à dépenser : sa case se coche dans le grimoire." : ''}`.trim() }),
            free.length ? el('p', { class: 'spell-cast-free-help', text: frenchSpaces(FREE_CAST_HELP) }) : null,
            ritualNote ? el('p', { text: ritualNote }) : null,
            arcanum ? el('p', { text: arcanumCastText(level) }) : null,
            missing ? el('p', { class: 'spell-cast-missing', text: missing }) : null,
            freeButtons.length || levelButtons.length || ritualButton || arcanumButton
                ? el('div', { class: 'spell-cast-levels' }, freeButtons, arcanumButton, levelButtons, ritualButton) : null,
            concentration ? el('label', { class: 'spell-cast-concentration' }, concentration,
                el('span', {
                    text: current ? `Me concentrer sur ce sort (met fin à la concentration sur ${current})`
                        : "Me concentrer sur ce sort (noté dans « États », onglet Combat)"
                })) : null,
            anyLeft || freeLeft ? el('p', { class: 'muted', text: freeLeft
                ? frenchSpaces(`Pour annuler : décochez l'emplacement dans le grimoire, ou la case du lancer gratuit${free.some(cast => cast.kind === 'class') ? FREE_CAST_CLASS_PLACE : ''}.`)
                : 'Pour annuler : décochez l\'emplacement dans le grimoire.' }) : null
        ].filter(Boolean),
        actions: [{ label: 'Annuler' }]
    });
    [...freeButtons, arcanumButton, ...levelButtons, ritualButton].find(button => button && !button.disabled)?.focus();
}
