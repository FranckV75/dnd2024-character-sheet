// =============================================================================
// FEAT-EFFECTS/CHOICE-NOTES.JS (règles) - Repères des dons à choix (lot 3)
// Augmentations, maîtrises, Expertise, sorts : repères près des valeurs et ce qui reste à cocher
// (choix mémorisés : js/rules/feat-choices.js).
// =============================================================================

import { featSlotName } from '../feats.js';
import { FEATS_DATA } from '../../data/feats.js';
import { DD_RULES } from '../../data/dd-rules.js';
import { abilityName, skillName, elementWord } from '../feat-choices.js';
import { FEAT_SPELL_FEATS, featSpellGroups, featSpellSummary } from '../feat-spells.js';
import { signed, toolNote } from './helpers.js';

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
export function choiceNotes(grant, { derived, grants, record, add }) {
    const { featId } = grant;

    if (grant.missing.length) {
        add('featSlot', `Choix à faire ci-dessus : ${grant.missing.join(', ')}.`, { inactive: true });
    }

    // Dons à sorts (lot 6) : où sont les sorts, avec quel DD ; ce qui est à corriger
    if (FEAT_SPELL_FEATS.includes(featId)) {
        const group = featSpellGroups(record, derived).find(g => g.featId === featId && g.level === grant.level);
        if (group) {
            add('featSlot', featSpellSummary(group), { applied: group.dc !== null });
            for (const warning of group.warnings) add('featSlot', warning, { check: true });
        }
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
        if (score > 30) {
            const text = `${abilityName(ability)} ${score} : une caractéristique ne dépasse jamais 30.`;
            add('featSlot', text, { check: true });
            add(`scores.${ability}`, text, { check: true });
        } else if (score > 20 && !hasEpicBoon(derived)) {
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
        // Pas la Faveur de compétence : elle donne la maîtrise de toutes les compétences (« à cocher »).
        const unmastered = featId === 'expert' && kind === 'expertise' && record[`skill_prof_${skill}`] !== true
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

    // Figure de proue — PHB 2024 « Inspiring Leader », p. 204 : niveau + modificateur de la
    // caractéristique augmentée par ce don (peut être négatif), à la fin de chaque repos
    if (featId === 'figure_de_proue') {
        const ability = grant.choice.ability;
        if (ability) {
            const hp = Math.max(0, derived.level + derived.mods[ability]);
            const formula = `niveau ${derived.level} ${signed(derived.mods[ability])} ${abilityName(ability)}`;
            add('rest', `Représentation galvanisante : à la fin du repos, jusqu'à 6 créatures (vous compris) à 9 m ou moins qui assistent à votre discours, chant ou danse gagnent ${hp} PV temporaires (${formula}). Les PV temporaires ne s'additionnent pas : on garde les plus élevés.`,
                { value: hp });
            add('featSlot', `Représentation galvanisante : ${hp} PV temporaires (${formula}) pour 6 créatures au plus (vous compris), à 9 m, à la fin de chaque repos court ou long (rappel dans la fenêtre du repos).`,
                { value: hp });
        } else {
            add('featSlot', 'PV temporaires de la Représentation galvanisante : niveau + modificateur de la caractéristique choisie ci-dessus.', { inactive: true });
        }
    }

    // Empoisonneur — PHB 2024 « Poisoner », p. 206 : DD 8 + mod. de la caractéristique augmentée + maîtrise
    if (featId === 'empoisonneur') {
        const ability = grant.choice.ability;
        if (ability) {
            const dc = 8 + derived.mods[ability] + derived.pb;
            add('featSlot', `Poison : jet de sauvegarde de Constitution DD ${dc} (8 ${signed(derived.mods[ability])} ${abilityName(ability)} ${signed(derived.pb)} maîtrise) ; raté : 2d8 dégâts de poison et Empoisonné jusqu'à la fin de votre prochain tour. Rappel sur chaque arme.`,
                { value: dc });
        } else {
            add('featSlot', 'DD du poison : 8 + modificateur de la caractéristique choisie ci-dessus + bonus de maîtrise.', { inactive: true });
        }
        add('featSlot', `Préparation : 1 heure et 50 po de matériaux pour ${derived.pb} doses ; action Bonus pour enduire une arme ou une munition (1 minute, ou jusqu'à ce qu'elle touche).`, { value: derived.pb });
        add('featSlot', 'Poison virulent : vos jets de dégâts de poison ignorent la Résistance au poison.');
        toolNote(record, /empoison/, "Kit d'empoisonneur", add);
    }

    // Rappels propres au don (noms des actions : ceux de js/data/feats.js)
    if (featId === 'observateur') add('featSlot', "Observation rapide : l'action Observation en action Bonus.");
    if (featId === 'esprit_affute') add('featSlot', "Étude rapide : l'action Étude en action Bonus.");
    if (featId === 'adepte_elementaire' && grant.element) {
        const word = elementWord(grant.element);
        add('featSlot', `Vos sorts ignorent la Résistance aux dégâts ${ofWord(word)} ; pour un sort qui inflige des dégâts ${ofWord(word)}, un 1 sur un dé de dégâts compte comme un 2. Repère « Adepte » sur ces sorts dans le grimoire.`);
        const twin = grants.find(other => other !== grant && other.featId === featId && other.element === grant.element);
        if (twin) {
            add('featSlot', `Même type de dégâts qu'au ${featSlotName(twin.level)} : chaque Adepte élémentaire doit porter sur un type différent.`, { check: true });
        }
    }
}
