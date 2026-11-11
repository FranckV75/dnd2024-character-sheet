// =============================================================================
// FEAT-EFFECTS/GENERAL.JS (règles) - Effets des dons, lots 1, 2, 3 et 5
// Vigilant, Robuste, Mage de guerre, armures, Charge, Sentinelle, Musicien, Guérisseur, Mobile,
// Maître d'hast… Chaque fonction reçoit { derived, record, add } et range ses notes (voir featEffects).
// =============================================================================

import { hitDieForClass, parseNumber } from '../character.js';
import { signed, shieldBashDC, toughHitPoints, plainText, armorTrainingNotes, toolNote, hasProperty, isPolearm } from './helpers.js';

export const GENERAL_FEAT_RULES = {
    // Vigilant — PHB 2024 « Alert », p. 200
    vigilant: ({ derived: { pb, initiative, initiativeDetail }, add }) => {
        add('initiative', `Bonus de maîtrise ${signed(pb)} déjà compté dans l'Initiative (${initiativeDetail}).`,
            { value: pb, applied: true });
        add('initiative', "Échange d'Initiative : juste après le jet, vous pouvez échanger votre Initiative avec celle d'un allié consentant (impossible si l'un de vous est Incapable d'agir).");
        add('featSlot', `Initiative calculée : ${initiativeDetail} = ${signed(initiative)}.`,
            { value: pb, applied: true });
    },

    // Robuste — PHB 2024 « Tough », p. 202 : 2 × niveau dès que le don est pris, puis +2 par niveau
    robuste: ({ derived: { level }, add }) => {
        const hp = toughHitPoints(level);
        add('hpMax', `dont +${hp} PV grâce à Robuste (2 × niveau ${level})`, { value: hp, manual: true });
        add('featSlot', `+${hp} PV max (2 × niveau ${level}) : à compter vous-même dans les PV max saisis, la fiche ne les ajoute pas.`,
            { value: hp, manual: true });
    },

    // Mage de guerre — PHB 2024 « War Caster », p. 209
    mage_de_guerre: ({ add }) => {
        add('saves.con', 'Avantage pour maintenir la Concentration.');
        add('spells', "Sort réactif : quand une créature quitte votre allonge et provoque une attaque d'opportunité, vous pouvez à la place lancer sur elle, en Réaction, un sort d'une action qui ne cible qu'elle.");
        add('spells', 'Composantes somatiques possibles même avec des armes ou un bouclier dans les mains.');
        add('featSlot', 'Avantage pour la Concentration noté sur la sauvegarde de Constitution.');
    },

    // Maître des armures lourdes — PHB 2024 « Heavy Armor Master », p. 204
    maitre_des_armures_lourdes: ({ derived: { pb, wornArmor }, add }) => {
        if (wornArmor.heavy) {
            add('armorClass', `Réduction des dégâts contondants, perforants et tranchants des attaques : ${pb}`, { value: pb });
            add('featSlot', `Réduction des dégâts de ${pb} (bonus de maîtrise), notée près de la CA.`, { value: pb });
        } else {
            add('armorClass', 'Réduction des dégâts : seulement en armure lourde (aucune équipée).', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : aucune armure lourde équipée.', { inactive: true });
        }
    },

    // Maître des armures intermédiaires — PHB 2024 « Medium Armor Master » (Porteur agile) :
    // Dex jusqu'à +3 au lieu de +2 en armure intermédiaire si la valeur de Dextérité est de 16 ou plus
    maitre_des_armures_intermediaires: ({ derived: { scores, wornArmor, armorClass }, add }) => {
        // L'armure intermédiaire doit être celle qui compte dans la CA (pas une autre armure équipée)
        const counted = armorClass?.rows
            ? armorClass.rows.some(r => r.status === 'counted' && r.line.category === 'medium')
            : wornArmor.medium;
        if (counted && scores.dex >= 16) {
            add('armorClass', "Porteur agile : Dex jusqu'à +3 au lieu de +2 en armure intermédiaire, déjà compté dans la CA.", { value: 3, applied: true });
            add('featSlot', "Dex jusqu'à +3 en armure intermédiaire : déjà compté dans la CA.", { value: 3, applied: true });
        } else if (counted) {
            add('armorClass', 'Porteur agile : il faut une valeur de Dextérité de 16 ou plus.', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : Dextérité inférieure à 16.', { inactive: true });
        } else if (wornArmor.medium) {
            add('armorClass', "Porteur agile : l'armure intermédiaire équipée ne compte pas dans la CA (une autre armure donne plus).", { inactive: true });
            add('featSlot', "Sans effet pour le moment : l'armure intermédiaire équipée ne compte pas dans la CA.", { inactive: true });
        } else {
            add('armorClass', 'Porteur agile : seulement en armure intermédiaire (aucune équipée).', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : aucune armure intermédiaire équipée.', { inactive: true });
        }
    },

    // Maître des boucliers — PHB 2024 « Shield Master », p. 207 (prérequis : formation aux boucliers).
    // Comme pour la CA (computeArmorClass), un bouclier non maîtrisé est sans effet.
    maitre_des_boucliers: ({ derived, add }) => {
        if (derived.wornArmor.shield && !derived.wornArmor.shieldTrained) {
            add('armorClass', 'Coup de bouclier et Interposition de bouclier : formation aux boucliers non cochée.', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : formation aux boucliers non cochée (le bouclier ne compte pas non plus dans la CA).', { inactive: true });
        } else if (derived.wornArmor.shield) {
            const dc = shieldBashDC(derived);
            add('weapons', `Coup de bouclier : après avoir touché avec une arme de corps à corps une créature à 1,50 m lors de l'action Attaque, frappez-la avec votre bouclier ; sauvegarde de Force DD ${dc}, sinon repoussée de 1,50 m ou À terre (au choix). Une fois par tour.`,
                { value: dc });
            add('saves.dex', "Interposition de bouclier : contre un effet qui permet un jet de Dextérité pour ne subir que la moitié des dégâts, vous pouvez prendre une Réaction pour n'en subir aucun si le jet réussit.");
            add('featSlot', `Coup de bouclier DD ${dc} (8 + For ${signed(derived.mods.str)} + maîtrise ${signed(derived.pb)}) ; Interposition de bouclier notée sur la sauvegarde de Dextérité.`,
                { value: dc });
        } else {
            add('armorClass', 'Coup de bouclier et Interposition de bouclier : il faut un bouclier équipé.', { inactive: true });
            add('featSlot', 'Sans effet pour le moment : aucun bouclier équipé.', { inactive: true });
        }
    },

    // Expert de la charge — PHB 2024 « Charger », p. 202 (« Dash » = action Pointe)
    expert_de_la_charge: ({ add }) => {
        add('weapons', "Charge : après au moins 3 m en ligne droite vers la cible juste avant de la toucher au corps à corps (action Attaque), +1d8 aux dégâts, ou repoussez-la jusqu'à 3 m (taille au plus une de plus que vous). Une fois par tour.",
            { value: '1d8' });
        add('weapons', 'Pointe : votre vitesse augmente de 3 m pour cette action.', { value: 3 });
        add('featSlot', 'Bouton « Charge (+1d8) » dans les armes (corps à corps) ; Pointe : +3 m.', { value: '1d8' });
    },

    // Cogneur lourd — PHB 2024 « Great Weapon Master », p. 204 (le bonus aux dégâts est un bouton existant)
    maitre_des_armes_lourdes_cogneur_lourd: ({ derived: { pb }, add }) => {
        add('weapons', "Abattage : juste après un coup critique avec une arme de corps à corps, ou après avoir réduit une créature à 0 PV avec elle, vous pouvez attaquer une fois avec la même arme en action Bonus.");
        add('featSlot', `Bouton « Cogneur lourd (+${pb}) » dans les armes (armes Lourdes) ; rappel Abattage.`, { value: pb });
    },

    // Sauvagerie martiale — PHB 2024 « Savage Attacker », p. 201
    sauvagerie_martiale: ({ add }) => {
        add('weapons', "Une fois par tour, quand vous touchez avec une arme, lancez deux fois ses dés de dégâts et gardez le résultat de votre choix.");
        add('featSlot', 'Rappel dans les dégâts de chaque arme.');
    },

    // Sentinelle — PHB 2024 « Sentinel », p. 207
    sentinelle: ({ add }) => {
        add('weapons', "Gardien : juste après qu'une créature à 1,50 m de vous se Désengage ou touche une autre cible que vous, vous pouvez lui porter une attaque d'opportunité.");
        add('weapons', "Immobilisation : une créature touchée par votre attaque d'opportunité a une vitesse de 0 jusqu'à la fin du tour.");
        add('featSlot', 'Rappel sur les armes de corps à corps.');
    },

    // Trancheur — PHB 2024 « Slasher », p. 208
    trancheur: ({ add }) => {
        add('weapons', 'Dégâts tranchants : une fois par tour, réduisez la vitesse de la cible de 3 m jusqu\'au début de votre prochain tour. Sur un coup critique, elle a le Désavantage à ses jets d\'attaque jusqu\'au début de votre prochain tour.');
        add('featSlot', 'Rappel sur les armes tranchantes.');
    },

    // Broyeur — PHB 2024 « Crusher », p. 203
    broyeur: ({ add }) => {
        add('weapons', 'Dégâts contondants : une fois par tour, déplacez la cible de 1,50 m vers un espace libre (taille au plus une de plus que vous). Sur un coup critique, les jets d\'attaque contre elle ont l\'Avantage jusqu\'au début de votre prochain tour.');
        add('featSlot', 'Rappel sur les armes contondantes.');
    },

    // Perforateur — PHB 2024 « Piercer », p. 206
    empaleur_perforateur: ({ add }) => {
        add('weapons', 'Dégâts perforants : une fois par tour, relancez un des dés de dégâts de l\'attaque (le nouveau résultat compte). Sur un coup critique, lancez un dé de dégâts de plus.');
        add('featSlot', 'Rappel sur les armes perforantes.');
    },

    // Musicien — PHB 2024 « Musician », p. 201
    musicien: ({ derived: { pb }, add }) => {
        add('rest', `Chant d'encouragement : à la fin du repos, jouez d'un instrument que vous maîtrisez pour donner l'Inspiration héroïque à au plus ${pb} alliés qui vous entendent.`,
            { value: pb });
        add('featSlot', `Rappel à la fin des repos : Inspiration héroïque pour au plus ${pb} alliés.`, { value: pb });
    },

    // Chanceux — PHB 2024 « Lucky », p. 201 : points de Chance = bonus de maîtrise, repos long
    chanceux: ({ derived: { pb }, add }) => {
        add('featSlot', `${pb} points de Chance à cocher (onglet Combat et ci-dessous), récupérés au repos long.`, { value: pb });
    },

    // Tueur de mages — PHB 2024 « Mage Slayer », p. 205 (l'augmentation de caractéristique reste saisie à la main)
    tueur_de_mages: ({ add }) => {
        add('featSlot', 'Esprit préservé : 1 case à cocher (onglet Combat et ci-dessous), de nouveau disponible au repos court ou long.', { value: 1 });
        // Vaut pour tous les dégâts (armes et sorts) : rappel ici, pas sur une ligne d'arme
        add('featSlot', 'Briseur de concentration : une créature en concentration à qui vous infligez des dégâts (arme ou sort) a le Désavantage à sa sauvegarde pour maintenir sa Concentration.');
    },

    // Guérisseur — PHB 2024 « Healer », p. 201 (« Battle Medic » : Médecin de combat)
    guerisseur: ({ derived: { pb }, add }) => {
        add('healing', `Médecin de combat : en dépensant une utilisation d'une trousse de soins (action Utilisation), une créature à 1,50 m dépense un de ses dés de vie ; vous le lancez et elle récupère le résultat ${signed(pb)} PV.`,
            { value: pb });
        add('healing', 'Retirage des soins : sur un dé de soins (sort ou Médecin de combat), relancez un 1 et gardez le nouveau résultat.');
        add('featSlot', `Médecin de combat : dé de vie de la cible ${signed(pb)} ; relancer les 1.`, { value: pb });
    },

    // ---- Lot 5 (règles vérifiées dans le PHB 2024 anglais ; le +1 : js/rules/feat-choices.js) ----

    // Mobile — PHB 2024 « Speedy », p. 208 : Vitesse +3 m (la vitesse saisie n'est pas modifiée)
    mobile: ({ add }) => {
        add('speed', "+3 m grâce à Mobile. La Vitesse saisie n'est pas modifiée : ajoutez-les vous-même s'ils n'y sont pas déjà.",
            { value: 3, manual: true });
        add('featSlot', 'Vitesse +3 m : à reporter vous-même dans la Vitesse saisie (repère à côté).', { value: 3, manual: true });
        add('featSlot', "Pointe : quand vous prenez l'action Pointe, le terrain difficile ne vous coûte pas de mouvement en plus jusqu'à la fin du tour.");
        add('featSlot', "Les attaques d'opportunité contre vous ont le Désavantage.");
    },

    // Incantateur d'élite — PHB 2024 « Spell Sniper », p. 208
    incantateur_d_elite: ({ add }) => {
        add('featSlot', "Portée : un sort à jet d'attaque dont la portée est d'au moins 3 m peut porter 18 m plus loin (au choix).");
        add('featSlot', "Vos jets d'attaque de sort ignorent les Abris partiels (+2 CA) et supérieurs (+5 CA), pas l'abri total.");
        add('featSlot', "Pas de Désavantage à vos jets d'attaque de sort quand un ennemi se trouve à 1,50 m de vous.");
    },

    protection_legere: (ctx) => armorTrainingNotes(['light', 'shield'], '', ctx),
    protection_intermediaire: (ctx) => {
        armorTrainingNotes(['medium'], 'light', ctx);
        ctx.add('featSlot', 'Ce don ne donne pas la formation aux boucliers (règles 2024).');
    },
    protection_lourde: (ctx) => {
        armorTrainingNotes(['heavy'], 'medium', ctx);
        ctx.add('featSlot', "La formation ne retire ni la Force demandée par l'armure (sinon −3 m de vitesse) ni le Désavantage en Discrétion.");
    },

    // Duelliste défensif — PHB 2024 « Defensive Duelist », p. 203 : Parade (Réaction)
    duelliste_defensif: ({ derived: { pb, scores, armorClass }, record, add }) => {
        const ac = armorClass.value;
        const text = `Parade (Réaction, arme de Finesse en main) : quand une attaque au corps à corps vous touche, +${pb} à la CA (${ac} → ${ac + pb}) contre les attaques au corps à corps jusqu'au début de votre prochain tour ; l'attaque peut alors rater.`;
        add('armorClass', text, { value: pb });
        add('featSlot', text, { value: pb });
        const weapons = Array.isArray(record.dynamic_weapons) ? record.dynamic_weapons : [];
        if (!weapons.some(weapon => hasProperty(weapon, 'finesse'))) {
            add('featSlot', 'Aucune arme de Finesse dans le tableau des armes (Dague, Rapière, Cimeterre, Épée courte, Fouet, Fléchette).', { inactive: true });
        }
        if (scores.dex < 13) add('featSlot', `Prérequis : Dextérité 13 ou plus (valeur saisie : ${scores.dex}).`, { check: true });
    },

    // Gaillard — PHB 2024 « Durable », p. 203
    gaillard: ({ derived: { level, className }, record, add }) => {
        add('deathSaves', 'Trompe-la-mort : Avantage aux jets de sauvegarde contre la mort (deux d20, gardez le meilleur).');
        add('featSlot', 'Trompe-la-mort : Avantage aux jets de sauvegarde contre la mort (repère près des cases).');
        const used = Math.min(level, Math.max(0, parseNumber(record.hd_current, 0)));
        const die = plainText(record.hd_type).trim() || hitDieForClass(className);
        const available = level - used;
        add('featSlot', `Récupération rapide (action Bonus) : dépensez un dé de vie${die ? ` (${die})` : ''} et regagnez autant de PV que le résultat, sans le modificateur de Constitution. Dés de vie restants : ${available} sur ${level} (à décompter vous-même).`,
            available > 0 ? { value: available } : { inactive: true });
    },

    // Chef cuisinier — PHB 2024 « Chef », p. 202
    chef_cuisinier: ({ derived: { pb }, record, add }) => {
        add('rest', `Repas reconstituant (repos court) : jusqu'à ${4 + pb} créatures qui mangent et dépensent au moins un dé de vie regagnent 1d8 PV de plus.`,
            { value: 4 + pb, restKind: 'short' });
        add('featSlot', `Repas reconstituant : à la fin d'un repos court, jusqu'à ${4 + pb} créatures qui dépensent un dé de vie regagnent 1d8 PV de plus (rappel dans la fenêtre du repos).`, { value: 4 + pb });
        add('featSlot', `${pb} friandises à cocher (onglet Combat et ci-dessous), refaites au repos long : action Bonus pour en manger une, ${pb} PV temporaires ; elles se gâtent après 8 heures.`, { value: pb });
        toolNote(record, /cuisin/, 'Ustensiles de cuisinier', add);
    },

    // Maître d'hast — PHB 2024 « Polearm Master », p. 206 (attaques calculées sur chaque arme d'hast)
    maitre_d_hast: ({ record, add }) => {
        add('featSlot', "Armes : Bâton, Lance, et les armes Lourdes à Allonge (Coutille, Hallebarde, Lance d'arçon, Pique). Frappe double et Frappe réactive calculées sur ces armes, dans le tableau des armes.");
        const weapons = Array.isArray(record.dynamic_weapons) ? record.dynamic_weapons : [];
        if (!weapons.some(isPolearm)) add('featSlot', "Aucune de ces armes dans le tableau des armes.", { inactive: true });
    }
};
