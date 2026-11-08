/**
 * TESTS UNITAIRES — FEAT-SPELLS.JS (sorts donnés par un don, lot 6)
 * Règles vérifiées dans le Player's Handbook 2024 anglais (Magic Initiate p. 201, Fey-Touched
 * p. 204, Ritual Caster p. 206, Shadow-Touched p. 207, Telekinetic p. 207, Telepathic p. 208).
 * La fiche n'écrit jamais dans la liste des sorts du joueur ni dans ses emplacements.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    MAGIC_INITIATE_LISTS, FEY_TOUCHED_SPELLS, SHADOW_TOUCHED_SPELLS, RITUAL_SPELLS, FIXED_FEAT_SPELLS
} from '../js/data/feat-spells.js';
import {
    FEAT_SPELL_FEATS, featSpellGroups, featSpellUseKey, setFeatSpellUsePatch, restFeatSpellUses, featSpellSummary
} from '../js/rules/feat-spells.js';
import { slotChoice, setFeatChoicePatch, featChoiceGrants, FEAT_CHOICE_RULES } from '../js/rules/feat-choices.js';
import { featCounters, restFeatUses } from '../js/rules/feat-uses.js';
import { featEffects } from '../js/rules/feat-effects.js';
import { planLongRest, planShortRest } from '../js/rules/rest.js';
import { deriveCharacter } from '../js/rules/character.js';
import { migrateCharacter } from '../js/state/migrate.js';

const SPELLS = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
const frName = (spell) => String(spell.name).split('|')[0].trim();
const sortedVo = (list) => list.map(([vo]) => vo).sort();
const voOf = (filter) => SPELLS.filter(filter).map(s => s.vo).sort();

/** Paladin niveau 9 : Initié à la magie (1), Affinité féerique (4), Télékinésiste (8) */
const hero = (extra = {}) => ({
    char_class: 'Paladin', char_level: '9', str_score: '16', wis_score: '14', cha_score: '16', int_score: '10',
    feat_1: 'initie_a_la_magie', feat_4: 'affinite_feerique', feat_8: 'telekinesiste',
    feat_choices: {
        1: { initie_a_la_magie: { list: 'cleric', castAbility: 'wis', cantrip1: 'Guidance', cantrip2: 'Sacred Flame', spell: 'Healing Word' } },
        4: { affinite_feerique: { ability: 'cha', spell: 'Bless' } },
        8: { telekinesiste: { ability: 'cha' } }
    },
    ...extra
});
const groupsOf = (character) => featSpellGroups(character, deriveCharacter(character));

describe('Listes de sorts permis (reflet de data/spells.json)', () => {
    test('Initié à la magie : sorts mineurs et de niveau 1 de chaque liste', () => {
        for (const cls of ['cleric', 'druid', 'wizard']) {
            assert.deepEqual(sortedVo(MAGIC_INITIATE_LISTS[cls].cantrips), voOf(s => String(s.level) === '0' && s.classes.includes(cls)), cls);
            assert.deepEqual(sortedVo(MAGIC_INITIATE_LISTS[cls].level1), voOf(s => String(s.level) === '1' && s.classes.includes(cls)), cls);
        }
        // Listes du Manuel 2024 (p. 71, 82, 168) : nombres vérifiés le 08/11/2026
        assert.deepEqual(['cleric', 'druid', 'wizard'].map(c => [MAGIC_INITIATE_LISTS[c].cantrips.length, MAGIC_INITIATE_LISTS[c].level1.length]),
            [[9, 15], [13, 18], [20, 31]]);
    });

    test('Affinités : écoles ; Magie rituelle : étiquette Rituel ; sorts imposés', () => {
        assert.deepEqual(sortedVo(FEY_TOUCHED_SPELLS), voOf(s => String(s.level) === '1' && ['Divination', 'Enchantement'].includes(s.school)));
        assert.deepEqual(sortedVo(SHADOW_TOUCHED_SPELLS), voOf(s => String(s.level) === '1' && ['Illusion', 'Nécromancie'].includes(s.school)));
        assert.deepEqual(sortedVo(RITUAL_SPELLS), voOf(s => String(s.level) === '1' && s.ritual));
        assert.equal(FEY_TOUCHED_SPELLS.length, 18);
        assert.equal(SHADOW_TOUCHED_SPELLS.length, 8);
        assert.equal(RITUAL_SPELLS.length, 11);
        for (const [vo, name, level] of Object.values(FIXED_FEAT_SPELLS)) {
            const spell = SPELLS.find(s => s.vo === vo);
            assert.ok(spell, vo);
            assert.equal(frName(spell), name);
            assert.equal(Number(spell.level), level);
        }
    });

    test('Noms français repris de la base (premier nom quand il y en a deux)', () => {
        const all = [...Object.values(MAGIC_INITIATE_LISTS).flatMap(l => [...l.cantrips, ...l.level1]),
            ...FEY_TOUCHED_SPELLS, ...SHADOW_TOUCHED_SPELLS, ...RITUAL_SPELLS];
        for (const [vo, name, flag] of all) {
            const spell = SPELLS.find(s => s.vo === vo);
            assert.equal(name, frName(spell), vo);
            assert.equal(flag === 'R', Boolean(spell.ritual), vo);
            assert.ok(!name.includes('|'), vo);
        }
    });
});

describe('Choix des dons à sorts', () => {
    test('Initié à la magie : les sorts suivent la liste choisie', () => {
        const c = hero();
        assert.deepEqual(slotChoice(c, 1, 'initie_a_la_magie'),
            { list: 'cleric', castAbility: 'wis', cantrip1: 'Guidance', cantrip2: 'Sacred Flame', spell: 'Healing Word' });
        // Liste changée : les sorts d'une autre liste ne comptent plus (ils restent enregistrés)
        const druid = hero({ feat_choices: { 1: { initie_a_la_magie: { list: 'druid', cantrip1: 'Sacred Flame', cantrip2: 'Guidance', spell: 'Healing Word' } } } });
        assert.deepEqual(slotChoice(druid, 1, 'initie_a_la_magie'), { list: 'druid', cantrip2: 'Guidance', spell: 'Healing Word' });
        // Sans liste : aucun sort retenu
        const none = hero({ feat_choices: { 1: { initie_a_la_magie: { cantrip1: 'Guidance' } } } });
        assert.deepEqual(slotChoice(none, 1, 'initie_a_la_magie'), {});
        // Un sort qui n'est d'aucune liste est refusé à l'enregistrement
        assert.deepEqual(setFeatChoicePatch(c, 1, 'initie_a_la_magie', 'spell', 'Fireball'), {});
        assert.ok(setFeatChoicePatch(c, 1, 'initie_a_la_magie', 'spell', 'Shield').feat_choices);
    });

    test('Initié à la magie : la caractéristique des sorts ne donne pas de +1', () => {
        const grant = featChoiceGrants(hero()).find(g => g.featId === 'initie_a_la_magie');
        assert.deepEqual(grant.abilities, []);
        const fey = featChoiceGrants(hero()).find(g => g.featId === 'affinite_feerique');
        assert.deepEqual(fey.abilities, [{ ability: 'cha', amount: 1 }]);
    });

    test('Magie rituelle : autant de sorts rituels que le bonus de maîtrise', () => {
        const ritual = (level, choices = {}) => ({ char_level: String(level), int_score: '14', feat_4: 'magie_rituelle',
            feat_choices: { 4: { magie_rituelle: { ability: 'int', ...choices } } } });
        const missing = (level) => featChoiceGrants(ritual(level)).find(g => g.featId === 'magie_rituelle').missing;
        assert.deepEqual(missing(4), ['Sort rituel 1', 'Sort rituel 2']);
        assert.deepEqual(missing(5), ['Sort rituel 1', 'Sort rituel 2', 'Sort rituel 3']);
        assert.equal(missing(17).length, 6);
        // Un sort choisi pour un menu pas encore atteint (niveau baissé) est gardé mais ne compte pas
        const group = groupsOf(ritual(4, { ritual1: 'Detect Magic', ritual3: 'Alarm' })).find(g => g.featId === 'magie_rituelle');
        assert.deepEqual(group.spells.map(s => s.vo), ['Detect Magic']);
        assert.equal(slotChoice(ritual(4, { ritual3: 'Alarm' }), 4, 'magie_rituelle').ritual3, 'Alarm');
    });

    test('Tous les dons à sorts sont décrits et automatisés', () => {
        for (const id of FEAT_SPELL_FEATS) assert.ok(FEAT_CHOICE_RULES[id], id);
    });
});

describe('Sorts de dons', () => {
    test('DD et attaque avec la caractéristique du don', () => {
        const groups = groupsOf(hero());
        assert.deepEqual(groups.map(g => [g.featId, g.level, g.ability, g.dc, g.attack]), [
            ['initie_a_la_magie', 1, 'wis', 14, 6], // 8 + 4 (maîtrise, niveau 9) + 2 (Sag 14)
            ['affinite_feerique', 4, 'cha', 15, 7],
            ['telekinesiste', 8, 'cha', 15, 7]
        ]);
    });

    test('Sorts, lancers gratuits et emplacements', () => {
        const [initiate, fey, tk] = groupsOf(hero());
        assert.deepEqual(initiate.spells.map(s => [s.name, s.kind, s.slots, s.free?.key ?? null]), [
            ['Assistance', 'cantrip', '', null],
            ['Flamme sacrée', 'cantrip', '', null],
            ['Mot de guérison', 'prepared', 'any', 'initie_a_la_magie@1:spell']
        ]);
        assert.deepEqual(fey.spells.map(s => [s.name, s.level, s.slots, s.free?.key]), [
            ['Bénédiction', 1, 'any', 'affinite_feerique@4:spell'],
            ['Foulée brumeuse', 2, '2+', 'affinite_feerique@4:fixed']
        ]);
        assert.equal(tk.spells[0].name, 'Main de mage');
        assert.match(tk.spells[0].note, /18 m/);
        assert.match(tk.extras[0].text, /DD 15/);
    });

    test('Affinité ombreuse, Télépathe, Magie rituelle', () => {
        const c = { char_level: '8', int_score: '16', feat_4: 'affinite_ombreuse', feat_8: 'telepathe', feat_1: '',
            feat_choices: { 4: { affinite_ombreuse: { ability: 'int', spell: 'Illusory Script' } }, 8: { telepathe: { ability: 'int' } } } };
        const [shadow, telepathic] = groupsOf(c);
        assert.deepEqual(shadow.spells.map(s => [s.name, s.ritual]), [['Texte illusoire', true], ['Invisibilité', false]]);
        assert.match(shadow.spells[0].note, /rituel/);
        assert.deepEqual(telepathic.spells.map(s => [s.name, s.free.key]), [['Détection des pensées', 'telepathe@8:fixed']]);
        assert.match(telepathic.spells[0].free.text, /sans composantes/);
        assert.match(telepathic.extras[0].text, /18 m/);
    });

    test('Rien de choisi : pas de DD, choix signalés', () => {
        const c = { char_level: '4', feat_4: 'affinite_feerique' };
        const [fey] = groupsOf(c);
        assert.equal(fey.dc, null);
        assert.deepEqual(fey.spells.map(s => s.name), ['Foulée brumeuse']);
        assert.deepEqual(fey.missing, ['Caractéristique +1', 'Sort de niveau 1']);
        assert.match(featSpellSummary(fey), /dès que la caractéristique est choisie/);
    });

    test('Don pas encore atteint : rien', () => {
        assert.deepEqual(groupsOf({ char_level: '3', feat_4: 'affinite_feerique' }), []);
    });

    test('Initié à la magie pris deux fois : chaque exemplaire a son lancer gratuit ; même liste signalée', () => {
        const twice = hero({ feat_4: 'initie_a_la_magie', feat_choices: {
            1: { initie_a_la_magie: { list: 'cleric', castAbility: 'wis', spell: 'Bless' } },
            4: { initie_a_la_magie: { list: 'cleric', castAbility: 'cha', spell: 'Command' } }
        } });
        const groups = groupsOf(twice).filter(g => g.featId === 'initie_a_la_magie');
        assert.deepEqual(groups.map(g => g.spells.at(-1).free.key), ['initie_a_la_magie@1:spell', 'initie_a_la_magie@4:spell']);
        assert.equal(groups[0].warnings.length, 0);
        assert.match(groups[1].warnings[0], /autre liste/);
    });

    test('Même sort mineur ou même rituel choisi deux fois : signalé', () => {
        const same = hero({ feat_choices: { 1: { initie_a_la_magie: { list: 'cleric', cantrip1: 'Guidance', cantrip2: 'Guidance' } } } });
        assert.match(groupsOf(same)[0].warnings[0], /deux fois/);
        const rituals = { char_level: '8', feat_8: 'magie_rituelle', feat_choices: { 8: { magie_rituelle: { ritual1: 'Alarm', ritual2: 'Alarm' } } } };
        const group = groupsOf(rituals)[0];
        assert.equal(group.spells.length, 1);
        assert.match(group.warnings[0], /Alarme est choisi deux fois/);
    });

    test('Encadré du don : résumé et alertes', () => {
        const effects = featEffects(hero());
        const texts = (effects['featSlot:4'] ?? []).map(n => n.text);
        assert.ok(texts.some(t => /Bénédiction, Foulée brumeuse : dans le grimoire/.test(t) && /Charisme : DD 15, attaque \+7/.test(t)), texts.join(' | '));
    });
});

describe('Lancers gratuits et repos', () => {
    test('Cocher et décocher, seulement pour une clé de lancer gratuit', () => {
        const key = featSpellUseKey('affinite_feerique', 4, 'fixed');
        const patch = setFeatSpellUsePatch(hero({ feat_uses: { chanceux: 2 } }), key, true);
        assert.deepEqual(patch, { feat_uses: { chanceux: 2, 'affinite_feerique@4:fixed': 1 } });
        assert.equal(groupsOf(hero(patch)).find(g => g.featId === 'affinite_feerique').spells[1].free.used, true);
        assert.deepEqual(setFeatSpellUsePatch(hero(), 'chanceux', true), {});
        assert.deepEqual(setFeatSpellUsePatch(hero(), 'affinite_feerique@4:other', true), {});
    });

    test('Repos long : lancers gratuits et Rituel rapide reviennent ; repos court : non', () => {
        const c = {
            ...hero({ feat_12: 'magie_rituelle', char_level: '12' }),
            feat_choices: { ...hero().feat_choices, 12: { magie_rituelle: { ability: 'wis' } } },
            feat_uses: { 'affinite_feerique@4:fixed': 1, 'initie_a_la_magie@1:spell': 1, magie_rituelle: 1, 'telepathe@16:fixed': 1 }
        };
        const long = planLongRest(c);
        assert.deepEqual(long.patch.feat_uses, { 'affinite_feerique@4:fixed': 0, 'initie_a_la_magie@1:spell': 0, magie_rituelle: 0, 'telepathe@16:fixed': 0 });
        assert.deepEqual(long.summary.featUsesRestored.map(u => u.label).sort(),
            ['Foulée brumeuse, lancer gratuit', 'Mot de guérison, lancer gratuit', 'Rituel rapide'].sort());
        const short = planShortRest(c);
        assert.equal(short.patch.feat_uses, undefined);
        assert.deepEqual(restFeatUses(c, deriveCharacter(c), 'short').patch, {});
    });

    test('Rituel rapide : un compteur (1 par repos long)', () => {
        const c = { char_level: '4', feat_4: 'magie_rituelle', wis_score: '13' };
        const counter = featCounters(c, deriveCharacter(c)).find(x => x.featId === 'magie_rituelle');
        assert.equal(counter.max, 1);
        assert.equal(counter.reset, 'long');
    });

    test('Rien à rendre : patch vide', () => {
        const c = hero({ feat_uses: { 'affinite_feerique@4:fixed': 0 } });
        assert.deepEqual(restFeatSpellUses(c, deriveCharacter(c)).patch, {});
    });

    test('Sauvegarde : seulement feat_choices et feat_uses, conservés par la migration', () => {
        const c = hero({ feat_uses: { 'affinite_feerique@4:fixed': 1 } });
        const { character } = migrateCharacter(JSON.parse(JSON.stringify(c)));
        assert.deepEqual(character.feat_uses, c.feat_uses);
        assert.deepEqual(character.feat_choices, c.feat_choices);
        // La liste des sorts du joueur n'est jamais touchée
        assert.deepEqual(character.dynamic_spells ?? [], []);
    });
});
