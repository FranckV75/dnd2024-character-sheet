/**
 * TESTS D'INTÉGRITÉ DES DONNÉES (règles, dons, armes, armures, sorts)
 * Détectent les fautes de saisie dans les bases de données du jeu.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DD_RULES } from '../js/data/dd-rules.js';
import { FEATS_DATA } from '../js/data/feats.js';
import { EQUIPMENT_DATA } from '../js/data/equipment.js';
import { ABILITY_IDS, SKILLS, SKILLS_BY_STAT, DEFAULT_BGS } from '../js/data/constants.js';
import { matchesWeaponFilter, rowFromRulebookWeapon, completeRowFromRulebook } from '../js/rules/weapons.js';
import { computeWeapon } from '../js/rules/character.js';
import { findRulebookWeapon, migrateCharacter } from '../js/state/migrate.js';
import { EMPTY_WEAPON } from '../js/state/schema.js';

const DICE = /^(\d+d\d+|\d+)\s+(tran|cont|perf)\.$/;

describe('Classes et sous-classes', () => {
    test('12 classes, chacune avec un dé de vie valide', () => {
        const classes = Object.values(DD_RULES.classes);
        assert.equal(classes.length, 12);
        for (const c of classes) assert.match(c.hitDice, /^d(6|8|10|12)$/, c.nameFr);
    });

    test('Chaque sous-classe pointe vers une classe existante', () => {
        for (const [key, s] of Object.entries(DD_RULES.subclasses)) {
            assert.ok(DD_RULES.classes[s.class], `${key} → ${s.class}`);
        }
    });

    test('Chaque classe a sa sous-classe de l\'Odyssée', () => {
        for (const slug of Object.keys(DD_RULES.classes)) {
            const odyssey = Object.values(DD_RULES.subclasses).filter(s => s.class === slug && s.source === 'Odyssée');
            assert.equal(odyssey.length, 1, slug);
        }
    });
});

describe('Dons', () => {
    const feats = Object.entries(FEATS_DATA);
    const TYPES = new Set(['Origine', 'Général', 'Style de combat', 'Épique']);

    test('Chaque don a un nom, un type connu et des prérequis', () => {
        for (const [key, f] of feats) {
            assert.ok(f.name, key);
            assert.ok(TYPES.has(f.type), `${key} : type « ${f.type} »`);
            assert.ok(f.prereq, key);
        }
    });

    test('Les 10 styles de combat sont classés « Style de combat »', () => {
        assert.equal(feats.filter(([, f]) => f.type === 'Style de combat').length, 10);
    });

    test('Aucun nom de don ne contient de séparateur « | » (anciens noms dans `aliases`)', () => {
        for (const [key, f] of feats) {
            assert.ok(!f.name.includes('|'), key);
            if (f.aliases) assert.ok(Array.isArray(f.aliases) && f.aliases.every(a => typeof a === 'string'), key);
        }
    });

    test('Cogneur lourd : nom 2024, ancien nom 2014 en alias, identifiant inchangé (sauvegardes)', () => {
        const feat = FEATS_DATA.maitre_des_armes_lourdes_cogneur_lourd;
        assert.equal(feat.name, 'Cogneur lourd');
        assert.deepEqual(feat.aliases, ['Maître des armes lourdes']);
    });

    test('Perforateur et Faveur de vision lucide : noms officiels 2024, anciens noms en alias', () => {
        assert.equal(FEATS_DATA.empaleur_perforateur.name, 'Perforateur');
        assert.deepEqual(FEATS_DATA.empaleur_perforateur.aliases, ['Empaleur']);
        assert.equal(FEATS_DATA.faveur_de_vision_veritable_vision_lucide.name, 'Faveur de vision lucide');
        assert.deepEqual(FEATS_DATA.faveur_de_vision_veritable_vision_lucide.aliases, ['Faveur de vision véritable']);
    });

    test('Chaque don a un nom, un type, des prérequis, un gain de caractéristique et une description non vides', () => {
        for (const [key, f] of feats) {
            for (const field of ['name', 'type', 'prereq', 'asi', 'desc']) {
                assert.equal(typeof f[field], 'string', `${key}.${field}`);
                assert.ok(f[field].trim(), `${key}.${field} vide`);
            }
        }
    });

    // Gain de caractéristique affiché sous chaque emplacement de don (js/ui/sheet.js, featAsi)
    const ABBR = { Force: 'For', Dextérité: 'Dex', Constitution: 'Con', Intelligence: 'Int', Sagesse: 'Sag', Charisme: 'Cha' };
    const ASI_FORMAT = /^(Aucune|\+2 à une, ou \+1 à deux|\+1 au choix( \((sauvegarde|max 30)\))?|\+1 (For|Dex|Con|Int|Sag|Cha)( ou (For|Dex|Con|Int|Sag|Cha))*( \(max 30\))?)$/;

    test('Le gain de caractéristique suit le format court (« +1 For ou Dex », « Aucune »...)', () => {
        for (const [key, f] of feats) assert.match(f.asi, ASI_FORMAT, key);
    });

    test('Le gain de caractéristique correspond à la description (mêmes caractéristiques, même maximum)', () => {
        for (const [key, f] of feats) {
            if (key === 'amelioration_de_caracteristique') continue;
            const section = f.desc.match(/<strong>Augmentation de caractéristiques?<\/strong>\.([^<]*)/);
            if (!section) {
                assert.equal(f.asi, 'Aucune', `${key} : aucune augmentation dans la description`);
                continue;
            }
            const text = section[1];
            const named = Object.keys(ABBR).filter(word => text.includes(word)).map(word => ABBR[word]);
            const listed = f.asi.match(/\b(For|Dex|Con|Int|Sag|Cha)\b/g) || [];
            assert.deepEqual([...listed].sort(), [...named].sort(), key);
            if (!named.length) assert.match(f.asi, /^\+1 au choix/, key);
            assert.equal(f.asi.endsWith('(max 30)'), text.includes('maximum de 30'), `${key} : maximum`);
        }
    });

    test('Gains de caractéristique corrigés d\'après le Manuel (PHB 2024, p. 202-211)', () => {
        const expected = {
            athlete: '+1 For ou Dex', sentinelle: '+1 For ou Dex', tueur_de_mages: '+1 For ou Dex',
            mobile: '+1 Dex ou Con', combattant_monte: '+1 For ou Dex ou Sag', empoisonneur: '+1 Dex ou Int',
            discret: '+1 Dex', tireur_d_elite: '+1 Dex', expert: '+1 au choix',
            resilient: '+1 au choix (sauvegarde)', amelioration_de_caracteristique: '+2 à une, ou +1 à deux',
            maitre_des_boucliers: '+1 For', faveur_d_attaque_irresistible: '+1 For ou Dex (max 30)',
            faveur_de_memoire_magique: '+1 Int ou Sag ou Cha (max 30)', faveur_du_destin: '+1 au choix (max 30)'
        };
        for (const [key, asi] of Object.entries(expected)) assert.equal(FEATS_DATA[key].asi, asi, key);
    });

    test('Les 12 faveurs épiques : niveau 19 requis, augmentation jusqu\'à 30', () => {
        const epic = feats.filter(([, f]) => f.type === 'Épique');
        assert.equal(epic.length, 12);
        for (const [key, f] of epic) {
            assert.match(f.prereq, /^niveau 19 ou supérieur/, key);
            assert.match(f.asi, /\(max 30\)$/, key);
            assert.ok(f.desc.includes("jusqu'à un maximum de 30"), key);
        }
        assert.equal(FEATS_DATA.faveur_de_memoire_magique.prereq, 'niveau 19 ou supérieur, capacité Sorts');
    });

    test('Descriptions : coquilles et noms d\'actions corrigés', () => {
        const all = feats.map(([, f]) => f.desc).join('\n');
        assert.ok(!/action Pointe|action Furtivité|Soigneur de bataille|êtes en À terre|obtenez de Vision/.test(all));
        assert.ok(FEATS_DATA.guerisseur.desc.includes('<strong>Médecin de combat</strong>'));
        assert.ok(FEATS_DATA.faconneur.desc.includes('Gourdin, massue, bâton de combat'));
        assert.ok(FEATS_DATA.expert_de_la_charge.desc.includes("l'action Foncer"));
        assert.ok(FEATS_DATA.mobile.desc.includes("l'action Foncer"));
        assert.ok(FEATS_DATA.discret.desc.includes("l'action Se cacher"));
        assert.ok(FEATS_DATA.incantateur_d_elite.desc.includes("Vos jets d'attaque de sort ignorent"));
    });

    test('Les descriptions n\'utilisent que des balises connues, toutes refermées', () => {
        const PAIRED = ['strong', 'em', 'a', 'table', 'tr', 'th', 'td'];
        for (const [key, f] of feats) {
            const tags = [...f.desc.matchAll(/<\/?([a-z]+)[^>]*>/g)].map(m => m[1]);
            assert.ok(tags.every(t => t === 'br' || PAIRED.includes(t)), key);
            for (const t of PAIRED) {
                const open = (f.desc.match(new RegExp(`<${t}[ >]`, 'g')) || []).length;
                const close = (f.desc.match(new RegExp(`</${t}>`, 'g')) || []).length;
                assert.equal(open, close, `${key} : <${t}>`);
            }
        }
    });

    test('Aucune propriété dupliquée dans la source (une clé écrasée en silence)', () => {
        const source = readFileSync(new URL('../js/data/feats.js', import.meta.url), 'utf8');
        for (const block of source.split(/\n {4}"[a-z_0-9]+": \{/).slice(1)) {
            const props = [...block.split(/\n {4}\}/)[0].matchAll(/\n {8}"([a-z]+)":/g)].map(m => m[1]);
            assert.deepEqual(props, [...new Set(props)], block.slice(0, 60));
        }
    });
});

describe('Armes et armures', () => {
    test('Chaque arme a une caractéristique, des dégâts lisibles et une catégorie', () => {
        for (const w of DD_RULES.weapons) {
            assert.ok(['FOR', 'DEX'].includes(w.atk), w.name);
            assert.match(w.dmg, DICE, w.name);
            // « Frappe à mains nues » : pas une arme du Manuel, mais une attaque du tableau (lot 7)
            assert.ok(['Courante', 'Guerre'].includes(w.category) || (w.name === 'Frappe à mains nues' && w.category === 'Mains nues'), w.name);
        }
    });

    test('Les armes à munitions ou finesse utilisent la DEX par défaut', () => {
        for (const w of DD_RULES.weapons) {
            if (/munitions/i.test(w.prop)) assert.equal(w.atk, 'DEX', w.name);
        }
    });

    // Table des armes du Manuel des joueurs 2024 (p. 215) : nom → dégâts | propriétés | botte | catégorie
    const PHB_WEAPONS = {
        'Bâton': '1d6 cont. | Polyvalente (1d8) | Renversement | Courante',
        'Dague': '1d4 perf. | Finesse, Légère, Lancer (6/18 m) | Coup double | Courante',
        'Gourdin': '1d4 cont. | Légère | Ralentissement | Courante',
        'Hachette': '1d6 tran. | Légère, Lancer (6/18 m) | Ouverture | Courante',
        'Javeline': '1d6 perf. | Lancer (9/36 m) | Ralentissement | Courante',
        'Lance': '1d6 perf. | Lancer (6/18 m), Polyvalente (1d8) | Sape | Courante',
        'Marteau léger': '1d4 cont. | Légère, Lancer (6/18 m) | Coup double | Courante',
        "Masse d'armes": '1d6 cont. | - | Sape | Courante',
        'Massue': '1d8 cont. | Deux mains | Poussée | Courante',
        'Serpe': '1d4 tran. | Légère | Coup double | Courante',
        'Arbalète légère': '1d8 perf. | Munitions (24/96 m), Chargement, Deux mains | Ralentissement | Courante',
        'Arc court': '1d6 perf. | Munitions (24/96 m), Deux mains | Ouverture | Courante',
        'Fléchette': '1d4 perf. | Finesse, Lancer (6/18 m) | Ouverture | Courante',
        'Fronde': '1d4 cont. | Munitions (9/36 m) | Ralentissement | Courante',
        'Cimeterre': '1d6 tran. | Finesse, Légère | Coup double | Guerre',
        'Coutille': '1d10 tran. | Lourde, Allonge, Deux mains | Écorchure | Guerre',
        'Épée à deux mains': '2d6 tran. | Lourde, Deux mains | Écorchure | Guerre',
        'Épée courte': '1d6 perf. | Finesse, Légère | Ouverture | Guerre',
        'Épée longue': '1d8 tran. | Polyvalente (1d10) | Sape | Guerre',
        "Fléau d'armes": '1d8 cont. | - | Sape | Guerre',
        'Fouet': '1d4 tran. | Finesse, Allonge | Ralentissement | Guerre',
        "Hache d'armes": '1d8 tran. | Polyvalente (1d10) | Renversement | Guerre',
        'Hache à deux mains': '1d12 tran. | Lourde, Deux mains | Enchaînement | Guerre',
        'Hallebarde': '1d10 tran. | Lourde, Allonge, Deux mains | Enchaînement | Guerre',
        "Lance d'arçon": '1d10 perf. | Lourde, Allonge, Deux mains (sauf si monté) | Renversement | Guerre',
        "Maillet d'armes": '2d6 cont. | Lourde, Deux mains | Renversement | Guerre',
        'Marteau de guerre': '1d8 cont. | Polyvalente (1d10) | Poussée | Guerre',
        'Morgenstern': '1d8 perf. | - | Sape | Guerre',
        'Pic de guerre': '1d8 perf. | Polyvalente (1d10) | Sape | Guerre',
        'Pique': '1d10 perf. | Lourde, Allonge, Deux mains | Poussée | Guerre',
        'Rapière': '1d8 perf. | Finesse | Ouverture | Guerre',
        'Trident': '1d8 perf. | Lancer (6/18 m), Polyvalente (1d10) | Renversement | Guerre',
        'Arbalète de poing': '1d6 perf. | Munitions (9/36 m), Légère, Chargement | Ouverture | Guerre',
        'Arbalète lourde': '1d10 perf. | Munitions (30/120 m), Lourde, Chargement, Deux mains | Poussée | Guerre',
        'Arc long': '1d8 perf. | Munitions (45/180 m), Lourde, Deux mains | Ralentissement | Guerre',
        'Sarbacane': '1 perf. | Munitions (7,5/30 m), Chargement | Ouverture | Guerre',
        'Mousquet': '1d12 perf. | Munitions (12/36 m), Chargement, Deux mains | Ralentissement | Guerre',
        'Pistolet': '1d10 perf. | Munitions (9/27 m), Chargement | Ouverture | Guerre'
    };

    test('Chaque arme correspond à la table du Manuel (dégâts, propriétés, botte, catégorie)', () => {
        const weapons = DD_RULES.weapons.filter(w => w.category !== 'Mains nues');
        assert.deepEqual(weapons.map(w => w.name).sort(), Object.keys(PHB_WEAPONS).sort());
        for (const w of weapons) {
            assert.equal([w.dmg, w.prop, w.prof, w.category].join(' | '), PHB_WEAPONS[w.name], w.name);
        }
    });

    test('Frappe à mains nues (PHB 2024 p. 377) : seule entrée hors table, 1 contondant, Force', () => {
        const extra = DD_RULES.weapons.filter(w => w.category === 'Mains nues');
        assert.deepEqual(extra, [{ name: 'Frappe à mains nues', atk: 'FOR', dmg: '1 cont.', prop: '-', prof: '-', ammo: '-', category: 'Mains nues' }]);
    });

    test('Coutille : arme de guerre lourde à allonge, reconnue par les filtres, Cogneur lourd et le manuel', () => {
        const ref = DD_RULES.weapons.find(w => w.name === 'Coutille');
        assert.deepEqual(ref, {
            name: 'Coutille', atk: 'FOR', dmg: '1d10 tran.', prop: 'Lourde, Allonge, Deux mains',
            prof: 'Écorchure', ammo: '-', category: 'Guerre'
        });
        const row = rowFromRulebookWeapon({ ...EMPTY_WEAPON }, ref);
        assert.ok(matchesWeaponFilter(row, 'martial'));
        assert.ok(matchesWeaponFilter(row, 'melee'));
        assert.ok(!matchesWeaponFilter(row, 'simple'));
        assert.ok(!matchesWeaponFilter(row, 'ranged'));
        // Nom saisi à la main : la ligne est complétée avec les bonnes valeurs
        const typed = completeRowFromRulebook({ ...EMPTY_WEAPON, name: 'coutille' }, findRulebookWeapon('coutille'));
        assert.equal(typed.category, 'Guerre');
        assert.equal(typed.baseDmg, '1d10 tran.');
        assert.equal(typed.prop, 'Lourde, Allonge, Deux mains');
        // Cogneur lourd (propriété Lourde) : bonus de maîtrise aux dégâts
        const stats = { mods: { str: 4, dex: 1, con: 2, int: 0, wis: 0, cha: 0 }, pb: 2, level: 4, classSlug: 'barbarian' };
        assert.equal(computeWeapon(row, stats, { heavyWeaponMaster: true }).damage.text, '1d10 +4 TRAN +2 (Cogneur lourd)');
        // Arme de guerre lourde : pas une arme d'arts martiaux du Moine
        assert.equal(computeWeapon(row, { ...stats, classSlug: 'monk' }).damage.text, '1d10 +4 TRAN');
    });

    test('Coutille déjà enregistrée avec les anciennes valeurs : corrigée par la migration', () => {
        const old = { ...EMPTY_WEAPON, name: 'Coutille', atkKey: 'FOR', baseDmg: '1d4 tran.', prop: 'Allonge, Finesse, Légère',
            prof: 'Écorchure', category: 'Courante', note: 'à deux mains', weaponConfig: '' };
        const { character, report } = migrateCharacter({ char_name: 'Test', dynamic_weapons: [old] });
        const fixed = character.dynamic_weapons[0];
        assert.equal(fixed.baseDmg, '1d10 tran.');
        assert.equal(fixed.prop, 'Lourde, Allonge, Deux mains');
        assert.equal(fixed.category, 'Guerre');
        assert.equal(fixed.note, 'à deux mains', 'le reste de la ligne est conservé');
        assert.ok(report.some(line => line.startsWith('Coutille corrigée')));
        // Idempotente : une seconde migration ne change plus rien
        assert.deepEqual(migrateCharacter(character).character.dynamic_weapons, character.dynamic_weapons);
        // Ligne retouchée par le joueur (dégâts modifiés) ou autre arme : inchangée
        const custom = { ...old, baseDmg: '1d6 tran.' };
        assert.deepEqual(migrateCharacter({ dynamic_weapons: [custom] }).character.dynamic_weapons[0], custom);
        const other = { ...old, name: 'Coutille elfique' };
        assert.deepEqual(migrateCharacter({ dynamic_weapons: [other] }).character.dynamic_weapons[0], other);
    });

    test('Moine : Cimeterre et Épée courte (armes de guerre Légères) sont des armes de moine', () => {
        const stats = { mods: { str: 0, dex: 4, con: 2, int: 0, wis: 3, cha: 0 }, pb: 3, level: 5, classSlug: 'monk' };
        const scimitar = rowFromRulebookWeapon({ ...EMPTY_WEAPON }, DD_RULES.weapons.find(w => w.name === 'Cimeterre'));
        assert.match(computeWeapon(scimitar, stats).damage.text, /^1d8 /, 'dé d\'arts martiaux (1d8 au niveau 5) au lieu de 1d6');
        const longsword = rowFromRulebookWeapon({ ...EMPTY_WEAPON }, DD_RULES.weapons.find(w => w.name === 'Épée longue'));
        assert.equal(computeWeapon(longsword, { ...stats, level: 11 }).damage.text.split(' ')[0], '1d8',
            'épée longue (pas Légère) : son propre dé, pas le 1d10 des arts martiaux au niveau 11');
        assert.equal(computeWeapon(scimitar, { ...stats, level: 11 }).damage.text.split(' ')[0], '1d10');
    });

    test('Chaque armure a un type connu et une CA', () => {
        for (const a of EQUIPMENT_DATA.armors) {
            assert.ok(['Légère', 'Interméd.', 'Lourde', 'Bouclier'].includes(a.type), a.name);
            assert.match(a.ca, /\d/, a.name);
        }
    });
});

describe('Caractéristiques, compétences, sorts, fonds', () => {
    test('6 caractéristiques et 18 compétences, toutes rattachées', () => {
        assert.equal(ABILITY_IDS.length, 6);
        assert.equal(SKILLS.length, 18);
        assert.equal(Object.values(SKILLS_BY_STAT).flat().length, 18);
    });

    test('La base de sorts se lit et chaque sort a un nom et un niveau', () => {
        const spells = JSON.parse(readFileSync(new URL('../data/spells.json', import.meta.url), 'utf8'));
        assert.ok(spells.length > 300);
        for (const s of spells) {
            assert.ok(s.name, JSON.stringify(s).slice(0, 80));
            assert.ok(s.level !== undefined, s.name);
        }
    });

    test('Chaque fond d\'écran par défaut existe', () => {
        for (const file of DEFAULT_BGS) {
            assert.ok(readFileSync(new URL(`../assets/backgrounds/${file}`, import.meta.url)).length > 0, file);
        }
    });
});

describe('Dons : textes alignés sur le Manuel des joueurs 2024 anglais', () => {
    test('Télékinésiste : seule la portée de main de mage augmente (PHB p. 208)', () => {
        const desc = FEATS_DATA.telekinesiste.desc;
        assert.ok(desc.includes('sa portée augmente de 9 mètres lorsque vous le lancez'));
        assert.ok(!desc.includes('distance à laquelle'));
    });
});
