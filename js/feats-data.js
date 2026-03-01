// =============================================================================
// FEATS-DATA.JS - Base de données exhaustive des Dons D&D 2024
// Généré automatiquement depuis AideDD
// =============================================================================

const FEATS_DATA = {
    "adepte_elementaire": {
        "name": "Adepte élémentaire",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, capacité Sorts ou Magie de pacte",
        "asi": "+1 Int ou Sag ou Cha",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Intelligence, Sagesse ou Charisme de 1, jusqu'à un maximum de 20. <br><strong>Maîtrise des énergies</strong>. Choisissez l'un des types de dégâts suivants : Acide, Froid, Feu, Foudre ou Tonnerre. Les sorts que vous lancez ignorent la Résistance aux dégâts du type choisi. De plus, lorsque vous lancez des dégâts pour un sort que vous lancez et qui inflige des dégâts de ce type, vous pouvez considérer n'importe quel 1 sur un dé de dégâts comme un 2. <br><strong>Répétable</strong>. Vous pouvez utiliser ce don plusieurs fois, mais vous devez choisir un type de dégâts différent à chaque fois pour Maîtrise de l'énergie."
    },
    "affinite_feerique": {
        "name": "Affinité féerique",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 Int ou Sag ou Cha",
        "desc": "Votre exposition à la magie de la Féerie vous confère les avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Intelligence, Sagesse ou Charisme de 1, jusqu'à un maximum de 20. <br><strong>Magie des fées</strong>. Choisissez un sort de niveau 1 de l'école de magie de Divination ou d'Enchantement. Vous avez toujours ce sort et le sort <em><a href=\"https://www.aidedd.org/spell/fr/foulee-brumeuse\">foulée brumeuse</a></em> préparés. Vous pouvez lancer chacun de ces sorts sans dépenser d'emplacement de sort. Une fois l'un des sorts lancé de cette manière, vous ne pouvez plus le lancer de cette manière avant d'avoir terminé un Repos long. Vous pouvez également lancer ces sorts en utilisant des emplacements de sorts que vous possédez du niveau approprié. La caractéristique d'incantation de ces sorts est celle augmentée par ce don."
    },
    "affinite_ombreuse": {
        "name": "Affinité ombreuse",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 Int ou Sag ou Cha",
        "desc": "Votre exposition à la magie de la Gisombre vous confère les avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Intelligence, Sagesse ou Charisme de 1, jusqu'à un maximum de 20. <br><strong>Magie de l'Ombre</strong>. Choisissez un sort de niveau 1 de l'école de magie d'Illusion ou de Nécromancie. Vous avez toujours ce sort et le sort <em><a href=\"https://www.aidedd.org/spell/fr/invisibilite\">invisibilité</a></em> préparés. Vous pouvez lancer chacun de ces sorts sans dépenser d'emplacement de sort. Une fois l'un des sorts lancé de cette manière, vous ne pouvez plus le lancer de cette manière avant d'avoir terminé un Repos long. Vous pouvez également lancer ces sorts en utilisant des emplacements de sorts que vous possédez du niveau approprié. La caractéristique d'incantation de ces sorts est celle augmentée par ce don."
    },
    "amelioration_de_caracteristique": {
        "name": "Amélioration de caractéristique",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "Aucune",
        "desc": "Augmentez une valeur de caractéristique de votre choix de 2, ou augmentez deux valeurs de caractéristique de votre choix de 1. <br>Ce don ne peut pas augmenter une valeur de caractéristique au-delà de 20. <br><strong>Répétable</strong>. Vous pouvez prendre ce don plusieurs fois."
    },
    "archerie": {
        "name": "Archerie",
        "type": "Général",
        "prereq": "capacité Style de combat",
        "asi": "Aucune",
        "desc": "Vous obtenez un bonus de +2 aux jets d'attaque effectués avec des armes à distance."
    },
    "arme_a_deux_mains": {
        "name": "Arme à deux mains",
        "type": "Général",
        "prereq": "capacité Style de combat",
        "asi": "Aucune",
        "desc": "Lorsque vous lancez les dégâts pour une attaque effectuée avec une arme de corps à corps tenue à deux mains, vous pouvez considérer n'importe quel 1 ou 2 sur un dé de dégâts comme un 3. L'arme doit posséder la propriété Deux mains ou Polyvalente pour obtenir cet avantage."
    },
    "arme_de_lancer": {
        "name": "Arme de lancer",
        "type": "Général",
        "prereq": "capacité Style de combat",
        "asi": "Aucune",
        "desc": "Lorsque vous touchez lors d'un jet d'attaque à distance avec une arme dotée de la propriété Lancer, vous obtenez un bonus de +2 aux dégâts."
    },
    "athlete": {
        "name": "Athlète",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Force ou Dextérité 13 ou plus",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Vitesse d'escalade</strong>. Vous gagnez une Vitesse d'escalade égale à votre Vitesse. <br><strong>Rétablissement</strong>. Lorsque vous êtes en À terre, vous pouvez vous redresser avec seulement 1,50 mètre de mouvement. <br><strong>Saut</strong>. Vous pouvez effectuer un saut en longueur ou en hauteur après avoir parcouru seulement 1,50 mètre."
    },
    "bagarreur_de_tavernes": {
        "name": "Bagarreur de tavernes",
        "type": "Origine",
        "prereq": "Niv 1+",
        "asi": "Aucune",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Frappe à mains nues améliorée</strong>. Lorsque vous touchez avec votre Frappe à mains nues et infligez des dégâts, vous pouvez infliger des dégâts contondants égaux à 1d4 plus votre modificateur de Force au lieu des dégâts normaux d'une Frappe à mains nues. <br><strong>Relancer des dégâts</strong>. Chaque fois que vous lancez un dé de dégâts pour votre Frappe à mains nues, vous pouvez relancer le dé si vous avez obtenu un 1, et devez utiliser le nouveau résultat. <br><strong>Armement improvisé</strong>. Vous maîtrisez les armes improvisées. <br><strong>Bourrade</strong>. Lorsque vous touchez une créature avec une Frappe à mains nues lors d'une action Attaque à votre tour, vous pouvez infliger des dégâts à la cible et la repousser à 1,50 m de vous. Vous ne pouvez utiliser cet avantage qu'une seule fois par tour."
    },
    "broyeur": {
        "name": "Broyeur",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 For ou Con",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Constitution de 1, jusqu'à un maximum de 20. <br><strong>Bourrade</strong>. Une fois par tour, lorsque vous touchez une créature avec une attaque infligeant des dégâts contondants, vous pouvez la déplacer de 1,50 mètre vers une case libre si la cible ne fait pas plus d'une taille de plus que vous. <br><strong>Critique renforcé</strong>. Lorsque vous réussissez un Coup critique infligeant des dégâts contondants à une créature, les jets d'attaque contre cette créature bénéficient d'un Avantage jusqu'au début de votre prochain tour."
    },
    "chanceux": {
        "name": "Chanceux",
        "type": "Origine",
        "prereq": "Niv 1+",
        "asi": "Aucune",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Points de chance</strong>. Vous disposez d'un nombre de points de Chance égal à votre bonus de maîtrise et pouvez les dépenser pour les avantages ci-dessous. Vous récupérez vos points de Chance dépensés à la fin d'un Repos long. <br><strong>Avantage</strong>. Lorsque vous lancez un d20 pour un test de D20, vous pouvez dépenser 1 point de Chance pour vous donner un Avantage. <br><strong>Désavantage</strong>. Lorsqu'une créature lance un d20 pour un jet d'attaque contre vous, vous pouvez dépenser 1 point de Chance pour lui imposer un Désavantage."
    },
    "chef_cuisinier": {
        "name": "Chef cuisinier",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 Con ou Sag",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Constitution ou Sagesse de 1, jusqu'à un maximum de 20. <br><strong>Ustensiles de cuisinier</strong>. Vous maîtrisez les ustensiles de cuisinier si vous ne les maîtrisez pas déjà. <br><strong>Repas reconstituant</strong>. Lors d'un Repos court, vous pouvez cuisiner des plats spéciaux si vous avez des ingrédients et des ustensiles de cuisinier sous la main. Vous pouvez préparer suffisamment de nourriture pour un nombre de créatures égal à 4 plus votre bonus de maîtrise. À la fin du Repos court, toute créature qui mange ces plats et dépense un ou plusieurs DV pour regagner des points de vie regagne 1d8 points de vie supplémentaires. <br><strong>Friandises galvanisantes</strong>. Après 1 heure de travail ou lorsque vous terminez un Repos long, vous pouvez cuisiner un nombre de friandises égal à votre bonus de maîtrise si vous avez des ingrédients et des ustensiles de cuisinier sous la main. Ces friandises spéciales se gardent 8 heures après leur préparation. Une créature peut utiliser une action Bonus pour en manger une et gagner un nombre de points de vie temporaires égal à votre bonus de maîtrise."
    },
    "combat_a_deux_armes": {
        "name": "Combat à deux armes",
        "type": "Général",
        "prereq": "capacité Style de combat",
        "asi": "Aucune",
        "desc": "Lorsque vous effectuez une attaque supplémentaire grâce à une arme dotée de la propriété Légère, vous pouvez ajouter votre modificateur de caractéristique aux dégâts de cette attaque si vous ne l'ajoutez pas déjà."
    },
    "combat_a_mains_nues": {
        "name": "Combat à mains nues",
        "type": "Général",
        "prereq": "capacité Style de combat",
        "asi": "Aucune",
        "desc": "Lorsque vous touchez avec votre Frappe à mains nues et infligez des dégâts, vous pouvez infliger des dégâts contondants égaux à 1d6 plus votre modificateur de Force au lieu des dégâts normaux d'une Frappe à mains nues. Si vous ne tenez ni arme ni bouclier lors du jet d'attaque, le d6 devient un d8. <br>Au début de chacun de vos tours, vous pouvez infliger 1d4 dégâts contondants à une créature que vous agrippez."
    },
    "combat_en_aveugle": {
        "name": "Combat en aveugle",
        "type": "Général",
        "prereq": "capacité Style de combat",
        "asi": "Aucune",
        "desc": "Vous possédez Vision aveugle avec une portée de 3 mètres."
    },
    "combattant_a_deux_armes": {
        "name": "Combattant à deux armes",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Force ou Dextérité 13 ou plus",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Combat à deux armes amélioré</strong>. Lorsque vous prenez l'action Attaque pendant votre tour et attaquez avec une arme qui possède la propriété Légère, vous pouvez effectuer une attaque supplémentaire en tant qu'action Bonus plus tard au cours du même tour avec une arme différente, qui doit être une arme de corps à corps sans la propriété Deux mains. Vous n'ajoutez pas votre modificateur de caractéristique aux dégâts de l'attaque supplémentaire, sauf si ce modificateur est négatif. <br><strong>Dégainage rapide</strong>. Vous pouvez dégainer ou ranger deux armes sans la propriété Deux mains alors que vous ne pourriez normalement n'en dégainer ou ranger qu'une seule."
    },
    "combattant_monte": {
        "name": "Combattant monté",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 For ou Sag",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristiques</strong>. Augmentez votre Force, Dextérité ou Sagesse de 1, jusqu'à un maximum de 20. <br><strong>Frappe montée</strong>. Lorsque vous êtes sur une monture, vous bénéficiez d'un Avantage aux jets d'attaque contre toute créature non montée dans un rayon de 1,50 m autour de votre monture et dont la taille est inférieure d'au moins une taille à celle de votre monture. <br><strong>Pas de côté</strong>. Si votre monture est soumise à un effet qui lui permet d'effectuer un jet de sauvegarde de Dextérité pour ne subir que la moitié des dégâts, elle ne subit aucun dégât en cas de réussite au jet de sauvegarde et seulement la moitié en cas d'échec. Pour que votre monture bénéficie de cet avantage, vous devez la monter et aucun de vous deux ne doit être Incapable d'agir. <br><strong>Déviation</strong>. Lorsque vous êtes sur une monture, vous pouvez forcer une attaque qui touche votre monture à vous toucher à la place si vous n'êtes pas Incapable d'agir."
    },
    "comedien": {
        "name": "Comédien",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Charisme 13 ou plus",
        "asi": "+1 Cha",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Charisme de 1, jusqu'à un maximum de 20. <br><strong>Imposture</strong>. Lorsque vous êtes déguisé en une personne, qu'elle soit réelle ou fictive, vous avez un Avantage aux jets de Charisme (Tromperie ou Représentation) pour convaincre les autres que vous êtes bien cette personne. <br><strong>Imitation</strong>. Vous pouvez imiter les bruits d'autres créatures, y compris la parole. Une créature qui entend ce mimétisme doit réussir un jet de Sagesse (Intuition) pour se rendre compte qu'il s'agit d'une imitation (DD 8 plus votre modificateur de Charisme et votre bonus de maîtrise)."
    },
    "defense": {
        "name": "Défense",
        "type": "Général",
        "prereq": "capacité Style de combat",
        "asi": "Aucune",
        "desc": "Lorsque vous portez une armure légère, intermédiaire ou lourde, vous obtenez un bonus de +1 à la Classe d'Armure."
    },
    "discret": {
        "name": "Discret",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Dextérité 13 ou plus",
        "asi": "Aucune",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Vision aveugle</strong>. Vous obtenez de Vision aveugle avec une portée de 3 mètres. <br><strong>Brouillard de guerre</strong>. Vous exploitez les distractions du combat et obtenez un Avantage à chaque jet de Dextérité (Discrétion) effectué lors de l'action Furtivité pendant le combat. <br><strong>Tireur discret</strong>. Si vous effectuez un jet d'attaque caché et que celui-ci échoue, votre position n'est pas révélée."
    },
    "doue": {
        "name": "Doué",
        "type": "Origine",
        "prereq": "Niv 1+",
        "asi": "Aucune",
        "desc": "Vous maîtrisez n'importe quelle combinaison de trois compétences ou outils de votre choix. <br><strong>Répétable</strong>. Vous pouvez prendre ce don plusieurs fois."
    },
    "duel": {
        "name": "Duel",
        "type": "Général",
        "prereq": "capacité Style de combat",
        "asi": "Aucune",
        "desc": "Lorsque vous tenez une arme de corps à corps dans une main et aucune autre arme, vous obtenez un bonus de +2 aux dégâts infligés avec cette arme."
    },
    "duelliste_defensif": {
        "name": "Duelliste défensif",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Dextérité 13 ou plus",
        "asi": "Aucune",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Parade</strong>. Si vous tenez une arme de Finesse et qu'une autre créature vous touche au corps à corps, vous pouvez prendre une Réaction pour ajouter votre bonus de maîtrise à votre Classe d'Armure, ce qui peut faire en sorte que l'attaque vous rate. Vous bénéficiez de ce bonus à votre CA contre les attaques au corps à corps jusqu'au début de votre prochain tour."
    },
    "empaleur_perforateur": {
        "name": "Empaleur|Perforateur",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Perforation</strong>. Une fois par tour, lorsque vous touchez une créature avec une attaque infligeant des dégâts perforants, vous pouvez relancer l'un des dés de dégâts de l'attaque et vous devez utiliser le nouveau jet. <br><strong>Critique renforcé</strong>. Lorsque vous réussissez un Coup critique infligeant des dégâts perforants à une créature, vous pouvez lancer un dé de dégâts supplémentaire pour déterminer les dégâts perforants supplémentaires subis par la cible."
    },
    "empoigneur": {
        "name": "Empoigneur",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Force ou Dextérité 13 ou plus",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Frappe et empoignade</strong>. Lorsque vous touchez une créature avec une Frappe à mains nues lors de votre action Attaque pendant votre tour, vous pouvez utiliser à la fois les options Dégâts et Lutte. Vous ne pouvez utiliser cet avantage qu'une fois par tour. <br><strong>Attaque avec Avantage</strong>. Vous bénéficiez d'un Avantage aux jets d'attaque contre une créature que vous agrippez. <br><strong>Lutteur rapide</strong>. Vous n'avez pas besoin de dépenser un mouvement supplémentaire pour déplacer une créature que vous agrippez si celle-ci est de votre taille ou plus petite."
    },
    "empoisonneur": {
        "name": "Empoisonneur",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 Int",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Dextérité ou Intelligence de 1, jusqu'à un maximum de 20. <br><strong>Poison virulent</strong>. Lorsque vous effectuez un jet de dégâts infligeant des dégâts de poison, ignorez la Résistance aux dégâts de poison. <br><strong>Préparation de poison</strong>. Vous maîtrisez le kit d'empoisonneur. En 1 heure de travail avec ce kit et en dépensant 50 po de matériaux, vous pouvez créer un nombre de doses de poison égal à votre bonus de maîtrise. Par une action Bonus, vous pouvez appliquer une dose de poison sur une arme ou une munition. Une fois appliqué, le poison conserve son efficacité pendant 1 minute ou jusqu'à ce que vous infligiez des dégâts avec l'objet empoisonné, selon la durée la plus courte. Lorsqu'une créature subit des dégâts de l'objet empoisonné, elle doit réussir un jet de sauvegarde de Constitution (DD 8 plus le modificateur de la caractéristique augmentée par ce don et votre bonus de maîtrise) ou subir 2d8 dégâts de poison et avoir l'état Empoisonné jusqu'à la fin de votre prochain tour."
    },
    "esprit_affute": {
        "name": "Esprit affûté",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Intelligence 13 ou plus",
        "asi": "+1 Int",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Intelligence de 1, jusqu'à un maximum de 20. <br><strong>Érudition</strong>. Choisissez l'une des compétences suivantes : Arcanes, Histoire, Investigation, Nature ou Religion. Si vous ne maîtrisez pas la compétence choisie, vous la maîtrisez ; si vous la maîtrisez déjà, vous gagnez Expertise pour celle-ci. <br><strong>Étude rapide</strong>. Vous pouvez prendre l'action Étude en tant qu'action Bonus."
    },
    "expert": {
        "name": "Expert",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "Aucune",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez une valeur caractéristique de votre choix de 1, jusqu'à un maximum de 20. <br><strong>Maîtrise de compétence</strong>. Vous maîtrisez une compétence de votre choix. <br><strong>Expertise</strong>. Choisissez une compétence que vous maîtrisez, mais pour laquelle vous n'avez pas Expertise. Vous gagnez Expertise dans cette compétence."
    },
    "expert_de_la_charge": {
        "name": "Expert de la charge",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Force ou Dextérité 13 ou plus",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Pointe améliorée</strong>. Lorsque vous prenez l'action Pointe, votre vitesse augmente de 3 mètres pour cette action. <br><strong>Attaque de charge</strong>. Si vous vous déplacez d'au moins 3 mètres en ligne droite vers une cible juste avant de la toucher avec un jet d'attaque au corps à corps dans le cadre de l'action Attaque, choisissez l'un des effets suivants : vous obtenez un bonus de 1d8 aux dégâts de l'attaque, ou vous repoussez la cible jusqu'à 3 mètres si elle ne fait pas plus d'une taille de plus que vous. Vous ne pouvez utiliser cet avantage qu'une seule fois par tour."
    },
    "faconneur": {
        "name": "Façonneur",
        "type": "Origine",
        "prereq": "Niv 1+",
        "asi": "Aucune",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Maîtrise d'outils</strong>. Vous maîtrisez trois outils d'artisan différents de votre choix de la table Fabrication rapide. <br><strong>Ristourne</strong>. Chaque fois que vous achetez un objet non magique, vous bénéficiez d'une réduction de 20 %. <br><strong>Façonnage rapide</strong>. À la fin d'un Repos long, vous pouvez fabriquer une pièce d'équipement de la table Fabrication rapide, à condition de posséder les outils d'artisan associés et de maîtriser ces outils. L'objet dure jusqu'à ce que vous finissiez un autre Repos long, après quoi il se désagrège. <br><table><tr><th>Outils d'artisan</th><th>Équipement fabriqué</th></tr><tr><td>Outils de bricoleur</td><td>Boîte à amadou, cloche, pelle</td></tr><tr><td>Outils de charpentier</td><td>Échelle, torche</td></tr><tr><td>Outils de forgeron</td><td>Billes, chausse-trappes, grappin, pot en fer, seau</td></tr><tr><td>Outils de maçon</td><td>Palan</td></tr><tr><td>Outils de menuisier</td><td>Gourdin, masse, bâton de combat</td></tr><tr><td>Outils de potier</td><td>Cruche, lampe</td></tr><tr><td>Outils de tanneur</td><td>Étui, sacoche</td></tr><tr><td>Outils de tisserand</td><td>Corde, filet, panier, tente</td></tr></table>"
    },
    "faveur_d_attaque_irresistible": {
        "name": "Faveur d'attaque irrésistible",
        "type": "Épique",
        "prereq": "niveau 19 ou supérieur",
        "asi": "Aucune",
        "desc": ""
    },
    "faveur_de_competence": {
        "name": "Faveur de compétence",
        "type": "Épique",
        "prereq": "niveau 19 ou supérieur",
        "asi": "Aucune",
        "desc": ""
    },
    "faveur_de_deplacement_dimensionnel": {
        "name": "Faveur de déplacement dimensionnel",
        "type": "Épique",
        "prereq": "niveau 19 ou supérieur",
        "asi": "Aucune",
        "desc": ""
    },
    "faveur_de_l_esprit_nocturne": {
        "name": "Faveur de l'esprit nocturne",
        "type": "Épique",
        "prereq": "niveau 19 ou supérieur",
        "asi": "Aucune",
        "desc": ""
    },
    "faveur_de_memoire_magique": {
        "name": "Faveur de mémoire magique",
        "type": "Épique",
        "prereq": "niveau 19 ou supérieur, capacité Sorts",
        "asi": "Aucune",
        "desc": ""
    },
    "faveur_de_prouesse_martiale": {
        "name": "Faveur de prouesse martiale",
        "type": "Épique",
        "prereq": "niveau 19 ou supérieur",
        "asi": "Aucune",
        "desc": ""
    },
    "faveur_de_recuperation": {
        "name": "Faveur de récupération",
        "type": "Épique",
        "prereq": "niveau 19 ou supérieur",
        "asi": "Aucune",
        "desc": ""
    },
    "faveur_de_resistance_aux_energies": {
        "name": "Faveur de résistance aux énergies",
        "type": "Épique",
        "prereq": "niveau 19 ou supérieur",
        "asi": "Aucune",
        "desc": ""
    },
    "faveur_de_vigueur": {
        "name": "Faveur de vigueur",
        "type": "Épique",
        "prereq": "niveau 19 ou supérieur",
        "asi": "Aucune",
        "desc": ""
    },
    "faveur_de_vision_veritable_vision_lucide": {
        "name": "Faveur de vision véritable|vision lucide",
        "type": "Épique",
        "prereq": "niveau 19 ou supérieur",
        "asi": "Aucune",
        "desc": ""
    },
    "faveur_de_vitesse": {
        "name": "Faveur de vitesse",
        "type": "Épique",
        "prereq": "niveau 19 ou supérieur",
        "asi": "Aucune",
        "desc": ""
    },
    "faveur_du_destin": {
        "name": "Faveur du destin",
        "type": "Épique",
        "prereq": "niveau 19 ou supérieur",
        "asi": "Aucune",
        "desc": ""
    },
    "figure_de_proue": {
        "name": "Figure de proue",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Sagesse ou Charisme 13 ou plus",
        "asi": "+1 Sag ou Cha",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Sagesse ou Charisme de 1, jusqu'à un maximum de 20. <br><strong>Représentation galvanisante</strong>. Lorsque vous terminez un Repos court ou long, vous pouvez donner une représentation inspirante : un discours, un chant ou une danse. Dans ce cas, choisissez jusqu'à six alliés (vous pouvez vous choisir) dans un rayon de 9 mètres qui assistent à la représentation. Les créatures choisies gagnent chacune des points de vie temporaires égaux à votre niveau de personnage plus le modificateur de la caractéristique augmentée par ce don."
    },
    "formation_aux_armes_de_guerre": {
        "name": "Formation aux armes de guerre",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Maîtrise des armes</strong>. Vous maîtrisez les armes de guerre."
    },
    "gaillard": {
        "name": "Gaillard",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 Con",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Constitution de 1, jusqu'à un maximum de 20. <br><strong>Trompe-la-mort</strong>. Vous bénéficiez d'un Avantage aux jets de sauvegarde contre la mort. <br><strong>Récupération rapide</strong>. Par une action Bonus, vous pouvez dépenser un de vos Dés de vie, lancer le dé et regagner un nombre de points de vie égal au résultat."
    },
    "guerisseur": {
        "name": "Guérisseur",
        "type": "Origine",
        "prereq": "Niv 1+",
        "asi": "Aucune",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Soigneur de bataille</strong>. Si vous possédez une trousse de soins, vous pouvez dépenser une utilisation et soigner une créature à 1,50 m ou moins de vous par une action Utilisation. Cette créature peut dépenser un de ses Dés de vie, puis vous lancez ce dé. La créature récupère un nombre de points de vie égal au résultat du jet plus votre bonus de maîtrise. <br><strong>Retirage des soins</strong>. Chaque fois que vous lancez un dé pour déterminer le nombre de points de vie que vous restaurez avec un sort ou avec l'avantage Médecin de combat de ce don, vous pouvez relancer le dé si vous avez obtenu un 1, et devez utiliser le nouveau résultat."
    },
    "incantateur_d_elite": {
        "name": "Incantateur d'élite",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, capacité Sorts ou Magie de pacte",
        "asi": "+1 Int ou Sag ou Cha",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Intelligence, Sagesse ou Charisme de 1, jusqu'à un maximum de 20. <br><strong>Contournement d'abri</strong>. Vos attaques à distance avec des sorts ignorent les Abris partiels (1/2) et les Abris importants (3/4). <br><strong>Incantation au corps à corps</strong>. Être à 1,50 mètre ou moins d'un ennemi n'inflige pas de Désavantage à vos jets d'attaque avec des sorts. <br><strong>Portée améliorée</strong>. Lorsque vous lancez un sort d'une portée d'au moins 3 mètres et qui nécessite un jet d'attaque, vous pouvez augmenter sa portée de 18 mètres."
    },
    "initie_a_la_magie": {
        "name": "Initié à la magie",
        "type": "Origine",
        "prereq": "Niv 1+",
        "asi": "Aucune",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Deux sorts mineurs</strong>. Vous apprenez deux sorts mineurs de votre choix parmi la liste de sorts de Clerc, Druide ou Magicien. L'Intelligence, la Sagesse ou le Charisme est votre caractéristique d'incantation pour les sorts de ce don (à choisir lors de la sélection de ce don). <br><strong>Sort de niveau 1</strong>. Choisissez un sort de niveau 1 dans la liste que vous avez sélectionnée pour les sorts mineurs de ce don. Ce sort est toujours prêt. Vous pouvez le lancer une fois sans emplacement de sort, et vous récupérez la possibilité de le lancer de cette manière à la fin d'un Repos long. Vous pouvez également lancer le sort en utilisant un emplacement de sort que vous possédez. <br><strong>Changement de sort</strong>. Chaque fois que vous gagnez un niveau, vous pouvez remplacer l'un des sorts choisis pour ce don par un autre sort de même niveau, choisi dans la liste de sorts choisis. <br><strong>Répétable</strong>. Vous pouvez prendre ce don plusieurs fois, mais vous devez choisir une liste de sorts différente à chaque fois."
    },
    "interception": {
        "name": "Interception",
        "type": "Général",
        "prereq": "capacité Style de combat",
        "asi": "Aucune",
        "desc": "Lorsqu'une créature que vous pouvez voir touche une autre créature à 1,50 m ou moins de vous lors d'un jet d'attaque, vous pouvez prendre une Réaction pour réduire les dégâts infligés à la cible de 1d10 plus votre bonus de maîtrise. Vous devez tenir un bouclier ou une arme courante ou de guerre pour utiliser cette Réaction."
    },
    "mage_de_guerre": {
        "name": "Mage de guerre",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, capacité Sorts ou Magie de pacte",
        "asi": "+1 Int ou Sag ou Cha",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Intelligence, Sagesse ou Charisme de 1, jusqu'à un maximum de 20. <br><strong>Concentration</strong>. Vous bénéficiez d'un Avantage aux jets de sauvegarde de Constitution que vous effectuez pour maintenir votre concentration. <br><strong>Sort réactif</strong>. Lorsqu'une créature provoque une Attaque d'opportunité de votre part en quittant votre allonge, vous pouvez prendre une Réaction pour lancer un sort sur elle, au lieu d'effectuer une Attaque d'opportunité. Le sort doit avoir un temps d'incantation d'une action et ne doit cibler que cette créature. <br><strong>Composantes somatiques</strong>. Vous pouvez exécuter les composantes somatiques des sorts même lorsque vous avez des armes ou un bouclier dans une ou deux mains."
    },
    "magie_rituelle": {
        "name": "Magie rituelle",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Intelligence, Sagesse ou Charisme 13 ou plus",
        "asi": "+1 Int ou Sag ou Cha",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Intelligence, Sagesse ou Charisme de 1, jusqu'à un maximum de 20. <br><strong>Sorts rituels</strong>. Choisissez un nombre de sorts de niveau 1 qui possède l'étiquette Rituel égal à votre bonus de maîtrise. Vous avez toujours ces sorts préparés et vous pouvez les lancer avec n'importe quel emplacement de sort dont vous disposez. La caractéristique d'incantation de ces sorts est celle augmentée par ce don. Chaque fois que votre bonus de maîtrise augmente par la suite, vous pouvez ajouter un sort supplémentaire de niveau 1 avec l'étiquette Rituel aux sorts toujours préparés avec cette capacité. <br><strong>Rituel rapide</strong>. Grâce à cet avantage, vous pouvez lancer un sort Rituel que vous avez préparé en utilisant son temps d'incantation normal plutôt que le temps prolongé d'un rituel. Cela ne nécessite pas d'emplacement de sort. Une fois que vous avez lancé le sort de cette manière, vous ne pouvez plus utiliser cet avantage avant d'avoir terminé un Repos long."
    },
    "maitre_d_armes": {
        "name": "Maître d'armes",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Propriété botte</strong>. Votre formation aux armes vous permet d'utiliser la botte d'un type d'arme courante ou de guerre de votre choix, à condition de maîtriser ce type d'arme. À la fin d'un Repos long, vous pouvez changer de type d'arme pour un autre type d'arme éligible."
    },
    "maitre_d_hast": {
        "name": "Maître d'hast",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Force ou Dextérité 13 ou plus",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Dextérité ou Force de 1, jusqu'à un maximum de 20. <br><strong>Frappe double</strong>. Immédiatement après avoir pris l'action Attaque et attaqué avec un Bâton, une Lance ou une arme possédant les propriétés Lourde et Allonge, vous pouvez utiliser une action Bonus pour effectuer une attaque au corps à corps avec l'extrémité opposée de l'arme. L'arme inflige des dégâts contondants, et le dé de dégâts de l'arme pour cette attaque est un d4. <br><strong>Frappe réactive</strong>. Lorsque vous tenez un Bâton, une Lance ou une arme possédant les propriétés Lourde et Allonge, vous pouvez prendre une Réaction pour effectuer une attaque au corps à corps contre une créature qui entre dans l'allonge de cette arme."
    },
    "maitre_des_armes_lourdes_cogneur_lourd": {
        "name": "Maître des armes lourdes|Cogneur lourd",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Force 13 ou plus",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force de 1, jusqu'à un maximum de 20. <br><strong>Expert en armes lourdes</strong>. Lorsque vous touchez une créature avec une arme possédant la propriété Lourde lors de l'action Attaque à votre tour, vous pouvez infliger des dégâts supplémentaires à la cible. Ces dégâts supplémentaires sont égaux à votre bonus de maîtrise. <br><strong>Abattage</strong>. Immédiatement après avoir réussi un Coup critique avec une arme de corps à corps ou réduit une créature à 0 point de vie avec une telle arme, vous pouvez effectuer une attaque avec la même arme en tant qu'action Bonus."
    },
    "maitre_des_armures_intermediaires": {
        "name": "Maître des armures intermédiaires",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, formation aux armures intermédiaires",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Porteur agile</strong>. Lorsque vous portez une armure intermédiaire, vous pouvez ajouter 3 au lieu de 2 à votre CA si votre Dextérité est de 16 ou plus."
    },
    "maitre_des_armures_lourdes": {
        "name": "Maître des armures lourdes",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, formation aux armures lourdes",
        "asi": "+1 Con ou For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Constitution ou Force de 1, jusqu'à un maximum de 20. <br><strong>Réduction des dégâts</strong>. Lorsque vous êtes touché par une attaque alors que vous portez une armure lourde, les dégâts contondants, perforants et tranchants infligés par cette attaque sont réduits d'un montant égal à votre bonus de maîtrise."
    },
    "maitre_des_boucliers": {
        "name": "Maître des boucliers",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, formation aux boucliers",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force de 1, jusqu'à un maximum de 20. <br><strong>Coup de bouclier</strong>. Si vous attaquez une créature à 1,50 m ou moins de vous lors de l'action Attaque et que vous la touchez avec une arme de corps à corps, vous pouvez immédiatement frapper la cible avec votre bouclier si vous en êtes équipé, la forçant à effectuer un jet de sauvegarde de Force (DD 8 plus votre modificateur de Force et votre bonus de maîtrise). En cas d'échec, vous pouvez repousser la cible de 1,50 m ou la faire tomber À terre (au choix). Vous ne pouvez utiliser cet avantage qu'une seule fois par tour. <br><strong>Interposition de bouclier</strong>. Si vous êtes soumis à un effet vous permettant d'effectuer un jet de sauvegarde de Dextérité pour ne subir que la moitié des dégâts, vous pouvez prendre une Réaction pour ne subir aucun dégât si vous réussissez le jet de sauvegarde et que vous portez un bouclier."
    },
    "maitre_arbaletrier": {
        "name": "Maître-arbalétrier",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Dextérité 13 ou plus",
        "asi": "Aucune",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Chargement rapide</strong>. Vous ignorez la propriété Chargement de l'arbalète de poing, de l'arbalète lourde et de l'arbalète légère (toutes appelées arbalètes par la suite dans ce don). Si vous tenez l'une d'elles, vous pouvez charger une munition même sans main libre. <br><strong>Tir au corps à corps</strong>. Être à 1,50 mètre ou moins d'un ennemi n'inflige pas de Désavantage à vos jets d'attaque avec des arbalètes. <br><strong>Arbalète secondaire</strong>. Lorsque vous effectuez l'attaque supplémentaire de la propriété Légère, vous pouvez ajouter votre modificateur de caractéristique aux dégâts de l'attaque supplémentaire si cette attaque est effectuée avec une arbalète qui possède la propriété Légère et que vous n'ajoutez pas déjà ce modificateur aux dégâts."
    },
    "mobile": {
        "name": "Mobile",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Dextérité ou Constitution 13 ou plus",
        "asi": "+1 Con",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Dextérité ou Constitution de 1, jusqu'à un maximum de 20. <br><strong>Vitesse améliorée</strong>. Votre vitesse augmente de 3 mètres. <br><strong>Pointe sur Terrain difficile</strong>. Lorsque vous prenez l'action Pointe pendant votre tour, un terrain difficile ne vous coûte pas un mouvement supplémentaire pour le reste de ce tour. <br><strong>Déplacement agile</strong>. Les attaques d'opportunité ont un Désavantage contre vous."
    },
    "musicien": {
        "name": "Musicien",
        "type": "Origine",
        "prereq": "Niv 1+",
        "asi": "Aucune",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Formation aux instruments</strong>. Vous maîtrisez trois instruments de musique de votre choix. <br><strong>Chant d'encouragement</strong>. À la fin d'un Repos court ou long, vous pouvez jouer une chanson avec un instrument de musique que vous maîtrisez et donner une Inspiration héroïque aux alliés qui l'entendent. Le nombre d'alliés que vous pouvez affecter de cette manière est égal à votre bonus de maîtrise."
    },
    "observateur": {
        "name": "Observateur",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Intelligence ou Sagesse 13 ou plus",
        "asi": "+1 Int ou Sag",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Intelligence ou Sagesse de 1, jusqu'à un maximum de 20. <br><strong>Observateur attentif</strong>. Choisissez l'une des compétences suivantes : Intuition, Investigation ou Perception. Si vous ne maîtrisez pas la compétence choisie, vous la maîtrisez ; si vous la maîtrisez déjà, vous gagnez Expertise pour celle-ci. <br><strong>Observation rapide</strong>. Vous pouvez prendre l'action Observation en tant qu'action Bonus."
    },
    "protection": {
        "name": "Protection",
        "type": "Général",
        "prereq": "capacité Style de combat",
        "asi": "Aucune",
        "desc": "Lorsqu'une créature que vous pouvez voir attaque une cible autre que vous située à 1,50 mètre ou moins de vous, vous pouvez prendre une Réaction pour interposer votre bouclier si vous en tenez un. Vous infligez un Désavantage au jet d'attaque déclencheur et à tous les autres jets d'attaque contre la cible jusqu'au début de votre prochain tour si vous restez à 1,50 mètre ou moins de la cible."
    },
    "protection_intermediaire": {
        "name": "Protection intermédiaire",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, formation aux armures légères",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Formation aux armures</strong>. Vous recevez la formation aux armures intermédiaires."
    },
    "protection_legere": {
        "name": "Protection légère",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants : <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Formation aux armures</strong>. Vous recevez la formation aux armures légères et aux boucliers."
    },
    "protection_lourde": {
        "name": "Protection lourde",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, formation aux armures intermédiaires",
        "asi": "+1 Con ou For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Constitution ou Force de 1, jusqu'à un maximum de 20. <br><strong>Formation aux armures</strong>. Vous recevez la formation aux armures lourdes."
    },
    "resilient": {
        "name": "Résilient",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "Aucune",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Choisissez une caractéristique pour laquelle vous ne maîtrisez pas les jets de sauvegarde. Augmentez la caractéristique choisie de 1, jusqu'à un maximum de 20. <br><strong>Maîtrise des jets de sauvegarde</strong>. Vous gagnez la maîtrise des jets de sauvegarde avec la caractéristique choisie."
    },
    "robuste": {
        "name": "Robuste",
        "type": "Origine",
        "prereq": "Niv 1+",
        "asi": "Aucune",
        "desc": "Vos points de vie maximum augmentent d'un montant égal à deux fois votre niveau de personnage lorsque vous obtenez ce don. Chaque fois que vous gagnez un niveau de personnage par la suite, vos points de vie maximum augmentent de 2 points de vie supplémentaires."
    },
    "sauvagerie_martiale": {
        "name": "Sauvagerie martiale",
        "type": "Origine",
        "prereq": "Niv 1+",
        "asi": "Aucune",
        "desc": "Vous avez été formé à infliger des coups particulièrement dévastateurs. Une fois par tour, lorsque vous touchez une cible avec une arme, vous pouvez lancer deux fois les dés de dégâts de l'arme et utiliser le résultat que vous souhaitez contre la cible."
    },
    "sentinelle": {
        "name": "Sentinelle",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Force ou Dextérité 13 ou plus",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Gardien</strong>. Immédiatement après qu'une créature à 1,50 mètre ou moins de vous prend l'action Désengagement ou touche une cible autre que vous avec une attaque, vous pouvez effectuer une attaque d'opportunité contre cette créature. <br><strong>Immobilisation</strong>. Lorsque vous touchez une créature avec une attaque d'opportunité, sa vitesse devient 0 pour le reste du tour en cours."
    },
    "telekinesiste": {
        "name": "Télékinésiste",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 Int ou Sag ou Cha",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Intelligence, Sagesse ou Charisme de 1, jusqu'à un maximum de 20. <br><strong>Télékinésie mineure</strong>. Vous apprenez le sort <em><a href=\"https://www.aidedd.org/spell/fr/main-de-mage\">main de mage</a></em>. Vous pouvez le lancer sans composantes verbale ou somatique, vous pouvez rendre la main spectrale invisible, et sa portée ainsi que la distance à laquelle elle peut se trouver augmentent de 9 mètres lorsque vous le lancez. La caractéristique d'incantation du sort est celle augmentée par ce don. <br><strong>Bourrade télékinétique</strong>. Par une action Bonus, vous pouvez pousser télékinétiquement une créature que vous pouvez voir dans un rayon de 9 mètres. Dans ce cas, la cible doit réussir un jet de sauvegarde de Force (DD 8 plus le modificateur de la caractéristique augmentée par ce don et votre bonus de maîtrise) ou être déplacée de 1,50 mètre vers vous ou loin de vous."
    },
    "telepathe": {
        "name": "Télépathe",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 Int ou Sag ou Cha",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Intelligence, Sagesse ou Charisme de 1, jusqu'à un maximum de 20. <br><strong>Parole télépathique</strong>. Vous pouvez parler par télépathie à toute créature que vous pouvez voir dans un rayon de 18 mètres. Vos paroles télépathiques sont dans une langue que vous connaissez, et la créature ne vous comprend que si elle connaît cette langue. Votre communication ne lui confère pas la capacité de vous répondre par télépathie. <br><strong>Détection des pensées</strong>. Vous avez toujours le sort <em><a href=\"https://www.aidedd.org/spell/fr/detection-des-pensees\">détection des pensées</a></em> préparé. Vous pouvez le lancer sans emplacement de sort ni composantes de sort, et vous devez terminer un Repos long avant de pouvoir le lancer à nouveau de cette manière. Vous pouvez également le lancer en utilisant vos emplacements de sorts du niveau approprié. Votre caractéristique d'incantation pour le sort est la caractéristique augmentée par ce don."
    },
    "tireur_d_elite": {
        "name": "Tireur d'élite",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur, Dextérité 13 ou plus",
        "asi": "Aucune",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Contournement d'abri</strong>. Vos attaques à distance avec des armes ignorent les Abris partiels (1/2) et les Abris importants (3/4). <br><strong>Tir au corps à corps</strong>. Être à 1,50 mètre ou moins d'un ennemi n'inflige pas de Désavantage à vos jets d'attaque avec des armes à distance. <br><strong>Longue portée</strong>. Attaquer à longue portée n'inflige pas de Désavantage à vos jets d'attaque avec des armes à distance."
    },
    "trancheur": {
        "name": "Trancheur",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Coupe-jarret</strong>. Une fois par tour, lorsque vous touchez une créature avec une attaque infligeant des dégâts tranchants, vous pouvez réduire la vitesse de cette créature de 3 mètres jusqu'au début de votre prochain tour. <br><strong>Critique amélioré</strong>. Lorsque vous réussissez un Coup critique infligeant des dégâts tranchants à une créature, celle-ci subit un Désavantage aux jets d'attaque jusqu'au début de votre prochain tour."
    },
    "tueur_de_mages": {
        "name": "Tueur de mages",
        "type": "Général",
        "prereq": "niveau 4 ou supérieur",
        "asi": "+1 For",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Augmentation de caractéristique</strong>. Augmentez votre Force ou Dextérité de 1, jusqu'à un maximum de 20. <br><strong>Briseur de concentration</strong>. Lorsque vous infligez des dégâts à une créature en concentration, celle-ci a un Désavantage au jet de sauvegarde qu'elle effectue pour maintenir sa Concentration. <br><strong>Esprit préservé</strong>. Si vous ratez un jet de sauvegarde d'Intelligence, de Sagesse ou de Charisme, vous pouvez le transformer en succès. Une fois cet avantage utilisé, vous ne pouvez plus l'utiliser avant d'avoir terminé un Repos court ou long."
    },
    "vigilant": {
        "name": "Vigilant",
        "type": "Origine",
        "prereq": "Niv 1+",
        "asi": "Aucune",
        "desc": "Vous bénéficiez des avantages suivants. <br><strong>Maîtrise de l'Initiative</strong>. Lorsque vous lancez l'Initiative, vous pouvez ajouter votre bonus de maîtrise à votre jet. <br><strong>Échange d'Initiative</strong>. Immédiatement après avoir lancé une Initiative, vous pouvez échanger votre Initiative avec celle d'un allié consentant au cours du même combat. Cet échange est impossible si vous ou l'allié êtes Incapable d'agir."
    }
};
