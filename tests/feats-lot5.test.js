/**
 * TESTS UNITAIRES — DONS DU LOT 5 (vitesse, PV temporaires, armures, armes d'hast, poison) et +1 des
 * dons généraux. Règles vérifiées dans le Player's Handbook 2024 anglais : Speedy p. 208, Inspiring
 * Leader p. 204, Spell Sniper p. 208, Lightly / Moderately / Heavily Armored p. 204-205, Defensive
 * Duelist p. 203, Durable p. 203, Chef p. 202, Poisoner p. 206, Polearm Master p. 206.
 * La fiche ne modifie jamais une valeur saisie : elle affiche des repères, des calculs et des rappels.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { featEffects, weaponFeatNotes, isPolearm, poisonerDC, AUTOMATED_FEATS } from '../js/rules/feat-effects.js';
import { FEAT_CHOICE_RULES, asiAbilities, featChoiceGrants } from '../js/rules/feat-choices.js';
import { FEAT_COUNTERS, featCounters } from '../js/rules/feat-uses.js';
import { planShortRest, planLongRest } from '../js/rules/rest.js';
import { deriveCharacter } from '../js/rules/character.js';
import { rowFromRulebookWeapon } from '../js/rules/weapons.js';
import { FEATS_DATA } from '../js/data/feats.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { EMPTY_WEAPON, createDefaultCharacter } from '../js/state/schema.js';

const weapon = (name) => rowFromRulebookWeapon({ ...EMPTY_WEAPON }, DD_RULES.weapons.find(w => w.name === name));

/** Guerrier niveau 5 (bonus de maîtrise +3), For 16, Dex 16, Con 14, Sag 14, Cha 12 */
const hero = (extra = {}) => ({
    ...createDefaultCharacter(),
    char_class: 'Guerrier', char_level: '5', str_score: '16', dex_score: '16', con_score: '14', wis_score: '14', cha_score: '12',
    hp_max: '44', hp_current: '44', hd_type: 'd10', hd_current: '0',
    ...extra
});
const slotTexts = (character, level) => (featEffects(character)[`featSlot:${level}`] ?? []).map(n => n.text);

describe('+1 des dons généraux (lot 5)', () => {
    test('lecture du champ « asi »', () => {
        assert.deepEqual(asiAbilities('+1 For ou Dex'), ['str', 'dex']);
        assert.deepEqual(asiAbilities('+1 Int ou Sag ou Cha'), ['int', 'wis', 'cha']);
        assert.deepEqual(asiAbilities('+1 Con'), ['con']);
        assert.deepEqual(asiAbilities('Aucune'), []);
        assert.deepEqual(asiAbilities('+1 au choix (max 30)'), []);
        assert.deepEqual(asiAbilities(undefined), []);
    });

    test('chaque don général avec un +1 a son menu (ou sa caractéristique fixe) ; pas les faveurs épiques', () => {
        const general = Object.entries(FEATS_DATA).filter(([, f]) => f.type === 'Général' && f.asi && f.asi !== 'Aucune');
        for (const [id, feat] of general) {
            const rule = FEAT_CHOICE_RULES[id];
            assert.ok(rule, id);
            const expected = asiAbilities(feat.asi);
            if (rule.fixedAbility && !rule.fields.length) assert.deepEqual([rule.fixedAbility], expected, id);
            else if (expected.length) {
                const field = rule.fields.find(f => f.key === 'ability');
                // Les dons du lot 3 et du lot 6 gardent leur propre menu (Expert : toutes les caractéristiques)
                if (field && FEAT_CHOICE_RULES[id].fields.length === 1) assert.deepEqual(field.options.map(([value]) => value), expected, id);
            }
        }
        assert.equal(FEAT_CHOICE_RULES.faveur_du_destin, undefined);
        assert.deepEqual(FEAT_CHOICE_RULES.gaillard, { fixedAbility: 'con', fields: [] });
        assert.deepEqual(FEAT_CHOICE_RULES.duelliste_defensif, { fixedAbility: 'dex', fields: [] });
        assert.deepEqual(FEAT_CHOICE_RULES.sentinelle.fields[0].options.map(([v]) => v), ['str', 'dex']);
    });

    test('le +1 choisi donne le repère près de la caractéristique, sans rien modifier', () => {
        const character = hero({ feat_4: 'sentinelle', feat_choices: { 4: { sentinelle: { ability: 'str' } } } });
        const effects = featEffects(character);
        assert.ok(effects['scores.str'].some(n => n.value === 1 && n.manual && n.slot === 4));
        assert.equal(character.str_score, '16');
        // Sans choix : en attente, rien près des valeurs
        const none = featEffects(hero({ feat_4: 'sentinelle' }));
        assert.ok(none['featSlot:4'].some(n => n.inactive && /Caractéristique \+1/.test(n.text)));
        assert.deepEqual(none['scores.str'], []);
    });

    test('le même don à choix dans deux emplacements : une alerte, pas de rappels en double', () => {
        const effects = featEffects(hero({ char_level: '8', feat_4: 'sentinelle', feat_8: 'sentinelle' }));
        const second = effects['featSlot:8'];
        assert.equal(second.filter(n => /déjà pris au niveau 4/.test(n.text)).length, 1);
        assert.equal(second.length, 1);
    });
});

describe('Mobile (Speedy) et Incantateur d\'élite (Spell Sniper)', () => {
    test('Mobile : « dont +3 m » près de la Vitesse, jamais ajoutés', () => {
        const character = hero({ feat_4: 'mobile', speed: '9 m' });
        const effects = featEffects(character);
        assert.deepEqual(effects.speed.map(n => [n.value, n.manual]), [[3, true]]);
        assert.equal(character.speed, '9 m');
        assert.ok(slotTexts(character, 4).some(t => /^Foncer/.test(t)));
        assert.ok(slotTexts(character, 4).some(t => /attaques d'opportunité contre vous ont le Désavantage/.test(t)));
    });

    test("Incantateur d'élite : +18 m, abris, contact", () => {
        const texts = slotTexts(hero({ feat_4: 'incantateur_d_elite' }), 4);
        assert.ok(texts.some(t => /au moins 3 m peut porter 18 m plus loin/.test(t)));
        assert.ok(texts.some(t => /abris partiels \(\+2 CA\) et importants \(\+5 CA\)/.test(t)));
        assert.ok(texts.some(t => /1,50 m/.test(t)));
    });
});

describe('Figure de proue (Inspiring Leader)', () => {
    test('PV temporaires = niveau + modificateur de la caractéristique augmentée par le don', () => {
        const character = hero({ feat_4: 'figure_de_proue', feat_choices: { 4: { figure_de_proue: { ability: 'wis' } } } });
        const effects = featEffects(character);
        assert.deepEqual(effects.rest.map(n => n.value), [7]);
        assert.match(effects.rest[0].text, /7 PV temporaires \(niveau 5 \+2 Sagesse\)/);
        // Rappel à la fin des deux repos
        assert.ok(planShortRest(character, {}).summary.featNotes.some(n => n.featId === 'figure_de_proue'));
        assert.ok(planLongRest(character).summary.featNotes.some(n => n.featId === 'figure_de_proue'));
    });

    test('le +1 sur la caractéristique la plus faible : modificateur négatif compté tel quel', () => {
        const character = hero({ cha_score: '13', wis_score: '9', feat_4: 'figure_de_proue', feat_choices: { 4: { figure_de_proue: { ability: 'wis' } } } });
        assert.deepEqual(featEffects(character).rest.map(n => n.value), [4]);
    });

    test('caractéristique pas choisie : en attente, aucun rappel de repos', () => {
        const effects = featEffects(hero({ feat_4: 'figure_de_proue' }));
        assert.deepEqual(effects.rest, []);
        assert.ok(effects['featSlot:4'].some(n => n.inactive && /niveau \+ modificateur/.test(n.text)));
    });
});

describe('Protections (Lightly / Moderately / Heavily Armored)', () => {
    test('Protection légère : formations à cocher, puis cochées ; la fiche ne coche rien', () => {
        const unticked = hero({ char_class: 'Magicien', feat_4: 'protection_legere' });
        const notes = featEffects(unticked)['featSlot:4'];
        assert.equal(notes.filter(n => n.check && /à cocher/.test(n.text)).length, 2);
        assert.equal(unticked.prof_armor_light, false);
        const ticked = featEffects(hero({ char_class: 'Magicien', feat_4: 'protection_legere', prof_armor_light: true, prof_armor_shield: true }))['featSlot:4'];
        assert.equal(ticked.filter(n => n.ticked).length, 2);
    });

    test('formation déjà donnée par la classe : le don n\'apporte que son +1', () => {
        const texts = slotTexts(hero({ feat_4: 'protection_legere', prof_armor_light: true, prof_armor_shield: true }), 4);
        assert.ok(texts.some(t => /Votre classe \(Guerrier\) donne déjà cette formation/.test(t)));
    });

    test('prérequis : intermédiaire demande les légères, lourde demande les intermédiaires', () => {
        const medium = featEffects(hero({ char_class: 'Magicien', feat_4: 'protection_intermediaire' }))['featSlot:4'];
        assert.ok(medium.some(n => n.check && /Prérequis : formation aux armures légères/.test(n.text)));
        assert.ok(medium.some(n => /ne donne pas la formation aux boucliers/.test(n.text)));
        const heavy = featEffects(hero({ char_class: 'Clerc', feat_4: 'protection_lourde', prof_armor_med: true }))['featSlot:4'];
        assert.ok(!heavy.some(n => /Prérequis/.test(n.text)));
        assert.ok(heavy.some(n => n.check && /armures lourdes à cocher/.test(n.text)));
    });

    test('Druide 2024 : armures légères et boucliers seulement', () => {
        assert.deepEqual(DD_RULES.classes.druid.armorProf, ['light', 'shield']);
    });
});

describe('Duelliste défensif et Gaillard', () => {
    test('Parade : + bonus de maîtrise près de la CA et sur les armes de Finesse', () => {
        const character = hero({ feat_4: 'duelliste_defensif', dynamic_weapons: [weapon('Rapière'), weapon('Hache d\'armes')] });
        const effects = featEffects(character);
        assert.deepEqual(effects.armorClass.filter(n => n.featId === 'duelliste_defensif').map(n => n.value), [3]);
        assert.ok(weaponFeatNotes(character.dynamic_weapons[0], character).some(n => /^Parade/.test(n.text)));
        assert.ok(!weaponFeatNotes(character.dynamic_weapons[1], character).some(n => /^Parade/.test(n.text)));
        // Sans arme de Finesse, et Dextérité sous le prérequis
        const bare = featEffects(hero({ dex_score: '12', feat_4: 'duelliste_defensif' }))['featSlot:4'];
        assert.ok(bare.some(n => n.inactive && /Aucune arme de Finesse/.test(n.text)));
        assert.ok(bare.some(n => n.check && /Dextérité 13 ou plus \(valeur saisie : 12\)/.test(n.text)));
    });

    test('Gaillard : Avantage contre la mort, dés de vie restants pour la Récupération rapide', () => {
        const character = hero({ feat_4: 'gaillard', hd_current: '2' });
        const effects = featEffects(character);
        assert.equal(effects.deathSaves.length, 1);
        assert.ok(effects['featSlot:4'].some(n => /\(d10\).*Dés de vie restants : 3 sur 5/.test(n.text)));
        assert.ok(effects['scores.con'].some(n => n.value === 1));
        const spent = featEffects(hero({ feat_4: 'gaillard', hd_current: '5' }))['featSlot:4'];
        assert.ok(spent.some(n => n.inactive && /restants : 0 sur 5/.test(n.text)));
    });
});

describe('Chef cuisinier (Chef)', () => {
    test('friandises = bonus de maîtrise, refaites au repos long', () => {
        assert.equal(FEAT_COUNTERS.chef_cuisinier.reset, 'long');
        const counters = featCounters(hero({ feat_4: 'chef_cuisinier' }), deriveCharacter(hero()));
        assert.deepEqual(counters.map(c => [c.featId, c.max]), [['chef_cuisinier', 3]]);
        assert.ok(AUTOMATED_FEATS.includes('chef_cuisinier'));
    });

    test('Repas reconstituant : rappel au repos court seulement', () => {
        const character = hero({ feat_4: 'chef_cuisinier' });
        const short = planShortRest(character, {}).summary.featNotes.filter(n => n.featId === 'chef_cuisinier');
        assert.equal(short.length, 1);
        assert.match(short[0].text, /jusqu'à 7 créatures/);
        assert.deepEqual(planLongRest(character).summary.featNotes.filter(n => n.featId === 'chef_cuisinier'), []);
    });

    test('ustensiles de cuisinier : à noter, ou notés', () => {
        assert.ok(featEffects(hero({ feat_4: 'chef_cuisinier' }))['featSlot:4'].some(n => n.check && /Ustensiles de cuisinier : maîtrise à noter/.test(n.text)));
        assert.ok(featEffects(hero({ feat_4: 'chef_cuisinier', profs_tools: 'Ustensiles de <b>cuisinier</b>' }))['featSlot:4'].some(n => n.ticked));
    });
});

describe('Empoisonneur (Poisoner) et Maître d\'hast (Polearm Master)', () => {
    test('DD du poison : 8 + mod. de la caractéristique augmentée + maîtrise', () => {
        const character = hero({ feat_4: 'empoisonneur', feat_choices: { 4: { empoisonneur: { ability: 'dex' } } }, dynamic_weapons: [weapon('Dague')] });
        const d = deriveCharacter(character);
        assert.equal(poisonerDC(character, d), 14);
        assert.ok(featEffects(character)['featSlot:4'].some(n => n.value === 14 && /DD 14/.test(n.text)));
        assert.ok(weaponFeatNotes(character.dynamic_weapons[0], character).some(n => n.value === 14 && /^Poison/.test(n.text)));
        // Caractéristique pas choisie : pas de DD, pas de rappel sur les armes
        const open = hero({ feat_4: 'empoisonneur', dynamic_weapons: [weapon('Dague')] });
        assert.equal(poisonerDC(open, deriveCharacter(open)), null);
        assert.ok(!weaponFeatNotes(open.dynamic_weapons[0], open).some(n => /^Poison/.test(n.text)));
        assert.match(FEATS_DATA.empoisonneur.desc, /jusqu'à ce que vous touchiez avec l'objet empoisonné/);
    });

    test("armes d'hast : Bâton, Lance, armes Lourdes à Allonge", () => {
        for (const name of ['Bâton', 'Lance', 'Coutille', 'Hallebarde', 'Pique', "Lance d'arçon"]) assert.ok(isPolearm(weapon(name)), name);
        for (const name of ['Rapière', 'Hache à deux mains', 'Dague']) assert.ok(!isPolearm(weapon(name)), name);
        assert.ok(isPolearm({ ...weapon('Bâton'), name: 'Bâton +1' }));
    });

    test('Frappe double calculée sur la ligne (d4 contondant, même attaque)', () => {
        const character = hero({ feat_4: 'maitre_d_hast', dynamic_weapons: [weapon('Hallebarde'), weapon('Bâton')] });
        const [halberd, staff] = character.dynamic_weapons.map(w => weaponFeatNotes(w, character).find(n => n.featId === 'maitre_d_hast').text);
        assert.match(halberd, /attaque \+6 avec l'autre bout, 1d4 \+3 CONT/);
        assert.match(halberd, /allonge \(3 m\)/);
        assert.match(staff, /allonge \(1,50 m\)/);
        assert.ok(featEffects(hero({ feat_4: 'maitre_d_hast' }))['featSlot:4'].some(n => n.inactive && /Aucune de ces armes/.test(n.text)));
    });

    test("armes d'hast renommées : « Bâton de feu » oui, « Lance-pierre » non", () => {
        for (const name of ['Bâton de feu', 'Lance de foudre +1', 'Bâton dansant', 'Lance (magique)']) {
            assert.ok(isPolearm({ ...weapon('Bâton'), name }), name);
        }
        assert.ok(!isPolearm({ ...weapon('Fronde'), name: 'Lance-pierre' }));
    });

    test("Frappe double : toujours 1d4 contondant, bonus magique gardé, dé et type réglés ignorés", () => {
        const staff = { ...weapon('Bâton'), weaponConfig: JSON.stringify({ dmgDieOverride: '1d8', dmgTypeOverride: 'FEU', magicBonus: 1 }) };
        const character = hero({ feat_4: 'maitre_d_hast', dynamic_weapons: [staff] });
        const text = weaponFeatNotes(staff, character).find(n => n.featId === 'maitre_d_hast').text;
        assert.match(text, /attaque \+7 avec l'autre bout, 1d4 \+4 CONT/);
    });

    test('Frappe double : la Rage compte, pas Cogneur lourd', () => {
        const glaive = weapon('Coutille');
        const character = hero({ char_class: 'Barbare', feat_4: 'maitre_d_hast', dynamic_weapons: [glaive] });
        const text = (buffs) => weaponFeatNotes(glaive, character, undefined, buffs).find(n => n.featId === 'maitre_d_hast').text;
        assert.match(text({ rage: true }), /Rage/);
        assert.doesNotMatch(text({ heavyWeaponMaster: true }), /Cogneur|\+3 \(/);
        assert.doesNotMatch(text({}), /Rage/);
    });
});

describe('Gaillard sans dé de vie connu', () => {
    test('pas de « (dé) » quand ni la classe ni le dé de vie ne sont saisis', () => {
        const text = featEffects(hero({ feat_4: 'gaillard', char_class: '', hd_type: '' }))['featSlot:4'].map(n => n.text).join(' ');
        assert.match(text, /dépensez un dé de vie et regagnez/);
    });
});

describe('Encadré du don : notes des dons non calculés', () => {
    test('un don qui ne donne que son +1 a des notes (le reste est un rappel)', () => {
        const grants = featChoiceGrants(hero({ feat_4: 'athlete', feat_choices: { 4: { athlete: { ability: 'dex' } } } }));
        assert.deepEqual(grants.map(g => g.abilities), [[{ ability: 'dex', amount: 1 }]]);
        assert.ok(AUTOMATED_FEATS.includes('athlete')); // ses rappels : lot 7
    });
});
