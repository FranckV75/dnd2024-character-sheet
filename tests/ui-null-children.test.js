/**
 * Garde-fou de l'interface : replaceChildren(), append(), prepend(), before(), after() et
 * replaceWith() du navigateur écrivent « null » ou « undefined » en texte quand on leur passe
 * un élément absent (contrairement à el(), js/ui/dom.js, qui l'ignore). Le mot « null »
 * s'affichait ainsi sous l'Équipement de l'historique (4.37.0, js/ui/background.js).
 * Une liste avec « cond ? élément : null » doit donc passer par .filter(Boolean).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const UI_DIR = fileURLToPath(new URL('../js/ui/', import.meta.url));
const METHODS = /\.(replaceChildren|append|prepend|before|after|replaceWith)\(/g;

/** Texte des arguments d'un appel (parenthèses équilibrées, chaînes ignorées) */
function callArguments(source, open) {
    let depth = 0;
    for (let i = open; i < source.length; i++) {
        const c = source[i];
        if (c === '\'' || c === '"' || c === '`') {
            // Fin de la chaîne (caractère échappé sauté)
            for (i++; i < source.length && source[i] !== c; i++) if (source[i] === '\\') i++;
            continue;
        }
        if (c === '/' && source[i + 1] === '/') {
            i = source.indexOf('\n', i);
            continue;
        }
        if (c === '(') depth++;
        else if (c === ')' && --depth === 0) return { text: source.slice(open + 1, i) };
    }
    return { text: source.slice(open + 1) };
}

test('Aucun élément absent (null) passé tel quel au DOM dans js/ui/', () => {
    const offenders = [];
    for (const file of readdirSync(UI_DIR).filter(name => name.endsWith('.js'))) {
        const source = readFileSync(join(UI_DIR, file), 'utf8');
        for (const match of source.matchAll(METHODS)) {
            const open = match.index + match[0].length - 1;
            const { text } = callArguments(source, open);
            // Hors des appels imbriqués : un el(…) ignore déjà null, un .map(…) a sa propre logique
            let depth = 0;
            let top = '';
            for (const c of text) {
                if (c === '(') depth++;
                else if (c === ')') depth--;
                else if (depth === 0) top += c;
            }
            if (/:\s*(null|undefined)\b/.test(top) && !/\.filter\(Boolean\)/.test(text)) {
                const line = source.slice(0, match.index).split('\n').length;
                offenders.push(`${file}:${line}`);
            }
        }
    }
    assert.deepEqual(offenders, []);
});
