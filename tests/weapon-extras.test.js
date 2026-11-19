/**
 * TESTS — DÉGÂTS EN PLUS D'UNE ARME (js/rules/weapon-extras.js, 4.43.0)
 *
 * Lignes écrites par le joueur dans « Configuration de l'arme » : « Toujours » ou « À allumer ».
 * Enregistrées dans weaponConfig (propriété facultative extraDamage), état allumé compris.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    EXTRA_DAMAGE_KEY, EXTRA_DAMAGE_MAX, EXTRA_REASON_MAX,
    normalizeExtraDamage, validateExtraLine, validateExtraDamageList, readExtraDamage,
    activeExtraDamage, extraDamageText, extraDamageLabel, offBookDamage,
    toggleExtraDamage, clearExtraDamageOn
} from '../js/rules/weapon-extras.js';
import { buildWeaponConfig, readWeaponConfig, rowFromRulebookWeapon, matchesWeaponFilter, isBlankWeapon, removeWeapon, restoreWeapon } from '../js/rules/weapons.js';
import { computeWeapon, deriveCharacter } from '../js/rules/character.js';
import { longRestPatch, shortRestPatch } from '../js/rules/rest.js';
import { migrateCharacter } from '../js/state/migrate.js';
import { createDefaultCharacter, EMPTY_WEAPON } from '../js/state/schema.js';
import { V4_ONLY_KEYS } from '../js/cloud/sync.js';
import { DD_RULES } from '../js/data/dd-rules.js';

const ref = (name) => DD_RULES.weapons.find(w => w.name === name);
const row = (name, config) => ({
    ...rowFromRulebookWeapon({ ...EMPTY_WEAPON }, ref(name)),
    weaponConfig: config ? JSON.stringify(config) : ''
});
const hero = (extra = {}) => ({ ...createDefaultCharacter(), char_name: 'Test', char_class: 'Guerrier', char_level: '5', str_score: '16', dex_score: '14', hp_max: '40', hp_current: '40', ...extra });
const BASE = { statOverride: '', magicBonus: 0, dmgDieOverride: '', dmgTypeOverride: '' };
const DRAGONS = { dmg: '2d6', reason: 'contre les dragons', mode: 'always' };
const UNDEAD = { dmg: '1d6', reason: 'radiants contre les morts-vivants', mode: 'toggle' };
const damage = (weapon, character = hero(), buffs = {}) => computeWeapon(weapon, deriveCharacter(character), buffs).damage;

describe('Dégâts en plus : saisie des dégâts', () => {
    test('dés, nombre, somme ; « + » devant, espaces et majuscules acceptés', () => {
        assert.deepEqual(normalizeExtraDamage('2d6'), { ok: true, value: '2d6' });
        assert.deepEqual(normalizeExtraDamage('+2D6'), { ok: true, value: '2d6' });
        assert.deepEqual(normalizeExtraDamage(' 1d6 + 2 '), { ok: true, value: '1d6+2' });
        assert.deepEqual(normalizeExtraDamage('2'), { ok: true, value: '2' });
        assert.deepEqual(normalizeExtraDamage(3), { ok: true, value: '3' });
        assert.deepEqual(normalizeExtraDamage('d8'), { ok: true, value: '1d8' });
        assert.deepEqual(normalizeExtraDamage('1d4+1d6+1'), { ok: true, value: '1d4+1d6+1' });
    });

    test('illisible : refusé', () => {
        for (const bad of ['', '   ', '+', 'deux', '1d7', '0', '0d6', '21d6', '2d6 feu', '1d6-1', '1d6++2', '1d6+', '100',
            '1+1+1+1', '2d6<b>', null, undefined, {}, ['2d6'], true]) {
            assert.equal(normalizeExtraDamage(bad).ok, false, JSON.stringify(bad));
        }
    });
});

describe('Dégâts en plus : validation d\'une ligne', () => {
    test('ligne juste : dégâts normalisés, raison resserrée, « Toujours » par défaut', () => {
        assert.deepEqual(validateExtraLine({ dmg: '+2D6', reason: '  contre   les dragons ', mode: 'always' }),
            { ok: true, value: DRAGONS });
        assert.deepEqual(validateExtraLine({ dmg: '2', reason: 'feu' }).value, { dmg: '2', reason: 'feu', mode: 'always' });
    });

    test('« on » : écrit seulement pour une ligne « À allumer » allumée', () => {
        assert.deepEqual(validateExtraLine({ ...UNDEAD, on: true }).value, { ...UNDEAD, on: true });
        assert.equal('on' in validateExtraLine({ ...UNDEAD, on: false }).value, false);
        assert.equal('on' in validateExtraLine({ ...UNDEAD, on: 'oui' }).value, false);
        assert.equal('on' in validateExtraLine({ ...DRAGONS, on: true }).value, false, '« Toujours » n\'a pas d\'état');
    });

    test('dégâts illisibles, raison vide ou trop longue, mode inconnu : refusés avec un message', () => {
        assert.match(validateExtraLine({ dmg: 'beaucoup', reason: 'x' }).errors.dmg, /2d6, 1d6\+2 ou 2/);
        assert.match(validateExtraLine({ dmg: '2d6', reason: '   ' }).errors.reason, /raison/);
        assert.match(validateExtraLine({ dmg: '2d6' }).errors.reason, /raison/);
        assert.equal(validateExtraLine({ dmg: '2d6', reason: 'x'.repeat(EXTRA_REASON_MAX) }).ok, true);
        assert.match(validateExtraLine({ dmg: '2d6', reason: 'x'.repeat(EXTRA_REASON_MAX + 1) }).errors.reason, /trop longue/);
        assert.ok(validateExtraLine({ dmg: '2d6', reason: 'x', mode: 'parfois' }).errors.mode);
        assert.equal(validateExtraLine(null).ok, false);
        assert.equal(validateExtraLine({ dmg: '2d6', reason: 42 }).ok, false, 'raison : du texte seulement');
    });

    test('la raison reste du texte : balises gardées telles quelles, jamais interprétées', () => {
        const line = validateExtraLine({ dmg: '1d4', reason: '<img src=x onerror=alert(1)>', mode: 'always' }).value;
        assert.equal(line.reason, '<img src=x onerror=alert(1)>');
        assert.equal(extraDamageText({ die: line.dmg, type: line.reason }), ' +1d4 (<img src=x onerror=alert(1)>)');
        // Retour à la ligne collé : une seule ligne
        assert.equal(validateExtraLine({ dmg: '1', reason: 'contre\nles\tdragons' }).value.reason, 'contre les dragons');
    });

    test('liste : 4 lignes au plus, messages numérotés', () => {
        assert.deepEqual(validateExtraDamageList([]), { ok: true, value: [] });
        assert.deepEqual(validateExtraDamageList([DRAGONS, { ...UNDEAD, on: true }]).value, [DRAGONS, { ...UNDEAD, on: true }]);
        assert.equal(validateExtraDamageList(Array(EXTRA_DAMAGE_MAX).fill(DRAGONS)).ok, true);
        assert.match(validateExtraDamageList(Array(EXTRA_DAMAGE_MAX + 1).fill(DRAGONS)).message, /4 dégâts en plus au maximum/);
        const bad = validateExtraDamageList([DRAGONS, { dmg: '', reason: '' }]);
        assert.equal(bad.ok, false);
        assert.match(bad.message, /Dégât en plus n° 2 : dégâts illisibles/);
        assert.match(bad.message, /Dégât en plus n° 2 : écrivez la raison/);
        assert.deepEqual(bad.invalid, [{ index: 1, field: 'dmg' }, { index: 1, field: 'reason' }]);
    });
});

describe('Dégâts en plus : enregistrement dans weaponConfig', () => {
    test('arme sans dégât en plus : weaponConfig EXACTEMENT comme avant (pas de propriété vide)', () => {
        const before = '{"statOverride":"","magicBonus":0,"dmgDieOverride":"","dmgTypeOverride":""}';
        assert.equal(buildWeaponConfig(BASE).value, before);
        assert.equal(buildWeaponConfig({ ...BASE, extraDamage: [] }).value, before);
        assert.equal(buildWeaponConfig({ ...BASE, proficiency: 'no', extraDamage: [] }).value,
            '{"statOverride":"","magicBonus":0,"dmgDieOverride":"","dmgTypeOverride":"","proficiency":"no"}');
        // Ancienne configuration avec une clé inconnue : gardée, toujours sans propriété extraDamage
        assert.equal(buildWeaponConfig({ ...BASE, extraDamage: [] }, '{"legacy":1,"magicBonus":2}').value,
            '{"legacy":1,"magicBonus":0,"statOverride":"","dmgDieOverride":"","dmgTypeOverride":""}');
    });

    test('lignes validées, écrites en dernier ; liste vidée : la propriété disparaît', () => {
        const saved = buildWeaponConfig({ ...BASE, magicBonus: 1, extraDamage: [{ dmg: '+2D6', reason: ' contre les dragons ', mode: 'always' }, UNDEAD] });
        assert.equal(saved.ok, true);
        assert.equal(saved.value, '{"statOverride":"","magicBonus":1,"dmgDieOverride":"","dmgTypeOverride":"",'
            + '"extraDamage":[{"dmg":"2d6","reason":"contre les dragons","mode":"always"},'
            + '{"dmg":"1d6","reason":"radiants contre les morts-vivants","mode":"toggle"}]}');
        const cleared = buildWeaponConfig({ ...BASE, magicBonus: 1, extraDamage: [] }, saved.value);
        assert.equal(EXTRA_DAMAGE_KEY in JSON.parse(cleared.value), false);
        assert.equal(JSON.parse(cleared.value).magicBonus, 1);
    });

    test('formulaire sans liste (extraDamage absent) : la liste enregistrée n\'est pas touchée', () => {
        const previous = JSON.stringify({ ...BASE, extraDamage: [DRAGONS, { ...UNDEAD, on: true }] });
        const next = JSON.parse(buildWeaponConfig({ ...BASE, magicBonus: 2 }, previous).value);
        assert.deepEqual(next.extraDamage, [DRAGONS, { ...UNDEAD, on: true }]);
        assert.equal(next.magicBonus, 2);
    });

    test('saisie fausse : rien n\'est enregistré, message clair, champs fautifs signalés', () => {
        const result = buildWeaponConfig({ ...BASE, extraDamage: [{ dmg: 'gros', reason: 'contre les dragons', mode: 'always' }] });
        assert.equal(result.ok, false);
        assert.equal('value' in result, false);
        assert.match(result.errors.extraDamage, /Dégât en plus n° 1 : dégâts illisibles/);
        assert.deepEqual(result.invalidExtras, [{ index: 0, field: 'dmg' }]);
        assert.equal(buildWeaponConfig({ ...BASE, extraDamage: [{ dmg: '2d6', reason: '', mode: 'always' }] }).ok, false);
        assert.equal(buildWeaponConfig({ ...BASE, extraDamage: [{ dmg: '2d6', reason: 'x'.repeat(41), mode: 'toggle' }] }).ok, false);
        assert.equal(buildWeaponConfig({ ...BASE, extraDamage: Array(5).fill(DRAGONS) }).ok, false);
    });

    test('les autres réglages lus par la fenêtre ne changent pas (readWeaponConfig)', () => {
        const config = JSON.stringify({ statOverride: 'dex', magicBonus: 2, dmgDieOverride: '1d10', dmgTypeOverride: 'FEU', proficiency: 'yes', extraDamage: [DRAGONS] });
        assert.deepEqual(readWeaponConfig(config),
            { statOverride: 'dex', magicBonus: 2, dmgDieOverride: '1d10', dmgTypeOverride: 'FEU', proficiency: 'yes' });
    });

    test('aucune nouvelle clé au premier niveau de la fiche ni dans la ligne d\'arme', () => {
        assert.equal(Object.keys(createDefaultCharacter()).some(key => /extra/i.test(key)), false);
        assert.equal(V4_ONLY_KEYS.some(key => /extra/i.test(key)), false);
        assert.deepEqual(Object.keys(EMPTY_WEAPON), ['name', 'prop', 'prof', 'ammo', 'note', 'category', 'atkKey', 'baseDmg', 'weaponConfig']);
    });

    test('migration : la propriété traverse l\'ouverture d\'une fiche sans être modifiée (idempotent)', () => {
        const config = JSON.stringify({ ...BASE, extraDamage: [DRAGONS, { ...UNDEAD, on: true }] });
        const sheet = hero({ dynamic_weapons: [row('Épée longue'), { ...row('Dague'), weaponConfig: config }] });
        const once = migrateCharacter(sheet).character;
        assert.equal(once.dynamic_weapons[1].weaponConfig, config);
        assert.equal(once.dynamic_weapons[0].weaponConfig, '');
        assert.deepEqual(migrateCharacter(once).character, once);
        // Configuration enregistrée sous forme d'objet (import) : remise en texte, contenu gardé
        const asObject = migrateCharacter({ ...sheet, dynamic_weapons: [{ ...row('Dague'), weaponConfig: JSON.parse(config) }] }).character;
        assert.deepEqual(readExtraDamage(asObject.dynamic_weapons[0].weaponConfig).map(l => l.reason),
            ['contre les dragons', 'radiants contre les morts-vivants']);
    });
});

describe('Dégâts en plus : lecture tolérante', () => {
    test('rien, texte abîmé, autre format : liste vide, sans erreur', () => {
        for (const raw of ['', null, undefined, '{oops', '[]', '"texte"', '42', '{"extraDamage":"2d6"}', '{"extraDamage":{"0":{}}}',
            '{"extraDamage":null}', { extraDamage: 7 }, [], '{"statOverride":"dex"}']) {
            assert.deepEqual(readExtraDamage(raw), [], JSON.stringify(raw));
            assert.deepEqual(activeExtraDamage(raw), []);
        }
    });

    test('lignes illisibles ignorées, les bonnes gardées avec leur place d\'origine', () => {
        const raw = JSON.stringify({ magicBonus: 1, extraDamage: [null, 'x', { dmg: '??', reason: 'a' }, DRAGONS, ['2d6'], { ...UNDEAD, on: true }, { dmg: '1', reason: '' }] });
        assert.deepEqual(readExtraDamage(raw), [
            { index: 3, ...DRAGONS, on: false },
            { index: 5, ...UNDEAD, on: true }
        ]);
        assert.equal(readWeaponConfig(raw).magicBonus, 1, 'les autres réglages restent lus');
    });

    test('plus de 4 lignes (fichier retouché) : les 4 premières lisibles', () => {
        const raw = { extraDamage: Array.from({ length: 7 }, (_, i) => ({ dmg: String(i + 1), reason: `r${i}`, mode: 'always' })) };
        assert.deepEqual(readExtraDamage(raw).map(l => l.dmg), ['1', '2', '3', '4']);
    });

    test('la fiche ne plante jamais : computeWeapon avec une configuration abîmée', () => {
        for (const config of ['{"extraDamage":[1,2,{"dmg":{}}]}', '{"magicBonus":1,"extraDamage":"<script>"}', '{oops', '[1,2]']) {
            const weapon = { ...row('Épée longue'), weaponConfig: config };
            assert.doesNotThrow(() => damage(weapon), config);
        }
        assert.equal(damage({ ...row('Épée longue'), weaponConfig: '{"magicBonus":1,"extraDamage":[null,{"dmg":"x"}]}' }).text, '1d8 +4 TRAN');
    });
});

describe('Dégâts en plus : ajout aux dégâts (computeWeapon)', () => {
    test('arme sans dégât en plus : pas un caractère de différence', () => {
        const d = deriveCharacter(hero());
        for (const name of ['Épée longue', 'Dague', 'Arc court', 'Attaque à mains nues']) {
            const plain = computeWeapon(row(name), d);
            assert.deepEqual(computeWeapon(row(name, BASE), d), plain, name);
            assert.deepEqual(computeWeapon(row(name, { ...BASE, extraDamage: [] }), d), plain, name);
            assert.deepEqual(computeWeapon(row(name, { ...BASE, extraDamage: [UNDEAD] }), d), plain, `${name} : pastille éteinte`);
        }
        assert.equal(damage(row('Épée longue')).text, '1d8 +3 TRAN');
    });

    test('« Toujours » : ajouté avec sa raison, comme Fureur divine ; cité dans l\'infobulle', () => {
        const sword = row('Épée longue', { ...BASE, extraDamage: [DRAGONS] });
        assert.equal(damage(sword).text, '1d8 +3 TRAN +2d6 (contre les dragons)');
        assert.match(damage(sword).tooltip, / \| \+2d6 contre les dragons$/);
        // Le bonus d'attaque ne change pas
        const d = deriveCharacter(hero());
        assert.deepEqual(computeWeapon(sword, d).attack, computeWeapon(row('Épée longue'), d).attack);
    });

    test('« À allumer » : compté seulement allumé', () => {
        const off = row('Épée longue', { ...BASE, extraDamage: [UNDEAD] });
        const on = row('Épée longue', { ...BASE, extraDamage: [{ ...UNDEAD, on: true }] });
        assert.equal(damage(off).text, '1d8 +3 TRAN');
        assert.doesNotMatch(damage(off).tooltip, /morts-vivants/);
        assert.equal(damage(on).text, '1d8 +3 TRAN +1d6 (radiants contre les morts-vivants)');
        assert.match(damage(on).tooltip, /\+1d6 radiants contre les morts-vivants/);
    });

    test('plusieurs lignes : les « Toujours » d\'abord, puis les allumées, à la fin du texte', () => {
        const weapon = row('Épée longue', { ...BASE, extraDamage: [{ ...UNDEAD, on: true }, DRAGONS, { dmg: '1', reason: 'feu', mode: 'toggle' }] });
        assert.deepEqual(activeExtraDamage(weapon.weaponConfig), [
            { die: '2d6', type: 'contre les dragons', toggle: false },
            { die: '1d6', type: 'radiants contre les morts-vivants', toggle: true }
        ]);
        assert.equal(damage(weapon).text, '1d8 +3 TRAN +2d6 (contre les dragons) +1d6 (radiants contre les morts-vivants)');
    });

    test('avec les boutons de combat (Rage, Attaque sournoise) : tout s\'ajoute, dégâts en plus à la fin', () => {
        const axe = row('Hache à deux mains', { ...BASE, extraDamage: [DRAGONS, { ...UNDEAD, on: true }] });
        const barbarian = hero({ char_class: 'Barbare' });
        const text = damage(axe, barbarian, { rage: true }).text;
        assert.equal(text, '1d12 +3 TRAN +2 (Rage) +2d6 (contre les dragons) +1d6 (radiants contre les morts-vivants)');
        const tail = activeExtraDamage(axe.weaponConfig).map(extraDamageText).join('');
        assert.ok(text.endsWith(tail), 'les dégâts en plus forment la fin du texte (découpage de l\'affichage)');
        const dagger = row('Dague', { ...BASE, extraDamage: [DRAGONS] });
        assert.equal(damage(dagger, hero({ char_class: 'Roublard' }), { sneakAttack: true }).text,
            '1d4 +3 PERF +3d6 (Sournoise) +2d6 (contre les dragons)');
    });

    test('attaque à mains nues, dé remplacé, bonus magique et type imposé', () => {
        const fist = row('Attaque à mains nues', { ...BASE, extraDamage: [{ dmg: '1d4', reason: 'feu', mode: 'always' }] });
        const base = damage(row('Attaque à mains nues')).text;
        assert.equal(damage(fist).text, `${base} +1d4 (feu)`);
        const custom = row('Épée longue', { ...BASE, magicBonus: 1, dmgDieOverride: '2d6', dmgTypeOverride: 'FEU', extraDamage: [DRAGONS] });
        assert.equal(damage(custom).text, '2d6 +4 FEU +2d6 (contre les dragons)');
    });

    test('arme écrite à la main (hors manuel, computeWeapon null) : les dégâts en plus se voient quand même', () => {
        const claw = { ...EMPTY_WEAPON, name: 'Griffe du dragon', weaponConfig: JSON.stringify({ ...BASE, extraDamage: [DRAGONS, UNDEAD] }) };
        assert.equal(computeWeapon(claw, deriveCharacter(hero())), null);
        const shown = offBookDamage('', claw.weaponConfig);
        assert.equal(shown.text, '+2d6 (contre les dragons)');
        assert.equal(shown.legacy, false);
        assert.match(shown.tooltip, /hors manuel.* \| \+2d6 contre les dragons$/);
        // Ancienne valeur v3 saisie à la main : gardée devant
        const legacy = offBookDamage('1D12+4', claw.weaponConfig);
        assert.equal(legacy.text, '1D12+4 +2d6 (contre les dragons)');
        assert.equal(legacy.legacy, true);
        assert.match(legacy.tooltip, /^Valeur enregistrée : arme hors manuel, pas de calcul automatique \| \+2d6 contre les dragons$/);
        // Sans dégât en plus : comme avant
        assert.deepEqual(offBookDamage('1D12+4', ''),
            { text: '1D12+4', tooltip: 'Valeur enregistrée : arme hors manuel, pas de calcul automatique', legacy: true, parts: [] });
        assert.deepEqual(offBookDamage('', '{oops'), { text: '', tooltip: '', legacy: false, parts: [] });
    });

    test('libellé de la pastille', () => {
        assert.equal(extraDamageLabel(DRAGONS), '+2d6 contre les dragons');
    });
});

describe('Dégâts en plus : bascule allumé / éteint', () => {
    const config = JSON.stringify({ ...BASE, magicBonus: 1, proficiency: 'yes', extraDamage: [DRAGONS, UNDEAD] });

    test('allume puis éteint : seule la ligne visée change, « on » retiré à l\'extinction', () => {
        const on = toggleExtraDamage(config, 1);
        assert.deepEqual(JSON.parse(on), { ...BASE, magicBonus: 1, proficiency: 'yes', extraDamage: [DRAGONS, { ...UNDEAD, on: true }] });
        assert.equal(toggleExtraDamage(on, 1), config, 'éteinte : la chaîne d\'origine, à l\'identique');
    });

    test('ligne « Toujours », ligne absente ou illisible, configuration abîmée : rien ne change', () => {
        assert.equal(toggleExtraDamage(config, 0), config);
        assert.equal(toggleExtraDamage(config, 7), config);
        assert.equal(toggleExtraDamage(config, -1), config);
        assert.equal(toggleExtraDamage('{oops', 0), '{oops');
        assert.equal(toggleExtraDamage('', 0), '');
        const junk = '{"extraDamage":[{"dmg":"??","reason":"x","mode":"toggle"}]}';
        assert.equal(toggleExtraDamage(junk, 0), junk);
    });

    test('les lignes illisibles voisines sont recopiées telles quelles', () => {
        const raw = JSON.stringify({ extraDamage: [{ dmg: '??' }, UNDEAD, 'x'] });
        assert.deepEqual(JSON.parse(toggleExtraDamage(raw, 1)).extraDamage, [{ dmg: '??' }, { ...UNDEAD, on: true }, 'x']);
    });

    test('l\'état suit l\'arme : ligne retirée, rétablie, filtrée', () => {
        const slayer = { ...row('Épée longue'), weaponConfig: toggleExtraDamage(config, 1) };
        const list = [row('Dague'), slayer, row('Arc court')];
        // Suppression de la première ligne : l'état reste sur l'épée, pas sur l'arme qui prend sa place
        const shorter = removeWeapon(list, 0);
        assert.deepEqual(shorter.map(w => readExtraDamage(w.weaponConfig).some(l => l.on)), [true, false]);
        // Suppression de l'arme : plus rien d'allumé nulle part ; rétablie : elle revient allumée
        const without = removeWeapon(list, 1);
        assert.equal(without.some(w => readExtraDamage(w.weaponConfig).length > 0), false);
        assert.deepEqual(restoreWeapon(without, 1, slayer), list);
        // Filtres : la ligne se cache ou non selon ses propres réglages (bonus magique +1 ici)
        assert.equal(matchesWeaponFilter(slayer, 'magic'), true);
        assert.equal(matchesWeaponFilter(slayer, 'ranged'), false);
        assert.equal(isBlankWeapon(slayer), false);
    });
});

describe('Dégâts en plus : remise à zéro au repos', () => {
    const on = JSON.stringify({ ...BASE, extraDamage: [DRAGONS, { ...UNDEAD, on: true }] });
    const off = JSON.stringify({ ...BASE, extraDamage: [DRAGONS, UNDEAD] });

    test('clearExtraDamageOn : rien d\'allumé = le même tableau (aucune écriture)', () => {
        const list = [row('Dague'), { ...row('Épée longue'), weaponConfig: off }, { ...EMPTY_WEAPON, weaponConfig: '{oops' }, null];
        assert.equal(clearExtraDamageOn(list), list);
        assert.equal(clearExtraDamageOn(undefined), undefined);
        assert.deepEqual(clearExtraDamageOn([]), []);
    });

    test('clearExtraDamageOn : éteint tout, ne remplace que les lignes concernées', () => {
        const list = [row('Dague'), { ...row('Épée longue'), weaponConfig: on }];
        const next = clearExtraDamageOn(list);
        assert.notEqual(next, list);
        assert.equal(next[0], list[0]);
        assert.equal(next[1].weaponConfig, off);
        assert.equal(next[1].name, 'Épée longue');
        assert.equal(list[1].weaponConfig, on, 'le tableau d\'origine n\'est pas modifié');
    });

    test('repos long : les pastilles s\'éteignent avec les bonus de combat ; les « Toujours » restent', () => {
        const sheet = hero({ combat_buffs: { rage: true }, dynamic_weapons: [row('Dague'), { ...row('Épée longue'), weaponConfig: on }] });
        const patch = longRestPatch(sheet);
        assert.deepEqual(patch.combat_buffs, {});
        assert.equal(patch.dynamic_weapons[1].weaponConfig, off);
        assert.equal(damage(patch.dynamic_weapons[1]).text, '1d8 +3 TRAN +2d6 (contre les dragons)');
    });

    test('repos long sans pastille allumée : le tableau des armes n\'est pas réécrit', () => {
        const sheet = hero({ dynamic_weapons: [row('Dague'), { ...row('Épée longue'), weaponConfig: off }] });
        assert.equal('dynamic_weapons' in longRestPatch(sheet), false);
        assert.equal('dynamic_weapons' in longRestPatch(hero()), false);
    });

    test('repos court : comme les bonus de combat, rien ne s\'éteint', () => {
        const sheet = hero({ combat_buffs: { rage: true }, dynamic_weapons: [{ ...row('Épée longue'), weaponConfig: on }] });
        const patch = shortRestPatch(sheet);
        assert.equal('dynamic_weapons' in patch, false);
        assert.equal('combat_buffs' in patch, false);
    });
});

describe('Dégâts en plus : interface (js/ui/weapons.js)', () => {
    const ui = readFileSync(new URL('../js/ui/weapons.js', import.meta.url), 'utf8');
    const css = readFileSync(new URL('../css/weapons.css', import.meta.url), 'utf8');

    test('le texte du joueur n\'est jamais posé comme du HTML', () => {
        assert.doesNotMatch(ui, /innerHTML|insertAdjacentHTML|outerHTML/);
    });

    test('pastille : même classe que le bouton Rage, utilisable fiche verrouillée (comme lui)', () => {
        assert.match(ui, /class: 'btn-chip weapons-buff weapons-extra-pill'/);
        const toggle = ui.slice(ui.indexOf('function toggleExtra('), ui.indexOf('function writeExtraPills('));
        assert.ok(toggle.length > 100);
        assert.doesNotMatch(toggle, /isLocked\(/, 'contrôle de jeu : pas de verrou, comme les bonus de combat');
        assert.match(toggle, /setStatus\(frenchSpaces\(/, 'une phrase dans la barre du haut à chaque toucher');
    });

    test('libellés de la fenêtre : ceux que cite le mode d\'emploi', () => {
        for (const label of ['Dégâts en plus', 'Ajouter un dégât en plus', 'Toujours', 'À allumer']) assert.ok(ui.includes(`'${label}'`), label);
        assert.match(ui, /text: frenchSpaces\(EXTRA_HELP\)/, 'aide affichée dans la fenêtre, avec les espaces insécables');
    });

    test('saisie refusée : le message est posé au-dessus de la ligne fautive, jamais en bas de la rubrique', () => {
        const box = ui.slice(ui.indexOf('const extraBox = el('), ui.indexOf('renderExtras();', ui.indexOf('const extraBox = el(')));
        assert.ok(box.length > 100);
        assert.doesNotMatch(box, /extraError/, 'plus de place fixe sous le bouton « Ajouter » (hors de vue quand la fenêtre défile)');
        const show = ui.slice(ui.indexOf('function showExtraError('), ui.indexOf('const body = el('));
        assert.match(show, /extraList\.insertBefore\(extraError, bad \? bad\.line : extraList\.firstChild\)/);
        assert.match(show, /focus\(\{ preventScroll: true \}\)/, 'le curseur ne fait pas défiler la fenêtre loin du message');
        assert.match(show, /zone\.scrollTop \+=/, 'la zone défile jusqu\'au message et à sa ligne');
    });

    test('corbeille d\'une ligne : le focus va à une corbeille ou au bouton d\'ajout, jamais dans un champ (clavier de tablette)', () => {
        const remove = ui.slice(ui.indexOf('const removeBtn = el('), ui.indexOf('return {', ui.indexOf('const removeBtn = el(')));
        assert.ok(remove.length > 100);
        assert.match(remove, /\(extraControls\[Math\.min\(i, extras\.length - 1\)\]\?\.remove \|\| extraAdd\)\.focus\(\)/);
        assert.doesNotMatch(remove, /querySelector\('input'\)/);
    });

    test('dégâts en plus dans la case : une ligne chacun à toutes les largeurs d\'écran, abrégé avec « … »', () => {
        const at = css.indexOf('@media screen {\n    .weapons-calc-extra {');
        assert.notEqual(at, -1, 'règle d\'écran sans largeur limite : la colonne des dégâts est étroite partout (91 px à 1024 px)');
        const rule = css.slice(at, css.indexOf('}', at));
        assert.match(rule, /white-space: nowrap/);
        assert.match(rule, /text-overflow: ellipsis/);
        assert.doesNotMatch(rule, /color|font/);
        assert.doesNotMatch(css, /line-clamp/, 'plus de coupe sur deux lignes réservée aux écrans de moins de 1000 px');
    });

    test('dégâts en plus dans la case : aucune couleur, graisse ni police propre', () => {
        const rule = css.slice(css.indexOf('.weapons-calc-extra {'), css.indexOf('}', css.indexOf('.weapons-calc-extra {')));
        assert.ok(rule.length > 10);
        assert.doesNotMatch(rule, /color|font/);
    });
});
