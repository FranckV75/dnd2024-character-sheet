/**
 * TESTS UNITAIRES — FEAT-USES.JS (dons à usages limités : Chanceux, Tueur de mages)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { featCounters, featUsesState, setFeatUsesPatch, restFeatUses, FEAT_COUNTERS } from '../js/rules/feat-uses.js';
import { deriveCharacter } from '../js/rules/character.js';
import { planShortRest, planLongRest } from '../js/rules/rest.js';
import { featEffects, AUTOMATED_FEATS } from '../js/rules/feat-effects.js';
import { migrateCharacter } from '../js/state/migrate.js';
import { V4_ONLY_KEYS } from '../js/cloud/sync.js';

const hero = (extra = {}) => ({
    char_class: 'Guerrier', char_level: '4', feat_1: 'chanceux', feat_4: 'tueur_de_mages',
    hp_current: '30', hp_max: '30', ...extra
});
const counters = (c) => featCounters(c, deriveCharacter(c));

describe('Compteurs des dons', () => {
    test('Chanceux : autant de points que le bonus de maîtrise ; Tueur de mages : 1 case', () => {
        const list = counters(hero());
        assert.deepEqual(list.map(c => [c.featId, c.max, c.used, c.reset, c.level]), [
            ['chanceux', 2, 0, 'long', 1],
            ['tueur_de_mages', 1, 0, 'short', 4]
        ]);
        assert.equal(list[0].label, 'Points de Chance');
        assert.equal(list[0].featName, 'Chanceux');
        assert.equal(list[1].label, 'Esprit préservé');
        assert.equal(list[1].resetText, 'repos court ou long');
        assert.equal(counters(hero({ char_level: '5' }))[0].max, 3);
        assert.equal(counters(hero({ char_level: '9' }))[0].max, 4);
    });

    test('Seuls les dons atteints ont des cases', () => {
        assert.deepEqual(counters(hero({ char_level: '3' })).map(c => c.featId), ['chanceux']);
        assert.deepEqual(counters({ char_level: '4' }), []);
        assert.deepEqual(counters(hero({ feat_1: 'vigilant', feat_4: 'robuste' })), []);
    });

    test('Un don choisi deux fois (ancienne sauvegarde) n’a qu’un compteur', () => {
        assert.equal(counters(hero({ feat_4: 'chanceux' })).length, 1);
    });

    test('Valeurs enregistrées : lues, ramenées entre 0 et le maximum, illisibles = 0', () => {
        assert.equal(counters(hero({ feat_uses: { chanceux: 1 } }))[0].used, 1);
        assert.equal(counters(hero({ feat_uses: { chanceux: 9 } }))[0].used, 2);
        assert.equal(counters(hero({ feat_uses: { chanceux: -3 } }))[0].used, 0);
        assert.equal(counters(hero({ feat_uses: { chanceux: 'abc' } }))[0].used, 0);
        assert.equal(counters(hero({ feat_uses: { chanceux: '2' } }))[0].used, 2);
        assert.equal(counters(hero({ feat_uses: [1, 2] }))[0].used, 0);
        assert.equal(counters(hero({ feat_uses: 'x' }))[0].used, 0);
        assert.deepEqual(featUsesState({ feat_uses: null }), {});
    });

    test('Cocher une case : patch neuf, les autres dons et la fiche ne changent pas', () => {
        const c = hero({ feat_uses: { tueur_de_mages: 1, autre: 5 } });
        const before = JSON.stringify(c);
        assert.deepEqual(setFeatUsesPatch(c, 'chanceux', 2, 2), { feat_uses: { tueur_de_mages: 1, autre: 5, chanceux: 2 } });
        assert.deepEqual(setFeatUsesPatch(c, 'chanceux', 7, 2).feat_uses.chanceux, 2);
        assert.deepEqual(setFeatUsesPatch(c, 'chanceux', -1, 2).feat_uses.chanceux, 0);
        assert.equal(JSON.stringify(c), before);
    });
});

describe('Repos', () => {
    const spent = hero({ feat_uses: { chanceux: 2, tueur_de_mages: 1 } });

    test('Repos court : Esprit préservé revient, pas les points de chance', () => {
        const { patch, summary } = planShortRest(spent);
        assert.deepEqual(patch.feat_uses, { chanceux: 2, tueur_de_mages: 0 });
        assert.deepEqual(summary.featUsesRestored, [{ featId: 'tueur_de_mages', featName: 'Tueur de mages', label: 'Esprit préservé', inText: 'Esprit préservé', count: 1 }]);
    });

    test('Repos long : tout revient', () => {
        const { patch, summary } = planLongRest(spent);
        assert.deepEqual(patch.feat_uses, { chanceux: 0, tueur_de_mages: 0 });
        assert.deepEqual(summary.featUsesRestored.map(u => [u.featId, u.count]), [['chanceux', 2], ['tueur_de_mages', 1]]);
    });

    test('Rien de coché, ou pas de don : aucune clé feat_uses ajoutée', () => {
        assert.equal('feat_uses' in planShortRest(hero()).patch, false);
        assert.equal('feat_uses' in planLongRest(hero()).patch, false);
        assert.equal('feat_uses' in planLongRest({ char_level: '3', hp_max: '20' }).patch, false);
        assert.deepEqual(planLongRest(hero()).summary.featUsesRestored, []);
    });

    test('Un don retiré ou pas encore atteint est vidé aussi (clé gardée à 0), sans être annoncé', () => {
        const removed = hero({ feat_1: '', feat_uses: { chanceux: 2, tueur_de_mages: 1, autre: 3 } });
        const long = planLongRest(removed);
        assert.deepEqual(long.patch.feat_uses, { chanceux: 0, tueur_de_mages: 0, autre: 3 });
        assert.deepEqual(long.summary.featUsesRestored.map(u => u.featId), ['tueur_de_mages']);
        // Niveau 3 : Tueur de mages (niveau 4) pas atteint, vidé au repos court ; Chanceux attend le repos long
        const lower = hero({ char_level: '3', feat_uses: { chanceux: 1, tueur_de_mages: 1 } });
        const short = planShortRest(lower);
        assert.deepEqual(short.patch.feat_uses, { chanceux: 1, tueur_de_mages: 0 });
        assert.deepEqual(short.summary.featUsesRestored, []);
        // Rien à vider : pas de patch
        assert.equal('feat_uses' in planShortRest(hero({ feat_uses: { chanceux: 2, tueur_de_mages: 0 } })).patch, false);
    });

    test('Le personnage reçu n’est pas modifié', () => {
        const before = JSON.stringify(spent);
        restFeatUses(spent, deriveCharacter(spent), 'long');
        planLongRest(spent);
        assert.equal(JSON.stringify(spent), before);
    });
});

describe('Effets et sauvegarde', () => {
    test('Les deux dons sont automatisés, avec leurs notes', () => {
        assert.ok(AUTOMATED_FEATS.includes('chanceux') && AUTOMATED_FEATS.includes('tueur_de_mages'));
        const effects = featEffects(hero());
        assert.match(effects['featSlot:1'][0].text, /^2 points de Chance/);
        assert.equal(effects['featSlot:4'].length, 2);
        // Briseur de concentration : texte complet dans l'encadré du don (vaut aussi pour les sorts)
        assert.match(effects['featSlot:4'][1].text, /^Briseur de concentration : .*Désavantage/);
        assert.ok(!effects.weapons.some(n => n.featId === 'tueur_de_mages'));
    });

    test('Chaque don à compteur a une règle (max, rechargement, usage)', () => {
        for (const [id, def] of Object.entries(FEAT_COUNTERS)) {
            assert.ok(['long', 'short'].includes(def.reset), id);
            assert.ok(def.label && def.use, id);
        }
    });

    test('La migration garde feat_uses tel quel ; clé propre à la v4 pour le cloud', () => {
        const { character } = migrateCharacter(hero({ feat_uses: { chanceux: 1 } }));
        assert.deepEqual(character.feat_uses, { chanceux: 1 });
        assert.equal('feat_uses' in migrateCharacter(hero()).character, false);
        assert.ok(V4_ONLY_KEYS.includes('feat_uses'));
    });
});
