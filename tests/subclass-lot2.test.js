// =============================================================================
// Sous-classes, lot 2 : Voie du Zélote (Korgul) et serments du Paladin (Iria)
// Cases de sous-classe (subclass_uses), Fureur divine, sorts de serment, textes chiffrés du
// Conduit divin (docs/etudes/SOUS_CLASSES.md). Règles relues dans le PHB 2024 anglais.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    subclassCounters, setSubclassUsesPatch, restSubclassUses, rageEndPatch, subclassUsesState,
    SUBCLASS_COUNTERS, SUBCLASS_USES_KEY
} from '../js/rules/subclass-uses.js';
import { subclassFeatures, subclassSpells, divineFuryDie, automationKind, markListedSpells } from '../js/rules/subclass-features.js';
import { SUBCLASS_FEATURES } from '../js/data/subclass-features.js';
import { SUBCLASS_SPELLS } from '../js/data/subclass-spells.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { deriveCharacter, computeWeapon } from '../js/rules/character.js';
import { planShortRest, planLongRest } from '../js/rules/rest.js';
import { createDefaultCharacter } from '../js/state/schema.js';
import { migrateCharacter } from '../js/state/migrate.js';
import { V4_ONLY_KEYS } from '../js/cloud/sync.js';

const korgul = (extra = {}) => ({
    ...createDefaultCharacter(), char_class: 'Barbare', char_subclass: 'Voie du Zélote', char_level: '4',
    str_score: '18', hp_current: '40', hp_max: '45', ...extra
});
const iria = (extra = {}) => ({
    ...createDefaultCharacter(), char_class: 'Paladin', char_subclass: 'Serment de Gloire', char_level: '5',
    cha_score: '16', hp_current: '40', hp_max: '44', ...extra
});
const counters = (c) => subclassCounters(c, deriveCharacter(c));
const ZEALOT = 'path_of_the_zealot';
const key = (feature) => `${ZEALOT}.${feature}`;

describe('Cases de sous-classe : données', () => {
    test('chaque case porte sur une capacité qui existe, avec un rechargement connu', () => {
        for (const [subclass, list] of Object.entries(SUBCLASS_COUNTERS)) {
            assert.ok(DD_RULES.subclasses[subclass], subclass);
            for (const def of list) {
                assert.ok(SUBCLASS_FEATURES[subclass].some(f => f.id === def.feature), `${subclass}.${def.feature}`);
                assert.ok(typeof def.reset === 'function' || ['long', 'short', 'rage', 'shortOne'].includes(def.reset));
                assert.ok(def.label && def.inText && def.use);
            }
        }
    });

    test('la nouvelle clé est propre à la v4 (l\'ancien site ne l\'efface pas en silence)', () => {
        assert.equal(SUBCLASS_USES_KEY, 'subclass_uses');
        assert.ok(V4_ONLY_KEYS.includes('subclass_uses'));
    });
});

describe('Voie du Zélote (Korgul)', () => {
    test('niveau 4 : réserve de 4 d12 seulement ; 5, 6, 7 dés aux niveaux 6, 12, 17', () => {
        assert.deepEqual(counters(korgul()).map(c => [c.feature, c.max, c.reset]), [['guerrier_des_dieux', 4, 'long']]);
        const at = (level) => counters(korgul({ char_level: String(level) })).find(c => c.feature === 'guerrier_des_dieux').max;
        assert.deepEqual([3, 5, 6, 11, 12, 16, 17, 20].map(at), [4, 4, 5, 5, 6, 6, 7, 7]);
        assert.equal(counters(korgul())[0].featName, 'Voie du Zélateur');
    });

    test('niveaux 6, 10 et 14 : Détermination fanatique (Rage), Présence zélée et Rage des dieux (repos long)', () => {
        assert.deepEqual(counters(korgul({ char_level: '14' })).map(c => [c.feature, c.max, c.reset]), [
            ['guerrier_des_dieux', 6, 'long'],
            ['focalisation_fanatique', 1, 'rage'],
            ['presence_zelee', 1, 'long'],
            ['rage_des_dieux', 1, 'long']
        ]);
        assert.equal(counters(korgul({ char_level: '6' }))[1].resetText, 'fin de la Rage');
    });

    test('niveau 2, autre sous-classe ou sans sous-classe : pas de case', () => {
        assert.deepEqual(counters(korgul({ char_level: '2' })), []);
        assert.deepEqual(counters(korgul({ char_subclass: 'Voie du Berserker' })), []);
        assert.deepEqual(counters(korgul({ char_subclass: '' })), []);
    });

    test('cases cochées : lues et ramenées entre 0 et le maximum ; une valeur illisible vaut 0', () => {
        assert.equal(counters(korgul({ subclass_uses: { [key('guerrier_des_dieux')]: 3 } }))[0].used, 3);
        assert.equal(counters(korgul({ subclass_uses: { [key('guerrier_des_dieux')]: 9 } }))[0].used, 4);
        assert.equal(counters(korgul({ subclass_uses: { [key('guerrier_des_dieux')]: 'x' } }))[0].used, 0);
        assert.equal(counters(korgul({ subclass_uses: [1] }))[0].used, 0);
        assert.deepEqual(subclassUsesState({ subclass_uses: null }), {});
    });

    test('cocher : patch qui garde les autres valeurs, sans modifier la fiche', () => {
        const c = korgul({ subclass_uses: { autre: 2 } });
        const before = JSON.stringify(c);
        assert.deepEqual(setSubclassUsesPatch(c, key('guerrier_des_dieux'), 2, 4),
            { subclass_uses: { autre: 2, [key('guerrier_des_dieux')]: 2 } });
        assert.equal(setSubclassUsesPatch(c, key('guerrier_des_dieux'), 7, 4).subclass_uses[key('guerrier_des_dieux')], 4);
        assert.equal(JSON.stringify(c), before);
    });

    test('fin de la Rage : seule la Détermination fanatique revient', () => {
        const c = korgul({
            char_level: '10', combat_buffs: { rage: true },
            subclass_uses: { [key('guerrier_des_dieux')]: 2, [key('focalisation_fanatique')]: 1, [key('presence_zelee')]: 1 }
        });
        const d = deriveCharacter(c);
        assert.deepEqual(rageEndPatch(c, d, { rage: false }).subclass_uses, {
            [key('guerrier_des_dieux')]: 2, [key('focalisation_fanatique')]: 0, [key('presence_zelee')]: 1
        });
        // Rage allumée, ou restée allumée : rien
        assert.deepEqual(rageEndPatch({ ...c, combat_buffs: {} }, d, { rage: true }), {});
        assert.deepEqual(rageEndPatch(c, d, { rage: true }), {});
        assert.deepEqual(restSubclassUses(c, d, 'rage').restored.map(r => r.featId), ['focalisation_fanatique']);
    });

    test('repos court : la Focalisation revient (la Rage est finie) ; repos long : tout revient', () => {
        const c = korgul({
            char_level: '10',
            subclass_uses: { [key('guerrier_des_dieux')]: 2, [key('focalisation_fanatique')]: 1, [key('presence_zelee')]: 1 }
        });
        const short = planShortRest(c);
        assert.deepEqual(short.patch.subclass_uses, {
            [key('guerrier_des_dieux')]: 2, [key('focalisation_fanatique')]: 0, [key('presence_zelee')]: 1
        });
        assert.deepEqual(short.summary.featUsesRestored.map(r => [r.label, r.featName]), [['Détermination fanatique', 'Voie du Zélateur']]);
        const long = planLongRest(c);
        assert.deepEqual(long.patch.subclass_uses, {
            [key('guerrier_des_dieux')]: 0, [key('focalisation_fanatique')]: 0, [key('presence_zelee')]: 0
        });
        assert.deepEqual(long.summary.featUsesRestored.map(r => [r.inText, r.count]),
            [['dés de Soldat des dieux', 2], ['Détermination fanatique', 1], ['Présence zélée', 1]]);
        // Rien de coché : la clé n'est pas ajoutée aux anciennes fiches
        assert.equal(planLongRest(korgul()).patch.subclass_uses, undefined);
        assert.equal(planShortRest(korgul()).patch.subclass_uses, undefined);
    });

    test('Fureur divine : 1d6 + moitié du niveau, avec la Rage, sur toute arme (même à la Dextérité)', () => {
        assert.equal(divineFuryDie(deriveCharacter(korgul())), '1d6+2');
        assert.equal(divineFuryDie(deriveCharacter(korgul({ char_level: '9' }))), '1d6+4');
        assert.equal(divineFuryDie(deriveCharacter(korgul({ char_level: '2' }))), '');
        assert.equal(divineFuryDie(deriveCharacter(korgul({ char_subclass: 'Voie du Berserker' }))), '');
        const d = deriveCharacter(korgul({ dex_score: '16' }));
        const axe = { name: 'Hache à deux mains', atkKey: 'str', baseDmg: '1d12 T', prop: 'Lourde, Deux mains' };
        assert.match(computeWeapon(axe, d, { rage: true }).damage.text, /\+2 \(Rage\) \+1d6\+2 \(Fureur divine 1\/tour\)$/);
        assert.doesNotMatch(computeWeapon(axe, d, {}).damage.text, /Fureur/);
        const bow = { name: 'Arc court', atkKey: 'dex', baseDmg: '1d6 P', prop: 'Munitions, Deux mains' };
        const bowText = computeWeapon(bow, d, { rage: true }).damage.text;
        assert.doesNotMatch(bowText, /\(Rage\)/);
        assert.match(bowText, /Fureur divine/);
    });

    test('bloc Sous-classe : Fureur divine et Soldat des dieux « Calculé », avec le bon chiffre', () => {
        const { reached } = subclassFeatures(deriveCharacter(korgul()));
        assert.deepEqual(reached.map(automationKind), ['calc', 'calc']);
        assert.match(reached[0].automation.text, /\+1d6\+2 \(Fureur divine\)/);
        const ten = subclassFeatures(deriveCharacter(korgul({ char_level: '10' }))).reached;
        assert.match(ten.find(f => f.id === 'focalisation_fanatique').automation.text, /\+3\.$/);
    });

    test('ancienne fiche : la clé subclass_uses traverse la migration telle quelle', () => {
        const c = korgul({ subclass_uses: { [key('guerrier_des_dieux')]: 1 } });
        const { character } = migrateCharacter(JSON.parse(JSON.stringify(c)));
        assert.deepEqual(character.subclass_uses, c.subclass_uses);
        assert.equal(migrateCharacter(JSON.parse(JSON.stringify(korgul()))).character.subclass_uses, undefined);
    });
});

describe('Serments du Paladin (Iria)', () => {
    test('sorts de serment : ceux des niveaux atteints, les suivants à venir', () => {
        const { reached, upcoming } = subclassSpells(deriveCharacter(iria()));
        assert.deepEqual(reached.map(s => s.name), ['Rayon traçant', 'Héroïsme', 'Amélioration de caractéristique', 'Arme magique']);
        assert.equal(upcoming[0].classLevel, 9);
        assert.equal(subclassSpells(deriveCharacter(iria({ char_level: '2' }))).reached.length, 0);
        assert.equal(subclassSpells(deriveCharacter(iria({ char_subclass: '' }))).reached.length, 0);
        // Seigneur Dragon (Odyssée) : Appel de familier est un rituel
        const dragon = subclassSpells(deriveCharacter(iria({ char_subclass: 'Serment du Seigneur Dragon', char_level: '3' }))).reached;
        assert.deepEqual(dragon.map(s => [s.name, s.ritual]), [['Appel de familier', true], ['Marque du chasseur', false]]);
    });

    test('repère « Aussi dans votre liste » : nom français ou anglais, apostrophe courbe, espaces, mise en forme', () => {
        const { reached } = subclassSpells(deriveCharacter(iria({ char_subclass: 'Serment de Dévotion', char_level: '9' })));
        const rows = [{ name: 'Lueur d’espoir' }, { name: '<b>zone  de  VERITE</b>' }, { name: 'aid' }, { name: 'Aides' }, {}, null];
        const marked = markListedSpells(reached, rows).filter(s => s.listed).map(s => s.vo);
        assert.deepEqual(marked, ['Aid', 'Zone of Truth', 'Beacon of Hope']);
        assert.deepEqual(markListedSpells(reached, undefined).filter(s => s.listed), []);
        // Les sorts reçus ne sont pas modifiés
        assert.equal(reached.some(s => 'listed' in s), false);
    });

    test('repère « Aussi dans votre liste » : nom du livre français ou ancien nom de la base (aka)', () => {
        const { reached } = subclassSpells(deriveCharacter(iria({ char_subclass: 'Serment de Gloire', char_level: '17' })));
        const yolane = reached.find(s => s.vo === "Yolande's Regal Presence");
        assert.equal(yolane.name, 'Présence royale de Yolane');
        assert.deepEqual(yolane.aka, ['Présence royale de Yolande']);
        // Grimoire rempli avant le changement de nom (premier nom de data/spells.json)
        assert.equal(markListedSpells([yolane], [{ name: 'Présence royale de Yolande' }])[0].listed, true);
        assert.equal(markListedSpells([yolane], [{ name: 'Présence royale de Yolane' }])[0].listed, true);
    });

    test('chaque sort de serment existe dans la base de sorts, au bon niveau et avec le même nom', () => {
        const db = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
        const list = Array.isArray(db) ? db : db.spells;
        for (const [subclass, rows] of Object.entries(SUBCLASS_SPELLS).filter(([key]) => key.startsWith('oath_'))) {
            assert.ok(DD_RULES.subclasses[subclass]?.class === 'paladin', subclass);
            assert.equal(rows.length, 10, subclass);
            for (const [classLevel, vo, name, level, flag, options] of rows) {
                assert.ok([3, 5, 9, 13, 17].includes(classLevel), `${subclass} ${vo}`);
                const entry = list.find(s => s.vo === vo);
                assert.ok(entry, `${vo} absent de data/spells.json`);
                assert.ok([name, ...(options?.aka ?? [])].includes(entry.name.split('|')[0]), vo);
                assert.equal(entry.level, level, vo);
                assert.equal(entry.ritual === true, flag === 'R', `${vo} : rituel`);
                // Un sort de Paladin ne dépasse pas le niveau 5 ; niveau de classe 3/5/9/13/17 → sort 1 à 5
                assert.equal(level, [3, 5, 9, 13, 17].indexOf(classLevel) + 1, `${vo} : niveau`);
            }
        }
    });

    test('Conduit divin : DD = 8 + maîtrise + Charisme, aussi pour le Seigneur Dragon (règle 2024)', () => {
        const ancients = subclassFeatures(deriveCharacter(iria({ char_subclass: 'Serment des Anciens' }))).reached;
        assert.match(ancients.find(f => f.id === 'courroux_de_la_nature').automation.text, /DD 14 /);
        const dragon = subclassFeatures(deriveCharacter(iria({ char_subclass: 'Serment du Seigneur Dragon', cha_score: '18', char_level: '9' }))).reached;
        assert.match(dragon.find(f => f.id === 'fureur_du_dragon').automation.text, /Sagesse DD 16 .*dit 14/);
        assert.match(dragon.find(f => f.id === 'mepris_des_laches').automation.text, /Charisme DD 16 /);
    });

    test('Arme sacrée : Charisme, minimum +1 ; Châtiment d’exaltation : 2d8 + niveau', () => {
        const devotion = (cha) => subclassFeatures(deriveCharacter(iria({ char_subclass: 'Serment de Dévotion', cha_score: cha }))).reached
            .find(f => f.id === 'arme_sacree').automation.text;
        assert.match(devotion('16'), /: \+3 /);
        assert.match(devotion('8'), /: \+1 /);
        const glory = subclassFeatures(deriveCharacter(iria())).reached;
        assert.match(glory.find(f => f.id === 'chatiment_inspirant').automation.text, /2d8 \+ 5\./);
        assert.equal(automationKind(glory.find(f => f.id === 'sorts_du_serment_de_gloire')), 'calc');
    });

    test('Défense glorieuse (niveau 15) : autant de cases que le Charisme, au moins 1', () => {
        assert.deepEqual(counters(iria()), []);
        assert.deepEqual(counters(iria({ char_level: '15' })).map(c => [c.feature, c.max]), [['defense_glorieuse', 3]]);
        assert.equal(counters(iria({ char_level: '15', cha_score: '8' }))[0].max, 1);
        assert.deepEqual(counters(iria({ char_level: '20' })).map(c => c.feature), ['defense_glorieuse', 'legende_vivante']);
    });
});
