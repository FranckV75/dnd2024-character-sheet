const SPELLS_DATA = [
  {
    "name": "Agrandissement/rapetissement",
    "vo": "Enlarge/Reduce",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Aide",
    "vo": "Aid",
    "level": 2,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "9 m",
    "duration": "8 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "paladin",
      "ranger"
    ]
  },
  {
    "name": "Alarme",
    "vo": "Alarm",
    "level": 1,
    "school": "Abjuration",
    "castTime": "1 minute ou Rituel",
    "range": "9 m",
    "duration": "8 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "ranger",
      "wizard"
    ]
  },
  {
    "name": "Aliénation",
    "vo": "Befuddlement",
    "level": 8,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "45 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Allié planaire",
    "vo": "Planar Ally",
    "level": 6,
    "school": "Invocation",
    "castTime": "10 minutes",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Amélioration de caractéristique",
    "vo": "Enhance Ability",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "ranger",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Amis|Faux amis",
    "vo": "Friends",
    "level": 0,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "3 m",
    "duration": "1 minute",
    "components": "S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Amitié avec les animaux",
    "vo": "Animal Friendship",
    "level": 1,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "9 m",
    "duration": "24 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Animation des morts",
    "vo": "Animate Dead",
    "level": 3,
    "school": "Nécromancie",
    "castTime": "1 minute",
    "range": "3 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "wizard"
    ]
  },
  {
    "name": "Animation des objets",
    "vo": "Animate Objects",
    "level": 5,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Antidétection",
    "vo": "Nondetection",
    "level": 3,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "8 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "ranger",
      "wizard"
    ]
  },
  {
    "name": "Apaisement des émotions",
    "vo": "Calm Emotions",
    "level": 2,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "cleric"
    ]
  },
  {
    "name": "Apparence trompeuse",
    "vo": "Seeming",
    "level": 5,
    "school": "Illusion",
    "castTime": "Action",
    "range": "9 m",
    "duration": "8 heures",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Appel de destrier",
    "vo": "Find Steed",
    "level": 2,
    "school": "Invocation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "paladin"
    ]
  },
  {
    "name": "Appel de familier",
    "vo": "Find Familiar",
    "level": 1,
    "school": "Invocation",
    "castTime": "1 heure ou Rituel",
    "range": "3 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Appel de la foudre",
    "vo": "Call Lightning",
    "level": 3,
    "school": "Invocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Arme élémentaire",
    "vo": "Elemental Weapon",
    "level": 3,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "paladin",
      "ranger"
    ]
  },
  {
    "name": "Arme magique",
    "vo": "Magic Weapon",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action bonus",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "paladin",
      "ranger",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Arme spirituelle",
    "vo": "Spiritual Weapon",
    "level": 2,
    "school": "Évocation",
    "castTime": "Action bonus",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Armure d'Agathys",
    "vo": "Armor of Agathys",
    "level": 1,
    "school": "Abjuration",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "warlock"
    ]
  },
  {
    "name": "Armure de mage",
    "vo": "Mage Armor",
    "level": 1,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "8 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Arrêt du temps",
    "vo": "Time Stop",
    "level": 9,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Aspersion d'acide",
    "vo": "Acid Splash",
    "level": 0,
    "school": "Évocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Assassin imaginaire",
    "vo": "Phantasmal Killer",
    "level": 4,
    "school": "Illusion",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Assistance",
    "vo": "Guidance",
    "level": 0,
    "school": "Divination",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "druid"
    ]
  },
  {
    "name": "Augure",
    "vo": "Augury",
    "level": 2,
    "school": "Divination",
    "castTime": "1 minute ou Rituel",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "cleric",
      "druid",
      "wizard"
    ]
  },
  {
    "name": "Aura de pureté",
    "vo": "Aura of Purity",
    "level": 4,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin"
    ]
  },
  {
    "name": "Aura de vie",
    "vo": "Aura of Life",
    "level": 4,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin"
    ]
  },
  {
    "name": "Aura de vitalité",
    "vo": "Aura of Vitality",
    "level": 3,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "paladin"
    ]
  },
  {
    "name": "Aura du croisé",
    "vo": "Crusader's Mantle",
    "level": 3,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V",
    "concentration": true,
    "ritual": false,
    "classes": [
      "paladin"
    ]
  },
  {
    "name": "Aura magique de Nystul",
    "vo": "Nystul's Magic Aura",
    "level": 2,
    "school": "Illusion",
    "castTime": "Action",
    "range": "Contact",
    "duration": "24 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Aura sacrée",
    "vo": "Holy Aura",
    "level": 8,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Aversion/attirance",
    "vo": "Antipathy/Sympathy",
    "level": 8,
    "school": "Enchantement",
    "castTime": "1 heure",
    "range": "18 m",
    "duration": "10 jours",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "wizard"
    ]
  },
  {
    "name": "Bagou",
    "vo": "Glibness",
    "level": 8,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 heure",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "warlock"
    ]
  },
  {
    "name": "Baies nourricières",
    "vo": "Goodberry",
    "level": 1,
    "school": "Invocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "24 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Bannissement",
    "vo": "Banishment",
    "level": 4,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Barrière de lames",
    "vo": "Blade Barrier",
    "level": 6,
    "school": "Évocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Bénédiction",
    "vo": "Bless",
    "level": 1,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin"
    ]
  },
  {
    "name": "Blessure",
    "vo": "Inflict Wounds",
    "level": 1,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Bouche magique",
    "vo": "Magic Mouth",
    "level": 2,
    "school": "Illusion",
    "castTime": "1 minute ou Rituel",
    "range": "9 m",
    "duration": "Dissipation",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Bouclier",
    "vo": "Shield",
    "level": 1,
    "school": "Abjuration",
    "castTime": "Réaction",
    "range": "Perso",
    "duration": "1 round",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Bouclier de feu",
    "vo": "Fire Shield",
    "level": 4,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Bouclier de la foi",
    "vo": "Shield of Faith",
    "level": 1,
    "school": "Abjuration",
    "castTime": "Action bonus",
    "range": "18 m",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin"
    ]
  },
  {
    "name": "Bouffée de poison",
    "vo": "Poison Spray",
    "level": 0,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "9 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Boule de feu",
    "vo": "Fireball",
    "level": 3,
    "school": "Évocation",
    "castTime": "Action",
    "range": "45 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Boule de feu à retardement",
    "vo": "Delayed Blast Fireball",
    "level": 7,
    "school": "Évocation",
    "castTime": "Action",
    "range": "45 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Bourrasque",
    "vo": "Gust of Wind",
    "level": 2,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Brume mortelle",
    "vo": "Cloudkill",
    "level": 5,
    "school": "Invocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Cage de force",
    "vo": "Forcecage",
    "level": 7,
    "school": "Évocation",
    "castTime": "Action",
    "range": "30 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Caresse du vampire",
    "vo": "Vampiric Touch",
    "level": 3,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Cécité/surdité",
    "vo": "Blindness/Deafness",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 minute",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Cercle de mort",
    "vo": "Circle of Death",
    "level": 6,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "45 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Cercle de pouvoir",
    "vo": "Circle of Power",
    "level": 5,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin",
      "wizard"
    ]
  },
  {
    "name": "Cercle de téléportation",
    "vo": "Teleportation Circle",
    "level": 5,
    "school": "Invocation",
    "castTime": "1 minute",
    "range": "3 m",
    "duration": "1 round",
    "components": "V,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Cercle magique",
    "vo": "Magic Circle",
    "level": 3,
    "school": "Abjuration",
    "castTime": "1 minute",
    "range": "3 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Chaîne d'éclairs",
    "vo": "Chain Lightning",
    "level": 6,
    "school": "Évocation",
    "castTime": "Action",
    "range": "45 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Champ antimagie",
    "vo": "Antimagic Field",
    "level": 8,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "wizard"
    ]
  },
  {
    "name": "Changement de forme",
    "vo": "Shapechange",
    "level": 9,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "wizard"
    ]
  },
  {
    "name": "Changement de plan",
    "vo": "Plane Shift",
    "level": 7,
    "school": "Invocation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Charme-monstre",
    "vo": "Charm Monster",
    "level": 4,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 heure",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Charme-personne",
    "vo": "Charm Person",
    "level": 1,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 heure",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Châtiment de cécité",
    "vo": "Blinding Smite",
    "level": 3,
    "school": "Évocation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "paladin"
    ]
  },
  {
    "name": "Châtiment de courroux",
    "vo": "Wrathful Smite",
    "level": 1,
    "school": "Nécromancie",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "paladin"
    ]
  },
  {
    "name": "Châtiment de fournaise",
    "vo": "Searing Smite",
    "level": 1,
    "school": "Évocation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "paladin"
    ]
  },
  {
    "name": "Châtiment de révélation",
    "vo": "Shining Smite",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V",
    "concentration": true,
    "ritual": false,
    "classes": [
      "paladin"
    ]
  },
  {
    "name": "Châtiment de stupeur",
    "vo": "Staggering Smite",
    "level": 4,
    "school": "Enchantement",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "paladin"
    ]
  },
  {
    "name": "Châtiment de tonnerre",
    "vo": "Thunderous Smite",
    "level": 1,
    "school": "Évocation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "paladin"
    ]
  },
  {
    "name": "Châtiment divin",
    "vo": "Divine Smite",
    "level": 1,
    "school": "Évocation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "paladin"
    ]
  },
  {
    "name": "Châtiment du ban",
    "vo": "Banishing Smite",
    "level": 5,
    "school": "Invocation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V",
    "concentration": true,
    "ritual": false,
    "classes": [
      "paladin"
    ]
  },
  {
    "name": "Chaudron bouillonnant de Tasha",
    "vo": "Tasha's Bubbling Cauldron",
    "level": 6,
    "school": "Invocation",
    "castTime": "Action",
    "range": "1,50 m",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Chien de garde de Mordenkainen",
    "vo": "Mordenkainen's Faithful Hound",
    "level": 4,
    "school": "Invocation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "8 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Clairvoyance",
    "vo": "Clairvoyance",
    "level": 3,
    "school": "Divination",
    "castTime": "10 minutes",
    "range": "1,5 km",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Clignotement",
    "vo": "Blink",
    "level": 3,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Clone",
    "vo": "Clone",
    "level": 8,
    "school": "Nécromancie",
    "castTime": "1 heure",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Coffre secret de Léomund",
    "vo": "Leomund's Secret Chest",
    "level": 4,
    "school": "Invocation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Colonne de flamme",
    "vo": "Flame Strike",
    "level": 5,
    "school": "Évocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Communication à distance",
    "vo": "Sending",
    "level": 3,
    "school": "Divination",
    "castTime": "Action",
    "range": "Illimitée",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "wizard"
    ]
  },
  {
    "name": "Communication avec les animaux",
    "vo": "Speak with Animals",
    "level": 1,
    "school": "Divination",
    "castTime": "Action ou Rituel",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": false,
    "ritual": true,
    "classes": [
      "bard",
      "druid",
      "ranger",
      "warlock"
    ]
  },
  {
    "name": "Communication avec les morts",
    "vo": "Speak with Dead",
    "level": 3,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "3 m",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "wizard"
    ]
  },
  {
    "name": "Communication avec les plantes",
    "vo": "Speak with Plants",
    "level": 3,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Communion",
    "vo": "Commune",
    "level": 5,
    "school": "Divination",
    "castTime": "1 minute ou Rituel",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Communion avec la nature",
    "vo": "Commune with Nature",
    "level": 5,
    "school": "Divination",
    "castTime": "1 minute ou Rituel",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": true,
    "classes": [
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Compréhension des langues",
    "vo": "Comprehend Languages",
    "level": 1,
    "school": "Divination",
    "castTime": "Action ou Rituel",
    "range": "Perso",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Compulsion",
    "vo": "Compulsion",
    "level": 4,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard"
    ]
  },
  {
    "name": "Cône de froid",
    "vo": "Cone of Cold",
    "level": 5,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Confusion",
    "vo": "Confusion",
    "level": 4,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Contact avec les plans",
    "vo": "Contact Other Plane",
    "level": 5,
    "school": "Divination",
    "castTime": "1 minute ou Rituel",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V",
    "concentration": false,
    "ritual": true,
    "classes": [
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Contact glacial",
    "vo": "Chill Touch",
    "level": 0,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Contagion",
    "vo": "Contagion",
    "level": 5,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "Contact",
    "duration": "7 jours",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid"
    ]
  },
  {
    "name": "Contamination",
    "vo": "Harm",
    "level": 6,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Contresort",
    "vo": "Counterspell",
    "level": 3,
    "school": "Abjuration",
    "castTime": "Réaction",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Contrôle de l'eau",
    "vo": "Control Water",
    "level": 4,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "90 m",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "wizard"
    ]
  },
  {
    "name": "Contrôle du climat",
    "vo": "Control Weather",
    "level": 8,
    "school": "Transmutation",
    "castTime": "10 minutes",
    "range": "Perso",
    "duration": "8 heures",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "wizard"
    ]
  },
  {
    "name": "Convocation d'aberration",
    "vo": "Summon Aberration",
    "level": 4,
    "school": "Invocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Convocation d'artificiel",
    "vo": "Summon Construct",
    "level": 4,
    "school": "Invocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Convocation d'élémentaire",
    "vo": "Summon Elemental",
    "level": 4,
    "school": "Invocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger",
      "wizard"
    ]
  },
  {
    "name": "Convocation de bête",
    "vo": "Summon Beast",
    "level": 2,
    "school": "Invocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Convocation de céleste",
    "vo": "Summon Celestial",
    "level": 5,
    "school": "Invocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin"
    ]
  },
  {
    "name": "Convocation de dragon",
    "vo": "Summon Dragon",
    "level": 5,
    "school": "Invocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Convocation de fée",
    "vo": "Summon Fey",
    "level": 3,
    "school": "Invocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Convocation de fiélon",
    "vo": "Summon Fiend",
    "level": 6,
    "school": "Invocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Convocation de mort-vivant",
    "vo": "Summon Undead",
    "level": 3,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Convocations instantanées de Drawmij",
    "vo": "Drawmij's Instant Summons",
    "level": 6,
    "school": "Invocation",
    "castTime": "1 minute ou Rituel",
    "range": "Contact",
    "duration": "Dissipation",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Coquille antivie",
    "vo": "Antilife Shell",
    "level": 5,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 heure",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Corde enchantée",
    "vo": "Rope Trick",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Cordon de flèches",
    "vo": "Cordon of Arrows",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "8 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "ranger"
    ]
  },
  {
    "name": "Couleurs dansantes",
    "vo": "Color Spray",
    "level": 1,
    "school": "Illusion",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Coup au but",
    "vo": "True Strike",
    "level": 0,
    "school": "Divination",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Coup de tonnerre",
    "vo": "Thunderclap",
    "level": 0,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Couronne du dément",
    "vo": "Crown of Madness",
    "level": 2,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Couteau de glace",
    "vo": "Ice Knife",
    "level": 1,
    "school": "Invocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Création",
    "vo": "Creation",
    "level": 5,
    "school": "Illusion",
    "castTime": "1 minute",
    "range": "9 m",
    "duration": "Spéciale",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Création de mort-vivant",
    "vo": "Create Undead",
    "level": 6,
    "school": "Nécromancie",
    "castTime": "1 minute",
    "range": "3 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Création de nourriture et d'eau",
    "vo": "Create Food and Water",
    "level": 3,
    "school": "Invocation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin"
    ]
  },
  {
    "name": "Création ou destruction d'eau",
    "vo": "Create or Destroy Water",
    "level": 1,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid"
    ]
  },
  {
    "name": "Croissance d'épines",
    "vo": "Spike Growth",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "45 m",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Croissance végétale",
    "vo": "Plant Growth",
    "level": 3,
    "school": "Transmutation",
    "castTime": "Action (embroussaillement) ou 8 heures (fertilisation)",
    "range": "45 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Crosse des druides",
    "vo": "Shillelagh",
    "level": 0,
    "school": "Transmutation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Danse irrésistible d'Otto",
    "vo": "Otto's Irresistible Dance",
    "level": 6,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Déblocage",
    "vo": "Knock",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Décharge occulte",
    "vo": "Eldritch Blast",
    "level": 0,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "warlock"
    ]
  },
  {
    "name": "Dédale",
    "vo": "Maze",
    "level": 8,
    "school": "Invocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Déguisement",
    "vo": "Disguise Self",
    "level": 1,
    "school": "Illusion",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 heure",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Délivrance des malédictions",
    "vo": "Remove Curse",
    "level": 3,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Demi-plan",
    "vo": "Demiplane",
    "level": 8,
    "school": "Invocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 heure",
    "components": "S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Désintégration",
    "vo": "Disintegrate",
    "level": 6,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Détection de l'invisibilité",
    "vo": "See Invisibility",
    "level": 2,
    "school": "Divination",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Détection de la magie",
    "vo": "Detect Magic",
    "level": 1,
    "school": "Divination",
    "castTime": "Action ou Rituel",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": true,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "paladin",
      "ranger",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Détection des pensées",
    "vo": "Detect Thoughts",
    "level": 2,
    "school": "Divination",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Détection des pièges",
    "vo": "Find Traps",
    "level": 2,
    "school": "Divination",
    "castTime": "Action",
    "range": "36 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Détection du mal et du bien",
    "vo": "Detect Evil and Good",
    "level": 1,
    "school": "Divination",
    "castTime": "Action",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin"
    ]
  },
  {
    "name": "Détection du poison et des maladies",
    "vo": "Detect Poison and Disease",
    "level": 1,
    "school": "Divination",
    "castTime": "Action ou Rituel",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": true,
    "classes": [
      "cleric",
      "druid",
      "paladin",
      "ranger"
    ]
  },
  {
    "name": "Discours captivant",
    "vo": "Enthrall",
    "level": 2,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "warlock"
    ]
  },
  {
    "name": "Disque flottant de Tenser",
    "vo": "Tenser's Floating Disk",
    "level": 1,
    "school": "Invocation",
    "castTime": "Action ou Rituel",
    "range": "9 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Dissimulation suprême",
    "vo": "Sequester",
    "level": 7,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "Dissipation",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Dissipation de la magie",
    "vo": "Dispel Magic",
    "level": 3,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "36 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "paladin",
      "ranger",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Dissipation du mal et du bien",
    "vo": "Dispel Evil and Good",
    "level": 5,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin"
    ]
  },
  {
    "name": "Divination",
    "vo": "Divination",
    "level": 4,
    "school": "Divination",
    "castTime": "Action ou Rituel",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "cleric",
      "druid",
      "wizard"
    ]
  },
  {
    "name": "Doigt de mort",
    "vo": "Finger of Death",
    "level": 7,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Domination de bête",
    "vo": "Dominate Beast",
    "level": 4,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger",
      "sorcerer"
    ]
  },
  {
    "name": "Domination de monstre",
    "vo": "Dominate Monster",
    "level": 8,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 heure",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Domination de personne",
    "vo": "Dominate Person",
    "level": 5,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Don des langues",
    "vo": "Tongues",
    "level": 3,
    "school": "Divination",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Double illusoire",
    "vo": "Mislead",
    "level": 5,
    "school": "Illusion",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 heure",
    "components": "S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Doux repos",
    "vo": "Gentle Repose",
    "level": 2,
    "school": "Nécromancie",
    "castTime": "Action ou Rituel",
    "range": "Contact",
    "duration": "10 jours",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "cleric",
      "paladin",
      "wizard"
    ]
  },
  {
    "name": "Druidisme",
    "vo": "Druidcraft",
    "level": 0,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Duel forcé",
    "vo": "Compelled Duel",
    "level": 1,
    "school": "Enchantement",
    "castTime": "Action bonus",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V",
    "concentration": true,
    "ritual": false,
    "classes": [
      "paladin"
    ]
  },
  {
    "name": "Éclair",
    "vo": "Lightning Bolt",
    "level": 3,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Éclat du soleil",
    "vo": "Sunburst",
    "level": 8,
    "school": "Évocation",
    "castTime": "Action",
    "range": "45 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Élémentalisme",
    "vo": "Elementalism",
    "level": 0,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Embruns prismatiques",
    "vo": "Prismatic Spray",
    "level": 7,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Emprisonnement",
    "vo": "Imprisonment",
    "level": 9,
    "school": "Abjuration",
    "castTime": "1 minute",
    "range": "9 m",
    "duration": "Dissipation",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Enchevêtrement",
    "vo": "Entangle",
    "level": 1,
    "school": "Invocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Ennemi subconscient",
    "vo": "Weird",
    "level": 9,
    "school": "Illusion",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Entrave planaire",
    "vo": "Planar Binding",
    "level": 5,
    "school": "Abjuration",
    "castTime": "1 heure",
    "range": "18 m",
    "duration": "24 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Épée de Mordenkainen",
    "vo": "Mordenkainen's Sword",
    "level": 7,
    "school": "Évocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Épine mentale",
    "vo": "Mind Spike",
    "level": 2,
    "school": "Divination",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 heure",
    "components": "S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Éruption ensorcelée",
    "vo": "Sorcerous Burst",
    "level": 0,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer"
    ]
  },
  {
    "name": "Esprit impénétrable",
    "vo": "Mind Blank",
    "level": 8,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "24 heures",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Esprits gardiens",
    "vo": "Spirit Guardians",
    "level": 3,
    "school": "Invocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "État cadavérique",
    "vo": "Feign Death",
    "level": 3,
    "school": "Nécromancie",
    "castTime": "Action ou Rituel",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "wizard"
    ]
  },
  {
    "name": "Éveil",
    "vo": "Awaken",
    "level": 5,
    "school": "Transmutation",
    "castTime": "8 heures",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid"
    ]
  },
  {
    "name": "Fabrication",
    "vo": "Fabricate",
    "level": 4,
    "school": "Transmutation",
    "castTime": "10 minutes",
    "range": "36 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Façonnage de la pierre",
    "vo": "Stone Shape",
    "level": 4,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "wizard"
    ]
  },
  {
    "name": "Faveur divine",
    "vo": "Divine Favor",
    "level": 1,
    "school": "Transmutation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "paladin"
    ]
  },
  {
    "name": "Festin des héros",
    "vo": "Heroes' Feast",
    "level": 6,
    "school": "Invocation",
    "castTime": "10 minutes",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid"
    ]
  },
  {
    "name": "Feuille morte",
    "vo": "Feather Fall",
    "level": 1,
    "school": "Transmutation",
    "castTime": "Réaction",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Flamme éternelle",
    "vo": "Continual Flame",
    "level": 2,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "Dissipation",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "wizard"
    ]
  },
  {
    "name": "Flamme sacrée",
    "vo": "Sacred Flame",
    "level": 0,
    "school": "Évocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Flammes",
    "vo": "Produce Flame",
    "level": 0,
    "school": "Invocation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Fléau d'insectes",
    "vo": "Insect Plague",
    "level": 5,
    "school": "Invocation",
    "castTime": "Action",
    "range": "45 m",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "sorcerer"
    ]
  },
  {
    "name": "Flèche acide de Melf",
    "vo": "Melf's Acid Arrow",
    "level": 2,
    "school": "Évocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Flèche de foudre",
    "vo": "Lightning Arrow",
    "level": 3,
    "school": "Transmutation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "ranger"
    ]
  },
  {
    "name": "Flétrissement",
    "vo": "Blight",
    "level": 4,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "9 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Flou",
    "vo": "Blur",
    "level": 2,
    "school": "Illusion",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Fontaine de lune",
    "vo": "Fount of Moonlight",
    "level": 4,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "druid"
    ]
  },
  {
    "name": "Force fantasmagorique",
    "vo": "Phantasmal Force",
    "level": 2,
    "school": "Illusion",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Forme éthérée",
    "vo": "Etherealness",
    "level": 7,
    "school": "Invocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Jusqu'à 8 heures",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Forme gazeuse",
    "vo": "Gaseous Form",
    "level": 3,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Fou rire de Tasha",
    "vo": "Tasha's Hideous Laughter",
    "level": 1,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Fouet épineux",
    "vo": "Thorn Whip",
    "level": 0,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Foulée brumeuse",
    "vo": "Misty Step",
    "level": 2,
    "school": "Invocation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Fracassement",
    "vo": "Shatter",
    "level": 2,
    "school": "Évocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Frappe du vent d'acier",
    "vo": "Steel Wind Strike",
    "level": 5,
    "school": "Invocation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "Instantanée",
    "components": "S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "ranger",
      "wizard"
    ]
  },
  {
    "name": "Frappe piégeuse",
    "vo": "Ensnaring Strike",
    "level": 1,
    "school": "Invocation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V",
    "concentration": true,
    "ritual": false,
    "classes": [
      "ranger"
    ]
  },
  {
    "name": "Fusion dans la pierre",
    "vo": "Meld into Stone",
    "level": 3,
    "school": "Transmutation",
    "castTime": "Action ou Rituel",
    "range": "Contact",
    "duration": "8 heures",
    "components": "V,S",
    "concentration": false,
    "ritual": true,
    "classes": [
      "cleric",
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Gardien de la foi",
    "vo": "Guardian of Faith",
    "level": 4,
    "school": "Invocation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "8 heures",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Glas",
    "vo": "Toll the Dead",
    "level": 0,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Glissement de terrain",
    "vo": "Move Earth",
    "level": 6,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "2 heures",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Globe d'invulnérabilité",
    "vo": "Globe of Invulnerability",
    "level": 6,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Glyphe de garde",
    "vo": "Glyph of Warding",
    "level": 3,
    "school": "Abjuration",
    "castTime": "1 heure",
    "range": "Contact",
    "duration": "Dissipation/Déclenchement",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "wizard"
    ]
  },
  {
    "name": "Graisse",
    "vo": "Grease",
    "level": 1,
    "school": "Invocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Grande foulée",
    "vo": "Longstrider",
    "level": 1,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "ranger",
      "wizard"
    ]
  },
  {
    "name": "Grêle d'épines",
    "vo": "Hail of Thorns",
    "level": 1,
    "school": "Invocation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "ranger"
    ]
  },
  {
    "name": "Guérison",
    "vo": "Heal",
    "level": 6,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid"
    ]
  },
  {
    "name": "Guérison de groupe",
    "vo": "Mass Heal",
    "level": 9,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Hâte",
    "vo": "Haste",
    "level": 3,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Héroïsme",
    "vo": "Heroism",
    "level": 1,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "paladin"
    ]
  },
  {
    "name": "Identification",
    "vo": "Identify",
    "level": 1,
    "school": "Divination",
    "castTime": "1 minute ou Rituel",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Illusion mineure",
    "vo": "Minor Illusion",
    "level": 0,
    "school": "Illusion",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 minute",
    "components": "S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Illusion programmée",
    "vo": "Programmed Illusion",
    "level": 6,
    "school": "Illusion",
    "castTime": "Action",
    "range": "36 m",
    "duration": "Dissipation",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Image majeure",
    "vo": "Major Image",
    "level": 3,
    "school": "Illusion",
    "castTime": "Action",
    "range": "36 m",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Image miroir",
    "vo": "Mirror Image",
    "level": 2,
    "school": "Illusion",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Image projetée",
    "vo": "Project Image",
    "level": 7,
    "school": "Illusion",
    "castTime": "Action",
    "range": "750 km",
    "duration": "1 jour",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Image silencieuse",
    "vo": "Silent Image",
    "level": 1,
    "school": "Illusion",
    "castTime": "Action",
    "range": "18 m",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Immobilisation de monstre",
    "vo": "Hold Monster",
    "level": 5,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Immobilisation de personne",
    "vo": "Hold Person",
    "level": 2,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Imprécation",
    "vo": "Bane",
    "level": 1,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "warlock"
    ]
  },
  {
    "name": "Injonction",
    "vo": "Command",
    "level": 1,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "paladin"
    ]
  },
  {
    "name": "Insecte géant",
    "vo": "Giant Insect",
    "level": 4,
    "school": "Invocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Interdiction",
    "vo": "Forbiddance",
    "level": 6,
    "school": "Abjuration",
    "castTime": "10 minutes ou Rituel",
    "range": "Contact",
    "duration": "1 jour",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Inversion de la gravité",
    "vo": "Reverse Gravity",
    "level": 7,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "30 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Invisibilité",
    "vo": "Invisibility",
    "level": 2,
    "school": "Illusion",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Invisibilité suprême",
    "vo": "Greater Invisibility",
    "level": 4,
    "school": "Illusion",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Invocation d'animaux",
    "vo": "Conjure Animals",
    "level": 3,
    "school": "Invocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Invocation d'élémentaire",
    "vo": "Conjure Elemental",
    "level": 5,
    "school": "Invocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "wizard"
    ]
  },
  {
    "name": "Invocation d'élémentaires mineurs",
    "vo": "Conjure Minor Elementals",
    "level": 4,
    "school": "Invocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "wizard"
    ]
  },
  {
    "name": "Invocation d'êtres sylvestres",
    "vo": "Conjure Woodland Beings",
    "level": 4,
    "school": "Invocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Invocation de céleste",
    "vo": "Conjure Celestial",
    "level": 7,
    "school": "Invocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Invocation de fée",
    "vo": "Conjure Fey",
    "level": 6,
    "school": "Invocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Invocation de projectiles|Hérissement",
    "vo": "Conjure Barrage",
    "level": 3,
    "school": "Invocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "ranger"
    ]
  },
  {
    "name": "Invocation de volée",
    "vo": "Conjure Volley",
    "level": 5,
    "school": "Invocation",
    "castTime": "Action",
    "range": "45 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "ranger"
    ]
  },
  {
    "name": "Lame de feu",
    "vo": "Flame Blade",
    "level": 2,
    "school": "Évocation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer"
    ]
  },
  {
    "name": "Lenteur",
    "vo": "Slow",
    "level": 3,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Lévitation",
    "vo": "Levitate",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Liane avide",
    "vo": "Grasping Vine",
    "level": 4,
    "school": "Invocation",
    "castTime": "Action bonus",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Liberté de mouvement",
    "vo": "Freedom of Movement",
    "level": 4,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Lien de protection",
    "vo": "Warding Bond",
    "level": 2,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin"
    ]
  },
  {
    "name": "Lien télépathique de Rary",
    "vo": "Rary's Telepathic Bond",
    "level": 5,
    "school": "Divination",
    "castTime": "Action ou Rituel",
    "range": "9 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Localisation d'animaux ou de plantes",
    "vo": "Locate Animals or Plants",
    "level": 2,
    "school": "Divination",
    "castTime": "Action ou Rituel",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "bard",
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Localisation d'objet",
    "vo": "Locate Object",
    "level": 2,
    "school": "Divination",
    "castTime": "Action",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "paladin",
      "ranger",
      "wizard"
    ]
  },
  {
    "name": "Localisation de créature",
    "vo": "Locate Creature",
    "level": 4,
    "school": "Divination",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "paladin",
      "ranger",
      "wizard"
    ]
  },
  {
    "name": "Lueur d'espoir",
    "vo": "Beacon of Hope",
    "level": 3,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Lueurs féeriques",
    "vo": "Faerie Fire",
    "level": 1,
    "school": "Évocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "druid"
    ]
  },
  {
    "name": "Lumière",
    "vo": "Light",
    "level": 0,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Lumière du jour",
    "vo": "Daylight",
    "level": 3,
    "school": "Évocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 heure",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "paladin",
      "ranger",
      "sorcerer"
    ]
  },
  {
    "name": "Lumières dansantes",
    "vo": "Dancing Lights",
    "level": 0,
    "school": "Illusion",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Main de Bigby",
    "vo": "Bigby's Hand",
    "level": 5,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Main de mage",
    "vo": "Mage Hand",
    "level": 0,
    "school": "Invocation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Mains brûlantes",
    "vo": "Burning Hands",
    "level": 1,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Malédiction",
    "vo": "Bestow Curse",
    "level": 3,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "wizard"
    ]
  },
  {
    "name": "Maléfice",
    "vo": "Hex",
    "level": 1,
    "school": "Enchantement",
    "castTime": "Action bonus",
    "range": "27 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "warlock"
    ]
  },
  {
    "name": "Manoir somptueux de Mordenkainen",
    "vo": "Mordenkainen's Magnificent Mansion",
    "level": 7,
    "school": "Invocation",
    "castTime": "1 minute",
    "range": "45 m",
    "duration": "24 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Marche sur l'eau|Marche sur l'onde",
    "vo": "Water Walk",
    "level": 3,
    "school": "Transmutation",
    "castTime": "Action ou Rituel",
    "range": "9 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "cleric",
      "druid",
      "ranger",
      "sorcerer"
    ]
  },
  {
    "name": "Marque du chasseur",
    "vo": "Hunter's Mark",
    "level": 1,
    "school": "Divination",
    "castTime": "Action bonus",
    "range": "27 m",
    "duration": "1 heure",
    "components": "V",
    "concentration": true,
    "ritual": false,
    "classes": [
      "ranger"
    ]
  },
  {
    "name": "Mauvais oeil",
    "vo": "Eyebite",
    "level": 6,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Message",
    "vo": "Message",
    "level": 0,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 round",
    "components": "S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Messager animal",
    "vo": "Animal Messenger",
    "level": 2,
    "school": "Enchantement",
    "castTime": "Action ou Rituel",
    "range": "9 m",
    "duration": "24 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "bard",
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Métal brûlant",
    "vo": "Heat Metal",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "druid"
    ]
  },
  {
    "name": "Métamorphose",
    "vo": "Polymorph",
    "level": 4,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Métamorphose animale",
    "vo": "Animal Shapes",
    "level": 8,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "24 heures",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Métamorphose suprême",
    "vo": "True Polymorph",
    "level": 9,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Mirage",
    "vo": "Mirage Arcane",
    "level": 7,
    "school": "Illusion",
    "castTime": "10 minutes",
    "range": "Vue",
    "duration": "10 jours",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "wizard"
    ]
  },
  {
    "name": "Modification d'apparence",
    "vo": "Alter Self",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 heure",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Modification de mémoire",
    "vo": "Modify Memory",
    "level": 5,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Monture fantôme",
    "vo": "Phantom Steed",
    "level": 3,
    "school": "Illusion",
    "castTime": "1 minute ou Rituel",
    "range": "9 m",
    "duration": "1 heure",
    "components": "V,S",
    "concentration": false,
    "ritual": true,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Moquerie cruelle",
    "vo": "Vicious Mockery",
    "level": 0,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard"
    ]
  },
  {
    "name": "Mot de guérison",
    "vo": "Healing Word",
    "level": 1,
    "school": "Abjuration",
    "castTime": "Action bonus",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid"
    ]
  },
  {
    "name": "Mot de guérison de groupe",
    "vo": "Mass Healing Word",
    "level": 3,
    "school": "Abjuration",
    "castTime": "Action bonus",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric"
    ]
  },
  {
    "name": "Mot de pouvoir étourdissant",
    "vo": "Power Word Stun",
    "level": 8,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Mot de pouvoir fortifiant",
    "vo": "Power Word Fortify",
    "level": 7,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric"
    ]
  },
  {
    "name": "Mot de pouvoir guérisseur",
    "vo": "Power Word Heal",
    "level": 9,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric"
    ]
  },
  {
    "name": "Mot de pouvoir mortel",
    "vo": "Power Word Kill",
    "level": 9,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Mot de radiance",
    "vo": "Word of Radiance",
    "level": 0,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Mot de retour",
    "vo": "Word of Recall",
    "level": 6,
    "school": "Invocation",
    "castTime": "Action",
    "range": "1,50 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Motif hypnotique",
    "vo": "Hypnotic Pattern",
    "level": 3,
    "school": "Illusion",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 minute",
    "components": "S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Mur d'épines",
    "vo": "Wall of Thorns",
    "level": 6,
    "school": "Invocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Mur de feu",
    "vo": "Wall of Fire",
    "level": 4,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Mur de force",
    "vo": "Wall of Force",
    "level": 5,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Mur de glace",
    "vo": "Wall of Ice",
    "level": 6,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Mur de pierre",
    "vo": "Wall of Stone",
    "level": 5,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Mur de vent",
    "vo": "Wind Wall",
    "level": 3,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Mur prismatique",
    "vo": "Prismatic Wall",
    "level": 9,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "18 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Murmures dissonants",
    "vo": "Dissonant Whispers",
    "level": 1,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard"
    ]
  },
  {
    "name": "Mythes et légendes",
    "vo": "Legend Lore",
    "level": 5,
    "school": "Divination",
    "castTime": "10 minutes",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "wizard"
    ]
  },
  {
    "name": "Nappe de brouillard",
    "vo": "Fog Cloud",
    "level": 1,
    "school": "Invocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 heure",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Nuage incendiaire",
    "vo": "Incendiary Cloud",
    "level": 8,
    "school": "Invocation",
    "castTime": "Action",
    "range": "45 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Nuage nauséabond",
    "vo": "Stinking Cloud",
    "level": 3,
    "school": "Invocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Nuée de dagues",
    "vo": "Cloud of Daggers",
    "level": 2,
    "school": "Invocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Nuée de météores",
    "vo": "Meteor Swarm",
    "level": 9,
    "school": "Évocation",
    "castTime": "Action",
    "range": "1,5 km",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Oeil du mage",
    "vo": "Arcane Eye",
    "level": 4,
    "school": "Divination",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Orbe chromatique",
    "vo": "Chromatic Orb",
    "level": 1,
    "school": "Évocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Orientation",
    "vo": "Find the Path",
    "level": 6,
    "school": "Divination",
    "castTime": "1 minute",
    "range": "Perso",
    "duration": "1 jour",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid"
    ]
  },
  {
    "name": "Parole divine",
    "vo": "Divine Word",
    "level": 7,
    "school": "Évocation",
    "castTime": "Action bonus",
    "range": "9 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Passage par les arbres",
    "vo": "Tree Stride",
    "level": 5,
    "school": "Invocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Passage sans trace",
    "vo": "Pass without Trace",
    "level": 2,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Passe-muraille",
    "vo": "Passwall",
    "level": 5,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Pattes d'araignée",
    "vo": "Spider Climb",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Peau d'écorce",
    "vo": "Barkskin",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action bonus",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Peau de pierre",
    "vo": "Stoneskin",
    "level": 4,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "ranger",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Perception bestiale",
    "vo": "Beast Sense",
    "level": 2,
    "school": "Divination",
    "castTime": "Action ou Rituel",
    "range": "Contact",
    "duration": "1 heure",
    "components": "S",
    "concentration": true,
    "ritual": true,
    "classes": [
      "druid",
      "ranger"
    ]
  },
  {
    "name": "Perturbations synaptiques",
    "vo": "Synaptic Static",
    "level": 5,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "36 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Petite hutte de Léomund",
    "vo": "Leomund's Tiny Hut",
    "level": 3,
    "school": "Évocation",
    "castTime": "1 minute ou Rituel",
    "range": "Perso",
    "duration": "8 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Pétrification",
    "vo": "Flesh to Stone",
    "level": 6,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Peur|Terreur",
    "vo": "Fear",
    "level": 3,
    "school": "Illusion",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Piqûre mentale",
    "vo": "Mind Sliver",
    "level": 0,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 round",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Poigne électrique",
    "vo": "Shocking Grasp",
    "level": 0,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Portail",
    "vo": "Gate",
    "level": 9,
    "school": "Invocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Portail arcanique",
    "vo": "Arcane Gate",
    "level": 6,
    "school": "Invocation",
    "castTime": "Action",
    "range": "90 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Porte dimensionnelle",
    "vo": "Dimension Door",
    "level": 4,
    "school": "Invocation",
    "castTime": "Action",
    "range": "150 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Poussière d'étoile",
    "vo": "Starry Wisp",
    "level": 0,
    "school": "Évocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid"
    ]
  },
  {
    "name": "Préméditation",
    "vo": "Contingency",
    "level": 6,
    "school": "Abjuration",
    "castTime": "10 minutes",
    "range": "Perso",
    "duration": "10 jours",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Prémonition",
    "vo": "Foresight",
    "level": 9,
    "school": "Divination",
    "castTime": "1 minute",
    "range": "Contact",
    "duration": "8 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Présence royale de Yolane",
    "vo": "Yolande's Regal Presence",
    "level": 5,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Prestidigitation",
    "vo": "Prestidigitation",
    "level": 0,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "3 m",
    "duration": "Jusqu'à 1 heure",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Prière de guérison",
    "vo": "Prayer of Healing",
    "level": 2,
    "school": "Abjuration",
    "castTime": "10 minutes",
    "range": "9 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin"
    ]
  },
  {
    "name": "Projectile magique",
    "vo": "Magic Missile",
    "level": 1,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Projection astrale",
    "vo": "Astral Projection",
    "level": 9,
    "school": "Nécromancie",
    "castTime": "1 heure",
    "range": "3 m",
    "duration": "Dissipation",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Protection contre l'énergie",
    "vo": "Protection from Energy",
    "level": 3,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "ranger",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Protection contre la mort",
    "vo": "Death Ward",
    "level": 4,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "8 heures",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "paladin"
    ]
  },
  {
    "name": "Protection contre le mal et le bien",
    "vo": "Protection from Evil and Good",
    "level": 1,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "paladin",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Protection contre le poison",
    "vo": "Protection from Poison",
    "level": 2,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "paladin",
      "ranger"
    ]
  },
  {
    "name": "Protections et sceaux",
    "vo": "Guards and Wards",
    "level": 6,
    "school": "Abjuration",
    "castTime": "1 heure",
    "range": "Contact",
    "duration": "24 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "wizard"
    ]
  },
  {
    "name": "Purification de la nourriture et de l'eau",
    "vo": "Purify Food and Drink",
    "level": 1,
    "school": "Transmutation",
    "castTime": "Action ou Rituel",
    "range": "3 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": true,
    "classes": [
      "cleric",
      "druid",
      "paladin"
    ]
  },
  {
    "name": "Quête",
    "vo": "Geas",
    "level": 5,
    "school": "Enchantement",
    "castTime": "1 minute",
    "range": "18 m",
    "duration": "30 jours",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "paladin",
      "wizard"
    ]
  },
  {
    "name": "Rappel à la vie",
    "vo": "Raise Dead",
    "level": 5,
    "school": "Nécromancie",
    "castTime": "1 heure",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "paladin"
    ]
  },
  {
    "name": "Rayon affaiblissant",
    "vo": "Ray of Enfeeblement",
    "level": 2,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Rayon ardent",
    "vo": "Scorching Ray",
    "level": 2,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Rayon de givre",
    "vo": "Ray of Frost",
    "level": 0,
    "school": "Évocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Rayon de lune",
    "vo": "Moonbeam",
    "level": 2,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Rayon de soleil",
    "vo": "Sunbeam",
    "level": 6,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Rayon empoisonné",
    "vo": "Ray of Sickness",
    "level": 1,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Rayon traçant",
    "vo": "Guiding Bolt",
    "level": 1,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 round",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Régénération",
    "vo": "Regenerate",
    "level": 7,
    "school": "Transmutation",
    "castTime": "1 minute",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid"
    ]
  },
  {
    "name": "Réincarnation",
    "vo": "Reincarnate",
    "level": 5,
    "school": "Nécromancie",
    "castTime": "1 heure",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Réparation",
    "vo": "Mending",
    "level": 0,
    "school": "Transmutation",
    "castTime": "1 minute",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Repli expéditif",
    "vo": "Expeditious Retreat",
    "level": 1,
    "school": "Transmutation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Représailles infernales",
    "vo": "Hellish Rebuke",
    "level": 1,
    "school": "Évocation",
    "castTime": "Réaction",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "warlock"
    ]
  },
  {
    "name": "Résistance",
    "vo": "Resistance",
    "level": 0,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "druid"
    ]
  },
  {
    "name": "Respiration aquatique",
    "vo": "Water Breathing",
    "level": 3,
    "school": "Transmutation",
    "castTime": "Action ou Rituel",
    "range": "9 m",
    "duration": "24 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "druid",
      "ranger",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Restauration partielle",
    "vo": "Lesser Restoration",
    "level": 2,
    "school": "Abjuration",
    "castTime": "Action bonus",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "paladin",
      "ranger"
    ]
  },
  {
    "name": "Restauration suprême",
    "vo": "Greater Restoration",
    "level": 5,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "paladin",
      "ranger"
    ]
  },
  {
    "name": "Résurrection",
    "vo": "Resurrection",
    "level": 7,
    "school": "Nécromancie",
    "castTime": "1 heure",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric"
    ]
  },
  {
    "name": "Résurrection suprême",
    "vo": "True Resurrection",
    "level": 9,
    "school": "Nécromancie",
    "castTime": "1 heure",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid"
    ]
  },
  {
    "name": "Retour à la vie",
    "vo": "Revivify",
    "level": 3,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "paladin",
      "ranger"
    ]
  },
  {
    "name": "Sanctification",
    "vo": "Hallow",
    "level": 5,
    "school": "Abjuration",
    "castTime": "24 heures",
    "range": "Contact",
    "duration": "Dissipation",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Sanctuaire",
    "vo": "Sanctuary",
    "level": 1,
    "school": "Abjuration",
    "castTime": "Action bonus",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Sanctuaire privé de Mordenkainen",
    "vo": "Mordenkainen's Private Sanctum",
    "level": 4,
    "school": "Abjuration",
    "castTime": "10 minutes",
    "range": "36 m",
    "duration": "24 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Saut",
    "vo": "Jump",
    "level": 1,
    "school": "Transmutation",
    "castTime": "Action bonus",
    "range": "Contact",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid",
      "ranger",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Scrutation",
    "vo": "Scrying",
    "level": 5,
    "school": "Divination",
    "castTime": "10 minutes",
    "range": "Perso",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Serviteur invisible",
    "vo": "Unseen Servant",
    "level": 1,
    "school": "Invocation",
    "castTime": "Action ou Rituel",
    "range": "18 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "bard",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Silence",
    "vo": "Silence",
    "level": 2,
    "school": "Illusion",
    "castTime": "Action ou Rituel",
    "range": "36 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": true,
    "classes": [
      "bard",
      "cleric",
      "ranger"
    ]
  },
  {
    "name": "Simulacre",
    "vo": "Simulacrum",
    "level": 7,
    "school": "Illusion",
    "castTime": "12 heures",
    "range": "Contact",
    "duration": "Dissipation",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Simulacre de vie",
    "vo": "False Life",
    "level": 1,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Soins",
    "vo": "Cure Wounds",
    "level": 1,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "paladin",
      "ranger"
    ]
  },
  {
    "name": "Soins de groupe",
    "vo": "Mass Cure Wounds",
    "level": 5,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "18 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid"
    ]
  },
  {
    "name": "Sommeil",
    "vo": "Sleep",
    "level": 1,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Songe",
    "vo": "Dream",
    "level": 5,
    "school": "Illusion",
    "castTime": "1 minute",
    "range": "Spéciale",
    "duration": "8 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Souffle du dragon",
    "vo": "Dragon's Breath",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action bonus",
    "range": "Contact",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Souhait",
    "vo": "Wish",
    "level": 9,
    "school": "Invocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Sphère de feu",
    "vo": "Flaming Sphere",
    "level": 2,
    "school": "Invocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Sphère de vitriol",
    "vo": "Vitriolic Sphere",
    "level": 4,
    "school": "Évocation",
    "castTime": "Action",
    "range": "45 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Sphère glacée d'Otiluke",
    "vo": "Otiluke's Freezing Sphere",
    "level": 6,
    "school": "Évocation",
    "castTime": "Action",
    "range": "45 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Sphère résiliente d'Otiluke",
    "vo": "Otiluke's Resilient Sphere",
    "level": 4,
    "school": "Évocation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Stabilisation",
    "vo": "Spare the Dying",
    "level": 0,
    "school": "Nécromancie",
    "castTime": "Action",
    "range": "4,50 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid"
    ]
  },
  {
    "name": "Suggestion",
    "vo": "Suggestion",
    "level": 2,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "9 m",
    "duration": "8 heures",
    "components": "V,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Suggestion de groupe",
    "vo": "Mass Suggestion",
    "level": 6,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "24 heures",
    "components": "V,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Symbole",
    "vo": "Symbol",
    "level": 7,
    "school": "Abjuration",
    "castTime": "1 minute",
    "range": "Contact",
    "duration": "Dissipation/Déclenchement",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "druid",
      "wizard"
    ]
  },
  {
    "name": "Télékinésie",
    "vo": "Telekinesis",
    "level": 5,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Télépathie",
    "vo": "Telepathy",
    "level": 8,
    "school": "Divination",
    "castTime": "Action",
    "range": "Illimitée",
    "duration": "24 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Téléportation",
    "vo": "Teleport",
    "level": 7,
    "school": "Invocation",
    "castTime": "Action",
    "range": "3 m",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Tempête de feu",
    "vo": "Fire Storm",
    "level": 7,
    "school": "Évocation",
    "castTime": "Action",
    "range": "45 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "sorcerer"
    ]
  },
  {
    "name": "Tempête de grêle",
    "vo": "Ice Storm",
    "level": 4,
    "school": "Évocation",
    "castTime": "Action",
    "range": "90 m",
    "duration": "Instantanée",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Tempête de neige",
    "vo": "Sleet Storm",
    "level": 3,
    "school": "Invocation",
    "castTime": "Action",
    "range": "45 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Tempête radieuse de Jallarzi",
    "vo": "Jallarzi's Storm of Radiance",
    "level": 5,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Tempête vengeresse",
    "vo": "Storm of Vengeance",
    "level": 9,
    "school": "Invocation",
    "castTime": "Action",
    "range": "1,5 km",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Ténèbres",
    "vo": "Darkness",
    "level": 2,
    "school": "Évocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "10 minutes",
    "components": "V,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Tentacules de Hadar",
    "vo": "Arms of Hadar",
    "level": 1,
    "school": "Invocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "warlock"
    ]
  },
  {
    "name": "Tentacules noirs d'Evard",
    "vo": "Evard's Black Tentacles",
    "level": 4,
    "school": "Invocation",
    "castTime": "Action",
    "range": "27 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Terrain hallucinatoire",
    "vo": "Hallucinatory Terrain",
    "level": 4,
    "school": "Illusion",
    "castTime": "10 minutes",
    "range": "90 m",
    "duration": "24 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Texte illusoire",
    "vo": "Illusory Script",
    "level": 1,
    "school": "Illusion",
    "castTime": "1 minute ou Rituel",
    "range": "Contact",
    "duration": "10 jours",
    "components": "S,M",
    "concentration": false,
    "ritual": true,
    "classes": [
      "bard",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Thaumaturgie",
    "vo": "Thaumaturgy",
    "level": 0,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "9 m",
    "duration": "Jusqu'à 1 minute",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "cleric"
    ]
  },
  {
    "name": "Toile d'araignée",
    "vo": "Web",
    "level": 2,
    "school": "Invocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Trait de feu",
    "vo": "Fire Bolt",
    "level": 0,
    "school": "Évocation",
    "castTime": "Action",
    "range": "36 m",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Trait ensorcelé",
    "vo": "Witch Bolt",
    "level": 1,
    "school": "Évocation",
    "castTime": "Action",
    "range": "18 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Tremblement de terre",
    "vo": "Earthquake",
    "level": 8,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "150 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "cleric",
      "druid",
      "sorcerer"
    ]
  },
  {
    "name": "Tsunami",
    "vo": "Tsunami",
    "level": 8,
    "school": "Invocation",
    "castTime": "1 minute",
    "range": "1,5 km",
    "duration": "6 rounds",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Urne magique|Possession",
    "vo": "Magic Jar",
    "level": 6,
    "school": "Nécromancie",
    "castTime": "1 minute",
    "range": "Perso",
    "duration": "Dissipation",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Vague destructrice",
    "vo": "Destructive Wave",
    "level": 5,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V",
    "concentration": false,
    "ritual": false,
    "classes": [
      "paladin"
    ]
  },
  {
    "name": "Vague tonnante",
    "vo": "Thunderwave",
    "level": 1,
    "school": "Évocation",
    "castTime": "Action",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "druid",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Vent divin",
    "vo": "Wind Walk",
    "level": 6,
    "school": "Transmutation",
    "castTime": "1 minute",
    "range": "9 m",
    "duration": "8 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Verrou arcanique|Verrou magique",
    "vo": "Arcane Lock",
    "level": 2,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Contact",
    "duration": "Dissipation",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "wizard"
    ]
  },
  {
    "name": "Vif carquois",
    "vo": "Swift Quiver",
    "level": 5,
    "school": "Transmutation",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "ranger"
    ]
  },
  {
    "name": "Vigueur arcanique",
    "vo": "Arcane Vigor",
    "level": 2,
    "school": "Abjuration",
    "castTime": "Action bonus",
    "range": "Perso",
    "duration": "Instantanée",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Vision dans le noir",
    "vo": "Darkvision",
    "level": 2,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "8 heures",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid",
      "ranger",
      "sorcerer",
      "wizard"
    ]
  },
  {
    "name": "Vision suprême",
    "vo": "True Seeing",
    "level": 6,
    "school": "Divination",
    "castTime": "Action",
    "range": "Contact",
    "duration": "1 heure",
    "components": "V,S,M",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Voie végétale",
    "vo": "Transport via Plants",
    "level": 6,
    "school": "Invocation",
    "castTime": "Action",
    "range": "3 m",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "druid"
    ]
  },
  {
    "name": "Voile défensif",
    "vo": "Blade Ward",
    "level": 0,
    "school": "Abjuration",
    "castTime": "Action",
    "range": "Perso",
    "duration": "1 minute",
    "components": "V,S",
    "concentration": true,
    "ritual": false,
    "classes": [
      "bard",
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Vol",
    "vo": "Fly",
    "level": 3,
    "school": "Transmutation",
    "castTime": "Action",
    "range": "Contact",
    "duration": "10 minutes",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "sorcerer",
      "warlock",
      "wizard"
    ]
  },
  {
    "name": "Voracité de Hadar",
    "vo": "Hunger of Hadar",
    "level": 3,
    "school": "Invocation",
    "castTime": "Action",
    "range": "45 m",
    "duration": "1 minute",
    "components": "V,S,M",
    "concentration": true,
    "ritual": false,
    "classes": [
      "warlock"
    ]
  },
  {
    "name": "Zone de vérité",
    "vo": "Zone of Truth",
    "level": 2,
    "school": "Enchantement",
    "castTime": "Action",
    "range": "18 m",
    "duration": "10 minutes",
    "components": "V,S",
    "concentration": false,
    "ritual": false,
    "classes": [
      "bard",
      "cleric",
      "paladin"
    ]
  }
];
