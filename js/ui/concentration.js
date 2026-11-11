// =============================================================================
// CONCENTRATION.JS (interface) - Ligne « Concentration » en tête de l'encadré « États »
//
// Menu du sort sur lequel le personnage se concentre (sorts « C » du grimoire, et sorts donnés par
// les dons, l'espèce ou la sous-classe qui demandent la Concentration), puis le rappel : jet de
// sauvegarde de Constitution chiffré après des dégâts, Avantage (Mage de guerre), fin sous l'état
// Neutralisé avec un bouton « Terminer ». Le pavé « Dégâts / Soins » (js/ui/hit-points.js) donne
// le DD exact. Champ de jeu : utilisable fiche verrouillée. Règles : js/rules/concentration.js.
// =============================================================================

import { el, icon } from './dom.js';
import { derivedOf } from './derived.js';
import {
    concentrationOptions, concentrationView, setConcentrationPatch, CONCENTRATION_KEY
} from '../rules/concentration.js';
import { CONDITIONS } from '../data/conditions.js';
import { loadSpells } from '../data/spells.js';
import { featSpellGroups } from '../rules/feat-spells.js';
import { subclassSpells } from '../rules/subclass-features.js';
import { speciesView } from '../rules/species.js';

const signed = (n) => (n >= 0 ? `+${n}` : `${n}`);
// Tout ce qui change le menu ou le jet de Constitution (maîtrise, Aura de protection au Charisme, Rage)
const WATCHED = new Set([CONCENTRATION_KEY, 'dynamic_spells', 'conditions', 'combat_buffs', 'con_score', 'con_save_prof', 'cha_score',
    'char_level', 'char_class', 'char_subclass',
    'char_species', 'species_choices', 'feat_choices', 'subclass_choices']);

/**
 * Sorts donnés (dons, espèce, sous-classe) qui demandent la Concentration, d'après la base des sorts.
 * @returns {string[]} noms français
 */
function grantedConcentration(character, derived, byVo) {
    if (!byVo.size) return [];
    const spells = [
        ...featSpellGroups(character, derived).flatMap((group) => group.spells),
        ...subclassSpells(derived).reached,
        ...(speciesView(character, derived)?.spells ?? []).filter((spell) => spell.reached)
    ];
    return spells.filter((spell) => byVo.get(spell.vo)?.concentration).map((spell) => spell.name);
}

/**
 * @param {{ root: HTMLElement, store: Object }} ctx
 */
export function initConcentration({ root, store }) {
    const host = root.querySelector('#concentration-feature');
    if (!host) return;
    let byVo = new Map();

    const select = el('select', { id: 'f-concentration', class: 'input', 'aria-describedby': 'concentration-info' });
    const info = el('div', { class: 'concentration-info', id: 'concentration-info', 'aria-live': 'polite' });
    host.replaceChildren(
        el('div', { class: 'concentration-row' },
            el('label', { class: 'label', for: 'f-concentration' }, icon('hourglass'), el('span', { text: 'Concentration' })),
            select),
        info);

    // Rappel dans le titre de l'encadré : visible même encadré replié
    const badge = el('span', { class: 'concentration-badge', hidden: true });
    host.closest('.box')?.querySelector(':scope > h3')?.append(badge);

    select.addEventListener('change', () => {
        const patch = setConcentrationPatch(store.get(), select.value);
        if (Object.keys(patch).length) store.update(patch);
    });

    let signature = null;
    const render = (character) => {
        const derived = derivedOf(character);
        const options = concentrationOptions(character, grantedConcentration(character, derived, byVo));
        const view = concentrationView(character, derived);
        const next = JSON.stringify([options, view]);
        if (next === signature) return;
        signature = next;
        const hadFocus = document.activeElement === select;
        select.replaceChildren(
            el('option', { value: '', text: options.length ? '— Aucune —' : '— Aucun sort à concentration —', selected: !view }),
            ...options.map((name) => el('option', { value: name, text: name, selected: view?.spell === name })));
        select.disabled = !options.length && !view;
        if (hadFocus) select.focus({ preventScroll: true });
        host.classList.toggle('is-active', Boolean(view));
        badge.hidden = !view;
        badge.textContent = view ? `Concentration : ${view.spell}` : '';
        if (!view) {
            info.replaceChildren();
            info.hidden = true;
            return;
        }
        const broken = view.brokenBy === 'rage' ? 'Rage'
            : view.brokenBy ? CONDITIONS.find((condition) => condition.id === view.brokenBy)?.nameFr ?? view.brokenBy : null;
        info.replaceChildren(...[
            broken ? el('p', { class: 'concentration-broken' }, icon('warning'),
                el('span', { text: `${broken} : la Concentration sur ${view.spell} prend fin. ` }),
                el('button', {
                    type: 'button', class: 'btn-chip', text: 'Terminer',
                    on: { click: () => {
                        store.update(setConcentrationPatch(store.get(), ''));
                        // Le bouton disparaît : le focus revient au menu
                        if (!select.disabled) select.focus({ preventScroll: true });
                    } }
                })) : null,
            view.safe ? el('p', { text: 'Chasseur implacable : les dégâts ne rompent pas cette Concentration.' }) : el('p', {
                text: `Dégâts subis : jet de sauvegarde de Constitution ${signed(view.bonus)}${view.advantage ? ' avec Avantage (Mage de guerre)' : ''}, DD 10 ou la moitié des dégâts (30 au plus). Le pavé « Dégâts / Soins » donne le DD.`
            }),
            el('p', { class: 'muted', text: 'Elle cesse aussi si vous lancez un autre sort à concentration, êtes Neutralisé ou mourez.' })
        ].filter(Boolean));
        info.hidden = false;
    };

    store.subscribe((character, changedKeys) => {
        if (changedKeys === null || changedKeys.some((key) => WATCHED.has(key) || /^feat_\d+$/.test(key))) render(character);
    });
    render(store.get());
    // Base des sorts chargée : les sorts donnés à concentration (Ténèbres du Drow…) s'ajoutent au menu
    loadSpells().then((list) => {
        byVo = new Map((Array.isArray(list) ? list : []).map((spell) => [spell.vo, spell]));
        signature = null;
        render(store.get());
    });
}
