/**
 * TESTS — MODE ODYSSÉE DÉSACTIVABLE (js/rules/odyssey.js)
 * Étude : docs/etudes/MODE_ODYSSEE.md. Réglage par fiche, actif par défaut : la clé facultative
 * « odyssey_mode » ne vaut "off" que si le joueur a décoché la case du menu « Gestion ».
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    ODYSSEY_MODE_KEY, ODYSSEY_SOURCE, ODYSSEY_MODE_LABEL, STATUS_ROOM, fromOdyssey,
    odysseyActive, setOdysseyModePatch, odysseyUse, odysseyKept, proposedSpecies, proposedSubclasses,
    hiddenFeatIds, odysseyBoxUseful, inspirationWording, odysseyModeHint, odysseyModeMessage
} from '../js/rules/odyssey.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { FEATS_DATA } from '../js/data/feats.js';
import { createDefaultCharacter, FEAT_SLOT_ORDER } from '../js/state/schema.js';
import { deriveCharacter } from '../js/rules/character.js';
import { featEffects } from '../js/rules/feat-effects.js';
import { planLevelUp } from '../js/rules/level-up.js';
import { V4_ONLY_KEYS, withoutV4State, comparableWithV3, fingerprint } from '../js/cloud/sync.js';
import { isBlankCharacter, sheetFingerprint } from '../js/cloud/controller.js';
import { migrateCharacter, normalizeCharacter } from '../js/state/migrate.js';
import { parseCharacterFile, serializeCharacter } from '../js/state/persistence.js';
import { takeSnapshot, readSnapshots } from '../js/state/snapshots.js';
import { createStore } from '../js/state/store.js';
import { ALL_FIXTURES, readFixture } from './helpers/fixtures.js';
import { HELP_SECTIONS } from '../js/data/help.js';
import { DEFAULT_BGS } from '../js/data/constants.js';

const sheet = (extra = {}) => ({ ...createDefaultCharacter(), char_name: 'Test', ...extra });
const OFF = { [ODYSSEY_MODE_KEY]: 'off' };
const names = (entries) => entries.map((entry) => entry.nameFr);

const ODYSSEY_SPECIES = ['Centaure', 'Méduse', 'Minotaure', 'Nymphe', 'Satyre', 'Sirène'];
const PHB_SPECIES = ['Aasimar', 'Drakéide', 'Elfe', 'Gnome', 'Goliath', 'Halfelin', 'Humain', 'Nain', 'Orc', 'Tieffelin'];

describe('Mode Odyssée : repères dans les données', () => {
    test('Les 6 espèces de l\'Odyssée portent le repère, les 10 du manuel non', () => {
        const species = Object.values(DD_RULES.species);
        assert.deepEqual(names(species.filter(fromOdyssey)).sort((a, b) => a.localeCompare(b, 'fr')), ODYSSEY_SPECIES);
        assert.deepEqual(names(species.filter((entry) => !fromOdyssey(entry))).sort((a, b) => a.localeCompare(b, 'fr')), PHB_SPECIES);
        for (const entry of species) assert.ok(['PHB2024', ODYSSEY_SOURCE].includes(entry.source), entry.nameFr);
    });

    test('12 sous-classes de l\'Odyssée (une par classe), 48 du manuel', () => {
        const subclasses = Object.values(DD_RULES.subclasses);
        assert.equal(subclasses.filter(fromOdyssey).length, 12);
        assert.equal(subclasses.filter((entry) => !fromOdyssey(entry)).length, 48);
        assert.equal(new Set(subclasses.filter(fromOdyssey).map((entry) => entry.class)).size, 12);
    });

    test('Le style Hoplite est le seul don de l\'Odyssée, et il porte le repère', () => {
        const odyssey = Object.keys(FEATS_DATA).filter((id) => fromOdyssey(FEATS_DATA[id]));
        assert.deepEqual(odyssey, ['hoplite']);
        assert.equal(FEATS_DATA.hoplite.type, 'Style de combat');
        // Aucun autre don ne se dit de l'Odyssée dans son nom sans porter le repère
        for (const [id, feat] of Object.entries(FEATS_DATA)) {
            assert.equal(/odyss/i.test(feat.name), fromOdyssey(feat), id);
        }
    });

    test('Valeur inconnue ou absente : pas de l\'Odyssée', () => {
        assert.equal(fromOdyssey(undefined), false);
        assert.equal(fromOdyssey({}), false);
        assert.equal(fromOdyssey({ source: 'PHB2024' }), false);
    });
});

describe('Mode Odyssée : actif ou coupé', () => {
    test('Actif par défaut : clé absente, fiche vierge, fiche illisible', () => {
        assert.equal(odysseyActive(sheet()), true);
        assert.equal(odysseyActive({}), true);
        assert.equal(odysseyActive(null), true);
        assert.equal(odysseyActive(undefined), true);
    });

    test('Coupé seulement par la valeur "off" ; toute autre valeur vaut actif', () => {
        assert.equal(odysseyActive(sheet(OFF)), false);
        for (const value of ['on', '', 'OFF', 'Off', ' off', 0, false, null, {}, [], 'non']) {
            assert.equal(odysseyActive(sheet({ [ODYSSEY_MODE_KEY]: value })), true, JSON.stringify(value));
        }
    });

    test('La clé n\'est jamais dans la fiche vierge', () => {
        assert.ok(!Object.hasOwn(createDefaultCharacter(), ODYSSEY_MODE_KEY));
    });

    test('Cocher une fiche déjà active n\'écrit rien (la clé reste absente)', () => {
        assert.deepEqual(setOdysseyModePatch(sheet(), true), {});
        assert.deepEqual(setOdysseyModePatch(sheet({ [ODYSSEY_MODE_KEY]: 'on' }), true), {});
        assert.deepEqual(setOdysseyModePatch(sheet(OFF), false), {});
    });

    test('Décocher écrit "off", recocher écrit "on"', () => {
        assert.deepEqual(setOdysseyModePatch(sheet(), false), { odyssey_mode: 'off' });
        assert.deepEqual(setOdysseyModePatch(sheet(OFF), true), { odyssey_mode: 'on' });
        assert.equal(odysseyActive({ ...sheet(OFF), ...setOdysseyModePatch(sheet(OFF), true) }), true);
    });

    test('Rien d\'autre que la clé du mode n\'est modifié', () => {
        const centaur = sheet({ char_species: 'Centaure', char_class: 'Guerrier', char_subclass: "L'Hoplite", feat_2: 'hoplite' });
        assert.deepEqual(Object.keys(setOdysseyModePatch(centaur, false)), [ODYSSEY_MODE_KEY]);
    });
});

describe('Mode Odyssée : ce que la fiche utilise déjà', () => {
    test('Fiche du manuel : rien', () => {
        const human = sheet({ char_species: 'Humain', char_class: 'Guerrier', char_subclass: 'Champion', feat_2: 'defense' });
        assert.deepEqual(odysseyUse(human), { species: '', subclass: '', feats: [], box: false });
        assert.deepEqual(odysseyKept(human), []);
        assert.deepEqual(odysseyUse(sheet()), { species: '', subclass: '', feats: [], box: false });
        assert.deepEqual(odysseyUse(null), { species: '', subclass: '', feats: [], box: false });
    });

    test('Espèce de l\'Odyssée : nom français, nom anglais, majuscules, HTML d\'une ancienne sauvegarde', () => {
        for (const value of ['Centaure', 'centaure', 'Centaur', '<b>Centaure</b>', ' Centaure ']) {
            assert.equal(odysseyUse(sheet({ char_species: value })).species, 'centaur', value);
        }
        assert.equal(odysseyUse(sheet({ char_species: 'Nymphe' })).species, 'thylean_nymph');
        assert.equal(odysseyUse(sheet({ char_species: 'Elfe' })).species, '');
        assert.equal(odysseyUse(sheet({ char_species: 'Licorne' })).species, '');
    });

    test('Sous-classe de l\'Odyssée : nom du menu, nom anglais, sans accents, HTML', () => {
        const fighter = (char_subclass) => sheet({ char_class: 'Guerrier', char_subclass });
        for (const value of ["L'Hoplite", "l'hoplite", 'Odyssean Champion', "<i>L'Hoplite</i>", 'L’Hoplite']) {
            assert.equal(odysseyUse(fighter(value)).subclass, 'odyssean_champion', value);
        }
        assert.equal(odysseyUse(sheet({ char_class: 'Barde', char_subclass: 'College de poesie epique' })).subclass, 'college_of_epic_muse');
        assert.equal(odysseyUse(fighter('Champion')).subclass, '');
    });

    test('Sous-classe : même lecture que la fiche (deriveCharacter), une sous-classe d\'une autre classe ne compte pas', () => {
        for (const record of [
            sheet({ char_class: 'Guerrier', char_subclass: "L'Hoplite" }),
            sheet({ char_class: 'Barbare', char_subclass: "L'Hoplite" }),
            sheet({ char_class: '', char_subclass: "L'Hoplite" }),
            sheet({ char_class: 'Paladin', char_subclass: 'Serment du Seigneur Dragon' }),
            sheet({ char_class: 'Paladin', char_subclass: 'Serment de Dévotion' })
        ]) {
            const derived = deriveCharacter(record).subclass;
            const expected = fromOdyssey(DD_RULES.subclasses[derived]) ? derived : '';
            assert.equal(odysseyUse(record).subclass, expected, `${record.char_class} / ${record.char_subclass}`);
        }
        assert.equal(odysseyUse(sheet({ char_class: 'Barbare', char_subclass: "L'Hoplite" })).subclass, '');
    });

    test('Style Hoplite : dans n\'importe quel emplacement de dons de la fiche, cité une fois', () => {
        for (const slot of FEAT_SLOT_ORDER) {
            assert.deepEqual(odysseyUse(sheet({ [`feat_${slot}`]: 'hoplite' })).feats, ['hoplite'], `feat_${slot}`);
        }
        assert.deepEqual(odysseyUse(sheet({ feat_2: 'hoplite', feat_7: 'hoplite' })).feats, ['hoplite']);
        assert.deepEqual(odysseyUse(sheet({ feat_2: '<b>hoplite</b>' })).feats, ['hoplite']);
        assert.deepEqual(odysseyUse(sheet({ feat_2: 'defense' })).feats, []);
        // Une clé feat_<N> que la fiche n'affiche pas (sauvegarde retouchée à la main) ne compte pas
        assert.deepEqual(odysseyUse(sheet({ feat_3: 'hoplite' })).feats, []);
    });

    test('Encadré de l\'onglet 3 : un destin héroïque ou des points de renommée', () => {
        assert.equal(odysseyUse(sheet()).box, false);
        assert.equal(odysseyUse(sheet({ glory_score: '0' })).box, false);
        assert.equal(odysseyUse(sheet({ glory_score: '' })).box, false);
        assert.equal(odysseyUse(sheet({ glory_score: 0 })).box, false);
        assert.equal(odysseyUse(sheet({ glory_score: '3' })).box, true);
        assert.equal(odysseyUse(sheet({ glory_score: 12 })).box, true);
        assert.equal(odysseyUse(sheet({ glory_score: 'beaucoup' })).box, true);
        assert.equal(odysseyUse(sheet({ heroic_destiny: 'damned' })).box, true);
        assert.equal(odysseyUse(sheet({ heroic_destiny: '<b></b>' })).box, false);
        // Chaque destin proposé par la fiche compte
        for (const destiny of DD_RULES.heroicDestinies.filter((d) => d.value)) {
            assert.equal(odysseyUse(sheet({ heroic_destiny: destiny.value })).box, true, destiny.name);
        }
    });

    test('En mots : « Centaure », « L\'Hoplite », « style Hoplite », « encadré Odyssée »', () => {
        const full = sheet({ char_species: 'Centaur', char_class: 'Guerrier', char_subclass: "l'hoplite", feat_2: 'hoplite', glory_score: '4' });
        assert.deepEqual(odysseyKept(full), ['Centaure', "L'Hoplite", 'style Hoplite', 'encadré Odyssée']);
        assert.deepEqual(odysseyKept(sheet({ char_species: 'Sirène' })), ['Sirène']);
        // Ce que la fiche garde ne dépend pas du mode
        assert.deepEqual(odysseyKept({ ...full, ...OFF }), odysseyKept(full));
    });
});

describe('Mode Odyssée : choix proposés', () => {
    test('Mode actif : les 16 espèces, les 5 sous-classes de chaque classe, aucun don retiré', () => {
        const record = sheet({ char_species: 'Humain' });
        assert.deepEqual(proposedSpecies(record), Object.values(DD_RULES.species));
        for (const slug of Object.keys(DD_RULES.classes)) {
            assert.equal(proposedSubclasses(record, slug).length, 5, slug);
            assert.equal(proposedSubclasses(record, slug).filter(fromOdyssey).length, 1, slug);
        }
        for (const slot of FEAT_SLOT_ORDER) assert.deepEqual(hiddenFeatIds(record, slot), []);
    });

    test('Mode coupé, fiche du manuel : les 10 espèces et les 4 sous-classes du manuel, Hoplite retiré partout', () => {
        const record = sheet({ ...OFF, char_species: 'Humain', char_class: 'Guerrier', char_subclass: 'Champion', feat_2: 'defense' });
        assert.deepEqual(names(proposedSpecies(record)).sort((a, b) => a.localeCompare(b, 'fr')), PHB_SPECIES);
        for (const slug of Object.keys(DD_RULES.classes)) {
            const subs = proposedSubclasses(record, slug);
            assert.equal(subs.length, 4, slug);
            assert.equal(subs.some(fromOdyssey), false, slug);
        }
        for (const slot of FEAT_SLOT_ORDER) assert.deepEqual(hiddenFeatIds(record, slot), ['hoplite'], `feat_${slot}`);
    });

    test('Mode coupé : l\'espèce de l\'Odyssée que la fiche utilise reste proposée, les 5 autres non', () => {
        const record = sheet({ ...OFF, char_species: 'Centaure' });
        const list = names(proposedSpecies(record));
        assert.equal(list.length, 11);
        assert.ok(list.includes('Centaure'));
        for (const other of ODYSSEY_SPECIES.filter((name) => name !== 'Centaure')) assert.ok(!list.includes(other), other);
        // L'ordre des données est gardé (l'écran trie par nom français)
        assert.deepEqual(list, names(Object.values(DD_RULES.species)).filter((name) => list.includes(name)));
    });

    test('Mode coupé : la sous-classe de l\'Odyssée que la fiche utilise reste proposée, pour sa classe seulement', () => {
        const record = sheet({ ...OFF, char_class: 'Guerrier', char_subclass: "L'Hoplite" });
        assert.ok(names(proposedSubclasses(record, 'fighter')).includes("L'Hoplite"));
        assert.equal(proposedSubclasses(record, 'fighter').length, 5);
        assert.equal(proposedSubclasses(record, 'barbarian').length, 4);
        assert.equal(proposedSubclasses(record, 'barbarian').some(fromOdyssey), false);
    });

    test('Classe inconnue : aucune sous-classe proposée', () => {
        assert.deepEqual(proposedSubclasses(sheet(), ''), []);
        assert.deepEqual(proposedSubclasses(sheet(OFF), ''), []);
        assert.deepEqual(proposedSubclasses(sheet(), 'inconnue'), []);
    });

    test('Mode coupé : Hoplite reste dans la liste de l\'emplacement qui le contient, pas dans les autres', () => {
        const record = sheet({ ...OFF, char_class: 'Guerrier', feat_2: 'hoplite' });
        assert.deepEqual(hiddenFeatIds(record, 2), []);
        for (const slot of FEAT_SLOT_ORDER.filter((n) => n !== 2)) assert.deepEqual(hiddenFeatIds(record, slot), ['hoplite'], `feat_${slot}`);
        assert.deepEqual(hiddenFeatIds(sheet({ ...OFF, feat_7: '<b>hoplite</b>' }), 7), []);
    });

    test('Recocher : tout est de nouveau proposé', () => {
        const off = sheet({ ...OFF, char_species: 'Humain', char_class: 'Guerrier' });
        const on = { ...off, ...setOdysseyModePatch(off, true) };
        assert.equal(proposedSpecies(on).length, 16);
        assert.equal(proposedSubclasses(on, 'fighter').length, 5);
        assert.deepEqual(hiddenFeatIds(on, 2), []);
    });
});

describe('Mode Odyssée : listes de la fiche (js/ui/sheet.js)', () => {
    const code = readFileSync(new URL('../js/ui/sheet.js', import.meta.url), 'utf8');
    const body = (start, end) => {
        const from = code.indexOf(start);
        assert.ok(from > 0, start);
        return code.slice(from, code.indexOf(end, from));
    };

    test('Les trois listes sont refaites à chaque affichage si leur contenu change (mode ou fiche)', () => {
        const render = body('function renderDynamicSelects(', '\n}');
        assert.match(render, /proposedSpecies\(character\)/);
        assert.match(render, /proposedSubclasses\(character, /);
        assert.match(render, /hiddenFeatIds\(character, level\)/);
        // La liste des espèces n'est plus remplie une seule fois à la construction de la fiche
        assert.doesNotMatch(body('function buildStaticOptions(', '\n}'), /char_species/);
    });

    test('Changement de classe : le contrôle qui vide la sous-classe lit la liste complète', () => {
        const check = body("if (key === 'char_class') {", 'const die');
        assert.match(check, /subclassesOf\(patch\.char_class\)/);
        assert.doesNotMatch(check, /proposedSubclasses/);
        const complete = body('function subclassesOf(', '\n}');
        assert.match(complete, /Object\.values\(DD_RULES\.subclasses\)/);
        assert.doesNotMatch(complete, /proposed|odyssey/i);
    });
});

describe('Mode Odyssée : fenêtre « Passer au niveau »', () => {
    /** Phrase « Choisissez votre sous-classe… » du passage au niveau 3 */
    const choiceLine = (record) => planLevelUp(record).sections.find((section) => section.title === 'Sous-classe')?.lines[0] ?? '';
    const level2 = (extra = {}) => sheet({ char_class: 'Paladin', char_level: '2', hd_type: 'd10', ...extra });

    test('Mode actif : les 5 sous-classes sont citées, celle de l\u2019Odyssée avec sa mention', () => {
        const line = choiceLine(level2());
        assert.match(line, /^Choisissez votre sous-classe \(en haut de la fiche\) : /);
        assert.match(line, /Serment du Seigneur Dragon \(Odyssée\)/);
        assert.equal(line.split(' : ')[1].split(', ').length, 5);
        assert.equal(choiceLine(level2({ [ODYSSEY_MODE_KEY]: 'on' })), line);
    });

    test('Mode coupé : seules les 4 sous-classes du manuel sont citées', () => {
        const line = choiceLine(level2(OFF));
        assert.doesNotMatch(line, /Odyssée|Seigneur Dragon/);
        assert.equal(line.split(' : ')[1].split(', ').length, 4);
        assert.match(line, /Serment de Dévotion/);
    });

    test('Chaque classe : la phrase cite exactement les sous-classes proposées par la liste du haut', () => {
        for (const [slug, cls] of Object.entries(DD_RULES.classes)) {
            for (const mode of [{}, OFF]) {
                const record = sheet({ ...mode, char_class: cls.nameFr, char_level: '2' });
                const expected = proposedSubclasses(record, slug).map((sub) => (fromOdyssey(sub) ? `${sub.nameFr} (Odyssée)` : sub.nameFr));
                assert.equal(choiceLine(record), `Choisissez votre sous-classe (en haut de la fiche) : ${expected.join(', ')}.`, `${slug} ${JSON.stringify(mode)}`);
            }
        }
    });

    test('Le reste de la fenêtre ne dépend pas du mode (une fiche de l\u2019Odyssée garde ses capacités)', () => {
        const hero = { char_species: 'Centaure', char_class: 'Guerrier', char_subclass: "L'Hoplite", char_level: '6', hd_type: 'd10', hp_max: '50', hp_current: '50' };
        assert.deepEqual(planLevelUp(sheet({ ...hero, ...OFF })), planLevelUp(sheet(hero)));
        assert.ok(planLevelUp(sheet({ ...hero, ...OFF })).sections.some((section) => section.title === 'Sous-classe'));
    });
});

describe('Mode Odyssée : aucun calcul ne change', () => {
    const hero = { char_species: 'Centaure', char_class: 'Guerrier', char_subclass: "L'Hoplite", char_level: '7', feat_2: 'hoplite', glory_score: '5', str_score: '16' };

    test('Valeurs calculées identiques, mode actif ou coupé', () => {
        assert.deepEqual(deriveCharacter(sheet({ ...hero, ...OFF })), deriveCharacter(sheet(hero)));
        const off = sheet({ ...hero, ...OFF });
        assert.equal(deriveCharacter(off).subclass, 'odyssean_champion');
        assert.equal(deriveCharacter(off).renownTier, deriveCharacter(sheet(hero)).renownTier);
    });

    test('Effets des dons identiques (le style Hoplite garde ses rappels)', () => {
        const on = sheet(hero);
        const off = sheet({ ...hero, ...OFF });
        assert.deepEqual(featEffects(off, deriveCharacter(off)), featEffects(on, deriveCharacter(on)));
        assert.ok(featEffects(off, deriveCharacter(off)).weapons.some((note) => note.featId === 'hoplite'));
    });

    test('Aucun module de règles de calcul ne lit le mode (seuls odyssey.js et level-up.js)', () => {
        const dir = new URL('../js/rules/', import.meta.url);
        for (const file of ['character.js', 'class-features.js', 'species.js', 'feats.js', 'feat-effects.js', 'subclass-features.js',
            'subclass-uses.js', 'subclass-choices.js', 'subclass-companions.js', 'epic-poem.js', 'rest.js', 'spells.js']) {
            assert.doesNotMatch(readFileSync(new URL(file, dir), 'utf8'), /odyssey_mode|odyssey\.js/, file);
        }
    });
});

describe('Mode Odyssée : encadré de l\'onglet 3 et libellé d\'Inspiration', () => {
    test('Encadré utile : toujours quand le mode est actif ; mode coupé, seulement s\'il est rempli', () => {
        assert.equal(odysseyBoxUseful(sheet()), true);
        assert.equal(odysseyBoxUseful(sheet(OFF)), false);
        assert.equal(odysseyBoxUseful(sheet({ ...OFF, glory_score: '2' })), true);
        assert.equal(odysseyBoxUseful(sheet({ ...OFF, heroic_destiny: 'damned' })), true);
        assert.equal(odysseyBoxUseful(sheet({ ...OFF, glory_score: '0', heroic_destiny: '' })), false);
        // Une espèce de l'Odyssée ne suffit pas à garder l'encadré vide
        assert.equal(odysseyBoxUseful(sheet({ ...OFF, char_species: 'Centaure' })), false);
    });

    test('Libellé : « ou points de Foi » seulement quand le mode est actif', () => {
        assert.deepEqual(inspirationWording(sheet()), { label: 'Inspiration héroïque ou points de Foi', noun: "point d'Inspiration ou de Foi" });
        assert.deepEqual(inspirationWording(sheet(OFF)), { label: 'Inspiration héroïque', noun: "point d'Inspiration" });
    });

    test('Le libellé du mode actif est celui écrit dans index.html', () => {
        const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8').replace(/\s+/g, ' ');
        assert.ok(html.includes(`for="f-heroic_inspiration">${inspirationWording(sheet()).label}</label>`));
    });
});

describe('Mode Odyssée : phrases pour le joueur', () => {
    const worst = sheet({
        ...OFF, char_species: 'Minotaure', char_class: 'Paladin', char_subclass: 'Serment du Seigneur Dragon',
        feat_2: 'hoplite', heroic_destiny: 'damned', glory_score: '12'
    });

    test('Infobulle : explique la case ; mode coupé, dit aussi ce que la fiche garde', () => {
        const hint = odysseyModeHint(sheet());
        assert.match(hint, /Odyssée des Seigneurs Dragons/);
        assert.match(hint, /Décochez/);
        assert.match(hint, /ne sont plus proposés/);
        assert.match(hint, /reste en place/);
        assert.match(hint, /Recochez/);
        assert.doesNotMatch(hint, /Cette fiche garde/);
        assert.doesNotMatch(odysseyModeHint(sheet({ char_species: 'Centaure' })), /Cette fiche garde/);
        assert.equal(odysseyModeHint(sheet(OFF)), hint);
        assert.ok(odysseyModeHint(sheet({ ...OFF, char_species: 'Centaure' })).endsWith('Cette fiche garde : Centaure.'));
    });

    test('Message après avoir décoché : ce qui n\'est plus proposé, et ce que la fiche garde', () => {
        assert.equal(odysseyModeMessage(sheet(OFF)),
            'Mode Odyssée coupé : ses espèces, sous-classes et style de combat ne sont plus proposés.');
        assert.equal(odysseyModeMessage(sheet({ ...OFF, char_species: 'Centaure' })),
            'Mode Odyssée coupé : ses choix ne sont plus proposés. Cette fiche garde : Centaure.');
        assert.equal(odysseyModeMessage(sheet({ ...OFF, char_species: 'Centaure', feat_2: 'hoplite' })),
            'Mode Odyssée coupé. Cette fiche garde : Centaure, style Hoplite.');
        assert.match(odysseyModeMessage(worst), /Cette fiche garde : Minotaure, Serment du Seigneur Dragon, style Hoplite, encadré Odyssée\.$/);
    });

    test('Message après avoir recoché', () => {
        assert.equal(odysseyModeMessage(sheet({ [ODYSSEY_MODE_KEY]: 'on' })),
            'Mode Odyssée actif : ses espèces, sous-classes et style de combat sont de nouveau proposés.');
    });

    test('La barre du haut tient sur une ligne : chaque message y tient, même la fiche la plus chargée', () => {
        const species = Object.values(DD_RULES.species).filter(fromOdyssey);
        const subclasses = Object.values(DD_RULES.subclasses).filter(fromOdyssey);
        const className = (slug) => DD_RULES.classes[slug].nameFr;
        let longest = '';
        for (const s of species) {
            for (const sub of subclasses) {
                const record = sheet({ ...OFF, char_species: s.nameFr, char_class: className(sub.class), char_subclass: sub.nameFr, feat_2: 'hoplite', glory_score: '3' });
                assert.equal(odysseyKept(record).length, 4, `${s.nameFr} / ${sub.nameFr}`);
                const message = odysseyModeMessage(record);
                assert.ok(message.length <= STATUS_ROOM, `${message.length} caractères : ${message}`);
                assert.match(message, /Cette fiche garde : /);
                if (message.length > longest.length) longest = message;
            }
        }
        assert.ok(longest.length > 80, longest);
        for (const record of [sheet(), sheet(OFF), sheet({ [ODYSSEY_MODE_KEY]: 'on' })]) {
            assert.ok(odysseyModeMessage(record).length <= STATUS_ROOM, odysseyModeMessage(record));
        }
    });

    test('Place plus petite : la phrase la plus complète qui tient', () => {
        const record = sheet({ ...OFF, char_species: 'Centaure' });
        assert.equal(odysseyModeMessage(record, 200),
            'Mode Odyssée coupé : ses espèces, sous-classes et style de combat ne sont plus proposés. Cette fiche garde : Centaure.');
        assert.equal(odysseyModeMessage(record, 60), 'Mode Odyssée coupé. Cette fiche garde : Centaure.');
        assert.equal(odysseyModeMessage(record, 40), 'Cette fiche garde : Centaure.');
        assert.equal(odysseyModeMessage(record, 5), 'Cette fiche garde : Centaure.');
    });

    test('Le nom de la case est repris dans les messages', () => {
        assert.equal(ODYSSEY_MODE_LABEL, 'Mode Odyssée');
        assert.ok(odysseyModeMessage(sheet(OFF)).startsWith(ODYSSEY_MODE_LABEL));
    });
});

describe('Mode Odyssée : sauvegarde et synchronisation', () => {
    /** Stockage simulé (sauvegardes de secours) */
    const fakeStorage = () => {
        const data = new Map();
        return { getItem: (key) => (data.has(key) ? data.get(key) : null), setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key) };
    };

    test("Clé propre à la v4 : ignorée de la comparaison avec l'ancien site", () => {
        assert.ok(V4_ONLY_KEYS.includes(ODYSSEY_MODE_KEY));
        assert.ok(!(ODYSSEY_MODE_KEY in withoutV4State(sheet(OFF))));
        assert.deepEqual(comparableWithV3(normalizeCharacter(sheet(OFF))), comparableWithV3(normalizeCharacter(sheet())));
    });

    test("Lecture d'une fiche : clé absente laissée absente, clé présente gardée telle quelle", () => {
        assert.ok(!(ODYSSEY_MODE_KEY in migrateCharacter({ char_name: 'Korgul' }).character));
        assert.ok(!(ODYSSEY_MODE_KEY in migrateCharacter(sheet()).character));
        assert.equal(migrateCharacter(sheet(OFF)).character[ODYSSEY_MODE_KEY], 'off');
        assert.equal(migrateCharacter(sheet({ [ODYSSEY_MODE_KEY]: 'on' })).character[ODYSSEY_MODE_KEY], 'on');
        assert.deepEqual(migrateCharacter(sheet(OFF)).report, []);
    });

    test('Export puis import : le réglage suit la fiche', () => {
        const off = migrateCharacter(sheet({ ...OFF, char_species: 'Centaure' })).character;
        const back = parseCharacterFile(serializeCharacter(off)).character;
        assert.deepEqual(back, off);
        assert.equal(odysseyActive(back), false);
    });

    for (const [name, url] of ALL_FIXTURES) {
        test(`${name} : sans la clé, la fiche et son empreinte restent strictement les mêmes`, () => {
            const { character } = migrateCharacter(readFixture(url));
            assert.ok(!(ODYSSEY_MODE_KEY in character));
            assert.equal(odysseyActive(character), true);
            const before = sheetFingerprint(character);
            // Ouvrir la fiche : l'écran lit le mode et ce que la fiche utilise, sans jamais rien écrire
            const store = createStore(character);
            odysseyUse(store.get());
            proposedSpecies(store.get());
            odysseyModeHint(store.get());
            store.update(setOdysseyModePatch(store.get(), odysseyActive(store.get())));
            assert.deepEqual(store.get(), character);
            assert.equal(sheetFingerprint(store.get()), before);
            assert.equal(fingerprint(normalizeCharacter(store.get())), before);
        });
    }

    test("Décocher : une seule clé change, l'empreinte aussi ; recocher garde la clé (on)", () => {
        const store = createStore(sheet({ char_species: 'Centaure' }));
        const before = store.get();
        const changes = [];
        store.subscribe((state, changed) => changes.push(changed));
        store.update(setOdysseyModePatch(store.get(), false));
        assert.deepEqual(changes, [[ODYSSEY_MODE_KEY]]);
        assert.deepEqual({ ...store.get(), [ODYSSEY_MODE_KEY]: undefined }, { ...before, [ODYSSEY_MODE_KEY]: undefined });
        assert.notEqual(sheetFingerprint(store.get()), sheetFingerprint(before));
        store.update(setOdysseyModePatch(store.get(), true));
        assert.equal(store.get()[ODYSSEY_MODE_KEY], 'on');
        assert.equal(odysseyActive(store.get()), true);
    });

    test('Fiche vierge dont le mode a été coupé : vierge pour le compte en ligne ET pour les sauvegardes de secours', () => {
        const blank = { ...createDefaultCharacter(), ...OFF };
        assert.equal(isBlankCharacter(blank), true);
        const storage = fakeStorage();
        assert.deepEqual(takeSnapshot(blank, 'open', { storage }), { saved: false, why: 'blank' });
        assert.deepEqual(takeSnapshot({ ...createDefaultCharacter(), [ODYSSEY_MODE_KEY]: 'on' }, 'open', { storage }), { saved: false, why: 'blank' });
        assert.deepEqual(readSnapshots(storage), []);
    });

    test('Fiche remplie : les deux contrôles la disent non vierge, mode coupé ou non', () => {
        for (const record of [sheet(), sheet(OFF)]) {
            assert.equal(isBlankCharacter(record), false);
            assert.deepEqual(takeSnapshot(record, 'open', { storage: fakeStorage() }), { saved: true });
        }
    });

    test('Sauvegardes de secours : la même fiche, mode coupé, est un autre état (y revenir rend le mode)', () => {
        const storage = fakeStorage();
        assert.deepEqual(takeSnapshot(sheet(), 'open', { storage, now: new Date(Date.UTC(2026, 10, 21, 10, 0)) }), { saved: true });
        assert.deepEqual(takeSnapshot(sheet(OFF), 'import', { storage, now: new Date(Date.UTC(2026, 10, 21, 10, 5)) }), { saved: true });
        assert.deepEqual(takeSnapshot(sheet(OFF), 'open', { storage, now: new Date(Date.UTC(2026, 10, 21, 10, 6)) }), { saved: false, why: 'same' });
        assert.equal(readSnapshots(storage).length, 2);
    });
});

describe('Mode Odyssée : écran, impression et notice', () => {
    const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    const ui = read('js/ui/odyssey.js');

    test('La case est dans le menu « Gestion », masquée fiche verrouillée, et porte le nom de la règle', () => {
        assert.match(ui, /getElementById\('toolbar-help'\)/);
        assert.match(ui, /class: 'btn toolbar-check edit-only'/);
        assert.match(ui, /type: 'checkbox', class: 'round-check'/);
        assert.match(ui, /text: ODYSSEY_MODE_LABEL/);
        assert.match(read('js/ui/toolbar.js'), /id: 'toolbar-help'/);
        // Branchée après la barre (la rangée existe) et après les compteurs (boutons de l'Inspiration)
        const inits = read('js/main.js').match(/for \(const init of \[([^\]]+)\]/)[1].split(',').map((name) => name.trim());
        assert.ok(inits.indexOf('initOdyssey') > inits.indexOf('initToolbar'));
        assert.ok(inits.indexOf('initOdyssey') > inits.indexOf('initCounters'));
    });

    test('La case n\u2019écrit dans la fiche que par la règle, et seulement au toucher', () => {
        assert.equal((ui.match(/store\.update\(/g) || []).length, 1);
        assert.match(ui, /setOdysseyModePatch\(store\.get\(\), box\.checked\)/);
        assert.match(ui, /box\.addEventListener\('change'/);
        // Aucun autre module de l'interface n'écrit la clé
        for (const file of ['js/ui/sheet.js', 'js/ui/toolbar.js', 'js/ui/counters.js', 'js/main.js', 'js/state/migrate.js', 'js/state/schema.js']) {
            assert.doesNotMatch(read(file), /odyssey_mode|ODYSSEY_MODE_KEY/, file);
        }
    });

    test('Encadré de l\u2019onglet 3 : caché par la règle, jamais imprimé quand il est inutile', () => {
        assert.match(read('index.html'), /<section class="box odyssey" data-fold-box="odyssey">/);
        assert.match(ui, /odysseyBoxUseful\(character\)/);
        assert.match(ui, /toggleAttribute\('data-odyssey-unused', !useful\)/);
        assert.match(read('css/print.css'), /\.odyssey\[data-odyssey-unused\] \{\s*display: none;\s*\}/);
    });

    test('Libellé d\u2019Inspiration : posé par la règle, boutons − / + renommés', () => {
        assert.match(ui, /inspirationWording\(character\)/);
        assert.match(ui, /renameSteppers\(input, wording\.noun\)/);
        assert.match(read('js/ui/stepper.js'), /export function renameSteppers\(/);
    });

    test('Les 8 fonds fournis restent dans la galerie (liste inchangée)', () => {
        assert.equal(DEFAULT_BGS.length, 8);
        assert.ok(DEFAULT_BGS.includes('Fond_Odyssée.webp'));
        assert.doesNotMatch(read('js/ui/gallery.js'), /odyssey/i);
        assert.doesNotMatch(read('js/rules/gallery.js'), /odyssey/i);
    });

    test('Notice : la case est expliquée (pour commencer, verrou, onglet 3)', () => {
        const section = (id) => HELP_SECTIONS.find((entry) => entry.id === id).entries;
        const start = section('start').find((entry) => entry.title === 'La case « Mode Odyssée »');
        assert.ok(start, 'entrée de la rubrique Pour commencer');
        assert.match(start.text, /menu « Gestion »/);
        assert.match(start.text, /fiche modifiable/);
        assert.match(start.text, /ne sont plus proposés/);
        assert.match(start.text, /Recochez-la/);
        const kept = section('start').find((entry) => entry.title === '« Mode Odyssée » décoché : ce qui reste');
        assert.match(kept.text, new RegExp(`« ${inspirationWording({}).label} »`));
        assert.match(kept.text, new RegExp(`« ${inspirationWording({ [ODYSSEY_MODE_KEY]: 'off' }).label} »`));
        assert.ok(section('lock').some((entry) => entry.text.includes(`« ${ODYSSEY_MODE_LABEL} »`)));
        assert.ok(section('role').find((entry) => entry.title === '« Odyssée des Seigneurs Dragons »').text.includes(`« ${ODYSSEY_MODE_LABEL} »`));
    });
});
