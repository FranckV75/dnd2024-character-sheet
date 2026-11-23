// Outils du manuel et case « Outils » (js/data/tools.js, js/rules/tools.js)
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { TOOLS, TOOL_CATEGORIES, BACKGROUND_TOOLS } from '../js/data/tools.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { ABILITY_IDS } from '../js/data/constants.js';
import {
    toolsInText, addToolToText, removeToolFromText, backgroundToolExpectation, expectedToolNoted,
    matchesToolQuery, toolGroups, toolAbilityName
} from '../js/rules/tools.js';
import {
    backgroundSummary, backgroundTool, backgroundApplyPatch, backgroundToolNoted, backgroundApplyConfirm,
    backgroundAppliedMessage
} from '../js/rules/background.js';
import { STATUS_ROOM } from '../js/data/status-bar.js';

const byId = (id) => TOOLS.find((tool) => tool.id === id);

describe('Données des outils', () => {
    test('37 outils : 17 d\'artisan, 6 autres, 4 boîtes de jeux, 10 instruments', () => {
        const count = (category) => TOOLS.filter((tool) => tool.category === category).length;
        assert.equal(TOOLS.length, 37);
        assert.deepEqual(TOOL_CATEGORIES.map((c) => [c.id, count(c.id)]),
            [['artisan', 17], ['other', 6], ['gaming', 4], ['instrument', 10]]);
    });

    test('Chaque outil : identifiant et nom uniques, catégorie et caractéristique connues, usage court', () => {
        assert.equal(new Set(TOOLS.map((t) => t.id)).size, TOOLS.length);
        assert.equal(new Set(TOOLS.map((t) => t.name)).size, TOOLS.length);
        for (const tool of TOOLS) {
            assert.ok(TOOL_CATEGORIES.some((c) => c.id === tool.category), tool.name);
            assert.ok(ABILITY_IDS.includes(tool.ability), tool.name);
            assert.ok(tool.use && tool.use.split(/\s+/).length <= 6, tool.name);
        }
    });

    test('Caractéristiques : jeux = Sagesse, instruments = Charisme, voleur = Dextérité', () => {
        assert.ok(TOOLS.filter((t) => t.category === 'gaming').every((t) => t.ability === 'wis'));
        assert.ok(TOOLS.filter((t) => t.category === 'instrument').every((t) => t.ability === 'cha'));
        assert.equal(toolAbilityName(byId('thieves')), 'Dextérité');
        assert.equal(toolAbilityName(byId('smith')), 'Force');
    });

    test('Chaque nom et chaque autre écriture se reconnaît lui-même, et seulement lui', () => {
        for (const tool of TOOLS) {
            for (const name of [tool.name, ...(tool.aliases ?? [])]) {
                assert.deepEqual(toolsInText(name), [tool.id], name);
            }
        }
    });

    test('Chaque historique a un outil connu, et son nom français correspond', () => {
        for (const background of Object.values(DD_RULES.backgrounds)) {
            const expectation = backgroundToolExpectation(background.toolProfs[0]);
            assert.ok(expectation, background.nameFr);
            if (expectation.toolId) assert.equal(expectation.label, background.toolFr, background.nameFr);
            else assert.equal(expectation.label.toLowerCase(), background.toolFr.toLowerCase(), background.nameFr);
        }
        assert.ok(Object.keys(BACKGROUND_TOOLS).length >= 10);
    });
});

describe('Reconnaître les outils dans la case', () => {
    test('Accents, majuscules et apostrophes ignorés ; ordre du texte', () => {
        assert.deepEqual(toolsInText('OUTILS DE VOLEUR, materiel d’herboriste'), ['thieves', 'herbalism']);
        assert.deepEqual(toolsInText('flute de pan et luth'), ['pan-flute', 'lute']);
    });

    test('Au milieu d\'un texte libre et d\'une mise en forme', () => {
        assert.deepEqual(toolsInText('Appris chez mon oncle : <b>Outils de forgeron</b> (depuis 3 ans)'), ['smith']);
        assert.deepEqual(toolsInText('<div>Out<i>ils de</i>&nbsp;voleur</div><div>Luth</div>'), ['thieves', 'lute']);
    });

    test('Mot entier seulement : « Cor » n\'est pas dans « cordonnier », « Flûte » pas dans « Flûte de pan »', () => {
        assert.deepEqual(toolsInText('Outils de cordonnier'), ['cobbler']);
        assert.deepEqual(toolsInText('Flûte de pan'), ['pan-flute']);
        assert.deepEqual(toolsInText('Cornemuse'), ['bagpipes']);
        assert.deepEqual(toolsInText('Cor'), ['horn']);
    });

    test('Pluriel ou singulier proche : même outil (pas de doublon en cochant)', () => {
        assert.deepEqual(toolsInText('Outils de voleurs, Kit de déguisement, Instrument : luth'), ['thieves', 'disguise', 'lute']);
        assert.deepEqual(toolsInText('Outil de voleur, luths, carte à jouer, Jeux de cartes'), ['thieves', 'lute', 'cards']);
        assert.deepEqual(toolsInText('Flûtes de pan'), ['pan-flute']);
        assert.equal(addToolToText('Outils de voleurs<br>Luth', 'thieves'), 'Outils de voleurs<br>Luth');
        assert.equal(removeToolFromText('<div>Outils de voleurs</div><div>Luth</div>', 'thieves'), '<div>Luth</div>');
        assert.equal(expectedToolNoted('Outils de voleurs', backgroundToolExpectation("Thieves' Tools")), true);
        // Les mots courts ne changent pas : « des » n'est pas « de », « Jeu de de » n'est pas « Jeu de dés »
        assert.deepEqual(toolsInText('Outils des voleurs, cordes, Jeu de de'), []);
    });

    test('« Dés » seulement avec son accent (pas le mot « des »)', () => {
        assert.deepEqual(toolsInText('Outils des voleurs'), []);
        assert.deepEqual(toolsInText('dés'), ['dice']);
        assert.deepEqual(toolsInText('Des pipés'), []);
        assert.deepEqual(toolsInText('DES'), []);
        assert.deepEqual(toolsInText('DÉS'), ['dice']);
        assert.deepEqual(toolsInText('Jeu de des'), ['dice']);
    });

    test('Texte importé : lettres accentuées écrites en entités', () => {
        assert.deepEqual(toolsInText('Mat&eacute;riel d&rsquo;herboriste, D&eacute;s, Fl&ucirc;te'), ['herbalism', 'dice', 'flute']);
        assert.equal(removeToolFromText('Mat&eacute;riel de peintre, Luth', 'painter'), 'Luth');
    });

    test('Rien de reconnu dans un texte sans outil, une case vide ou absente', () => {
        assert.deepEqual(toolsInText('Véhicules terrestres, cartes marines'), []);
        assert.deepEqual(toolsInText(''), []);
        assert.deepEqual(toolsInText(undefined), []);
        assert.deepEqual(toolsInText('<br>'), []);
    });
});

describe('Ajouter un outil', () => {
    test('Case vide (ou seulement un retour à la ligne) : le nom seul', () => {
        assert.equal(addToolToText('', 'lute'), 'Luth');
        assert.equal(addToolToText('<br>', 'lute'), 'Luth');
        assert.equal(addToolToText(undefined, 'thieves'), 'Outils de voleur');
    });

    test('Liste à virgules : à la suite, après une virgule', () => {
        assert.equal(addToolToText('Luth', 'lyre'), 'Luth, Lyre');
        assert.equal(addToolToText('Luth, Outils de voleur', 'lyre'), 'Luth, Outils de voleur, Lyre');
        assert.equal(addToolToText('Luth, ', 'lyre'), 'Luth, Lyre');
        assert.equal(addToolToText('Mes outils :', 'lyre'), 'Mes outils : Lyre');
        assert.equal(addToolToText('Luth<br>', 'lyre'), 'Luth, Lyre<br>');
    });

    test('Une ligne par outil : nouvelle ligne du même genre', () => {
        assert.equal(addToolToText('Luth<br>Lyre', 'drum'), 'Luth<br>Lyre<br>Tambour');
        assert.equal(addToolToText('Luth<div>Lyre</div>', 'drum'), 'Luth<div>Lyre</div><div>Tambour</div>');
        assert.equal(addToolToText('<p>Luth</p><p>Lyre</p>', 'drum'), '<p>Luth</p><p>Lyre</p><p>Tambour</p>');
        assert.equal(addToolToText('<div>Luth</div><div>Lyre</div><div><br></div>', 'drum'),
            '<div>Luth</div><div>Lyre</div><div>Tambour</div><div><br></div>');
    });

    test('Retour à la ligne tapé avec Maj+Entrée (caractère brut) : une ligne par outil aussi', () => {
        assert.equal(addToolToText('Luth\nLyre', 'drum'), 'Luth\nLyre\nTambour');
        assert.equal(addToolToText('Luth\nLyre\n', 'drum'), 'Luth\nLyre\nTambour\n');
        assert.equal(addToolToText('Luth\r\nLyre', 'drum'), 'Luth\r\nLyre\r\nTambour');
        assert.equal(addToolToText('Luth<br>Lyre\nViole', 'drum'), 'Luth<br>Lyre\nViole\nTambour');
        assert.equal(addToolToText('Notes\nLuth, Lyre', 'drum'), 'Notes\nLuth, Lyre, Tambour');
        assert.deepEqual(toolsInText('Luth\nOutils de voleur\nLyre'), ['lute', 'thieves', 'lyre']);
    });

    test('Séparateur du joueur gardé (« ; », « / ») ; pas de virgule après une phrase finie', () => {
        assert.equal(addToolToText('Luth ; Dés', 'lyre'), 'Luth ; Dés ; Lyre');
        assert.equal(addToolToText('Luth; Dés', 'lyre'), 'Luth; Dés; Lyre');
        assert.equal(addToolToText('Luth / Dés', 'lyre'), 'Luth / Dés / Lyre');
        assert.equal(addToolToText('Luth/Dés', 'lyre'), 'Luth/Dés/Lyre');
        assert.equal(addToolToText('Luth, Dés; un jour une viole', 'lyre'), 'Luth, Dés; un jour une viole, Lyre');
        assert.equal(addToolToText('Aucun.', 'drum'), 'Aucun. Tambour');
    });

    test('Liste à puces ou à tirets : la nouvelle ligne prend la même puce', () => {
        assert.equal(addToolToText('- Luth<br>- Lyre', 'drum'), '- Luth<br>- Lyre<br>- Tambour');
        assert.equal(addToolToText('- Luth<div>- Lyre</div>', 'drum'), '- Luth<div>- Lyre</div><div>- Tambour</div>');
        assert.equal(addToolToText('• Luth\n• Lyre', 'drum'), '• Luth\n• Lyre\n• Tambour');
        assert.equal(removeToolFromText(addToolToText('- Luth<br>- Lyre', 'drum'), 'drum'), '- Luth<br>- Lyre');
    });

    test('Paragraphes mis en forme : la nouvelle ligne reprend le style de la dernière', () => {
        assert.equal(addToolToText('<p style="text-align: center">Luth</p><p style="text-align: center">Lyre</p>', 'drum'),
            '<p style="text-align: center">Luth</p><p style="text-align: center">Lyre</p><p style="text-align: center">Tambour</p>');
    });

    test('Plusieurs lignes dont la dernière est une liste à virgules : à la suite de cette liste', () => {
        assert.equal(addToolToText('Appris à l\'armée<br>Luth, Lyre', 'drum'), 'Appris à l\'armée<br>Luth, Lyre, Tambour');
    });

    test('La mise en forme et le texte déjà là ne bougent pas', () => {
        assert.equal(addToolToText('<font color="#ff0000">Luth</font>', 'lyre'), '<font color="#ff0000">Luth, Lyre</font>');
        assert.equal(addToolToText('Don de mon père &amp; fils', 'lyre'), 'Don de mon père &amp; fils, Lyre');
        assert.equal(addToolToText('<font color="#ff0000"><b>Luth</b></font>', 'lyre'), '<font color="#ff0000"><b>Luth, Lyre</b></font>');
    });

    test("Un seul mot en gras ou en couleur en fin de texte : la suite n'est pas en gras", () => {
        assert.equal(addToolToText('Chariots, <b>Luth</b>', 'lyre'), 'Chariots, <b>Luth</b>, Lyre');
        assert.equal(addToolToText('<i>Chariots, <b>Luth</b></i>', 'lyre'), '<i>Chariots, <b>Luth</b>, Lyre</i>');
        assert.equal(addToolToText('Chariots<br>Tambour <b>Luth</b>', 'lyre'), 'Chariots<br>Tambour <b>Luth</b><br>Lyre');
        assert.equal(addToolToText('Chariots<br><b>Luth</b>', 'lyre'), 'Chariots<br><b>Luth<br>Lyre</b>');
    });

    test('Outil déjà écrit (même autrement) ou inconnu : rien ne change', () => {
        assert.equal(addToolToText('luth', 'lute'), 'luth');
        assert.equal(addToolToText('Kit d\'herboriste', 'herbalism'), 'Kit d\'herboriste');
        assert.equal(addToolToText('Luth', 'inconnu'), 'Luth');
    });
});

describe('Retirer un outil', () => {
    test('Dans une liste à virgules : le nom et une seule virgule', () => {
        assert.equal(removeToolFromText('Luth, Lyre, Tambour', 'lute'), 'Lyre, Tambour');
        assert.equal(removeToolFromText('Luth, Lyre, Tambour', 'lyre'), 'Luth, Tambour');
        assert.equal(removeToolFromText('Luth, Lyre, Tambour', 'drum'), 'Luth, Lyre');
        assert.equal(removeToolFromText('Luth', 'lute'), '');
    });

    test('Avec « et »', () => {
        assert.equal(removeToolFromText('Luth et Lyre', 'lute'), 'Lyre');
        assert.equal(removeToolFromText('Luth et Lyre', 'lyre'), 'Luth');
        assert.equal(removeToolFromText('Luth, Lyre et Tambour', 'lyre'), 'Luth et Tambour');
        assert.equal(removeToolFromText('Luth, Lyre et Tambour', 'drum'), 'Luth, Lyre');
    });

    test('Une ligne par outil : la ligne part, pas les autres', () => {
        assert.equal(removeToolFromText('Luth<br>Lyre<br>Tambour', 'lyre'), 'Luth<br>Tambour');
        assert.equal(removeToolFromText('Luth<br>Lyre', 'lyre'), 'Luth');
        assert.equal(removeToolFromText('Luth<div>Lyre</div><div>Tambour</div>', 'lyre'), 'Luth<div>Tambour</div>');
        assert.equal(removeToolFromText('Luth<div>Lyre</div><div>Tambour</div>', 'lute'), '<div>Lyre</div><div>Tambour</div>');
        assert.equal(removeToolFromText('<p>Luth</p><p><br></p><p>Lyre</p>', 'lyre'), '<p>Luth</p><p><br></p>');
    });

    test('Retour à la ligne tapé avec Maj+Entrée : la ligne part, sans laisser de ligne vide', () => {
        assert.equal(removeToolFromText('Luth\nLyre', 'lute'), 'Lyre');
        assert.equal(removeToolFromText('Luth\nLyre', 'lyre'), 'Luth');
        assert.equal(removeToolFromText('Luth\nLyre\nTambour', 'lyre'), 'Luth\nTambour');
        assert.equal(removeToolFromText(addToolToText('Luth\nLyre', 'drum'), 'lute'), 'Lyre\nTambour');
    });

    test('Liste à puces, à tirets ou numérotée : la puce part avec sa ligne', () => {
        assert.equal(removeToolFromText('- Luth<br>- Lyre', 'lute'), '- Lyre');
        assert.equal(removeToolFromText('• Luth<br>• Lyre', 'lyre'), '• Luth');
        assert.equal(removeToolFromText('- Luth<div>- Lyre</div>', 'lute'), '<div>- Lyre</div>');
        assert.equal(removeToolFromText('- Luth<div>- Lyre</div>', 'lyre'), '- Luth');
        assert.equal(removeToolFromText('<div>- Luth</div><div>- Lyre</div>', 'lute'), '<div>- Lyre</div>');
        assert.equal(removeToolFromText('1. Luth\n2. Lyre', 'lute'), '2. Lyre');
        assert.equal(removeToolFromText('- Luth, Lyre<br>- Dés', 'lute'), '- Lyre<br>- Dés');
    });

    test('La ligne ne part que si elle est vide : pas de lignes recollées, pas de ligne vide en tête', () => {
        assert.equal(removeToolFromText('Notes Luth<br>Lyre', 'lute'), 'Notes <br>Lyre');
        assert.equal(removeToolFromText('Luth<br><br>Lyre', 'lute'), 'Lyre');
        assert.equal(removeToolFromText('Dés<br>Luth<br><br>Lyre', 'lute'), 'Dés<br><br>Lyre');
    });

    test('Autres séparateurs : « ; », « / », « , et »', () => {
        assert.equal(removeToolFromText('Luth ; Dés', 'dice'), 'Luth');
        assert.equal(removeToolFromText('Luth / Dés', 'lute'), 'Dés');
        assert.equal(removeToolFromText('Luth/Dés', 'dice'), 'Luth');
        assert.equal(removeToolFromText('Luth, et Lyre', 'lyre'), 'Luth');
        assert.equal(removeToolFromText('Luth, et Lyre', 'lute'), 'Lyre');
    });

    test('Précision entre parenthèses après le nom : elle reste à sa place, avec sa virgule', () => {
        assert.equal(removeToolFromText('Chariots, Luth (offert)', 'lute'), 'Chariots,  (offert)');
        assert.equal(removeToolFromText('Luth (offert par Mira), Dés', 'lute'), '(offert par Mira), Dés');
        assert.equal(removeToolFromText('Cartes à jouer (x2), Outils de forgeron (expertise)', 'smith'), 'Cartes à jouer (x2),  (expertise)');
    });

    test('Le texte écrit à la main autour reste tel quel', () => {
        assert.equal(removeToolFromText('Appris chez mon oncle : Outils de forgeron (3 ans)', 'smith'), 'Appris chez mon oncle :  (3 ans)');
        assert.equal(removeToolFromText('Véhicules terrestres, Luth, <b>chariots</b>', 'lute'), 'Véhicules terrestres, <b>chariots</b>');
        assert.equal(removeToolFromText('<div>Luth (offert par Mira)</div><div>Lyre</div>', 'lute'), '<div>(offert par Mira)</div><div>Lyre</div>');
    });

    test('Mise en forme : les balises restent équilibrées, les balises vidées partent', () => {
        assert.equal(removeToolFromText('<b>Luth</b>, Lyre', 'lute'), 'Lyre');
        assert.equal(removeToolFromText('<b>Luth, <i>Lyre</i></b>', 'lyre'), '<b>Luth</b>');
        assert.equal(removeToolFromText('<font color="#ff0000">Luth, Lyre</font>', 'lute'), '<font color="#ff0000">Lyre</font>');
    });

    test('Seulement ce nom précis : « Flûte » ne touche pas « Flûte de pan »', () => {
        assert.equal(removeToolFromText('Flûte de pan, Flûte', 'flute'), 'Flûte de pan');
        assert.equal(removeToolFromText('Flûte de pan, Flûte', 'pan-flute'), 'Flûte');
        assert.equal(removeToolFromText('Outils de cordonnier', 'horn'), 'Outils de cordonnier');
    });

    test('Outil écrit deux fois ou sous un autre nom : tout part, la case se décoche', () => {
        assert.equal(removeToolFromText('Luth, Lyre, luth', 'lute'), 'Lyre');
        assert.equal(removeToolFromText('Kit d\'herboriste, Lyre', 'herbalism'), 'Lyre');
    });

    test('Outil absent : texte rendu tel quel, au caractère près', () => {
        const text = '<div>Luth  </div><b></b>';
        assert.equal(removeToolFromText(text, 'lyre'), text);
    });

    test('Ajouter puis retirer redonne le texte de départ', () => {
        for (const start of ['', 'Luth', 'Luth, Lyre', 'Luth<br>Lyre', 'Luth\nLyre', 'Luth<div>Lyre</div>', '<p>Luth</p><p>Lyre</p>', 'Texte libre sans outil']) {
            assert.equal(removeToolFromText(addToolToText(start, 'thieves'), 'thieves'), start, start);
        }
    });
});

describe('Outil de l\'historique', () => {
    test('Outil précis ou catégorie au choix', () => {
        assert.deepEqual(backgroundToolExpectation("Thieves' Tools"), { toolId: 'thieves', categoryId: 'other', label: 'Outils de voleur' });
        assert.deepEqual(backgroundToolExpectation('Gaming Set'), { toolId: null, categoryId: 'gaming', label: 'un type de boîte de jeux au choix' });
        assert.equal(backgroundToolExpectation('Inconnu'), null);
        assert.deepEqual(backgroundTool({ char_background: 'Soldat' }),
            { background: 'Soldat', toolId: null, categoryId: 'gaming', label: 'un type de boîte de jeux au choix' });
        assert.equal(backgroundTool({ char_background: '' }), null);
    });

    test('Noté dans la case : l\'outil attendu, ou un outil de la catégorie', () => {
        const thieves = backgroundToolExpectation("Thieves' Tools");
        const gaming = backgroundToolExpectation('Gaming Set');
        assert.equal(expectedToolNoted('Luth, Outils de voleur', thieves), true);
        assert.equal(expectedToolNoted('Luth', thieves), false);
        assert.equal(expectedToolNoted('Échecs draconiques', gaming), true);
        assert.equal(expectedToolNoted('Luth', gaming), false);
        assert.equal(expectedToolNoted('Luth', null), false);
    });

    test('« À vérifier » disparaît dès que la fenêtre a écrit l\'outil dans la case', () => {
        const check = (background, tools) => backgroundSummary({ char_background: background, profs_tools: tools })
            .lines.find((line) => line.id === 'tool').check;
        assert.ok(check('Soldat', ''));
        for (const tool of TOOLS.filter((t) => t.category === 'gaming')) {
            assert.equal(check('Soldat', addToolToText('Luth', tool.id)), undefined, tool.name);
        }
        for (const tool of TOOLS.filter((t) => t.category === 'instrument')) {
            assert.equal(check('Artiste', addToolToText('', tool.id)), undefined, tool.name);
        }
        for (const tool of TOOLS.filter((t) => t.category === 'artisan')) {
            assert.equal(check('Artisan', addToolToText('', tool.id)), undefined, tool.name);
        }
        for (const [id, background] of Object.entries(DD_RULES.backgrounds)) {
            const expectation = backgroundToolExpectation(background.toolProfs[0]);
            if (!expectation.toolId) continue;
            assert.equal(check(id, addToolToText('', expectation.toolId)), undefined, background.nameFr);
            assert.ok(check(id, removeToolFromText(addToolToText('Lyre', expectation.toolId), expectation.toolId)), background.nameFr);
        }
    });

    test('Noté ou non (reconnaissance large de l\'encadré Historique)', () => {
        assert.equal(backgroundToolNoted({ char_background: 'Sage', profs_tools: 'Calligraphie' }), true);
        assert.equal(backgroundToolNoted({ char_background: 'Sage', profs_tools: 'Luth' }), false);
        assert.equal(backgroundToolNoted({ char_background: 'Soldat', profs_tools: 'Jeux de hasard' }), true);
        assert.equal(backgroundToolNoted({ profs_tools: 'Luth' }), false);
    });
});

describe('« Appliquer à la fiche » et l\'outil de l\'historique', () => {
    const isPrecise = ([, background]) => Boolean(backgroundToolExpectation(background.toolProfs[0]).toolId);
    const PRECISE = Object.entries(DD_RULES.backgrounds).filter(isPrecise);
    const CHOICE = Object.entries(DD_RULES.backgrounds).filter((entry) => !isPrecise(entry));
    const toolLine = (record) => backgroundSummary(record).lines.find((line) => line.id === 'tool');
    /** Fiche où il ne reste que l'outil à régler */
    const settled = (id, extra = {}) => {
        const background = DD_RULES.backgrounds[id];
        return {
            char_background: id, feat_1: background.featId,
            ...Object.fromEntries(background.skillProfs.map((skill) => [`skill_prof_${skill}`, true])), ...extra
        };
    };

    test('Onze historiques à outil précis, cinq à outil au choix', () => {
        assert.equal(PRECISE.length, 11);
        assert.deepEqual(CHOICE.map(([id]) => id).sort(), ['artisan', 'entertainer', 'guard', 'noble', 'soldier']);
    });

    test('Outil précis, case vide : le nom du manuel est écrit, et la ligne Outil n\'est plus « À vérifier »', () => {
        for (const [id, background] of PRECISE) {
            const record = settled(id);
            const summary = backgroundSummary(record);
            assert.equal(summary.canApply, true, background.nameFr);
            assert.equal(summary.writesTool, true, background.nameFr);
            assert.deepEqual(summary.applyText, [`noter ${background.toolFr} dans la case Outils`], background.nameFr);
            const patch = backgroundApplyPatch(record);
            assert.deepEqual(patch, { profs_tools: background.toolFr }, background.nameFr);
            const after = { ...record, ...patch };
            assert.equal(toolLine(after).check, undefined, background.nameFr);
            assert.equal(backgroundSummary(after).canApply, false, background.nameFr);
            // Une seconde fois : plus rien à faire, donc jamais de doublon
            assert.deepEqual(backgroundApplyPatch(after), {}, background.nameFr);
        }
    });

    test('Ce que le joueur a écrit reste tel quel : le nom s\'ajoute à la suite, dans la même présentation', () => {
        const apply = (text) => backgroundApplyPatch(settled('criminal', { profs_tools: text })).profs_tools;
        assert.equal(apply('Luth'), 'Luth, Outils de voleur');
        assert.equal(apply('Luth ; Dés'), 'Luth ; Dés ; Outils de voleur');
        assert.equal(apply('<div>Luth</div><div>Lyre</div>'), '<div>Luth</div><div>Lyre</div><div>Outils de voleur</div>');
        assert.equal(apply('Appris chez mon oncle : <b>Outils de forgeron</b> (depuis 3 ans)'),
            'Appris chez mon oncle : <b>Outils de forgeron</b> (depuis 3 ans), Outils de voleur');
        for (const text of ['Luth', 'Luth, Lyre', 'Luth<br>Lyre', '<p>Luth</p><p>Lyre</p>', 'Texte libre sans outil', '<font color="#ff0000">Chariots</font>']) {
            const next = apply(text);
            assert.equal(removeToolFromText(next, 'thieves'), text, text);
            assert.deepEqual(toolsInText(next), [...toolsInText(text), 'thieves'], text);
        }
    });

    test('Outil déjà noté, sous n\'importe quelle écriture : la case n\'est pas touchée', () => {
        for (const text of ['Outils de voleur', 'Luth, outils de voleurs', '<b>OUTILS DE VOLEUR</b>', 'Outil de voleur (offert par la guilde)', 'Mon matériel de voleur']) {
            const record = settled('criminal', { profs_tools: text });
            assert.equal('profs_tools' in backgroundApplyPatch(record), false, text);
            assert.equal(backgroundSummary(record).writesTool, false, text);
            assert.equal(backgroundSummary(record).canApply, false, text);
        }
        // Écrit à la main autrement que dans la liste (Sage : « Calligraphie »)
        assert.equal('profs_tools' in backgroundApplyPatch(settled('sage', { profs_tools: 'Calligraphie' })), false);
    });

    test('Outil au choix : jamais écrit ; il reste à choisir dans la fenêtre des outils', () => {
        for (const [id, background] of CHOICE) {
            const record = settled(id);
            assert.equal('profs_tools' in backgroundApplyPatch({ char_background: id }), false, background.nameFr);
            assert.deepEqual(backgroundApplyPatch(record), {}, background.nameFr);
            const summary = backgroundSummary(record);
            assert.equal(summary.writesTool, false, background.nameFr);
            assert.equal(summary.canApply, false, background.nameFr);
            assert.equal(summary.toolChoice, backgroundToolExpectation(background.toolProfs[0]).label, background.nameFr);
            assert.ok(toolLine(record).check, background.nameFr);
        }
        // Une fois choisi, ou pour un outil précis : rien à choisir
        assert.equal(backgroundSummary(settled('soldier', { profs_tools: 'Dés' })).toolChoice, null);
        assert.equal(backgroundSummary(settled('criminal')).toolChoice, null);
    });

    test('Les autres clés de la fiche ne changent pas, et la fiche reçue n\'est pas modifiée', () => {
        const record = Object.freeze({ char_background: 'Criminel', profs_tools: 'Luth', profs_weapons: 'Dague', str_score: '12' });
        const patch = backgroundApplyPatch(record);
        assert.deepEqual(Object.keys(patch).sort(), ['feat_1', 'profs_tools', 'skill_prof_sleight_of_hand', 'skill_prof_stealth']);
        assert.equal(record.profs_tools, 'Luth');
    });

    test('Fenêtre de confirmation : dit ce qui sera écrit, et que rien n\'est retiré', () => {
        const confirm = (record) => backgroundApplyConfirm(backgroundSummary(record));
        assert.match(confirm({ char_background: 'Criminel', profs_tools: 'Luth' }),
            /^La fiche va cocher .+, choisir le don Vigilant au niveau 1 et noter Outils de voleur dans la case Outils\. Les caractéristiques ne changent pas, et rien de ce que vous avez écrit dans la case Outils n'est retiré\.$/);
        assert.match(confirm({ char_background: 'Criminel', profs_tools: 'Outils de voleur' }),
            /^La fiche va cocher .+ et choisir le don Vigilant au niveau 1\. Les caractéristiques et les outils ne changent pas\.$/);
        assert.match(confirm({ char_background: 'Soldat', feat_1: 'sauvagerie_martiale' }),
            /^La fiche va cocher Athlétisme et Intimidation\. Les caractéristiques et les outils ne changent pas\. L'outil de l'historique \(un type de boîte de jeux au choix\) se choisit ensuite avec « Choisir dans la liste »\.$/);
        assert.equal(confirm(settled('sage')),
            "La fiche va noter Matériel de calligraphe dans la case Outils. Les caractéristiques ne changent pas, et rien de ce que vous avez écrit dans la case Outils n'est retiré.");
    });

    test('Message de la barre du haut : invite à choisir un outil au choix, et tient sur une ligne de tablette', () => {
        const applied = (record) => backgroundAppliedMessage(backgroundSummary({ ...record, ...backgroundApplyPatch(record) }));
        assert.equal(applied({ char_background: 'Criminel' }), 'Historique Criminel appliqué.');
        assert.equal(applied({ char_background: 'Artisan' }),
            'Historique Artisan appliqué. Outil au choix : bouton « Choisir dans la liste », ligne Outil.');
        assert.equal(applied({ char_background: 'Artisan', profs_tools: 'Outils de forgeron' }), 'Historique Artisan appliqué.');
        // Outil précis resté à noter (hors ligne, la case Outils n'est pas écrite)
        assert.equal(backgroundAppliedMessage(backgroundSummary(settled('sage'))),
            'Historique Sage appliqué. Outil à noter : bouton « Choisir dans la liste », ligne Outil.');
        for (const id of Object.keys(DD_RULES.backgrounds)) {
            assert.ok(applied({ char_background: id }).length <= STATUS_ROOM, id);
            assert.ok(backgroundAppliedMessage(backgroundSummary({ char_background: id })).length <= STATUS_ROOM, id);
        }
    });
});

describe('Fenêtre : groupes et recherche', () => {
    test('Groupes dans l\'ordre du manuel', () => {
        assert.deepEqual(toolGroups().map((g) => g.name), ["Outils d'artisan", 'Autres outils', 'Boîtes de jeux', 'Instruments de musique']);
        assert.equal(toolGroups().flatMap((g) => g.tools).length, TOOLS.length);
    });

    test('Recherche sans accents ni majuscules, par nom, autre écriture, catégorie ou caractéristique', () => {
        assert.equal(matchesToolQuery(byId('pan-flute'), 'FLUTE'), true);
        assert.equal(matchesToolQuery(byId('dragonchess'), 'echec'), true);
        assert.equal(matchesToolQuery(byId('herbalism'), 'kit'), true);
        assert.equal(matchesToolQuery(byId('lute'), 'instrument'), true);
        assert.equal(matchesToolQuery(byId('thieves'), 'dexterite'), true);
        assert.equal(matchesToolQuery(byId('lute'), 'voleur'), false);
        assert.equal(matchesToolQuery(byId('lute'), '  '), true);
    });
});
