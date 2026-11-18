// =============================================================================
// EXAMPLES.JS (données) - Personnages d'exemple (« Essayer un personnage d'exemple », barre Gestion)
//
// Deux personnages fictifs prêts à jouer, écrits pour cette fiche (noms inventés, données
// publiques) : un Guerrier de niveau 3, simple, et une Magicienne de niveau 5, avec ses sorts.
// Chaque fiche est une sauvegarde partielle au format habituel (mêmes clés que la v3) : elle est
// complétée comme un fichier importé (js/state/examples.js) avant d'être ouverte.
// Les lignes d'armes, d'armures et de sorts sont celles que remplit l'auto-complétion (noms du
// manuel français, data/spells.json). tests/examples.test.js vérifie leur cohérence avec les
// règles de 2024 (PV, CA, maîtrises, emplacements, sorts préparés, livre de sorts).
//  - id : identifiant stable ; title : nom du personnage ; subtitle : classe, niveau, espèce,
//    historique ; pitch : une phrase pour le joueur, dans la fenêtre de choix.
// =============================================================================

export const EXAMPLE_CHARACTERS = Object.freeze([
    {
        id: "guerrier-3",
        title: "Aldric Pierrefeu",
        subtitle: "Guerrier (Champion) de niveau 3 · Humain · Soldat",
        pitch: "Le plus simple pour découvrir la fiche : une épée, un bouclier, une armure, pas de sorts.",
        character: {
            char_name: "Aldric Pierrefeu",
            char_class: "Guerrier",
            char_subclass: "Champion",
            char_background: "Soldat",
            char_species: "Humain",
            char_level: "3",
            char_size: "M",
            char_xp: "900",
            alignment: "Loyal bon",
            str_score: "17",
            dex_score: "13",
            con_score: "15",
            int_score: "8",
            wis_score: "12",
            cha_score: "10",
            str_save_prof: true,
            con_save_prof: true,
            skill_prof_athletics: true,
            skill_prof_intimidation: true,
            skill_prof_perception: true,
            skill_prof_survival: true,
            skill_prof_insight: true,
            hp_max: "28",
            hp_current: "28",
            hp_temp: "0",
            hd_type: "d10",
            hd_current: "0",
            speed: "9m",
            feat_1: "sauvagerie_martiale",
            feat_0: "vigilant",
            feat_2: "defense",
            prof_armor_light: true,
            prof_armor_med: true,
            prof_armor_heavy: true,
            prof_armor_shield: true,
            dynamic_weapons: [
                { name: "Épée longue", prop: "Polyvalente (1d10)", prof: "Sape", ammo: "", note: "", category: "Guerre", atkKey: "FOR", baseDmg: "1d8 tran.", weaponConfig: "" },
                { name: "Javeline", prop: "Lancer (9/36 m)", prof: "Ralentissement", ammo: "4", note: "", category: "Courante", atkKey: "FOR", baseDmg: "1d6 perf.", weaponConfig: "" },
                { name: "Arc court", prop: "Munitions (24/96 m), Deux mains", prof: "Ouverture", ammo: "20", note: "", category: "Courante", atkKey: "DEX", baseDmg: "1d6 perf.", weaponConfig: "" }
            ],
            dynamic_armors: [
                { name: "Cotte de mailles", type: "Lourde", ca: "16", str: "13", stealth: true, weight: "27,5 kg", price: "75 po", comment: "", equipped: true },
                { name: "Bouclier", type: "Bouclier", ca: "+2", str: "-", stealth: false, weight: "3 kg", price: "10 po", comment: "", equipped: true }
            ],
            profs_tools: "Dés",
            langs: "Commun, nain, orc",
            equipment: "Sac d'explorateur, 4 javelines, arc court et 20 flèches, uniforme de voyage, symbole de sa compagnie.",
            gp: "25",
            sp: "8",
            appearance: "Grand, épaules larges, une cicatrice au menton. Porte toujours son bouclier dans le dos.",
            backstory: "Ancien sergent d'une compagnie de gardes-frontière. Calme, protecteur, il se place toujours entre le danger et ses compagnons."
        }
    },
    {
        id: "magicienne-5",
        title: "Ysolde Clairvent",
        subtitle: "Magicienne (Évocateur) de niveau 5 · Humaine · Sage",
        pitch: "Pour essayer le grimoire : sorts préparés, emplacements, vue « Au combat » et bouton « Lancer ».",
        character: {
            char_name: "Ysolde Clairvent",
            char_class: "Magicien",
            char_subclass: "Évocateur",
            char_background: "Sage",
            char_species: "Humain",
            char_level: "5",
            char_size: "M",
            char_xp: "6500",
            alignment: "Neutre bon",
            str_score: "8",
            dex_score: "14",
            con_score: "15",
            int_score: "18",
            wis_score: "12",
            cha_score: "10",
            int_save_prof: true,
            wis_save_prof: true,
            skill_prof_arcana: true,
            skill_prof_history: true,
            skill_prof_investigation: true,
            skill_prof_insight: true,
            skill_prof_perception: true,
            hp_max: "32",
            hp_current: "25",
            hp_temp: "0",
            hd_type: "d6",
            hd_current: "1",
            speed: "9m",
            spell_ability: "int",
            feat_1: "initie_a_la_magie",
            feat_0: "chanceux",
            feat_4: "amelioration_de_caracteristique",
            feat_choices: { "1": { initie_a_la_magie: { list: "wizard", castAbility: "int", cantrip1: "Message", cantrip2: "Minor Illusion", spell: "Mage Armor" } }, "4": { amelioration_de_caracteristique: { asi: "con,int" } } },
            dynamic_weapons: [
                { name: "Bâton", prop: "Polyvalente (1d8)", prof: "", ammo: "", note: "", category: "Courante", atkKey: "FOR", baseDmg: "1d6 cont.", weaponConfig: "" },
                { name: "Dague", prop: "Finesse, Légère, Lancer (6/18 m)", prof: "", ammo: "", note: "", category: "Courante", atkKey: "DEX", baseDmg: "1d4 perf.", weaponConfig: "" }
            ],
            dynamic_armors: [
                { name: "Armure de mage (sort)", type: "Bonus", ca: "+3", str: "", stealth: false, weight: "", price: "", comment: "À cocher quand le sort est lancé (8 h)", equipped: false }
            ],
            dynamic_spells: [
                { lvl: "0", name: "Trait de feu", time: "Action", range: "36 m", note: "Fire Bolt", c: false, r: false, m: false, prep: false, school: "Évocation" },
                { lvl: "0", name: "Main de mage", time: "Action", range: "9 m", note: "Mage Hand", c: false, r: false, m: false, prep: false, school: "Invocation" },
                { lvl: "0", name: "Prestidigitation", time: "Action", range: "3 m", note: "Prestidigitation", c: false, r: false, m: false, prep: false, school: "Transmutation" },
                { lvl: "0", name: "Lumière", time: "Action", range: "Contact", note: "Light", c: false, r: false, m: true, prep: false, school: "Évocation" },
                { lvl: "1", name: "Bouclier", time: "Réaction", range: "Perso", note: "Shield", c: false, r: false, m: false, prep: true, school: "Abjuration" },
                { lvl: "1", name: "Projectile magique", time: "Action", range: "36 m", note: "Magic Missile", c: false, r: false, m: false, prep: true, school: "Évocation" },
                { lvl: "1", name: "Vague tonnante", time: "Action", range: "Perso", note: "Thunderwave", c: false, r: false, m: false, prep: true, school: "Évocation" },
                { lvl: "1", name: "Feuille morte", time: "Réaction", range: "18 m", note: "Feather Fall", c: false, r: false, m: true, prep: true, school: "Transmutation" },
                { lvl: "1", name: "Mains brûlantes", time: "Action", range: "Perso", note: "Burning Hands", c: false, r: false, m: false, prep: false, school: "Évocation" },
                { lvl: "1", name: "Détection de la magie", time: "Action ou Rituel", range: "Perso", note: "Detect Magic", c: true, r: true, m: false, prep: false, school: "Divination" },
                { lvl: "1", name: "Alarme", time: "1 minute ou Rituel", range: "9 m", note: "Alarm", c: false, r: true, m: true, prep: false, school: "Abjuration" },
                { lvl: "1", name: "Compréhension des langues", time: "Action ou Rituel", range: "Perso", note: "Comprehend Languages", c: false, r: true, m: true, prep: false, school: "Divination" },
                { lvl: "1", name: "Appel de familier", time: "1 heure ou Rituel", range: "3 m", note: "Find Familiar", c: false, r: true, m: true, prep: false, school: "Invocation" },
                { lvl: "2", name: "Foulée brumeuse", time: "Action bonus", range: "Perso", note: "Misty Step", c: false, r: false, m: false, prep: true, school: "Invocation" },
                { lvl: "2", name: "Rayon ardent", time: "Action", range: "36 m", note: "Scorching Ray", c: false, r: false, m: false, prep: true, school: "Évocation" },
                { lvl: "2", name: "Image miroir", time: "Action", range: "Perso", note: "Mirror Image", c: false, r: false, m: false, prep: true, school: "Illusion" },
                { lvl: "2", name: "Toile d'araignée", time: "Action", range: "18 m", note: "Web", c: true, r: false, m: true, prep: false, school: "Invocation" },
                { lvl: "2", name: "Fracassement", time: "Action", range: "18 m", note: "Shatter", c: false, r: false, m: true, prep: false, school: "Évocation" },
                { lvl: "3", name: "Boule de feu", time: "Action", range: "45 m", note: "Fireball", c: false, r: false, m: true, prep: true, school: "Évocation" },
                { lvl: "3", name: "Contresort", time: "Réaction", range: "18 m", note: "Counterspell", c: false, r: false, m: false, prep: true, school: "Abjuration" },
                { lvl: "3", name: "Éclair", time: "Action", range: "Perso", note: "Lightning Bolt", c: false, r: false, m: true, prep: false, school: "Évocation" }
            ],
            spell_slots_state: { "1": { used: 1 } },
            profs_tools: "Matériel de calligraphe",
            langs: "Commun, elfique, draconique",
            equipment: "Livre de sorts, bâton (focaliseur arcanique), sacoche à composantes, sac d'érudit, matériel de calligraphe, robe.",
            gp: "84",
            sp: "12",
            appearance: "Mince, cheveux roux noués, doigts tachés d'encre. Un petit carnet dépasse toujours de sa poche.",
            backstory: "Ancienne bibliothécaire d'une tour d'étude, partie vérifier sur le terrain ce que disent les livres. Curieuse, parfois imprudente."
        }
    }
]);
