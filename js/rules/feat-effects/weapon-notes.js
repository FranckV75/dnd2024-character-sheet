// =============================================================================
// FEAT-EFFECTS/WEAPON-NOTES.JS (règles) - Rappels des dons sur une ligne d'arme
// WEAPON_RULES et weaponFeatNotes (réexporté par js/rules/feat-effects.js).
// =============================================================================

import { featName, reachedFeatIds } from '../feats.js';
import { deriveCharacter, computeWeapon } from '../character.js';
import { parseWeaponConfig } from '../logic.js';
import { weaponReach, weaponDamageType, isBlankWeapon, isUnarmedStrike, isCrossbow } from '../weapons.js';
import { weaponProficiency, weaponProficiencyNote } from '../class-features.js';
import { subclassWeaponNotes } from '../subclass-calcs.js';
import { subclassCombatWeaponNotes } from '../subclass-combat.js';
import { findMastery } from '../weapon-masteries.js';
import { note, shieldBashDC, fold, hasProperty, isPolearm, poisonerDC, irresistibleBoost, grappleDC } from './helpers.js';

// -----------------------------------------------------------------------------
// Rappels sur une ligne d'arme
// -----------------------------------------------------------------------------

/** Rappel court d'un don sur une arme : condition (arme de corps à corps, type de dégâts…) et texte */
/**
 * Dons dont le rappel ne vaut qu'avec une arme, pas avec l'attaque à mains nues (PHB 2024 :
 * Sauvagerie martiale « with a weapon », Abattage « with a Melee weapon », Coup de bouclier « with a
 * Melee weapon », Poison « weapon or ammunition », Duel « a Melee weapon »).
 */
const WEAPON_ONLY_FEATS = new Set([
    'sauvagerie_martiale', 'maitre_des_armes_lourdes_cogneur_lourd', 'maitre_des_boucliers', 'empoisonneur', 'duel'
]);

const WEAPON_RULES = [
    // Lot 8 : Faveur d'attaque irrésistible, sur toute arme (et l'attaque à mains nues)
    { featId: 'faveur_d_attaque_irresistible', applies: () => true,
        value: ({ record, derived }) => irresistibleBoost(record, derived)?.score,
        text: ({ record, derived }) => {
            const boost = irresistibleBoost(record, derived);
            return `Sur un 20 au d20 : +${boost ? boost.score : '(valeur de la caractéristique du don)'} dégâts ; dégâts contondants, perforants et tranchants sans Résistance.`;
        } },
    // Lot 7 : Attaque à mains nues (PHB 2024 p. 377)
    { featId: 'bagarreur_de_tavernes', applies: ({ weapon }) => isUnarmedStrike(weapon),
        text: () => '1d4 au lieu de 1 (le plus gros dé est compté), relancez les 1 ; une fois par tour (action Attaque), vous pouvez aussi repousser la cible de 1,50 m.' },
    { featId: 'empoigneur', applies: ({ weapon }) => isUnarmedStrike(weapon),
        value: ({ derived }) => grappleDC(derived),
        text: ({ derived }) => `Frappe et empoignade : une fois par tour (action Attaque), dégâts et Lutte en même temps (DD ${grappleDC(derived)}) ; Avantage contre la créature que vous agrippez.` },
    { featId: 'combat_a_mains_nues', applies: ({ weapon }) => isUnarmedStrike(weapon),
        text: () => "1d6, ou 1d8 si vous ne tenez ni arme ni bouclier (le tableau compte 1d6 : réglez le dé dans la configuration de la ligne si besoin). Au début de votre tour, 1d4 contondants à la créature que vous agrippez." },
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
        text: () => 'Une fois par tour, relancer un dé de dégâts ; sur un critique, un dé de dégâts de plus.' },
    // Lot 5
    { featId: 'duelliste_defensif', applies: ({ weapon }) => hasProperty(weapon, 'finesse'),
        value: ({ derived }) => derived.pb,
        text: ({ derived }) => `Parade : en Réaction quand une attaque au corps à corps vous touche, +${derived.pb} à la CA contre le corps à corps jusqu'au début de votre prochain tour.` },
    { featId: 'maitre_d_hast', applies: ({ weapon }) => isPolearm(weapon),
        text: ({ weapon, derived, buffs }) => {
            // Frappe double : toujours un d4 contondant (dé ou type réglé pour l'arme ignorés, bonus
            // magique gardé) ; Rage et Marque du chasseur comptent, pas Cogneur lourd ni la Charge
            // (réservés à l'action Attaque)
            const { dmgDieOverride, dmgTypeOverride, ...config } = parseWeaponConfig(weapon.weaponConfig);
            const strike = computeWeapon({ ...weapon, baseDmg: '1d4 cont.', weaponConfig: config }, derived,
                { rage: Boolean(buffs.rage), hunterMark: Boolean(buffs.hunterMark) });
            const attack = strike ? strike.attack.text.split(':').pop().trim() : '';
            const damage = strike ? strike.damage.text : '1d4 contondants';
            const reach = hasProperty(weapon, 'allonge') ? '3 m' : '1,50 m';
            return `Frappe double (action Bonus, juste après l'action Attaque avec cette arme) : attaque ${attack} avec l'autre bout, ${damage}. Frappe réactive (Réaction) : une attaque quand une créature entre dans votre allonge (${reach}).`;
        } },
    { featId: 'empoisonneur', applies: ({ record, derived }) => poisonerDC(record, derived) !== null,
        value: ({ record, derived }) => poisonerDC(record, derived),
        text: ({ record, derived }) => `Poison (action Bonus, 1 dose) : jet de sauvegarde de Constitution DD ${poisonerDC(record, derived)}, sinon 2d8 dégâts de poison et Empoisonné.` },
    // Lot 4 : styles de combat
    { featId: 'archerie', applies: ({ weapon }) => { const reach = weaponReach(weapon); return reach.ranged && !reach.melee; },
        value: 2,
        text: () => "+2 à l'attaque, déjà compté." },
    { featId: 'duel', applies: ({ melee, weapon }) => melee && !hasProperty(weapon, 'deux mains'),
        text: ({ buffs }) => buffs.dueling
            ? '+2 aux dégâts compté (bouton « Duel » allumé) : à une main, sans autre arme.'
            : '+2 aux dégâts si vous la tenez à une main sans autre arme ; allumez le bouton « Duel (+2) » au-dessus du tableau.' },
    { featId: 'arme_a_deux_mains', applies: ({ melee, weapon }) => melee && (hasProperty(weapon, 'deux mains') || hasProperty(weapon, 'polyvalente')),
        text: ({ weapon }) => {
            const versatile = fold(weapon.prop).match(/polyvalente\s*\(([^)]+)\)/);
            return `Tenue à deux mains, chaque 1 ou 2 sur un dé de dégâts compte comme un 3${versatile ? ` (avec le dé à deux mains, ${versatile[1].trim()})` : ''}.`;
        } },
    { featId: 'arme_de_lancer', applies: ({ weapon }) => hasProperty(weapon, 'lancer'),
        text: ({ weapon, derived, buffs }) => {
            // Lancée : attaque à distance (ni Duel, ni Charge, réservés au corps à corps) ; le +2 est
            // un bonus nommé de computeWeapon (un ancien dé libre, « 2d4 + 1 », reste juste)
            const strike = computeWeapon(weapon, derived, { ...buffs, dueling: false, charger: false, thrownWeapon: true });
            return `Lancée (attaque à distance), dégâts ${strike ? strike.damage.text : '+2'}.`;
        } },
    { featId: 'combat_a_deux_armes', applies: ({ weapon }) => hasProperty(weapon, 'legere'),
        text: ({ weapon, derived, buffs }) => {
            // Attaque en plus en action Bonus avec une seconde arme : ni Duel (aucune autre arme), ni
            // Charge (action Attaque seulement)
            const strike = computeWeapon(weapon, derived, { ...buffs, dueling: false, charger: false });
            return `L'attaque en plus (action Bonus) avec cette arme Légère garde le modificateur aux dégâts${strike ? ` : ${strike.damage.text}` : ''}.`;
        } },
    // Lot 7 : armes à distance, arbalètes, deux armes
    { featId: 'tireur_d_elite', applies: ({ weapon }) => weaponReach(weapon).ranged,
        // Une arme de corps à corps lancée n'est pas une arme à distance : seul le contournement d'abri vaut
        text: ({ weapon }) => (weaponReach(weapon).melee
            ? 'Lancée, elle ignore les Abris partiels et supérieurs.'
            : 'Ignore les Abris partiels et supérieurs ; ni la longue portée ni un ennemi à 1,50 m ne donnent le Désavantage.') },
    { featId: 'maitre_arbaletrier', applies: ({ weapon }) => isCrossbow(weapon),
        text: ({ weapon, derived, buffs }) => {
            const light = hasProperty(weapon, 'legere');
            const strike = light ? computeWeapon(weapon, derived, buffs) : null;
            return "Chargement ignoré ; pas de Désavantage à 1,50 m d'un ennemi"
                + (light ? ` ; l'attaque en plus (Légère) garde le modificateur aux dégâts${strike ? ` : ${strike.damage.text}` : ''}` : '') + '.';
        } },
    { featId: 'combattant_a_deux_armes',
        applies: ({ melee, weapon }) => melee && !isUnarmedStrike(weapon) && !hasProperty(weapon, 'deux mains') && !hasProperty(weapon, 'legere'),
        text: () => "Utilisable pour l'attaque en plus (action Bonus) après une attaque avec une arme Légère, même sans être Légère (sans modificateur aux dégâts)." }
];

/**
 * Rappels de dons pour une ligne du tableau des armes, selon sa portée (corps à corps) et son type
 * de dégâts. Seules les armes rattachées au manuel (nom et caractéristique d'attaque, comme
 * computeWeapon) reçoivent des rappels : une ancienne ligne libre (« Perception bestiale ») n'en a pas.
 * @param {Object} weapon - ligne de dynamic_weapons
 * @param {Object} character - personnage (pour les dons atteints)
 * @param {Object} [derived] - deriveCharacter(character), recalculé s'il est absent
 * @param {Object} [buffs] - bonus de combat actifs (Rage…), comme pour computeWeapon
 * @returns {FeatNote[]}
 */
export function weaponFeatNotes(weapon, character, derived = deriveCharacter(character || {}), buffs = {}) {
    if (isBlankWeapon(weapon) || !weapon.atkKey || !String(weapon.name ?? '').replace(/<[^>]*>/g, '').trim()) return [];
    const feats = new Set(derived.feats ?? reachedFeatIds(character));
    const ctx = { derived, record: character || {}, weapon, buffs: buffs || {}, melee: weaponReach(weapon).melee, type: weaponDamageType(weapon) };
    // L'attaque à mains nues n'est pas une arme : pas les rappels réservés aux armes
    const unarmed = isUnarmedStrike(weapon);
    // Arme non maîtrisée (ou maîtrise supposée) : rappel en tête, avant ceux des dons
    const proficiency = weaponProficiency(weapon, derived);
    const proficiencyText = weaponProficiencyNote(proficiency, derived.pb, Boolean(findMastery(weapon.prof)));
    const first = proficiencyText ? [proficiency.proficient
        ? { featId: 'maitrise_supposee', featName: 'Maîtrise supposée', text: proficiencyText, classFeature: true }
        : { featId: 'sans_maitrise', featName: 'Sans maîtrise', text: proficiencyText, value: derived.pb, check: true, classFeature: true }] : [];
    return [...first, ...WEAPON_RULES
        .filter(rule => feats.has(rule.featId) && !(unarmed && WEAPON_ONLY_FEATS.has(rule.featId)) && rule.applies(ctx))
        .map(rule => {
            const value = typeof rule.value === 'function' ? rule.value(ctx) : rule.value;
            return note(rule.featId, rule.text(ctx), value === undefined ? {} : { value });
        }),
        // Coup critique élargi (Champion, L'Hoplite) : capacité de sous-classe
        ...subclassWeaponNotes(weapon, derived),
        // Manœuvres, Rossée de racines, Maître de la lance (lot 5)
        ...subclassCombatWeaponNotes(weapon, derived)];
}
