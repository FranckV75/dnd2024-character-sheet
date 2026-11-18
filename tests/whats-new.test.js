/**
 * TESTS — FENÊTRE « NOUVEAUTÉS » (js/state/whats-new.js, js/data/whats-new.js)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { newsToShow, SEEN_VERSION_KEY, MAX_NEWS_VERSIONS } from '../js/state/whats-new.js';
import { parseVersion, isNewerVersion } from '../js/state/update-check.js';
import { WHATS_NEW } from '../js/data/whats-new.js';
import { APP_VERSION } from '../js/version.js';
import { V4_ONLY_KEYS } from '../js/cloud/sync.js';
import { createDefaultCharacter } from '../js/state/schema.js';

const ENTRIES = [
    { version: '4.43.0', items: ['c'] },
    { version: '4.42.0', items: ['b'] },
    { version: '4.41.0', items: ['a'] },
    { version: '4.40.0', items: ['z'] }
];
const versions = (plan) => plan.entries.map((entry) => entry.version);

describe('Nouveautés : données', () => {
    test('La version de la page (js/version.js) a son entrée', () => {
        assert.ok(WHATS_NEW.some((entry) => entry.version === APP_VERSION),
            `Ajoutez une entrée « ${APP_VERSION} » en tête de js/data/whats-new.js`);
    });

    test('Entrées 4.41.0 et 4.40.0 présentes', () => {
        const all = WHATS_NEW.map((entry) => entry.version);
        assert.ok(all.includes('4.41.0'));
        assert.ok(all.includes('4.40.0'));
    });

    test('Versions lisibles, sans doublon, la plus récente d\'abord', () => {
        const all = WHATS_NEW.map((entry) => entry.version);
        for (const version of all) assert.ok(parseVersion(version), version);
        assert.equal(new Set(all).size, all.length);
        for (let i = 1; i < all.length; i += 1) {
            assert.ok(isNewerVersion(all[i - 1], all[i]), `${all[i - 1]} doit précéder ${all[i]}`);
        }
    });

    test('3 à 6 lignes courtes par version, sans mot technique', () => {
        for (const { version, items } of WHATS_NEW) {
            assert.ok(items.length >= 3 && items.length <= 6, `${version} : ${items.length} lignes`);
            for (const item of items) {
                assert.equal(typeof item, 'string');
                assert.ok(item.trim().length >= 20 && item.length <= 240, `${version} : « ${item} »`);
                assert.doesNotMatch(item, /localStorage|JSON|Supabase|\.js\b|<|>/, item);
            }
        }
    });

    test('Données figées', () => {
        assert.ok(Object.isFrozen(WHATS_NEW));
        assert.ok(WHATS_NEW.every((entry) => Object.isFrozen(entry) && Object.isFrozen(entry.items)));
    });
});

describe('Nouveautés : que montrer sur cet appareil', () => {
    test('Vraie première visite (aucune version retenue, aucune fiche) : rien, la version est retenue', () => {
        const plan = newsToShow({ entries: ENTRIES, lastSeen: null, current: '4.41.0', returning: false });
        assert.deepEqual(plan, { entries: [], remember: true });
    });

    test('Joueur déjà venu, avant l\'arrivée de la fenêtre : les nouveautés de la version installée seulement', () => {
        const plan = newsToShow({ entries: ENTRIES, lastSeen: null, current: '4.41.0', returning: true });
        assert.deepEqual(versions(plan), ['4.41.0']);
        assert.equal(plan.remember, true);
    });

    test('Joueur déjà venu, version sans entrée : rien, la version est retenue', () => {
        const plan = newsToShow({ entries: ENTRIES, lastSeen: null, current: '4.39.0', returning: true });
        assert.deepEqual(plan, { entries: [], remember: true });
    });

    test('Après une mise à jour : la nouvelle version', () => {
        const plan = newsToShow({ entries: ENTRIES, lastSeen: '4.40.0', current: '4.41.0' });
        assert.deepEqual(versions(plan), ['4.41.0']);
        assert.equal(plan.remember, true);
    });

    test('Plusieurs versions sautées : toutes celles entre la dernière vue et l\'actuelle, la plus récente d\'abord', () => {
        const plan = newsToShow({ entries: ENTRIES, lastSeen: '4.40.0', current: '4.43.0', returning: true });
        assert.deepEqual(versions(plan), ['4.43.0', '4.42.0', '4.41.0']);
    });

    test('Une entrée plus récente que la page n\'est jamais montrée', () => {
        const plan = newsToShow({ entries: ENTRIES, lastSeen: '4.39.0', current: '4.41.0' });
        assert.deepEqual(versions(plan), ['4.41.0', '4.40.0']);
    });

    test('Entrées dans le désordre : rangées de la plus récente à la plus ancienne', () => {
        const plan = newsToShow({ entries: [...ENTRIES].reverse(), lastSeen: '4.39.0', current: '4.43.0' });
        assert.deepEqual(versions(plan), ['4.43.0', '4.42.0', '4.41.0', '4.40.0']);
    });

    test('Même version déjà vue : rien, rien à retenir', () => {
        assert.deepEqual(newsToShow({ entries: ENTRIES, lastSeen: '4.41.0', current: '4.41.0', returning: true }),
            { entries: [], remember: false });
    });

    test('Retour à une page plus ancienne : rien, la version retenue ne recule pas', () => {
        assert.deepEqual(newsToShow({ entries: ENTRIES, lastSeen: '4.43.0', current: '4.41.0', returning: true }),
            { entries: [], remember: false });
    });

    test('Mise à jour sans entrée entre les deux : rien à montrer, la version est retenue', () => {
        const plan = newsToShow({ entries: ENTRIES, lastSeen: '4.43.0', current: '4.43.1' });
        assert.deepEqual(plan, { entries: [], remember: true });
    });

    test('Version retenue illisible : traitée comme absente', () => {
        assert.deepEqual(newsToShow({ entries: ENTRIES, lastSeen: 'abc', current: '4.41.0', returning: false }),
            { entries: [], remember: true });
        assert.deepEqual(versions(newsToShow({ entries: ENTRIES, lastSeen: '', current: '4.41.0', returning: true })), ['4.41.0']);
    });

    test('Version de la page illisible : rien, rien à retenir', () => {
        assert.deepEqual(newsToShow({ entries: ENTRIES, lastSeen: '4.40.0', current: '' }), { entries: [], remember: false });
    });

    test('Entrées abîmées (version illisible, aucune ligne) : ignorées', () => {
        const broken = [{ version: 'x', items: ['a'] }, { version: '4.41.0', items: [] }, null, { version: '4.41.0', items: ['ok'] }];
        const plan = newsToShow({ entries: broken, lastSeen: '4.40.0', current: '4.41.0' });
        assert.deepEqual(plan.entries, [{ version: '4.41.0', items: ['ok'] }]);
        assert.deepEqual(newsToShow({ entries: undefined, lastSeen: '4.40.0', current: '4.41.0' }), { entries: [], remember: true });
    });

    test('Beaucoup de versions sautées : la fenêtre garde les plus récentes', () => {
        const many = Array.from({ length: 10 }, (_, i) => ({ version: `5.${i}.0`, items: ['x'] }));
        const plan = newsToShow({ entries: many, lastSeen: '4.0.0', current: '5.9.0' });
        assert.equal(plan.entries.length, MAX_NEWS_VERSIONS);
        assert.equal(plan.entries[0].version, '5.9.0');
    });

    test('Avec les vraies données : la version de la page est montrée à un joueur déjà venu', () => {
        const plan = newsToShow({ entries: WHATS_NEW, lastSeen: null, current: APP_VERSION, returning: true });
        assert.deepEqual(versions(plan), [APP_VERSION]);
    });

    test('Fenêtre branchée : titre « Nouveautés de la version X », annoncée par la vérification de mise à jour', (t) => {
        const file = new URL('../js/ui/whats-new.js', import.meta.url);
        if (!existsSync(file)) return t.skip('fenêtre pas encore ajoutée');
        const windowSource = readFileSync(file, 'utf8');
        assert.ok(windowSource.includes('Nouveautés de la version ${APP_VERSION}'));
        // Jamais par-dessus une autre fenêtre (question de synchronisation, avis du démarrage)
        assert.ok(windowSource.includes('dialog[open]'));
        assert.ok(readFileSync(new URL('../js/ui/update.js', import.meta.url), 'utf8').includes('announceNews('));
    });

    test('La version vue est une préférence d\'appareil : préfixe dd2024_, jamais une clé de la fiche', () => {
        assert.match(SEEN_VERSION_KEY, /^dd2024_/);
        assert.ok(!Object.hasOwn(createDefaultCharacter(), SEEN_VERSION_KEY));
        assert.ok(![...V4_ONLY_KEYS].includes(SEEN_VERSION_KEY));
    });
});
