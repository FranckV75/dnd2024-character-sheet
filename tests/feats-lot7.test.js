// =============================================================================
// Lot 7 : Frappe à mains nues (PHB 2024 p. 377) et dons d'armes ou de rappels
// (Athlète, Bagarreur de tavernes, Combattant à deux armes, Combattant monté, Comédien, Discret,
// Empoigneur, Façonneur, Formation aux armes de guerre, Maître d'armes, Maître arbalétrier,
// Tireur d'élite). Règles vérifiées dans le Player's Handbook 2024 anglais.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { featEffects, weaponFeatNotes, AUTOMATED_FEATS, actorDC, grappleDC } from '../js/rules/feat-effects.js';
import { planShortRest, planLongRest } from '../js/rules/rest.js';
import { deriveCharacter, computeWeapon, weaponStatOverride } from '../js/rules/character.js';
import { rowFromRulebookWeapon, isUnarmedStrike, isCrossbow, matchesWeaponFilter } from '../js/rules/weapons.js';
import { masteryDetails } from '../js/rules/weapon-masteries.js';
import { armorRowFromCatalogue } from '../js/rules/armors.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { EQUIPMENT_DATA } from '../js/data/equipment.js';
import { EMPTY_WEAPON, createDefaultCharacter } from '../js/state/schema.js';

const weapon = (name) => rowFromRulebookWeapon({ ...EMPTY_WEAPON }, DD_RULES.weapons.find(w => w.name === name));
const unarmed = () => weapon('Frappe à mains nues');
const armor = (name) => ({ ...armorRowFromCatalogue(EQUIPMENT_DATA.armors.find(a => a.name === name)), equipped: true });

// Guerrier niveau 5 : For 16 (+3), Dex 14 (+2), Cha 12 (+1), bonus de maîtrise +3
const hero = (extra = {}) => ({
    ...createDefaultCharacter(),
    char_class: 'Guerrier', char_level: '5', str_score: '16', dex_score: '14', con_score: '14', cha_score: '12',
    hp_max: '44', hp_current: '44', hd_type: 'd10', hd_current: '0',
    ...extra
});
// Moine niveau 5 : For 14 (+2), Dex 18 (+4), dé d'arts martiaux 1d8
const monk = (extra = {}) => hero({ char_class: 'Moine', str_score: '14', dex_score: '18', hd_type: 'd8', ...extra });

const strike = (row, character, buffs) => computeWeapon(row, deriveCharacter(character), buffs);
const notesOf = (row, character, buffs) => weaponFeatNotes(row, character, deriveCharacter(character), buffs);
const slotTexts = (character, level) => (featEffects(character)[`featSlot:${level}`] ?? []).map(n => n.text);

const LOT7 = ['athlete', 'bagarreur_de_tavernes', 'combattant_a_deux_armes', 'combattant_monte', 'comedien', 'discret',
    'empoigneur', 'faconneur', 'formation_aux_armes_de_guerre', 'maitre_d_armes', 'maitre_arbaletrier', 'tireur_d_elite'];

describe('Frappe à mains nues (PHB 2024 p. 377)', () => {
    test('dans la liste du manuel, reconnue, au corps à corps', () => {
        const row = unarmed();
        assert.ok(isUnarmedStrike(row));
        assert.ok(!isUnarmedStrike(weapon('Dague')));
        assert.ok(matchesWeaponFilter(row, 'melee'));
        assert.ok(!matchesWeaponFilter(row, 'ranged'));
        assert.ok(!matchesWeaponFilter(row, 'simple') && !matchesWeaponFilter(row, 'martial'));
    });

    test('sans don : 1 + mod. de Force contondants, attaque Force + maîtrise', () => {
        const result = strike(unarmed(), hero());
        assert.equal(result.damage.text, '1 +3 CONT');
        assert.equal(result.attack.text, 'FOR : +6');
    });

    test('Bagarreur de tavernes : 1d4 ; Combat à mains nues : 1d6 (le plus gros dé)', () => {
        assert.equal(strike(unarmed(), hero({ feat_1: 'bagarreur_de_tavernes' })).damage.text, '1d4 +3 CONT');
        assert.equal(strike(unarmed(), hero({ feat_2: 'combat_a_mains_nues' })).damage.text, '1d6 +3 CONT');
        assert.equal(strike(unarmed(), hero({ feat_1: 'bagarreur_de_tavernes', feat_2: 'combat_a_mains_nues' })).damage.text, '1d6 +3 CONT');
    });

    test('Moine : dé d\'arts martiaux et Dextérité si elle est meilleure (Arts martiaux)', () => {
        const result = strike(unarmed(), monk());
        assert.equal(result.damage.text, '1d8 +4 CONT');
        assert.match(result.attack.tooltip, /^DEX/);
        // Bagarreur ne réduit pas le dé du Moine
        assert.equal(strike(unarmed(), monk({ feat_1: 'bagarreur_de_tavernes' })).damage.text, '1d8 +4 CONT');
        // Force meilleure : la Force reste
        assert.equal(strike(unarmed(), monk({ str_score: '18', dex_score: '12' })).damage.text, '1d8 +4 CONT');
        assert.equal(weaponStatOverride(unarmed(), deriveCharacter(monk({ str_score: '18', dex_score: '12' }))), '');
    });

    test('Moine : ses armes utilisent aussi la Dextérité ; pas les autres classes ni les autres armes', () => {
        assert.match(strike(weapon('Bâton'), monk()).damage.text, /^1d8 \+4 CONT/);
        assert.match(strike(weapon('Bâton'), hero()).damage.text, /^1d6 \+3 CONT/);
        assert.match(strike(weapon('Épée longue'), monk()).damage.text, /^1d8 \+2 TRAN/);
        assert.equal(weaponStatOverride(weapon('Épée longue'), deriveCharacter(monk())), '');
        // Botte d'arme : même caractéristique que le tableau
        const staff = { ...weapon('Bâton'), prof: 'Renversement' };
        const topple = masteryDetails(staff, monk()).values[0];
        assert.equal(topple.value, String(8 + 4 + 3));
    });

    test("Moine en armure ou avec un bouclier : ni Dextérité ni dé d'arts martiaux (PHB 2024 p. 101)", () => {
        for (const worn of ['Armure de cuir', 'Bouclier']) {
            const c = monk({ dynamic_armors: [armor(worn)] });
            assert.equal(strike(unarmed(), c).damage.text, '1 +2 CONT', worn);
            assert.match(strike(weapon('Bâton'), c).damage.text, /^1d6 \+2 CONT/, worn);
            assert.equal(grappleDC(deriveCharacter(c)), 8 + 2 + 3, worn);
        }
    });

    test("Moine : le dé d'arts martiaux seulement s'il est plus gros ; pas la Fléchette (arme à distance)", () => {
        assert.match(strike(weapon('Massue'), monk({ char_level: '1' })).damage.text, /^1d8 \+4 CONT/);
        assert.match(strike(weapon('Fléchette'), monk()).damage.text, /^1d4 \+4 PERF/);
    });

    test('reconnue aussi par sa catégorie (nom au pluriel ou renommé)', () => {
        for (const name of ['Frappes à mains nues', 'Poings']) {
            const row = { ...unarmed(), name };
            assert.ok(isUnarmedStrike(row), name);
            assert.equal(strike(row, monk()).damage.text, '1d8 +4 CONT', name);
        }
    });

    test('caractéristique et dé imposés dans la configuration restent prioritaires', () => {
        const row = { ...unarmed(), weaponConfig: JSON.stringify({ dmgDieOverride: '1d10', statOverride: 'str' }) };
        assert.equal(strike(row, monk({ feat_1: 'bagarreur_de_tavernes' })).damage.text, '1d10 +2 CONT');
    });

    test('pas une arme : ni Duel, ni Sauvagerie martiale ; la Rage compte (Force)', () => {
        const character = hero({ feat_2: 'duel', feat_1: 'sauvagerie_martiale' });
        assert.doesNotMatch(strike(unarmed(), character, { dueling: true }).damage.text, /Duel/);
        const ids = notesOf(unarmed(), character, { dueling: true }).map(n => n.featId);
        assert.ok(!ids.includes('duel') && !ids.includes('sauvagerie_martiale'));
        // Ni Abattage (Cogneur lourd), ni Poison, réservés aux armes ; la Charge, elle, vaut
        const more = notesOf(unarmed(), hero({ feat_4: 'maitre_des_armes_lourdes_cogneur_lourd', feat_8: 'expert_de_la_charge', char_level: '8' })).map(n => n.featId);
        assert.ok(!more.includes('maitre_des_armes_lourdes_cogneur_lourd'));
        assert.ok(more.includes('expert_de_la_charge'));
        assert.match(strike(unarmed(), hero({ char_class: 'Barbare' }), { rage: true }).damage.text, /\(Rage\)/);
    });

    test('rappels sous la ligne : Bagarreur, Empoigneur (DD de Lutte), Combat à mains nues', () => {
        const character = hero({ feat_1: 'bagarreur_de_tavernes', feat_2: 'combat_a_mains_nues', feat_4: 'empoigneur' });
        const notes = notesOf(unarmed(), character);
        assert.match(notes.find(n => n.featId === 'bagarreur_de_tavernes').text, /relancez les 1.*1,50 m/);
        const grappler = notes.find(n => n.featId === 'empoigneur');
        assert.equal(grappler.value, 8 + 3 + 3);
        assert.match(grappler.text, /DD 14/);
        assert.match(notes.find(n => n.featId === 'combat_a_mains_nues').text, /1d8 si vous ne tenez ni arme ni bouclier/);
        // Pas sur une vraie arme
        assert.ok(!notesOf(weapon('Dague'), character).some(n => ['bagarreur_de_tavernes', 'empoigneur'].includes(n.featId)));
    });

    test('DD de Lutte : Force, ou la meilleure de Force et Dextérité pour un Moine', () => {
        assert.equal(grappleDC(deriveCharacter(hero())), 14);
        assert.equal(grappleDC(deriveCharacter(monk())), 8 + 4 + 3);
    });

    test('sans ligne « Frappe à mains nues » : rappel discret pour l\'ajouter', () => {
        const hint = (c) => (featEffects(c)['featSlot:1'] ?? []).find(n => /peut être ajoutée au tableau/.test(n.text));
        assert.ok(hint(hero({ feat_1: 'bagarreur_de_tavernes' })).inactive);
        assert.equal(hint(hero({ feat_1: 'bagarreur_de_tavernes', dynamic_weapons: [unarmed()] })), undefined);
        // Ligne au bon nom mais pas rattachée au manuel : ses dégâts ne sont pas calculés, le rappel reste
        const typed = { ...EMPTY_WEAPON, name: 'Frappe à mains nues (Moine)' };
        assert.ok(hint(hero({ feat_1: 'bagarreur_de_tavernes', dynamic_weapons: [typed] })));
    });
});

describe('Dons d\'armes (lot 7)', () => {
    test('Tireur d\'élite : armes à distance et armes lancées, pas le corps à corps', () => {
        const c = hero({ feat_4: 'tireur_d_elite' });
        assert.match(notesOf(weapon('Arc long'), c).find(n => n.featId === 'tireur_d_elite').text, /^Ignore les Abris/);
        // Arme de corps à corps lancée : seul le contournement d'abri vaut (pas la longue portée ni le contact)
        assert.equal(notesOf(weapon('Dague'), c).find(n => n.featId === 'tireur_d_elite').text, 'Lancée, elle ignore les Abris partiels et supérieurs.');
        assert.ok(!notesOf(weapon('Épée longue'), c).some(n => n.featId === 'tireur_d_elite'));
        assert.ok(!notesOf(unarmed(), c).some(n => n.featId === 'tireur_d_elite'));
    });

    test('Maître arbalétrier : les trois arbalètes ; l\'attaque en plus avec l\'arbalète de poing', () => {
        const c = hero({ feat_4: 'maitre_arbaletrier' });
        assert.ok(['Arbalète de poing', 'Arbalète légère', 'Arbalète lourde'].every(name => isCrossbow(weapon(name))));
        const hand = notesOf(weapon('Arbalète de poing'), c).find(n => n.featId === 'maitre_arbaletrier');
        assert.match(hand.text, /Chargement ignoré.*attaque en plus \(Légère\) garde le modificateur aux dégâts : 1d6 \+2 PERF/);
        const heavy = notesOf(weapon('Arbalète lourde'), c).find(n => n.featId === 'maitre_arbaletrier');
        assert.doesNotMatch(heavy.text, /attaque en plus/);
        assert.ok(!notesOf(weapon('Arc long'), c).some(n => n.featId === 'maitre_arbaletrier'));
    });

    test('Combattant à deux armes : armes de corps à corps ni Légères ni à Deux mains', () => {
        const c = hero({ feat_4: 'combattant_a_deux_armes' });
        assert.ok(notesOf(weapon('Épée longue'), c).some(n => n.featId === 'combattant_a_deux_armes'));
        for (const name of ['Dague', 'Hache à deux mains', 'Arc long', 'Frappe à mains nues']) {
            assert.ok(!notesOf(weapon(name), c).some(n => n.featId === 'combattant_a_deux_armes'), name);
        }
    });
});

describe('Rappels des dons (lot 7)', () => {
    test('chaque don du lot est automatisé et a une note dans son encadré', () => {
        for (const id of LOT7) {
            assert.ok(AUTOMATED_FEATS.includes(id), id);
            const level = ['bagarreur_de_tavernes', 'faconneur'].includes(id) ? 1 : 4;
            assert.ok(slotTexts(hero({ [`feat_${level}`]: id }), level).length > 0, id);
        }
    });

    test('Athlète : repère à côté de la Vitesse (la Vitesse saisie n\'est pas modifiée)', () => {
        const c = hero({ feat_4: 'athlete', speed: '9 m' });
        const speed = featEffects(c).speed;
        assert.equal(speed.length, 1);
        assert.match(speed[0].text, /Vitesse d'escalade égale à votre Vitesse/);
        assert.equal(c.speed, '9 m');
    });

    test('Comédien : DD de l\'Imitation 8 + Charisme + maîtrise ; repères Tromperie et Représentation', () => {
        const c = hero({ feat_4: 'comedien' });
        assert.equal(actorDC(deriveCharacter(c)), 8 + 1 + 3);
        const effects = featEffects(c);
        assert.equal(effects['skills.deception'].length, 1);
        assert.equal(effects['skills.performance'].length, 1);
        assert.ok(effects['featSlot:4'].some(n => n.value === 12 && /DD 12/.test(n.text)));
    });

    test('Discret : repère à côté de Discrétion', () => {
        assert.match(featEffects(hero({ feat_4: 'discret' }))['skills.stealth'][0].text, /action Furtivité/);
    });

    test('Façonneur : rappel au repos long seulement', () => {
        const c = hero({ feat_1: 'faconneur' });
        assert.ok(planLongRest(c).summary.featNotes.some(n => n.featId === 'faconneur'));
        assert.ok(!planShortRest(c, {}).summary.featNotes.some(n => n.featId === 'faconneur'));
    });

    test('Formation aux armes de guerre : maîtrise des armes de guerre comptée', () => {
        const [note] = slotTexts(hero({ feat_4: 'formation_aux_armes_de_guerre' }), 4);
        assert.match(note, /bonus de maîtrise à l'attaque des armes de guerre/);
    });
});
