// =============================================================================
// Sous-classes, lot 7 : formes du Cercle de la Lune (Forme sauvage) et du Cercle des Étoiles
// (Forme stellaire, constellation) : chiffres de la carte, forme cochée, repères, repos.
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deriveCharacter } from '../js/rules/character.js';
import {
    wildShapeBase, moonFormNumbers, starryDice, constellationNumbers, moonFormLines, starryFormLines, formNotes
} from '../js/rules/subclass-forms.js';
import { setSubclassChoicePatch, subclassChoiceNotes } from '../js/rules/subclass-choices.js';
import { subclassDefenseNotes } from '../js/rules/subclass-combat.js';
import { subclassFeatures } from '../js/rules/subclass-features.js';
import { classFeatureNotes } from '../js/rules/class-features.js';
import { getClassResourceInfo } from '../js/rules/logic.js';
import { planShortRest, planLongRest } from '../js/rules/rest.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const record = (cls, subclass, level, key, choices, extra = {}) => ({
    ...createDefaultCharacter(), char_class: cls, char_subclass: subclass, char_level: String(level), wis_score: '16',
    ...(choices !== undefined ? { subclass_choices: { [key]: choices } } : {}), ...extra
});
const moon = (level, choices, extra) => record('Druide', 'Cercle de la Lune', level, 'circle_of_the_moon', choices, extra);
const stars = (level, choices, extra) => record('Druide', 'Cercle des Étoiles', level, 'circle_of_the_stars', choices, extra);
const d = (c) => deriveCharacter(c);
const feature = (c, id) => subclassFeatures(d(c)).reached.find(f => f.id === id)?.automation;
const plein = (c) => (subclassDefenseNotes(d(c), c).armorClass ?? []).find(n => n.featId === 'plein_d_etoiles');

describe('Forme sauvage de base', () => {
    test('formes connues, FP, vol, durée, PV temporaires', () => {
        assert.deepEqual(wildShapeBase(2), { uses: 2, knownForms: 4, maxCR: '1/4', fly: false, hours: 1, tempHp: 2 });
        assert.deepEqual([wildShapeBase(4).knownForms, wildShapeBase(4).maxCR], [6, '1/2']);
        assert.deepEqual([wildShapeBase(8).knownForms, wildShapeBase(8).maxCR, wildShapeBase(8).fly], [8, '1', true]);
        assert.equal(wildShapeBase(7).fly, false);
        assert.equal(wildShapeBase(3).hours, 1);
        assert.equal(wildShapeBase(7).hours, 3);
    });

    test('utilisations : même table que la ressource de classe', () => {
        for (let level = 2; level <= 20; level++) {
            assert.equal(wildShapeBase(level).uses, getClassResourceInfo(level, 'Druide', { wis: 3 }).count, `niveau ${level}`);
        }
    });
});

describe('Cercle de la Lune', () => {
    test('moonFormNumbers : FP niveau ÷ 3, PV 3 × niveau, CA 13 + Sagesse', () => {
        for (const [level, cr] of [[3, 1], [5, 1], [6, 2], [9, 3], [12, 4], [20, 6]]) {
            const n = moonFormNumbers(level, 3);
            assert.deepEqual([n.maxCR, n.tempHp], [cr, 3 * level], `niveau ${level}`);
        }
        assert.equal(moonFormNumbers(3, 3).ac, 16);
        assert.equal(moonFormNumbers(3, -1).ac, 12);
    });

    test('carte niveau 3 : FP 1, CA 16, 9 PV, 1 h, trois sorts', () => {
        const lines = moonFormLines(d(moon(3)));
        assert.match(lines[0], /FP 1 au maximum.*4 formes connues, sans vitesse de vol/);
        assert.match(lines[1], /CA en forme : 16 \(13 \+ Sagesse \+3\)/);
        assert.match(lines[2], /: 9 \(3 × niveau\)/);
        assert.match(lines[3], /Durée : 1 h.*2 au total/);
        assert.ok(lines.includes('Sorts lançables en forme : Soins, Rayon de lune, Poussière d\'étoile.'));
        assert.ok(!lines.some(line => /Constitution|Foulée sélène|2d10/.test(line)));
    });

    test('carte niveaux 6, 10, 14 et 18', () => {
        const six = moonFormLines(d(moon(6)));
        assert.ok(six.some(line => /celle de la bête \+3 \(Sagesse\)/.test(line)));
        assert.ok(six.some(line => /radiants au lieu de son type/.test(line)));
        assert.ok(six.some(line => /Invocation d'animaux/.test(line)));
        const ten = moonFormLines(d(moon(10)));
        assert.match(ten[0], /FP 3 au maximum.*8 formes connues, vitesse de vol permise/);
        assert.ok(ten.some(line => /Foulée sélène : 3 cases/.test(line)));
        assert.ok(ten.some(line => /Fontaine de lune, Soins de groupe/.test(line)));
        const fourteen = moonFormLines(d(moon(14)));
        assert.match(fourteen[0], /FP 4/);
        assert.match(fourteen[2], /: 42 /);
        assert.ok(fourteen.some(line => /\+2d10 dégâts radiants une fois par tour/.test(line)));
        assert.ok(moonFormLines(d(moon(18))).some(line => /tous vos sorts/.test(line)));
    });

    test('Sagesse nulle : rien à ajouter à la sauvegarde de Constitution', () => {
        const c = moon(6, { wild_shape: 'on' }, { wis_score: '10' });
        assert.ok(moonFormLines(d(c)).some(line => /rien à ajouter/.test(line)));
        assert.equal(formNotes(d(c))['saves.con'], undefined);
    });

    test('texte « Dans la fiche » et liste sous Formes du cercle', () => {
        const off = feature(moon(3), 'formes_du_cercle');
        assert.match(off.text, /Cochez « En Forme sauvage »/);
        assert.equal(off.list.length, moonFormLines(d(moon(3))).length);
        assert.match(feature(moon(3, { wild_shape: 'on' }), 'formes_du_cercle').text, /Forme : CA 16/);
        assert.ok(feature(moon(14), 'forme_lunaire'));
    });
});

describe('Pas de carte', () => {
    test('non-druide, druide niveau 2, autre cercle', () => {
        const fighter = record('Guerrier', 'Cercle de la Lune', 5, 'circle_of_the_moon', { wild_shape: 'on' });
        assert.deepEqual(moonFormLines(d(fighter)), []);
        assert.deepEqual(formNotes(d(fighter)), {});
        assert.deepEqual(moonFormLines(d(moon(2))), []);
        assert.deepEqual(starryFormLines(d(stars(2))), []);
        for (const sub of ['Cercle de la Terre', 'Cercle de la Mer']) {
            const c = record('Druide', sub, 10, 'circle_of_the_moon', { wild_shape: 'on' });
            assert.deepEqual(moonFormLines(d(c)), [], sub);
            assert.deepEqual(starryFormLines(d(c)), [], sub);
            assert.deepEqual(formNotes(d(c)), {}, sub);
        }
    });
});

describe('Cercle des Étoiles', () => {
    test('1d8 aux niveaux 3-9, 2d8 au niveau 10', () => {
        assert.equal(starryDice(3), 1);
        assert.equal(starryDice(9), 1);
        assert.equal(starryDice(10), 2);
    });

    test('Archer et Calice chiffrés (Sagesse +3)', () => {
        assert.match(constellationNumbers(d(stars(3)), 'archer'), /attaque de sort à distance \+5 contre une créature à 18 m, 1d8 \+ 3 dégâts radiants/);
        assert.match(constellationNumbers(d(stars(6)), 'archer'), /\+6 .*1d8 \+ 3/);
        assert.match(constellationNumbers(d(stars(10)), 'archer'), /\+7 .*2d8 \+ 3/);
        assert.match(constellationNumbers(d(stars(3)), 'chalice'), /récupérez 1d8 \+ 3 PV/);
        assert.match(constellationNumbers(d(stars(10)), 'chalice'), /2d8 \+ 3 PV/);
        assert.doesNotMatch(constellationNumbers(d(stars(3)), 'dragon'), /vol/);
        assert.match(constellationNumbers(d(stars(10)), 'dragon'), /vol de 6 m, vol stationnaire/);
        assert.equal(constellationNumbers(d(stars(3)), 'phoenix'), '');
    });

    test('Sagesse +0 : pas de « + 0 » ; négative : « - 1 » ; toucher sans caractéristique d\'incantation', () => {
        assert.match(constellationNumbers(d(stars(3, undefined, { wis_score: '10' })), 'archer'), /\+2 contre .*, 1d8 dégâts/);
        assert.match(constellationNumbers(d(stars(3, undefined, { wis_score: '8' })), 'chalice'), /1d8 - 1 PV/);
        const other = stars(3, undefined, { spell_ability: 'int', int_score: '20' });
        assert.match(constellationNumbers(d(other), 'archer'), /\+5 contre/);
    });

    test('carte : constellation choisie d\'abord, rappel du changement selon le niveau', () => {
        const lines = starryFormLines(d(stars(3, { constellation: 'dragon' })));
        assert.match(lines[0], /10 minutes ; lumière vive à 3 m/);
        assert.match(lines[1], /^Dragon \(choisie\) :/);
        assert.ok(lines.some(line => /reste la même jusqu'à la fin/.test(line)));
        assert.ok(starryFormLines(d(stars(10))).some(line => /changer de constellation/.test(line)));
        assert.ok(starryFormLines(d(stars(14))).some(line => /Plénitude stellaire/.test(line)));
        assert.ok(!starryFormLines(d(stars(13))).some(line => /Plénitude stellaire/.test(line)));
        assert.match(feature(stars(3, { constellation: 'chalice' }), 'forme_etoilee').text, /constellation : Calice/);
        assert.equal(feature(stars(3), 'forme_etoilee').list.length, 5);
    });

    test('constellation absente, abîmée, inconnue ou d\'une autre sous-classe : pas choisie', () => {
        const cases = [
            stars(3), { ...stars(3), subclass_choices: null }, { ...stars(3), subclass_choices: [] },
            stars(3, { constellation: 'phoenix' }), stars(3, { constellation: 'Archer' }), stars(3, { constellation: 3 }),
            record('Druide', 'Cercle des Étoiles', 3, 'circle_of_the_moon', { constellation: 'archer' })
        ];
        for (const c of cases) {
            assert.equal(d(c).subclassChoices.constellation, undefined);
            assert.ok(!starryFormLines(d(c)).some(line => /choisie/.test(line)));
            assert.match(feature(c, 'forme_etoilee').text, /constellation à choisir/);
        }
    });

    test('patch : valeur inconnue refusée, vide efface, fiche reçue intacte', () => {
        const c = stars(3, { constellation: 'archer' });
        assert.deepEqual(setSubclassChoicePatch(c, 'circle_of_the_stars', 'constellation', 'phoenix'), {});
        assert.deepEqual(setSubclassChoicePatch(c, 'circle_of_the_stars', 'constellation', 'dragon').subclass_choices,
            { circle_of_the_stars: { constellation: 'dragon' } });
        assert.deepEqual(setSubclassChoicePatch(c, 'circle_of_the_stars', 'constellation', '').subclass_choices, { circle_of_the_stars: {} });
        assert.deepEqual(setSubclassChoicePatch(c, 'circle_of_the_stars', 'starry_form', 'on').subclass_choices,
            { circle_of_the_stars: { constellation: 'archer', starry_form: 'on' } });
        assert.deepEqual(c.subclass_choices, { circle_of_the_stars: { constellation: 'archer' } });
    });
});

describe('Plénitude stellaire', () => {
    test('absent au niveau 13, grisé hors forme au 14, actif forme cochée', () => {
        assert.equal(plein(stars(13, { starry_form: 'on' })), undefined);
        assert.equal(plein(stars(14)).inactive, true);
        assert.equal(plein(stars(14, { starry_form: 'on' })).inactive, undefined);
        // L'ancien bouton de combat ne l'allume pas
        assert.equal(plein(stars(14, undefined, { combat_buffs: { starryForm: true } })).inactive, true);
        assert.match(feature(stars(14), 'plein_d_etoiles').text, /« En Forme stellaire » est cochée/);
    });
});

describe('Repères pendant la forme', () => {
    test('rien quand la forme n\'est pas cochée', () => {
        assert.deepEqual(formNotes(d(moon(10))), {});
        assert.deepEqual(formNotes(d(stars(10, { constellation: 'dragon' }))), {});
    });

    test('Lune : CA au niveau 3, sauvegarde de Constitution au niveau 6', () => {
        const three = formNotes(d(moon(3, { wild_shape: 'on' })));
        assert.equal(three.armorClass[0].mention, 'Forme : CA 16');
        assert.equal(three['saves.con'], undefined);
        const six = formNotes(d(moon(6, { wild_shape: 'on' })));
        assert.match(six['saves.con'][0].text, /^En Forme sauvage : \+3 \(Sagesse\)/);
        assert.ok(six['saves.con'][0].classFeature);
    });

    test('Étoiles : Dragon seulement ; vol de 6 m au niveau 10', () => {
        assert.deepEqual(formNotes(d(stars(10, { starry_form: 'on', constellation: 'archer' }))), {});
        const three = formNotes(d(stars(3, { starry_form: 'on', constellation: 'dragon' })));
        assert.match(three['saves.con'][0].text, /Concentration/);
        assert.equal(three.speed, undefined);
        assert.match(formNotes(d(stars(10, { starry_form: 'on', constellation: 'dragon' }))).speed[0].text, /vol de 6 m/);
    });

    test('fusionnés par classFeatureNotes', () => {
        const c = moon(6, { wild_shape: 'on' });
        const zones = classFeatureNotes(d(c), c);
        assert.ok(zones.armorClass.some(n => n.featId === 'formes_du_cercle'));
        assert.ok(zones['saves.con'].some(n => n.featId === 'formes_du_cercle_ameliorees'));
    });
});

describe('Repos', () => {
    test('repos court : Forme stellaire décochée, Forme sauvage et constellation gardées', () => {
        const s = stars(3, { starry_form: 'on', constellation: 'dragon' });
        assert.deepEqual(planShortRest(s).patch.subclass_choices, { circle_of_the_stars: { constellation: 'dragon' } });
        assert.equal(planShortRest(moon(3, { wild_shape: 'on' })).patch.subclass_choices, undefined);
        assert.deepEqual(s.subclass_choices.circle_of_the_stars, { starry_form: 'on', constellation: 'dragon' });
    });

    test('repos long : les deux formes décochées, constellation gardée', () => {
        assert.deepEqual(planLongRest(stars(3, { starry_form: 'on', constellation: 'archer' })).patch.subclass_choices,
            { circle_of_the_stars: { constellation: 'archer' } });
        assert.deepEqual(planLongRest(moon(3, { wild_shape: 'on' })).patch.subclass_choices, { circle_of_the_moon: {} });
        assert.equal(planLongRest(stars(3, { constellation: 'archer' })).patch.subclass_choices, undefined);
    });

    test('rappels de fin de repos seulement quand la forme est cochée', () => {
        const rest = (c) => subclassChoiceNotes(d(c), c).rest ?? [];
        assert.deepEqual(rest(moon(3)), []);
        assert.deepEqual(rest(stars(3, { constellation: 'archer' })), []);
        const wild = rest(moon(3, { wild_shape: 'on' }))[0];
        assert.match(wild.text, /^En Forme sauvage : prend fin avec ce repos/);
        assert.equal(wild.restKind, 'long');
        assert.equal(rest(stars(3, { starry_form: 'on' }))[0].restKind, undefined);
    });

    test('ni la case de Forme sauvage ni les PV temporaires ne sont touchés', () => {
        const c = moon(3, { wild_shape: 'on' }, { class_res_0: true, hp_temp: '4' });
        const patch = setSubclassChoicePatch(c, 'circle_of_the_moon', 'wild_shape', '');
        assert.deepEqual(Object.keys(patch), ['subclass_choices']);
    });
});

describe('Fiches existantes', () => {
    test('fiche v3 publiée : relue sans erreur, aucune clé ajoutée', () => {
        const legacy = JSON.parse(readFileSync(new URL('./fixtures/legacy-v1.json', import.meta.url), 'utf8'));
        const before = JSON.stringify(legacy);
        const derived = d(legacy);
        formNotes(derived);
        moonFormLines(derived);
        starryFormLines(derived);
        classFeatureNotes(derived, legacy);
        assert.equal(JSON.stringify(legacy), before);
    });
});
