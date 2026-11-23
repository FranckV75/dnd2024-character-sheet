// =============================================================================
// SPELLS/CHOICES.JS - Sorts choisis d'une capacité, dans les blocs de sorts donnés du grimoire
//
// Maîtrise des sorts et Sorts de prédilection du Magicien (bloc « Sorts de classe »), Découvertes
// magiques du Barde du Collège du Savoir (bloc « Sorts de sous-classe ») : un groupe par capacité,
// avec la phrase qui dit à quoi elle sert, un menu par sort à choisir, puis les sorts choisis
// (ligne habituelle des sorts donnés : nom et infobulle, niveau, bouton « Lancer », case du lancer
// sans emplacement). Règles : js/rules/spell-choices.js.
//  - Lit : la vue calculée par spellChoiceView (options des menus, avertissements, sorts choisis).
//  - Écrit : le sort choisi, dans la clé facultative « subclass_choices » (setSpellChoicePatch).
// Un menu de construction (Sorts de prédilection, Découvertes magiques) se verrouille avec la
// fiche (data-build-control, lock.js) ; celui de Maîtrise des sorts reste modifiable verrouillé
// (le sort se remplace après un repos long). Menus masqués au combat et à l'impression
// (spells.css) : les sorts choisis, eux, restent affichés.
// =============================================================================

import { el } from '../dom.js';
import { isLocked } from '../lock.js';
import { derivedOf } from '../derived.js';
import { setSpellChoicePatch } from '../../rules/spell-choices.js';

/** Un menu : le sort déjà choisi mais plus proposable d'abord, puis les sorts rangés par niveau */
function choiceMenu(feature, field, store) {
    const id = `spell-choice-${field.key}`;
    const option = (entry) => el('option', { value: entry.value, text: entry.label, selected: entry.selected, disabled: entry.disabled });
    const groups = [...new Set(field.options.map(entry => entry.group).filter(Boolean))];
    const listed = field.options.filter(entry => entry.group !== '');
    const select = el('select', {
        id, class: 'input', 'data-spell-choice': field.key,
        ...(feature.inPlay ? { 'data-play': 'true' } : { 'data-build-control': 'true', disabled: isLocked() }),
        on: {
            change: (event) => {
                const now = store.get();
                const patch = setSpellChoicePatch(now, derivedOf(now), field.key, event.target.value);
                if (Object.keys(patch).length) store.update(patch);
            }
        }
    },
    el('option', { value: '', text: '— Choisir —', selected: field.value === '' }),
    field.options.filter(entry => entry.group === '').map(option),
    // Plusieurs niveaux (Découvertes magiques) : un groupe par niveau ; un seul : liste simple
    groups.length > 1
        ? groups.map(group => el('optgroup', { label: group }, listed.filter(entry => entry.group === group).map(option)))
        : listed.map(option));
    return el('div', { class: 'feat-choice' },
        el('label', { class: 'feat-choice-label', for: id, text: field.label }),
        select,
        field.hint ? el('span', { class: 'subclass-choice-when', text: field.hint }) : null);
}

/**
 * Groupe d'une capacité à sorts choisis.
 * @param {Object} feature - une entrée de spellChoiceView()
 * @param {{ store: Object, spellLine: (spell: Object) => HTMLElement }} deps
 *        spellLine : ligne d'un sort choisi (js/ui/spells/granted.js), avec sa case s'il en a une
 * @returns {HTMLElement}
 */
export function spellChoiceGroup(feature, { store, spellLine }) {
    return el('div', { class: 'feat-spells-group spell-choice-group', 'data-spell-feature': feature.id },
        el('div', { class: 'feat-spells-head' },
            el('strong', { class: 'feat-spells-name', text: feature.name }),
            el('span', { class: 'feat-spells-slot', text: `Niv. ${feature.level}` })),
        el('p', { class: 'feat-spells-extra', text: feature.intro }),
        el('div', { class: 'feat-choices spell-choices', role: 'group', 'aria-label': `Choix : ${feature.name}` },
            feature.fields.map(field => choiceMenu(feature, field, store))),
        feature.fields.filter(field => field.warning).map(field => el('p', { class: 'feat-spells-warning', text: field.warning })),
        feature.spells.length ? el('ul', { class: 'feat-spells-list' }, feature.spells.map(spellLine)) : null);
}

/**
 * Reconstruit un bloc en gardant le focus sur le menu de sort en cours d'utilisation (choisir un
 * sort change le bloc : sans cela, le focus serait perdu au clavier).
 * @param {HTMLElement} box - bloc qui contient les menus
 * @param {() => void} rebuild - reconstruit le contenu du bloc
 */
export function keepChoiceFocus(box, rebuild) {
    const active = document.activeElement;
    const key = active && box.contains(active) ? active.dataset?.spellChoice : null;
    rebuild();
    if (!key) return;
    const next = [...box.querySelectorAll('select[data-spell-choice]')].find(select => select.dataset.spellChoice === key);
    if (next && !next.disabled) next.focus({ preventScroll: true });
}
