// =============================================================================
// FEAT-EFFECTS.JS (règles) - Effets des dons sur la fiche : notes à afficher par zone
//
// Règle validée par Franck : la fiche ne modifie JAMAIS une valeur saisie à la main
// (caractéristiques, PV max, vitesse). Pour un bonus de don sur une telle valeur, elle
// affiche seulement « dont +X grâce à <don> ». Une valeur déjà calculée par la fiche
// (Initiative, CA, dégâts d'arme, DD) peut intégrer le bonus (voir deriveCharacter et
// computeWeapon dans character.js) : la note le signale alors avec `applied: true`.
//
// Un don ne compte que s'il est choisi dans un emplacement atteint (reachedFeatIds, feats.js).
// Textes vérifiés dans le Player's Handbook 2024 anglais (pages citées pour chaque don) ;
// noms français de js/data/feats.js (traduction AideDD).
//
// Fichier séparé de feats.js pour éviter une dépendance circulaire :
// feats.js ← weapons.js ← character.js ← feat-effects.js ← rest.js
// =============================================================================

import { featSlots, featName, reachedFeatIds } from './feats.js';
import { FEATS_DATA } from '../data/feats.js';
import { deriveCharacter } from './character.js';
import { weaponReach, weaponDamageType, isBlankWeapon } from './weapons.js';
import { DD_RULES } from '../data/dd-rules.js';
import { ABILITY_IDS, SKILLS } from '../data/constants.js';
import {
    featChoiceGrants, REPEATABLE_CHOICE_FEATS, abilityName, skillName, elementWord
} from './feat-choices.js';

/**
 * Note de don affichée dans une zone de la fiche.
 * @typedef {Object} FeatNote
 * @property {string} featId - identifiant du don (clé de js/data/feats.js)
 * @property {string} featName - nom français du don (« Vigilant »)
 * @property {string} text - phrase courte en français, chiffres calculés inclus ; elle ne commence
 *   pas par le nom du don (sauf « dont +X PV grâce à Robuste ») : l'interface peut afficher featName à côté
 * @property {number|string} [value] - chiffre principal de la note (bonus, DD, réduction, nombre
 *   d'alliés, dé « 1d8 ») ; absent pour un simple rappel
 * @property {boolean} [applied] - la valeur est déjà comptée dans le nombre calculé par la fiche
 *   (ex. Vigilant dans l'Initiative) : ne pas l'ajouter une seconde fois
 * @property {boolean} [manual] - la valeur porte sur un nombre saisi à la main (ex. Robuste et les
 *   PV max) : la fiche ne l'ajoute pas, le joueur la reporte lui-même s'il ne l'a pas déjà fait
 * @property {boolean} [inactive] - condition non remplie (ex. aucune armure lourde équipée) :
 *   à afficher discrètement
 * @property {boolean} [check] - à vérifier par le joueur : case du don pas cochée, valeur au-delà
 *   de 20, choix contraire à la règle (lot 3) ; la fiche ne corrige rien elle-même
 * @property {boolean} [ticked] - la case due au don est cochée sur la fiche (lot 3)
 * @property {number} [slot] - niveau de l'emplacement du don (dons à choix : un même don peut être
 *   pris dans deux emplacements, chacun avec son choix)
 */

/**
 * Notes de dons rangées par zone de la fiche.
 * Les zones fixes (FEAT_ZONES) sont toujours présentes (tableau vide s'il n'y a rien) ;
 * deux familles de zones n'apparaissent que si elles ont au moins une note :
 *  - 'weapon:<i>'  : ligne n° i (index dans dynamic_weapons) du tableau des armes ;
 *  - 'featSlot:<N>' : emplacement de don du niveau N (ce que la fiche fait de ce don).
 * @typedef {Object<string, FeatNote[]>} FeatEffects
 */

/**
 * Zones fixes de la fiche, toujours présentes dans le résultat de featEffects :
 *  - 'initiative'   : Initiative (Vigilant) ;
 *  - 'hpMax'        : PV max saisis à la main (Robuste : « dont +X ») ;
 *  - 'armorClass'   : CA (Maître des armures lourdes, Maître des boucliers sans bouclier) ;
 *  - 'saves.<id>'   : jet de sauvegarde (str, dex, con, int, wis, cha) ;
 *  - 'scores.<id>'  : valeur de caractéristique saisie (augmentations des dons à choix) ;
 *  - 'skills.<id>'  : compétence (maîtrise ou Expertise due à un don à choix) ;
 *  - 'spells'       : zone des sorts (Mage de guerre) ;
 *  - 'weapons'      : tableau des armes, rappels généraux (Charge, Abattage, Sentinelle…) ;
 *  - 'rest'         : fin d'un repos court ou long (Musicien) ;
 *  - 'healing'      : soins donnés aux autres (Guérisseur).
 */
export const FEAT_ZONES = Object.freeze([
    'initiative', 'hpMax', 'armorClass',
    ...ABILITY_IDS.map(id => `saves.${id}`),
    ...ABILITY_IDS.map(id => `scores.${id}`),
    ...SKILLS.map(skill => `skills.${skill.id}`),
    'spells', 'weapons', 'rest', 'healing'
]);

/** Dons dont la fiche tient compte (lot 1) */
export const AUTOMATED_FEATS = Object.freeze([
    'vigilant', 'robuste', 'mage_de_guerre', 'maitre_des_armures_lourdes', 'maitre_des_armures_intermediaires',
    'maitre_des_boucliers',
    'expert_de_la_charge', 'maitre_des_armes_lourdes_cogneur_lourd', 'sauvagerie_martiale',
    'sentinelle', 'trancheur', 'broyeur', 'empaleur_perforateur', 'musicien', 'guerisseur',
    // Lot 2 : dons à usages limités (cases vidées au repos, js/rules/feat-uses.js)
    'chanceux', 'tueur_de_mages',
    // Lot 3 : choix mémorisés (js/rules/feat-choices.js)
    'amelioration_de_caracteristique', 'resilient', 'observateur', 'expert', 'esprit_affute', 'doue',
    'adepte_elementaire'
]);

const signed = (n) => `${n >= 0 ? '+' : ''}${n}`;

/** Note prête à ranger (featName ajouté, champs facultatifs absents s'ils ne sont pas fournis) */
function note(featId, text, extra = {}) {
    return { featId, featName: featName(featId), text, ...extra };
}

/** DD du Coup de bouclier (PHB 2024 « Shield Master », p. 207) : 8 + mod. Force + bonus de maîtrise */
export function shieldBashDC(derived) {
    return 8 + derived.mods.str + derived.pb;
}

/** Points de vie de Robuste (PHB 2024 « Tough », p. 202) : 2 × niveau du personnage */
export function toughHitPoints(level) {
    return 2 * level;
}

// -----------------------------------------------------------------------------
// Effets par don : chaque fonction reçoit { derived, add } et range ses notes
// -----------------------------------------------------------------------------
const FEAT_RULES = {
    // Vigilant — PHB 2024 « Alert », p. 200
    vigilant: ({ derived: { pb, mods }, add }) => {
        add('initiative', `Bonus de maîtrise ${signed(pb)} déjà compté dans l'Initiative (Dex ${signed(mods.dex)}, Vigilant ${signed(pb)}).`,
            { value: pb, applied: true });
        add('initiative', "Échange d'Initiative : juste après le jet, vous pouvez échanger votre Initiative avec celle d'un allié consentant (impossible si l'un de vous est Incapable d'agir).");
        add('featSlot', `Initiative calculée : Dex ${signed(mods.dex)}, Vigilant ${signed(pb)} = ${signed(mods.dex + pb)}.`,
            { value: pb, applied: true });
    },

    // Robuste — PHB 2024 « Tough », p. 202 : 2 × niveau dès que le don est pris, puis +2 par niveau
    robuste: ({ derived: { level }, add }) => {
        const hp = toughHitPoints(level);
        add('hpMax', `dont +${hp} PV grâce à Robuste (2 × niveau ${level})`, { value: hp, manual: true });
        add('featSlot', `+${hp} PV max (2 × niveau ${level}) : à compter vous-même dans les PV max saisis, la fiche ne les ajoute pas.`,
            { value: hp, manual: true });
    },

    // Mage de guerre — PHB 2024 « War Caster », p. 209
    mage_de_guerre: ({ add }) => {
        add('saves.con', 'Avantage pour maintenir la Concentration.');
        add('spells', "Sort réactif : quand une créature quitte votre allonge et provoque une attaque d'opportunité, vous pouvez à la place lancer sur elle, en Réaction, un sort d'une action qui ne cible qu'elle.");
        add('spells', 'Composantes somatiques possibles même avec des armes ou un bouclier dans les mains.');
        add('featSlot', 'Avantage pour la Concentration noté sur la sauvegarde de Constitution.');
    },

    // Maître des armures lourdes — PHB 2024 « Heavy Armor Master », p. 204
    maitre_des_armures_lourdes: ({ derived: { pb, wornArmor }, add }) => {
        if (wornArmor.heavy) {
            add('armorClass', `Réduction des dégâts contondants, perforants et tranchants des attaques : ${pb}`, { value: pb });
            add('featSlot', `Réduction des dégâts de ${pb} (bonus de maîtrise), notée près de la CA.`, { value: pb });
        } else {
            add('armorClass', 'Réduction des dégâts : seulement en armure lourde (aucune équipée).', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : aucune armure lourde équipée.', { inactive: true });
        }
    },

    // Maître des armures intermédiaires — PHB 2024 « Medium Armor Master » (Porteur agile) :
    // Dex jusqu'à +3 au lieu de +2 en armure intermédiaire si la valeur de Dextérité est de 16 ou plus
    maitre_des_armures_intermediaires: ({ derived: { scores, wornArmor, armorClass }, add }) => {
        // L'armure intermédiaire doit être celle qui compte dans la CA (pas une autre armure équipée)
        const counted = armorClass?.rows
            ? armorClass.rows.some(r => r.status === 'counted' && r.line.category === 'medium')
            : wornArmor.medium;
        if (counted && scores.dex >= 16) {
            add('armorClass', "Porteur agile : Dex jusqu'à +3 au lieu de +2 en armure intermédiaire, déjà compté dans la CA.", { value: 3, applied: true });
            add('featSlot', "Dex jusqu'à +3 en armure intermédiaire : déjà compté dans la CA.", { value: 3, applied: true });
        } else if (counted) {
            add('armorClass', 'Porteur agile : il faut une valeur de Dextérité de 16 ou plus.', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : Dextérité inférieure à 16.', { inactive: true });
        } else if (wornArmor.medium) {
            add('armorClass', "Porteur agile : l'armure intermédiaire équipée ne compte pas dans la CA (une autre armure donne plus).", { inactive: true });
            add('featSlot', "Sans effet pour le moment : l'armure intermédiaire équipée ne compte pas dans la CA.", { inactive: true });
        } else {
            add('armorClass', 'Porteur agile : seulement en armure intermédiaire (aucune équipée).', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : aucune armure intermédiaire équipée.', { inactive: true });
        }
    },

    // Maître des boucliers — PHB 2024 « Shield Master », p. 207 (prérequis : formation aux boucliers).
    // Comme pour la CA (computeArmorClass), un bouclier non maîtrisé est sans effet.
    maitre_des_boucliers: ({ derived, add }) => {
        if (derived.wornArmor.shield && !derived.wornArmor.shieldTrained) {
            add('armorClass', 'Coup de bouclier et Interposition de bouclier : formation aux boucliers non cochée.', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : formation aux boucliers non cochée (le bouclier ne compte pas non plus dans la CA).', { inactive: true });
        } else if (derived.wornArmor.shield) {
            const dc = shieldBashDC(derived);
            add('weapons', `Coup de bouclier : après avoir touché avec une arme de corps à corps une créature à 1,50 m lors de l'action Attaque, frappez-la avec votre bouclier ; sauvegarde de Force DD ${dc}, sinon repoussée de 1,50 m ou À terre (au choix). Une fois par tour.`,
                { value: dc });
            add('saves.dex', "Interposition de bouclier : contre un effet qui permet un jet de Dextérité pour ne subir que la moitié des dégâts, vous pouvez prendre une Réaction pour n'en subir aucun si le jet réussit.");
            add('featSlot', `Coup de bouclier DD ${dc} (8 + For ${signed(derived.mods.str)} + maîtrise ${signed(derived.pb)}) ; Interposition de bouclier notée sur la sauvegarde de Dextérité.`,
                { value: dc });
        } else {
            add('armorClass', 'Coup de bouclier et Interposition de bouclier : il faut un bouclier équipé.', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : aucun bouclier équipé.', { inactive: true });
        }
    },

    // Expert de la charge — PHB 2024 « Charger », p. 202 (« Dash » = action Foncer)
    expert_de_la_charge: ({ add }) => {
        add('weapons', "Charge : après au moins 3 m en ligne droite vers la cible juste avant de la toucher au corps à corps (action Attaque), +1d8 aux dégâts, ou repoussez-la jusqu'à 3 m (taille au plus une de plus que vous). Une fois par tour.",
            { value: '1d8' });
        add('weapons', 'Foncer : votre vitesse augmente de 3 m pour cette action.', { value: 3 });
        add('featSlot', 'Bouton « Charge (+1d8) » dans les armes (corps à corps) ; Foncer : +3 m.', { value: '1d8' });
    },

    // Cogneur lourd — PHB 2024 « Great Weapon Master », p. 204 (le bonus aux dégâts est un bouton existant)
    maitre_des_armes_lourdes_cogneur_lourd: ({ derived: { pb }, add }) => {
        add('weapons', "Abattage : juste après un coup critique avec une arme de corps à corps, ou après avoir réduit une créature à 0 PV avec elle, vous pouvez attaquer une fois avec la même arme en action Bonus.");
        add('featSlot', `Bouton « Cogneur lourd (+${pb}) » dans les armes (armes Lourdes) ; rappel Abattage.`, { value: pb });
    },

    // Sauvagerie martiale — PHB 2024 « Savage Attacker », p. 201
    sauvagerie_martiale: ({ add }) => {
        add('weapons', "Une fois par tour, quand vous touchez avec une arme, lancez deux fois ses dés de dégâts et gardez le résultat de votre choix.");
        add('featSlot', 'Rappel dans les dégâts de chaque arme.');
    },

    // Sentinelle — PHB 2024 « Sentinel », p. 207
    sentinelle: ({ add }) => {
        add('weapons', "Gardien : juste après qu'une créature à 1,50 m de vous se Désengage ou touche une autre cible que vous, vous pouvez lui porter une attaque d'opportunité.");
        add('weapons', "Immobilisation : une créature touchée par votre attaque d'opportunité a une vitesse de 0 jusqu'à la fin du tour.");
        add('featSlot', 'Rappel sur les armes de corps à corps.');
    },

    // Trancheur — PHB 2024 « Slasher », p. 208
    trancheur: ({ add }) => {
        add('weapons', 'Dégâts tranchants : une fois par tour, réduisez la vitesse de la cible de 3 m jusqu\'au début de votre prochain tour. Sur un coup critique, elle a le Désavantage à ses jets d\'attaque jusqu\'au début de votre prochain tour.');
        add('featSlot', 'Rappel sur les armes tranchantes.');
    },

    // Broyeur — PHB 2024 « Crusher », p. 203
    broyeur: ({ add }) => {
        add('weapons', 'Dégâts contondants : une fois par tour, déplacez la cible de 1,50 m vers un espace libre (taille au plus une de plus que vous). Sur un coup critique, les jets d\'attaque contre elle ont l\'Avantage jusqu\'au début de votre prochain tour.');
        add('featSlot', 'Rappel sur les armes contondantes.');
    },

    // Perforateur — PHB 2024 « Piercer », p. 206
    empaleur_perforateur: ({ add }) => {
        add('weapons', 'Dégâts perforants : une fois par tour, relancez un des dés de dégâts de l\'attaque (le nouveau résultat compte). Sur un coup critique, lancez un dé de dégâts de plus.');
        add('featSlot', 'Rappel sur les armes perforantes.');
    },

    // Musicien — PHB 2024 « Musician », p. 201
    musicien: ({ derived: { pb }, add }) => {
        add('rest', `Chant d'encouragement : à la fin du repos, jouez d'un instrument que vous maîtrisez pour donner l'Inspiration héroïque à au plus ${pb} alliés qui vous entendent.`,
            { value: pb });
        add('featSlot', `Rappel à la fin des repos : Inspiration héroïque pour au plus ${pb} alliés.`, { value: pb });
    },

    // Chanceux — PHB 2024 « Lucky », p. 201 : points de Chance = bonus de maîtrise, repos long
    chanceux: ({ derived: { pb }, add }) => {
        add('featSlot', `${pb} points de Chance à cocher (onglet Combat et ci-dessous), récupérés au repos long.`, { value: pb });
    },

    // Tueur de mages — PHB 2024 « Mage Slayer », p. 205 (l'augmentation de caractéristique reste saisie à la main)
    tueur_de_mages: ({ add }) => {
        add('featSlot', 'Esprit préservé : 1 case à cocher (onglet Combat et ci-dessous), de nouveau disponible au repos court ou long.', { value: 1 });
        // Vaut pour tous les dégâts (armes et sorts) : rappel ici, pas sur une ligne d'arme
        add('featSlot', 'Briseur de concentration : une créature en concentration à qui vous infligez des dégâts (arme ou sort) a le Désavantage à sa sauvegarde pour maintenir sa Concentration.');
    },

    // Guérisseur — PHB 2024 « Healer », p. 201 (« Battle Medic » : Médecin de combat)
    guerisseur: ({ derived: { pb }, add }) => {
        add('healing', `Médecin de combat : en dépensant une utilisation d'une trousse de soins (action Utilisation), une créature à 1,50 m dépense un de ses dés de vie ; vous le lancez et elle récupère le résultat ${signed(pb)} PV.`,
            { value: pb });
        add('healing', 'Retirage des soins : sur un dé de soins (sort ou Médecin de combat), relancez un 1 et gardez le nouveau résultat.');
        add('featSlot', `Médecin de combat : dé de vie de la cible ${signed(pb)} ; relancer les 1.`, { value: pb });
    }
};

// -----------------------------------------------------------------------------
// Dons à choix (lot 3, js/rules/feat-choices.js) : la fiche ne coche rien et ne change aucune
// valeur saisie. Elle affiche des repères près des valeurs et signale ce qui reste à cocher.
// -----------------------------------------------------------------------------

/** « de feu », « d'acide », « de Force », « d'Intelligence » */
const ofWord = (word) => (/^[aeiouéh]/i.test(word) ? `d'${word}` : `de ${word}`);

/** Jets de sauvegarde maîtrisés par la classe (DD_RULES), [] si la classe est inconnue */
function classSaves(derived) {
    return DD_RULES.classes[derived.classSlug]?.savingThrows ?? [];
}

/** Liste lisible : « a », « a et b », « a, b et c » */
function listText(items) {
    return items.length > 1 ? `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}` : items[0] ?? '';
}

/** Note d'une compétence due à un don : [texte, extra] selon les cases cochées */
function skillNote(kind, name, state) {
    if (kind === 'expertise') {
        return state.expertise
            ? [`Expertise ${ofWord(name)} : case cochée.`, { ticked: true }]
            : [`Expertise ${ofWord(name)} à cocher (losange).`, { check: true }];
    }
    if (kind === 'proficiency') {
        return state.proficient
            ? [`Maîtrise ${ofWord(name)} : case cochée.`, { ticked: true }]
            : [`Maîtrise ${ofWord(name)} à cocher.`, { check: true }];
    }
    // Maîtrise, ou Expertise si la compétence était déjà maîtrisée (Observateur, Esprit affûté)
    if (state.expertise) return [`Expertise ${ofWord(name)} : case cochée.`, { ticked: true }];
    // La fiche ne sait pas si la maîtrise vient du don ou d'avant : simple rappel
    if (state.proficient) {
        return [`Maîtrise ${ofWord(name)} cochée. Si vous la maîtrisiez déjà avant ce don, il donne l'Expertise : cochez aussi le losange.`, {}];
    }
    return [`Maîtrise ${ofWord(name)} à cocher (ou l'Expertise, losange, si vous la maîtrisiez déjà).`, { check: true }];
}

/** Une Faveur épique (don de niveau 19) atteinte : une caractéristique peut alors dépasser 20 (jusqu'à 30) */
function hasEpicBoon(derived) {
    return (derived.feats ?? []).some(id => Object.hasOwn(FEATS_DATA, id) && FEATS_DATA[id].type === 'Épique');
}

/**
 * Notes d'un don à choix pour un emplacement.
 * @param {ReturnType<typeof featChoiceGrants>[number]} grant
 * @param {{ derived: Object, grants: Array, record: Object, add: Function }} ctx
 */
function choiceNotes(grant, { derived, grants, record, add }) {
    const { featId } = grant;

    if (grant.missing.length) {
        add('featSlot', `Choix à faire ci-dessus : ${grant.missing.join(', ')}.`, { inactive: true });
    }

    // Augmentations de caractéristique : repère près de la valeur saisie, jamais ajoutées
    if (grant.abilities.length) {
        const parts = grant.abilities.map(({ ability, amount }) => `${abilityName(ability)} +${amount}`);
        add('featSlot', grant.abilities.length > 1
            ? `${listText(parts)} : repères près des valeurs. La fiche ne les ajoute pas : ajoutez-les vous-même aux valeurs saisies.`
            : `${listText(parts)} : repère près de la valeur. La fiche ne l'ajoute pas : ajoutez-le vous-même à la valeur saisie.`,
        { value: grant.abilities[0].amount, manual: true });
    }
    for (const { ability, amount } of grant.abilities) {
        add(`scores.${ability}`, `+${amount} ${ofWord(abilityName(ability))}. La valeur saisie n'est pas modifiée : ajoutez ce bonus vous-même s'il n'y est pas déjà.`,
            { value: amount, manual: true });
        const score = derived.scores[ability];
        if (score > 20 && !hasEpicBoon(derived)) {
            const text = `${abilityName(ability)} ${score} : un don ne fait pas dépasser 20 (seuls une Faveur épique, un objet magique ou une capacité de classe le permettent).`;
            add('featSlot', text, { check: true });
            add(`scores.${ability}`, text, { check: true });
        }
    }

    // Résilient : maîtrise du jet de sauvegarde choisi
    if (grant.save) {
        const ability = abilityName(grant.save);
        let text;
        let extra;
        if (classSaves(derived).includes(grant.save)) {
            text = `Votre classe (${derived.className}) maîtrise déjà le jet de sauvegarde ${ofWord(ability)} : Résilient doit porter sur une caractéristique dont le jet n'est pas maîtrisé.`;
            extra = { check: true };
        } else if (derived.saves[grant.save].proficient) {
            text = `Maîtrise du jet de sauvegarde ${ofWord(ability)} : case cochée.`;
            extra = { ticked: true };
        } else {
            text = `Maîtrise du jet de sauvegarde ${ofWord(ability)} à cocher (la fiche ne coche rien elle-même).`;
            extra = { check: true };
        }
        add('featSlot', text, extra);
        add(`saves.${grant.save}`, text, extra);
    }

    // Compétences : maîtrise ou Expertise due au don
    const picked = new Set();
    for (const { skill, kind, field } of grant.skills) {
        const skillLabel = skillName(skill);
        if (field.startsWith('pick')) {
            if (picked.has(skill)) {
                add('featSlot', `La compétence ${skillLabel} est choisie deux fois : choisissez trois maîtrises différentes.`, { check: true });
                continue;
            }
            picked.add(skill);
        }
        // Expert : l'Expertise porte sur une compétence déjà maîtrisée (case cochée, ou celle choisie en
        // Maîtrise). On lit la case elle-même : cocher le losange compte déjà la compétence comme maîtrisée.
        const unmastered = kind === 'expertise' && record[`skill_prof_${skill}`] !== true
            && !grant.skills.some(other => other.kind === 'proficiency' && other.skill === skill);
        const [text, extra] = unmastered
            ? [`L'Expertise d'Expert porte sur une compétence que vous maîtrisez déjà (ou celle choisie en Maîtrise ci-dessus) : ${skillLabel} n'est pas maîtrisée.`, { check: true }]
            : skillNote(kind, skillLabel, derived.skills[skill]);
        add('featSlot', text, extra);
        add(`skills.${skill}`, text, extra);
    }
    if (grant.tools) {
        add('featSlot', `${grant.tools === 1 ? "1 maîtrise d'outil" : `${grant.tools} maîtrises d'outils`} : à noter dans le champ Outils (onglet Compétences & Histoire).`);
    }

    // Rappels propres au don (noms des actions : ceux de js/data/feats.js)
    if (featId === 'observateur') add('featSlot', "Observation rapide : l'action Observation en action Bonus.");
    if (featId === 'esprit_affute') add('featSlot', "Étude rapide : l'action Étude en action Bonus.");
    if (featId === 'adepte_elementaire' && grant.element) {
        const word = elementWord(grant.element);
        add('featSlot', `Vos sorts ignorent la Résistance aux dégâts ${ofWord(word)} ; pour un sort qui inflige des dégâts ${ofWord(word)}, un 1 sur un dé de dégâts compte comme un 2. Repère « Adepte » sur ces sorts dans le grimoire.`);
        const twin = grants.find(other => other !== grant && other.featId === featId && other.element === grant.element);
        if (twin) {
            add('featSlot', `Même type de dégâts qu'au niveau ${twin.level} : chaque Adepte élémentaire doit porter sur un type différent.`, { check: true });
        }
    }
}

// -----------------------------------------------------------------------------
// Rappels sur une ligne d'arme
// -----------------------------------------------------------------------------

/** Rappel court d'un don sur une arme : condition (arme de corps à corps, type de dégâts…) et texte */
const WEAPON_RULES = [
    { featId: 'sauvagerie_martiale', applies: () => true,
        text: () => 'Une fois par tour, lancer deux fois les dés de dégâts de l\'arme et garder un des résultats.' },
    { featId: 'maitre_des_armes_lourdes_cogneur_lourd', applies: ({ melee }) => melee,
        text: () => 'Abattage : après un coup critique ou une créature réduite à 0 PV avec cette arme, une attaque de plus avec elle en action Bonus.' },
    { featId: 'expert_de_la_charge', applies: ({ melee }) => melee, value: '1d8',
        text: () => 'Charge : +1d8 aux dégâts après 3 m en ligne droite vers la cible (une fois par tour).' },
    { featId: 'maitre_des_boucliers', applies: ({ melee, derived }) => melee && derived.wornArmor.shield && derived.wornArmor.shieldTrained,
        value: ({ derived }) => shieldBashDC(derived),
        text: ({ derived }) => `Coup de bouclier : sauvegarde de Force DD ${shieldBashDC(derived)}, sinon repoussée de 1,50 m ou À terre (une fois par tour).` },
    { featId: 'sentinelle', applies: ({ melee }) => melee,
        text: () => 'Attaque d\'opportunité aussi contre une créature à 1,50 m qui se Désengage ou touche quelqu\'un d\'autre ; touchée, sa vitesse tombe à 0 jusqu\'à la fin du tour.' },
    { featId: 'trancheur', applies: ({ type }) => type === 'TRAN',
        text: () => 'Une fois par tour, −3 m de vitesse pour la cible ; sur un critique, Désavantage à ses attaques (jusqu\'à votre prochain tour).' },
    { featId: 'broyeur', applies: ({ type }) => type === 'CONT',
        text: () => 'Une fois par tour, déplacer la cible de 1,50 m ; sur un critique, Avantage aux attaques contre elle (jusqu\'à votre prochain tour).' },
    { featId: 'empaleur_perforateur', applies: ({ type }) => type === 'PERF',
        text: () => 'Une fois par tour, relancer un dé de dégâts ; sur un critique, un dé de dégâts de plus.' }
];

/**
 * Rappels de dons pour une ligne du tableau des armes, selon sa portée (corps à corps) et son type
 * de dégâts. Seules les armes rattachées au manuel (nom et caractéristique d'attaque, comme
 * computeWeapon) reçoivent des rappels : une ancienne ligne libre (« Perception bestiale ») n'en a pas.
 * @param {Object} weapon - ligne de dynamic_weapons
 * @param {Object} character - personnage (pour les dons atteints)
 * @param {Object} [derived] - deriveCharacter(character), recalculé s'il est absent
 * @returns {FeatNote[]}
 */
export function weaponFeatNotes(weapon, character, derived = deriveCharacter(character || {})) {
    if (isBlankWeapon(weapon) || !weapon.atkKey || !String(weapon.name ?? '').replace(/<[^>]*>/g, '').trim()) return [];
    const feats = new Set(derived.feats ?? reachedFeatIds(character));
    const ctx = { derived, melee: weaponReach(weapon).melee, type: weaponDamageType(weapon) };
    return WEAPON_RULES
        .filter(rule => feats.has(rule.featId) && rule.applies(ctx))
        .map(rule => {
            const value = typeof rule.value === 'function' ? rule.value(ctx) : rule.value;
            return note(rule.featId, rule.text(ctx), value === undefined ? {} : { value });
        });
}

/**
 * Notes des dons à montrer à la fin d'un repos court ou long (Musicien).
 * @param {Object} character
 * @param {Object} [derived] - deriveCharacter(character)
 * @returns {FeatNote[]}
 */
export function restFeatNotes(character, derived = deriveCharacter(character || {})) {
    return featEffects(character, derived).rest;
}

/**
 * Effets des dons atteints, rangés par zone de la fiche (voir FEAT_ZONES et le type FeatEffects).
 * Fonction pure : le personnage n'est pas modifié et aucune valeur saisie n'est changée.
 *
 * Exemple (Guerrier niveau 4, Dex 14, feat_1 = 'vigilant', feat_4 = 'robuste') :
 *   featEffects(c, deriveCharacter(c)).initiative
 *   → [{ featId: 'vigilant', featName: 'Vigilant', value: 2, applied: true,
 *        text: "Bonus de maîtrise +2 déjà compté dans l'Initiative (Dex +2, Vigilant +2)." },
 *      { featId: 'vigilant', featName: 'Vigilant', text: "Échange d'Initiative : …" }]
 *   featEffects(c).hpMax
 *   → [{ featId: 'robuste', featName: 'Robuste', value: 8, text: 'dont +8 PV grâce à Robuste (2 × niveau 4)' }]
 *   featEffects(c)['featSlot:4'] → [{ featId: 'robuste', …, text: '+8 PV max (2 × niveau 4) : …' }]
 *
 * @param {Object} character - personnage au format de sauvegarde (v3)
 * @param {Object} [derived] - deriveCharacter(character) déjà calculé (sinon recalculé)
 * @returns {FeatEffects}
 */
export function featEffects(character, derived = deriveCharacter(character || {})) {
    const effects = Object.fromEntries(FEAT_ZONES.map(zone => [zone, []]));
    const record = character && typeof character === 'object' ? character : {};

    // Effets généraux, dans l'ordre des emplacements ; 'featSlot' est rangé sous le niveau de l'emplacement.
    // Un don choisi deux fois (ancienne sauvegarde) ne donne ses rappels qu'une fois.
    const seen = new Set();
    for (const slot of featSlots(record)) {
        if (!slot.reached || !Object.hasOwn(FEAT_RULES, slot.featId)) continue;
        const rule = FEAT_RULES[slot.featId];
        const slotZone = `featSlot:${slot.level}`;
        const first = !seen.has(slot.featId);
        seen.add(slot.featId);
        rule({
            derived,
            add: (zone, text, extra) => {
                if (zone !== 'featSlot' && !first) return;
                const key = zone === 'featSlot' ? slotZone : zone;
                (effects[key] ??= []).push(note(slot.featId, text, extra));
            }
        });
    }

    // Dons à choix : un don répétable (Amélioration de caractéristique, Doué, Adepte élémentaire)
    // donne des notes pour chaque emplacement ; les autres, une seule fois (ancienne sauvegarde)
    const grants = featChoiceGrants(record);
    const firstLevel = new Map();
    for (const grant of grants) {
        // Don non répétable déjà pris plus bas (ancienne sauvegarde) : ce second choix ne compte pas
        if (firstLevel.has(grant.featId) && !REPEATABLE_CHOICE_FEATS.includes(grant.featId)) {
            (effects[`featSlot:${grant.level}`] ??= []).push(note(grant.featId,
                `${grant.featName} est déjà pris au niveau ${firstLevel.get(grant.featId)} : ce don ne se prend qu'une fois. Choisissez un autre don ici.`,
                { check: true, slot: grant.level }));
            continue;
        }
        if (!firstLevel.has(grant.featId)) firstLevel.set(grant.featId, grant.level);
        choiceNotes(grant, {
            derived,
            grants,
            record,
            add: (zone, text, extra = {}) => {
                const key = zone === 'featSlot' ? `featSlot:${grant.level}` : zone;
                const list = (effects[key] ??= []);
                // Même alerte (valeur au-delà de 20) venue de deux dons : affichée une fois
                if (extra.check && zone !== 'featSlot' && list.some(n => n.check && n.text === text)) return;
                list.push(note(grant.featId, text, { ...extra, slot: grant.level }));
            }
        });
    }

    // Rappels sur chaque ligne d'arme
    const weapons = Array.isArray(record.dynamic_weapons) ? record.dynamic_weapons : [];
    weapons.forEach((weapon, index) => {
        const notes = weaponFeatNotes(weapon, record, derived);
        if (notes.length) effects[`weapon:${index}`] = notes;
    });

    return effects;
}
