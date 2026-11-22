// =============================================================================
// CHECK.JS - Garde-fous automatiques (lancé par `npm run check` et la CI)
//  1. Syntaxe de chaque fichier JS (node --check)
//  2. Chaque import relatif pointe vers un fichier qui existe
//  3. Aucun gestionnaire inline (onclick=, onchange=...) dans les pages HTML,
//     aucun !important dans les feuilles de style (seule exception : la règle « Animations
//     coupées » de css/motion.css, qui doit l'emporter sur toutes les animations)
//  4. Aucun caractère mal encodé (mojibake : un « é » devenu deux caractères)
//  5. Le serveur de développement (scripts/serve.js) n'écoute que cet ordinateur
//     (127.0.0.1, ::1 ou localhost) : jamais le Wi-Fi, qui verrait les vraies sauvegardes
//  6. Aucune couleur écrite en dur dans les feuilles de style (#hex, rgb(), hsl()... avec des
//     nombres, white, black, red...) hors des lignes qui définissent une variable (--nom: ...) :
//     toute couleur passe par une variable, redéfinie pour le thème sombre et l'impression
// =============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const IGNORED_DIRS = new Set(['.git', 'node_modules', 'assets', 'docs', '.agent', '.claude']);

function listFiles(dir, ext) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) {
            if (!IGNORED_DIRS.has(name)) out.push(...listFiles(full, ext));
        } else if (name.endsWith(ext)) {
            out.push(full);
        }
    }
    return out;
}

const errors = [];
const rel = (p) => relative(ROOT, p).replaceAll('\\', '/');

const jsFiles = listFiles(ROOT, '.js');
const htmlFiles = listFiles(ROOT, '.html');

for (const file of jsFiles) {
    try {
        execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (e) {
        errors.push(`Syntaxe invalide : ${rel(file)}\n${e.stderr.toString().trim()}`);
    }

    const source = readFileSync(file, 'utf8');
    const importRe = /(?:import|export)\s[^'"]*?from\s*['"](\.{1,2}\/[^'"]+)['"]|import\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g;
    for (const match of source.matchAll(importRe)) {
        const target = match[1] || match[2];
        if (!existsSync(resolve(dirname(file), target))) {
            errors.push(`Import introuvable dans ${rel(file)} : ${target}`);
        }
    }
}

for (const file of htmlFiles) {
    const source = readFileSync(file, 'utf8');
    const inline = source.match(/\son[a-z]+\s*=\s*["']/gi);
    if (inline) errors.push(`Gestionnaire inline interdit dans ${rel(file)} : ${inline.join(', ')}`);
}

/** Seule règle autorisée à utiliser !important (sélecteur exact, dans css/motion.css) */
const IMPORTANT_ALLOWED = /:root\[data-animations="off"\] \*,\s*:root\[data-animations="off"\] \*::before,\s*:root\[data-animations="off"\] \*::after\s*\{\s*animation:\s*none !important;\s*transition:\s*none !important;\s*\}/;

for (const file of listFiles(ROOT, '.css')) {
    let withoutComments = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    if (rel(file).replace(/\\/g, '/') === 'css/motion.css') withoutComments = withoutComments.replace(IMPORTANT_ALLOWED, '');
    if (withoutComments.includes('!important')) errors.push(`!important interdit dans ${rel(file)}`);
}

for (const file of [...jsFiles, ...htmlFiles, ...listFiles(ROOT, '.css')]) {
    if (/\u00C3[\u0080-\u00BF]|\u00E2\u20AC/.test(readFileSync(file, 'utf8'))) {
        errors.push(`Texte mal encodé (mojibake) dans ${rel(file)}`);
    }
}

/** Adresses qui ne désignent que cet ordinateur */
const LOOPBACK = /^['"](127\.0\.0\.1|::1|localhost)['"]$/;
const serveFile = join(ROOT, 'scripts', 'serve.js');
// Seuls les blocs /* */ et les lignes entièrement en commentaire sont retirés : un « // » dans une
// chaîne (« http://… ») ne cache pas la suite de la ligne. Un appel en commentaire de fin de ligne
// est contrôlé lui aussi (refus par prudence, jamais l'inverse).
const serveSource = readFileSync(serveFile, 'utf8').replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '');
// .listen(port, hôte…), espaces permis avant la parenthèse ; forme objet .listen({ port, host: … })
const listenCalls = [...serveSource.matchAll(/\.listen\s*\(\s*(\{[^}]*\}|[^,)]*)(?:,([^,)]*))?/g)];
if (!listenCalls.length) errors.push(`Aucun appel listen trouvé dans ${rel(serveFile)} : contrôle à revoir`);
for (const [call, first, second] of listenCalls) {
    const host = first.startsWith('{') ? first.match(/(?<![\w$])host\s*:\s*([^,}]*)/)?.[1] : second;
    if (!LOOPBACK.test((host || '').trim())) {
        errors.push(`Serveur ouvert au réseau dans ${rel(serveFile)} : « ${call.trim()} » doit recevoir '127.0.0.1', '::1' ou 'localhost' en deuxième argument (ou host: dans la forme objet)`);
    }
}

/** Couleurs écrites en dur : code hexadécimal, fonction de couleur, mot de couleur (tous les noms
 *  de couleur de CSS ; transparent, currentColor, inherit... restent permis) */
const HEX_COLOR = /#[0-9a-f]{3,8}(?![\w-])/i;
const COLOR_FUNCTION = /(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(((?:[^()]|\([^()]*\))*)\)/gi;
const COLOR_NAMES = ['aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black', 'blanchedalmond',
    'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk',
    'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta',
    'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray',
    'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick',
    'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow',
    'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen',
    'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey',
    'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue',
    'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid',
    'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred',
    'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
    'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru',
    'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon',
    'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow',
    'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke',
    'yellow', 'yellowgreen'];
// « tan( » est une fonction de calcul (trigonométrie), pas une couleur
const COLOR_WORD = new RegExp(`(?<![\\w-])(${COLOR_NAMES.join('|')})(?![\\w(-])`, 'i');
/** Propriétés dont la valeur est un nom (animation « gold-glow », zone de grille...), pas une couleur */
const NAME_PROPERTIES = /^(animation(-name)?|transition(-property)?|will-change|font-family|grid-template-areas|grid-area|counter-(reset|increment|set)|view-transition-name|container(-name)?)$/i;
/** Exceptions : un masque ne garde que l'opacité de ses couleurs (#000 = visible), le thème n'y
 *  change rien ; initial-value (bloc @property) définit une variable, comme « --nom: … » */
const COLOR_FREE_PROPERTIES = /^((-webkit-)?mask(-image)?|initial-value)$/i;
const blankOut = (text) => text.replace(/[^\n]/g, ' ');

for (const file of listFiles(ROOT, '.css')) {
    // Commentaires, chaînes (content: "...") et url(...) effacés, les numéros de ligne gardés
    const source = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, blankOut)
        .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, blankOut)
        .replace(/url\([^)]*\)/gi, blankOut);
    // Texte avant chaque accolade : déclarations « propriété: valeur » séparées par « ; »
    // (devant « { », le dernier morceau est un sélecteur)
    for (const block of source.matchAll(/([^{}]*)([{}])/g)) {
        const pieces = block[1].split(';');
        if (block[2] === '{') pieces.pop();
        let offset = block.index;
        for (const piece of pieces) {
            const decl = piece.match(/^\s*([-\w]+)\s*:([\s\S]*)$/);
            if (decl && !decl[1].startsWith('--') && !NAME_PROPERTIES.test(decl[1]) && !COLOR_FREE_PROPERTIES.test(decl[1])) {
                const value = decl[2];
                // Une couleur construite avec des variables (hsl(var(--h) 70% 50%)) est permise ; pas un
                // noir ou un blanc fixé avant la première variable (rgba(0, 0, 0, var(--alpha)))
                const hardFunction = [...value.matchAll(COLOR_FUNCTION)]
                    .some((m) => !m[1].includes('var(') || /\d/.test(m[1].split('var(')[0]));
                if (HEX_COLOR.test(value) || COLOR_WORD.test(value) || hardFunction) {
                    const line = source.slice(0, offset + piece.search(/\S/)).split('\n').length;
                    errors.push(`Couleur écrite en dur dans ${rel(file)}, ligne ${line} : « ${decl[1]}:${value.replace(/\s+/g, ' ').trimEnd()} » (passer par une variable --nom définie avec le thème)`);
                }
            }
            offset += piece.length + 1;
        }
    }
}

if (errors.length) {
    console.error(`✖ ${errors.length} problème(s) :\n\n${errors.join('\n\n')}`);
    process.exit(1);
}
console.log(`✔ ${jsFiles.length} fichiers JS et ${htmlFiles.length} pages HTML vérifiés.`);
