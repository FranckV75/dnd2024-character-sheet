// =============================================================================
// SPECIES-TRAITS.JS - Traits des 10 espèces du Manuel des joueurs 2024 (édition française)
//
// Lus sur les photos du manuel de Franck (dossier « Description des espèces », p. 186-197) et
// vérifiés par une seconde lecture. Les textes sont des RÉSUMÉS dans nos mots (le dépôt est public),
// avec les titres imprimés. Par espèce (clé de DD_RULES.species) :
//  - darkvision : portée de la Vision dans le noir en mètres (null : aucune) ;
//  - traits : { id, name, level, activation, text, uses?: { count: 'pb' | nombre, reset }, resistance? } ;
//  - option : choix de l'espèce (lignage, ascendance, héritage…) : { key, label, abilities? (caractéristique
//    d'incantation au choix), perUse? (choisi à chaque utilisation, pas mémorisé), choices: [{ id, name,
//    text, damageType?, darkvision?, speed?, spells?: [{ level, name, vo, spellLevel, free? }] }] } ;
//    level : niveau du personnage ; spellLevel : niveau du sort (0 = sort mineur) ; free : lancers sans
//    emplacement par Repos long (1, ou 'pb' = bonus de maîtrise) ;
//  - spells : sorts de l'espèce hors option ({ level, name, vo, ability: 'cha' | 'option', trait }).
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
    }
});
