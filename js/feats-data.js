// =============================================================================
// FEATS-DATA.JS - Base de données des Dons D&D 2024
// =============================================================================

const FEATS_DATA = [
    // Dons d'Origine (Niveau 1)
    { name: "Alerte", type: "Origine", prereq: "Niv. 1+" },
    { name: "Artisan", type: "Origine", prereq: "Niv. 1+" },
    { name: "Chançard", type: "Origine", prereq: "Niv. 1+" },
    { name: "Combat à mains nues", type: "Origine", prereq: "Niv. 1+" },
    { name: "Coriace", type: "Origine", prereq: "Niv. 1+" },
    { name: "Guérisseur", type: "Origine", prereq: "Niv. 1+" },
    { name: "Initié à la magie", type: "Origine", prereq: "Niv. 1+" },
    { name: "Musicien", type: "Origine", prereq: "Niv. 1+" },
    { name: "Porteur de fardeaux", type: "Origine", prereq: "Niv. 1+" },

    // Dons Généraux (Niveau 4+)
    { name: "Adepte élémentaire", type: "Général", prereq: "Niv. 4+" },
    { name: "Ambidextre", type: "Général", prereq: "Niv. 4+, Force ou Dex 13+" },
    { name: "Athlète", type: "Général", prereq: "Niv. 4+, Force ou Dex 13+" },
    { name: "Chargeur", type: "Général", prereq: "Niv. 4+, Force ou Dex 13+" },
    { name: "Chef motivateur", type: "Général", prereq: "Niv. 4+, Cha 13+" },
    { name: "Cogneur lourd", type: "Général", prereq: "Niv. 4+, For ou Dex 13+" },
    { name: "Concepteur de poison", type: "Général", prereq: "Niv. 4+" },
    { name: "Cuirassé", type: "Général", prereq: "Niv. 4+, Maîtrise armures lourdes" },
    { name: "Expert arbalétrier", type: "Général", prereq: "Niv. 4+, Dex 13+" },
    { name: "Expert en armure", type: "Général", prereq: "Niv. 4+" },
    { name: "Explosion magique", type: "Général", prereq: "Niv. 4+, Lancement de sorts" },
    { name: "Mage de guerre", type: "Général", prereq: "Niv. 4+, Lancement de sorts" },
    { name: "Mage tueur", type: "Général", prereq: "Niv. 4+, For ou Dex 13+" },
    { name: "Maître des boucliers", type: "Général", prereq: "Niv. 4+, Force 13+" },
    { name: "Maître d'armes", type: "Général", prereq: "Niv. 4+, Maîtrise d'une arme de guerre" },
    { name: "Observateur", type: "Général", prereq: "Niv. 4+, Int ou Sag 13+" },
    { name: "Perspicace", type: "Général", prereq: "Niv. 4+, Int ou Sag 13+" },
    { name: "Polyvalent", type: "Général", prereq: "Niv. 4+" },
    { name: "Résilient", type: "Général", prereq: "Niv. 4+" },
    { name: "Sentinelle", type: "Général", prereq: "Niv. 4+, For ou Dex 13+" },
    { name: "Tireur d'élite", type: "Général", prereq: "Niv. 4+, Dex 13+" },
    { name: "Touche-à-tout", type: "Général", prereq: "Niv. 4+" },

    // Dons Épiques (Niveau 19+)
    { name: "Aura irrésistible", type: "Épique", prereq: "Niv. 19+" },
    { name: "Bénédiction épique", type: "Épique", prereq: "Niv. 19+" },
    { name: "Destinée glorieuse", type: "Épique", prereq: "Niv. 19+" },
    { name: "Guerrier inégalé", type: "Épique", prereq: "Niv. 19+" },
    { name: "Robustesse indomptable", type: "Épique", prereq: "Niv. 19+" },
    { name: "Savoir multidimensionnel", type: "Épique", prereq: "Niv. 19+" }
];
