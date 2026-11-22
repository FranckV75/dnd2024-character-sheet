// =============================================================================
// WEAPONS/MASTERY.JS - Fenêtre de la règle d'une botte d'arme
//
// Ouverte par la pastille (livre) de la colonne « Botte d'arme » : la règle du manuel, les valeurs
// calculées pour l'arme et la capacité Bottes d'arme de la classe (js/rules/weapon-masteries.js).
// Lecture seule : ouverte même fiche verrouillée ; rien n'est écrit dans la fiche.
// =============================================================================

import { computeWeapon } from '../../rules/character.js';
import {
    masteryDetails, masteryParagraphs, masteryAccessNote, masterySource, weaponMasteryFeature, hasWeaponMasterFeat
} from '../../rules/weapon-masteries.js';
import { effectiveBuffs } from '../../rules/weapons.js';
import { derivedOf } from '../derived.js';
import { el, icon } from '../dom.js';
import { openModal } from '../modal.js';
import { plain } from './shared.js';

/**
 * @param {import('./shared.js').WeaponsContext} ctx
 * @param {number} index - place de l'arme dans dynamic_weapons
 */
export function openMastery(ctx, index) {
    const character = ctx.store.get();
    const weapon = ctx.weapons()[index];
    const derived = derivedOf(character);
    // Bonus de combat actifs (Rage) : mêmes que ceux du tableau
    const buffs = effectiveBuffs(derived.classSlug, character.combat_buffs, character, derived);
    const details = weapon ? masteryDetails(weapon, character, derived, buffs) : null;
    if (!details) return;
    const { mastery, values, note } = details;
    const name = plain(weapon.name);
    const feature = weaponMasteryFeature(derived);

    // Valeurs pour cette arme ; sans calcul possible (arme hors manuel...), on dit pourquoi
    let weaponBox = null;
    if (values.length > 0) {
        weaponBox = el('div', { class: 'weapons-mastery-calc' },
            el('p', { class: 'weapons-mastery-calc-title' }, icon('swords'),
                el('span', { text: name ? `Avec l'arme « ${name} »` : 'Avec cette arme' })),
            el('ul', {}, values.map(v => el('li', {},
                el('span', { text: `${v.label} : ` }),
                el('strong', { text: v.value }),
                v.detail ? el('small', { text: v.detail }) : null))));
    } else if (note) {
        weaponBox = el('div', { class: 'weapons-mastery-calc' },
            el('p', { class: 'weapons-mastery-calc-none', text: note }));
    }

    // Arme non maîtrisée : la capacité Bottes d'arme (et le don Maître d'armes) ne vaut qu'avec une arme maîtrisée
    const proficiency = computeWeapon(weapon, derived)?.proficiency;
    const unproficient = proficiency && !proficiency.proficient
        ? el('p', { class: 'weapons-mastery-unproficient', text: "Vous ne maîtrisez pas cette arme : sa botte ne s'utilise qu'avec une arme maîtrisée (réglage « Arme maîtrisée » de la configuration de l'arme)." })
        : null;

    // Pages du Manuel des joueurs français : la botte, puis ce qui en donne l'accès
    const source = masterySource(mastery, feature, hasWeaponMasterFeat(character));

    openModal({
        title: mastery.name,
        icon: 'book',
        body: el('div', { class: 'weapons-mastery' },
            el('p', { class: 'weapons-mastery-kind', text: `Botte d'arme (en anglais : ${mastery.en})` }),
            el('div', { class: 'weapons-mastery-desc' },
                masteryParagraphs(mastery).map(text => el('p', { text }))),
            weaponBox,
            unproficient,
            el('div', { class: 'weapons-mastery-access' },
                el('p', { class: 'weapons-mastery-access-title', text: "Bottes d'arme" }),
                el('p', { text: masteryAccessNote(character, derived) })),
            el('p', { class: 'weapons-mastery-source', text: source })),
        actions: [{ label: 'Fermer', primary: true }]
    });
}
