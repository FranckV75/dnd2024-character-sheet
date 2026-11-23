// D'où viennent les outils du personnage : historique et dons (js/rules/tool-sources.js)
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { TOOLS, TOOL_CATEGORIES, FEAT_TOOLS, FAST_CRAFTING_TOOLS } from '../js/data/tools.js';
import { FEATS_DATA } from '../js/data/feats.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { toolsInText, addToolToText } from '../js/rules/tools.js';
import { featEffects } from '../js/rules/feat-effects.js';
import { createDefaultCharacter } from '../js/state/schema.js';
import {
    toolSources, toolSourceProgress, featuredToolSections, sectionProgress, toolProgressText
} from '../js/rules/tool-sources.js';

const byId = (id) => TOOLS.find((tool) => tool.id === id);
const idsOf = (category) => TOOLS.filter((tool) => tool.category === category).map((tool) => tool.id);
const tools = (...ids) => ids.reduce((text, id) => addToolToText(text, id), '');
const statuses = (record) => toolSourceProgress(toolSources(record), record).map((entry) => entry.status);

/** Fiche gelée : une règle qui la modifierait ferait échouer le test */
function frozen(record) {
    for (const value of Object.values(record)) if (value && typeof value === 'object') frozen(value);
    return Object.freeze(record);
}

describe('Dons qui donnent des outils (données)', () => {
    test('Les cinq dons du manuel : Chef cuisinier, Doué, Empoisonneur, Façonneur, Musicien', () => {
        assert.deepEqual(Object.keys(FEAT_TOOLS).sort(), ['chef_cuisinier', 'doue', 'empoisonneur', 'faconneur', 'musicien']);
        for (const id of Object.keys(FEAT_TOOLS)) assert.ok(Object.hasOwn(FEATS_DATA, id), id);
    });

    test('Aucun autre don de la fiche ne donne une maîtrise d\'outil (texte de chaque don)', () => {
        const grants = /Vous maîtrisez[^.]*\b(outils?|instruments?|ustensiles?|kit|matériel)\b/i;
        const found = Object.keys(FEATS_DATA).filter((id) => grants.test(FEATS_DATA[id].desc));
        assert.deepEqual(found.sort(), Object.keys(FEAT_TOOLS).sort());
    });

    test('Outils, catégories et nombres connus', () => {
        for (const [id, rule] of Object.entries(FEAT_TOOLS)) {
            if (rule.tool) assert.ok(byId(rule.tool), id);
            if (rule.tools) for (const toolId of rule.tools) assert.ok(byId(toolId), `${id} : ${toolId}`);
            if (rule.category) assert.ok(TOOL_CATEGORIES.some((category) => category.id === rule.category), id);
            if (rule.tools || rule.category) {
                assert.equal(rule.count, 3, id);
                assert.ok(rule.choice, id);
            }
        }
        assert.equal(byId(FEAT_TOOLS.chef_cuisinier.tool).name, 'Ustensiles de cuisinier');
        assert.equal(byId(FEAT_TOOLS.empoisonneur.tool).name, "Matériel d'empoisonneur");
    });

    test('Façonnage rapide : les huit outils d\'artisan de la table du don, sans doublon', () => {
        assert.equal(FAST_CRAFTING_TOOLS.length, 8);
        assert.equal(new Set(FAST_CRAFTING_TOOLS).size, 8);
        for (const id of FAST_CRAFTING_TOOLS) {
            assert.equal(byId(id).category, 'artisan', id);
            assert.ok(FEATS_DATA.faconneur.desc.includes(`<td>${byId(id).name}</td>`), byId(id).name);
        }
    });
});

describe('Sources : historique et dons', () => {
    test('Fiche sans historique ni don : aucune source', () => {
        assert.deepEqual(toolSources({}), []);
        assert.deepEqual(toolSources(undefined), []);
        assert.deepEqual(toolSources({ char_background: 'Pirate de l\'espace', feat_4: 'robuste', char_level: '5' }), []);
    });

    test('Historique : outil précis, ou catégorie où il se choisit', () => {
        assert.deepEqual(toolSources({ char_background: 'Criminel' }), [{
            id: 'background', kind: 'background', title: 'Historique (Criminel)', from: 'votre historique (Criminel)',
            label: 'Outils de voleur', toolId: 'thieves', toolIds: ['thieves'], categoryId: null, count: 1
        }]);
        const [soldier] = toolSources({ char_background: 'Soldat' });
        assert.equal(soldier.label, 'un type de boîte de jeux au choix');
        assert.equal(soldier.toolId, null);
        assert.equal(soldier.categoryId, 'gaming');
        assert.deepEqual(soldier.toolIds, idsOf('gaming'));
    });

    test('Chaque historique du manuel a sa source', () => {
        for (const [id, background] of Object.entries(DD_RULES.backgrounds)) {
            const sources = toolSources({ char_background: id });
            assert.equal(sources[0]?.kind, 'background', background.nameFr);
            assert.equal(sources[0].title, `Historique (${background.nameFr})`);
        }
    });

    test('Chef cuisinier et Empoisonneur : un outil précis', () => {
        const [chef, poisoner] = toolSources({ char_level: '8', feat_4: 'chef_cuisinier', feat_8: 'empoisonneur' });
        assert.deepEqual([chef.title, chef.label, chef.toolId, chef.count], ['Don Chef cuisinier (niveau 4)', 'Ustensiles de cuisinier', 'cook', 1]);
        assert.deepEqual([poisoner.title, poisoner.label, poisoner.toolId, poisoner.count],
            ['Don Empoisonneur (niveau 8)', "Matériel d'empoisonneur", 'poisoner', 1]);
        assert.deepEqual(poisoner.toolIds, ['poisoner']);
    });

    test('Façonneur : trois outils différents parmi les huit de la table Façonnage rapide', () => {
        const [crafter] = toolSources({ feat_1: 'faconneur' });
        assert.equal(crafter.id, 'feat:1:faconneur');
        assert.equal(crafter.title, 'Don Façonneur (niveau 1)');
        assert.equal(crafter.label, "trois outils d'artisan différents de la table Façonnage rapide");
        assert.equal(crafter.count, 3);
        assert.equal(crafter.toolId, null);
        assert.equal(crafter.categoryId, null, 'pas toute la catégorie : huit outils sur dix-sept');
        assert.deepEqual(crafter.toolIds, [...FAST_CRAFTING_TOOLS]);
    });

    test('Musicien : trois instruments de musique au choix', () => {
        const [musician] = toolSources({ feat_1: 'musicien' });
        assert.equal(musician.label, 'trois instruments de musique au choix');
        assert.equal(musician.count, 3);
        assert.equal(musician.categoryId, 'instrument');
        assert.deepEqual(musician.toolIds, idsOf('instrument'));
    });

    test('Doué : autant d\'outils que de menus réglés sur « Un outil », dans toute la liste', () => {
        const doue = (choice) => toolSources({ feat_1: 'doue', feat_choices: { 1: { doue: choice } } });
        const [two] = doue({ pick1: 'tool', pick2: 'stealth', pick3: 'tool' });
        assert.equal(two.count, 2);
        assert.equal(two.label, 'deux outils au choix, dans toute la liste');
        assert.equal(two.toolIds, null);
        assert.equal(doue({ pick1: 'tool' })[0].label, 'un outil au choix, dans toute la liste');
        assert.equal(doue({ pick1: 'tool', pick2: 'tool', pick3: 'tool' })[0].label, 'trois outils au choix, dans toute la liste');
        // Trois compétences : le don ne donne aucun outil
        assert.deepEqual(doue({ pick1: 'arcana', pick2: 'stealth', pick3: 'history' }), []);
    });

    test('Doué pas encore réglé : la source dit où le régler, sans rien compter', () => {
        const [open] = toolSources({ feat_1: 'doue' });
        assert.equal(open.count, 0);
        assert.match(open.label, /choisissez « Un outil » dans les menus du don \(onglet Aptitudes & Traits\)/);
        const [partial] = toolSources({ feat_1: 'doue', feat_choices: { 1: { doue: { pick1: 'arcana' } } } });
        assert.equal(partial.count, 0);
    });

    test('Doué pris deux fois : une source par emplacement ; un autre don noté deux fois ne compte qu\'une fois', () => {
        const twice = toolSources({
            char_level: '4', feat_1: 'doue', feat_4: 'doue',
            feat_choices: { 1: { doue: { pick1: 'tool' } }, 4: { doue: { pick1: 'tool', pick2: 'tool' } } }
        });
        assert.deepEqual(twice.map((source) => [source.id, source.count]), [['feat:1:doue', 1], ['feat:4:doue', 2]]);
        const human = toolSources({ char_species: 'Humain', feat_1: 'musicien', feat_0: 'musicien' });
        assert.equal(human.length, 1);
        assert.equal(human[0].title, 'Don Musicien (niveau 1)');
        assert.equal(toolSources({ char_species: 'Humain', feat_0: 'faconneur' })[0].title, 'Don Façonneur (niveau 1 (Humain))');
    });

    test('Don prévu pour plus tard (niveau pas atteint) : pas de source', () => {
        assert.deepEqual(toolSources({ char_level: '3', feat_4: 'chef_cuisinier' }), []);
        assert.equal(toolSources({ char_level: '4', feat_4: 'chef_cuisinier' }).length, 1);
    });

    test('Ordre : l\'historique, puis les dons dans l\'ordre de la fiche', () => {
        const sources = toolSources({ char_level: '4', char_background: 'Artisan', feat_4: 'chef_cuisinier', feat_1: 'faconneur' });
        assert.deepEqual(sources.map((source) => source.id), ['background', 'feat:1:faconneur', 'feat:4:chef_cuisinier']);
    });

    test('La fiche reçue n\'est jamais modifiée', () => {
        const record = frozen({
            char_level: '4', char_background: 'Artiste', feat_1: 'musicien', feat_4: 'doue', profs_tools: 'Luth, Lyre',
            feat_choices: { 4: { doue: { pick1: 'tool' } } }
        });
        const sources = toolSources(record);
        toolSourceProgress(sources, record);
        featuredToolSections(sources);
        assert.equal(record.profs_tools, 'Luth, Lyre');
    });
});

describe('Avancement : ce qui est noté dans la case Outils', () => {
    test('Mots de l\'avancement', () => {
        assert.equal(toolProgressText(0, 1, true), 'À noter');
        assert.equal(toolProgressText(1, 1, true), 'Noté');
        assert.equal(toolProgressText(0, 1, false), 'À choisir');
        assert.equal(toolProgressText(1, 1, false), 'Choisi');
        assert.equal(toolProgressText(2, 3, false), '2 sur 3');
        assert.equal(toolProgressText(5, 3, false), '3 sur 3');
        assert.equal(toolProgressText(0, 0, false), '');
    });

    test('Outil précis : noté ou non, sous toutes ses écritures', () => {
        assert.deepEqual(statuses({ char_background: 'Criminel' }), ['À noter']);
        assert.deepEqual(statuses({ char_background: 'Criminel', profs_tools: 'Luth' }), ['À noter']);
        assert.deepEqual(statuses({ char_background: 'Criminel', profs_tools: 'Luth, outils de voleurs' }), ['Noté']);
        assert.deepEqual(statuses({ char_level: '4', feat_4: 'empoisonneur', profs_tools: "Kit d'empoisonneur" }), ['Noté']);
    });

    test('Façonneur : seuls les outils de sa table comptent, trois au plus', () => {
        const crafter = (text) => statuses({ feat_1: 'faconneur', profs_tools: text });
        assert.deepEqual(crafter(''), ['0 sur 3']);
        assert.deepEqual(crafter(tools('smith', 'alchemist', 'lute')), ['1 sur 3']);
        assert.deepEqual(crafter(tools('smith', 'mason', 'potter')), ['3 sur 3']);
        assert.deepEqual(crafter(tools('smith', 'mason', 'potter', 'weaver')), ['3 sur 3']);
        const [progress] = toolSourceProgress(toolSources({ feat_1: 'faconneur' }), { profs_tools: tools('smith', 'mason', 'potter') });
        assert.equal(progress.done, true);
        assert.deepEqual(progress.toolIds, ['smith', 'mason', 'potter']);
    });

    test('Un outil noté ne compte qu\'une fois : Artiste et Musicien se partagent quatre instruments', () => {
        const bard = (text) => statuses({ char_background: 'Artiste', feat_1: 'musicien', profs_tools: text });
        assert.deepEqual(bard(''), ['À choisir', '0 sur 3']);
        assert.deepEqual(bard(tools('lute')), ['Choisi', '0 sur 3']);
        assert.deepEqual(bard(tools('lute', 'lyre', 'drum')), ['Choisi', '2 sur 3']);
        assert.deepEqual(bard(tools('lute', 'lyre', 'drum', 'viol')), ['Choisi', '3 sur 3']);
    });

    test('La source la plus étroite est servie d\'abord : Façonneur avant l\'outil d\'artisan de l\'historique', () => {
        const artisan = (text) => statuses({ char_background: 'Artisan', feat_1: 'faconneur', profs_tools: text });
        assert.deepEqual(artisan(tools('smith')), ['À choisir', '1 sur 3']);
        // Un outil d'artisan hors de la table ne peut compter que pour l'historique
        assert.deepEqual(artisan(tools('alchemist')), ['Choisi', '0 sur 3']);
        assert.deepEqual(artisan(tools('smith', 'mason', 'potter')), ['À choisir', '3 sur 3']);
        assert.deepEqual(artisan(tools('smith', 'mason', 'potter', 'weaver')), ['Choisi', '3 sur 3']);
        assert.deepEqual(artisan(tools('alchemist', 'smith', 'mason', 'potter')), ['Choisi', '3 sur 3']);
    });

    test('Outil précis d\'abord, puis les listes, puis « toute la liste » (Doué)', () => {
        // Fermier : Outils de charpentier, qui sont aussi dans la table de Façonneur
        const build = (text) => ({
            char_level: '4', char_background: 'Fermier', feat_1: 'faconneur', feat_4: 'doue',
            feat_choices: { 4: { doue: { pick1: 'tool', pick2: 'tool' } } }, profs_tools: text
        });
        assert.equal(DD_RULES.backgrounds.farmer.toolProfs[0], "Carpenter's Tools");
        assert.deepEqual(statuses(build(tools('carpenter'))), ['Noté', '0 sur 3', '0 sur 2']);
        assert.deepEqual(statuses(build(tools('carpenter', 'smith', 'lute'))), ['Noté', '1 sur 3', '1 sur 2']);
        assert.deepEqual(statuses(build(tools('carpenter', 'smith', 'mason', 'potter', 'weaver', 'lute'))), ['Noté', '3 sur 3', '2 sur 2']);
    });

    test('Doué pas encore réglé : rien à compter, pas d\'avancement', () => {
        const [progress] = toolSourceProgress(toolSources({ feat_1: 'doue' }), { feat_1: 'doue', profs_tools: 'Luth' });
        assert.deepEqual([progress.status, progress.done, progress.noted], ['', false, 0]);
    });

    test('Outil de l\'historique écrit à la main hors de la liste : compté, comme dans l\'encadré Historique', () => {
        assert.deepEqual(statuses({ char_background: 'Soldat', profs_tools: 'Jeux de hasard' }), ['Choisi']);
        assert.deepEqual(statuses({ char_background: 'Sage', profs_tools: 'Calligraphie' }), ['Noté']);
        assert.deepEqual(toolsInText('Jeux de hasard'), []);
    });
});

describe('Encadrés du haut de la fenêtre', () => {
    test('Un encadré par source : même titre qu\'avant pour l\'historique', () => {
        const [section] = featuredToolSections(toolSources({ char_background: 'Sage' }));
        assert.equal(section.title, 'Donné par votre historique (Sage) : Matériel de calligraphe');
        assert.deepEqual(section.toolIds, ['calligrapher']);
        assert.equal(section.categoryId, null);
        assert.equal(section.precise, true);
        const [gaming] = featuredToolSections(toolSources({ char_background: 'Soldat' }));
        assert.equal(gaming.title, 'Donné par votre historique (Soldat) : un type de boîte de jeux au choix');
        assert.equal(gaming.categoryId, 'gaming');
    });

    test('Dons : outil précis, liste de Façonneur dans l\'ordre du manuel', () => {
        const sections = featuredToolSections(toolSources({ char_level: '4', feat_1: 'faconneur', feat_4: 'chef_cuisinier' }));
        assert.deepEqual(sections.map((section) => section.title), [
            "Donné par votre don Façonneur (niveau 1) : trois outils d'artisan différents de la table Façonnage rapide",
            'Donné par votre don Chef cuisinier (niveau 4) : Ustensiles de cuisinier'
        ]);
        const order = TOOLS.map((tool) => tool.id).filter((id) => FAST_CRAFTING_TOOLS.includes(id));
        assert.deepEqual(sections[0].toolIds, order);
        assert.equal(sections[0].categoryId, null, 'la catégorie « Outils d\'artisan » reste entière plus bas');
    });

    test('Mêmes outils proposés : un seul encadré (Artiste et Musicien)', () => {
        const sources = toolSources({ char_background: 'Artiste', feat_1: 'musicien' });
        const sections = featuredToolSections(sources);
        assert.equal(sections.length, 1);
        assert.equal(sections[0].title,
            'Donnés par votre historique (Artiste) et votre don Musicien (niveau 1) : un instrument de musique au choix ; trois instruments de musique au choix');
        assert.deepEqual(sections[0].sourceIds, ['background', 'feat:1:musicien']);
        assert.equal(sections[0].categoryId, 'instrument');
        const progress = toolSourceProgress(sources, { char_background: 'Artiste', feat_1: 'musicien', profs_tools: tools('lute', 'lyre') });
        assert.deepEqual(sectionProgress(sections[0], progress), { done: false, status: '2 sur 4' });
        const all = toolSourceProgress(sources, { char_background: 'Artiste', feat_1: 'musicien', profs_tools: tools('lute', 'lyre', 'drum', 'viol') });
        assert.deepEqual(sectionProgress(sections[0], all), { done: true, status: '4 sur 4' });
    });

    test('Artisan et Façonneur : deux encadrés (dix-sept outils, puis les huit de la table)', () => {
        const sections = featuredToolSections(toolSources({ char_background: 'Artisan', feat_1: 'faconneur' }));
        assert.deepEqual(sections.map((section) => [section.toolIds.length, section.categoryId]), [[17, 'artisan'], [8, null]]);
    });

    test('Doué : pas d\'encadré (toute la liste) ; aucune source : aucun encadré', () => {
        const sources = toolSources({ feat_1: 'doue', feat_choices: { 1: { doue: { pick1: 'tool' } } } });
        assert.equal(sources.length, 1);
        assert.deepEqual(featuredToolSections(sources), []);
        assert.deepEqual(featuredToolSections([]), []);
    });

    test('Avancement d\'un encadré à une source : celui de la source', () => {
        const record = { char_background: 'Criminel', profs_tools: 'Outils de voleur' };
        const sources = toolSources(record);
        const [section] = featuredToolSections(sources);
        assert.deepEqual(sectionProgress(section, toolSourceProgress(sources, record)), { done: true, status: 'Noté' });
        assert.deepEqual(sectionProgress(section, toolSourceProgress(sources, { char_background: 'Criminel' })), { done: false, status: 'À noter' });
    });
});

describe('Rappels sous les dons : où noter leurs outils', () => {
    const hero = (extra = {}) => ({
        ...createDefaultCharacter(), char_class: 'Guerrier', char_level: '5', str_score: '16', dex_score: '14', con_score: '14', ...extra
    });
    const slotNotes = (character, level) => featEffects(character)[`featSlot:${level}`] ?? [];
    const pointsToWindow = (note) => note.text.includes('à noter dans la case Outils (onglet Compétences & Histoire, bouton « Choisir dans la liste »)');

    test('Chaque don qui donne des outils renvoie à la case Outils et à son bouton', () => {
        for (const id of Object.keys(FEAT_TOOLS)) {
            const level = FEATS_DATA[id].type === 'Général' ? 4 : 1;
            const character = hero({
                [`feat_${level}`]: id,
                ...(id === 'doue' ? { feat_choices: { [level]: { doue: { pick1: 'tool' } } } } : {})
            });
            assert.ok(slotNotes(character, level).some(pointsToWindow), id);
        }
    });

    test('Façonneur et Musicien : trois outils, dans les mots de la fenêtre', () => {
        assert.ok(slotNotes(hero({ feat_1: 'faconneur' }), 1)
            .some((note) => note.text.startsWith("Trois outils d'artisan différents de la table Façonnage rapide :")));
        assert.ok(slotNotes(hero({ feat_1: 'musicien' }), 1).some((note) => note.text.startsWith('Trois instruments de musique au choix :')));
    });

    test('Chef cuisinier et Empoisonneur : « À vérifier » tant que l\'outil n\'est pas noté, sous le nom du manuel', () => {
        const poisoner = slotNotes(hero({ feat_4: 'empoisonneur' }), 4).find(pointsToWindow);
        assert.equal(poisoner.check, true);
        assert.ok(poisoner.text.startsWith("Matériel d'empoisonneur : maîtrise"));
        const noted = slotNotes(hero({ feat_4: 'empoisonneur', profs_tools: "Matériel d'empoisonneur" }), 4);
        assert.ok(noted.some((note) => note.ticked && note.text === "Matériel d'empoisonneur : maîtrise notée dans la case Outils."));
        assert.ok(!noted.some(pointsToWindow));
        assert.ok(slotNotes(hero({ feat_4: 'chef_cuisinier' }), 4).some((note) => note.check && pointsToWindow(note)));
    });

    test('Table du Façonneur : « Façonnage rapide », nom du manuel français, partout', () => {
        assert.ok(FEATS_DATA.faconneur.desc.includes('de la table Façonnage rapide'));
        assert.ok(!Object.values(FEATS_DATA).some((feat) => feat.desc.includes('Fabrication rapide')));
        const effects = featEffects(hero({ feat_1: 'faconneur' }));
        const texts = [...effects['featSlot:1'], ...effects.rest].map((note) => note.text);
        assert.ok(texts.some((text) => text.includes('Façonnage rapide')));
        assert.ok(!texts.some((text) => text.includes('Fabrication rapide')));
    });
});
