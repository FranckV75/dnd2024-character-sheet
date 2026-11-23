/**
 * TESTS — APTITUDES DE BASE DES CLASSES (js/data/class-progression.js, js/rules/class-progression.js)
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CLASS_PROGRESSION } from '../js/data/class-progression.js';
import {
    classProgression, classSpellCounts, featuresAtLevel, classAlwaysPreparedSpells, classGrantedSpells
} from '../js/rules/class-progression.js';
import { DD_RULES } from '../js/data/dd-rules.js';
import { SPELL_CHOICE_FEATURES } from '../js/data/spell-choices.js';

describe('Données des 12 classes', () => {
    test('Une entrée par classe de DD_RULES, colonnes de 20 niveaux', () => {
        assert.deepEqual(Object.keys(CLASS_PROGRESSION).sort(), Object.keys(DD_RULES.classes).sort());
        for (const [slug, data] of Object.entries(CLASS_PROGRESSION)) {
            for (const [name, values] of Object.entries(data.columns)) assert.equal(values.length, 20, `${slug} ${name}`);
            for (const feature of data.features) {
                assert.ok(feature.level >= 1 && feature.level <= 20, `${slug} ${feature.name}`);
                assert.ok(['feature', 'subclass', 'asi', 'epic'].includes(feature.kind), `${slug} ${feature.name}`);
                if (feature.kind === 'feature') assert.ok(feature.text?.length > 20, `${slug} ${feature.name}`);
            }
        }
    });

    test('Chaque classe : sous-classe au niveau 3, Faveur épique au niveau 19, dons aux niveaux 4, 8, 12, 16', () => {
        for (const [slug, data] of Object.entries(CLASS_PROGRESSION)) {
            const levels = (kind) => data.features.filter(f => f.kind === kind).map(f => f.level);
            assert.deepEqual(levels('subclass'), [3], slug);
            assert.deepEqual(levels('epic'), [19], slug);
            for (const level of [4, 8, 12, 16]) assert.ok(levels('asi').includes(level), `${slug} ${level}`);
        }
        // Dons en plus : Guerrier (6, 14), Roublard (10)
        assert.deepEqual(CLASS_PROGRESSION.fighter.features.filter(f => f.kind === 'asi').map(f => f.level), [4, 6, 8, 12, 14, 16]);
        assert.deepEqual(CLASS_PROGRESSION.rogue.features.filter(f => f.kind === 'asi').map(f => f.level), [4, 8, 10, 12, 16]);
    });

    test('Noms du livre : le titre de l\'aptitude fait foi', () => {
        const names = (slug) => CLASS_PROGRESSION[slug].features.map(f => f.name);
        assert.ok(names('barbarian').includes('Bond instinctif'));
        assert.ok(names('monk').includes('Déplacement acrobatique'));
        assert.ok(names('warlock').includes('Manifestations occultes'));
    });
});

describe('Progression au niveau du personnage', () => {
    test('Barbare niveau 6 : colonnes et prochain changement', () => {
        const p = classProgression('barbarian', 6);
        const rages = p.columns.find(c => c.name === 'Rages');
        assert.equal(rages.value, '4');
        assert.deepEqual(rages.next, { level: 12, value: '5' });
        assert.equal(p.columns.find(c => c.name === 'Dégâts de Rage').next.level, 9);
        assert.ok(p.reached.some(f => f.name === 'Attaque supplémentaire'));
        assert.ok(p.upcoming.every(f => f.level > 6));
        assert.equal(p.upcoming[0].name, 'Bond instinctif');
    });

    test('Aptitudes sans résumé : texte qui renvoie au bon endroit', () => {
        const p = classProgression('barbarian', 4);
        assert.match(p.reached.find(f => f.kind === 'subclass').text, /menu « Sous-classe »/);
        assert.match(p.reached.find(f => f.kind === 'asi').text, /bloc Dons/);
    });

    test('Identifiants stables et uniques (repli mémorisé)', () => {
        const p = classProgression('fighter', 20);
        const ids = p.reached.map(f => f.id);
        assert.equal(new Set(ids).size, ids.length);
        assert.equal(classProgression('fighter', 1).reached[0].id, ids[0]);
    });

    test('Niveau illisible : niveau 1 ; classe inconnue : rien', () => {
        assert.equal(classProgression('rogue', 'abc').columns[0].value, '1d6');
        assert.equal(classProgression('artificer', 3), null);
    });
});

describe('Sorts mineurs et sorts préparés', () => {
    test('Table de la classe', () => {
        assert.deepEqual(classSpellCounts('wizard', 1), { cantrips: 3, prepared: 4 });
        assert.deepEqual(classSpellCounts('wizard', 20), { cantrips: 5, prepared: 25 });
        assert.deepEqual(classSpellCounts('cleric', 5), { cantrips: 4, prepared: 9 });
        assert.deepEqual(classSpellCounts('warlock', 1), { cantrips: 2, prepared: 2 });
        assert.deepEqual(classSpellCounts('paladin', 1), { cantrips: null, prepared: 2 });
        assert.deepEqual(classSpellCounts('ranger', 9), { cantrips: null, prepared: 9 });
        assert.deepEqual(classSpellCounts('sorcerer', 2), { cantrips: 4, prepared: 4 });
    });

    test('Sorts toujours préparés par la classe (hors du compte)', () => {
        assert.deepEqual(classAlwaysPreparedSpells('ranger', 1), ['Marque du chasseur']);
        assert.deepEqual(classAlwaysPreparedSpells('paladin', 1), []);
        assert.deepEqual(classAlwaysPreparedSpells('paladin', 2), ['Châtiment divin']);
        // Fidèle destrier (niveau 5)
        assert.deepEqual(classAlwaysPreparedSpells('paladin', 5), ['Châtiment divin', 'Appel de destrier']);
        // Verbe de la création (Barde 20)
        assert.deepEqual(classAlwaysPreparedSpells('bard', 19), []);
        assert.deepEqual(classAlwaysPreparedSpells('bard', 20), ['Mot de pouvoir guérisseur', 'Mot de pouvoir mortel']);
        assert.deepEqual(classAlwaysPreparedSpells('warlock', 9), ['Contact avec les plans']);
        assert.deepEqual(classAlwaysPreparedSpells('wizard', 20), []);
        // Noms exacts de la base de sorts (comparaison du grimoire)
        const base = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
        const names = new Set((Array.isArray(base) ? base : Object.values(base)).map(s => s.name));
        for (const slug of ['bard', 'druid', 'ranger', 'paladin', 'warlock']) {
            for (const name of classAlwaysPreparedSpells(slug, 20)) assert.ok(names.has(name), name);
        }
    });

    test('Sorts de classe du bloc « Sorts de classe » : nom anglais, niveau du sort et capacité', () => {
        assert.deepEqual(classGrantedSpells('paladin', 5), [
            { classLevel: 2, name: 'Châtiment divin', vo: 'Divine Smite', level: 1, feature: 'Châtiment de paladin' },
            { classLevel: 5, name: 'Appel de destrier', vo: 'Find Steed', level: 2, feature: 'Fidèle destrier' }
        ]);
        assert.deepEqual(classGrantedSpells('paladin', 1), []);
        assert.deepEqual(classGrantedSpells('wizard', 20), []);
        assert.deepEqual(classGrantedSpells('', 20), []);
        assert.deepEqual(classGrantedSpells('toString', 20), []);
        const [mark] = classGrantedSpells('ranger', 1);
        assert.equal(mark.feature, 'Ennemi juré');
        assert.match(mark.note, /Ennemi juré/);
        // Nom anglais et niveau : ceux de la base de sorts ; capacité : celle de la table de la classe
        const base = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
        const spells = Array.isArray(base) ? base : Object.values(base);
        for (const slug of ['bard', 'druid', 'ranger', 'paladin', 'warlock']) {
            const features = classProgression(slug, 20).reached;
            for (const spell of classGrantedSpells(slug, 20)) {
                const known = spells.find(entry => entry.vo === spell.vo);
                assert.ok(known, spell.vo);
                assert.equal(known.name.split('|')[0], spell.name);
                assert.equal(Number(known.level), spell.level, spell.name);
                assert.ok(features.some(feature => feature.name === spell.feature && feature.level === spell.classLevel), spell.feature);
            }
        }
    });

    test('Classes sans sorts', () => {
        assert.deepEqual(classSpellCounts('barbarian', 5), { cantrips: null, prepared: null });
        assert.deepEqual(classSpellCounts('', 5), { cantrips: null, prepared: null });
    });
});

describe('Assistant de montée de niveau', () => {
    test('Aptitudes gagnées à un niveau', () => {
        assert.deepEqual(featuresAtLevel('barbarian', 7).map(f => f.name), ['Bond instinctif', 'Instinct sauvage']);
        assert.deepEqual(featuresAtLevel('monk', 6).map(f => f.name), ['Frappes renforcées']);
        assert.deepEqual(featuresAtLevel('barbarian', 6), []);
        assert.deepEqual(featuresAtLevel('nope', 2), []);
    });
});

describe('Assistant « Passer au niveau N » : aptitudes et sorts', () => {
    test('Barbare 6 → 7 : les deux aptitudes du niveau 7', async () => {
        const { planLevelUp } = await import('../js/rules/level-up.js');
        const plan = planLevelUp({ char_class: 'Barbare', char_level: '6', hp_max: '60', con_score: '14' });
        const lines = plan.sections.find(s => s.title === 'Classe').lines;
        assert.ok(lines.includes('Nouvelle aptitude : Bond instinctif.'));
        assert.ok(lines.includes('Nouvelle aptitude : Instinct sauvage.'));
        assert.ok(!lines.some(l => /voir le manuel/.test(l)));
    });

    test('Magicien 3 → 4 : sorts mineurs et sorts préparés de la table', async () => {
        const { planLevelUp } = await import('../js/rules/level-up.js');
        const lines = planLevelUp({ char_class: 'Magicien', char_level: '3', hp_max: '20' }).sections.find(s => s.title === 'Sorts').lines;
        assert.ok(lines.includes('Sorts mineurs : 3 → 4 (un sort mineur de plus à choisir).'));
        assert.ok(lines.includes('Sorts préparés : 6 → 7 (1 sort de plus à préparer).'));
    });

    test('Ancien nom de classe (« Sorcier ») : mêmes aptitudes que l\'Occultiste', async () => {
        const { planLevelUp } = await import('../js/rules/level-up.js');
        const lines = planLevelUp({ char_class: 'Sorcier', char_level: '1', hp_max: '9' }).sections.find(s => s.title === 'Classe').lines;
        assert.ok(lines.includes('Nouvelle aptitude : Rouerie magique.'));
    });
});

describe('Sorts de classe : rappels sous le sort et sous l\'aptitude', () => {
    test('Contact avec les plans : la sauvegarde réussie d\'office ne vaut que pour le lancer sans emplacement', () => {
        const [contact] = classGrantedSpells('warlock', 9);
        assert.equal(contact.vo, 'Contact Other Plane');
        assert.match(contact.note, /^Seul le lancer sans emplacement \(une fois par repos long, case de cette ligne\) a sa sauvegarde réussie d'office\./);
        assert.match(contact.note, /Lancé avec un emplacement de pacte, le sort garde sa sauvegarde normale\./);
        // Jamais « lancé sans emplacement » dit comme si tout lancer l'était
        assert.doesNotMatch(contact.note, /^Lancé sans emplacement/);
    });

    test('Magicien : Maîtrise des sorts et Sorts de prédilection disent où sont leurs menus', () => {
        const { reached } = classProgression('wizard', 20);
        const mastery = reached.find(feature => feature.name === 'Maîtrise des sorts');
        const signature = reached.find(feature => feature.name === 'Sorts de prédilection');
        assert.equal(mastery.inSheet, 'Deux menus dans le grimoire (onglet Magie, « Sorts de classe ») : les sorts choisis sont toujours préparés et ne comptent pas dans vos sorts préparés. Leur bouton « Lancer » propose ensuite le lancer sans emplacement.');
        assert.equal(signature.inSheet, 'Deux menus dans le grimoire (onglet Magie, « Sorts de classe ») : les sorts choisis sont toujours préparés et ne comptent pas dans vos sorts préparés. Leur bouton « Lancer » propose ensuite le lancer sans emplacement et coche sa case (onglet Caractéristiques & Combat).');
        // Le texte du manuel (résumé) ne change pas ; aptitudes à venir et assistant de niveau : même renvoi
        assert.equal(mastery.text, CLASS_PROGRESSION.wizard.features.find(feature => feature.name === 'Maîtrise des sorts').text);
        assert.equal(classProgression('wizard', 17).upcoming.find(feature => feature.name === 'Maîtrise des sorts').inSheet, mastery.inSheet);
        assert.equal(featuresAtLevel('wizard', 20)[0].inSheet, signature.inSheet);
    });

    test('Chaque capacité de classe à sorts choisis a son aptitude et son renvoi ; aucune autre aptitude n\'en a', () => {
        const expected = SPELL_CHOICE_FEATURES.filter(choice => !choice.subclass).map(choice => `${choice.classSlug}:${choice.level}:${choice.name}`);
        assert.deepEqual(expected, ['wizard:18:Maîtrise des sorts', 'wizard:20:Sorts de prédilection']);
        const found = [];
        for (const slug of Object.keys(CLASS_PROGRESSION)) {
            for (const feature of classProgression(slug, 20).reached) {
                if (feature.inSheet) found.push(`${slug}:${feature.level}:${feature.name}`);
                else assert.equal(Object.hasOwn(feature, 'inSheet'), false, feature.name);
            }
        }
        assert.deepEqual(found, expected);
    });

    test('Interface : ligne « Dans la fiche » sous l\'aptitude atteinte, comme pour les capacités de sous-classe', () => {
        const ui = readFileSync(new URL('../js/ui/class-progression.js', import.meta.url), 'utf8');
        assert.match(ui, /feature\.inSheet && !upcoming\s*\? el\('p', \{ class: 'subclass-feature-auto' \}, icon\('gear'\), el\('span', \{ text: `Dans la fiche : \$\{feature\.inSheet\}` \}\)\)/);
        assert.match(readFileSync(new URL('../js/ui/subclass.js', import.meta.url), 'utf8'), /el\('p', \{ class: 'subclass-feature-auto' \},/);
        assert.match(readFileSync(new URL('../css/subclass.css', import.meta.url), 'utf8'), /\.subclass-feature-auto \{/);
        assert.doesNotMatch(ui, /innerHTML|onclick=/);
    });
});
