/**
 * TESTS — MODE D'EMPLOI (js/data/help.js) et libellés cités (aussi dans js/data/whats-new.js)
 *
 * La notice ne doit décrire que ce qui existe : chaque texte écrit entre « » est un libellé de
 * l'interface, cherché tel quel dans index.html et dans le code de l'interface. Un bouton renommé
 * sans que la notice suive fait échouer ce test.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HELP_SECTIONS, HELP_NEWS_SECTION, HELP_CONTENTS, HELP_INTERNAL_FILES } from '../js/data/help.js';
import { WHATS_NEW } from '../js/data/whats-new.js';
import { frenchSpaces } from '../js/ui/help.js';
import { fromVisualPrefs, portableBackground } from '../js/rules/gallery.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Textes de l'interface : index.html et tout js/, sauf les textes de la notice eux-mêmes */
function interfaceSource() {
    const files = [join(ROOT, 'index.html')];
    const walk = (dir) => {
        for (const name of readdirSync(dir)) {
            const full = join(dir, name);
            if (statSync(full).isDirectory()) walk(full);
            else if (name.endsWith('.js')) files.push(full);
        }
    };
    walk(join(ROOT, 'js'));
    const excluded = new Set(['help.js', 'whats-new.js'].map((name) => join(ROOT, 'js', 'data', name)));
    return files
        .filter((file) => !excluded.has(file))
        .map((file) => readFileSync(file, 'utf8'))
        .join('\n')
        // Écritures du code ramenées au texte affiché : &amp; (HTML), \' (chaînes JS)
        .replaceAll('&amp;', '&')
        .replaceAll("\\'", "'");
}

/** Libellés cités entre « » dans un texte */
const quoted = (text) => [...String(text).matchAll(/«\s([^«»]+?)\s»/g)].map((match) => match[1]);

const allTexts = [
    ...HELP_SECTIONS.flatMap((section) => [section.title, ...section.entries.flatMap((entry) => [entry.title, entry.text])]),
    ...WHATS_NEW.flatMap((entry) => entry.items)
];

describe('Mode d\'emploi : structure', () => {
    test('Rubriques demandées, dans l\'ordre du sommaire', () => {
        assert.deepEqual(HELP_SECTIONS.map((section) => section.id),
            ['start', 'save', 'account', 'display', 'lock', 'combat', 'traits', 'role', 'magic', 'rest', 'level']);
        assert.deepEqual(HELP_CONTENTS.map((section) => section.id).at(-1), 'news');
    });

    test('Identifiants uniques ; chaque rubrique a un titre et des entrées { title, text }', () => {
        assert.equal(new Set(HELP_CONTENTS.map((section) => section.id)).size, HELP_CONTENTS.length);
        for (const section of HELP_SECTIONS) {
            assert.ok(section.title.trim(), section.id);
            assert.ok(section.entries.length >= 3, `${section.id} : au moins 3 entrées`);
            for (const entry of section.entries) {
                assert.deepEqual(Object.keys(entry).sort(), ['files', 'text', 'title'], `${section.id} / ${entry.title}`);
                assert.ok(entry.title.trim() && entry.text.trim());
            }
            assert.equal(new Set(section.entries.map((entry) => entry.title)).size, section.entries.length, `${section.id} : titres en double`);
        }
    });

    // Relecture à chaque version (`npm run notice`) : chaque entrée dit quels fichiers de
    // l'interface font ce qu'elle décrit, et chaque fichier de js/ui/ est cité ou déclaré interne.
    test('Chaque entrée cite les fichiers qu\'elle décrit ; chaque fichier de js/ui/ est cité ou interne', () => {
        const cited = new Set();
        for (const section of HELP_SECTIONS) {
            for (const entry of section.entries) {
                assert.ok(Array.isArray(entry.files) && entry.files.length >= 1, `${section.id} / ${entry.title} : files`);
                for (const file of entry.files) {
                    assert.ok(existsSync(join(ROOT, file)) && statSync(join(ROOT, file)).isFile(), `${entry.title} : ${file} n'existe pas`);
                    cited.add(file);
                }
            }
        }
        for (const file of HELP_INTERNAL_FILES) {
            assert.ok(existsSync(join(ROOT, file)), `HELP_INTERNAL_FILES : ${file} n'existe pas`);
            assert.ok(!cited.has(file), `${file} est à la fois cité et déclaré interne`);
        }
        const uiFiles = [];
        const walk = (dir) => {
            for (const name of readdirSync(join(ROOT, dir))) {
                const path = `${dir}/${name}`;
                if (statSync(join(ROOT, path)).isDirectory()) walk(path);
                else if (name.endsWith('.js')) uiFiles.push(path);
            }
        };
        walk('js/ui');
        for (const file of uiFiles) {
            assert.ok(cited.has(file) || HELP_INTERNAL_FILES.includes(file),
                `${file} : citez-le dans l'entrée du mode d'emploi qui décrit ce qu'il fait, ou ajoutez-le à HELP_INTERNAL_FILES`);
        }
    });

    test('Un onglet de la fiche = une rubrique qui porte son nom exact', () => {
        const titles = HELP_SECTIONS.map((section) => section.title);
        for (const tab of ['Caractéristiques & Combat', 'Aptitudes & Traits', 'Compétences & Histoire', 'Magie, équipement & trésors']) {
            assert.ok(titles.includes(`Onglet « ${tab} »`), tab);
        }
    });

    test('Sujets demandés : enregistrement, compte, import / export, impression, thème, fonds, verrou, repos, niveau, grimoire, outils', () => {
        const text = allTexts.join('\n');
        for (const label of ['Enregistré dans ce navigateur', 'Se connecter', 'Mes personnages', 'Importer', 'Exporter', 'Imprimer',
            'Fonds', 'Verrouillée', 'Modifiable', 'Repos court (1 h)', 'Repos long (8 h)', 'Passer au niveau',
            'Préparer mes sorts', 'Au combat', 'Lancer', 'Liste de sorts', 'Choisir dans la liste', 'Revenir à…',
            'Essayer un personnage d\'exemple', 'Nouvelle fiche']) {
            assert.ok(text.includes(`« ${label} »`), `« ${label} » n'est expliqué nulle part`);
        }
        assert.match(text, /thème sombre/);
    });

    test('Phrases courtes, adressées au joueur', () => {
        for (const section of HELP_SECTIONS) {
            for (const entry of section.entries) {
                assert.ok(entry.text.length <= 420, `${section.id} / ${entry.title} : ${entry.text.length} caractères`);
                for (const sentence of entry.text.split(/(?<=[.!?])\s+/)) {
                    assert.ok(sentence.length <= 230, `Phrase trop longue (${section.id} / ${entry.title}) : ${sentence}`);
                }
                assert.doesNotMatch(entry.text, /(?<!\p{L})(tu|ton|ta|tes)(?!\p{L})/iu,`${entry.title} : vouvoiement`);
                assert.doesNotMatch(entry.text, /localStorage|JSON\b|Supabase|store\b|\bclé\b/, `${entry.title} : mot technique`);
            }
        }
    });

    test('Rubrique « Nouveautés » : une entrée par version de js/data/whats-new.js, dans le même ordre', () => {
        assert.deepEqual(HELP_NEWS_SECTION.entries.map((entry) => entry.title), WHATS_NEW.map((entry) => `Version ${entry.version}`));
        for (const [i, entry] of HELP_NEWS_SECTION.entries.entries()) assert.deepEqual([...entry.items], [...WHATS_NEW[i].items]);
    });

    test('Données figées', () => {
        assert.ok(Object.isFrozen(HELP_SECTIONS) && Object.isFrozen(HELP_CONTENTS));
        assert.ok(HELP_SECTIONS.every((section) => Object.isFrozen(section) && Object.isFrozen(section.entries)));
    });
});

describe('Mode d\'emploi et nouveautés : libellés cités', () => {
    const source = interfaceSource();

    test('Chaque texte entre « » existe tel quel dans l\'interface', () => {
        const labels = [...new Set(allTexts.flatMap(quoted))];
        assert.ok(labels.length > 60, `${labels.length} libellés cités`);
        const missing = labels.filter((label) => !source.includes(label));
        assert.deepEqual(missing, [], 'Libellés cités par la notice mais absents de l\'interface');
    });

    test('Guillemets français bien formés (espace après « et avant »)', () => {
        for (const text of allTexts) {
            const open = (text.match(/«/g) || []).length;
            assert.equal(open, (text.match(/»/g) || []).length, text);
            assert.equal(quoted(text).length, open, `Guillemets mal espacés : ${text}`);
        }
    });

    test('Affichage : espaces insécables après «, avant » et avant : ; ? ! (jamais un signe seul en bout de ligne)', () => {
        assert.equal(frenchSpaces('Le bouton « Lancer » : oui ; non ?'),
            'Le bouton «\u00A0Lancer\u00A0»\u00A0: oui\u00A0; non\u00A0?');
        assert.equal(frenchSpaces('Sans signe'), 'Sans signe');
        // Un libellé court n'est pas coupé avant son dernier mot suivi de « … »
        assert.equal(frenchSpaces('dans « Revenir à… ».'), 'dans «\u00A0Revenir\u00A0à…\u00A0».');
        assert.equal(frenchSpaces('Choisir un fichier .json…'), 'Choisir un fichier .json…');
        assert.equal(frenchSpaces(undefined), '');
    });

    test('Affichage : la notice dit que le thème et le fond suivent le personnage (_visual_prefs), pas l\'appareil', () => {
        // Ce que fait la fiche : les réglages du personnage chargé sont appliqués à l'appareil
        assert.deepEqual(fromVisualPrefs({ theme: 'dark', galleryBg: 'Fond_1.webp', bgZoom: '120' }, () => true),
            { bg: 'Fond_1.webp', zoom: 120, theme: 'dark' });
        // Une image de l'appareil n'est jamais recopiée dans le personnage
        assert.equal(portableBackground('data:image/png;base64,AAAA'), null);
        const display = HELP_SECTIONS.find((section) => section.id === 'display');
        const entry = display.entries.at(-1);
        assert.equal(entry.title, 'Des réglages qui suivent le personnage');
        assert.match(entry.text, /enregistrés avec le personnage/);
        assert.doesNotMatch(display.entries.map((e) => e.text).join(' '), /retenus sur cet appareil/);
    });

    test('Dons : les repères expliqués sont ceux de l\'encadré « Dans la fiche » (noteKind, js/ui/sheet.js)', () => {
        const sheet = readFileSync(join(ROOT, 'js', 'ui', 'sheet.js'), 'utf8');
        const start = sheet.indexOf('function noteKind(');
        assert.ok(start > 0, 'noteKind existe');
        const body = sheet.slice(start, sheet.indexOf('\n}', start));
        const marks = [...body.matchAll(/\['[\w-]+', '([^']+)'\]/g)].map((match) => match[1]);
        assert.ok(marks.length >= 6, `repères trouvés : ${marks.join(', ')}`);
        const entry = HELP_SECTIONS.find((section) => section.id === 'traits').entries.find((e) => e.title === '« Dons »');
        const cited = quoted(entry.text);
        assert.equal(cited[0], 'Dans la fiche', 'le titre de l\'encadré, cité en premier');
        assert.ok(sheet.includes("text: 'Dans la fiche'"), 'titre de l\'encadré');
        assert.deepEqual(cited.slice(1).sort(), [...marks].sort());
    });

    test('Fenêtre « Essayer un personnage d\'exemple » : chaque texte affiché passe par frenchSpaces', () => {
        const code = readFileSync(join(ROOT, 'js', 'ui', 'examples.js'), 'utf8');
        // Textes écrits dans le code : toute chaîne qui contient un guillemet français ou « : »
        const shown = code.split('\n').filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*')
            && /text: /.test(line) && /«| : /.test(line));
        assert.ok(shown.length >= 2);
        assert.match(code, /frenchSpaces\(example\.pitch\)/);
        for (const line of shown) assert.match(line, /text: frenchSpaces\(/, line.trim());
        assert.match(code, /setStatus\(frenchSpaces\(/);
        assert.match(code, /frenchSpaces\(replacementNote\(/);
    });

    test('Les boutons du mode d\'emploi et de l\'exemple existent sous ce nom', () => {
        for (const label of ['Mode d\'emploi', 'Imprimer le mode d\'emploi', 'Essayer un personnage d\'exemple', 'Sommaire']) {
            assert.ok(source.includes(label), label);
        }
    });
});
