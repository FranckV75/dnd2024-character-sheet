/**
 * Toutes les fiches de test : la fiche fictive publiée (tests/fixtures/legacy-v1.json) et, quand
 * elles sont présentes sur l'ordinateur, les vraies sauvegardes de Korgul (tests/fixtures/local/,
 * jamais publiées : ignorées automatiquement ailleurs, par exemple sur GitHub).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const fixtureDir = new URL('../fixtures/', import.meta.url);
const localDir = new URL('../fixtures/local/', import.meta.url);

/** [nom, URL] de chaque fiche */
export const ALL_FIXTURES = [
    ['legacy-v1.json', new URL('legacy-v1.json', fixtureDir)],
    ...(existsSync(localDir)
        ? readdirSync(localDir).filter(f => f.endsWith('.json')).sort().map(f => [f, new URL(f, localDir)])
        : [])
];

/** Contenu JSON d'une fiche */
export const readFixture = (url) => JSON.parse(readFileSync(url, 'utf8'));
