/**
 * TESTS UNITAIRES — RULES/FEATS.JS (dons atteints) et RULES/FEAT-EFFECTS.JS (effets des dons, lot 1)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { characterLevel, featSlots, reachedFeatIds, hasFeat, featName } from '../js/rules/feats.js';
import {
    FEAT_ZONES, AUTOMATED_FEATS, featEffects, weaponFeatNotes, restFeatNotes, shieldBashDC, toughHitPoints
} from '../js/rules/feat-effects.js';
import { deriveCharacter, computeWeapon } from '../js/rules/character.js';
import { effectiveBuffs, rowFromRulebookWeapon } from '../js/rules/weapons.js';
import { planShortRest, planLongRest } from '../js/rules/rest.js';
import { FEATS_DATA } from '../js/data/feats.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { EMPTY_WEAPON, createDefaultCharacter } from '../js/state/schema.js';
import { migrateCharacter } from '../js/state/migrate.js';

const weapon = (name) => rowFromRulebookWeapon({ ...EMPTY_WEAPON }, DD_RULES.weapons.find(w => w.name === name));

const deepFreeze = (obj) => {
    for (const value of Object.values(obj)) if (value && typeof value === 'object') deepFreeze(value);
    return Object.freeze(obj);
};

/** Guerrier niveau 4 (bonus de maîtrise +2), For 16 (+3), Dex 14 (+2) */
function fighter(overrides = {}) {
    return {
        ...createDefaultCharacter(),
        char_class: 'Guerrier',
        char_level: '4',
        str_score: '16', dex_score: '14', con_score: '14',
        hp_max: '40', hp_current: '40',
        ...overrides
    };
}

const texts = (notes) => notes.map(n => n.text);
const ids = (notes) => notes.map(n => n.featId);

describe('feats.js : dons atteints', () => {
    test('identifiants des lots connus dans js/data/feats.js', () => {
        // Guerrier béni / druidique : options à la place du style de combat, pas des dons
        for (const id of AUTOMATED_FEATS) assert.ok(FEATS_DATA[id] || ['guerrier_beni', 'guerrier_druidique'].includes(id), id);
    });

    test('niveau lu comme la fiche (premier entier, entre 1 et 20)', () => {
        assert.equal(characterLevel('4'), 4);
        assert.equal(characterLevel('<font color="#1a1a1a">4</font>'), 4);
        assert.equal(characterLevel('Niveau 8'), 8);
        assert.equal(characterLevel(12), 12);
        assert.equal(characterLevel(''), 1);
        assert.equal(characterLevel(undefined), 1);
        assert.equal(characterLevel('25'), 20);
        assert.equal(characterLevel('-3'), 1);
    });

    test('seuls les emplacements de la fiche comptent (1, 4, 8, 12, 16, 19)', () => {
        // feat_0 (pas Humain), feat_2 (pas de style de combat sans classe) ou feat_3 : jamais comptées
        const c = { char_level: '12', feat_0: 'musicien', feat_2: 'vigilant', feat_3: 'vigilant', feat_4: 'robuste', feat_20: 'chanceux' };
        assert.deepEqual(featSlots(c).map(slot => slot.level), [4]);
        assert.deepEqual(reachedFeatIds(c), ['robuste']);
        assert.deepEqual(featEffects(c).initiative, []);
        assert.deepEqual(featEffects(c).rest, []);
        assert.equal(deriveCharacter(c).initiative, deriveCharacter({ ...c, feat_2: '', feat_3: '' }).initiative);
    });

    test('seuls les emplacements atteints comptent, dans l\'ordre des niveaux, sans doublon', () => {
        const c = { char_level: '8', feat_8: 'robuste', feat_1: '<b>vigilant</b>', feat_4: 'vigilant', feat_12: 'chanceux', feat_16: '' };
        assert.deepEqual(reachedFeatIds(c), ['vigilant', 'robuste']);
        assert.deepEqual(featSlots(c), [
            { level: 1, featId: 'vigilant', reached: true },
            { level: 4, featId: 'vigilant', reached: true },
            { level: 8, featId: 'robuste', reached: true },
            { level: 12, featId: 'chanceux', reached: false }
        ]);
        assert.equal(hasFeat(c, 'robuste'), true);
        assert.equal(hasFeat(c, 'chanceux'), false, 'prévu pour plus tard');
    });

    test('fiche vide ou invalide : aucun don', () => {
        assert.deepEqual(reachedFeatIds(null), []);
        assert.deepEqual(reachedFeatIds({}), []);
        assert.deepEqual(reachedFeatIds({ char_level: '4', feat_4: '<br>' }), []);
        assert.deepEqual(featSlots('texte'), []);
    });

    test('nom français du don', () => {
        assert.equal(featName('vigilant'), 'Vigilant');
        assert.equal(featName('maitre_des_armes_lourdes_cogneur_lourd'), 'Cogneur lourd');
        assert.equal(featName('don_inconnu'), 'don_inconnu');
        assert.equal(featName('constructor'), 'constructor');
    });
});

describe('deriveCharacter : dons', () => {
    test('Vigilant atteint : Initiative = Dex + bonus de maîtrise, avec le détail', () => {
        const d = deriveCharacter(fighter({ feat_1: 'vigilant' }));
        assert.equal(d.initiative, 4);
        assert.equal(d.initiativeDetail, 'Dex +2, Vigilant +2');
        assert.deepEqual(d.feats, ['vigilant']);
        const high = deriveCharacter(fighter({ char_level: '17', dex_score: '8', feat_1: 'vigilant' }));
        assert.equal(high.initiative, 5); // -1 + 6
        assert.equal(high.initiativeDetail, 'Dex -1, Vigilant +6');
    });

    test('Vigilant prévu pour plus tard : Initiative inchangée', () => {
        const d = deriveCharacter(fighter({ feat_8: 'vigilant' }));
        assert.equal(d.initiative, 2);
        assert.equal(d.initiativeDetail, 'Dex +2');
        assert.deepEqual(d.feats, []);
    });

    test('armures équipées par catégorie', () => {
        const d = deriveCharacter(fighter({
            dynamic_armors: [
                { name: 'Harnois', type: 'Lourde', ca: '18', equipped: true },
                { name: 'Bouclier', type: 'Bouclier', ca: '+2', equipped: false }
            ]
        }));
        assert.deepEqual(d.wornArmor, { light: false, medium: false, heavy: true, shield: false, shieldTrained: false });
        assert.deepEqual(deriveCharacter({}).wornArmor, { light: false, medium: false, heavy: false, shield: false, shieldTrained: false });
        assert.equal(deriveCharacter(fighter({ prof_armor_shield: true })).wornArmor.shieldTrained, true);
    });

    test('Robuste ne modifie pas les PV max saisis', () => {
        const c = deepFreeze(fighter({ feat_1: 'robuste' }));
        assert.equal(c.hp_max, '40');
        assert.equal('hpMax' in deriveCharacter(c), false, 'aucune valeur de PV calculée');
    });

    test('non-régression : fiche sans don du lot 1 identique à avant (hors nouveaux champs)', () => {
        // Valeurs relevées avec la version précédente de deriveCharacter (avant les dons)
        const before = JSON.parse('{"level":6,"pb":3,"className":"Guerrier","classSlug":"fighter","scores":{"str":17,"dex":13,"con":15,"int":8,"wis":12,"cha":10},"mods":{"str":3,"dex":1,"con":2,"int":-1,"wis":1,"cha":0},"saves":{"str":{"proficient":true,"bonus":6},"dex":{"proficient":false,"bonus":1},"con":{"proficient":true,"bonus":5},"int":{"proficient":false,"bonus":-1},"wis":{"proficient":false,"bonus":1},"cha":{"proficient":false,"bonus":0}},"skills":{"acrobatics":{"stat":"dex","proficient":false,"expertise":false,"bonus":1},"arcana":{"stat":"int","proficient":false,"expertise":false,"bonus":-1},"athletics":{"stat":"str","proficient":true,"expertise":false,"bonus":6},"stealth":{"stat":"dex","proficient":false,"expertise":false,"bonus":1},"animal_handling":{"stat":"wis","proficient":false,"expertise":false,"bonus":1},"sleight_of_hand":{"stat":"dex","proficient":false,"expertise":false,"bonus":1},"history":{"stat":"int","proficient":false,"expertise":false,"bonus":-1},"intimidation":{"stat":"cha","proficient":false,"expertise":false,"bonus":0},"insight":{"stat":"wis","proficient":false,"expertise":false,"bonus":1},"investigation":{"stat":"int","proficient":false,"expertise":false,"bonus":-1},"medicine":{"stat":"wis","proficient":false,"expertise":false,"bonus":1},"nature":{"stat":"int","proficient":false,"expertise":false,"bonus":-1},"perception":{"stat":"wis","proficient":true,"expertise":false,"bonus":4},"persuasion":{"stat":"cha","proficient":false,"expertise":false,"bonus":0},"religion":{"stat":"int","proficient":false,"expertise":false,"bonus":-1},"performance":{"stat":"cha","proficient":false,"expertise":false,"bonus":0},"survival":{"stat":"wis","proficient":false,"expertise":false,"bonus":1},"deception":{"stat":"cha","proficient":false,"expertise":false,"bonus":0}},"initiative":1,"passivePerception":14,"armorClass":{"value":20,"source":"Harnois"},"spellcasting":null,"spellSlots":{},"classResource":{"count":3,"label":"Second Souffle","reset":"one"},"hitDie":"d10","exhaustion":{"level":0,"d20Penalty":0,"speedPenaltyM":0,"dead":false},"renownTier":"Inconnu"}');
        const record = {
            char_class: 'Guerrier', char_level: '6',
            str_score: '17', dex_score: '13', con_score: '15', int_score: '8', wis_score: '12', cha_score: '10',
            str_save_prof: true, con_save_prof: true,
            skill_prof_athletics: true, skill_prof_perception: true,
            prof_armor_shield: true, spell_ability: 'none',
            dynamic_armors: [
                { name: 'Harnois', type: 'Lourde', ca: '18', equipped: true },
                { name: 'Bouclier', type: 'Bouclier', ca: '+2', equipped: true }
            ],
            // Dons de Korgul (rappels seulement) et Vigilant prévu pour le niveau 8
            feat_1: 'sauvagerie_martiale', feat_4: 'maitre_des_armes_lourdes_cogneur_lourd', feat_8: 'vigilant'
        };
        const now = deriveCharacter(record);
        // Lot A (4.15.0) : sous-classe, Aura de protection et Touche-à-tout (0 pour ce Guerrier)
        const NEW_FIELDS = ['feats', 'initiativeDetail', 'wornArmor', 'subclass', 'auraOfProtection', 'jackOfAllTrades'];
        // Aller-retour JSON, comme le relevé (-0 de l'Épuisement au niveau 0 devient 0)
        const kept = Object.fromEntries(Object.entries(now).filter(([key]) => !NEW_FIELDS.includes(key)));
        // Détail par ligne du tableau des armures (ajouté avec la colonne CA calculée) : même valeur et même source
        kept.armorClass = { value: now.armorClass.value, source: now.armorClass.source };
        kept.saves = Object.fromEntries(Object.entries(now.saves).map(([id, { aura, ...save }]) => [id, save]));
        kept.skills = Object.fromEntries(Object.entries(now.skills).map(([id, { jack, ...skill }]) => [id, skill]));
        assert.ok(Object.values(now.saves).every(save => save.aura === 0) && Object.values(now.skills).every(skill => skill.jack === 0));
        assert.deepEqual(JSON.parse(JSON.stringify(kept)), before);
        assert.deepEqual(Object.keys(now).filter(key => !(key in before)).sort(), [...NEW_FIELDS].sort());
    });
});

describe('featEffects : structure', () => {
    test('zones fixes toujours présentes, vides sans don', () => {
        const effects = featEffects(fighter());
        assert.deepEqual(Object.keys(effects), [...FEAT_ZONES]);
        for (const zone of FEAT_ZONES) assert.deepEqual(effects[zone], [], zone);
        assert.deepEqual(Object.keys(featEffects(null)), [...FEAT_ZONES]);
    });

    test('chaque note : featId, featName, text (value, applied, manual, inactive facultatifs)', () => {
        const c = fighter({ char_level: '19', feat_1: 'vigilant', feat_4: 'robuste', feat_8: 'mage_de_guerre',
            feat_12: 'maitre_des_armures_lourdes', feat_16: 'musicien', feat_19: 'guerisseur',
            dynamic_weapons: [weapon('Hache à deux mains')] });
        for (const [zone, notes] of Object.entries(featEffects(c))) {
            for (const n of notes) {
                assert.equal(typeof n.featId, 'string', zone);
                assert.equal(n.featName, FEATS_DATA[n.featId].name, zone);
                assert.ok(n.text.length > 0, zone);
                assert.ok(!/<[^>]+>/.test(n.text), `pas de HTML : ${zone}`);
                // slot : emplacement d'un don à choix (son +1, lot 5)
                for (const key of Object.keys(n)) assert.ok(['featId', 'featName', 'text', 'value', 'applied', 'manual', 'inactive', 'slot'].includes(key), key);
            }
        }
    });

    test('le personnage n\'est jamais modifié', () => {
        const c = deepFreeze(fighter({ feat_1: 'robuste', feat_4: 'vigilant', dynamic_weapons: [weapon('Rapière')] }));
        assert.doesNotThrow(() => featEffects(c));
    });

    test('don prévu pour plus tard : aucune note, aucun emplacement', () => {
        const effects = featEffects(fighter({ feat_8: 'robuste', feat_12: 'vigilant', dynamic_weapons: [weapon('Hache à deux mains')] }));
        for (const zone of FEAT_ZONES) assert.deepEqual(effects[zone], [], zone);
        assert.equal(Object.keys(effects).some(zone => zone.startsWith('featSlot:') || zone.startsWith('weapon:')), false);
    });

    test('don inconnu ou texte libre : aucune note (tous les dons du manuel sont gérés depuis le lot 8)', () => {
        const effects = featEffects(fighter({ feat_1: 'don_inconnu', feat_4: 'texte libre' }));
        assert.equal(Object.values(effects).flat().length, 0);
    });

    test('don choisi deux fois : rappels une seule fois, les deux emplacements décrits', () => {
        const effects = featEffects(fighter({ feat_1: 'vigilant', feat_4: 'vigilant' }));
        assert.equal(effects.initiative.length, 2);
        assert.equal(effects['featSlot:1'].length, 1);
        assert.equal(effects['featSlot:4'].length, 1);
    });

    test('dérivé fourni ou recalculé : même résultat', () => {
        const c = fighter({ feat_1: 'vigilant', feat_4: 'maitre_des_boucliers' });
        assert.deepEqual(featEffects(c, deriveCharacter(c)), featEffects(c));
    });
});

describe('featEffects : dons du lot 1 (PHB 2024)', () => {
    test('Vigilant : Initiative déjà calculée, rappel de l\'échange', () => {
        const effects = featEffects(fighter({ feat_1: 'vigilant' }));
        assert.equal(effects.initiative.length, 2);
        assert.deepEqual(effects.initiative[0], {
            featId: 'vigilant', featName: 'Vigilant', value: 2, applied: true,
            text: "Bonus de maîtrise +2 déjà compté dans l'Initiative (Dex +2, Vigilant +2)."
        });
        assert.match(effects.initiative[1].text, /^Échange d'Initiative : .*allié consentant/);
        assert.equal(effects['featSlot:1'][0].text, 'Initiative calculée : Dex +2, Vigilant +2 = +4.');
    });

    test('Robuste : « dont +2 × niveau » sous les PV max, rien n\'est ajouté', () => {
        assert.equal(toughHitPoints(4), 8);
        const effects = featEffects(fighter({ feat_1: 'robuste' }));
        assert.deepEqual(effects.hpMax, [{
            featId: 'robuste', featName: 'Robuste', value: 8, manual: true, text: 'dont +8 PV grâce à Robuste (2 × niveau 4)'
        }]);
        // Valeur à reporter par le joueur dans un nombre saisi : jamais « déjà comptée »
        assert.equal(effects['featSlot:1'][0].manual, true);
        assert.equal(effects['featSlot:1'][0].applied, undefined);
        // Le don compte pour tout le niveau du personnage, même pris au niveau 4
        assert.equal(featEffects(fighter({ char_level: '9', feat_4: 'robuste' })).hpMax[0].value, 18);
        assert.match(effects['featSlot:1'][0].text, /la fiche ne les ajoute pas/);
    });

    test('Mage de guerre : Concentration sur la sauvegarde de Constitution, rappels de sorts', () => {
        const effects = featEffects(fighter({ feat_4: 'mage_de_guerre' }));
        assert.deepEqual(texts(effects['saves.con']), ['Avantage pour maintenir la Concentration.']);
        assert.equal(effects.spells.length, 2);
        assert.match(effects.spells[0].text, /^Sort réactif : /);
        assert.match(effects.spells[1].text, /^Composantes somatiques/);
        assert.deepEqual(effects['saves.dex'], []);
        // L'emplacement ne renvoie plus à une zone des sorts que l'onglet Magie n'affiche pas :
        // l'encadré « Dans la fiche » reprend les deux rappels (FEAT_SHEET_ZONES, js/ui/sheet.js)
        // puis son +1 Int, Sag ou Cha (lot 5), pas encore choisi
        assert.deepEqual(texts(effects['featSlot:4']), ['Avantage pour la Concentration noté sur la sauvegarde de Constitution.',
            'Choix à faire ci-dessus : Caractéristique +1.']);
    });

    test('Maître des armures lourdes : réduction = bonus de maîtrise en armure lourde', () => {
        const heavy = [{ name: 'Harnois', type: 'Lourde', ca: '18', equipped: true }];
        const on = featEffects(fighter({ char_level: '9', feat_4: 'maitre_des_armures_lourdes', dynamic_armors: heavy }));
        assert.deepEqual(on.armorClass, [{
            featId: 'maitre_des_armures_lourdes', featName: 'Maître des armures lourdes', value: 4,
            text: 'Réduction des dégâts contondants, perforants et tranchants des attaques : 4'
        }]);
        // Sans armure lourde équipée : note discrète, sans valeur
        const off = featEffects(fighter({ feat_4: 'maitre_des_armures_lourdes',
            dynamic_armors: [{ ...heavy[0], equipped: false }, { name: 'Cuir clouté', type: 'Légère', ca: '12', equipped: true }] }));
        assert.equal(off.armorClass.length, 1);
        assert.equal(off.armorClass[0].inactive, true);
        assert.equal(off.armorClass[0].value, undefined);
        // Armure lourde reconnue par son nom (anciennes sauvegardes sans type)
        const byName = featEffects(fighter({ feat_4: 'maitre_des_armures_lourdes', dynamic_armors: [{ name: 'Harnois', ca: '18', equipped: true }] }));
        assert.equal(byName.armorClass[0].value, 2);
        // La CA elle-même ne change pas
        const c = fighter({ feat_4: 'maitre_des_armures_lourdes', dynamic_armors: heavy });
        assert.equal(deriveCharacter(c).armorClass.value, deriveCharacter({ ...c, feat_4: '' }).armorClass.value);
    });

    test('Maître des boucliers : DD du Coup de bouclier = 8 + For + maîtrise, avec un bouclier', () => {
        const shield = [{ name: 'Bouclier', type: 'Bouclier', ca: '+2', equipped: true }];
        const c = fighter({ feat_4: 'maitre_des_boucliers', dynamic_armors: shield, prof_armor_shield: true,
            dynamic_weapons: [weapon('Épée longue'), weapon('Arc long')] });
        const d = deriveCharacter(c);
        assert.equal(shieldBashDC(d), 13); // 8 + 3 + 2
        const effects = featEffects(c, d);
        assert.equal(effects.weapons.length, 1);
        assert.equal(effects.weapons[0].value, 13);
        assert.match(effects.weapons[0].text, /sauvegarde de Force DD 13/);
        assert.match(effects['saves.dex'][0].text, /^Interposition de bouclier : /);
        assert.deepEqual(ids(effects['weapon:0']), ['maitre_des_boucliers'], 'arme de corps à corps');
        assert.equal(effects['weapon:1'], undefined, 'arc : pas de Coup de bouclier');
        // Sans bouclier équipé
        const off = featEffects(fighter({ feat_4: 'maitre_des_boucliers', dynamic_weapons: [weapon('Épée longue')] }));
        assert.deepEqual(off.weapons, []);
        assert.deepEqual(off['saves.dex'], []);
        assert.equal(off.armorClass[0].inactive, true);
        assert.equal(off['weapon:0'], undefined);
        // Bouclier équipé sans formation aux boucliers : sans effet, comme pour la CA (PHB p. 207,
        // prérequis « Shield Training »)
        const untrained = { ...c, prof_armor_shield: false };
        const du = deriveCharacter(untrained);
        assert.match(du.armorClass.source, /bouclier non maîtrisé/);
        const eu = featEffects(untrained, du);
        assert.deepEqual(eu.weapons, []);
        assert.deepEqual(eu['saves.dex'], []);
        assert.equal(eu['weapon:0'], undefined);
        assert.equal(eu.armorClass[0].inactive, true);
        assert.match(eu.armorClass[0].text, /formation aux boucliers non cochée/);
        assert.equal(eu['featSlot:4'][0].inactive, true);
        assert.doesNotMatch(eu['featSlot:4'][0].text, /DD/);
    });

    test('Expert de la charge : rappels Charge et Foncer, +1d8 quand le bouton est actif', () => {
        const c = fighter({ feat_4: 'expert_de_la_charge', combat_buffs: { charger: true },
            dynamic_weapons: [weapon('Hache à deux mains'), weapon('Arc long'), weapon('Hachette')] });
        const effects = featEffects(c);
        assert.deepEqual(effects.weapons.map(n => n.value), ['1d8', 3]);
        assert.match(effects.weapons[0].text, /au moins 3 m en ligne droite.*\+1d8.*repoussez-la jusqu'à 3 m.*Une fois par tour/);
        assert.equal(effects.weapons[1].text, 'Foncer : votre vitesse augmente de 3 m pour cette action.');
        assert.deepEqual(ids(effects['weapon:0']), ['expert_de_la_charge']);
        assert.equal(effects['weapon:1'], undefined, 'arme à distance');
        assert.deepEqual(ids(effects['weapon:2']), ['expert_de_la_charge'], 'arme de lancer : aussi de corps à corps');

        const d = deriveCharacter(c);
        const buffs = effectiveBuffs(d.classSlug, c.combat_buffs, c);
        assert.equal(buffs.charger, true);
        assert.match(computeWeapon(c.dynamic_weapons[0], d, buffs).damage.text, /\+1d8 \(Charge\)$/);
        assert.doesNotMatch(computeWeapon(c.dynamic_weapons[1], d, buffs).damage.text, /Charge/);
        // Don pas encore atteint : le bouton resté actif n'ajoute rien
        const early = { ...c, char_level: '3' };
        assert.equal(effectiveBuffs('fighter', early.combat_buffs, early).charger, false);
    });

    test('Cogneur lourd : rappel Abattage en plus du bouton existant', () => {
        const c = fighter({ feat_4: 'maitre_des_armes_lourdes_cogneur_lourd', dynamic_weapons: [weapon('Hache à deux mains'), weapon('Arc long')] });
        const effects = featEffects(c);
        assert.match(effects.weapons[0].text, /^Abattage : juste après un coup critique/);
        assert.match(effects['featSlot:4'][0].text, /Cogneur lourd \(\+2\)/);
        assert.deepEqual(ids(effects['weapon:0']), ['maitre_des_armes_lourdes_cogneur_lourd']);
        assert.equal(effects['weapon:1'], undefined, 'Abattage : armes de corps à corps');
    });

    test('Musicien : rappel à la fin des repos, autant d\'alliés que le bonus de maîtrise', () => {
        const c = fighter({ char_level: '9', feat_1: 'musicien' });
        const notes = restFeatNotes(c);
        assert.equal(notes.length, 1);
        assert.equal(notes[0].value, 4);
        assert.match(notes[0].text, /Inspiration héroïque à au plus 4 alliés/);
        assert.deepEqual(planShortRest(c).summary.featNotes, notes);
        assert.deepEqual(planLongRest(c).summary.featNotes, notes);
        assert.deepEqual(planShortRest(fighter()).summary.featNotes, []);
        assert.deepEqual(planLongRest(fighter({ feat_8: 'musicien' })).summary.featNotes, []);
    });

    test('Guérisseur : dé de vie de la cible + bonus de maîtrise, relance des 1', () => {
        const effects = featEffects(fighter({ feat_1: 'guerisseur' }));
        assert.equal(effects.healing.length, 2);
        assert.equal(effects.healing[0].value, 2);
        assert.match(effects.healing[0].text, /^Médecin de combat : en dépensant une utilisation d'une trousse de soins \(action Utilisation\).*résultat \+2 PV\.$/);
        assert.match(effects.healing[1].text, /^Retirage des soins : .*relancez un 1/);
        // Mêmes noms que la description du don (js/data/feats.js)
        for (const name of ['Médecin de combat', 'Retirage des soins', 'action Utilisation']) {
            assert.ok(FEATS_DATA.guerisseur.desc.includes(name), name);
        }
        assert.equal(effects['featSlot:1'][0].text, 'Médecin de combat : dé de vie de la cible +2 ; relancer les 1.');
    });
});

describe('weaponFeatNotes : rappels selon l\'arme', () => {
    const all = fighter({
        char_level: '19',
        feat_1: 'sauvagerie_martiale', feat_4: 'sentinelle', feat_8: 'trancheur',
        feat_12: 'broyeur', feat_16: 'empaleur_perforateur'
    });

    test('type de dégâts et portée', () => {
        const notes = (w) => ids(weaponFeatNotes(w, all));
        assert.deepEqual(notes(weapon('Hache à deux mains')), ['sauvagerie_martiale', 'sentinelle', 'trancheur']);
        assert.deepEqual(notes(weapon("Maillet d'armes")), ['sauvagerie_martiale', 'sentinelle', 'broyeur']);
        assert.deepEqual(notes(weapon('Rapière')), ['sauvagerie_martiale', 'sentinelle', 'empaleur_perforateur']);
        assert.deepEqual(notes(weapon('Arc long')), ['sauvagerie_martiale', 'empaleur_perforateur'], 'à distance : pas de Sentinelle');
        assert.deepEqual(notes(weapon('Dague')), ['sauvagerie_martiale', 'sentinelle', 'empaleur_perforateur'], 'lancer : corps à corps aussi');
    });

    test('type imposé dans la configuration', () => {
        const fire = { ...weapon('Hache à deux mains'), weaponConfig: '{"dmgTypeOverride":"CONT"}' };
        assert.deepEqual(ids(weaponFeatNotes(fire, all)), ['sauvagerie_martiale', 'sentinelle', 'broyeur']);
    });

    test('lignes vides ou libres (non rattachées au manuel) : aucun rappel', () => {
        assert.deepEqual(weaponFeatNotes({ ...EMPTY_WEAPON }, all), []);
        assert.deepEqual(weaponFeatNotes({ ...EMPTY_WEAPON, name: 'Perception Bestiale' }, all), []);
        assert.deepEqual(weaponFeatNotes(null, all), []);
    });

    test('rangés par ligne dans featEffects (index de dynamic_weapons)', () => {
        const c = { ...all, dynamic_weapons: [weapon('Hache à deux mains'), { ...EMPTY_WEAPON }, weapon('Arc long')] };
        const effects = featEffects(c);
        assert.equal(effects['weapon:0'].length, 3);
        assert.equal(effects['weapon:1'], undefined);
        assert.equal(effects['weapon:2'].length, 2);
        assert.equal(effects.weapons.length, 6, 'rappels généraux : 1 + 2 + 1 + 1 + 1');
        assert.equal(effects['weapon:0'][2].featName, 'Trancheur');
        assert.match(effects['weapon:0'][2].text, /^Une fois par tour, −3 m de vitesse pour la cible ; sur un critique, Désavantage/);
    });

    test('don non atteint : pas de rappel sur l\'arme', () => {
        const c = fighter({ char_level: '4', feat_8: 'trancheur' });
        assert.deepEqual(weaponFeatNotes(weapon('Hache à deux mains'), c), []);
    });
});

// -----------------------------------------------------------------------------
// Vraies sauvegardes (dossier tests/fixtures/local/, non publié sur GitHub).
// Ignoré automatiquement si le dossier est absent (CI). Lecture seule.
// -----------------------------------------------------------------------------
const localDir = new URL('./fixtures/local/', import.meta.url);
const localFiles = existsSync(localDir) ? readdirSync(localDir).filter(f => f.endsWith('.json')) : [];

describe('Vraies sauvegardes locales : dons', { skip: localFiles.length === 0 && 'aucune sauvegarde locale' }, () => {
    for (const file of localFiles) {
        test(file, () => {
            const raw = JSON.parse(readFileSync(new URL(file, localDir), 'utf8'));
            const { character } = migrateCharacter(raw);
            const frozen = deepFreeze(structuredClone(character));
            const d = deriveCharacter(frozen);
            const effects = featEffects(frozen, d);

            // Aucun don du lot 1 ne touche aux valeurs calculées
            assert.equal(d.initiative, d.mods.dex);
            assert.deepEqual(effects.hpMax, []);
            assert.deepEqual(effects.initiative, []);
            // (les Résistances de la sous-classe, lot 5, sont des repères : rien de compté)
            assert.deepEqual(effects.armorClass.filter(n => !(n.classFeature && n.mention)), []);

            // Dons réellement atteints : rappels seulement
            for (const id of d.feats) assert.ok(FEATS_DATA[id], `don inconnu : ${id}`);
            if (d.feats.includes('sauvagerie_martiale')) {
                assert.ok(ids(effects.weapons).includes('sauvagerie_martiale'));
            }
            if (d.feats.includes('maitre_des_armes_lourdes_cogneur_lourd')) {
                assert.ok(texts(effects.weapons).some(t => t.startsWith('Abattage')));
            }
        });
    }
});

describe("Maître des armures intermédiaires : mention seulement si l'armure intermédiaire compte", () => {
    const base = {
        char_class: 'Guerrier', char_level: '4', dex_score: '16', feat_4: 'maitre_des_armures_intermediaires',
        prof_armor_heavy: true, prof_armor_med: true
    };
    const armor = (name, type, ca) => ({ name, type, ca, equipped: true });
    test('Demi-plate seule : appliqué', () => {
        const notes = featEffects({ ...base, dynamic_armors: [armor('Demi-plate', 'Interméd.', '15')] }).armorClass;
        assert.ok(notes.some(n => n.featId === 'maitre_des_armures_intermediaires' && n.applied));
    });
    test("Harnois et Cuirasse équipés : le Harnois compte, la mention n'est pas « appliquée »", () => {
        const notes = featEffects({ ...base, dynamic_armors: [armor('Harnois', 'Lourde', '18'), armor('Cuirasse', 'Interméd.', '14')] }).armorClass
            .filter(n => n.featId === 'maitre_des_armures_intermediaires');
        assert.equal(notes.length, 1);
        assert.ok(notes[0].inactive);
        assert.ok(!notes[0].applied);
    });
});
