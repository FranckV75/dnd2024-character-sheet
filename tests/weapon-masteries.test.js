/**
 * TESTS UNITAIRES — RULES/WEAPON-MASTERIES.JS (bottes d'armes, PHB 2024 p. 214)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    findMastery,
    masteryDetails,
    weaponMasteryFeature,
    hasWeaponMasterFeat,
    masteryAccessNote,
    masteryParagraphs,
    MASTERY_NOTES
} from '../js/rules/weapon-masteries.js';
import { getMartialArtsDie } from '../js/rules/logic.js';
import { WEAPON_MASTERIES, WEAPON_MASTERY_CLASSES, WEAPON_MASTERY_INTRO } from '../js/data/weapon-masteries.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { FEATS_DATA } from '../js/data/feats.js';
import { deriveCharacter, computeWeapon } from '../js/rules/character.js';
import { rowFromRulebookWeapon } from '../js/rules/weapons.js';
import { EMPTY_WEAPON } from '../js/state/schema.js';

const row = (name, extra = {}) => ({
    ...rowFromRulebookWeapon({ ...EMPTY_WEAPON }, DD_RULES.weapons.find(w => w.name === name)),
    ...extra
});

/** Personnage proche de Korgul : Barbare niveau 4, Force 20 */
const korgulLike = (extra = {}) => ({
    char_name: 'Test', char_class: 'Barbare', char_level: '4',
    str_score: '20', dex_score: '12', con_score: '16', int_score: '8', wis_score: '12', cha_score: '10',
    ...extra
});

const values = (weapon, character) => masteryDetails(weapon, character).values;

describe('Données : les huit bottes du manuel', () => {
    const EXPECTED = {
        cleave: ['Enchaînement', 'Cleave'], graze: ['Écorchure', 'Graze'], nick: ['Coup double', 'Nick'],
        push: ['Poussée', 'Push'], sap: ['Sape', 'Sap'], slow: ['Ralentissement', 'Slow'],
        topple: ['Renversement', 'Topple'], vex: ['Ouverture', 'Vex']
    };

    test('chaque botte existe avec son nom français, anglais, sa page et un texte', () => {
        assert.deepEqual(Object.keys(WEAPON_MASTERIES).sort(), Object.keys(EXPECTED).sort());
        for (const [id, [name, en]] of Object.entries(EXPECTED)) {
            const mastery = WEAPON_MASTERIES[id];
            assert.equal(mastery.name, name);
            assert.equal(mastery.en, en);
            assert.equal(mastery.page, 214);
            assert.ok(mastery.desc.length > 80, `${name} : texte trop court`);
        }
        assert.ok(WEAPON_MASTERY_INTRO.includes("Bottes d'arme"));
    });

    test('distances en mètres écrits en toutes lettres (comme feats.js), jamais en pieds', () => {
        for (const mastery of Object.values(WEAPON_MASTERIES)) {
            assert.doesNotMatch(mastery.desc, /\b(ft|feet|foot|pieds?)\b/i, mastery.name);
            // « 3 m » abrégé ou nombre séparé de son unité par une espace ordinaire : jamais
            assert.doesNotMatch(mastery.desc, /\d m\b/, mastery.name);
            assert.doesNotMatch(mastery.desc, /\d mètres?\b/, mastery.name);
        }
        // Espace insécable : « 1,50 » et « mètre » ne sont jamais séparés en fin de ligne
        assert.match(WEAPON_MASTERIES.cleave.desc, /1,50 mètre ou moins/);
        assert.match(WEAPON_MASTERIES.push.desc, /3 mètres/);
        assert.match(WEAPON_MASTERIES.slow.desc, /Vitesse de 3 mètres/);
        assert.match(WEAPON_MASTERIES.slow.desc, /ne dépasse pas 3 mètres/);
    });

    test('Poussée (PHB p. 214 « push the creature up to 10 feet straight away from yourself ») : '
        + 'un déplacement de 3 mètres au plus, qui éloigne la créature', () => {
        const desc = WEAPON_MASTERIES.push.desc;
        assert.match(desc, /repousser en ligne droite de 3 mètres au maximum, en l'éloignant de vous/);
        assert.match(desc, /de taille Grande ou inférieure/);
        // L'ancienne tournure se lisait comme une distance finale (« jusqu'à 3 m de vous »)
        assert.doesNotMatch(desc, /jusqu'à 3/);
    });

    test('masteryParagraphs : texte brut en paragraphes, espaces insécables conservées', () => {
        assert.deepEqual(masteryParagraphs(findMastery('Ralentissement')).length, 2);
        const [first] = masteryParagraphs(findMastery('Enchaînement'));
        assert.match(first, /1,50 mètre/);
        assert.doesNotMatch(first, /</);
        assert.deepEqual(masteryParagraphs({ desc: 'Un <strong>deux</strong> <br/> trois<br>' }), ['Un deux', 'trois']);
        assert.deepEqual(masteryParagraphs(null), []);
        for (const mastery of Object.values(WEAPON_MASTERIES)) {
            assert.ok(masteryParagraphs(mastery).length >= 1, mastery.name);
        }
    });

    test('termes de la fiche (états, Avantage, Désavantage, action Bonus)', () => {
        assert.match(WEAPON_MASTERIES.topple.desc, /jet de sauvegarde de Constitution/);
        assert.match(WEAPON_MASTERIES.topple.desc, /À terre/);
        assert.match(WEAPON_MASTERIES.vex.desc, /Avantage/);
        assert.match(WEAPON_MASTERIES.sap.desc, /Désavantage/);
        assert.match(WEAPON_MASTERIES.nick.desc, /action Attaque/);
        assert.match(WEAPON_MASTERIES.nick.desc, /action Bonus/);
        assert.match(WEAPON_MASTERIES.nick.desc, /propriété Légère/);
    });

    test('capacité de classe : classes connues du manuel, et le don Maître d\'armes existe', () => {
        for (const slug of Object.keys(WEAPON_MASTERY_CLASSES)) {
            assert.ok(DD_RULES.classes[slug], slug);
            assert.ok(WEAPON_MASTERY_CLASSES[slug].desc.includes('Repos long'), slug);
        }
        assert.ok(FEATS_DATA.maitre_d_armes);
    });
});

describe('findMastery : botte écrite dans la colonne « Botte d\'arme »', () => {
    test('chaque botte du tableau des armes du manuel est retrouvée', () => {
        // (l'attaque à mains nues n'a pas de botte)
        for (const weapon of DD_RULES.weapons.filter(w => w.category !== 'Mains nues')) {
            const mastery = findMastery(weapon.prof);
            assert.ok(mastery, `${weapon.name} : ${weapon.prof}`);
            assert.equal(mastery.name, weapon.prof);
        }
        const used = new Set(DD_RULES.weapons.filter(w => w.category !== 'Mains nues').map(w => findMastery(w.prof).id));
        assert.equal(used.size, 8);
    });

    test('HTML hérité, casse, accents et espaces ignorés', () => {
        assert.equal(findMastery('<b>Enchaînement</b>').id, 'cleave');
        assert.equal(findMastery('<span style="font-size: small;"><font size="2">Sape</font></span>').id, 'sap');
        assert.equal(findMastery('ENCHAINEMENT').id, 'cleave');
        assert.equal(findMastery('ecorchure').id, 'graze');
        assert.equal(findMastery('Poussee').id, 'push');
        assert.equal(findMastery('  coup   double ').id, 'nick');
        assert.equal(findMastery('Coup&nbsp;double').id, 'nick');
        assert.equal(findMastery('Coup-double').id, 'nick');
        assert.equal(findMastery('renversement').id, 'topple');
        // Espace insécable littérale (copier-coller) et apostrophe typographique
        assert.equal(findMastery('Coup double').id, 'nick');
        assert.equal(findMastery('Coup’double').id, 'nick');
    });

    test('noms anglais du manuel reconnus', () => {
        assert.equal(findMastery('Topple').id, 'topple');
        assert.equal(findMastery('vex').id, 'vex');
        assert.equal(findMastery('Graze').id, 'graze');
    });

    test('vide ou inconnu : null, sans deviner', () => {
        for (const value of ['', '   ', '<b></b>', null, undefined, 0, {}, [], 'Oui', 'Maîtrise', 'Sap?', 'Sape et Poussée', 'Coup', 'Renverse']) {
            assert.equal(findMastery(value), null, String(value));
        }
    });

    test('résultat : identifiant, noms, page et texte', () => {
        const mastery = findMastery('Ralentissement');
        assert.equal(mastery.id, 'slow');
        assert.equal(mastery.en, 'Slow');
        assert.equal(mastery.page, 214);
        assert.equal(mastery.desc, WEAPON_MASTERIES.slow.desc);
    });
});

describe('masteryDetails : valeurs calculées pour l\'arme', () => {
    test('Renversement (Korgul-like, For 20, niveau 4) : DD 8 + 5 + 2 = 15', () => {
        const [dc] = values(row("Maillet d'armes"), korgulLike());
        assert.equal(dc.label, 'DD du jet de sauvegarde de Constitution');
        assert.equal(dc.value, '15');
        assert.match(dc.detail, /Force/);
    });

    test('Écorchure : dégâts égaux au modificateur (5), du type de l\'arme, sans bonus magique', () => {
        const [graze] = values(row('Coutille', { weaponConfig: '{"magicBonus":2}' }), korgulLike());
        assert.equal(graze.value, '5 dégâts tranchants');
        assert.match(graze.detail, /Force \+5/);
    });

    test('Écorchure : modificateur nul ou négatif, aucun dégât', () => {
        assert.equal(values(row('Coutille'), korgulLike({ str_score: '10' }))[0].value, 'aucun');
        assert.equal(values(row('Coutille'), korgulLike({ str_score: '8' }))[0].value, 'aucun');
        assert.equal(values(row('Coutille'), korgulLike({ str_score: '12' }))[0].value, '1 dégât tranchant');
        assert.equal(values(row('Coutille', { weaponConfig: '{"dmgTypeOverride":"FEU"}' }), korgulLike({ str_score: '12' }))[0].value,
            '1 dégât de feu');
    });

    test('Enchaînement : dés de l\'arme sans le modificateur, sauf s\'il est négatif', () => {
        assert.equal(values(row('Hache à deux mains'), korgulLike())[0].value, '1d12 tranchants');
        assert.equal(values(row('Hache à deux mains'), korgulLike({ str_score: '8' }))[0].value, '1d12 -1 tranchants');
        assert.equal(values(row('Hache à deux mains', { weaponConfig: '{"magicBonus":1}' }), korgulLike())[0].value,
            '1d12 +1 tranchants');
        assert.equal(values(row('Hallebarde', { weaponConfig: '{"dmgDieOverride":"2d6","dmgTypeOverride":"FEU"}' }), korgulLike())[0].value,
            '2d6 de feu');
    });

    test('caractéristique d\'attaque de la configuration de l\'arme (comme computeWeapon)', () => {
        const character = korgulLike({ cha_score: '16' });
        const [dc] = values(row("Maillet d'armes", { weaponConfig: '{"statOverride":"cha"}' }), character);
        assert.equal(dc.value, String(8 + 3 + 2));
        assert.match(dc.detail, /Charisme/);
    });

    test('Finesse : la meilleure caractéristique entre Force et Dextérité (comme computeWeapon)', () => {
        const dexterous = korgulLike({ str_score: '10', dex_score: '18' });
        const rapier = row('Rapière', { prof: 'Renversement' });
        assert.equal(values(rapier, dexterous)[0].value, String(8 + 4 + 2));
        assert.match(values(rapier, dexterous)[0].detail, /Dextérité/);
    });

    test('bottes sans valeur chiffrée : description seule', () => {
        for (const name of ['Hachette', 'Dague', 'Lance', 'Massue', 'Gourdin']) {
            const details = masteryDetails(row(name), korgulLike());
            assert.ok(details.mastery, name);
            assert.deepEqual(details.values, [], name);
        }
    });

    test('arme non rattachée au manuel : botte retrouvée, aucune valeur calculée, note qui dit pourquoi', () => {
        const details = masteryDetails({ ...EMPTY_WEAPON, name: 'Hache maison', prof: 'Écorchure' }, korgulLike());
        assert.equal(details.mastery.id, 'graze');
        assert.deepEqual(details.values, []);
        assert.equal(details.note, MASTERY_NOTES.offBook);
        // Botte sans valeur chiffrée : rien à expliquer
        assert.equal(masteryDetails({ ...EMPTY_WEAPON, name: 'Fouet maison', prof: 'Sape' }, korgulLike()).note, null);
        // Valeur calculée : pas de note
        assert.equal(masteryDetails(row("Maillet d'armes"), korgulLike()).note, null);
        assert.equal(masteryDetails(row('Hachette'), korgulLike()).note, null);
    });

    test('colonne vide ou inconnue, ligne qui n\'est pas une arme : null', () => {
        assert.equal(masteryDetails(row('Coutille', { prof: '' }), korgulLike()), null);
        assert.equal(masteryDetails(row('Coutille', { prof: 'Botte secrète' }), korgulLike()), null);
        assert.equal(masteryDetails({}, korgulLike()), null);
        assert.equal(masteryDetails(null, korgulLike()), null);
        assert.equal(masteryDetails('Enchaînement', korgulLike()), null);
        assert.equal(masteryDetails(42, korgulLike()), null);
    });

    test('Enchaînement en Rage (PHB p. 51 : bonus aux dégâts de toute attaque qui utilise la Force)', () => {
        const character = korgulLike({ combat_buffs: { rage: true } });
        const derived = deriveCharacter(character);
        const [cleave] = masteryDetails(row('Hache à deux mains'), character, derived, { rage: true }).values;
        assert.equal(cleave.value, '1d12 +2 tranchants');
        assert.match(cleave.detail, /sans le modificateur de Force \+5/);
        assert.match(cleave.detail, /\+2 \(Rage\)/);
        // Bonus magique et Rage s'additionnent ; la Rage passe à +3 au niveau 9
        const magic = row('Hache à deux mains', { weaponConfig: '{"magicBonus":1}' });
        assert.equal(masteryDetails(magic, character, derived, { rage: true }).values[0].value, '1d12 +3 tranchants');
        const level9 = korgulLike({ char_level: '9' });
        assert.equal(masteryDetails(row('Hache à deux mains'), level9, deriveCharacter(level9), { rage: true }).values[0].value,
            '1d12 +3 tranchants');
        // Sans Rage active (ou sans bonus passés) : comme avant
        assert.equal(masteryDetails(row('Hache à deux mains'), character, derived, { rage: false }).values[0].value, '1d12 tranchants');
        assert.equal(masteryDetails(row('Hache à deux mains'), character, derived).values[0].value, '1d12 tranchants');
    });

    test('Rage : seulement avec la Force ; jamais pour Écorchure ni Renversement', () => {
        const dexterous = korgulLike({ str_score: '10', dex_score: '18' });
        const finesse = row('Rapière', { prof: 'Enchaînement' });
        assert.equal(masteryDetails(finesse, dexterous, deriveCharacter(dexterous), { rage: true }).values[0].value, '1d8 perforants');
        const character = korgulLike();
        const derived = deriveCharacter(character);
        assert.equal(masteryDetails(row('Coutille'), character, derived, { rage: true }).values[0].value, '5 dégâts tranchants');
        assert.equal(masteryDetails(row("Maillet d'armes"), character, derived, { rage: true }).values[0].value, '15');
    });

    test('Enchaînement avec un ancien dé de dégâts libre : dé affiché tel quel, sans type ajouté', () => {
        const legacy = row('Hache à deux mains', { weaponConfig: '{"dmgDieOverride":"1d8+1d6 feu"}' });
        const [cleave] = values(legacy, korgulLike());
        assert.equal(cleave.value, '1d8+1d6 feu');
        assert.doesNotMatch(cleave.value, /tranchants/);
        // Dé au format du manuel : type ajouté
        assert.equal(values(row('Hache à deux mains', { weaponConfig: '{"dmgDieOverride":"2d6"}' }), korgulLike())[0].value,
            '2d6 tranchants');
    });

    test('Enchaînement d\'un Moine : dé d\'arts martiaux, comme computeWeapon', () => {
        const monk = { char_class: 'Moine', char_level: '5', str_score: '14', dex_score: '18' };
        const staff = row('Bâton', { prof: 'Enchaînement' });
        const [cleave] = values(staff, monk);
        assert.equal(cleave.value, `${getMartialArtsDie(5)} contondants`);
        // Même caractéristique et même modificateur que l'infobulle des dégâts du tableau
        const tooltip = computeWeapon(staff, deriveCharacter(monk)).damage.tooltip;
        const [, stat, mod] = tooltip.match(/\| (FOR|DEX) \(([+-]\d+)\)/);
        assert.ok(cleave.detail.includes(`${stat === 'FOR' ? 'Force' : 'Dextérité'} ${mod}`), `${cleave.detail} / ${tooltip}`);
    });

    test('Écorchure avec Finesse (Dextérité) ou une caractéristique imposée', () => {
        const dexterous = korgulLike({ str_score: '10', dex_score: '18' });
        const [graze] = values(row('Rapière', { prof: 'Écorchure' }), dexterous);
        assert.equal(graze.value, '4 dégâts perforants');
        assert.match(graze.detail, /Dextérité \+4/);
        const charismatic = korgulLike({ cha_score: '16' });
        const [forced] = values(row('Coutille', { weaponConfig: '{"statOverride":"cha"}' }), charismatic);
        assert.equal(forced.value, '3 dégâts tranchants');
        assert.match(forced.detail, /Charisme \+3/);
    });

    test('statistiques dérivées passées en paramètre : même résultat', () => {
        const character = korgulLike();
        assert.deepEqual(masteryDetails(row("Maillet d'armes"), character, deriveCharacter(character)),
            masteryDetails(row("Maillet d'armes"), character));
    });
});

describe("weaponMasteryFeature : capacité de classe Bottes d'arme", () => {
    const count = (className, level) => weaponMasteryFeature({ char_class: className, char_level: level })?.count;

    test('Barbare : 2, puis 3 au niveau 4, 4 au niveau 10', () => {
        assert.deepEqual([1, 3, 4, 9, 10, 20].map(l => count('Barbare', l)), [2, 2, 3, 3, 4, 4]);
    });

    test('Guerrier : 3, puis 4 au niveau 4, 5 au niveau 10, 6 au niveau 16', () => {
        assert.deepEqual([1, 3, 4, 9, 10, 15, 16, 20].map(l => count('Guerrier', l)), [3, 3, 4, 4, 5, 5, 6, 6]);
    });

    test('Paladin, Rôdeur, Roublard : 2 à tous les niveaux', () => {
        for (const className of ['Paladin', 'Rôdeur', 'Roublard', 'Ranger', 'rogue']) {
            assert.deepEqual([1, 10, 20].map(l => count(className, l)), [2, 2, 2], className);
        }
    });

    test('classes sans la capacité, ou inconnues : null', () => {
        for (const className of ['Magicien', 'Moine', 'Clerc', 'Barde', 'Druide', 'Ensorceleur', 'Sorcier', '', 'Chevalier noir']) {
            assert.equal(weaponMasteryFeature({ char_class: className, char_level: 5 }), null, className);
        }
        assert.equal(weaponMasteryFeature(undefined), null);
    });

    test('accepte le personnage ou ses statistiques dérivées', () => {
        const character = korgulLike();
        const feature = weaponMasteryFeature(deriveCharacter(character));
        assert.deepEqual(feature, weaponMasteryFeature(character));
        assert.equal(feature.className, 'Barbare');
        assert.equal(feature.level, 4);
        assert.equal(feature.count, 3);
        assert.equal(feature.page, 51);
        assert.equal(feature.tacticalMaster, null);
    });

    test('Guerrier niveau 9 : Botte tactique (Poussée, Sape ou Ralentissement)', () => {
        assert.equal(weaponMasteryFeature({ char_class: 'Guerrier', char_level: 8 }).tacticalMaster, null);
        assert.match(weaponMasteryFeature({ char_class: 'Guerrier', char_level: 9 }).tacticalMaster.desc, /Poussée, Sape ou Ralentissement/);
    });
});

describe('masteryAccessNote et don Maître d\'armes', () => {
    test('classe avec la capacité : nombre de types d\'armes', () => {
        assert.match(masteryAccessNote(korgulLike()), /botte de 3 types d'armes de corps à corps/);
        assert.match(masteryAccessNote({ char_class: 'Paladin', char_level: 2 }), /botte de 2 types d'armes que vous maîtrisez/);
    });

    test('classe sans la capacité : un don peut l\'accorder', () => {
        assert.match(masteryAccessNote({ char_class: 'Magicien', char_level: 3 }), /n'a pas la capacité Bottes d'arme/);
    });

    test('classe non reconnue (vide, autre orthographe, multiclasse) : phrase neutre, aucune interdiction', () => {
        for (const className of ['', '   ', 'Guerrier / Magicien', 'Guerier', undefined]) {
            const note = masteryAccessNote({ char_class: className, char_level: 5 });
            assert.match(note, /ne reconnaît pas votre classe/, String(className));
            assert.doesNotMatch(note, /vous ne pouvez pas/, String(className));
        }
        const withFeat = masteryAccessNote({ char_class: 'Guerrier / Magicien', char_level: 4, feat_4: 'maitre_d_armes' });
        assert.match(withFeat, /ne reconnaît pas votre classe.*Le don Maître d'armes permet/);
    });

    test('don Maître d\'armes : seulement s\'il est atteint', () => {
        const wizard = { char_class: 'Magicien', char_level: 4, feat_4: 'maitre_d_armes' };
        assert.equal(hasWeaponMasterFeat(wizard), true);
        assert.match(masteryAccessNote(wizard), /^Le don Maître d'armes/);
        const planned = { ...wizard, char_level: 3 };
        assert.equal(hasWeaponMasterFeat(planned), false);
        assert.match(masteryAccessNote(planned), /n'a pas la capacité/);
        assert.match(masteryAccessNote(korgulLike({ feat_4: 'maitre_d_armes' })), /En plus, le don Maître d'armes/);
    });
});

describe('Rien n\'est modifié', () => {
    test('personnage et armes intacts après tous les calculs', () => {
        const character = korgulLike({
            feat_4: 'maitre_d_armes',
            dynamic_weapons: [
                row("Maillet d'armes"),
                row('Coutille', { weaponConfig: '{"magicBonus":1}' }),
                row('Hache à deux mains', { prof: '<b>enchainement</b>' }),
                { ...EMPTY_WEAPON, name: 'Bâton maudit', prof: 'Inconnue' }
            ]
        });
        const before = structuredClone(character);
        const derived = deriveCharacter(character);
        const derivedBefore = structuredClone(derived);
        for (const weapon of character.dynamic_weapons) {
            findMastery(weapon.prof);
            masteryDetails(weapon, character);
            masteryDetails(weapon, character, derived);
            masteryDetails(weapon, character, derived, { rage: true });
        }
        weaponMasteryFeature(character);
        weaponMasteryFeature(derived);
        masteryAccessNote(character);
        masteryAccessNote(character, derived);
        assert.deepEqual(character, before);
        assert.deepEqual(derived, derivedBefore);
        assert.equal(character.dynamic_weapons[2].prof, '<b>enchainement</b>');
    });

    test('les données renvoyées sont des copies', () => {
        const mastery = findMastery('Sape');
        mastery.name = 'modifié';
        assert.equal(WEAPON_MASTERIES.sap.name, 'Sape');
        const feature = weaponMasteryFeature({ char_class: 'Guerrier', char_level: 9 });
        feature.tacticalMaster.name = 'modifié';
        assert.equal(weaponMasteryFeature({ char_class: 'Guerrier', char_level: 9 }).tacticalMaster.name, 'Botte tactique');
    });
});
