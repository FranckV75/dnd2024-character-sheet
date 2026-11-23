/**
 * TESTS — « CONFIGURATION DE L'ARME » : QUITTER SANS APPLIQUER (js/ui/weapons/config.js, js/ui/modal.js)
 * Choix de Franck (23/11/2026) : après avoir changé un réglage, « Annuler », toucher le fond ou la
 * touche Échap demandent d'abord si l'on abandonne ces changements. Rien de changé : la fenêtre se
 * ferme tout de suite. Vérifié aussi à l'écran (navigateur sans fenêtre) lors de la 4.47.0.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const modal = readFileSync(new URL('../js/ui/modal.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../js/ui/weapons/config.js', import.meta.url), 'utf8');
const armors = readFileSync(new URL('../js/ui/armors.js', import.meta.url), 'utf8');

describe('Fenêtres : quitter sans agir (onDismiss)', () => {
    test('Les trois chemins passent par onDismiss : bouton dismiss, fond, touche Échap', () => {
        assert.match(modal, /if \(action\.dismiss\) \{\s*dismiss\(\);/);
        assert.match(modal, /if \(event\.target === dialog\) dismiss\(\);/);
        assert.match(modal, /addEventListener\('keydown', \(event\) => \{\s*if \(!onDismiss \|\| event\.key !== 'Escape' \|\| event\.defaultPrevented\) return;\s*event\.preventDefault\(\);\s*dismiss\(\);/);
    });

    test("Échap répété, geste retour : jamais de question seule à l'écran", () => {
        // Chrome et Edge refusent d'annuler un 'cancel' répété : la fenêtre se ferme, sans question
        assert.match(modal, /addEventListener\('cancel', \(event\) => \{\s*if \(!onDismiss \|\| !event\.cancelable\) return;\s*event\.preventDefault\(\);\s*dismiss\(\);/);
    });

    test('Sans onDismiss, rien ne change pour les autres fenêtres (Échap ferme comme avant)', () => {
        assert.match(modal, /const dismiss = \(\) => \{\s*if \(onDismiss\?\.\(\) === false\) return;\s*close\(\);/);
    });
});

describe('Configuration de l\'arme : confirmation avant de perdre un changement', () => {
    test('« Annuler » est le chemin « quitter sans agir » ; « Appliquer » ne demande rien', () => {
        assert.match(config, /\{ label: 'Annuler', dismiss: true \}/);
        assert.match(config, /\{ label: 'Appliquer', primary: true, onClick: \(\) => applyConfig\(ctx, index, form\) \}/);
    });

    test('Rien de changé : fermeture immédiate ; changé : une seule question à la fois', () => {
        assert.match(config, /if \(settingsSnapshot\(form\) === opened\) return true;/);
        assert.match(config, /if \(!asking\) \{/);
        assert.match(config, /confirmLabel: 'Fermer sans appliquer'/);
        assert.match(config, /cancelLabel: 'Continuer à modifier'/);
        assert.match(config, /if \(leave\) close\(\);/);
    });

    test('Tous les réglages comptent, une ligne de dégâts laissée vide non', () => {
        const snapshot = config.slice(config.indexOf('function settingsSnapshot'));
        for (const field of ['statSelect', 'magicSelect', 'dieInput', 'typeSelect', 'profSelect', 'extras.values()']) {
            assert.ok(snapshot.includes(field), field);
        }
        assert.match(snapshot, /filter\(\(line\) => line\.dmg\.trim\(\) \|\| line\.reason\.trim\(\)\)/);
    });
});

describe("Réglages de l'armure : même confirmation (accord de Franck, 23/11/2026)", () => {
    test('« Annuler », fond, Échap : question seulement après un changement', () => {
        assert.match(armors, /\{ label: 'Annuler', dismiss: true \}/);
        assert.match(armors, /const settingsSnapshot = \(\) => JSON\.stringify\(\[typeSelect\.value, baseInput\.value\.trim\(\), magicSelect\.value\]\);/);
        assert.match(armors, /if \(settingsSnapshot\(\) === opened\) return true;/);
        assert.match(armors, /if \(!asking\) \{/);
        assert.match(armors, /confirmLabel: 'Fermer sans appliquer'/);
        assert.match(armors, /cancelLabel: 'Continuer à modifier'/);
        assert.match(armors, /if \(leave\) close\(\);/);
    });
});
