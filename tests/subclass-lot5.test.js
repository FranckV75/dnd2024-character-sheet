// =============================================================================
// Sous-classes, lot 5 : boutons de combat, ressources (cases), Résistances près de la CA
// — js/rules/subclass-combat.js, js/rules/subclass-uses.js, js/rules/weapons.js
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    superiorityDie, superiorityDiceCount, maneuverDC, psionicDice, frenzyDice, dreadfulStrikeDice, feyStrikesDie,
    subclassBuffDamage, subclassCombatWeaponNotes, subclassDefenseNotes, SUBCLASS_DEFENSES
} from '../js/rules/subclass-combat.js';
import { subclassCounters, restSubclassUses, SUBCLASS_COUNTERS } from '../js/rules/subclass-uses.js';
import { subclassBuffs, buffsForCharacter, effectiveBuffs } from '../js/rules/weapons.js';
import { subclassFeatures, automationKind } from '../js/rules/subclass-features.js';
import { deriveCharacter, computeWeapon } from '../js/rules/character.js';
import { featEffects, weaponFeatNotes } from '../js/rules/feat-effects.js';
import { SUBCLASS_FEATURES } from '../js/data/subclass-features.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const record = (cls, subclass, level, extra = {}) => ({
    ...createDefaultCharacter(), char_class: cls, char_subclass: subclass, char_level: String(level), ...extra
});
const hero = (...args) => deriveCharacter(record(...args));
const SWORD = { name: 'Épée longue', atkKey: 'str', baseDmg: '1d8 T', prop: 'Polyvalente' };
const BOW = { name: 'Arc long', atkKey: 'dex', baseDmg: '1d8 P', prop: 'Munitions, Lourde, Deux mains' };
const UNARMED = { name: 'Attaque à mains nues', atkKey: 'str', baseDmg: '1 C', prop: '' };
const damage = (r, weapon) => {
    const d = deriveCharacter(r);
    return computeWeapon(weapon, d, effectiveBuffs(d.classSlug, r.combat_buffs, r, d)).damage.text;
};

describe('Dés des ressources', () => {
    test('dé et nombre de dés de supériorité, DD des manœuvres', () => {
        assert.deepEqual([3, 9, 10, 17, 18].map(superiorityDie), ['d8', 'd8', 'd10', 'd10', 'd12']);
        assert.deepEqual([3, 6, 7, 14, 15].map(superiorityDiceCount), [4, 4, 5, 5, 6]);
        assert.equal(maneuverDC(hero('Guerrier', 'Maître de Guerre', 5, { str_score: '14', dex_score: '18' })), 15);
    });

    test('dés psioniques : table commune au Guerrier psionique et à la Lame d\'âme', () => {
        assert.deepEqual([3, 5, 9, 11, 13, 17].map(l => psionicDice(l)), [
            { count: 4, die: 'd6' }, { count: 6, die: 'd8' }, { count: 8, die: 'd8' },
            { count: 8, die: 'd10' }, { count: 10, die: 'd10' }, { count: 12, die: 'd12' }]);
    });

    test('Frénésie = bonus de Rage en d6 ; Frappe effroyable 2d6 puis 2d8 ; Frappes effroyables 1d4 puis 1d6', () => {
        assert.deepEqual([3, 9, 16].map(frenzyDice), ['2d6', '3d6', '4d6']);
        assert.deepEqual([3, 11].map(dreadfulStrikeDice), ['2d6', '2d8']);
        assert.deepEqual([3, 11].map(feyStrikesDie), ['1d4', '1d6']);
    });
});

describe('Boutons du tableau des armes', () => {
    test('proposés à la bonne sous-classe, une fois le niveau atteint', () => {
        assert.deepEqual(subclassBuffs(record('Barbare', 'Voie du Berserker', 3)), ['frenzy']);
        assert.deepEqual(subclassBuffs(record('Barbare', 'Voie du Berserker', 2)), []);
        assert.deepEqual(buffsForCharacter('barbarian', record('Barbare', 'Voie du Berserker', 3)), ['rage', 'frenzy']);
        assert.deepEqual(subclassBuffs(record('Rôdeur', 'Chasseur', 3)), ['colossusSlayer']);
        assert.deepEqual(subclassBuffs(record('Guerrier', 'Champion', 3)), []);
        assert.deepEqual(subclassBuffs(null), []);
    });

    test('Frénésie : comptée seulement avec la Rage allumée, sur une attaque de Force', () => {
        const base = { str_score: '16', dex_score: '12' };
        const both = record('Barbare', 'Voie du Berserker', 9, { ...base, combat_buffs: { rage: true, frenzy: true } });
        assert.match(damage(both, SWORD), /\+3d6 \(Frénésie 1\/tour\)/);
        assert.match(damage(both, UNARMED), /Frénésie/);
        const noRage = record('Barbare', 'Voie du Berserker', 9, { ...base, combat_buffs: { frenzy: true } });
        assert.doesNotMatch(damage(noRage, SWORD), /Frénésie/);
        assert.doesNotMatch(damage(both, BOW), /Frénésie/);
        // Une autre sous-classe : le bouton resté allumé ne compte pas
        const zealot = record('Barbare', 'Voie du Zélote', 9, { ...base, combat_buffs: { rage: true, frenzy: true } });
        assert.doesNotMatch(damage(zealot, SWORD), /Frénésie/);
    });

    test('Frappe effroyable, Frappes effroyables, Goût du sang : avec une arme seulement', () => {
        const gloom = record('Rôdeur', "Traqueur d'Ombre", 11, { combat_buffs: { dreadfulStrike: true } });
        assert.match(damage(gloom, BOW), /\+2d8 \(Psychique 1\/tour\)/);
        assert.doesNotMatch(damage(gloom, UNARMED), /Psychique/);
        const fey = record('Rôdeur', 'Errant Féerique', 3, { combat_buffs: { feyStrikes: true } });
        assert.match(damage(fey, SWORD), /\+1d4 \(Psychique\)/);
        const hunter = record('Rôdeur', 'Chasseur', 3, { combat_buffs: { colossusSlayer: true } });
        assert.match(damage(hunter, SWORD), /\+1d8 \(Goût du sang 1\/tour\)/);
    });

    test('Manœuvre et Frappe psionique', () => {
        const master = record('Guerrier', 'Maître de Guerre', 10, { combat_buffs: { superiority: true } });
        assert.match(damage(master, SWORD), /\+1d10 \(Supériorité\)/);
        const psi = record('Guerrier', 'Guerrier Psy', 5, { int_score: '14', combat_buffs: { psionicStrike: true } });
        assert.match(damage(psi, SWORD), /\+1d8\+2 \(Force 1\/tour\)/);
        const psiZero = record('Guerrier', 'Guerrier Psy', 3, { combat_buffs: { psionicStrike: true } });
        assert.match(damage(psiZero, SWORD), /\+1d6 \(Force 1\/tour\)/);
    });

    test('rien sans bouton allumé', () => {
        assert.deepEqual(subclassBuffDamage(SWORD, hero('Rôdeur', 'Chasseur', 3), {}, 'FOR'), []);
    });
});

describe('Cases des ressources', () => {
    test('chaque case porte sur une capacité de la bonne sous-classe', () => {
        for (const [subclass, list] of Object.entries(SUBCLASS_COUNTERS)) {
            for (const def of list) assert.ok(SUBCLASS_FEATURES[subclass].some(f => f.id === def.feature), `${subclass}.${def.feature}`);
        }
    });

    test('Maître de guerre : 4 dés, 5 au niveau 7, rendus au repos court', () => {
        const r = record('Guerrier', 'Maître de Guerre', 7, { subclass_uses: { 'battle_master.superiorite_martiale_des_de_superiorite': 3 } });
        const dice = subclassCounters(r, deriveCharacter(r)).find(c => c.feature === 'superiorite_martiale_des_de_superiorite');
        assert.deepEqual([dice.max, dice.used, dice.reset], [5, 3, 'short']);
        const { patch } = restSubclassUses(r, deriveCharacter(r), 'short');
        assert.equal(patch.subclass_uses['battle_master.superiorite_martiale_des_de_superiorite'], 0);
    });

    test('dés psioniques : un seul rendu au repos court, tous au repos long', () => {
        const key = 'psi_warrior.pouvoir_psionique_des_d_energie_psionique';
        const r = record('Guerrier', 'Guerrier Psy', 5, { subclass_uses: { [key]: 4 } });
        const d = deriveCharacter(r);
        assert.equal(subclassCounters(r, d).find(c => c.key === key).max, 6);
        const short = restSubclassUses(r, d, 'short');
        assert.equal(short.patch.subclass_uses[key], 3);
        assert.equal(short.restored.find(x => x.featId === 'pouvoir_psionique_des_d_energie_psionique').count, 1);
        assert.equal(restSubclassUses(r, d, 'long').patch.subclass_uses[key], 0);
        // La fiche reçue n'est pas modifiée
        assert.equal(r.subclass_uses[key], 4);
    });

    test('usages selon la Sagesse (minimum 1) ; aucune case quand l\'Intelligence n\'est pas positive (Philosophe)', () => {
        const gloom = (wis) => subclassCounters(record('Rôdeur', "Traqueur d'Ombre", 3, { wis_score: wis }), hero('Rôdeur', "Traqueur d'Ombre", 3, { wis_score: wis }));
        assert.equal(gloom('16')[0].max, 3);
        assert.equal(gloom('8')[0].max, 1);
        const philo = (int) => {
            const r = record('Magicien', 'Philosophe de l\'Académie', 14, { int_score: int });
            return subclassCounters(r, deriveCharacter(r)).map(c => c.feature);
        };
        assert.ok(philo('14').includes('paradoxe_magique'));
        assert.ok(!philo('10').includes('paradoxe_magique'));
        // Les écoles sont au choix (lot 7) : pas de cases tant que le choix n'est pas enregistré
        assert.ok(!philo('14').includes('epicurisme'));
    });

    test('Éclat protecteur : repos long, puis aussi repos court au niveau 6', () => {
        const key = 'light_domain.flash_protecteur';
        const at = (level) => {
            const r = record('Clerc', 'Domaine de la Lumière', level, { wis_score: '16', subclass_uses: { [key]: 2 } });
            return restSubclassUses(r, deriveCharacter(r), 'short').patch.subclass_uses?.[key];
        };
        assert.equal(at(5), undefined);
        assert.equal(at(6), 0);
        const r6 = record('Clerc', 'Domaine de la Lumière', 6, { wis_score: '16' });
        assert.equal(subclassCounters(r6, deriveCharacter(r6)).find(c => c.key === key).reset, 'short');
    });

    test('dés psioniques au repos court : la valeur enregistrée est d\'abord ramenée au maximum', () => {
        const key = 'psi_warrior.pouvoir_psionique_des_d_energie_psionique';
        const r = record('Guerrier', 'Guerrier Psy', 4, { subclass_uses: { [key]: 6 } });
        const { patch, restored } = restSubclassUses(r, deriveCharacter(r), 'short');
        assert.equal(patch.subclass_uses[key], 3);
        assert.deepEqual([restored[0].count, restored[0].remaining], [1, 3]);
    });

    test('ressources oubliées au premier passage : Maître télékinétique, Carte stellaire, Plénitude physique…', () => {
        const features = (cls, sub, level, extra) => {
            const r = record(cls, sub, level, extra);
            return subclassCounters(r, deriveCharacter(r)).map(c => c.feature);
        };
        assert.ok(features('Guerrier', 'Guerrier Psy', 18).includes('maitre_telekinesiste'));
        assert.ok(features('Druide', 'Cercle des Étoiles', 3, { wis_score: '16' }).includes('carte_stellaire'));
        assert.ok(features('Moine', 'Guerrier de la Main Ouverte', 6).includes('plenitude_physique'));
        const stars = hero('Druide', 'Cercle des Étoiles', 3, { wis_score: '16' });
        const map = subclassFeatures(stars).reached.find(f => f.id === 'carte_stellaire');
        assert.match(map.automation.text, /Sorts de sous-classe.*Rayon traçant sans emplacement : 3 cases dans l'onglet Combat/);
    });

    test('bouton reconnu avec la sous-classe de deriveCharacter (apostrophe typographique)', () => {
        const r = record('Rôdeur', 'Traqueur d’Ombre', 3);
        const d = deriveCharacter(r);
        assert.equal(d.subclass, 'gloom_stalker');
        assert.deepEqual(subclassBuffs(r, d), ['dreadfulStrike']);
    });

    test('Lumière guérisseuse : réserve de 1 + niveau d\'Occultiste', () => {
        const r = record('Sorcier', 'Patron Céleste', 5);
        const pool = subclassCounters(r, deriveCharacter(r)).find(c => c.feature === 'lumiere_guerisseuse');
        assert.equal(pool.max, 6);
    });
});

describe('Résistances près de la CA', () => {
    test('chaque Résistance porte sur une capacité qui existe', () => {
        for (const [subclass, level, featId] of SUBCLASS_DEFENSES) {
            const feature = SUBCLASS_FEATURES[subclass]?.find(f => f.id === featId);
            assert.ok(feature, `${subclass}.${featId}`);
            assert.equal(feature.level, level, `${subclass}.${featId} : niveau`);
        }
    });

    test('Voie du Cœur sauvage : Ours grisé tant que la Rage est éteinte', () => {
        const off = subclassDefenseNotes(hero('Barbare', 'Voie du Cœur Sauvage', 3), {}).armorClass[0];
        assert.deepEqual([off.featId, off.mention, off.inactive], ['rage_sauvage', 'Ours (Rage)', true]);
        const on = subclassDefenseNotes(hero('Barbare', 'Voie du Cœur Sauvage', 3), { combat_buffs: { rage: true } }).armorClass[0];
        assert.equal(on.inactive, undefined);
    });

    test('Domaine de la guerre 17, Âme radiante 6 : dans la zone CA des effets', () => {
        const war = record('Clerc', 'Domaine de la Guerre', 17);
        assert.ok(featEffects(war, deriveCharacter(war)).armorClass.some(n => n.mention === 'Résistance C/P/T'));
        assert.deepEqual(subclassDefenseNotes(hero('Clerc', 'Domaine de la Guerre', 16)), {});
        const celestial = record('Sorcier', 'Patron Céleste', 6);
        assert.ok(featEffects(celestial, deriveCharacter(celestial)).armorClass.some(n => n.featId === 'ame_radieuse'));
    });
});

describe('Rappels sous les armes et textes', () => {
    test("Maître de guerre : dé et DD sous chaque arme et l'attaque à mains nues", () => {
        const d = hero('Guerrier', 'Maître de Guerre', 3, { str_score: '16' });
        assert.match(subclassCombatWeaponNotes(SWORD, d)[0].text, /d8 ; DD des manœuvres : 13/);
        assert.equal(subclassCombatWeaponNotes(UNARMED, d)[0].featId, 'dd_des_man_uvres');
        const r = record('Guerrier', 'Maître de Guerre', 3, { str_score: '16', combat_buffs: { superiority: true } });
        assert.match(damage(r, UNARMED), /\+1d8 \(Supériorité\)/);
    });

    test('Rossée de racines : armes Lourdes ou Polyvalentes de corps à corps, niveau 10', () => {
        const d = hero('Barbare', "Voie de l'Arbre-Monde", 10);
        assert.equal(subclassCombatWeaponNotes(SWORD, d)[0].featId, 'racines_percutantes');
        assert.deepEqual(subclassCombatWeaponNotes(BOW, d), []);
    });

    test('Frappe effroyable : rappel des cases et du bouton dans le bloc « Sous-classe »', () => {
        const d = hero('Rôdeur', "Traqueur d'Ombre", 3, { wis_score: '14' });
        const f = subclassFeatures(d).reached.find(x => x.id === 'embusqueur_redoutable_frappe_effroyable');
        assert.match(f.automation.text, /2d6.*2 cases/);
        assert.equal(automationKind(f), 'calc');
    });

    test('capacité à cases sans texte écrit : texte généré, « En partie »', () => {
        const d = hero('Ensorceleur', 'Sorcellerie Mécanique', 3, { cha_score: '16' });
        const f = subclassFeatures(d).reached.find(x => x.id === 'retablissement_de_l_equilibre');
        assert.match(f.automation.text, /3 cases dans l'onglet Combat, rendues au repos long/);
        assert.equal(automationKind(f), 'partial');
    });

    test('Maître de guerre : le rappel apparaît dans les notes d\'arme de featEffects', () => {
        const r = record('Guerrier', 'Maître de Guerre', 3, { dynamic_weapons: [SWORD] });
        assert.ok(weaponFeatNotes(SWORD, r, deriveCharacter(r)).some(n => n.featId === 'dd_des_man_uvres'));
    });
});

describe('Relecture finale (lots 0 à 6)', () => {
    const text = (d, id) => subclassFeatures(d).reached.find(f => f.id === id).automation.text;

    test('Maître de la lance : lance, trident, javeline, mais pas la Lance d\u2019arçon', () => {
        const d = hero('Guerrier', "L'Hoplite", 7);
        assert.equal(subclassCombatWeaponNotes({ name: 'Lance', prop: 'Lancer, Polyvalente' }, d)[0].featId, 'maitre_de_la_lance');
        assert.deepEqual(subclassCombatWeaponNotes({ name: "Lance d'arçon", prop: 'Lourde, Allonge' }, d), []);
        assert.deepEqual(subclassCombatWeaponNotes({ name: 'Lance d\u2019arçon', prop: 'Lourde, Allonge' }, d), []);
    });

    test('capacité dépassée : le texte renvoie à celle qui la remplace', () => {
        assert.match(text(hero('Guerrier', 'Champion', 14), 'critique_ameliore'), /19 ou 20/);
        assert.match(text(hero('Guerrier', 'Champion', 15), 'critique_ameliore'), /Remplacé par Critique supérieur/);
        assert.match(text(hero('Guerrier', 'Maître de Guerre', 18), 'superiorite_martiale_amelioree'), /d12/);
    });

    test('Cri de guerre : cases et repère de Résistance dans le même texte', () => {
        const d = hero('Rôdeur', 'Conclave des Amazones', 3, { wis_score: '16' });
        assert.match(text(d, 'cri_de_guerre'), /3 cases dans l'onglet Combat.*repère « Résistance C\/P\/T \(Cri\) »/);
    });

    test('Voie du Cœur sauvage : sorts lancés seulement en rituel', () => {
        assert.match(text(hero('Barbare', 'Voie du Cœur Sauvage', 3), 'langage_des_betes'), /seulement en rituel/);
    });
});
