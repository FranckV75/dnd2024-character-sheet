// =============================================================================
// SUBCLASS-CHOICES.JS (données) - Choix de sous-classe à mémoriser (lot 7)
//
// Par clé de sous-classe (DD_RULES.subclasses), les menus affichés sous la capacité dans le bloc
// « Sous-classe » de l'onglet Aptitudes & Traits. Règles : js/rules/subclass-choices.js.
// Champs d'un menu :
//  - key : clé dans la sauvegarde (jamais renommée : les fiches enregistrées la gardent) ;
//  - feature : id de la capacité (js/data/subclass-features.js) : le menu apparaît à son niveau ;
//  - fromLevel : niveau plus tardif que la capacité (second choix…) ;
//  - label : libellé du menu ; options : [[valeur (ASCII, jamais renommée), libellé], …] ;
//  - inPlay : choix qui change en jeu (à chaque Rage, à chaque repos) : il reste modifiable quand la
//    fiche est verrouillée ; sans lui, c'est un choix de construction (verrouillé avec la fiche) ;
//  - when : quand le choix change, rappelé sous le menu ;
//  - count : (derived) => nombre de menus (manœuvres : 3, puis plus selon le niveau) ;
//  - wide : menu sur toute la largeur (libellés longs) ;
//  - toggle : case à cocher au lieu d'un menu (une seule option, [['on', libellé]]) ;
//  - clearOn : 'rest' (tout repos) ou 'longRest' (repos long seulement) : le choix est effacé à la
//    fin de ce repos (effet qui s'arrête) ; sans lui, le dernier choix reste jusqu'au suivant ;
//  - restReminder : 'short' (repos court et long) ou 'long' : rappel « À la fin du repos » qui
//    nomme le choix actuel (zone rest de featEffects, js/rules/subclass-choices.js) ;
//  - requires : { key, value } : menu proposé (et choix compté) seulement si un AUTRE menu de la
//    même sous-classe, placé avant lui, a cette valeur (seconde école de l'Éclectisme) ; value peut
//    être une liste de valeurs permises (type de la Frappe de bête : Terre ou Mer) ;
//  - kind: 'number' : compteur (« − [14] + ») au lieu d'un menu, avec min et max (entiers) ; la
//    valeur est enregistrée en chaîne (« 14 »), sans zéro en tête ; options: [] (aucune option).
// Règles résumées du Player's Handbook 2024 anglais et du guide de l'Odyssée (pages en commentaire).
// =============================================================================

import { SKILLS } from './constants.js';
import { MANEUVERS, FIGHTER_SKILLS, ARTISAN_TOOLS } from './maneuvers.js';
import { PRIMAL_BEASTS, BEAST_STRIKE_TYPES, STIMFEE_LOOKS, STEED_TYPES, STEED_LEVELS } from './subclass-companions.js';

/** Types de terre du Cercle de la Terre : [valeur, libellé (= group de subclass-spells.js), type de dégâts de Protégé de dame Nature] */
export const LAND_TYPES = Object.freeze([
    ['arid', 'Aride', 'fire'], ['polar', 'Polaire', 'cold'], ['temperate', 'Tempérée', 'lightning'], ['tropical', 'Tropicale', 'poison']
]);

/** Types de dégâts : [valeur, libellé du menu, « Résistance … » (au feu, aux dégâts contondants…)] ; force à part */
export const DAMAGE_TYPES = Object.freeze([
    ['acid', 'Acide', 'à l\'acide'],
    ['bludgeoning', 'Contondant', 'aux dégâts contondants'],
    ['fire', 'Feu', 'au feu'],
    ['lightning', 'Foudre', 'à la foudre'],
    ['cold', 'Froid', 'au froid'],
    ['necrotic', 'Nécrotique', 'aux dégâts nécrotiques'],
    ['piercing', 'Perforant', 'aux dégâts perforants'],
    ['poison', 'Poison', 'au poison'],
    ['psychic', 'Psychique', 'aux dégâts psychiques'],
    ['radiant', 'Radiant', 'aux dégâts radiants'],
    ['thunder', 'Tonnerre', 'au tonnerre'],
    ['slashing', 'Tranchant', 'aux dégâts tranchants']
]);

/** Les 14 types de créatures (règles 2024) */
export const CREATURE_TYPES = Object.freeze([
    ['aberration', 'Aberrations'], ['beast', 'Bêtes'], ['celestial', 'Célestes'], ['construct', 'Créatures artificielles'],
    ['monstrosity', 'Créatures monstrueuses'], ['dragon', 'Dragons'], ['elemental', 'Élémentaires'], ['fey', 'Fées'],
    ['fiend', 'Fiélons'], ['giant', 'Géants'], ['humanoid', 'Humanoïdes'], ['undead', 'Morts-vivants'], ['plant', 'Plantes'],
    ['ooze', 'Vases']
]);

/** Domaines de l'Ancêtre divin (Ascendance divine) : [valeur, libellé (= group de subclass-spells.js)] */
export const DIVINE_DOMAINS = Object.freeze([
    ['knowledge', 'Connaissance'], ['war', 'Guerre'], ['light', 'Lumière'], ['death', 'Mort'],
    ['nature', 'Nature'], ['trickery', 'Ruse'], ['tempest', 'Tempête'], ['life', 'Vie']
]);

/**
 * Écoles du Philosophe de l'Académie (Odyssée, p. 44 et 46), dans l'ordre du livre :
 * [valeur = id de l'option dans js/data/subclass-features.js, libellé (= group de subclass-spells.js)]
 */
export const PHILOSOPHER_SCHOOLS = Object.freeze([
    ['cynisme', 'Cynisme'], ['eclectisme', 'Éclectisme'], ['empirisme', 'Empirisme'], ['epicurisme', 'Épicurisme'],
    ['stoicisme', 'Stoïcisme'], ['sophisme', 'Sophisme'], ['hedonisme', 'Hédonisme'], ['scepticisme', 'Scepticisme']
]);

/**
 * Constellations de la Forme stellaire (Cercle des Étoiles, PHB 2024, p. 88-89) :
 * [valeur, libellé] ; chiffres calculés dans js/rules/subclass-forms.js
 */
export const CONSTELLATIONS = Object.freeze([['archer', 'Archer'], ['chalice', 'Calice'], ['dragon', 'Dragon']]);

const damageOptions = (ids) => DAMAGE_TYPES.filter(([id]) => ids.includes(id)).map(([id, label]) => [id, label]);

export const SUBCLASS_CHOICE_FIELDS = {
    // Collège de poésie épique (Odyssée, p. 37-38) : strophes composées (jamais perdues, compteur
    // modifiable en jeu) et nombre de joueurs du groupe (le livre compte 6 joueurs) ; rang du poème
    // calculé par js/rules/epic-poem.js
    college_of_epic_muse: [
        {
            key: 'strophes', feature: 'composition_des_strophes', label: 'Strophes composées', kind: 'number', min: 0, max: 999,
            inPlay: true, options: [], when: 'Une strophe par événement décisif accepté par le MJ ; jamais perdues.'
        },
        {
            key: 'party', feature: 'composition_des_strophes', label: 'Joueurs du groupe',
            when: 'Sans choix : 6 joueurs, comme le livre.',
            options: Array.from({ length: 8 }, (_, i) => [String(i + 1), `${i + 1} joueur${i ? 's' : ''}`])
        }
    ],
    // Voie du Cœur sauvage (PHB 2024, p. 55)
    path_of_the_wild_heart: [
        {
            key: 'rage', feature: 'rage_sauvage', label: 'Option de Rage', inPlay: true, when: 'Choisie à chaque entrée en Rage.',
            options: [['bear', 'Ours'], ['eagle', 'Aigle'], ['wolf', 'Loup']]
        },
        {
            key: 'aspect', feature: 'aspect_sauvage', label: 'Aspect', inPlay: true, restReminder: 'long', when: 'Changé à chaque repos long.',
            options: [['owl', 'Hibou'], ['panther', 'Panthère'], ['salmon', 'Saumon']]
        },
        {
            key: 'power', feature: 'puissance_sauvage', label: 'Puissance', inPlay: true, when: 'Choisie à chaque entrée en Rage.',
            options: [['falcon', 'Faucon'], ['lion', 'Lion'], ['ram', 'Bélier']]
        }
    ],
    // Maître de guerre (PHB 2024, p. 93-95) : manœuvres connues (3, puis 5, 7 et 9 aux niveaux 7, 10
    // et 15 ; une remplaçable à chacun de ces niveaux) et Disciple martial (définitif)
    battle_master: [
        {
            key: 'maneuver', feature: 'superiorite_martiale_man_uvres', label: 'Manœuvre', wide: true,
            count: ({ level = 1 }) => (level >= 15 ? 9 : level >= 10 ? 7 : level >= 7 ? 5 : 3),
            options: MANEUVERS.map(m => [m.id, m.name])
        },
        {
            key: 'student_skill', feature: 'disciple_de_la_guerre', label: 'Compétence',
            options: FIGHTER_SKILLS.map(id => [id, SKILLS.find(skill => skill.id === id).name])
        },
        {
            key: 'student_tool', feature: 'disciple_de_la_guerre', label: 'Outils d\'artisan',
            options: ARTISAN_TOOLS.map(([id, name]) => [id, name])
        }
    ],
    // Chasseur (PHB 2024, p. 124) : options échangées à la fin de chaque repos court ou long
    hunter: [
        {
            key: 'prey', feature: 'proie_du_chasseur', label: 'Proie du chasseur', inPlay: true, restReminder: 'short', when: 'Échangeable à chaque repos court ou long.',
            options: [['colossus', 'Goût du sang'], ['horde', 'Briseur de hordes']]
        },
        {
            key: 'tactics', feature: 'tactiques_defensives', label: 'Tactique défensive', inPlay: true, restReminder: 'short', when: 'Échangeable à chaque repos court ou long.',
            options: [['escape', 'Cauchemar de la horde'], ['multiattack', 'Défense contre les attaques multiples']], wide: true
        }
    ],
    // Cercle de la Terre (PHB 2024, p. 84-85) : terre choisie à la fin de chaque repos long ; elle
    // donne les sorts préparés et la Résistance de Protégé de dame Nature (niveau 10)
    circle_of_the_land: [
        {
            key: 'land', feature: 'sorts_du_cercle_de_la_terre', label: 'Type de terre', inPlay: true, restReminder: 'long',
            when: 'Choisie à la fin de chaque repos long.', options: LAND_TYPES.map(([id, label]) => [id, label])
        }
    ],
    // Cercle de la Lune (PHB 2024, p. 86-87) : Forme sauvage en cours (repères de CA et de sauvegarde
    // de Constitution) ; une Forme sauvage dure au plus 10 heures et le sommeil (Inconscient) y met
    // fin : effacée au repos long, pas au repos court (elle peut durer plus d'une heure)
    circle_of_the_moon: [
        {
            key: 'wild_shape', feature: 'formes_du_cercle', label: 'En Forme sauvage', toggle: true, inPlay: true, clearOn: 'longRest',
            when: 'À cocher pendant la Forme sauvage (la case de Forme sauvage, onglet Combat, se coche à part) ; décochée au repos long.',
            options: [['on', 'En Forme sauvage']]
        }
    ],
    // Cercle des Étoiles (PHB 2024, p. 88-89) : Forme stellaire en cours (10 minutes : effacée à tout
    // repos), constellation choisie à chaque Forme stellaire (gardée comme présélection)
    circle_of_the_stars: [
        {
            key: 'starry_form', feature: 'forme_etoilee', label: 'En Forme stellaire', toggle: true, inPlay: true, clearOn: 'rest',
            when: 'À cocher pendant la Forme stellaire (10 minutes ; la case de Forme sauvage, onglet Combat, se coche à part) ; décochée au repos.',
            options: [['on', 'En Forme stellaire']]
        },
        {
            key: 'constellation', feature: 'forme_etoilee', label: 'Constellation', inPlay: true,
            when: 'Choisie à chaque Forme stellaire ; à partir du niveau 10, changeable au début de chacun de vos tours.',
            options: CONSTELLATIONS
        },
        // Présage cosmique : Fortune ou Péril tiré à chaque repos long
        {
            key: 'omen', feature: 'presage_cosmique', label: 'Présage', inPlay: true, clearOn: 'longRest', restReminder: 'long',
            when: 'À chaque repos long, lancez un dé : pair Fortune, impair Péril.', options: [['weal', 'Fortune'], ['woe', 'Péril']]
        }
    ],
    // Serment des Seigneurs Dragons (Odyssée, p. 47) : œuf trouvé ou rapporté par le pseudodragon
    oath_of_the_dragonlords: [
        {
            key: 'egg', feature: 'familier_pseudodragon', label: 'Œuf de dragon',
            when: 'Couleur de l\'œuf trouvé ou rapporté par le pseudodragon ; définitive à l\'éclosion (niveau 7).',
            options: [['brass', 'Airain'], ['bronze', 'Bronze'], ['copper', 'Cuivre'], ['silver', 'Argent']]
        }
    ],
    // Errant féerique (PHB 2024, p. 124-125) : don purement descriptif, choisi ou tiré au d6
    fey_wanderer: [
        {
            key: 'gift', feature: 'don_de_la_feerie', label: 'Présents de Féerie', wide: true,
            options: [
                ['butterflies', 'Papillons illusoires pendant vos repos'], ['flowers', 'Fleurs dans les cheveux à chaque aube'],
                ['scent', 'Légère odeur d\'herbe ou d\'épice'], ['shadow', 'Ombre qui danse quand on ne la regarde pas'],
                ['horns', 'Cornes ou bois'], ['colors', 'Peau et cheveux qui changent de couleur à chaque aube']
            ]
        }
    ],
    // Traqueur d'ombre (PHB 2024, p. 125-126) : Mental d'acier
    gloom_stalker: [
        {
            key: 'save', feature: 'esprit_d_acier', label: 'Sauvegarde gagnée',
            when: 'Intelligence ou Charisme seulement si la Sagesse était déjà maîtrisée (multiclasse, don Résilient).',
            options: [['wis', 'Sagesse'], ['int', 'Intelligence'], ['cha', 'Charisme']]
        }
    ],
    // Maître des bêtes (PHB 2024, p. 122-124) : bête invoquée (nouvelle bête possible à la fin de
    // chaque repos long) et type des dégâts de sa Frappe (Bête des cieux : toujours tranchants, menu
    // masqué ; Bête des mers : un « Tranchants » enregistré est ignoré par js/rules/subclass-companions.js)
    beast_master: [
        {
            key: 'beast', feature: 'compagnon_primordial', label: 'Bête primordiale', inPlay: true, restReminder: 'long',
            when: 'Nouvelle bête possible à la fin de chaque repos long (l\'ancienne disparaît, PV pleins).',
            options: Object.entries(PRIMAL_BEASTS).map(([id, beast]) => [id, beast.label])
        },
        {
            key: 'strike', feature: 'compagnon_primordial', label: 'Dégâts de la Frappe', inPlay: true,
            requires: { key: 'beast', value: ['land', 'sea'] },
            when: 'Choisis à l\'invocation (Bête des mers : contondants ou perforants).',
            options: BEAST_STRIKE_TYPES.map(([id, label]) => [id, label])
        }
    ],
    // Conclave des Amazones (Odyssée, p. 49 et 51) : le livre ne dit pas quand le type de monstres se choisit
    amazon_warrior: [
        {
            key: 'stimfee', feature: 'compagnon_stimfee', label: 'Apparence de la stimfée',
            when: 'Aucun effet de jeu.', options: STIMFEE_LOOKS
        },
        {
            key: 'foe', feature: 'cri_de_guerre', label: 'Monstres visés', inPlay: true,
            when: 'Choisi à chaque Cri de guerre.', options: CREATURE_TYPES
        },
        // Magie des Amazones, niveau 5 : Trouver une monture (Find Steed, PHB 2024 p. 272) ; type et
        // niveau du sort choisis à chaque lancement (nouvelle monture : PV pleins, subclass-companions.js)
        {
            key: 'steed', feature: 'magie_des_amazones', fromLevel: 5, label: 'Monture : type', inPlay: true,
            when: 'Choisi à chaque lancement de Trouver une monture.', options: STEED_TYPES.map(([id, label]) => [id, label])
        },
        {
            key: 'steed_level', feature: 'magie_des_amazones', fromLevel: 5, label: 'Monture : niveau du sort', inPlay: true,
            when: 'Emplacement dépensé au lancement (niveau 2 sans choix).', options: STEED_LEVELS.map(level => [String(level), `Niveau ${level}`])
        }
    ],
    // Sorcellerie aberrante (PHB 2024, p. 146) : un avantage par point de sorcellerie, 10 minutes
    aberrant_sorcery: [
        { key: 'rev_aquatic', feature: 'revelation_dans_la_chair', label: 'Adaptation aquatique', toggle: true, inPlay: true, clearOn: 'rest', options: [['on', 'Adaptation aquatique']] },
        { key: 'rev_flight', feature: 'revelation_dans_la_chair', label: 'Vol scintillant', toggle: true, inPlay: true, clearOn: 'rest', options: [['on', 'Vol scintillant']] },
        { key: 'rev_see', feature: 'revelation_dans_la_chair', label: 'Voir l\'invisible', toggle: true, inPlay: true, clearOn: 'rest', options: [['on', 'Voir l\'invisible']] },
        {
            key: 'rev_worm', feature: 'revelation_dans_la_chair', label: 'Mouvement vermiforme', toggle: true, inPlay: true, clearOn: 'rest',
            when: 'Cochez les avantages pris (1 point de sorcellerie chacun) ; décochés au repos.', options: [['on', 'Mouvement vermiforme']]
        }
    ],
    // Sorcellerie mécanique (PHB 2024, p. 146) : manifestation purement descriptive, choisie ou tirée au d6
    clockwork_sorcery: [
        {
            key: 'manifestation', feature: 'manifestations_de_l_ordre', label: 'Manifestation', wide: true,
            options: [
                ['cogwheels', 'Rouages spectraux'], ['clock_eyes', 'Aiguilles d\'horloge dans les yeux'],
                ['brass_skin', 'Reflet cuivré de la peau'], ['equations', 'Équations et formes flottantes'],
                ['clockwork_focus', 'Focaliseur en petit mécanisme'], ['ticking', 'Tic-tac ou carillon audible']
            ]
        }
    ],
    // Sorcellerie draconique (PHB 2024, p. 148) : le PHB 2024 ne prévoit pas de changement
    draconic_sorcery: [
        {
            key: 'element', feature: 'affinite_elementaire', label: 'Type de dégâts',
            options: damageOptions(['acid', 'cold', 'fire', 'lightning', 'poison'])
        }
    ],
    // Ascendance divine (Odyssée, p. 43)
    demigod_bloodline: [
        { key: 'domain', feature: 'ancetre_divin', label: 'Domaine de l\'ancêtre', options: DIVINE_DOMAINS }
    ],
    // Patron Fiélon (PHB 2024, p. 162) : type choisi à la fin de chaque repos court ou long
    fiend_patron: [
        {
            key: 'resistance', feature: 'resilience_fielonne', label: 'Résistance', inPlay: true, restReminder: 'short',
            when: 'Choisie à la fin de chaque repos court ou long (jamais force).', options: damageOptions(DAMAGE_TYPES.map(([id]) => id))
        }
    ],
    // Serviteur des Moires (Odyssée, p. 53) : d20 lancé à la fin de chaque repos, perdu au suivant
    the_fates_patron: [
        {
            key: 'prediction', feature: 'predictions_des_moires', label: 'Résultat du d20', inPlay: true, clearOn: 'rest', restReminder: 'short',
            when: 'Lancez 1d20 à la fin de chaque repos court ou long et notez le résultat dans le menu.',
            options: Array.from({ length: 20 }, (_, i) => [String(i + 1), String(i + 1)])
        }
    ],
    // Philosophe de l'Académie (Odyssée, p. 44 et 46) : école choisie au niveau 3 (niveau 2 du livre),
    // définitive (le menu reste modifiable pour corriger une erreur) ; l'Éclectisme ajoute une seconde
    // école au niveau 5 (niveau du livre gardé)
    academy_philosopher: [
        { key: 'school', feature: 'ecole_philosophique', label: 'École', options: PHILOSOPHER_SCHOOLS },
        {
            key: 'second_school', feature: 'ecole_philosophique', fromLevel: 5, label: 'Seconde école (Éclectisme)', wide: true,
            requires: { key: 'school', value: 'eclectisme' }, options: PHILOSOPHER_SCHOOLS.filter(([id]) => id !== 'eclectisme')
        }
    ],
    // Devin (PHB 2024, p. 173) : avantage gardé jusqu'au début du prochain repos court ou long
    diviner: [
        {
            key: 'eye', feature: 'troisieme_il', label: 'Troisième œil', inPlay: true, clearOn: 'rest', wide: true,
            when: 'Choisi en utilisant le Troisième œil ; effacé au repos.',
            options: [['darkvision', 'Vision dans le noir (36 m)'], ['comprehension', 'Lire toutes les langues'], ['see', 'Voir l\'invisible']]
        }
    ]
};
