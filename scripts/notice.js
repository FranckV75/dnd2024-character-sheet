// =============================================================================
// NOTICE.JS - Rubriques du « Mode d'emploi » à relire avant de publier (`npm run notice`)
//
// Compare le dossier de travail (modifications non enregistrées comprises) à la version en ligne
// (branche origin/master, sinon master) et liste les entrées de js/data/help.js dont un fichier
// cité (« files ») a changé. Chacune est à relire face à la fiche : corriger ce qui est devenu
// faux, retirer ce qui complique, ajouter seulement ce qu'un joueur cherchera. Rappelle aussi
// l'entrée « Nouveautés » de la version (js/data/whats-new.js).
// Ne modifie rien et réussit toujours : c'est une liste de relecture, pas un garde-fou
// (le garde-fou, c'est tests/help.test.js). `npm run notice -- 43048a6` compare à un autre point.
// =============================================================================

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HELP_SECTIONS } from '../js/data/help.js';
import { WHATS_NEW } from '../js/data/whats-new.js';
import { APP_VERSION } from '../js/version.js';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

function onlineRef() {
    for (const ref of ['origin/master', 'master']) {
        try { git('rev-parse', '--verify', '--quiet', ref); return ref; } catch { /* suivante */ }
    }
    return null;
}

// Autre point de comparaison possible : npm run notice -- <commit ou étiquette>
const ref = process.argv[2] || onlineRef();
if (!ref) {
    console.log('Version en ligne introuvable (ni origin/master ni master) : rien à comparer.');
    process.exit(0);
}

const lines = (text) => text.split('\n').map((line) => line.trim()).filter(Boolean);
const changed = new Set([
    ...lines(git('diff', '--name-only', ref)),
    ...lines(git('ls-files', '--others', '--exclude-standard'))
]);

console.log(`Comparé à la version en ligne (${ref}) : ${changed.size} fichier(s) changé(s).\n`);

let count = 0;
for (const section of HELP_SECTIONS) {
    const toRead = section.entries
        .map((entry) => ({ entry, files: entry.files.filter((file) => changed.has(file)) }))
        .filter(({ files }) => files.length);
    if (!toRead.length) continue;
    console.log(section.title);
    for (const { entry, files } of toRead) {
        count++;
        console.log(`  - ${entry.title}  (${files.join(', ')})`);
    }
}
console.log(count
    ? `\n${count} entrée(s) du mode d'emploi à relire face à la fiche.`
    : "Aucune entrée du mode d'emploi ne décrit un fichier changé.");

const news = WHATS_NEW.find((entry) => entry.version === APP_VERSION);
let online = null;
try { online = JSON.parse(git('show', `${ref}:package.json`)).version; } catch { /* absent */ }
if (online === APP_VERSION) {
    console.log(`\nVersion ${APP_VERSION} : la même qu'en ligne. Pour publier, changer le numéro (package.json et js/version.js) et écrire ses « Nouveautés ».`);
} else {
    console.log(`\nVersion ${APP_VERSION} (en ligne : ${online ?? 'inconnue'}) : « Nouveautés » ${news ? `écrites (${news.items.length} lignes) : à relire aussi` : 'À ÉCRIRE dans js/data/whats-new.js'}.`);
}
