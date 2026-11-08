// =============================================================================
// FEAT-SPELLS.JS (règles) - Sorts donnés par un don (lot 6)
//
// Ce que donnent, d'après les choix mémorisés (js/rules/feat-choices.js), les dons à sorts :
// Initié à la magie, Affinité féerique, Affinité ombreuse, Magie rituelle, Télépathe, Télékinésiste.
// La fiche les montre dans un bloc « Sorts de dons » du grimoire (js/ui/spells.js) : elle n'écrit
// jamais dans la liste des sorts du joueur (dynamic_spells) ni dans ses emplacements de sorts.
//
// Règles du Player's Handbook 2024 anglais (pages imprimées), vérifiées le 08/11/2026 :
//  - la caractéristique d'un sort est celle de la capacité qui le donne (p. 41) ; DD = 8 + bonus de
//    maîtrise + modificateur, attaque = bonus de maîtrise + modificateur (p. 238). Pour ces dons,
//    c'est la caractéristique augmentée par le don (Initié à la magie : celle choisie, sans +1) ;
//  - sorts toujours préparés : ils ne comptent pas dans les sorts préparés de la classe (p. 235) ;
//    un sort préparé qui a l'étiquette Rituel se lance aussi en rituel (+10 min, sans emplacement) ;
//  - lancers gratuits (sans emplacement), récupérés au Repos long seulement :
//      Initié à la magie : 1 pour le sort de niveau 1 (chaque exemplaire du don a le sien) ;
//      Affinité féerique / ombreuse : 1 par sort (sort imposé, sort choisi), indépendants ;
//      Télépathe : 1 pour Détection des pensées, sans composantes non plus ;
//    ces sorts se lancent aussi avec un emplacement du bon niveau (1+ pour un sort de niveau 1,
//    2+ pour Foulée brumeuse, Invisibilité, Détection des pensées) ;
//  - Magie rituelle : Rituel rapide (1 fois par Repos long, compteur de js/rules/feat-uses.js) ;
//  - Télépathe : parole télépathique à 18 m ; Télékinésiste : Main de mage sans composantes, portée
//    18 m, main invisible au choix, et poussée télékinésique (action Bonus, 9 m, sauvegarde de
//    Force, 1,50 m).
//
// Sauvegarde : les lancers gratuits utilisés sont rangés dans la clé existante « feat_uses », sous
// des clés « <id du don>@<niveau de l'emplacement>:<partie> » (partie : spell = sort choisi de
// niveau 1, fixed = sort imposé), valeur 0 ou 1. Aucune clé de la fiche n'est ajoutée ni renommée.
// Fonctions pures : le personnage reçu n'est jamais modifié.
// =============================================================================

import { featSlots, featName } from './feats.js';
import { FEAT_CHOICE_RULES, slotChoice, fieldActive, abilityName, MAGIC_INITIATE_CLASSES } from './feat-choices.js';
import { FEAT_USES_KEY, featUsesState } from './feat-uses.js';
import { computeSpellcasting } from './character.js';
import {
    MAGIC_INITIATE_LISTS, FEY_TOUCHED_SPELLS, SHADOW_TOUCHED_SPELLS, RITUAL_SPELLS, FIXED_FEAT_SPELLS
} from '../data/feat-spells.js';

/** Dons à sorts du lot 6, dans l'ordre de js/data/feats.js */
export const FEAT_SPELL_FEATS = Object.freeze([
    'initie_a_la_magie', 'affinite_feerique', 'affinite_ombreuse', 'magie_rituelle', 'telepathe', 'telekinesiste'
]);

/** Clé d'un lancer gratuit dans feat_uses : « affinite_feerique@4:fixed » */
export const featSpellUseKey = (featId, level, part) => `${featId}@${level}:${part}`;
const USE_KEY = /^([a-z_]+)@(\d+):(spell|fixed)$/;

/** Sorts connus de ces dons : nom anglais → { name, level, ritual } */
const SPELL_INDEX = new Map();
const index = (list, level) => {
    for (const [vo, name, flag] of list) SPELL_INDEX.set(vo, { name, level, ritual: flag === 'R' });
};
for (const { cantrips, level1 } of Object.values(MAGIC_INITIATE_LISTS)) {
    index(cantrips, 0);
    index(level1, 1);
}
index(FEY_TOUCHED_SPELLS, 1);
index(SHADOW_TOUCHED_SPELLS, 1);
index(RITUAL_SPELLS, 1);
for (const [vo, name, level] of Object.values(FIXED_FEAT_SPELLS)) SPELL_INDEX.set(vo, { name, level, ritual: false });

const CLASS_NAMES = Object.fromEntries(MAGIC_INITIATE_CLASSES);

/** Comment le sort se lance aussi avec un emplacement (« Toujours préparé ; se lance aussi… ») */
const SLOT_TEXT = Object.freeze({
    any: 'se lance aussi avec un emplacement de sort',
    '2+': 'se lance aussi avec un emplacement de niveau 2 ou plus'
});

/**
 * Sorts et capacités donnés par les dons à sorts atteints, emplacement par emplacement.
 * Un don non répétable pris deux fois (ancienne sauvegarde) ne compte qu'une fois : l'encadré du
 * don le signale déjà (feat-effects.js).
 * @param {Object} character
 * @param {{ mods: Object, pb: number }} derived - deriveCharacter(character)
 * @returns {Array<{ level: number, featId: string, featName: string, ability: string,
 *   abilityName: string, dc: number|null, attack: number|null,
 *   spells: Array<{ vo: string, name: string, level: number, ritual: boolean,
 *     kind: 'cantrip'|'prepared', slots: ''|'any'|'2+', slotText: string,
 *     free: null|{ key: string, used: boolean, text: string }, note: string }>,
 *   extras: Array<{ label: string, text: string }>, missing: string[], warnings: string[] }>}
 *   ability : caractéristique des sorts ('' tant qu'elle n'est pas choisie) ; free : lancer gratuit
 *   (clé de feat_uses, coché ou non) ; missing : choix pas encore faits ; warnings : à corriger
 */
export function featSpellGroups(character, derived) {
    const uses = featUsesState(character);
    const groups = [];
    const seen = new Set();
    const initiateLists = new Map();
    for (const slot of featSlots(character)) {
        const { featId, level } = slot;
        if (!slot.reached || !FEAT_SPELL_FEATS.includes(featId)) continue;
        const repeatable = featId === 'initie_a_la_magie';
        if (!repeatable && seen.has(featId)) continue;
        seen.add(featId);

        const rule = FEAT_CHOICE_RULES[featId];
        const choice = slotChoice(character, level, featId);
        const ability = (repeatable ? choice.castAbility : choice.ability) ?? '';
        const casting = computeSpellcasting(ability, derived.mods, derived.pb);
        const spells = [];
        const extras = [];
        const warnings = [];

        const free = (part, text) => {
            const key = featSpellUseKey(featId, level, part);
            return { key, used: Number(uses[key]) >= 1, text };
        };
        const add = (vo, { kind = 'prepared', slots = 'any', freeUse = null, note = '' } = {}) => {
            const known = SPELL_INDEX.get(vo);
            if (!known) return;
            const ritualNote = kind === 'prepared' && known.ritual ? 'Rituel : aussi lancé en rituel (+10 min, sans emplacement).' : '';
            spells.push({
                vo, name: known.name, level: known.level, ritual: known.ritual, kind,
                slots: kind === 'cantrip' ? '' : slots,
                slotText: kind === 'cantrip' ? '' : SLOT_TEXT[slots],
                free: freeUse,
                note: [note, ritualNote].filter(Boolean).join(' ')
            });
        };
        const freeText = 'Lancer gratuit (1 fois par repos long)';

        if (featId === 'initie_a_la_magie') {
            if (choice.list && initiateLists.has(choice.list)) {
                warnings.push(`Initié à la magie est déjà pris avec la liste ${CLASS_NAMES[choice.list]} au niveau ${initiateLists.get(choice.list)} : chaque exemplaire du don demande une autre liste.`);
            } else if (choice.list) initiateLists.set(choice.list, level);
            if (choice.cantrip1 && choice.cantrip1 === choice.cantrip2) {
                warnings.push('Le même sort mineur est choisi deux fois : choisissez-en deux différents.');
            }
            for (const key of ['cantrip1', 'cantrip2']) if (choice[key]) add(choice[key], { kind: 'cantrip' });
            if (choice.spell) add(choice.spell, { freeUse: free('spell', freeText) });
        } else if (featId === 'affinite_feerique' || featId === 'affinite_ombreuse') {
            const fixed = featId === 'affinite_feerique' ? FIXED_FEAT_SPELLS.misty : FIXED_FEAT_SPELLS.invisibility;
            add(fixed[0], { slots: '2+', freeUse: free('fixed', freeText) });
            if (choice.spell) add(choice.spell, { freeUse: free('spell', freeText) });
        } else if (featId === 'magie_rituelle') {
            const picked = new Set();
            for (const field of rule.fields) {
                if (!field.key.startsWith('ritual') || !fieldActive(field, character) || !choice[field.key]) continue;
                if (picked.has(choice[field.key])) {
                    warnings.push(`${SPELL_INDEX.get(choice[field.key])?.name ?? choice[field.key]} est choisi deux fois : choisissez des sorts rituels différents.`);
                    continue;
                }
                picked.add(choice[field.key]);
                add(choice[field.key]);
            }
            extras.push({
                label: 'Rituel rapide',
                text: "1 fois par repos long : lancer un sort rituel préparé en temps normal, sans emplacement (case dans l'encadré du don)."
            });
        } else if (featId === 'telepathe') {
            add(FIXED_FEAT_SPELLS.detectThoughts[0], {
                slots: '2+',
                freeUse: free('fixed', 'Lancer gratuit, sans composantes (1 fois par repos long)')
            });
            extras.push({
                label: 'Parole télépathique',
                text: 'Parler par télépathie à une créature visible à 18 m ou moins, dans une langue que vous connaissez ; elle ne vous comprend que si elle connaît cette langue, et ne peut pas vous répondre par télépathie.'
            });
        } else if (featId === 'telekinesiste') {
            add(FIXED_FEAT_SPELLS.mageHand[0], {
                kind: 'cantrip',
                note: 'Portée 18 m, sans composantes ; la main peut être invisible.'
            });
            extras.push({
                label: 'Poussée télékinésique',
                text: casting
                    ? `Action Bonus : une créature visible à 9 m ou moins fait un jet de sauvegarde de Force DD ${casting.dc} ; si elle échoue, vous la poussez de 1,50 m vers vous ou à l'opposé.`
                    : 'Action Bonus : une créature visible à 9 m ou moins fait un jet de sauvegarde de Force ; si elle échoue, vous la poussez de 1,50 m vers vous ou à l\'opposé. DD : choisissez la caractéristique sous le don.'
            });
        }

        spells.sort((a, b) => a.level - b.level);
        groups.push({
            level, featId, featName: featName(featId),
            ability, abilityName: ability ? abilityName(ability) : '',
            dc: casting ? casting.dc : null,
            attack: casting ? casting.attack : null,
            spells, extras,
            missing: rule.fields.filter(field => fieldActive(field, character) && !choice[field.key]).map(field => field.label),
            warnings
        });
    }
    return groups;
}

/**
 * Patch qui coche ou décoche un lancer gratuit (les autres usages ne changent pas)
 * @param {Object} character
 * @param {string} key - featSpellUseKey()
 * @param {boolean} used
 * @returns {Object} { feat_uses: {...} }, ou {} si la clé n'est pas celle d'un lancer gratuit
 */
export function setFeatSpellUsePatch(character, key, used) {
    if (!USE_KEY.test(String(key))) return {};
    return { [FEAT_USES_KEY]: { ...featUsesState(character), [key]: used ? 1 : 0 } };
}

/**
 * Repos long : tous les lancers gratuits reviennent (y compris ceux d'un don retiré ou d'un
 * emplacement pas encore atteint, pour qu'ils ne reviennent pas déjà dépensés). Seuls ceux des dons
 * atteints sont annoncés.
 * @param {Object} character
 * @param {{ mods: Object, pb: number }} derived
 * @returns {{ patch: Object, restored: Array<{ featId: string, featName: string, label: string, inText: string, count: number }> }}
 */
export function restFeatSpellUses(character, derived) {
    const restored = featSpellGroups(character, derived).flatMap(group => group.spells
        .filter(spell => spell.free?.used)
        .map(spell => ({
            featId: group.featId,
            featName: group.featName,
            label: `${spell.name}, lancer gratuit`,
            inText: `${spell.name} (lancer gratuit)`,
            count: 1
        })));
    const state = featUsesState(character);
    const spent = Object.keys(state).filter(key => USE_KEY.test(key) && Number(state[key]) !== 0);
    if (!spent.length) return { patch: {}, restored };
    const next = { ...state };
    for (const key of spent) next[key] = 0;
    return { patch: { [FEAT_USES_KEY]: next }, restored };
}

/**
 * Résumé pour l'encadré du don (Aptitudes & Traits) : où trouver les sorts, DD et attaque.
 * @param {ReturnType<typeof featSpellGroups>[number]} group
 * @returns {string}
 */
export function featSpellSummary(group) {
    const names = group.spells.map(spell => spell.name);
    const where = names.length ? `${names.join(', ')} : dans le grimoire (onglet Magie, « Sorts de dons »)` : 'Sorts : dans le grimoire (onglet Magie, « Sorts de dons »)';
    const stats = group.dc === null
        ? 'DD et attaque dès que la caractéristique est choisie'
        : `${group.abilityName} : DD ${group.dc}, attaque ${group.attack >= 0 ? '+' : ''}${group.attack}`;
    return `${where}. ${stats}.`;
}
