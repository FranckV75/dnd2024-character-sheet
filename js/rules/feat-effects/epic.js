// =============================================================================
// FEAT-EFFECTS/EPIC.JS (règles) - Effets des faveurs épiques (lot 8, niveau 19)
// PHB 2024 p. 210-211 ; le +1 (max 30) est dans js/rules/feat-choices.js.
// =============================================================================

import { parseNumber } from '../character.js';
import { SKILLS } from '../../data/constants.js';
import { irresistibleBoost, energyChoices, energyName, hasSpellcasting } from './helpers.js';
import { signed } from '../numbers.js';

export const EPIC_FEAT_RULES = {
    // ----- Lot 8 : faveurs épiques — PHB 2024 p. 210-211 (le +1, max 30 : js/rules/feat-choices.js) -----

    // Faveur d'attaque irrésistible — « Boon of Irresistible Offense »
    faveur_d_attaque_irresistible: ({ derived, record, add }) => {
        const boost = irresistibleBoost(record, derived);
        add('featSlot', 'Vos dégâts contondants, perforants et tranchants ignorent toujours la Résistance.');
        add('featSlot', boost
            ? `Sur un 20 au d20 d'un jet d'attaque : +${boost.score} dégâts du type de l'attaque (votre ${boost.name}, la valeur augmentée par ce don) ; rappel sous chaque arme.`
            : "Sur un 20 au d20 d'un jet d'attaque : dégâts en plus égaux à la valeur de la caractéristique augmentée par ce don (à choisir ci-dessus).",
        boost ? { value: boost.score } : {});
    },

    // Faveur de compétence — « Boon of Skill » : maîtrise de toutes les compétences (l'Expertise : feat-choices.js)
    faveur_de_competence: ({ derived, add }) => {
        const missing = SKILLS.filter(skill => !derived.skills[skill.id]?.proficient).map(skill => skill.name);
        add('featSlot', missing.length
            ? `Maîtrise de toutes les compétences : ${missing.length === 1 ? 'reste à cocher' : `${missing.length} restent à cocher`} (${missing.join(', ')}). La fiche ne coche rien elle-même.`
            : 'Maîtrise de toutes les compétences : toutes cochées.',
        missing.length ? { check: true } : { ticked: true });
    },

    // Faveur de déplacement dimensionnel — « Boon of Dimensional Travel »
    faveur_de_deplacement_dimensionnel: ({ add }) => {
        add('featSlot', "Juste après l'action Attaque ou l'action Magie : vous vous téléportez jusqu'à 9 m, dans un espace libre que vous voyez.");
    },

    // Faveur de l'esprit nocturne — « Boon of the Night Spirit »
    // Bouton « Dans l'ombre » (combat_buffs.nightSpirit, tableau des armes) : repère près de la CA
    faveur_de_l_esprit_nocturne: ({ record, add }) => {
        add('featSlot', "Dans une lumière faible ou les ténèbres : action Bonus pour devenir Invisible (jusqu'à votre prochaine action, action Bonus ou Réaction), et Résistance à tous les dégâts sauf psychiques et radiants. Bouton « Dans l'ombre » dans le tableau des armes : allumé, la Résistance est rappelée près de la CA.");
        if (record.combat_buffs?.nightSpirit === true) {
            add('armorClass', "Dans l'ombre : Résistance à tous les dégâts sauf psychiques et radiants.");
        } else {
            add('armorClass', "Résistance à tous les dégâts sauf psychiques et radiants : seulement dans l'ombre (bouton « Dans l'ombre » éteint).", { inactive: true });
        }
    },

    // Faveur de mémoire magique — « Boon of Spell Recall » (prérequis : capacité Sorts)
    faveur_de_memoire_magique: ({ derived, record, add }) => {
        const text = "Sort lancé avec un emplacement de niveau 1 à 4 : lancez 1d4 ; si le résultat est égal au niveau de l'emplacement, celui-ci n'est pas dépensé.";
        add('featSlot', text);
        if (derived.classSlug && !hasSpellcasting(record, derived)) {
            add('featSlot', 'Prérequis : la capacité Sorts (une classe de lanceur de sorts, ou Chevalier occulte, Arnaqueur arcanique).', { check: true });
        }
    },

    // Faveur de prouesse martiale — « Boon of Combat Prowess »
    faveur_de_prouesse_martiale: ({ add }) => {
        add('featSlot', "Visée infaillible : un jet d'attaque raté peut toucher à la place ; de nouveau possible au début de votre prochain tour. Bouton « Visée infaillible » dans le tableau des armes : allumez-le quand vous l'utilisez, éteignez-le au début de votre prochain tour.");
    },

    // Faveur de récupération — « Boon of Recovery » : Regain de vitalité (dix d10, cases), Baroud d'honneur
    faveur_de_recuperation: ({ record, add }) => {
        const hpMax = parseNumber(record.hp_max, 0);
        const half = Math.floor(hpMax / 2);
        add('featSlot', `Baroud d'honneur (case ci-dessous), une fois par repos long : réduit à 0 PV, vous tombez à 1 PV à la place et regagnez ${half > 0 ? `${half} PV (moitié de vos PV max)` : 'la moitié de vos PV max'}.`,
            half > 0 ? { value: half } : {});
        add('featSlot', "Regain de vitalité, réserve de dix d10 (cases ci-dessous) : action Bonus, lancez-en autant que vous voulez et regagnez le total en PV ; tous rendus au repos long.");
    },

    // Faveur de résistance aux énergies — « Boon of Energy Resistance »
    faveur_de_resistance_aux_energies: ({ derived, record, add }) => {
        const chosen = energyChoices(record);
        const dc = 8 + derived.mods.con + derived.pb;
        add('featSlot', chosen.length
            ? `Résistance : ${chosen.map(id => energyName(id).toLowerCase()).join(' et ')} (à changer, si vous le voulez, après un repos long).`
            : 'Résistance à deux types de dégâts à choisir ci-dessus (à changer, si vous le voulez, après un repos long).');
        if (chosen.length === 2 && chosen[0] === chosen[1]) {
            add('featSlot', 'Deux types de dégâts différents : choisissez-en un autre.', { check: true });
        }
        add('featSlot', `Détournement d'énergie (Réaction) : quand vous subissez des dégâts d'un de ces types, une créature que vous voyez à 18 m fait un jet de sauvegarde de Dextérité DD ${dc}, sinon elle subit 2d12 ${signed(derived.mods.con)} dégâts de ce type.`,
            { value: dc });
    },

    // Faveur de vigueur — « Boon of Fortitude » : PV max +40 (jamais ajoutés à la valeur saisie)
    faveur_de_vigueur: ({ derived: { mods }, add }) => {
        add('hpMax', 'dont +40 PV grâce à Faveur de vigueur', { value: 40, manual: true });
        add('featSlot', '+40 PV max : à compter vous-même dans les PV max saisis, la fiche ne les ajoute pas.', { value: 40, manual: true });
        if (mods.con > 0) add('featSlot', `Quand vous regagnez des PV : +${mods.con} PV en plus (modificateur de Constitution), une fois par tour.`);
    },

    // Faveur de vision lucide — « Boon of Truesight »
    faveur_de_vision_veritable_vision_lucide: ({ add }) => {
        add('featSlot', 'Vision lucide à 18 m : à noter vous-même avec vos sens.');
    },

    // Faveur de vitesse — « Boon of Speed » : Vitesse +9 m (la vitesse saisie n'est pas modifiée)
    faveur_de_vitesse: ({ add }) => {
        add('speed', "+9 m grâce à Faveur de vitesse. La Vitesse saisie n'est pas modifiée : ajoutez-les vous-même s'ils n'y sont pas déjà.",
            { value: 9, manual: true });
        add('featSlot', 'Prestesse, Vitesse +9 m : à reporter vous-même dans la Vitesse saisie (repère à côté).', { value: 9, manual: true });
        add('featSlot', "Expert en désengagement : par une action Bonus, vous vous Désengagez, ce qui met aussi fin à l'état Agrippé pour vous.");
    },

    // Faveur du destin — « Boon of Fate » (case : feat-uses.js)
    faveur_du_destin: ({ add }) => {
        add('featSlot', "Destin aiguillé : une créature à 18 m (vous compris) réussit ou rate un test d20, lancez 2d4 et ajoutez-les ou retirez-les au résultat. Case ci-dessous : rendue au repos court ou long, ou quand vous lancez l'Initiative (décochez-la alors vous-même).");
    }
};
