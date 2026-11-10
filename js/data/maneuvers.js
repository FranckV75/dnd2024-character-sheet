// =============================================================================
// MANEUVERS.JS (données) - Manœuvres du Maître de guerre (PHB 2024 anglais, p. 94-95, « Maneuver
// Options ») et outils d'artisan de Disciple martial (p. 94 ; outils p. 220-221).
//
// 20 manœuvres en 2024 (Brace, Grappling Strike et Quick Toss n'existent plus). Noms français du
// Manuel des joueurs 2024 (photos de Franck du 10/11/2026), dans l'ordre alphabétique du manuel.
// Champs : id (clé de sauvegarde, jamais renommée), en (nom anglais), name, timing ('hit' : quand vous
// touchez ; 'attack' : avec une attaque ; 'miss' : attaque ratée ; 'reaction' ; 'bonus' : action
// Bonus ; 'check' : test ; 'move' : déplacement), save (jet de sauvegarde de la cible, DD des
// manœuvres), damage ('self' : le dé s'ajoute à vos dégâts ; 'ally' : à ceux d'un allié ; 'separate' :
// dégâts à une autre créature ; null), text (effet résumé ; « le dé » = dé de supériorité).
// =============================================================================

export const MANEUVERS = Object.freeze([
    { id: 'menacing_attack', en: 'Menacing Attack', name: 'Attaque menaçante', timing: 'hit', save: 'wis', damage: 'self',
        text: 'Le dé s\'ajoute aux dégâts ; la cible est Effrayée jusqu\'à la fin de votre prochain tour si elle rate sa sauvegarde de Sagesse.' },
    { id: 'precision_attack', en: 'Precision Attack', name: 'Attaque précise', timing: 'miss', save: null, damage: null,
        text: 'Quand vous ratez un jet d\'attaque : ajoutez le dé au jet, ce qui peut le faire toucher.' },
    { id: 'commanding_presence', en: 'Commanding Presence', name: 'Autorité naturelle', timing: 'check', save: null, damage: null,
        text: 'Test de Charisme (Intimidation, Représentation ou Persuasion) : ajoutez le dé.' },
    { id: 'sweeping_attack', en: 'Sweeping Attack', name: 'Balayage', timing: 'hit', save: null, damage: 'separate',
        text: 'Corps à corps : une autre créature à 1,5 m de la cible et à votre portée subit le dé en dégâts (même type) si votre jet d\'attaque la toucherait.' },
    { id: 'pushing_attack', en: 'Pushing Attack', name: 'Bélier', timing: 'hit', save: 'str', damage: 'self',
        text: 'Le dé s\'ajoute aux dégâts ; une cible de taille G ou moins qui rate sa sauvegarde de Force est repoussée de 4,5 m au plus.' },
    { id: 'bait_and_switch', en: 'Bait and Switch', name: 'Chassé-croisé', timing: 'move', save: null, damage: null,
        text: 'Pendant votre déplacement (1,5 m dépensé) : échangez de place avec une créature consentante à 1,5 m, sans attaque d\'opportunité ; l\'un de vous ajoute le dé à sa CA jusqu\'au début de votre prochain tour.' },
    { id: 'trip_attack', en: 'Trip Attack', name: 'Croc-en-jambe', timing: 'hit', save: 'str', damage: 'self',
        text: 'Le dé s\'ajoute aux dégâts ; une cible de taille G ou moins qui rate sa sauvegarde de Force tombe À terre.' },
    { id: 'disarming_attack', en: 'Disarming Attack', name: 'Désarmement', timing: 'hit', save: 'str', damage: 'self',
        text: 'Le dé s\'ajoute aux dégâts ; la cible lâche un objet qu\'elle tient, de votre choix, si elle rate sa sauvegarde de Force.' },
    { id: 'distracting_strike', en: 'Distracting Strike', name: 'Diversion', timing: 'hit', save: null, damage: 'self',
        text: 'Le dé s\'ajoute aux dégâts ; la prochaine attaque d\'un autre que vous contre la cible a l\'Avantage, avant le début de votre prochain tour.' },
    { id: 'ambush', en: 'Ambush', name: 'Embuscade', timing: 'check', save: null, damage: null,
        text: 'Test de Dextérité (Discrétion) ou jet d\'Initiative : ajoutez le dé (pas si vous êtes Neutralisé).' },
    { id: 'tactical_assessment', en: 'Tactical Assessment', name: 'Évaluation tactique', timing: 'check', save: null, damage: null,
        text: 'Test d\'Intelligence (Histoire, Investigation) ou de Sagesse (Intuition) : ajoutez le dé.' },
    { id: 'feinting_attack', en: 'Feinting Attack', name: 'Feinte', timing: 'bonus', save: null, damage: 'self',
        text: 'Action Bonus contre une créature à 1,5 m : Avantage à votre prochaine attaque contre elle ce tour-ci ; si elle touche, le dé s\'ajoute aux dégâts.' },
    { id: 'lunging_attack', en: 'Lunging Attack', name: 'Fente', timing: 'bonus', save: null, damage: 'self',
        text: 'Action Bonus : action Pointe ; si vous parcourez au moins 1,5 m en ligne droite juste avant de toucher au corps à corps ce tour-ci, le dé s\'ajoute aux dégâts.' },
    { id: 'commanders_strike', en: 'Commander\'s Strike', name: 'Instruction', timing: 'attack', save: null, damage: 'ally',
        text: 'À la place d\'une de vos attaques : un allié qui vous voit ou vous entend attaque avec sa Réaction et ajoute le dé à ses dégâts s\'il touche.' },
    { id: 'evasive_footwork', en: 'Evasive Footwork', name: 'Jeu de jambes défensif', timing: 'bonus', save: null, damage: null,
        text: 'Action Bonus : action Désengagement, et le dé s\'ajoute à votre CA jusqu\'au début de votre prochain tour.' },
    { id: 'maneuvering_attack', en: 'Maneuvering Attack', name: 'Manœuvre tactique', timing: 'hit', save: null, damage: 'self',
        text: 'Le dé s\'ajoute aux dégâts ; un allié qui vous voit ou vous entend peut, par sa Réaction, se déplacer de la moitié de sa Vitesse sans attaque d\'opportunité de la cible.' },
    { id: 'parry', en: 'Parry', name: 'Parade', timing: 'reaction', save: null, damage: null,
        text: 'Réaction quand une attaque au corps à corps vous inflige des dégâts : ils sont réduits du dé + votre modificateur de Force ou de Dextérité.' },
    { id: 'goading_attack', en: 'Goading Attack', name: 'Provocation', timing: 'hit', save: 'wis', damage: 'self',
        text: 'Le dé s\'ajoute aux dégâts ; si la cible rate sa sauvegarde de Sagesse, elle a le Désavantage pour attaquer d\'autres que vous jusqu\'à la fin de votre prochain tour.' },
    { id: 'rally', en: 'Rally', name: 'Regain', timing: 'bonus', save: null, damage: null,
        text: 'Action Bonus : un allié à 9 m qui vous voit ou vous entend gagne des PV temporaires (le dé + la moitié de votre niveau de Guerrier).' },
    { id: 'riposte', en: 'Riposte', name: 'Riposte', timing: 'reaction', save: null, damage: 'self',
        text: 'Réaction quand une créature vous rate au corps à corps : attaque au corps à corps contre elle ; si elle touche, le dé s\'ajoute aux dégâts.' }
]);

/** Compétences proposées au Guerrier de niveau 1 (PHB 2024, p. 91) : Disciple martial */
export const FIGHTER_SKILLS = Object.freeze([
    'acrobatics', 'animal_handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'persuasion', 'survival'
]);

/** Outils d'artisan (PHB 2024, p. 220-221) : [id, nom, mot-clé cherché dans le champ Outils] */
export const ARTISAN_TOOLS = Object.freeze([
    ['alchemists_supplies', 'Matériel d\'alchimiste', 'alchimi'],
    ['brewers_supplies', 'Matériel de brasseur', 'brasseur'],
    ['calligraphers_supplies', 'Matériel de calligraphe', 'calligraph'],
    ['carpenters_tools', 'Outils de charpentier', 'charpentier'],
    ['cartographers_tools', 'Outils de cartographe', 'cartograph'],
    ['cobblers_tools', 'Outils de cordonnier', 'cordonnier'],
    ['cooks_utensils', 'Ustensiles de cuisinier', 'cuisin'],
    ['glassblowers_tools', 'Outils de souffleur de verre', 'souffleur'],
    ['jewelers_tools', 'Outils de joaillier', 'joaill'],
    ['leatherworkers_tools', 'Outils de tanneur', 'tanneur'],
    ['masons_tools', 'Outils de maçon', 'macon'],
    ['painters_supplies', 'Matériel de peintre', 'peintre'],
    ['potters_tools', 'Outils de potier', 'potier'],
    ['smiths_tools', 'Outils de forgeron', 'forgeron'],
    ['tinkers_tools', 'Outils de bricoleur', 'bricoleur'],
    ['weavers_tools', 'Outils de tisserand', 'tisserand'],
    ['woodcarvers_tools', 'Outils de menuisier', 'menuisier']
]);
