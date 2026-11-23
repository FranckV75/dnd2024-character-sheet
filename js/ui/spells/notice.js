// =============================================================================
// SPELLS/NOTICE.JS - Grimoire replié d'un personnage sans magie : court avis, bouton pour
// l'ouvrir ou le replier, place des cases d'incantation
//
// Personnage sans magie (classe, sous-classe et niveau), sans aucun sort noté ni sort de don,
// de sous-classe ou d'espèce : le grimoire et les cases « Caractéristique d'incantation / DD /
// Bonus d'attaque » (#spell-stats, index.html) se replient en un court avis, avec un bouton pour
// l'ouvrir (sorts d'espèce…). Pour un personnage sans magie de classe, les cases d'incantation
// passent après le grimoire. Règles : js/rules/spells.js (spellcastingStatus, grimoireView).
//  - Lit : la fiche (classe, sous-classe, niveau, sorts notés, sorts donnés), le focus (un
//    grimoire où l'on écrit ne se replie pas sous les doigts).
//  - Écrit : le choix ouvert / replié, retenu dans ce navigateur (spells/prefs.js), hors de la
//    fiche ; l'attribut data-grimoire du conteneur ; rien dans la fiche.
// =============================================================================

import { plainText, hasSpellContent, spellcastingStatus, grimoireView } from '../../rules/spells.js';
import { featSpellGroups } from '../../rules/feat-spells.js';
import { subclassSpells } from '../../rules/subclass-features.js';
import { speciesSpellNames } from '../../rules/species.js';
import { classGrantedSpells } from '../../rules/class-progression.js';
import { el, icon } from '../dom.js';
import { readGrimoireOpen, saveGrimoireOpen } from './prefs.js';
import { slotStateOf } from './slots.js';
import { flash } from './context.js';

/**
 * Des sorts donnés (classe, don, sous-classe, espèce) sont-ils affichés au-dessus du tableau ?
 * @param {Object} character
 * @param {Object} d - valeurs calculées (derivedOf)
 * @returns {boolean}
 */
export function hasGivenSpells(character, d) {
    return featSpellGroups(character, d).length > 0 || subclassSpells(d).reached.length > 0
        || speciesSpellNames(character, d).length > 0
        || (d.classSlug ? classGrantedSpells(d.classSlug, d.level).length > 0 : false);
}

/**
 * @param {import('./context.js').Grimoire} g
 * @param {{ root: HTMLElement, container: HTMLElement, body: HTMLElement }} parts
 *        container : <section id="spells-feature"> ; body : le grimoire lui-même (barre, tableau…)
 * @returns {{ notice: HTMLElement, toggleBtn: HTMLButtonElement, render(character: Object, d: Object): void }}
 *          notice : l'avis du grimoire replié ; toggleBtn : bouton ouvrir / replier
 */
export function createGrimoireNotice(g, { root, container, body }) {
    let grimoireOpen = readGrimoireOpen();

    // Cases « Caractéristique d'incantation / DD / Bonus d'attaque » (index.html), repliées avec le grimoire
    const stats = root.querySelector('#spell-stats');
    const noticeMain = el('p', { class: 'grimoire-notice-main' });
    const notice = el('div', { class: 'grimoire-notice', hidden: true },
        noticeMain,
        el('p', {
            class: 'grimoire-notice-hint',
            text: 'Un sort accordé par un don ou une espèce ? Ouvrez le grimoire pour le noter.'
        }));

    const toggleLabel = el('span', { class: 'btn-label' });
    const toggleBtn = el('button', {
        type: 'button', class: 'btn-chip grimoire-toggle', hidden: true, 'aria-expanded': 'false',
        'aria-controls': stats ? 'spells-body spell-stats' : 'spells-body',
        on: {
            click: () => {
                grimoireOpen = toggleBtn.getAttribute('aria-expanded') !== 'true';
                saveGrimoireOpen(grimoireOpen);
                g.tooltip.hide();
                g.redraw();
                if (grimoireOpen) {
                    flash(stats, 'is-revealed');
                    flash(body, 'is-revealed');
                }
            }
        }
    }, icon('book'), toggleLabel, el('span', { class: 'grimoire-chevron', 'aria-hidden': 'true' }));

    function render(character, d) {
        const rows = Array.isArray(character.dynamic_spells) ? character.dynamic_spells : [];
        const status = spellcastingStatus({
            classSlug: d.classSlug, subclass: character.char_subclass, level: d.level,
            spellSlots: d.spellSlots, slotState: slotStateOf(character)
        });
        // Saisie en cours dans le grimoire (ligne vidée) : il ne se replie pas sous les doigts
        const active = document.activeElement;
        const hadFocus = !body.hidden && body.contains(active);
        const typing = hadFocus && active.matches('textarea, input, select');
        const hasFeatSpells = hasGivenSpells(character, d);
        const mode = grimoireView(status.casts, typing || hasFeatSpells || rows.some(hasSpellContent), grimoireOpen);
        const quiet = mode === 'quiet';

        container.dataset.grimoire = mode;
        notice.hidden = !quiet;
        body.hidden = quiet;
        if (stats) {
            stats.hidden = quiet;
            placeStats(!status.casts);
        }
        toggleBtn.hidden = mode === 'full';
        // Grimoire replié alors que le focus y était (dernier sort supprimé) : il passe au
        // bouton qui le rouvre, au lieu de se perdre
        if (quiet && hadFocus) toggleBtn.focus();
        toggleBtn.setAttribute('aria-expanded', String(!quiet));
        const label = quiet ? 'Ouvrir le grimoire' : 'Replier le grimoire';
        if (toggleLabel.textContent !== label) toggleLabel.textContent = label;
        const message = status.unlockLevel
            ? `Pas encore de magie : ${status.subclassName}, premiers sorts au niveau ${status.unlockLevel}.`
            : plainText(character.char_class)
                ? 'Pas de magie de classe pour ce personnage.'
                : 'Aucune classe choisie : pas de magie pour l\'instant.';
        if (noticeMain.textContent !== message) noticeMain.textContent = message;
    }

    /**
     * Cases d'incantation (#spell-stats, index.html) avant le grimoire pour un lanceur de sorts,
     * après lui sinon (grimoire ouvert à la demande, sorts de don ou d'espèce) : le bouton
     * ouvrir / replier ne bouge pas sous le doigt, et ce qu'il montre le suit dans l'ordre de
     * lecture. Seule leur place change (même élément, mêmes champs).
     * @param {boolean} after
     */
    function placeStats(after) {
        const inPlace = after ? container.nextElementSibling === stats : container.previousElementSibling === stats;
        if (inPlace) return;
        const focused = stats.contains(document.activeElement) ? document.activeElement : null;
        if (after) container.after(stats);
        else container.before(stats);
        focused?.focus({ preventScroll: true });
    }

    return { notice, toggleBtn, render };
}
