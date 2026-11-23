/**
 * TESTS — GROUPE « AUTRES » DE LA LISTE DES ARMURES (js/data/armor-others.js)
 * Objets magiques (Dungeon Master's Guide 2024) et sorts (Player's Handbook 2024) qui changent la
 * CA : chaque entrée devient une ligne ordinaire du tableau, et le calcul de CA existant
 * (computeArmorClass) donne le bon total. Aucune clé de sauvegarde nouvelle.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ARMOR_OTHERS } from '../js/data/armor-others.js';
import { EQUIPMENT_DATA } from '../js/data/equipment.js';
import { EMPTY_ARMOR } from '../js/state/schema.js';
import { migrateCharacter } from '../js/state/migrate.js';
import { deriveCharacter, armorCategory, catalogueArmor } from '../js/rules/character.js';
import {
    ARMOR_TYPES, armorRowFromOther, armorRowFromChoice, armorRowFromCatalogue, isArmorOther, isArmorListComment,
    searchArmorChoices, searchArmorCatalogue, armorWarnings, isBlankArmor
} from '../js/rules/armors.js';
import { ARMOR_PICKER_GROUPS, ARMOR_PICKER_OTHER, armorPickerGroups } from '../js/rules/armor-picker.js';

const other = (name) => ARMOR_OTHERS.find((entry) => entry.name === name);
const manual = (name) => EQUIPMENT_DATA.armors.find((armor) => armor.name === name);
/** Ligne choisie dans la liste, cochée « équipée / actif » */
const active = (name) => ({ ...armorRowFromOther(other(name)), equipped: true });
const worn = (name) => ({ ...armorRowFromCatalogue(manual(name)), equipped: true });

/** CA d'une fiche : Dextérité 14 (+2) par défaut, formation aux boucliers cochée */
function armorClass(armors, { className = 'Magicien', dex = 14, level = 5, ...rest } = {}) {
    return deriveCharacter({
        char_class: className, char_level: level, dex_score: dex, prof_armor_shield: true,
        dynamic_armors: armors, ...rest
    }).armorClass;
}

describe('Groupe « Autres » : la liste de données', () => {
    test('Liste de départ, dans cet ordre : objets magiques puis sorts', () => {
        assert.deepEqual(ARMOR_OTHERS.map((entry) => entry.name), [
            'Anneau de protection', 'Cape de protection', 'Bracelets de défense', 'Pierre de Ioun de protection',
            "Robe de l'archimage", 'Armure du mage', 'Bouclier de la foi', "Peau d'écorce"
        ]);
        assert.deepEqual(ARMOR_OTHERS.map((entry) => entry.kind),
            ['objet', 'objet', 'objet', 'objet', 'objet', 'sort', 'sort', 'sort']);
    });

    test('Chaque entrée : nom unique, type de l\'engrenage, valeur écrite comme l\'engrenage, texte de liste court, commentaire', () => {
        const types = new Set(ARMOR_TYPES.map(([value]) => value));
        const names = new Set();
        for (const entry of ARMOR_OTHERS) {
            assert.equal(typeof entry.name, 'string');
            assert.ok(entry.name.trim() === entry.name && entry.name !== '', entry.name);
            assert.ok(!names.has(entry.name.toLowerCase()), `doublon : ${entry.name}`);
            names.add(entry.name.toLowerCase());
            assert.ok(types.has(entry.type), `${entry.name} : type ${entry.type}`);
            // Bonus : « +1 », « +2 »… (forme écrite par la fenêtre de réglages) ; sinon vide
            if (entry.type === 'Bonus') assert.match(entry.value, /^\+\d+$/, entry.name);
            else assert.equal(entry.value, '', entry.name);
            // Le texte de la liste ne passe pas à la ligne : pas plus long que « 15 + Dex (max 2) »
            assert.ok(entry.ca.length > 0 && entry.ca.length <= '15 + Dex (max 2)'.length, `${entry.name} : ${entry.ca}`);
            assert.ok(entry.comment.length > 0, entry.name);
            assert.ok(['objet', 'sort'].includes(entry.kind), entry.name);
            assert.ok(entry.vo.length > 0, entry.name);
        }
    });

    test('Aucune entrée ne porte le nom d\'une armure du manuel', () => {
        for (const entry of ARMOR_OTHERS) assert.equal(catalogueArmor({ name: entry.name }), null, entry.name);
    });

    test('Les sorts portent le nom du grimoire (data/spells.json)', () => {
        const spells = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
        const byVo = new Map(spells.map((spell) => [spell.vo, spell]));
        for (const entry of ARMOR_OTHERS.filter((item) => item.kind === 'sort')) {
            const spell = byVo.get(entry.vo);
            assert.ok(spell, `${entry.vo} absent du grimoire`);
            assert.equal(spell.name.split('|')[0].trim(), entry.name);
        }
        // Durées et concentration citées dans les commentaires : celles du grimoire
        assert.equal(byVo.get('Mage Armor').duration, '8 heures');
        assert.equal(byVo.get('Mage Armor').concentration, false);
        assert.match(other('Armure du mage').comment, /8 heures/);
        assert.equal(byVo.get('Shield of Faith').duration, '10 minutes');
        assert.equal(byVo.get('Shield of Faith').concentration, true);
        assert.match(other('Bouclier de la foi').comment, /10 minutes, concentration/);
        assert.equal(byVo.get('Barkskin').duration, '1 heure');
        assert.equal(byVo.get('Barkskin').concentration, false);
        assert.match(other("Peau d'écorce").comment, /1 heure/);
        assert.doesNotMatch(other("Peau d'écorce").comment, /concentration/);
    });

    test('Ce que la fiche ne calcule pas est écrit dans le commentaire', () => {
        assert.match(other('Bracelets de défense').comment, /sans armure ni bouclier/);
        assert.match(other("Robe de l'archimage").comment, /15 \+ Dex sans armure, notée \+5/);
        assert.match(other("Robe de l'archimage").comment, /Défense sans armure/);
        assert.match(other('Armure du mage').comment, /13 \+ Dex sans armure, notée \+3/);
        assert.match(other('Armure du mage').comment, /Défense sans armure/);
        assert.match(other("Peau d'écorce").comment, /17/);
        assert.match(other("Peau d'écorce").comment, /non calculé/);
        // Anneau et cape : le +1 aux jets de sauvegarde n'est pas compté
        for (const name of ['Anneau de protection', 'Cape de protection']) assert.match(other(name).comment, /jets de sauvegarde, non compté/);
    });
});

describe('Groupe « Autres » : dans la liste à parcourir', () => {
    const groups = (options = {}) => armorPickerGroups(EQUIPMENT_DATA.armors, { others: ARMOR_OTHERS, ...options });

    test('Cinquième groupe, après les boucliers', () => {
        assert.deepEqual(ARMOR_PICKER_OTHER, { id: 'other', title: 'Autres' });
        assert.deepEqual(groups().map((group) => group.title),
            [...ARMOR_PICKER_GROUPS.map((group) => group.title), 'Autres']);
        const last = groups().at(-1);
        assert.equal(last.id, 'other');
        assert.deepEqual(last.items.map((item) => item.armor), ARMOR_OTHERS);
    });

    test('Sans la liste « Autres » : les quatre groupes du manuel, comme avant', () => {
        assert.deepEqual(armorPickerGroups(EQUIPMENT_DATA.armors).map((group) => group.id), ['light', 'medium', 'heavy', 'shield']);
    });

    test('La saisie resserre aussi ce groupe, sans accents ni majuscules', () => {
        assert.deepEqual(groups({ query: 'PROTECTION' }).map((group) => group.id), ['other']);
        assert.deepEqual(groups({ query: 'protection' })[0].items.map((item) => item.armor.name),
            ['Anneau de protection', 'Cape de protection', 'Pierre de Ioun de protection']);
        assert.deepEqual(groups({ query: 'ecorce' })[0].items.map((item) => item.armor.name), ["Peau d'écorce"]);
        // « bouclier » : le bouclier du manuel, puis le sort
        assert.deepEqual(groups({ query: 'bouclier' }).map((group) => group.id), ['shield', 'other']);
        assert.deepEqual(groups({ query: 'zzz' }), []);
    });

    test('Entrée déjà dans le tableau : marquée, toujours choisissable', () => {
        const items = groups({ rows: [{ name: ' anneau de protection ' }, { name: 'Harnois' }] }).at(-1).items;
        assert.equal(items.find((item) => item.armor.name === 'Anneau de protection').noted, true);
        assert.equal(items.find((item) => item.armor.name === 'Cape de protection').noted, false);
        assert.ok(items.every((item) => !('disabled' in item)));
    });

    test('Liste mal complétée (entrée vide, sans nom) : ignorée sans erreur', () => {
        const odd = [null, {}, { name: '' }, { name: 'Amulette', type: 'Bonus', value: '+1', ca: '+1' }];
        assert.deepEqual(armorPickerGroups([], { others: odd }).map((group) => group.items.map((item) => item.armor.name)), [['Amulette']]);
        assert.deepEqual(armorPickerGroups([], { others: 'abc' }), []);
    });

    test('Suggestions pendant la saisie : manuel d\'abord, puis « Autres »', () => {
        assert.deepEqual(searchArmorChoices('bouclier').map((entry) => entry.name), ['Bouclier', 'Bouclier de la foi']);
        assert.deepEqual(searchArmorChoices('anneau').map((entry) => entry.name), ['Anneau de protection']);
        assert.deepEqual(searchArmorChoices('  '), []);
        // La recherche du manuel seul (nom tapé en entier, complété tout seul) ne connaît pas ces entrées
        assert.deepEqual(searchArmorCatalogue('anneau'), []);
    });
});

describe('Groupe « Autres » : la ligne écrite dans le tableau', () => {
    test('Exactement les clés d\'une ligne saisie à la main, aucune nouvelle', () => {
        for (const entry of ARMOR_OTHERS) {
            const row = armorRowFromOther(entry);
            assert.deepEqual(Object.keys(row).sort(), Object.keys(EMPTY_ARMOR).sort(), entry.name);
            assert.deepEqual(row, {
                ...EMPTY_ARMOR, name: entry.name, type: entry.type, ca: entry.value, comment: entry.comment
            }, entry.name);
            assert.equal(isBlankArmor(row), false);
        }
    });

    test('Une ligne choisie est identique à la même ligne réglée à la main', () => {
        // Nom tapé, type « Bonus » et valeur « +1 » réglés avec l'engrenage, commentaire tapé
        const byHand = { ...EMPTY_ARMOR, name: 'Anneau de protection', type: 'Bonus', ca: '+1', comment: other('Anneau de protection').comment };
        assert.deepEqual(armorRowFromOther(other('Anneau de protection')), byHand);
        // La migration (lecture d'une sauvegarde) ne la change pas
        const saved = migrateCharacter({ dynamic_armors: [{ ...byHand, equipped: true }] }).character.dynamic_armors;
        assert.deepEqual(saved, [{ ...byHand, equipped: true }]);
    });

    test('Garde l\'état « équipée », les clés inconnues et le commentaire du joueur', () => {
        const row = armorRowFromOther(other('Cape de protection'), { name: 'ca', comment: 'Cadeau de Vallus', equipped: true, legacy: 1 });
        assert.equal(row.name, 'Cape de protection');
        assert.equal(row.comment, 'Cadeau de Vallus');
        assert.equal(row.equipped, true);
        assert.equal(row.legacy, 1);
        assert.equal(row.type, 'Bonus');
        assert.equal(row.ca, '+1');
    });

    test('Un commentaire écrit par la liste est remplacé par celui du nouveau choix', () => {
        const bracers = armorRowFromOther(other('Bracelets de défense'));
        assert.equal(isArmorListComment(bracers.comment), true);
        assert.equal(isArmorListComment('Cadeau de Vallus'), false);
        assert.equal(isArmorListComment(''), false);
        assert.equal(isArmorListComment(undefined), false);
        assert.equal(armorRowFromOther(other('Bouclier de la foi'), bracers).comment, other('Bouclier de la foi').comment);
        // Puis une armure du manuel sur la même ligne : la condition de l'objet disparaît
        assert.equal(armorRowFromCatalogue(manual('Harnois'), bracers).comment, '');
        assert.equal(armorRowFromCatalogue(manual('Harnois'), { comment: 'Blason' }).comment, 'Blason');
    });

    test('Efface Force, Discrétion, poids, prix et bonus magique d\'une armure remplacée', () => {
        const plate = { ...armorRowFromCatalogue(manual('Harnois')), magic: 2, equipped: true };
        const row = armorRowFromOther(other('Anneau de protection'), plate);
        assert.deepEqual(row, { ...armorRowFromOther(other('Anneau de protection')), equipped: true });
        assert.ok(!('magic' in row));
    });

    test('armorRowFromChoice : armure du manuel ou entrée « Autres »', () => {
        assert.equal(isArmorOther(other('Armure du mage')), true);
        assert.equal(isArmorOther(manual('Bouclier')), false);
        assert.equal(isArmorOther(null), false);
        assert.deepEqual(armorRowFromChoice(other('Armure du mage')), armorRowFromOther(other('Armure du mage')));
        assert.deepEqual(armorRowFromChoice(manual('Bouclier'), { magic: 1 }), armorRowFromCatalogue(manual('Bouclier'), { magic: 1 }));
    });

    test('Jamais d\'avertissement d\'armure (formation, Force) pour ces lignes', () => {
        const rows = ARMOR_OTHERS.map((entry) => active(entry.name));
        assert.deepEqual(armorWarnings(rows, {}, 3), rows.map(() => []));
        // Ni armure ni bouclier « portés » : Arts martiaux, Rage, styles de combat inchangés
        assert.deepEqual(deriveCharacter({ char_class: 'Moine', dynamic_armors: rows }).wornArmor,
            { light: false, medium: false, heavy: false, shield: false, shieldTrained: false });
    });
});

describe('Groupe « Autres » : total de CA donné par le calcul existant', () => {
    test('Sans rien : 10 + Dex', () => {
        assert.equal(armorClass([]).value, 12);
    });

    test('Anneau, cape, pierre de Ioun : +1 chacun, avec ou sans armure, et ils s\'additionnent', () => {
        for (const name of ['Anneau de protection', 'Cape de protection', 'Pierre de Ioun de protection']) {
            assert.equal(armorClass([active(name)]).value, 13, name);
            assert.equal(armorClass([worn('Harnois'), worn('Bouclier'), active(name)]).value, 21, name);
        }
        assert.equal(armorClass([active('Anneau de protection'), active('Cape de protection'), active('Pierre de Ioun de protection')]).value, 15);
    });

    test('Bracelets de défense : +2 sans armure ni bouclier', () => {
        const ac = armorClass([active('Bracelets de défense')]);
        assert.equal(ac.value, 14);
        assert.equal(ac.rows[0].status, 'counted');
        assert.equal(ac.rows[0].line.display, '+2');
    });

    test('Robe de l\'archimage : 15 + Dex sans armure, bouclier en plus', () => {
        assert.equal(armorClass([active("Robe de l'archimage")]).value, 17);
        assert.equal(armorClass([active("Robe de l'archimage")], { dex: 18 }).value, 19);
        assert.equal(armorClass([active("Robe de l'archimage"), worn('Bouclier')]).value, 19);
    });

    test('Armure du mage : 13 + Dex sans armure, bouclier en plus', () => {
        assert.equal(armorClass([active('Armure du mage')]).value, 15);
        assert.equal(armorClass([active('Armure du mage')], { dex: 8 }).value, 12);
        assert.equal(armorClass([active('Armure du mage'), worn('Bouclier')], { className: 'Ensorceleur' }).value, 17);
    });

    test('Bouclier de la foi : +2, en armure aussi', () => {
        assert.equal(armorClass([active('Bouclier de la foi')], { className: 'Clerc' }).value, 14);
        assert.equal(armorClass([worn('Cotte de mailles'), worn('Bouclier'), active('Bouclier de la foi')], { className: 'Paladin' }).value, 20);
    });

    test('Peau d\'écorce : ligne de rappel, la CA de la fiche ne change pas', () => {
        const ac = armorClass([active("Peau d'écorce")], { className: 'Druide' });
        assert.equal(ac.value, 12);
        assert.equal(ac.rows[0].status, 'none');
        assert.equal(ac.rows[0].line.kind, 'none');
    });

    test('Case « équipée / actif » décochée : la ligne ne compte pas', () => {
        for (const entry of ARMOR_OTHERS) {
            assert.equal(armorClass([armorRowFromOther(entry)]).value, 12, entry.name);
        }
    });

    test('Le détail de la CA (bulle de l\'écusson) cite la ligne par son nom', () => {
        const ac = armorClass([active('Armure du mage'), active('Anneau de protection')]);
        assert.equal(ac.value, 16);
        assert.deepEqual(ac.parts.map((part) => [part.label, part.value]),
            [['Sans armure', '12'], ['Armure du mage', '+3'], ['Anneau de protection', '+1']]);
    });
});

describe('Groupe « Autres » : une fiche qui ne s\'en sert pas ne change pas', () => {
    test('Un nom tapé à la main, sans type, n\'est pas reconnu (ancienne fiche)', () => {
        for (const entry of ARMOR_OTHERS) {
            assert.equal(armorCategory({ name: entry.name }), '', entry.name);
            const legacy = { name: entry.name, ca: '1', equipped: true };
            assert.equal(armorClass([legacy]).value, 12, entry.name);
            const { character } = migrateCharacter({ dynamic_armors: [legacy] });
            assert.equal(character.dynamic_armors[0].type, 'none', entry.name);
            assert.equal(character.dynamic_armors[0].comment, '', entry.name);
        }
    });
});

describe('Groupe « Autres » : interface (js/ui/armors.js)', () => {
    const ui = readFileSync(new URL('../js/ui/armors.js', import.meta.url), 'utf8');

    test('La liste à parcourir reçoit le groupe « Autres », et le choix remplit la ligne', () => {
        assert.match(ui, /armorPickerGroups\(EQUIPMENT_DATA\.armors, \{ query, rows: noted, others: ARMOR_OTHERS \}\)/);
        assert.match(ui, /replaceRow\(index, row => armorRowFromChoice\(item\.value, row\)\)/);
        assert.match(ui, /searchArmorChoices\(query\)/);
    });

    test('Nom tapé en entier : seules les armures du manuel sont complétées toutes seules', () => {
        assert.match(ui, /const entry = name && searchArmorCatalogue\(name\)\.find\(a => a\.name\.toLowerCase\(\) === name\);\s*if \(entry\) replaceRow\(index, current => armorRowFromCatalogue\(entry, current\)\);/);
    });
});
