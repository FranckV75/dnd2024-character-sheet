// =============================================================================
// CHECK.JS - Garde-fous automatiques (lancé par `npm run check` et la CI)
//  1. Syntaxe de chaque fichier JS (node --check)
//  2. Chaque import relatif pointe vers un fichier qui existe
//  3. Aucun gestionnaire inline (onclick=, onchange=...) dans les pages HTML
//  4. Aucun caractère mal encodé (mojibake : un « é » devenu deux caractères)
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

for (const file of [...jsFiles, ...htmlFiles, ...listFiles(ROOT, '.css')]) {
    if (/\u00C3[\u0080-\u00BF]|\u00E2\u20AC/.test(readFileSync(file, 'utf8'))) {
        errors.push(`Texte mal encodé (mojibake) dans ${rel(file)}`);
    }
}

if (errors.length) {
    console.error(`✖ ${errors.length} problème(s) :\n\n${errors.join('\n\n')}`);
    process.exit(1);
}
console.log(`✔ ${jsFiles.length} fichiers JS et ${htmlFiles.length} pages HTML vérifiés.`);
