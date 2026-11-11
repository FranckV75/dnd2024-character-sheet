// =============================================================================
// SPECIES-TRAITS.JS - Traits des espèces : les 10 du Manuel des joueurs 2024 (édition française)
// et les 6 du Guide du joueur de L'Odyssée des Seigneurs Dragons (VF 2022, chapitre 3)
//
// Manuel : lus sur les photos du manuel de Franck (dossier « Description des espèces », p. 186-197)
// et vérifiés par une seconde lecture. Odyssée : lus dans le PDF du guide (p. 26-35 imprimées) ; le
// livre suit le format de 2014 : ses augmentations de caractéristiques, âge, alignement et langues
// ne sont pas repris comme traits (en 2024, les caractéristiques viennent de l'historique).
// Les textes sont des RÉSUMÉS dans nos mots (le dépôt est public), avec les titres imprimés.
// Par espèce (clé de DD_RULES.species) :
//  - darkvision : portée de la Vision dans le noir en mètres (null : aucune) ;
//  - fly : Vitesse de vol { speed (m), note : condition } (Sirène) ;
//  - traits : { id, name, level, activation, text, uses?: { count: 'pb' | nombre, reset }, resistance? } ;
//  - option : choix de l'espèce (lignage, ascendance, héritage…) : { key, label, abilities? (caractéristique
//    d'incantation au choix), perUse? (choisi à chaque utilisation, pas mémorisé), choices: [{ id, name,
//    text, damageType?, darkvision?, speed?, swim? (Vitesse de nage en m), spells?: [{ level, name, vo,
//    spellLevel, free?, reset?, ability? }] }] } ;
//    level : niveau du personnage ; spellLevel : niveau du sort (0 = sort mineur) ; free : lancers sans
//    emplacement (1, ou 'pb' = bonus de maîtrise), rendus au Repos long, ou aussi au Repos court si
//    reset: 'short' ; ability: 'cha' : toujours lancé avec le Charisme (sinon : caractéristique choisie) ;
//  - spells : sorts de l'espèce hors option ({ level, name, vo, ability: 'cha' | 'option', trait, free?, reset? }).
// Les noms de sorts sont ceux de data/spells.json (testé).
// =============================================================================

export const SPECIES_TRAITS = Object.freeze({
    "aasimar": {
        "darkvision": 18,
        "traits": [
            {
                "id": "mains_guerisseuses",
                "name": "Mains guérisseuses",
                "level": 1,
                "activation": "action",
                "text": "Par l'action Magie, en touchant une créature, vous lancez un nombre de d4 égal à votre bonus de maîtrise ; elle regagne ce total en points de vie. Une fois par Repos long.",
                "uses": {
                    "count": 1,
                    "reset": "long"
                }
            },
            {
                "id": "porte_lumiere",
                "name": "Porte-lumière",
                "level": 1,
                "activation": "passif",
                "text": "Vous connaissez le sort mineur Lumière (Light), lancé avec le Charisme."
            },
            {
                "id": "resistance_celeste",
                "name": "Résistance céleste",
                "level": 1,
                "activation": "passif",
                "text": "Résistance aux dégâts nécrotiques et radiants.",
                "resistance": [
                    "nécrotique",
                    "radiant"
                ]
            },
            {
                "id": "vision_dans_le_noir",
                "name": "Vision dans le noir",
                "level": 1,
                "activation": "passif",
                "text": "Vision dans le noir sur 18 m."
            },
            {
                "id": "revelation_celeste",
                "name": "Révélation céleste",
                "level": 3,
                "activation": "action Bonus",
                "text": "Dès le niveau 3, par une action Bonus, vous prenez une forme céleste (option choisie à chaque fois) pendant 1 minute ou jusqu'à ce que vous y mettiez fin ; une fois par tour, une cible que vous blessez par attaque ou sort subit en plus des dégâts égaux à votre bonus de maîtrise (nécrotiques pour Linceul nécrotique, radiants sinon). Utilisable une fois par Repos long.",
                "uses": {
                    "count": 1,
                    "reset": "long"
                }
            }
        ],
        "option": {
            "key": "celestial_revelation",
            "label": "Révélation céleste",
            "perUse": true,
            "choices": [
                {
                    "id": "ailes_celestes",
                    "name": "Ailes célestes",
                    "text": "Des ailes intangibles apparaissent : pendant la transformation, Vitesse de vol égale à votre Vitesse. Dégâts supplémentaires radiants.",
                    "damageType": "radiant"
                },
                {
                    "id": "linceul_necrotique",
                    "name": "Linceul nécrotique",
                    "text": "Au moment de la transformation, les créatures non alliées à 3 m ou moins font un JS de Charisme (DD 8 + mod. Charisme + bonus de maîtrise) ou sont Effrayées jusqu'à la fin de votre prochain tour. Dégâts supplémentaires nécrotiques.",
                    "damageType": "nécrotique"
                },
                {
                    "id": "radiance_interieure",
                    "name": "Radiance intérieure",
                    "text": "Vous émettez une Lumière vive sur 3 m et faible sur 3 m de plus ; à la fin de chacun de vos tours, chaque créature à 3 m ou moins subit des dégâts radiants égaux à votre bonus de maîtrise. Dégâts supplémentaires radiants.",
                    "damageType": "radiant"
                }
            ]
        },
        "spells": [
            {
                "level": 1,
                "name": "Lumière",
                "vo": "Light",
                "ability": "cha",
                "trait": "Porte-lumière",
                "spellLevel": 0
            }
        ]
    },
    "dragonborn": {
        "darkvision": 18,
        "traits": [
            {
                "id": "ascendance_draconique",
                "name": "Ascendance draconique",
                "level": 1,
                "activation": "passif",
                "text": "Vous choisissez un dragon ancêtre dans la table Ancêtres draconiques ; il fixe le type de dégâts de votre Souffle et de votre Résistance aux dégâts, et influe sur votre apparence."
            },
            {
                "id": "resistance_aux_degats",
                "name": "Résistance aux dégâts",
                "level": 1,
                "activation": "passif",
                "text": "Résistance au type de dégâts donné par votre Ascendance draconique."
            },
            {
                "id": "souffle",
                "name": "Souffle",
                "level": 1,
                "activation": "action",
                "text": "Pendant l'action Attaque, une de vos attaques peut être remplacée par un souffle en Cône de 4,50 m ou en Ligne de 9 m sur 1,50 m (au choix) ; JS de Dextérité (DD 8 + mod. Constitution + bonus de maîtrise), 1d10 dégâts du type de votre ascendance en cas d'échec, moitié en cas de réussite. Les dégâts passent à 2d10 au niveau 5, 3d10 au niveau 11 et 4d10 au niveau 17.",
                "uses": {
                    "count": "pb",
                    "reset": "long"
                }
            },
            {
                "id": "vision_dans_le_noir",
                "name": "Vision dans le noir",
                "level": 1,
                "activation": "passif",
                "text": "Vision dans le noir sur 18 m."
            },
            {
                "id": "vol_draconique",
                "name": "Vol draconique",
                "level": 5,
                "activation": "action Bonus",
                "text": "Dès le niveau 5, par une action Bonus, des ailes spectrales vous donnent pendant 10 minutes une Vitesse de vol égale à votre Vitesse (fin anticipée si vous les rétractez sans action ou si vous êtes Neutralisé). Une fois par Repos long.",
                "uses": {
                    "count": 1,
                    "reset": "long"
                }
            }
        ],
        "option": {
            "key": "draconic_ancestry",
            "label": "Ascendance draconique",
            "choices": [
                {
                    "id": "airain",
                    "name": "Airain",
                    "text": "Souffle et Résistance de feu.",
                    "damageType": "feu"
                },
                {
                    "id": "argent",
                    "name": "Argent",
                    "text": "Souffle et Résistance de froid.",
                    "damageType": "froid"
                },
                {
                    "id": "blanc",
                    "name": "Blanc",
                    "text": "Souffle et Résistance de froid.",
                    "damageType": "froid"
                },
                {
                    "id": "bleu",
                    "name": "Bleu",
                    "text": "Souffle et Résistance de foudre.",
                    "damageType": "foudre"
                },
                {
                    "id": "bronze",
                    "name": "Bronze",
                    "text": "Souffle et Résistance de foudre.",
                    "damageType": "foudre"
                },
                {
                    "id": "cuivre",
                    "name": "Cuivre",
                    "text": "Souffle et Résistance d'acide.",
                    "damageType": "acide"
                },
                {
                    "id": "noir",
                    "name": "Noir",
                    "text": "Souffle et Résistance d'acide.",
                    "damageType": "acide"
                },
                {
                    "id": "or",
                    "name": "Or",
                    "text": "Souffle et Résistance de feu.",
                    "damageType": "feu"
                },
                {
                    "id": "rouge",
                    "name": "Rouge",
                    "text": "Souffle et Résistance de feu.",
                    "damageType": "feu"
                },
                {
                    "id": "vert",
                    "name": "Vert",
                    "text": "Souffle et Résistance de poison.",
                    "damageType": "poison"
                }
            ]
        }
    },
    "goliath": {
        "darkvision": null,
        "traits": [
            {
                "id": "ascendance_gigante",
                "name": "Ascendance gigante",
                "level": 1,
                "activation": "autre",
                "text": "Vous choisissez un bienfait surnaturel hérité d'une lignée de géants ; il s'utilise autant de fois que votre bonus de maîtrise, avec récupération au Repos long.",
                "uses": {
                    "count": "pb",
                    "reset": "long"
                }
            },
            {
                "id": "forme_de_geant",
                "name": "Forme de géant",
                "level": 5,
                "activation": "action Bonus",
                "text": "Dès le niveau 5, par une action Bonus et s'il y a la place, vous passez à la taille G pendant 10 minutes (fin possible plus tôt sans action) : Avantage aux tests de Force et Vitesse +3 m. Une fois par Repos long.",
                "uses": {
                    "count": 1,
                    "reset": "long"
                }
            },
            {
                "id": "forte_carrure",
                "name": "Forte carrure",
                "level": 1,
                "activation": "passif",
                "text": "Avantage aux tests faits pour se libérer de l'état Agrippé ; votre capacité de charge se calcule comme si vous étiez d'une catégorie de taille au-dessus."
            }
        ],
        "option": {
            "key": "giant_ancestry",
            "label": "Ascendance gigante",
            "choices": [
                {
                    "id": "fire",
                    "name": "Brûlure ignée (géants du feu)",
                    "text": "Après avoir touché une cible avec un jet d'attaque et lui avoir infligé des dégâts, vous lui infligez en plus 1d10 dégâts de feu.",
                    "damageType": "feu"
                },
                {
                    "id": "stone",
                    "name": "Endurance de la pierre (géants des pierres)",
                    "text": "Par une Réaction quand vous subissez des dégâts, vous lancez 1d12 + modificateur de Constitution et retranchez ce total des dégâts."
                },
                {
                    "id": "frost",
                    "name": "Froid mordant (géants du givre)",
                    "text": "Après avoir touché une cible avec un jet d'attaque et lui avoir infligé des dégâts, vous ajoutez 1d6 dégâts de froid et sa Vitesse baisse de 3 m jusqu'au début de votre prochain tour.",
                    "damageType": "froid"
                },
                {
                    "id": "hill",
                    "name": "Renversement des coteaux (géants des collines)",
                    "text": "Après avoir touché et blessé avec un jet d'attaque une créature de taille G ou moins, vous pouvez la mettre À terre."
                },
                {
                    "id": "cloud",
                    "name": "Saut des nuées (géants des nuages)",
                    "text": "Par une action Bonus, vous vous téléportez jusqu'à 9 m vers un espace libre que vous voyez."
                },
                {
                    "id": "storm",
                    "name": "Tonnerre des cieux (géants des tempêtes)",
                    "text": "Par une Réaction quand une créature située à 18 m ou moins vous inflige des dégâts, vous lui infligez 1d8 dégâts de tonnerre.",
                    "damageType": "tonnerre"
                }
            ]
        }
    },
    "halfling": {
        "darkvision": null,
        "traits": [
            {
                "id": "agilite_halfeline",
                "name": "Agilité halfeline",
                "level": 1,
                "activation": "passif",
                "text": "Vous pouvez traverser l'espace d'une créature plus grande que vous d'au moins une catégorie de taille, sans pouvoir y terminer votre déplacement."
            },
            {
                "id": "brave",
                "name": "Brave",
                "level": 1,
                "activation": "passif",
                "text": "Avantage aux jets de sauvegarde pour éviter ou faire cesser l'état Effrayé."
            },
            {
                "id": "chance",
                "name": "Chance",
                "level": 1,
                "activation": "autre",
                "text": "Sur un 1 naturel au d20 d'un Test d20, vous pouvez relancer le dé ; vous gardez alors obligatoirement le nouveau résultat."
            },
            {
                "id": "discretion_naturelle",
                "name": "Discrétion naturelle",
                "level": 1,
                "activation": "passif",
                "text": "Vous pouvez tenter l'action Furtivité en étant simplement caché derrière une créature plus grande que vous d'au moins une catégorie de taille."
            }
        ]
    },
    "human": {
        "darkvision": null,
        "traits": [
            {
                "id": "competent",
                "name": "Compétent",
                "level": 1,
                "activation": "passif",
                "text": "Vous gagnez la maîtrise d'une compétence au choix."
            },
            {
                "id": "ingenieux",
                "name": "Ingénieux",
                "level": 1,
                "activation": "autre",
                "text": "Vous obtenez l'Inspiration héroïque à la fin de chaque Repos long."
            },
            {
                "id": "polyvalent",
                "name": "Polyvalent",
                "level": 1,
                "activation": "passif",
                "text": "Vous gagnez un don d'origine au choix (chapitre 5) ; Doué est conseillé."
            }
        ]
    },
    "elf": {
        "darkvision": 18,
        "traits": [
            {
                "id": "ascendance_feerique",
                "name": "Ascendance féerique",
                "level": 1,
                "activation": "passif",
                "text": "Avantage aux jets de sauvegarde pour éviter l'état Charmé ou y mettre fin."
            },
            {
                "id": "lignage_elfique",
                "name": "Lignage elfique",
                "level": 1,
                "activation": "passif",
                "text": "Choix d'un lignage (drow, elfe sylvestre ou haut-elfe) qui donne un bienfait au niveau 1 puis un sort aux niveaux 3 et 5. Ces sorts sont toujours préparés et chacun peut être lancé une fois sans emplacement par Repos long (ou avec un emplacement) ; caractéristique d'incantation au choix : Intelligence, Sagesse ou Charisme."
            },
            {
                "id": "sens_aiguises",
                "name": "Sens aiguisés",
                "level": 1,
                "activation": "passif",
                "text": "Maîtrise d'une compétence au choix : Intuition, Perception ou Survie."
            },
            {
                "id": "transe",
                "name": "Transe",
                "level": 1,
                "activation": "passif",
                "text": "L'elfe n'a pas besoin de dormir et la magie ne peut pas l'endormir ; il termine un Repos long en 4 heures de transe méditative, en restant conscient."
            },
            {
                "id": "vision_dans_le_noir",
                "name": "Vision dans le noir",
                "level": 1,
                "activation": "passif",
                "text": "Vision dans le noir sur 18 m (36 m pour un drow)."
            }
        ],
        "option": {
            "key": "elven_lineage",
            "label": "Lignage elfique",
            "abilities": [
                "int",
                "wis",
                "cha"
            ],
            "choices": [
                {
                    "id": "drow",
                    "name": "Drow",
                    "text": "Vision dans le noir portée à 36 m ; sort mineur lumières dansantes, puis lueurs féeriques (niv. 3) et ténèbres (niv. 5).",
                    "darkvision": 36,
                    "spells": [
                        {
                            "level": 1,
                            "name": "Lumières dansantes",
                            "vo": "Dancing Lights",
                            "spellLevel": 0
                        },
                        {
                            "level": 3,
                            "name": "Lueurs féeriques",
                            "vo": "Faerie Fire",
                            "spellLevel": 1,
                            "free": 1
                        },
                        {
                            "level": 5,
                            "name": "Ténèbres",
                            "vo": "Darkness",
                            "spellLevel": 2,
                            "free": 1
                        }
                    ]
                },
                {
                    "id": "elfe_sylvestre",
                    "name": "Elfe sylvestre",
                    "text": "Vitesse portée à 10,50 m ; sort mineur druidisme, puis grande foulée (niv. 3) et passage sans trace (niv. 5).",
                    "speed": 10.5,
                    "spells": [
                        {
                            "level": 1,
                            "name": "Druidisme",
                            "vo": "Druidcraft",
                            "spellLevel": 0
                        },
                        {
                            "level": 3,
                            "name": "Grande foulée",
                            "vo": "Longstrider",
                            "spellLevel": 1,
                            "free": 1
                        },
                        {
                            "level": 5,
                            "name": "Passage sans trace",
                            "vo": "Pass without Trace",
                            "spellLevel": 2,
                            "free": 1
                        }
                    ]
                },
                {
                    "id": "haut_elfe",
                    "name": "Haut-elfe",
                    "text": "Sort mineur prestidigitation, échangeable à chaque Repos long contre un autre sort mineur de la liste du Magicien ; puis détection de la magie (niv. 3) et foulée brumeuse (niv. 5).",
                    "spells": [
                        {
                            "level": 1,
                            "name": "Prestidigitation",
                            "vo": "Prestidigitation",
                            "spellLevel": 0
                        },
                        {
                            "level": 3,
                            "name": "Détection de la magie",
                            "vo": "Detect Magic",
                            "spellLevel": 1,
                            "free": 1
                        },
                        {
                            "level": 5,
                            "name": "Foulée brumeuse",
                            "vo": "Misty Step",
                            "spellLevel": 2,
                            "free": 1
                        }
                    ]
                }
            ]
        }
    },
    "gnome": {
        "darkvision": 18,
        "traits": [
            {
                "id": "lignage_gnome",
                "name": "Lignage gnome",
                "level": 1,
                "activation": "passif",
                "text": "Choix d'un lignage : gnome des forêts ou gnome des roches. Caractéristique d'incantation des sorts du lignage au choix : Intelligence, Sagesse ou Charisme."
            },
            {
                "id": "ruse_gnome",
                "name": "Ruse gnome",
                "level": 1,
                "activation": "passif",
                "text": "Avantage aux jets de sauvegarde d'Intelligence, de Sagesse et de Charisme."
            },
            {
                "id": "vision_dans_le_noir",
                "name": "Vision dans le noir",
                "level": 1,
                "activation": "passif",
                "text": "Vision dans le noir sur 18 m."
            }
        ],
        "option": {
            "key": "gnomish_lineage",
            "label": "Lignage gnome",
            "abilities": [
                "int",
                "wis",
                "cha"
            ],
            "choices": [
                {
                    "id": "gnome_des_forets",
                    "name": "Gnome des forêts",
                    "text": "Sort mineur illusion mineure ; communication avec les animaux toujours préparé, lançable sans emplacement un nombre de fois égal au bonus de maîtrise par Repos long (ou avec un emplacement).",
                    "spells": [
                        {
                            "level": 1,
                            "name": "Illusion mineure",
                            "vo": "Minor Illusion",
                            "spellLevel": 0
                        },
                        {
                            "level": 1,
                            "name": "Communication avec les animaux",
                            "vo": "Speak with Animals",
                            "spellLevel": 1,
                            "free": "pb"
                        }
                    ]
                },
                {
                    "id": "gnome_des_roches",
                    "name": "Gnome des roches",
                    "text": "Sorts mineurs prestidigitation et réparation. En lançant prestidigitation pendant 10 minutes, fabrique un appareil mécanique Très Petit (CA 5, 1 pv) produisant un effet de prestidigitation, que n'importe qui peut activer par une action Bonus au contact ; 3 appareils au maximum, chacun se démonte après 8 heures ou par une action Utilisation.",
                    "spells": [
                        {
                            "level": 1,
                            "name": "Prestidigitation",
                            "vo": "Prestidigitation",
                            "spellLevel": 0
                        },
                        {
                            "level": 1,
                            "name": "Réparation",
                            "vo": "Mending",
                            "spellLevel": 0
                        }
                    ]
                }
            ]
        }
    },
    "dwarf": {
        "darkvision": 36,
        "traits": [
            {
                "id": "connaissance_de_la_pierre",
                "name": "Connaissance de la pierre",
                "level": 1,
                "activation": "action Bonus",
                "text": "Action Bonus : Perception des vibrations (18 m) pour 10 minutes, à condition de se tenir sur de la pierre, brute ou taillée, ou d'y garder le contact. Utilisable autant de fois que le bonus de maîtrise, quota rendu au Repos long.",
                "uses": {
                    "count": "pb",
                    "reset": "long"
                }
            },
            {
                "id": "resistance_naine",
                "name": "Résistance naine",
                "level": 1,
                "activation": "passif",
                "text": "Résistance aux dégâts de poison, et Avantage aux sauvegardes pour échapper à l'état Empoisonné ou s'en libérer.",
                "resistance": [
                    "poison"
                ]
            },
            {
                "id": "tenacite_naine",
                "name": "Ténacité naine",
                "level": 1,
                "activation": "passif",
                "text": "Vos points de vie maximum augmentent de 1, puis de 1 de plus à chaque niveau gagné (soit +1 par niveau)."
            },
            {
                "id": "vision_dans_le_noir",
                "name": "Vision dans le noir",
                "level": 1,
                "activation": "passif",
                "text": "Vision dans le noir sur 36 m."
            }
        ]
    },
    "orc": {
        "darkvision": 36,
        "traits": [
            {
                "id": "acharnement",
                "name": "Acharnement",
                "level": 1,
                "activation": "autre",
                "text": "Quand vous tombez à 0 point de vie sans mourir sur le coup, vous pouvez rester à 1 point de vie à la place. Une fois par Repos long.",
                "uses": {
                    "count": 1,
                    "reset": "long"
                }
            },
            {
                "id": "poussee_d_adrenaline",
                "name": "Poussée d'adrénaline",
                "level": 1,
                "activation": "action Bonus",
                "text": "Vous pouvez faire l'action Pointe par une action Bonus ; vous gagnez alors des points de vie temporaires égaux à votre bonus de maîtrise. Utilisations récupérées après un Repos court ou long.",
                "uses": {
                    "count": "pb",
                    "reset": "short"
                }
            },
            {
                "id": "vision_dans_le_noir",
                "name": "Vision dans le noir",
                "level": 1,
                "activation": "passif",
                "text": "Vision dans le noir sur 36 m."
            }
        ]
    },
    "tiefling": {
        "darkvision": 18,
        "traits": [
            {
                "id": "heritage_fielon",
                "name": "Héritage fiélon",
                "level": 1,
                "activation": "passif",
                "text": "Choisissez un héritage (Abyssal, Chtonien ou Infernal) : il donne une Résistance et un sort mineur au niveau 1, puis un sort de niveau 1 au niveau 3 et un sort de niveau 2 au niveau 5. Ces deux sorts sont toujours préparés ; chacun peut être lancé une fois sans emplacement par Repos long, ou avec un emplacement."
            },
            {
                "id": "presence_d_outre_monde",
                "name": "Présence d'outre-monde",
                "level": 1,
                "activation": "passif",
                "text": "Vous connaissez le sort mineur Thaumaturgie, lancé avec la caractéristique choisie pour l'Héritage fiélon."
            },
            {
                "id": "vision_dans_le_noir",
                "name": "Vision dans le noir",
                "level": 1,
                "activation": "passif",
                "text": "Vision dans le noir sur 18 m."
            }
        ],
        "option": {
            "key": "fiendish_legacy",
            "label": "Héritage fiélon",
            "abilities": [
                "int",
                "wis",
                "cha"
            ],
            "choices": [
                {
                    "id": "abyssal",
                    "name": "Abyssal",
                    "text": "Résistance aux dégâts de poison ; sort mineur Bouffée de poison, puis Rayon empoisonné au niveau 3 et Immobilisation de personne au niveau 5.",
                    "damageType": "poison",
                    "spells": [
                        {
                            "level": 1,
                            "name": "Bouffée de poison",
                            "vo": "Poison Spray",
                            "spellLevel": 0
                        },
                        {
                            "level": 3,
                            "name": "Rayon empoisonné",
                            "vo": "Ray of Sickness",
                            "spellLevel": 1,
                            "free": 1
                        },
                        {
                            "level": 5,
                            "name": "Immobilisation de personne",
                            "vo": "Hold Person",
                            "spellLevel": 2,
                            "free": 1
                        }
                    ]
                },
                {
                    "id": "chtonien",
                    "name": "Chtonien",
                    "text": "Résistance aux dégâts nécrotiques ; sort mineur Contact glacial, puis Simulacre de vie au niveau 3 et Rayon affaiblissant au niveau 5.",
                    "damageType": "nécrotique",
                    "spells": [
                        {
                            "level": 1,
                            "name": "Contact glacial",
                            "vo": "Chill Touch",
                            "spellLevel": 0
                        },
                        {
                            "level": 3,
                            "name": "Simulacre de vie",
                            "vo": "False Life",
                            "spellLevel": 1,
                            "free": 1
                        },
                        {
                            "level": 5,
                            "name": "Rayon affaiblissant",
                            "vo": "Ray of Enfeeblement",
                            "spellLevel": 2,
                            "free": 1
                        }
                    ]
                },
                {
                    "id": "infernal",
                    "name": "Infernal",
                    "text": "Résistance aux dégâts de feu ; sort mineur Trait de feu, puis Représailles infernales au niveau 3 et Ténèbres au niveau 5.",
                    "damageType": "feu",
                    "spells": [
                        {
                            "level": 1,
                            "name": "Trait de feu",
                            "vo": "Fire Bolt",
                            "spellLevel": 0
                        },
                        {
                            "level": 3,
                            "name": "Représailles infernales",
                            "vo": "Hellish Rebuke",
                            "spellLevel": 1,
                            "free": 1
                        },
                        {
                            "level": 5,
                            "name": "Ténèbres",
                            "vo": "Darkness",
                            "spellLevel": 2,
                            "free": 1
                        }
                    ]
                }
            ]
        },
        "spells": [
            {
                "level": 1,
                "name": "Thaumaturgie",
                "vo": "Thaumaturgy",
                "ability": "option",
                "trait": "Présence d'outre-monde",
                "spellLevel": 0
            }
        ]
    },

    // ----- L'ODYSSÉE DES SEIGNEURS DRAGONS (guide du joueur, chapitre 3) -----
    "centaur": {
        "darkvision": null,
        "traits": [
            {
                "id": "charge",
                "name": "Charge",
                "level": 1,
                "activation": "passif",
                "text": "Si vous parcourez au moins 10 m en ligne droite vers une cible puis la touchez au corps à corps dans le même tour, votre première attaque lui inflige 1d6 dégâts supplémentaires."
            },
            {
                "id": "monture",
                "name": "Monture",
                "level": 1,
                "activation": "action Bonus",
                "text": "Par une action Bonus, un allié bipède à 1,50 m ou moins, de taille égale ou inférieure à la vôtre, peut monter sur votre dos jusqu'à la fin de votre tour ; il redescend ensuite à 1,50 m de vous. Pendant ce transport, il n'est pas considéré comme monté et ne subit pas d'attaques d'opportunité."
            },
            {
                "id": "quadrupede",
                "name": "Quadrupède",
                "level": 1,
                "activation": "passif",
                "text": "Les passages étroits qu'il faut escalader comptent pour vous comme un terrain difficile."
            }
        ]
    },
    "medusa": {
        "darkvision": 18,
        "traits": [
            {
                "id": "chevelure_serpentine",
                "name": "Chevelure serpentine",
                "level": 1,
                "activation": "action",
                "text": "Vos serpents sont une arme naturelle de corps à corps : attaque = bonus de maîtrise + mod. Dextérité, 1d6 dégâts perforants (sans modificateur). La cible touchée fait un JS de Constitution DD 12 ou reste Empoisonnée jusqu'au début de votre prochain tour."
            },
            {
                "id": "maudite",
                "name": "Maudite",
                "level": 1,
                "activation": "passif",
                "text": "Votre transformation en méduse est achevée ; seul le sort Souhait peut lever la malédiction et vous rendre votre apparence d'origine."
            },
            {
                "id": "sang_froid",
                "name": "Sang-froid",
                "level": 1,
                "activation": "passif",
                "text": "Avantage aux jets de sauvegarde contre les sorts et capacités qui infligent l'état Empoisonné."
            },
            {
                "id": "vision_dans_le_noir",
                "name": "Vision dans le noir",
                "level": 1,
                "activation": "passif",
                "text": "Vision dans le noir sur 18 m."
            },
            {
                "id": "regard_petrifiant",
                "name": "Regard pétrifiant",
                "level": 5,
                "activation": "action",
                "text": "Dès le niveau 5, par une action, une créature à 9 m ou moins qui croise votre regard fait un JS de Constitution, sinon elle est Paralysée jusqu'à la fin de son prochain tour. Pendant votre tour, une action Bonus l'oblige à refaire ce JS avec Désavantage (même effet en cas d'échec). Paralysée ainsi une 3e fois en 10 minutes, elle est Pétrifiée. DD 8, puis 10 au niveau 10, 12 au niveau 15 et 14 au niveau 20."
            }
        ]
    },
    "minotaur": {
        "darkvision": 18,
        "traits": [
            {
                "id": "dichromate",
                "name": "Dichromate",
                "level": 1,
                "activation": "passif",
                "text": "Vous voyez en rouges et en gris : seules les teintes rouge vif se distinguent pour vous (défaut à jouer, sans effet chiffré)."
            },
            {
                "id": "odorat_aiguise",
                "name": "Odorat aiguisé",
                "level": 1,
                "activation": "passif",
                "text": "Avantage aux tests de Sagesse (Perception) fondés sur l'odorat ; vous sentez les odeurs fortes jusqu'à 9 km."
            },
            {
                "id": "vision_dedaleenne",
                "name": "Vision dédaléenne",
                "level": 1,
                "activation": "passif",
                "text": "Vision dans le noir sur 18 m. Avantage aux tests de caractéristique pour trouver la sortie d'un labyrinthe ; réussite automatique aux JS contre les sorts Labyrinthe et Motif hypnotique."
            },
            {
                "id": "rage_maudite",
                "name": "Rage maudite",
                "level": 5,
                "activation": "action Bonus",
                "text": "Dès le niveau 5, par une action Bonus, vous devenez un taureau selon les règles du sort Métamorphose, sans concentration ; regarder trop longtemps du rouge vif la déclenche aussi. Une fois par Repos long. Taureau : CA 11, 36 PV, Vitesse 12 m, Cornes +5 (1d8+4 perforants), Charge (6 m en ligne droite : +1d6 perforants, JS de Force DD 11 ou À terre).",
                "uses": {
                    "count": 1,
                    "reset": "long"
                }
            },
            {
                "id": "taureau_enrage",
                "name": "Taureau enragé",
                "level": 9,
                "activation": "autre",
                "text": "Dès le niveau 9, la Rage maudite vous change en taureau enragé : mêmes valeurs, mais CA 12, 46 PV, et Férocité implacable une fois par jour (tombé à 0 PV après 10 dégâts ou moins, il reste à 1 PV)."
            }
        ]
    },
    "satyr": {
        "darkvision": null,
        "traits": [
            {
                "id": "heritage_feerique",
                "name": "Héritage féerique",
                "level": 1,
                "activation": "passif",
                "text": "Avantage aux jets de sauvegarde contre les états Charmé et Effrayé ; aucun sort ne peut vous endormir."
            },
            {
                "id": "memoire_musicale",
                "name": "Mémoire musicale",
                "level": 1,
                "activation": "passif",
                "text": "Maîtrise d'un instrument de musique au choix, et Avantage aux tests de Représentation quand vous en jouez. Vous pouvez rejouer tout morceau entendu au moins une fois."
            },
            {
                "id": "musique_enchantee",
                "name": "Musique enchantée",
                "level": 1,
                "activation": "passif",
                "text": "Vous connaissez le sort mineur Illusion mineure ; puis Sommeil au niveau 3 et Suggestion au niveau 5, chacun lancé une fois sans emplacement par Repos long. Il faut jouer d'un instrument maîtrisé ; caractéristique d'incantation : Charisme."
            }
        ],
        "spells": [
            {
                "level": 1,
                "name": "Illusion mineure",
                "vo": "Minor Illusion",
                "ability": "cha",
                "trait": "Musique enchantée",
                "spellLevel": 0
            },
            {
                "level": 3,
                "name": "Sommeil",
                "vo": "Sleep",
                "ability": "cha",
                "trait": "Musique enchantée",
                "spellLevel": 1,
                "free": 1
            },
            {
                "level": 5,
                "name": "Suggestion",
                "vo": "Suggestion",
                "ability": "cha",
                "trait": "Musique enchantée",
                "spellLevel": 2,
                "free": 1
            }
        ]
    },
    "siren": {
        "darkvision": null,
        "fly": {
            "speed": 9,
            "note": "joyeuse, sans armure intermédiaire ni lourde"
        },
        "traits": [
            {
                "id": "voix_envoutante",
                "name": "Voix envoûtante",
                "level": 1,
                "activation": "passif",
                "text": "Avantage aux tests de Représentation et de Persuasion quand vous vous servez de votre voix ; vous retenez votre souffle pendant 1 heure."
            },
            {
                "id": "humeur_lunatique",
                "name": "Humeur lunatique",
                "level": 1,
                "activation": "autre",
                "text": "Après chaque Repos, court ou long, vous choisissez d'être joyeuse ou triste ; ce choix tient jusqu'au repos suivant, même si votre humeur change entre-temps."
            },
            {
                "id": "vol",
                "name": "Vol",
                "level": 1,
                "activation": "passif",
                "text": "Vitesse de vol de 9 m tant que vous ne portez ni armure intermédiaire ni armure lourde (et seulement d'humeur joyeuse)."
            },
            {
                "id": "chants_de_desespoir",
                "name": "Chants de désespoir",
                "level": 1,
                "activation": "action",
                "text": "D'humeur triste, vous lancez Charme-personne, puis Discours captivant (niveau 3) et Immobilisation de personne (niveau 5), chacun une fois sans emplacement, rendu après un Repos court ou long. Les cibles doivent vous entendre chanter ; caractéristique d'incantation : Charisme."
            }
        ],
        "option": {
            "key": "siren_mood",
            "label": "Humeur lunatique",
            "perUse": true,
            "choices": [
                {
                    "id": "joyeuse",
                    "name": "Joyeuse",
                    "text": "Vous pouvez voler, mais pas entonner de Chants de désespoir."
                },
                {
                    "id": "triste",
                    "name": "Triste",
                    "text": "Vous ne pouvez pas voler, mais vous avez accès aux Chants de désespoir."
                }
            ]
        },
        "spells": [
            {
                "level": 1,
                "name": "Charme-personne",
                "vo": "Charm Person",
                "ability": "cha",
                "trait": "Chants de désespoir",
                "spellLevel": 1,
                "free": 1,
                "reset": "short"
            },
            {
                "level": 3,
                "name": "Discours captivant",
                "vo": "Enthrall",
                "ability": "cha",
                "trait": "Chants de désespoir",
                "spellLevel": 2,
                "free": 1,
                "reset": "short"
            },
            {
                "level": 5,
                "name": "Immobilisation de personne",
                "vo": "Hold Person",
                "ability": "cha",
                "trait": "Chants de désespoir",
                "spellLevel": 2,
                "free": 1,
                "reset": "short"
            }
        ]
    },
    "thylean_nymph": {
        "darkvision": null,
        "traits": [
            {
                "id": "beaute_ensorcelante",
                "name": "Beauté ensorcelante",
                "level": 1,
                "activation": "passif",
                "text": "Avantage aux tests de Persuasion. Vous lancez Charme-personne une fois sans emplacement, rendu après un Repos court ou long ; caractéristique d'incantation : Charisme."
            },
            {
                "id": "heritage",
                "name": "Héritage",
                "level": 1,
                "activation": "passif",
                "text": "À la création, choisissez votre nymphe : dryade, naïade, néréide, oréade ou ouranie. Chacune a son bienfait et deux sorts (niveaux 3 et 7), lancés une fois sans emplacement, rendus après un Repos court ou long ; caractéristique d'incantation : Charisme."
            }
        ],
        "option": {
            "key": "nymph_heritage",
            "label": "Héritage",
            "choices": [
                {
                    "id": "dryade",
                    "name": "Dryade",
                    "text": "Vous parlez le langage des animaux et des plantes ; Avantage aux tests de Sagesse (Survie) en forêt. Baies nourricières (niv. 3), Peau d'écorce (niv. 7).",
                    "spells": [
                        { "level": 3, "name": "Baies nourricières", "vo": "Goodberry", "spellLevel": 1, "free": 1, "reset": "short", "ability": "cha" },
                        { "level": 7, "name": "Peau d'écorce", "vo": "Barkskin", "spellLevel": 2, "free": 1, "reset": "short", "ability": "cha" }
                    ]
                },
                {
                    "id": "naiade",
                    "name": "Naïade",
                    "text": "Vous retenez votre souffle pendant 1 heure ; Vitesse de nage de 9 m. Création ou destruction d'eau (niv. 3), Contrôle de l'eau (niv. 7).",
                    "swim": 9,
                    "spells": [
                        { "level": 3, "name": "Création ou destruction d'eau", "vo": "Create or Destroy Water", "spellLevel": 1, "free": 1, "reset": "short", "ability": "cha" },
                        { "level": 7, "name": "Contrôle de l'eau", "vo": "Control Water", "spellLevel": 4, "free": 1, "reset": "short", "ability": "cha" }
                    ]
                },
                {
                    "id": "nereide",
                    "name": "Néréide",
                    "text": "Vous respirez sous l'eau ; Vitesse de nage de 9 m. Nappe de brouillard (niv. 3), Marche sur l'eau (niv. 7).",
                    "swim": 9,
                    "spells": [
                        { "level": 3, "name": "Nappe de brouillard", "vo": "Fog Cloud", "spellLevel": 1, "free": 1, "reset": "short", "ability": "cha" },
                        { "level": 7, "name": "Marche sur l'eau", "vo": "Water Walk", "spellLevel": 3, "free": 1, "reset": "short", "ability": "cha" }
                    ]
                },
                {
                    "id": "oreade",
                    "name": "Oréade",
                    "text": "Vision dans le noir sur 18 m ; Avantage aux tests de Sagesse (Survie) en voyage dans les steppes, les îles rocheuses et les montagnes. Marque du chasseur (niv. 3), Foulée brumeuse (niv. 7).",
                    "darkvision": 18,
                    "spells": [
                        { "level": 3, "name": "Marque du chasseur", "vo": "Hunter's Mark", "spellLevel": 1, "free": 1, "reset": "short", "ability": "cha" },
                        { "level": 7, "name": "Foulée brumeuse", "vo": "Misty Step", "spellLevel": 2, "free": 1, "reset": "short", "ability": "cha" }
                    ]
                },
                {
                    "id": "ouranie",
                    "name": "Ouranie",
                    "text": "Vision dans le noir sur 18 m ; Avantage aux tests de Sagesse (Survie) pour naviguer en s'aidant des étoiles. Lueurs féeriques (niv. 3), Lévitation (niv. 7).",
                    "darkvision": 18,
                    "spells": [
                        { "level": 3, "name": "Lueurs féeriques", "vo": "Faerie Fire", "spellLevel": 1, "free": 1, "reset": "short", "ability": "cha" },
                        { "level": 7, "name": "Lévitation", "vo": "Levitate", "spellLevel": 2, "free": 1, "reset": "short", "ability": "cha" }
                    ]
                }
            ]
        },
        "spells": [
            {
                "level": 1,
                "name": "Charme-personne",
                "vo": "Charm Person",
                "ability": "cha",
                "trait": "Beauté ensorcelante",
                "spellLevel": 1,
                "free": 1,
                "reset": "short"
            }
        ]
    }
});
