// =============================================================================
// CONCENTRATION.JS (interface) - Ligne « Concentration » en tête de l'encadré « États »
//
// Menu du sort sur lequel le personnage se concentre (sorts « C » du grimoire, et sorts donnés par
// la classe, les dons, l'espèce ou la sous-classe, Découvertes magiques du Collège du Savoir
// comprises, qui demandent la Concentration), puis le rappel : jet de
// sauvegarde de Constitution chiffré après des dégâts, Avantage (Mage de guerre), fin sous l'état
// Neutralisé avec un bouton « Terminer ». Le pavé « Dégâts / Soins » (js/ui/hit-points.js) donne
// le DD exact. Champ de jeu : utilisable fiche verrouillée. Règles : js/rules/concentration.js.
// =============================================================================

import { el, icon, signed } from './dom.js';
import { derivedOf } from './derived.js';
import {
    concentrationOptions, concentrationView, setConcentrationPatch, CONCENTRATION_KEY
} from '../rules/concentration.js';
import { CONDITIONS } from '../data/conditions.js';
import { loadSpells } from '../data/spells.js';
import { featSpellGroups } from '../rules/feat-spells.js';
import { subclassSpells } from '../rules/subclass-features.js';
import { speciesView } from '../rules/species.js';
import { classGrantedSpells } from '../rules/class-progression.js';
import { chosenSpells } from '../rules/spell-choices.js';
import { spellDisplayName } from '../rules/spells.js';

// Tout ce qui change le menu ou le jet de Constitution (maîtrise, Aura de protection au Charisme, Rage,
// armure lourde qui rend la Rage sans effet)
const WATCHED = new Set([CONCENTRATION_KEY, 'dynamic_spells', 'conditions', 'combat_buffs', 'dynamic_armors', 'con_score', 'con_save_prof', 'cha_score',
    'char_level', 'char_class', 'char_subclass',
    'char_species', 'species_choices', 'feat_choices', 'subclass_choices']);

/**
 * Sorts donnés (classe, dons, espèce, sous-classe) qui demandent la Concentration, d'après la base
 * des sorts (Marque du chasseur du Rôdeur, même s'il ne l'a pas notée au tableau).
 * @returns {string[]} noms français
 */
function grantedConcentration(character, derived, byVo) {
    if (!byVo.size) return [];
    const spells = [
        ...(derived.classSlug ? classGrantedSpells(derived.classSlug, derived.level) : []),
        ...featSpellGroups(character, derived).flatMap((group) => group.spells),
        ...subclassSpells(derived).reached,
        ...(speciesView(character, derived)?.spells ?? []).filter((spell) => spell.reached),
        // Découvertes magiques (Collège du Savoir) : sorts choisis, enregistrés sous leur nom
        // anglais. Ceux du Magicien viennent de son grimoire : déjà dans le menu par leur ligne.
        ...chosenSpells(character, derived).filter((spell) => spell.from === 'lists' && byVo.has(spell.value))
            .map((spell) => ({ vo: spell.value, name: spellDisplayName(byVo.get(spell.value)) }))
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
