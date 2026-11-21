/**
 * TESTS — MODE ODYSSÉE DÉSACTIVABLE (js/rules/odyssey.js)
 * Étude : docs/etudes/MODE_ODYSSEE.md. Réglage par fiche, actif par défaut : la clé facultative
 * « odyssey_mode » ne vaut "off" que si le joueur a décoché la case du menu « Gestion ».
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    ODYSSEY_MODE_KEY, ODYSSEY_SOURCE, ODYSSEY_MODE_LABEL, STATUS_ROOM, STATUS_ROOM_OPEN, STATUS_ROOM_NARROW, fromOdyssey,
    odysseyActive, setOdysseyModePatch, odysseyUse, odysseyKept, proposedSpecies, proposedSubclasses,
    hiddenFeatIds, odysseyBoxUseful, inspirationWording, odysseyModeHint, odysseyModeMessage,
    odysseyDropped, odysseyDroppedMessage
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
import { WHATS_NEW } from '../js/data/whats-new.js';

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

    test('Décocher écrit "off", recocher retire la clé (valeur undefined, jamais enregistrée)', () => {
        assert.deepEqual(setOdysseyModePatch(sheet(), false), { odyssey_mode: 'off' });
        const back = setOdysseyModePatch(sheet(OFF), true);
        assert.deepEqual(Object.keys(back), [ODYSSEY_MODE_KEY]);
        assert.equal(back[ODYSSEY_MODE_KEY], undefined);
        assert.equal(odysseyActive({ ...sheet(OFF), ...back }), true);
        assert.ok(!JSON.stringify({ ...sheet(OFF), ...back }).includes(ODYSSEY_MODE_KEY));
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

    const BACK = 'Recochez pour tout retrouver.';
    const OFF_LONG = 'Mode Odyssée coupé : ses espèces, sous-classes et style de combat ne sont plus proposés.';
    const OFF_SHORT = 'Mode Odyssée coupé : ses choix ne sont plus proposés.';

    test('Message après avoir décoché (tablette, menu ouvert) : le mode est coupé, ce qui change, ce que la fiche garde, comment revenir', () => {
        assert.equal(odysseyModeMessage(sheet(OFF)), `${OFF_LONG} ${BACK}`);
        assert.equal(odysseyModeMessage(sheet({ ...OFF, char_species: 'Centaure' })),
            `${OFF_LONG} Cette fiche garde : Centaure. ${BACK}`);
        assert.equal(odysseyModeMessage(sheet({ ...OFF, char_species: 'Centaure', char_class: 'Guerrier', char_subclass: "L'Hoplite", feat_2: 'hoplite', glory_score: '5' })),
            `${OFF_SHORT} Cette fiche garde : Centaure, L'Hoplite, style Hoplite, encadré Odyssée. ${BACK}`);
        assert.equal(odysseyModeMessage(worst),
            `${OFF_SHORT} Cette fiche garde : Minotaure, Serment du Seigneur Dragon, style Hoplite, encadré Odyssée. ${BACK}`);
    });

    test('Message après avoir recoché', () => {
        const on = 'Mode Odyssée actif : ses espèces, sous-classes et style de combat sont de nouveau proposés.';
        assert.equal(odysseyModeMessage(sheet()), `${on} Décochez pour une autre campagne.`);
        assert.equal(odysseyModeMessage(sheet({ [ODYSSEY_MODE_KEY]: 'on' })), `${on} Décochez pour une autre campagne.`);
        assert.equal(odysseyModeMessage(sheet(), STATUS_ROOM), on);
        assert.equal(odysseyModeMessage(sheet(), STATUS_ROOM_NARROW), 'Mode Odyssée actif : ses choix sont de nouveau proposés.');
    });

    test('Menu ouvert sur tablette (deux lignes) : chaque message est complet, même pour la fiche la plus chargée', () => {
        const species = Object.values(DD_RULES.species).filter(fromOdyssey);
        const subclasses = Object.values(DD_RULES.subclasses).filter(fromOdyssey);
        const className = (slug) => DD_RULES.classes[slug].nameFr;
        let longest = '';
        for (const s of species) {
            for (const sub of subclasses) {
                const record = sheet({ ...OFF, char_species: s.nameFr, char_class: className(sub.class), char_subclass: sub.nameFr, feat_2: 'hoplite', glory_score: '3' });
                assert.equal(odysseyKept(record).length, 4, `${s.nameFr} / ${sub.nameFr}`);
                const message = odysseyModeMessage(record);
                assert.ok(message.length <= STATUS_ROOM_OPEN, `${message.length} caractères : ${message}`);
                // Le joueur de l'Odyssée a toute l'explication : mode coupé, ce qui change, ce qui reste, retour
                assert.ok(message.startsWith('Mode Odyssée coupé : '), message);
                assert.match(message, /ne sont plus proposés\./);
                assert.ok(message.includes(`Cette fiche garde : ${s.nameFr}, ${sub.nameFr}, style Hoplite, encadré Odyssée.`), message);
                assert.ok(message.endsWith(BACK), message);
                if (message.length > longest.length) longest = message;
            }
        }
        assert.ok(longest.length > 160, longest);
        for (const record of [sheet(), sheet(OFF), sheet({ [ODYSSEY_MODE_KEY]: 'on' })]) {
            assert.ok(odysseyModeMessage(record).length <= STATUS_ROOM_OPEN, odysseyModeMessage(record));
        }
    });

    test('Place plus petite : la phrase la plus complète qui tient, et « Mode Odyssée coupé » toujours en tête', () => {
        const record = sheet({ ...OFF, char_species: 'Centaure' });
        assert.equal(odysseyModeMessage(record, 200), `${OFF_LONG} Cette fiche garde : Centaure. ${BACK}`);
        assert.equal(odysseyModeMessage(record, 115), `${OFF_SHORT} Cette fiche garde : Centaure. ${BACK}`);
        assert.equal(odysseyModeMessage(record, STATUS_ROOM), `${OFF_SHORT} Cette fiche garde : Centaure.`);
        assert.equal(odysseyModeMessage(record, 60), 'Mode Odyssée coupé. Cette fiche garde : Centaure.');
        assert.equal(odysseyModeMessage(record, 40), "Mode Odyssée coupé. Votre fiche garde ce qu'elle utilise déjà.");
        assert.equal(odysseyModeMessage(record, 5), "Mode Odyssée coupé. Votre fiche garde ce qu'elle utilise déjà.");
        assert.equal(odysseyModeMessage(sheet(OFF), STATUS_ROOM), OFF_LONG);
        assert.equal(odysseyModeMessage(sheet(OFF), 5), OFF_SHORT);
        for (const room of [0, 5, 40, STATUS_ROOM_NARROW, 60, STATUS_ROOM, 115, STATUS_ROOM_OPEN, 300]) {
            for (const item of [sheet(OFF), record, worst]) {
                assert.ok(odysseyModeMessage(item, room).startsWith('Mode Odyssée coupé'), `${room} : ${odysseyModeMessage(item, room)}`);
            }
            assert.ok(odysseyModeMessage(sheet(), room).startsWith('Mode Odyssée actif'));
        }
    });

    test('Ordinateur (colonne étroite) : l\u2019essentiel en deux lignes courtes, le détail est dans l\u2019infobulle', () => {
        assert.equal(odysseyModeMessage(sheet(OFF), STATUS_ROOM_NARROW), OFF_SHORT);
        assert.equal(odysseyModeMessage(worst, STATUS_ROOM_NARROW), "Mode Odyssée coupé. Votre fiche garde ce qu'elle utilise déjà.");
        assert.equal(odysseyModeMessage(sheet({ ...OFF, char_species: 'Centaure' }), STATUS_ROOM_NARROW), 'Mode Odyssée coupé. Cette fiche garde : Centaure.');
        // Deux lignes de la colonne : 62 caractères au plus (vérifié à l'écran, 1280 px)
        for (const record of [sheet(), sheet(OFF), worst, sheet({ ...OFF, char_species: 'Centaure' })]) {
            assert.ok(odysseyModeMessage(record, STATUS_ROOM_NARROW).length <= 62, odysseyModeMessage(record, STATUS_ROOM_NARROW));
        }
        assert.match(odysseyModeHint(worst), /Cette fiche garde : Minotaure, Serment du Seigneur Dragon, style Hoplite, encadré Odyssée\.$/);
    });

    test('Le nom de la case est repris dans les messages', () => {
        assert.equal(ODYSSEY_MODE_LABEL, 'Mode Odyssée');
        assert.ok(odysseyModeMessage(sheet(OFF)).startsWith(ODYSSEY_MODE_LABEL));
    });
});

describe('Mode Odyssée : choix abandonné quand le mode est coupé', () => {
    const hero = { char_species: 'Centaure', char_class: 'Guerrier', char_subclass: "L'Hoplite", feat_2: 'hoplite', heroic_destiny: 'damned', glory_score: '5' };
    const off = sheet({ ...OFF, ...hero });

    test('Mode coupé : l\u2019espèce, la sous-classe ou le style quittés sont nommés', () => {
        assert.deepEqual(odysseyDropped(off, { ...off, char_species: 'Humain' }), ['Centaure']);
        assert.deepEqual(odysseyDropped(off, { ...off, char_subclass: 'Champion' }), ["L'Hoplite"]);
        assert.deepEqual(odysseyDropped(off, { ...off, char_class: 'Paladin', char_subclass: '' }), ["L'Hoplite"]);
        assert.deepEqual(odysseyDropped(off, { ...off, feat_2: 'defense' }), ['style Hoplite']);
        assert.deepEqual(odysseyDropped(off, { ...off, feat_2: '' }), ['style Hoplite']);
        assert.deepEqual(odysseyDropped(off, { ...off, char_species: 'Humain', char_subclass: '', feat_2: '' }), ['Centaure', "L'Hoplite", 'style Hoplite']);
    });

    test('Passer d\u2019un choix de l\u2019Odyssée à un autre : l\u2019ancien est sorti de la liste', () => {
        assert.deepEqual(odysseyDropped(off, { ...off, char_species: 'Minotaure' }), ['Centaure']);
    });

    test('Rien à dire : mode actif, changement du mode, autre champ, style déplacé, encadré vidé', () => {
        const on = sheet(hero);
        assert.deepEqual(odysseyDropped(on, { ...on, char_species: 'Humain' }), []);
        // Le toucher de la case a son propre message (odysseyModeMessage)
        assert.deepEqual(odysseyDropped(on, { ...off, char_species: 'Humain' }), []);
        assert.deepEqual(odysseyDropped(off, { ...on, char_species: 'Humain' }), []);
        assert.deepEqual(odysseyDropped(off, off), []);
        assert.deepEqual(odysseyDropped(off, { ...off, char_name: 'Nessos', str_score: '18' }), []);
        assert.deepEqual(odysseyDropped(off, { ...off, feat_2: '', feat_7: 'hoplite' }), []);
        // L'encadré de l'onglet 3 n'est pas un choix de liste
        assert.deepEqual(odysseyDropped(off, { ...off, heroic_destiny: '', glory_score: '0' }), []);
        // Fiche du manuel : jamais rien
        const human = sheet({ ...OFF, char_species: 'Humain', char_class: 'Guerrier', char_subclass: 'Champion' });
        assert.deepEqual(odysseyDropped(human, { ...human, char_species: 'Elfe', char_subclass: 'Maître de guerre' }), []);
        assert.deepEqual(odysseyDropped(null, undefined), []);
    });

    test('Anciennes écritures : la même espèce écrite autrement n\u2019est pas un abandon', () => {
        const english = sheet({ ...OFF, char_species: 'Centaur', char_class: 'Fighter', char_subclass: 'Odyssean Champion' });
        assert.deepEqual(odysseyDropped(english, { ...english, char_species: 'Centaure', char_class: 'Guerrier', char_subclass: "L'Hoplite" }), []);
        assert.deepEqual(odysseyDropped(english, { ...english, char_species: 'Human' }), ['Centaure']);
    });

    test('Message : dit comment retrouver le choix (recocher la case), sans accord à faire', () => {
        assert.equal(odysseyDroppedMessage(off, { ...off, char_species: 'Humain' }),
            "Centaure n'est plus dans la liste : recochez « Mode Odyssée » pour retrouver ce choix.");
        assert.equal(odysseyDroppedMessage(off, { ...off, feat_2: 'defense' }),
            "Style Hoplite n'est plus dans la liste : recochez « Mode Odyssée » pour retrouver ce choix.");
        assert.equal(odysseyDroppedMessage(off, { ...off, char_species: 'Humain', feat_2: '' }, 200),
            'Centaure, style Hoplite ne sont plus dans les listes : recochez « Mode Odyssée » pour retrouver ces choix.');
        assert.equal(odysseyDroppedMessage(off, { ...off, char_name: 'Nessos' }), '');
        assert.equal(odysseyDroppedMessage(sheet(hero), { ...sheet(hero), char_species: 'Humain' }), '');
    });

    test('Message : tient sur une ligne de la barre (tablette) pour chaque espèce, sous-classe et style', () => {
        const className = (slug) => DD_RULES.classes[slug].nameFr;
        const cases = [
            ...Object.values(DD_RULES.species).filter(fromOdyssey).map((s) => [{ char_species: s.nameFr }, { char_species: 'Humain' }, s.nameFr]),
            ...Object.values(DD_RULES.subclasses).filter(fromOdyssey).map((sub) => [{ char_class: className(sub.class), char_subclass: sub.nameFr }, { char_subclass: '' }, sub.nameFr]),
            [{ feat_2: 'hoplite' }, { feat_2: '' }, 'Style Hoplite']
        ];
        assert.equal(cases.length, 19);
        for (const [had, change, name] of cases) {
            const before = sheet({ ...OFF, ...had });
            const message = odysseyDroppedMessage(before, { ...before, ...change });
            assert.ok(message.startsWith(name), `${name} : ${message}`);
            assert.ok(message.length <= STATUS_ROOM, `${message.length} caractères : ${message}`);
            assert.ok(message.includes('recochez « Mode Odyssée » pour retrouver ce choix.'), message);
            // Ordinateur : deux lignes courtes, le nom puis le geste
            const narrow = odysseyDroppedMessage(before, { ...before, ...change }, STATUS_ROOM_NARROW);
            assert.ok(narrow.startsWith(`${name} : `) && narrow.endsWith('recochez « Mode Odyssée ».'), narrow);
            assert.ok(narrow.length <= STATUS_ROOM_NARROW, `${narrow.length} caractères : ${narrow}`);
        }
        assert.equal(odysseyDroppedMessage(sheet({ ...OFF, char_species: 'Centaure' }), sheet({ ...OFF, char_species: 'Humain' }), STATUS_ROOM_NARROW),
            'Centaure : pour ce choix, recochez « Mode Odyssée ».');
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

    test("Décocher : une seule clé change, l'empreinte aussi", () => {
        const store = createStore(sheet({ char_species: 'Centaure' }));
        const before = store.get();
        const changes = [];
        store.subscribe((state, changed) => changes.push(changed));
        store.update(setOdysseyModePatch(store.get(), false));
        assert.deepEqual(changes, [[ODYSSEY_MODE_KEY]]);
        assert.deepEqual({ ...store.get(), [ODYSSEY_MODE_KEY]: undefined }, { ...before, [ODYSSEY_MODE_KEY]: undefined });
        assert.notEqual(sheetFingerprint(store.get()), sheetFingerprint(before));
    });

    for (const [name, url] of ALL_FIXTURES) {
        test(`${name} : décochée puis recochée, la fiche redevient strictement la même (empreinte, texte enregistré)`, () => {
            const { character } = migrateCharacter(readFixture(url));
            const before = sheetFingerprint(character);
            const savedBefore = serializeCharacter(character);
            const store = createStore(character);
            const changes = [];
            store.subscribe((state, changed) => changes.push(changed));
            store.update(setOdysseyModePatch(store.get(), false));
            assert.equal(odysseyActive(store.get()), false);
            assert.notEqual(sheetFingerprint(store.get()), before);
            store.update(setOdysseyModePatch(store.get(), true));
            // Les abonnés sont prévenus des deux changements (les listes sont refaites)
            assert.deepEqual(changes, [[ODYSSEY_MODE_KEY], [ODYSSEY_MODE_KEY]]);
            assert.equal(odysseyActive(store.get()), true);
            assert.equal(sheetFingerprint(store.get()), before);
            assert.equal(fingerprint(normalizeCharacter(store.get())), before);
            assert.equal(fingerprint(store.get()), fingerprint(character));
            // Ce qui est enregistré (appareil, export, compte) ne contient plus la clé
            assert.equal(serializeCharacter(store.get()), savedBefore);
            assert.deepEqual(JSON.parse(JSON.stringify(store.get())), JSON.parse(JSON.stringify(character)));
            assert.ok(!(ODYSSEY_MODE_KEY in migrateCharacter(JSON.parse(JSON.stringify(store.get()))).character));
            // Recocher une seconde fois n'écrit plus rien
            assert.deepEqual(setOdysseyModePatch(store.get(), true), {});
        });
    }

    test('Une fiche qui porterait une autre valeur (« on ») reste active et n\'est pas réécrite', () => {
        const record = sheet({ [ODYSSEY_MODE_KEY]: 'on' });
        assert.equal(odysseyActive(record), true);
        assert.deepEqual(setOdysseyModePatch(record, true), {});
        assert.deepEqual(setOdysseyModePatch(record, false), { odyssey_mode: 'off' });
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

    test('Messages de la barre : place choisie selon l\u2019écran, choix abandonné signalé hors remplacement de fiche', () => {
        assert.match(ui, /odysseyModeMessage\(store\.get\(\), compact\.matches \? STATUS_ROOM_OPEN : STATUS_ROOM_NARROW\)/);
        assert.match(ui, /odysseyDroppedMessage\(before, character, compact\.matches \? STATUS_ROOM : STATUS_ROOM_NARROW\)/);
        assert.match(ui, /if \(changedKeys === null\) return;/);
        assert.match(ui, /matchMedia\(COMPACT_QUERY\)/);
        assert.match(read('js/ui/toolbar.js'), /export const COMPACT_QUERY = /);
        // Menu ouvert sur tablette : deux lignes, place réservée (rien ne bouge sous le doigt)
        assert.match(read('css/toolbar.css'), /#app-bar:not\(\.app-bar--collapsed\) #save-status \{[^}]*min-height: 2\.5em;[^}]*white-space: normal;/);
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
        // Choix abandonné mode coupé, encadré disparu : la notice dit de recocher la case
        const back = section('start').find((entry) => entry.title === '« Mode Odyssée » décoché : retrouver un choix');
        assert.match(back.text, /il sort aussitôt de sa liste/);
        assert.match(back.text, /Recochez la case « Mode Odyssée » pour le retrouver\./);
        assert.match(section('role').find((entry) => entry.title === '« Odyssée des Seigneurs Dragons »').text, /recochez la case\./);
        assert.ok(section('lock').some((entry) => entry.text.includes(`« ${ODYSSEY_MODE_LABEL} »`)));
        assert.ok(section('role').find((entry) => entry.title === '« Odyssée des Seigneurs Dragons »').text.includes(`« ${ODYSSEY_MODE_LABEL} »`));
    });

    test('Nouveautés 4.44.0 : la case, ce qui reste en place, et les deux libellés d\u2019Inspiration', () => {
        const entry = WHATS_NEW.find((item) => item.version === '4.44.0');
        assert.ok(entry, 'entrée 4.44.0');
        const text = entry.items.join(' ');
        assert.match(text, /« Gestion »/);
        assert.ok(text.includes(`« ${ODYSSEY_MODE_LABEL} »`));
        assert.match(text, /cochée au départ/);
        assert.match(text, /reste en place/);
        assert.ok(text.includes(`« ${inspirationWording({}).label} »`));
        assert.ok(text.includes(`« ${inspirationWording({ [ODYSSEY_MODE_KEY]: 'off' }).label} »`));
    });
});
