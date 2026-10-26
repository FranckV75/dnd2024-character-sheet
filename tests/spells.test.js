/**
 * TESTS UNITAIRES — RULES/SPELLS.JS (grimoire : recherche, lignes, emplacements)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    plainText,
    cellText,
    looksLikeLegacyHtml,
    descToPlainText,
    normalizeText,
    spellNames,
    spellDisplayName,
    spellLevelLabel,
    effectiveSpellClass,
    searchSpells,
    findSpellByName,
    spellToRow,
    rowLevel,
    isSpellRowEmpty,
    isPrepared,
    matchesLevelFilter,
    sortedSpellIndices,
    nextSort,
    spellCounts,
    formatSpellCount,
    newSpellRow,
    effectiveSlotMax,
    slotView,
    toggleSlotUsed,
    adjustSlotMax,
    slotLevels,
    nextFreeSlotLevel,
    MAX_SLOTS_PER_LEVEL,
    hasSpellContent,
    spellRowsView,
    spellcastingStatus,
    grimoireView,
    SUBCLASS_SPELLCASTING
} from '../js/rules/spells.js';
import { EMPTY_SPELL } from '../js/state/schema.js';
import { spellSlotsFor } from '../js/rules/character.js';

const BASE = [
    {
        name: 'Boule de feu', vo: 'Fireball', level: 3, school: 'Évocation', castTime: 'Action',
        range: '45 m', duration: 'Instantanée', components: 'V,S,M', concentration: false, ritual: false,
        classes: ['sorcerer', 'wizard'], desc: 'Une traînée<br><strong>brillante</strong> &amp; chaude.'
    },
    {
        name: 'Éclair de sorcière', vo: 'Witch Bolt', level: 1, school: 'Évocation', castTime: 'Action',
        range: '18 m', duration: 'Concentration, jusqu\'à 1 minute', components: 'V,S,M', concentration: true,
        ritual: false, classes: ['sorcerer', 'warlock', 'wizard'], desc: 'Un rayon.'
    },
    {
        name: 'Détection de la magie', vo: 'Detect Magic', level: 1, school: 'Divination', castTime: 'Action',
        range: 'Personnelle', duration: '10 minutes', components: 'V,S', concentration: true, ritual: true,
        classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'], desc: ''
    },
    {
        name: 'Amis|Faux amis', vo: 'Friends', level: 0, school: 'Enchantement', castTime: 'Action',
        range: '3 m', duration: '1 minute', components: 'S,M', concentration: true, ritual: false,
        classes: ['bard', 'sorcerer', 'warlock', 'wizard'], desc: ''
    },
    {
        name: 'Soins', vo: 'Cure Wounds', level: 1, school: 'Abjuration', castTime: 'Action',
        range: 'Contact', duration: 'Instantanée', components: 'V,S', concentration: false, ritual: false,
        classes: ['bard', 'cleric', 'druid', 'paladin', 'ranger'], desc: ''
    }
];

describe('Texte : HTML des anciennes sauvegardes et descriptions', () => {
    test('plainText retire les balises et décode les entités', () => {
        assert.equal(plainText('<b>Boule</b>&nbsp;de feu &amp; co'), 'Boule de feu & co');
        assert.equal(plainText(null), '');
        assert.equal(plainText(3), '3');
    });

    test('cellText : le texte saisi en v4 est affiché tel quel, le HTML v3 est nettoyé', () => {
        // Saisies v4 : aucune perte
        assert.equal(cellText('Dégâts <niv. sup.> +1d6'), 'Dégâts <niv. sup.> +1d6');
        assert.equal(cellText('A & B <b>gras</b>'), 'A & B <b>gras</b>');
        assert.equal(cellText('&amp; et > 3'), '&amp; et > 3');
        assert.equal(cellText('  deux  espaces '), '  deux  espaces ');
        assert.equal(cellText('1 < 2'), '1 < 2');
        // Anciennes cellules contenteditable v3
        assert.equal(cellText('<b>Boule</b>&nbsp;de feu &amp; co'), 'Boule de feu & co');
        assert.equal(cellText('Ligne 1<br>Ligne 2<div>3</div>'), 'Ligne 1 Ligne 2 3');
        assert.equal(cellText('&lt;niv. sup.&gt;'), '<niv. sup.>');
        assert.equal(cellText(null), '');
        assert.equal(cellText(undefined), '');
        assert.equal(cellText(2), '2');
    });

    test('looksLikeLegacyHtml', () => {
        assert.equal(looksLikeLegacyHtml('Texte simple'), false);
        assert.equal(looksLikeLegacyHtml('<span style="x">Sort</span>'), true);
        assert.equal(looksLikeLegacyHtml('<b>gras</b> <niv. sup.>'), false);
        assert.equal(looksLikeLegacyHtml('Feu &amp; glace'), true);
    });

    test('descToPlainText : <br> devient un retour à la ligne, aucune balise ne reste', () => {
        const text = descToPlainText(BASE[0].desc);
        assert.equal(text, 'Une traînée\nbrillante & chaude.');
        assert.ok(!text.includes('<'));
        assert.equal(descToPlainText('<a href="x">squelette</a> &#39;ok&#x27;'), "squelette 'ok'");
        assert.equal(descToPlainText('<img src=x onerror=alert(1)>Texte'), 'Texte');
        assert.equal(descToPlainText(''), '');
    });

    test('normalizeText ignore casse, accents et ligatures', () => {
        assert.equal(normalizeText('Éclair de SORCIÈRE'), 'eclair de sorciere');
        assert.equal(normalizeText('Œil'), 'oeil');
    });
});

describe('Noms et niveaux', () => {
    test('Sorts à plusieurs noms', () => {
        assert.deepEqual(spellNames(BASE[3]), ['Amis', 'Faux amis']);
        assert.equal(spellDisplayName(BASE[3]), 'Amis');
        assert.equal(spellDisplayName(BASE[0]), 'Boule de feu');
    });

    test('Libellé du niveau', () => {
        assert.equal(spellLevelLabel(0), 'Sort mineur');
        assert.equal(spellLevelLabel('3'), 'Niveau 3');
    });
});

describe('effectiveSpellClass : filtre de classe du grimoire', () => {
    test('Valeur choisie prioritaire', () => {
        assert.equal(effectiveSpellClass('cleric', 'wizard'), 'cleric');
    });
    test('Vide : classe du personnage si elle lance des sorts', () => {
        assert.equal(effectiveSpellClass('', 'wizard'), 'wizard');
        assert.equal(effectiveSpellClass('', 'warlock'), 'warlock');
        assert.equal(effectiveSpellClass('', 'paladin'), 'paladin');
    });
    test('Vide et classe non lanceuse ou inconnue : toutes les classes', () => {
        assert.equal(effectiveSpellClass('', 'barbarian'), '');
        assert.equal(effectiveSpellClass('', ''), '');
        assert.equal(effectiveSpellClass('n_importe_quoi', 'fighter'), '');
    });
});

describe('searchSpells : auto-complétion', () => {
    test('Insensible aux accents et à la casse', () => {
        assert.deepEqual(searchSpells(BASE, 'eclair').map(s => s.vo), ['Witch Bolt']);
        assert.deepEqual(searchSpells(BASE, 'ÉCLAIR').map(s => s.vo), ['Witch Bolt']);
    });
    test('Recherche aussi sur le nom anglais et les variantes', () => {
        assert.deepEqual(searchSpells(BASE, 'fireball').map(s => s.vo), ['Fireball']);
        assert.deepEqual(searchSpells(BASE, 'faux').map(s => s.vo), ['Friends']);
    });
    test('Filtre de classe', () => {
        assert.deepEqual(searchSpells(BASE, 'de', { classSlug: 'cleric' }).map(s => s.vo), ['Detect Magic']);
        assert.equal(searchSpells(BASE, 'boule', { classSlug: 'cleric' }).length, 0);
    });
    test('Les noms qui commencent par la saisie passent en premier', () => {
        const names = searchSpells(BASE, 'de').map(s => s.name);
        assert.equal(names[0], 'Détection de la magie');
        assert.ok(names.includes('Boule de feu'));
    });
    test('Limite et saisie vide', () => {
        assert.equal(searchSpells(BASE, 'e', { limit: 2 }).length, 2);
        assert.deepEqual(searchSpells(BASE, '   '), []);
        assert.deepEqual(searchSpells(null, 'feu'), []);
    });
    test('findSpellByName retrouve un sort par nom, variante ou nom anglais', () => {
        assert.equal(findSpellByName(BASE, '<b>boule de FEU</b>')?.vo, 'Fireball');
        assert.equal(findSpellByName(BASE, 'Faux amis')?.vo, 'Friends');
        assert.equal(findSpellByName(BASE, 'Witch Bolt')?.name, 'Éclair de sorcière');
        assert.equal(findSpellByName(BASE, 'Inconnu'), null);
        assert.equal(findSpellByName(BASE, ''), null);
    });
});

describe('spellToRow : un sort de la base devient une ligne v3', () => {
    test('Toutes les colonnes sont remplies, la note et les clés inconnues sont gardées', () => {
        const row = { ...EMPTY_SPELL, note: 'Ma note', prep: true, legacy_key: 'x' };
        const result = spellToRow(BASE[1], row);
        assert.deepEqual(result, {
            lvl: '1', name: 'Éclair de sorcière', time: 'Action', range: '18 m', note: 'Ma note',
            c: true, r: false, m: true, prep: true, school: 'Évocation', legacy_key: 'x'
        });
        assert.equal(row.name, '', 'la ligne d\'origine n\'est pas modifiée');
    });
    test('Rituel, sans composante matérielle, premier nom des variantes', () => {
        const ritual = spellToRow(BASE[2], EMPTY_SPELL);
        assert.equal(ritual.r, true);
        assert.equal(ritual.m, false);
        const friends = spellToRow(BASE[3], EMPTY_SPELL);
        assert.equal(friends.name, 'Amis');
        assert.equal(friends.lvl, '0');
        assert.equal(friends.m, true);
    });
    test('Les clés de la ligne restent exactement celles de EMPTY_SPELL', () => {
        assert.deepEqual(Object.keys(spellToRow(BASE[0], { ...EMPTY_SPELL })).sort(), Object.keys(EMPTY_SPELL).sort());
    });
});

describe('Lignes du tableau', () => {
    const rows = [
        { ...EMPTY_SPELL, lvl: '3', name: 'Boule de feu', school: 'Évocation', prep: true },
        { ...EMPTY_SPELL, lvl: '0', name: 'Amis', school: 'Enchantement', prep: true },
        { ...EMPTY_SPELL },
        { ...EMPTY_SPELL, lvl: '1', name: 'Détection de la magie', school: 'Divination', prep: false },
        { ...EMPTY_SPELL, lvl: '<b>1</b>', name: 'éclair de sorcière', school: 'Évocation', prep: true }
    ];

    test('rowLevel lit les anciens niveaux', () => {
        assert.equal(rowLevel(rows[4]), '1');
        assert.equal(rowLevel({ lvl: '' }), '0');
        assert.equal(rowLevel({ lvl: '12' }), '0');
    });

    test('Ligne vide et sort préparé (un sort mineur ne compte pas)', () => {
        assert.equal(isSpellRowEmpty(rows[2]), true);
        assert.equal(isSpellRowEmpty({ ...EMPTY_SPELL, range: '9 m' }), false);
        assert.equal(isPrepared(rows[0]), true);
        assert.equal(isPrepared(rows[1]), false);
        assert.equal(isPrepared({ prep: 'true', lvl: '1' }), false);
    });

    test('Filtre par niveau : les lignes vides restent visibles', () => {
        assert.deepEqual(rows.map(r => matchesLevelFilter(r, '1')), [false, false, true, true, true]);
        assert.ok(rows.every(r => matchesLevelFilter(r, '')));
    });

    test('Tri par niveau, nom, école ; lignes vides à la fin ; ordre stable', () => {
        assert.deepEqual(sortedSpellIndices(rows, { col: 'lvl', dir: 'asc' }), [1, 3, 4, 0, 2]);
        assert.deepEqual(sortedSpellIndices(rows, { col: 'lvl', dir: 'desc' }), [0, 3, 4, 1, 2]);
        assert.deepEqual(sortedSpellIndices(rows, { col: 'name', dir: 'asc' }), [1, 0, 3, 4, 2]);
        assert.deepEqual(sortedSpellIndices(rows, { col: 'school', dir: 'asc' }), [3, 1, 0, 4, 2]);
        assert.deepEqual(sortedSpellIndices(rows, { col: null }), [0, 1, 2, 3, 4]);
    });

    test('Le tri ne modifie pas le tableau enregistré', () => {
        const copy = structuredClone(rows);
        sortedSpellIndices(rows, { col: 'name', dir: 'desc' });
        assert.deepEqual(rows, copy);
    });

    test('Cycle de tri : croissant → décroissant → ordre enregistré', () => {
        let sort = { col: null, dir: 'asc' };
        sort = nextSort(sort, 'name');
        assert.deepEqual(sort, { col: 'name', dir: 'asc' });
        sort = nextSort(sort, 'name');
        assert.deepEqual(sort, { col: 'name', dir: 'desc' });
        sort = nextSort(sort, 'name');
        assert.equal(sort.col, null);
        assert.deepEqual(nextSort({ col: 'name', dir: 'desc' }, 'lvl'), { col: 'lvl', dir: 'asc' });
    });

    test('Compteurs et texte', () => {
        assert.deepEqual(spellCounts(rows), { total: 4, visible: 4, prepared: 2 });
        assert.deepEqual(spellCounts(rows, '1'), { total: 4, visible: 2, prepared: 2 });
        assert.equal(formatSpellCount(spellCounts(rows)), '4 sorts · 2 préparés');
        assert.equal(formatSpellCount(spellCounts(rows, '1'), true), '2 / 4 sorts · 2 préparés');
        assert.equal(formatSpellCount({ total: 1, visible: 1, prepared: 0 }), '1 sort · 0 préparé');
    });

    test('Nouvelle ligne : copie de EMPTY_SPELL au niveau du filtre actif', () => {
        const row = newSpellRow(EMPTY_SPELL, '2');
        assert.deepEqual(row, { ...EMPTY_SPELL, lvl: '2' });
        assert.notEqual(row, EMPTY_SPELL);
        assert.equal(newSpellRow(EMPTY_SPELL, '').lvl, '0');
        assert.equal(EMPTY_SPELL.lvl, '0');
    });
});

describe('Emplacements de sorts', () => {
    test('Maximum : valeur du manuel, sauf réglage manuel', () => {
        assert.equal(effectiveSlotMax({}, 1, 4), 4);
        assert.equal(effectiveSlotMax({ 1: { used: 2 } }, 1, 4), 4);
        assert.equal(effectiveSlotMax({ 1: { max: 5, used: 0 } }, '1', 4), 5);
        assert.equal(effectiveSlotMax({ 1: { max: 0, used: 0 } }, 1, 4), 0);
        assert.equal(effectiveSlotMax(undefined, 2, undefined), 0);
        assert.equal(effectiveSlotMax({ 1: { max: 99 } }, 1, 4), MAX_SLOTS_PER_LEVEL);
    });

    test('Utilisés bornés au maximum (niveau du personnage en baisse)', () => {
        assert.deepEqual(slotView({ 2: { used: 3 } }, 2, 2), { max: 2, used: 2 });
        assert.deepEqual(slotView({ 2: { used: 'x' } }, 2, 2), { max: 2, used: 0 });
    });

    test('Cocher / décocher une case : remplissage de gauche à droite', () => {
        const state = {};
        const a = toggleSlotUsed(state, 1, 2, true, 4);
        assert.deepEqual(a, { 1: { used: 3 } });
        assert.deepEqual(state, {}, 'état d\'origine inchangé');
        assert.deepEqual(toggleSlotUsed(a, 1, 1, false, 4), { 1: { used: 1 } });
        assert.deepEqual(toggleSlotUsed(a, 1, 0, false, 4), { 1: { used: 0 } });
        assert.deepEqual(toggleSlotUsed({ 1: { max: 2, used: 0 } }, 1, 5, true, 4), { 1: { max: 2, used: 2 } });
        const other = toggleSlotUsed({ 2: { used: 1 } }, 1, 0, true, 4);
        assert.deepEqual(other, { 1: { used: 1 }, 2: { used: 1 } });
    });

    test('Ajouter / retirer un emplacement, utilisés ramenés au maximum', () => {
        assert.deepEqual(adjustSlotMax({}, 1, 1, 4), { 1: { used: 0, max: 5 } });
        assert.deepEqual(adjustSlotMax({ 1: { used: 4 } }, 1, -1, 4), { 1: { used: 3, max: 3 } });
        assert.deepEqual(adjustSlotMax({ 1: { max: 0, used: 0 } }, 1, -1, 4), { 1: { used: 0, max: 0 } });
        assert.equal(adjustSlotMax({ 1: { max: MAX_SLOTS_PER_LEVEL } }, 1, 1, 4)[1].max, MAX_SLOTS_PER_LEVEL);
    });

    test('Revenir à la valeur du manuel efface le réglage manuel', () => {
        assert.deepEqual(adjustSlotMax({ 1: { max: 5, used: 1 } }, 1, -1, 4), { 1: { used: 1 } });
    });

    test('Niveaux suivis : ceux du manuel, avec la Magie de pacte pour l\'Occultiste', () => {
        const wizard = slotLevels(spellSlotsFor('Magicien', 3), 'wizard');
        assert.deepEqual(wizard.map(s => [s.level, s.rulebook, s.label]), [['1', 4, 'Niv. 1'], ['2', 2, 'Niv. 2']]);
        // Occultiste niveau 5 (PHB 2024) : 2 emplacements, tous du niveau 3
        const warlock = slotLevels(spellSlotsFor('Sorcier', 5), 'warlock');
        assert.deepEqual(warlock.map(s => [s.level, s.rulebook, s.pact]), [['3', 2, true]]);
        assert.equal(warlock[0].label, 'Magie de pacte (repos court) · niv. 3');
        assert.deepEqual(slotLevels(spellSlotsFor('Barbare', 5), 'barbarian'), []);
    });

    test('Niveaux ajoutés à la main (classe sans emplacements au manuel)', () => {
        const shown = slotLevels({}, 'fighter', { 1: { max: 2, used: 1 }, 2: { used: 1 } });
        assert.deepEqual(shown.map(s => [s.level, s.rulebook, s.pact]), [['1', 0, false]]);
        assert.equal(nextFreeSlotLevel(shown), '2');
        assert.equal(nextFreeSlotLevel([]), '1');
        assert.equal(nextFreeSlotLevel(['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(level => ({ level }))), '');
        // Retirer le dernier emplacement d'un niveau ajouté à la main le fait disparaître
        const removed = adjustSlotMax({ 1: { max: 1, used: 1 } }, 1, -1, 0);
        assert.deepEqual(slotLevels({}, 'fighter', removed), []);
    });
});

describe('Lignes affichées : les lignes vides restent dans la fiche sans être affichées', () => {
    const rows = [
        { ...EMPTY_SPELL },
        { ...EMPTY_SPELL, lvl: '3', name: 'Boule de feu', school: 'Évocation' },
        { ...EMPTY_SPELL, lvl: '2' },
        { ...EMPTY_SPELL, note: 'Sort du don Initié à la magie' },
        { ...EMPTY_SPELL, lvl: '0', name: 'Amis', school: 'Enchantement' },
        { ...EMPTY_SPELL, prep: true }
    ];

    test('hasSpellContent : un texte ou une case C / R / M, pas le niveau ni « préparé » seuls', () => {
        assert.deepEqual(rows.map(hasSpellContent), [false, true, false, true, true, false]);
        assert.equal(hasSpellContent({ ...EMPTY_SPELL, m: true }), true);
        assert.equal(hasSpellContent({ ...EMPTY_SPELL, school: '<b></b>&nbsp;' }), false);
        assert.equal(hasSpellContent({ ...EMPTY_SPELL, name: '  ' }), false);
        assert.equal(hasSpellContent(null), false);
        assert.equal(hasSpellContent('x'), false);
    });

    test('Sorts renseignés seulement, dans l\'ordre enregistré ou trié', () => {
        const view = spellRowsView(rows);
        assert.deepEqual([...view.shown].sort(), [1, 3, 4]);
        assert.equal(view.hasDraft, false);
        assert.deepEqual(view.order, [0, 1, 2, 3, 4, 5]);
        assert.deepEqual(spellRowsView(rows, { sort: { col: 'lvl', dir: 'asc' } }).order.slice(0, 2), [4, 1]);
    });

    test('Filtre de niveau : les sorts des autres niveaux sont masqués, une note seule reste', () => {
        assert.deepEqual([...spellRowsView(rows, { level: '3' }).shown].sort(), [1, 3]);
        assert.deepEqual([...spellRowsView(rows, { level: '5' }).shown], [3]);
    });

    test('Ligne épinglée (en cours de saisie) : affichée même vide ou hors filtre', () => {
        const view = spellRowsView(rows, { level: '3', pinned: [2] });
        assert.deepEqual([...view.shown].sort(), [1, 2, 3]);
        assert.equal(view.hasDraft, true);
        assert.equal(spellRowsView(rows, { level: '0', pinned: [1] }).shown.has(1), true);
    });

    test('Rien n\'est modifié (les lignes vides de la sauvegarde sont gardées telles quelles)', () => {
        const copy = structuredClone(rows);
        spellRowsView(rows, { level: '1', sort: { col: 'name', dir: 'desc' }, pinned: [0] });
        hasSpellContent(rows[0]);
        assert.deepEqual(rows, copy);
        assert.deepEqual(spellRowsView(undefined), { order: [], shown: new Set(), hasDraft: false });
    });
});

describe('Le personnage lance-t-il des sorts ? (présentation du grimoire)', () => {
    const status = (params) => spellcastingStatus(params);

    test('Classes de lanceurs de sorts : dès le niveau 1', () => {
        for (const classSlug of ['bard', 'cleric', 'druid', 'sorcerer', 'wizard', 'warlock', 'paladin', 'ranger']) {
            assert.equal(status({ classSlug, level: 1 }).casts, true, classSlug);
        }
        assert.equal(status({ classSlug: 'paladin', level: 1 }).source, 'class');
    });

    test('Classes sans magie : Barbare (Korgul), Guerrier, Moine, Roublard', () => {
        for (const classSlug of ['barbarian', 'fighter', 'monk', 'rogue', '']) {
            assert.deepEqual(status({ classSlug, level: 4, spellSlots: spellSlotsFor(classSlug, 4) }),
                { casts: false, source: '', unlockLevel: 0, subclassName: '' }, classSlug || 'sans classe');
        }
        assert.equal(status({ classSlug: 'barbarian', subclass: 'Voie du Zélote', level: 4 }).casts, false);
    });

    test('Chevalier occulte et Escroc arcanique : Incantation au niveau 3', () => {
        assert.deepEqual(SUBCLASS_SPELLCASTING, { eldritch_knight: 3, arcane_trickster: 3 });
        assert.deepEqual(status({ classSlug: 'fighter', subclass: 'Chevalier Occulte', level: 3 }),
            { casts: true, source: 'subclass', unlockLevel: 0, subclassName: '' });
        assert.equal(status({ classSlug: 'rogue', subclass: 'arcane trickster', level: 7 }).casts, true);
        assert.equal(status({ classSlug: 'rogue', subclass: '<b>Escroc arcanique</b>', level: 3 }).casts, true);
        assert.deepEqual(status({ classSlug: 'fighter', subclass: 'Chevalier Occulte', level: 2 }),
            { casts: false, source: '', unlockLevel: 3, subclassName: 'Chevalier Occulte' });
        // Sous-classe d'une autre classe : sans effet
        assert.equal(status({ classSlug: 'barbarian', subclass: 'Chevalier Occulte', level: 5 }).casts, false);
        assert.equal(status({ classSlug: 'fighter', subclass: 'Champion', level: 5 }).casts, false);
    });

    test('Emplacements de la classe ou suivis à la main', () => {
        assert.equal(status({ classSlug: '', spellSlots: { 1: 2 } }).casts, true);
        assert.deepEqual(status({ classSlug: 'fighter', level: 2, slotState: { 1: { max: 2, used: 0 } } }),
            { casts: true, source: 'slots', unlockLevel: 0, subclassName: '' });
        // Cases cochées sans maximum réglé (ancien suivi) : pas de magie pour autant
        assert.equal(status({ classSlug: 'fighter', level: 2, slotState: { 1: { used: 1 } } }).casts, false);
        assert.equal(status().casts, false);
    });

    test('Grimoire complet, court avis ou ouvert à la demande', () => {
        assert.equal(grimoireView(true, false, false), 'full');
        assert.equal(grimoireView(false, true, false), 'full');
        assert.equal(grimoireView(true, true, true), 'full');
        assert.equal(grimoireView(false, false, false), 'quiet');
        assert.equal(grimoireView(false, false, true), 'open');
    });
});
