// =============================================================================
// Lot 8 : faveurs épiques (PHB 2024 « Epic Boon Feats », p. 210-211, prérequis niveau 19)
// =============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { featEffects, weaponFeatNotes, AUTOMATED_FEATS, irresistibleBoost } from '../js/rules/feat-effects.js';
import { FEAT_CHOICE_RULES, featChoiceGrants, epicAsiAbilities, ENERGY_TYPES } from '../js/rules/feat-choices.js';
import { featCounters, restFeatUses } from '../js/rules/feat-uses.js';
import { deriveCharacter } from '../js/rules/character.js';
import { rowFromRulebookWeapon } from '../js/rules/weapons.js';
import { FEATS_DATA } from '../js/data/feats.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { SKILLS } from '../js/data/constants.js';
import { EMPTY_WEAPON, createDefaultCharacter } from '../js/state/schema.js';

const weapon = (name) => rowFromRulebookWeapon({ ...EMPTY_WEAPON }, DD_RULES.weapons.find(w => w.name === name));
const EPIC = Object.keys(FEATS_DATA).filter(id => FEATS_DATA[id].type === 'Épique');

// Guerrier niveau 19 : For 20, Dex 14, Con 16 (+3), bonus de maîtrise +6
const hero = (extra = {}) => ({
    ...createDefaultCharacter(),
    char_class: 'Guerrier', char_level: '19', str_score: '20', dex_score: '14', con_score: '16',
    hp_max: '180', hp_current: '180', speed: '9 m',
    ...extra
});
const boon = (id, choice = {}, extra = {}) => hero({ feat_19: id, feat_choices: { 19: { [id]: choice } }, ...extra });
const slotTexts = (character) => (featEffects(character)['featSlot:19'] ?? []).map(n => n.text);

describe('Faveurs épiques : le +1 (jusqu\'à 30)', () => {
    test('les 12 faveurs sont automatisées et ont un menu « Caractéristique +1 »', () => {
        assert.equal(EPIC.length, 12);
        for (const id of EPIC) {
            assert.ok(AUTOMATED_FEATS.includes(id), id);
            assert.equal(FEAT_CHOICE_RULES[id].fields[0].key, 'ability', id);
        }
    });

    test('caractéristiques proposées selon le champ « asi »', () => {
        assert.deepEqual(epicAsiAbilities('+1 au choix (max 30)'), ['str', 'dex', 'con', 'int', 'wis', 'cha']);
        assert.deepEqual(epicAsiAbilities('+1 For ou Dex (max 30)'), ['str', 'dex']);
        assert.deepEqual(epicAsiAbilities('+1 Int ou Sag ou Cha (max 30)'), ['int', 'wis', 'cha']);
    });

    test('au-delà de 20 permis avec une faveur, jamais au-delà de 30', () => {
        const at21 = boon('faveur_de_vigueur', { ability: 'str' }, { str_score: '21' });
        assert.ok(!slotTexts(at21).some(t => /dépasse/.test(t)));
        const at31 = boon('faveur_de_vigueur', { ability: 'str' }, { str_score: '31' });
        assert.ok(featEffects(at31)['scores.str'].some(n => n.check && /jamais 30/.test(n.text)));
    });

    test('prérequis niveau 19 : alerte si la faveur est prise plus tôt', () => {
        const early = hero({ char_level: '8', feat_8: 'faveur_de_vitesse' });
        assert.ok(featEffects(early)['featSlot:8'].some(n => n.check && /niveau 19/.test(n.text)));
        assert.ok(!slotTexts(boon('faveur_de_vitesse')).some(t => /Prérequis/.test(t)));
        // Personnage au niveau 19, faveur notée dans l'emplacement 16 : prérequis toujours pas rempli
        const lowSlot = hero({ feat_16: 'faveur_de_vitesse' });
        assert.ok(featEffects(lowSlot)['featSlot:16'].some(n => n.check && /niveau 19/.test(n.text)));
    });
});

describe('Faveurs épiques : effets', () => {
    test('Attaque irrésistible : valeur de la caractéristique choisie, rappel sous chaque arme', () => {
        const c = boon('faveur_d_attaque_irresistible', { ability: 'str' });
        assert.deepEqual(irresistibleBoost(c, deriveCharacter(c)), { score: 20, name: 'Force' });
        const [note] = weaponFeatNotes(weapon('Épée longue'), c).filter(n => n.featId === 'faveur_d_attaque_irresistible');
        assert.equal(note.value, 20);
        assert.match(note.text, /20 au d20 : \+20 dégâts/);
        assert.match(slotTexts(c).join(' '), /ignorent toujours la Résistance/);
        // Caractéristique pas encore choisie : pas de chiffre inventé
        const none = boon('faveur_d_attaque_irresistible');
        assert.equal(weaponFeatNotes(weapon('Épée longue'), none).find(n => n.featId === 'faveur_d_attaque_irresistible').value, undefined);
    });

    test('Compétence : compétences à cocher, puis toutes cochées ; Expertise au choix', () => {
        const some = slotTexts(boon('faveur_de_competence', { ability: 'wis', expertise: 'stealth' }));
        assert.ok(some.some(t => /restent à cocher/.test(t)));
        // Pas l'alerte d'Expert : la faveur donne la maîtrise de Discrétion
        assert.ok(!some.some(t => /d'Expert |n'est pas maîtrisée/.test(t)));
        const all = Object.fromEntries(SKILLS.map(s => [`skill_prof_${s.id}`, true]));
        assert.ok(slotTexts(boon('faveur_de_competence', { ability: 'wis' }, all)).some(t => /toutes cochées/.test(t)));
        assert.ok(featChoiceGrants(boon('faveur_de_competence', { ability: 'wis', expertise: 'stealth' }))
            .find(g => g.featId === 'faveur_de_competence').skills.some(s => s.skill === 'stealth' && s.kind === 'expertise'));
    });

    test('Résistance aux énergies : types choisis, doublon signalé, DD de la Redirection', () => {
        assert.equal(ENERGY_TYPES.length, 9);
        const texts = slotTexts(boon('faveur_de_resistance_aux_energies', { ability: 'con', energy1: 'fire', energy2: 'cold' }));
        assert.ok(texts.some(t => /Résistance : feu et froid/.test(t)));
        assert.ok(texts.some(t => /DD 17.*2d12 \+3/.test(t))); // 8 + 3 + 6
        const twice = featEffects(boon('faveur_de_resistance_aux_energies', { energy1: 'fire', energy2: 'fire' }))['featSlot:19'];
        assert.ok(twice.some(n => n.check && /Deux types/.test(n.text)));
    });

    test('Vigueur : « dont +40 PV », PV max saisis inchangés', () => {
        const c = boon('faveur_de_vigueur', { ability: 'con' });
        const [hp] = featEffects(c).hpMax;
        assert.equal(hp.value, 40);
        assert.ok(hp.manual);
        assert.equal(c.hp_max, '180');
    });

    test('Vitesse : « dont +9 m », Vitesse saisie inchangée', () => {
        const c = boon('faveur_de_vitesse');
        const [speed] = featEffects(c).speed;
        assert.equal(speed.value, 9);
        assert.equal(c.speed, '9 m');
    });

    test('Récupération : dix d10 et Dernier rempart rendus au repos long ; Dernier rempart = moitié des PV max', () => {
        const c = boon('faveur_de_recuperation', {}, { feat_uses: { faveur_de_recuperation: 4, faveur_de_recuperation_rempart: 1 } });
        const [dice, lastStand] = featCounters(c, deriveCharacter(c));
        assert.deepEqual([dice.key, dice.max, dice.used], ['faveur_de_recuperation', 10, 4]);
        assert.deepEqual([lastStand.key, lastStand.featId, lastStand.max, lastStand.used, lastStand.label],
            ['faveur_de_recuperation_rempart', 'faveur_de_recuperation', 1, 1, 'Dernier rempart']);
        assert.equal(restFeatUses(c, deriveCharacter(c), 'short').restored.length, 0);
        const long = restFeatUses(c, deriveCharacter(c), 'long');
        assert.deepEqual(long.restored.map(r => [r.label, r.count]), [['Dés de vitalité (d10)', 4], ['Dernier rempart', 1]]);
        assert.deepEqual(long.patch.feat_uses, { faveur_de_recuperation: 0, faveur_de_recuperation_rempart: 0 });
        assert.ok(slotTexts(c).some(t => /regagnez 90 PV/.test(t)));
    });

    test('Destin : une case, rendue au repos court', () => {
        const c = boon('faveur_du_destin', {}, { feat_uses: { faveur_du_destin: 1 } });
        assert.equal(featCounters(c, deriveCharacter(c))[0].max, 1);
        assert.equal(restFeatUses(c, deriveCharacter(c), 'short').restored.length, 1);
    });

    test("Mémoire magique : rappel ; prérequis Sorts pour un Guerrier sans sous-classe de sorts et pour l'Occultiste", () => {
        const wizard = boon('faveur_de_memoire_magique', { ability: 'int' }, { char_class: 'Magicien' });
        assert.ok(slotTexts(wizard).some(t => /lancez 1d4/.test(t)));
        const warlock = boon('faveur_de_memoire_magique', { ability: 'cha' }, { char_class: 'Sorcier' });
        assert.ok(featEffects(warlock)['featSlot:19'].some(n => n.check && /capacité Sorts/.test(n.text)));
        assert.ok(!slotTexts(wizard).some(t => /Prérequis/.test(t)));
        assert.ok(featEffects(boon('faveur_de_memoire_magique'))['featSlot:19'].some(n => n.check && /capacité Sorts/.test(n.text)));
        const knight = boon('faveur_de_memoire_magique', {}, { char_subclass: 'Chevalier occulte' });
        assert.ok(!slotTexts(knight).some(t => /Prérequis/.test(t)));
    });

    test('chaque faveur a au moins une note dans son encadré', () => {
        for (const id of EPIC) assert.ok(slotTexts(boon(id)).length > 0, id);
    });
});
