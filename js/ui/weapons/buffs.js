// =============================================================================
// WEAPONS/BUFFS.JS - Bonus de combat du tableau des armes (Rage, Attaque sournoise, Charge…)
//
// Les boutons à côté du titre « Armes » : contrôles de JEU, utilisables fiche verrouillée.
// Lit character.combat_buffs et ce que la classe, la sous-classe et les dons proposent
// (buffsForCharacter, js/rules/weapons.js) ; écrit combat_buffs (et vide les cases « une fois par
// Rage » quand la Rage s'éteint, rageEndPatch). Rage allumée avec une armure lourde équipée : le
// bouton reste allumé, un avertissement se pose à côté de lui (js/rules/rage.js).
// =============================================================================

import { sneakAttackDice, hunterMarkDie } from '../../rules/character.js';
import { getRageBonus } from '../../rules/logic.js';
import { divineFuryDie } from '../../rules/subclass-features.js';
import { rageEndPatch } from '../../rules/subclass-uses.js';
import { rageArmorWarning, rageBlockedByArmor, RAGE_ARMOR_STATUS } from '../../rules/rage.js';
import {
    frenzyDice, dreadfulStrikeDice, feyStrikesDie, superiorityDie, maneuverDC, psionicDice, dragonMount
} from '../../rules/subclass-combat.js';
import { buffsForCharacter, toggleBuff } from '../../rules/weapons.js';
import { derivedOf } from '../derived.js';
import { el, icon } from '../dom.js';

/** Boutons des bonus de combat ; chaque définition reçoit deriveCharacter() (niveau, bonus de maîtrise) */
const BUFF_DEFS = {
    rage: (derived) => ({
        icon: 'flame',
        text: `Rage (+${getRageBonus(derived.level)})`,
        title: `Rage : +${getRageBonus(derived.level)} aux dégâts des attaques utilisant la Force`
            + (divineFuryDie(derived) ? ` ; Fureur divine : +${divineFuryDie(derived)} une fois par tour, avec toute arme` : '')
    }),
    sneakAttack: ({ level }) => ({
        icon: 'swords',
        text: `Attaque sournoise (${sneakAttackDice(level)}d6)`,
        title: `Attaque sournoise : +${sneakAttackDice(level)}d6 avec une arme de finesse ou à distance (une fois par tour)`
    }),
    // Rôdeur niveau 20, Tueur implacable : 1d10 (même règle que computeWeapon)
    hunterMark: ({ level, classSlug }) => {
        const die = hunterMarkDie({ level, classSlug });
        return {
            icon: 'target',
            text: `Marque du chasseur (+${die})`,
            title: `Marque du chasseur : +${die} dégâts de force contre la cible marquée`
        };
    },
    heavyWeaponMaster: ({ pb }) => ({
        icon: 'fist',
        text: `Cogneur lourd (+${pb})`,
        title: `Cogneur lourd : +${pb} (bonus de maîtrise) aux dégâts quand vous touchez avec une arme Lourde lors de l'action Attaque à votre tour`
    }),
    // Expert de la charge (PHB 2024 « Charger », p. 202)
    charger: () => ({
        icon: 'swords',
        text: 'Charge (+1d8)',
        title: "Expert de la charge : +1d8 aux dégâts d'une attaque au corps à corps après 3 m en ligne droite vers la cible (une fois par tour). Pointe : +3 m de vitesse pour cette action."
    }),
    // Style Duel (Manuel des joueurs français p. 209)
    dueling: () => ({
        icon: 'swords',
        text: 'Duel (+2)',
        title: "Duel (style de combat) : +2 aux dégâts avec une arme de corps à corps tenue à une main, sans autre arme. Allumé, le +2 est ajouté aux armes de corps à corps qui ne sont pas à Deux mains."
    }),
    // Faveur de prouesse martiale (PHB 2024 p. 210) : allumé = utilisée ce tour
    peerlessAim: () => ({
        icon: 'target',
        text: 'Visée infaillible',
        title: "Faveur de prouesse martiale : quand vous ratez un jet d'attaque, vous pouvez toucher à la place, une fois par tour. Allumez-le quand vous l'utilisez, éteignez-le au début de votre prochain tour."
    }),
    // Faveur de l'esprit nocturne (PHB 2024 p. 211)
    nightSpirit: () => ({
        icon: 'moon',
        text: "Dans l'ombre",
        title: "Faveur de l'esprit nocturne : dans une lumière faible ou les ténèbres, Résistance à tous les dégâts sauf psychiques et radiants (repère près de la CA), et Invisible en action Bonus. Allumez-le quand vous y êtes."
    }),
    // Boutons de sous-classe (lot 5, js/rules/subclass-combat.js)
    frenzy: ({ level }) => ({
        icon: 'flame',
        text: `Frénésie (+${frenzyDice(level)})`,
        title: `Frénésie (Berserker) : avec Témérité pendant la Rage, +${frenzyDice(level)} au premier coup du tour avec une attaque de Force. Compté seulement si le bouton Rage est allumé aussi.`
    }),
    dreadfulStrike: ({ level }) => ({
        icon: 'moon',
        text: `Frappe effroyable (+${dreadfulStrikeDice(level)})`,
        title: `Frappe effroyable (Traqueur des ténèbres) : +${dreadfulStrikeDice(level)} psychiques avec une arme, une fois par tour ; cochez une case dans la bande des capacités.`
    }),
    feyStrikes: ({ level }) => ({
        icon: 'sparkle',
        text: `Frappes effroyables (+${feyStrikesDie(level)})`,
        title: `Frappes effroyables (Vagabond féerique) : +${feyStrikesDie(level)} psychiques avec une arme, une fois par tour pour une même cible.`
    }),
    colossusSlayer: () => ({
        icon: 'target',
        text: 'Goût du sang (+1d8)',
        title: "Goût du sang (Proie du chasseur) : +1d8 avec une arme contre une créature qui a perdu des PV, une fois par tour. Allumez-le si vous avez choisi cette option et que la cible est blessée."
    }),
    superiority: (derived) => ({
        icon: 'swords',
        text: `Manœuvre (+1${superiorityDie(derived.level)})`,
        title: `Manœuvre (Maître de guerre) : dé de supériorité ${superiorityDie(derived.level)} ajouté aux dégâts ; DD des manœuvres ${maneuverDC(derived)}. Cochez un dé dans la bande des capacités.`
    }),
    psionicStrike: (derived) => ({
        icon: 'star',
        text: `Frappe psionique (+1${psionicDice(derived.level).die})`,
        title: `Frappe psionique (Soldat psi) : +1${psionicDice(derived.level).die} + Intelligence de dégâts de force, une fois par tour, cible à 9 m ou moins. Cochez un dé psionique dans la bande des capacités.`
    }),
    // Serment du Seigneur Dragon, Jeune dragon (niveau 15) : aucun dégât en plus, repères près de la
    // CA et de la Perception (dragonMountNotes, js/rules/subclass-combat.js)
    dragonMount: (derived) => {
        const mount = dragonMount(derived);
        return {
            icon: 'crown',
            text: 'Monté sur le dragon',
            title: mount?.dragon
                ? `Jeune dragon : allumez-le quand vous montez votre ${mount.dragon.toLowerCase()}. Vous partagez son ${mount.immunity.charAt(0).toLowerCase()}${mount.immunity.slice(1)} (repère près de la CA) et ses sens : ${mount.senses}, Perception passive ${mount.passive} si elle est meilleure que la vôtre (repère près de la Perception).`
                : "Jeune dragon : allumez-le quand vous montez votre dragon. Vous partagez son immunité aux dégâts et ses sens ; choisissez la couleur de l'œuf (onglet Aptitudes & Traits) pour les voir près de la CA et de la Perception."
        };
    }
};

/**
 * Barre des bonus de combat.
 * @param {import('./shared.js').WeaponsContext} ctx
 * @returns {{ element: HTMLElement, render(character: Object, derived: Object): void }}
 */
export function createBuffs(ctx) {
    const { store, setStatus } = ctx;
    let buffsSignature = null;

    const buffsBox = el('div', { class: 'weapons-buffs', role: 'group', 'aria-label': 'Bonus de combat' });
    // Rage allumée avec une armure lourde équipée : avertissement à côté du bouton (js/rules/rage.js) ;
    // un bouton et non une simple infobulle : sur tablette, le toucher écrit la phrase dans la barre
    const rageWarn = el('button', {
        type: 'button', class: 'weapons-rage-warn', hidden: true,
        title: 'La Rage ne compte pas avec une armure lourde équipée : ses bonus (dégâts, Résistance, Avantage) ne sont pas ajoutés',
        on: { click: () => setStatus(RAGE_ARMOR_STATUS) }
    }, icon('warning'), el('span', { class: 'weapons-rage-warn-text' }));

    function render(character, derived) {
        const defs = buffsForCharacter(derived.classSlug, character, derived).map(key => ({ key, ...BUFF_DEFS[key](derived) }));
        const signature = defs.map(d => `${d.key}:${d.text}:${d.title}`).join('|');
        if (signature !== buffsSignature) {
            buffsSignature = signature;
            buffsBox.replaceChildren(...defs.map(d => el('button', {
                type: 'button', class: 'btn-chip weapons-buff', 'data-buff': d.key,
                title: d.title, 'aria-pressed': 'false',
                on: {
                    click: () => {
                        const current = store.get();
                        const combatBuffs = toggleBuff(current.combat_buffs, d.key);
                        const currentDerived = derivedOf(current);
                        // Rage éteinte : les cases « une fois par Rage » se vident (Détermination fanatique)
                        store.update({ combat_buffs: combatBuffs, ...rageEndPatch(current, currentDerived, combatBuffs) });
                        // Rage allumée avec une armure lourde : le bouton reste allumé, la barre prévient
                        if (d.key === 'rage' && combatBuffs.rage === true && rageBlockedByArmor(currentDerived)) setStatus(RAGE_ARMOR_STATUS);
                    }
                }
            }, icon(d.icon), el('span', { class: 'btn-label', text: d.text }))));
            // Avertissement juste après le bouton Rage
            buffsBox.querySelector('[data-buff="rage"]')?.after(rageWarn);
            buffsBox.hidden = defs.length === 0;
        }
        const active = character.combat_buffs || {};
        for (const button of buffsBox.querySelectorAll('[data-buff]')) {
            button.setAttribute('aria-pressed', String(active[button.dataset.buff] === true));
        }
        const warning = rageArmorWarning(character, derived, defs.map(d => d.key));
        rageWarn.hidden = !warning;
        if (rageWarn.lastElementChild.textContent !== warning) rageWarn.lastElementChild.textContent = warning;
        buffsBox.querySelector('[data-buff="rage"]')?.classList.toggle('is-void', Boolean(warning));
    }

    return { element: buffsBox, render };
}
