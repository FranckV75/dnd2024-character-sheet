// =============================================================================
// FEATS-DATA.JS - Base de données des Dons D&D 2024
// =============================================================================

const FEATS_DATA = {
    // =========================================================================
    // DONS D'ORIGINE
    // =========================================================================
    "alerte": {
        name: "Alerte", type: "Origine", prereq: "Niv 1+", asi: "Aucune",
        desc: "Vous obtenez un bonus à l'Initiative égal à votre bonus de Maîtrise. De plus, immédiatement après avoir lancé l'Initiative, vous pouvez échanger votre score avec celui d'un allié consentant."
    },
    "artisan": {
        name: "Artisan", type: "Origine", prereq: "Niv 1+", asi: "Aucune",
        desc: "Vous maîtrisez 3 outils d'artisan. Chaque fois que vous fabriquez un objet non-magique, vous le faites 20% plus vite."
    },
    "chancard": {
        name: "Chançard", type: "Origine", prereq: "Niv 1+", asi: "Aucune",
        desc: "Vous avez un nombre de Points de Chance égal à votre bonus de Maîtrise. Dépensez 1 point pour relancer un 1 sur un de vos d20, ou imposer un Désavantage à une attaque contre vous."
    },
    "combat_mains_nues": {
        name: "Combat à mains nues", type: "Origine", prereq: "Niv 1+", asi: "Aucune",
        desc: "Vos frappes non armées infligent 1d6 + mod For dégâts contondants (1d8 à deux mains). Action bonus: 1 pt de dégât."
    },
    "coriace": {
        name: "Coriace", type: "Origine", prereq: "Niv 1+", asi: "Aucune",
        desc: "Votre maximum de points de vie augmente de +2 par niveau de personnage (rétroactif). À chaque niveau gagné, il augmente de +2 supplémentaire."
    },
    "guerisseur": {
        name: "Guérisseur", type: "Origine", prereq: "Niv 1+", asi: "Aucune",
        desc: "Vous pouvez utiliser la Trousse de Soins en une Action bonus (soigne 1d6+4 PV). Toute personne que vous soignez avec regagne des PV supplémentaires selon ses Dés de Vie."
    },
    "initie_magie": {
        name: "Initié à la magie", type: "Origine", prereq: "Niv 1+", asi: "Aucune",
        desc: "Choisissez une liste (Clerc, Druide, Magicien). 2 sorts mineurs et 1 sort niv.1 (lancable 1/Rep.Long sans emplacement). Carac : Int, Sag, ou Cha."
    },
    "musicien": {
        name: "Musicien", type: "Origine", prereq: "Niv 1+", asi: "Aucune",
        desc: "Maîtrise de 3 instruments. Fin d'un Repos Court ou Long : Inspiration Héroïque à vous et des alliés (nbre = bonus maîtrise)."
    },
    "porteur_fardeaux": {
        name: "Porteur de fardeaux", type: "Origine", prereq: "Niv 1+", asi: "Aucune",
        desc: "Votre vitesse n'est pas réduite par une armure lourde. Votre capacité de transport est doublée."
    },

    // =========================================================================
    // DONS GENERAUX
    // =========================================================================
    "adepte_elementaire": {
        name: "Adepte élémentaire", type: "Général", prereq: "Niv 4+", asi: "+1 Int, Sag ou Cha",
        desc: "Acide, Froid, Feu, Foudre ou Tonnerre. Vos sorts ignorent la résistance au type choisi. Un 1 aux dégâts = 2."
    },
    "ambidextre": {
        name: "Ambidextre", type: "Général", prereq: "For ou Dex 13", asi: "+1 For ou Dex",
        desc: "Combat à Deux Armes même si pas Légères. +1 à la CA si deux armes de CàC."
    },
    "athlete": {
        name: "Athlète", type: "Général", prereq: "For ou Dex 13", asi: "+1 For ou Dex",
        desc: "Avantage for/dex pour échapper Agrippé. Se relever coûte 1,5m. Escalade sans malus."
    },
    "chargeur": {
        name: "Chargeur", type: "Général", prereq: "For ou Dex 13", asi: "+1 For ou Dex",
        desc: "Mouvement de 3m avant attaque: +1d8 dégâts (1/tour) et peut pousser cible de 3m."
    },
    "chef_motivateur": {
        name: "Chef motivateur", type: "Général", prereq: "Cha 13", asi: "+1 Sag ou Cha",
        desc: "Après 10min/Repos, PV Temp (Niveau + Mod Cha) à 6 créatures max. (1/Repos long par cible)."
    },
    "cogneur_lourd": {
        name: "Cogneur lourd", type: "Général", prereq: "For ou Dex 13", asi: "+1 For ou Dex",
        desc: "Arme Lourde : dégâts de 1 et 2 relancés. Mort/Crit = Attaque suppl. en Action Bonus."
    },
    "cuirasse": {
        name: "Cuirassé", type: "Général", prereq: "Maîtrise armures lourdes", asi: "+1 For ou Con",
        desc: "Réduit les dégâts tranchant/perforant/contondant non magiques de 3 avec une armure lourde."
    },
    "expert_arbaletrier": {
        name: "Expert arbalétrier", type: "Général", prereq: "Dex 13", asi: "+1 Dex",
        desc: "Ignore Chargement. Pas de désavantage en CàC. Attaque arbalète de poing en Action bonus."
    },
    "expert_armure": {
        name: "Expert en armure", type: "Général", prereq: "Niv 4+", asi: "+1 For, Dex ou Con",
        desc: "Maîtrise de la catégorie d'armure supérieure (Rien -> Légère -> Intermédiaire -> Lourde)."
    },
    "mage_de_guerre": {
        name: "Mage de guerre", type: "Général", prereq: "Lanceur de sorts", asi: "+1 Int, Sag ou Cha",
        desc: "Avantage aux JdS Constitution pour Concentration. Somatique OK avec armes/boucliers."
    },
    "mage_tueur": {
        name: "Mage tueur", type: "Général", prereq: "For ou Dex 13", asi: "+1 For ou Dex",
        desc: "Avantage JdS mentaux contre magie. Réaction : attaque si qqun lance sort à 1,5m. 1/Repos Long = auto-réussite d'un Jet mental."
    },
    "maitre_boucliers": {
        name: "Maître des boucliers", type: "Général", prereq: "For 13", asi: "+1 For",
        desc: "Action princ. = Bousculer (Bash) avec bouclier. Pour JdS Dex de zone, bouclier = couverture +2."
    },
    "resilient": {
        name: "Résilient", type: "Général", prereq: "Niv 4+", asi: "+1 (Carac choisie)",
        desc: "Choisissez une caractéristique. +1, et Maîtrise des jets de sauvegarde de la carac."
    },
    "sentinelle": {
        name: "Sentinelle", type: "Général", prereq: "For ou Dex 13", asi: "+1 For ou Dex",
        desc: "Attaques d'opportunité ignorent le mode Désengagement et réduisent vitesse à 0. Réaction si on tape pote à côté."
    },
    "tireur_elite": {
        name: "Tireur d'élite", type: "Général", prereq: "Dex 13", asi: "+1 Dex",
        desc: "Armes à distance ignorent Abri partiel/important. Portée longue sans malus. Pas de désavantage en CaC avec arc longue."
    },

    // =========================================================================
    // DONS EPIQUES
    // =========================================================================
    "aura_irresistible": {
        name: "Aura irrésistible", type: "Épique", prereq: "Niv 19+", asi: "Aucune",
        desc: "Vos alliés (et vous) occasionnellement dans les 9m = Avantage Charisme, ou Résolution charme."
    },
    "guerrier_inegale": {
        name: "Guerrier inégalé", type: "Épique", prereq: "Niv 19+", asi: "+1 For ou Dex",
        desc: "Raté critique = touche normale (1/combat). Critiques armes ignorent les résistances aux dégâts."
    },
    "robustesse_indomp": {
        name: "Robustesse indomptable", type: "Épique", prereq: "Niv 19+", asi: "+1 Con",
        desc: "Bonus Massif des Points de vie."
    }
};
