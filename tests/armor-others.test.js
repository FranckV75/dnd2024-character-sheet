/**
 * TESTS — GROUPE « AUTRES » DE LA LISTE DES ARMURES (js/data/armor-others.js)
 * Objets magiques (Dungeon Master's Guide 2024) et sorts (Player's Handbook 2024) qui changent la
 * CA : chaque entrée devient une ligne ordinaire du tableau, et le calcul de CA existant
 * (computeArmorClass) donne le bon total. Seule clé ajoutée à la ligne : la rareté d'un objet
 * magique (« magic_rarity », facultative), qui ne change jamais la CA.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ARMOR_OTHERS, ARMOR_OTHER_COMMENT_MAX, ARMOR_OTHER_CA_MAX } from '../js/data/armor-others.js';
import { EQUIPMENT_DATA } from '../js/data/equipment.js';
import { EMPTY_ARMOR } from '../js/state/schema.js';
import { migrateCharacter } from '../js/state/migrate.js';
import { deriveCharacter, armorCategory, catalogueArmor } from '../js/rules/character.js';
import {
    ARMOR_TYPES, armorRowFromOther, armorRowFromChoice, armorRowFromCatalogue, isArmorOther, isArmorListComment,
    searchArmorChoices, searchArmorCatalogue, armorWarnings, isBlankArmor,
    armorBaseText, armorOtherOfRow, armorBubbleText, ARMOR_REMINDER_FORMULA, ARMOR_TWICE_SPELL, ARMOR_TWICE_ITEM,
    MAGIC_RARITIES, NOT_MAGIC, armorMagicRarity, magicRarityInfo, withArmorRarity
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

/**
 * Ce qui ne va pas dans une entrée, d'après le mode d'emploi en tête de js/data/armor-others.js
 * (liste vide : entrée valable). Les types et la forme de la valeur sont ceux de l'engrenage.
 */
function entryProblems(entry) {
    const problems = [];
    const text = (value) => typeof value === 'string' && value !== '' && value.trim() === value;
    if (!text(entry.name)) problems.push('name : texte sans espace autour');
    else if (catalogueArmor({ name: entry.name })) problems.push('name : nom d\'une armure du manuel');
    if (!ARMOR_TYPES.some(([value]) => value === entry.type)) problems.push(`type : ${entry.type} n'est pas un type de l'engrenage`);
    else if (entry.type === 'none' || entry.type === 'Maîtrise') {
        if (entry.value !== '') problems.push('value : vide pour ce type');
    } else if (typeof entry.value !== 'string' || !/^[+-]?\d+$/.test(entry.value) || armorBaseText(entry.value, entry.type) !== entry.value) {
        problems.push(`value : à écrire comme l'engrenage (« ${armorBaseText(entry.value, entry.type) || 'un nombre entier'} »)`);
    }
    if (!text(entry.ca) || entry.ca.length > ARMOR_OTHER_CA_MAX) problems.push(`ca : 1 à ${ARMOR_OTHER_CA_MAX} caractères`);
    if (!text(entry.comment) || entry.comment.length > ARMOR_OTHER_COMMENT_MAX) problems.push(`comment : 1 à ${ARMOR_OTHER_COMMENT_MAX} caractères`);
    if ('detail' in entry && !text(entry.detail)) problems.push('detail : texte, ou champ absent');
    if ('oldComments' in entry && !(Array.isArray(entry.oldComments) && entry.oldComments.every(text) && !entry.oldComments.includes(entry.comment))) {
        problems.push('oldComments : liste d\'anciens textes, différents du commentaire actuel');
    }
    if (!['objet', 'sort'].includes(entry.kind)) problems.push('kind : objet ou sort');
    if (!text(entry.vo)) problems.push('vo : nom anglais');
    const rarities = MAGIC_RARITIES.map((rarity) => rarity.id);
    if (entry.kind === 'objet' && !rarities.includes(entry.rarity)) problems.push(`rarity : une de ${rarities.join(', ')}`);
    if (entry.kind === 'sort' && 'rarity' in entry) problems.push('rarity : jamais pour un sort');
    return problems;
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

    test('Chaque entrée suit le mode d\'emploi du fichier (nom unique, type et valeur de l\'engrenage, textes courts)', () => {
        const names = new Set();
        for (const entry of ARMOR_OTHERS) {
            assert.deepEqual(entryProblems(entry), [], entry.name);
            assert.ok(!names.has(entry.name.toLowerCase()), `doublon : ${entry.name}`);
            names.add(entry.name.toLowerCase());
        }
    });

    test('Longueurs : le commentaire tient dans la colonne (80), le texte de la liste sur une ligne (16)', () => {
        assert.equal(ARMOR_OTHER_COMMENT_MAX, 80);
        assert.equal(ARMOR_OTHER_CA_MAX, '15 + Dex (max 2)'.length);
        const long = { ...other('Anneau de protection'), comment: 'x'.repeat(81) };
        assert.deepEqual(entryProblems(long), ['comment : 1 à 80 caractères']);
        assert.deepEqual(entryProblems({ ...other('Anneau de protection'), ca: '+1 (sans armure ni bouclier)' }), ['ca : 1 à 16 caractères']);
        assert.deepEqual(entryProblems({ ...other('Anneau de protection'), comment: '' }), ['comment : 1 à 80 caractères']);
    });

    test('Le contrôle accepte tout ce que le mode d\'emploi permet (bouclier, bonus négatif, maîtrise, détail, anciens textes)', () => {
        const base = { kind: 'objet', vo: 'Example', rarity: 'rare', ca: '+2', comment: 'Objet magique.' };
        assert.deepEqual(entryProblems({ ...base, name: 'Bouclier sentinelle', type: 'Bouclier', value: '+2' }), []);
        assert.deepEqual(entryProblems({ ...base, name: 'Anneau maudit', type: 'Bonus', value: '-1', ca: '-1' }), []);
        assert.deepEqual(entryProblems({ ...base, name: 'Cuir elfique', type: 'Légère', value: '13', ca: '13 + Dex' }), []);
        assert.deepEqual(entryProblems({ ...base, name: 'Garde', type: 'Maîtrise', value: '', ca: '+ maîtrise' }), []);
        assert.deepEqual(entryProblems({ ...base, name: 'Amulette', type: 'Bonus', value: '+1', detail: 'Précision.', oldComments: ['Ancien texte.'] }), []);
        // Et il dit ce qui ne va pas, dans les mots du mode d'emploi
        assert.deepEqual(entryProblems({ ...base, name: 'Amulette', type: 'Bonus', value: '1' }), ['value : à écrire comme l\'engrenage (« +1 »)']);
        assert.deepEqual(entryProblems({ ...base, name: 'Cuir elfique', type: 'Légère', value: '+13' }), ['value : à écrire comme l\'engrenage (« 13 »)']);
        assert.deepEqual(entryProblems({ ...base, name: 'Amulette', type: 'Bonus', value: '' }), ['value : à écrire comme l\'engrenage (« un nombre entier »)']);
        assert.deepEqual(entryProblems({ ...base, name: 'Garde', type: 'Maîtrise', value: '+2' }), ['value : vide pour ce type']);
        assert.deepEqual(entryProblems({ ...base, name: 'Amulette', type: 'Magique', value: '+1' }), ['type : Magique n\'est pas un type de l\'engrenage']);
        assert.deepEqual(entryProblems({ ...base, name: 'Harnois', type: 'Bonus', value: '+1' }), ['name : nom d\'une armure du manuel']);
        assert.deepEqual(entryProblems({ ...base, name: 'Amulette', type: 'Bonus', value: '+1', oldComments: ['Objet magique.'] }),
            ['oldComments : liste d\'anciens textes, différents du commentaire actuel']);
    });

    test('armorBaseText : la valeur telle que l\'engrenage l\'enregistre', () => {
        assert.equal(armorBaseText('1', 'Bonus'), '+1');
        assert.equal(armorBaseText('+2', 'Bouclier'), '+2');
        assert.equal(armorBaseText('-1', 'Bonus'), '-1');
        assert.equal(armorBaseText('0', 'Bonus'), '0');
        assert.equal(armorBaseText('+13', 'Légère'), '13');
        assert.equal(armorBaseText(' 16 ', 'Lourde'), '16');
        assert.equal(armorBaseText('', 'Bonus'), '');
        assert.equal(armorBaseText('abc', 'Bonus'), '');
        assert.equal(armorBaseText(undefined, 'Bonus'), '');
        // Les entrées de la liste sont écrites sous cette forme
        for (const entry of ARMOR_OTHERS.filter((item) => item.value !== '')) {
            assert.equal(armorBaseText(entry.value, entry.type), entry.value, entry.name);
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

    test('Ce que la fiche ne calcule pas : l\'essentiel dans le commentaire, le reste dans la bulle (detail)', () => {
        assert.match(other('Bracelets de défense').comment, /Sans armure ni bouclier : à décocher sinon/);
        assert.match(other("Robe de l'archimage").comment, /CA 15 \+ Dex, notée \+5 : à décocher en armure/);
        assert.match(other("Robe de l'archimage").detail, /Défense sans armure/);
        assert.match(other("Robe de l'archimage").detail, /Armure du mage/);
        assert.match(other('Armure du mage').comment, /CA 13 \+ Dex, notée \+3 : à décocher en armure/);
        assert.match(other('Armure du mage').detail, /Défense sans armure/);
        assert.match(other('Armure du mage').detail, /Robe de l'archimage/);
        assert.match(other("Peau d'écorce").comment, /17/);
        assert.match(other("Peau d'écorce").comment, /non calculé/);
        assert.match(other("Peau d'écorce").detail, /rappel, la cocher ne change pas la CA/);
        // Anneau et cape : le +1 aux jets de sauvegarde n'est pas compté
        for (const name of ['Anneau de protection', 'Cape de protection']) assert.match(other(name).comment, /jets de sauvegarde, non compté/);
    });

    test('Robe de l\'archimage (DMG 2024) : les effets hors CA sont rappelés, comme pour l\'anneau et la cape', () => {
        const { detail } = other("Robe de l'archimage");
        // Harmonisation réservée à trois classes ; « War Mage » ; « Magic Resistance »
        assert.match(detail, /Ensorceleur, un Occultiste ou un Magicien/);
        assert.match(detail, /\+2 au DD de sauvegarde et au bonus d'attaque des sorts/);
        assert.match(detail, /Avantage aux jets de sauvegarde contre les sorts et les effets magiques/);
        assert.match(detail, /non comptés ici/);
    });

    test('Sorts : la bulle dit que la fiche ne décoche pas la ligne à la fin du sort ni au repos', () => {
        for (const entry of ARMOR_OTHERS.filter((item) => item.kind === 'sort')) {
            assert.match(entry.detail, /ne décoche pas la ligne quand le sort finit \(durée, repos\)/, entry.name);
        }
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
    test('Les clés d\'une ligne saisie à la main, plus la rareté d\'un objet magique', () => {
        for (const entry of ARMOR_OTHERS) {
            const row = armorRowFromOther(entry);
            const rarity = entry.kind === 'objet' ? { magic_rarity: entry.rarity } : {};
            assert.deepEqual(row, {
                ...EMPTY_ARMOR, name: entry.name, type: entry.type, ca: entry.value, comment: entry.comment, ...rarity
            }, entry.name);
            assert.equal(isBlankArmor(row), false);
        }
    });

    test('Une ligne choisie est identique à la même ligne réglée à la main', () => {
        // Nom tapé, type « Bonus », valeur « +1 » et rareté réglés avec l'engrenage, commentaire tapé
        const byHand = {
            ...EMPTY_ARMOR, name: 'Anneau de protection', type: 'Bonus', ca: '+1',
            comment: other('Anneau de protection').comment, magic_rarity: 'rare'
        };
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

    test('Texte d\'un commentaire changé plus tard : l\'ancien (oldComments) reste reconnu sur les fiches déjà enregistrées', () => {
        const before = [{ name: 'Armure du mage', kind: 'sort', type: 'Bonus', value: '+3', comment: 'Sort, 8 heures. Ancien texte long.' }];
        const after = [{ ...before[0], comment: 'Sort, 8 heures.', oldComments: ['Sort, 8 heures. Ancien texte long.', '  '] }];
        const saved = { ...armorRowFromOther(before[0]), equipped: true };
        // Sans oldComments, l'ancien texte passerait pour un commentaire du joueur
        assert.equal(isArmorListComment(saved.comment, [{ ...after[0], oldComments: undefined }]), false);
        assert.equal(isArmorListComment(saved.comment, after), true);
        assert.equal(isArmorListComment('Sort, 8 heures.', after), true);
        assert.equal(isArmorListComment('  ', after), false);
        assert.equal(isArmorListComment('Cadeau de Vallus', after), false);
        assert.equal(armorOtherOfRow(saved, after), after[0]);
        // Liste mal complétée : oldComments qui n'est pas une liste est ignoré
        assert.equal(isArmorListComment('abc', [{ name: 'X', comment: 'Texte.', oldComments: 'abc' }]), false);
    });

    test('Ancien texte de la liste réelle : remplacé par une armure du manuel ou par un autre choix', () => {
        const entry = other('Armure du mage');
        const old = 'Sort, 8 heures. Texte d\'une version précédente.';
        entry.oldComments = [old];
        try {
            const saved = { ...armorRowFromOther(entry), comment: old, equipped: true };
            assert.equal(armorRowFromCatalogue(manual('Armure de cuir'), saved).comment, '');
            assert.equal(armorRowFromOther(other('Bouclier de la foi'), saved).comment, other('Bouclier de la foi').comment);
            // Rechoisir la même entrée met le commentaire à jour
            assert.equal(armorRowFromOther(entry, saved).comment, entry.comment);
            assert.equal(armorOtherOfRow(saved), entry);
        } finally {
            delete entry.oldComments;
        }
        assert.equal(isArmorListComment(old), false);
    });

    test('armorOtherOfRow : une ligne de la liste est reconnue à son nom ET à son commentaire', () => {
        for (const entry of ARMOR_OTHERS) assert.equal(armorOtherOfRow(armorRowFromOther(entry)), entry, entry.name);
        const ring = armorRowFromOther(other('Anneau de protection'));
        // Anneau et cape ont le même commentaire : le nom les départage
        assert.equal(armorOtherOfRow({ ...ring, name: 'Cape de protection' }), other('Cape de protection'));
        assert.equal(armorOtherOfRow({ ...ring, name: ' ANNEAU DE PROTECTION<br>' }), other('Anneau de protection'));
        // Tapée à la main, renommée, ou commentée par le joueur : pas reconnue
        assert.equal(armorOtherOfRow({ name: 'Anneau de protection', type: 'Bonus', ca: '+1' }), null);
        assert.equal(armorOtherOfRow({ ...ring, name: 'Anneau de Vallus' }), null);
        assert.equal(armorOtherOfRow({ ...ring, comment: 'Cadeau de Vallus' }), null);
        assert.equal(armorOtherOfRow({ ...ring, comment: '' }), null);
        assert.equal(armorOtherOfRow(armorRowFromCatalogue(manual('Harnois'))), null);
        assert.equal(armorOtherOfRow(null), null);
        assert.equal(armorOtherOfRow({}), null);
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

describe('Groupe « Autres » : la même entrée active deux fois', () => {
    test('Même sort deux fois (PHB 2024, « Combining Spell Effects ») : les deux lignes sont signalées', () => {
        const rows = [active('Bouclier de la foi'), worn('Cotte de mailles'), active('Bouclier de la foi')];
        const training = { light: true, medium: true, heavy: true, shield: true };
        assert.deepEqual(armorWarnings(rows, training, 15), [[ARMOR_TWICE_SPELL], [], [ARMOR_TWICE_SPELL]]);
        assert.match(ARMOR_TWICE_SPELL, /ne se cumulent pas/);
        // Le calcul n'est pas changé (les deux bonus s'ajoutent toujours) : c'est l'avertissement qui prévient
        assert.equal(armorClass(rows, { className: 'Guerrier' }).value, 20);
    });

    test('Même objet deux fois (un seul exemplaire harmonisé) : signalé', () => {
        const rows = [active('Anneau de protection'), active('Anneau de protection'), active('Cape de protection')];
        assert.deepEqual(armorWarnings(rows, {}, 10), [[ARMOR_TWICE_ITEM], [ARMOR_TWICE_ITEM], []]);
        assert.match(ARMOR_TWICE_ITEM, /harmonise/);
    });

    test('Une seule des deux lignes active, ou ligne de rappel en double : rien', () => {
        const ring = armorRowFromOther(other('Anneau de protection'));
        assert.deepEqual(armorWarnings([{ ...ring, equipped: true }, ring], {}, 10), [[], []]);
        assert.deepEqual(armorWarnings([active("Peau d'écorce"), active("Peau d'écorce")], {}, 10), [[], []]);
    });

    test('Deux lignes tapées à la main (sans le commentaire de la liste) : jamais signalées, comme avant', () => {
        const byHand = { name: 'Anneau de protection', type: 'Bonus', ca: '+1', equipped: true };
        assert.deepEqual(armorWarnings([byHand, { ...byHand }], {}, 10), [[], []]);
        assert.deepEqual(armorWarnings([byHand, active('Anneau de protection')], {}, 10), [[], []]);
        const own = { ...active('Anneau de protection'), comment: 'Cadeau de Vallus' };
        assert.deepEqual(armorWarnings([own, active('Anneau de protection')], {}, 10), [[], []]);
    });
});

describe('Groupe « Autres » : bulle de la CA d\'une ligne (armorBubbleText)', () => {
    const lineOf = (row) => armorClass([row]).rows[0].line;
    const GENERIC = /choisissez son type avec l'engrenage/;

    test('Peau d\'écorce (ligne de rappel) : la bulle dit que c\'est un rappel, sans inviter à choisir un type', () => {
        const row = active("Peau d'écorce");
        const line = lineOf(row);
        assert.match(line.formula, GENERIC);
        const bubble = armorBubbleText(row, line);
        assert.equal(bubble.formula, ARMOR_REMINDER_FORMULA);
        assert.doesNotMatch(bubble.formula, GENERIC);
        assert.equal(bubble.detail, other("Peau d'écorce").detail);
        assert.match(bubble.detail, /17/);
        // Mise en garde contre le réglage « Bonus 17 » (CA 29 au lieu de 17)
        assert.match(bubble.detail, /ne lui donnez pas le type « Bonus »/);
    });

    test('Entrée de rappel sans détail : la bulle reprend son commentaire', () => {
        const list = [{ name: 'Rappel', type: 'none', value: '', comment: 'À lire.' }];
        const row = armorRowFromOther(list[0]);
        assert.deepEqual(armorBubbleText(row, { kind: 'none', formula: 'x' }, list), { formula: ARMOR_REMINDER_FORMULA, detail: 'À lire.' });
    });

    test('Ligne qui compte : le calcul tel quel, suivi du détail de l\'entrée', () => {
        const robe = active("Robe de l'archimage");
        assert.deepEqual(armorBubbleText(robe, lineOf(robe)),
            { formula: '+5 à la CA (bonus fixe)', detail: other("Robe de l'archimage").detail });
        const ring = active('Anneau de protection');
        assert.deepEqual(armorBubbleText(ring, lineOf(ring)), { formula: '+1 à la CA (bonus fixe)', detail: '' });
    });

    test('Ligne tapée à la main ou commentée par le joueur : la bulle d\'avant, sans détail', () => {
        const byHand = { name: "Peau d'écorce", equipped: true };
        const line = lineOf(byHand);
        assert.deepEqual(armorBubbleText(byHand, line), { formula: line.formula, detail: '' });
        assert.match(armorBubbleText(byHand, line).formula, GENERIC);
        const own = { ...active("Peau d'écorce"), comment: 'Lancé par Iria' };
        assert.match(armorBubbleText(own, lineOf(own)).formula, GENERIC);
        const plate = worn('Harnois');
        assert.deepEqual(armorBubbleText(plate, lineOf(plate)), { formula: lineOf(plate).formula, detail: '' });
        assert.deepEqual(armorBubbleText(null, null), { formula: '', detail: '' });
    });

    test('Entrée « Bonus » passée à « Standard / Aucun » avec l\'engrenage : le conseil de choisir un type reste', () => {
        const ring = { ...active('Anneau de protection'), type: 'none' };
        const line = lineOf(ring);
        assert.equal(line.kind, 'none');
        assert.match(armorBubbleText(ring, line).formula, GENERIC);
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

    test('La bulle de la CA affiche le texte de armorBubbleText (rappel, détail de l\'entrée)', () => {
        assert.match(ui, /const bubble = armorBubbleText\(row, line\);/);
        assert.match(ui, /formula: bubble\.formula, detail: bubble\.detail,/);
        assert.match(ui, /info\.detail \? el\('p', \{ class: 'armor-ca-detail', text: info\.detail \}\) : null/);
        const css = readFileSync(new URL('../css/armors.css', import.meta.url), 'utf8');
        assert.match(css, /\.armor-ca-detail \{[^}]*color: var\(--text-muted\);/);
    });

    test('L\'engrenage enregistre la valeur de base avec armorBaseText (règle testée)', () => {
        assert.match(ui, /next\.ca = armorBaseText\(baseInput\.value, type\)/);
        assert.doesNotMatch(ui, /function baseText/);
    });

    test('Nom tapé en entier : seules les armures du manuel sont complétées toutes seules', () => {
        assert.match(ui, /const entry = name && searchArmorCatalogue\(name\)\.find\(a => a\.name\.toLowerCase\(\) === name\);\s*if \(entry\) replaceRow\(index, current => armorRowFromCatalogue\(entry, current\)\);/);
    });
});

describe('Objets magiques par nature : rareté, jamais de bonus en plus (demande de Franck, 25/11/2026)', () => {
    test('Raretés du DMG 2024 : cape peu commune, anneau, bracelets et pierre rares, robe légendaire', () => {
        assert.deepEqual(ARMOR_OTHERS.filter((entry) => entry.kind === 'objet').map((entry) => [entry.name, entry.rarity]), [
            ['Anneau de protection', 'rare'], ['Cape de protection', 'uncommon'], ['Bracelets de défense', 'rare'],
            ['Pierre de Ioun de protection', 'rare'], ["Robe de l'archimage", 'legendary']
        ]);
        // Paliers des décors, comme les armures magiques du DMG 2024 (+1 rare, +2 très rare, +3 légendaire)
        assert.deepEqual(MAGIC_RARITIES.map((rarity) => [rarity.id, rarity.level]),
            [['uncommon', 1], ['rare', 1], ['very_rare', 2], ['legendary', 3]]);
        assert.equal(magicRarityInfo('rare').label, 'rare');
        assert.equal(magicRarityInfo('mythique'), null);
    });

    test('armorMagicRarity : clé de la ligne, sinon entrée reconnue ; jamais pour une armure, un bouclier ou un sort', () => {
        assert.equal(armorMagicRarity(armorRowFromOther(other('Cape de protection'))), 'uncommon');
        assert.equal(armorMagicRarity(armorRowFromOther(other('Armure du mage'))), '');
        // Ligne choisie avant la 4.51.0 (sans la clé) : reconnue à son nom et à son commentaire
        const old = { ...armorRowFromOther(other("Robe de l'archimage")) };
        delete old.magic_rarity;
        assert.equal(armorMagicRarity(old), 'legendary');
        // Commentaire changé par le joueur : la clé garde la ligne magique
        assert.equal(armorMagicRarity({ ...armorRowFromOther(other('Anneau de protection')), comment: 'Cadeau de Vallus' }), 'rare');
        // Ligne saisie à la main : magique seulement si l'engrenage l'a dit
        const amulet = { ...EMPTY_ARMOR, name: 'Amulette', type: 'Bonus', ca: '+1' };
        assert.equal(armorMagicRarity(amulet), '');
        assert.equal(armorMagicRarity({ ...amulet, magic_rarity: 'very_rare' }), 'very_rare');
        assert.equal(armorMagicRarity({ ...amulet, magic_rarity: 'mythique' }), '');
        // Armure ou bouclier : leur magie est le bonus magique, la clé ne compte pas
        assert.equal(armorMagicRarity({ ...worn('Armure de cuir'), magic_rarity: 'rare' }), '');
        assert.equal(armorMagicRarity(null), '');
    });

    test('withArmorRarity : enregistre, retire, ou « none » pour un objet reconnu rendu ordinaire', () => {
        const cape = armorRowFromOther(other('Cape de protection'));
        assert.equal(withArmorRarity(cape, 'rare').magic_rarity, 'rare');
        const plain = withArmorRarity(cape, '');
        assert.equal(plain.magic_rarity, NOT_MAGIC);
        assert.equal(armorMagicRarity(plain), '');
        const amulet = { ...EMPTY_ARMOR, name: 'Amulette', type: 'Bonus', ca: '+1', legacy: 1 };
        assert.deepEqual(withArmorRarity(amulet, ''), amulet);
        assert.deepEqual(withArmorRarity(amulet, 'uncommon'), { ...amulet, magic_rarity: 'uncommon' });
        assert.equal('magic_rarity' in withArmorRarity({ ...worn('Armure de cuir'), magic_rarity: 'rare' }, 'rare'), false);
        assert.equal(amulet.magic_rarity, undefined); // la ligne d'origine n'est pas modifiée
    });

    test('La rareté ne change jamais la CA ; une armure ou un sort choisi à la place retire la clé', () => {
        const cape = { ...armorRowFromOther(other('Cape de protection')), equipped: true };
        const withoutKey = { ...cape };
        delete withoutKey.magic_rarity;
        assert.equal(armorClass([cape]).total, armorClass([withoutKey]).total);
        assert.equal(armorClass([{ ...cape, magic_rarity: 'legendary' }]).total, armorClass([withoutKey]).total);
        // Même un bonus magique laissé sur une cape ne compte pas : la magie ne compte jamais deux fois
        assert.equal(armorClass([{ ...cape, magic: 2 }]).total, armorClass([cape]).total);
        assert.equal('magic_rarity' in armorRowFromCatalogue(manual('Armure de cuir'), cape), false);
        assert.equal('magic_rarity' in armorRowFromOther(other('Bouclier de la foi'), cape), false);
    });

    test('Ligne vide avec seulement une rareté : pas vide ; la lecture d\'une sauvegarde garde la clé', () => {
        assert.equal(isBlankArmor({ ...EMPTY_ARMOR, magic_rarity: 'rare' }), false);
        assert.equal(isBlankArmor({ ...EMPTY_ARMOR, magic_rarity: NOT_MAGIC }), true);
        const row = { ...armorRowFromOther(other('Bracelets de défense')), equipped: true };
        assert.deepEqual(migrateCharacter({ dynamic_armors: [row] }).character.dynamic_armors, [row]);
    });
});
