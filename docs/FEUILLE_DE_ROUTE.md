# Feuille de route

Ce qui reste à faire, les idées en attente et les décisions qui valent pour la suite. Ce qui est
fait n'y reste pas : le fil des sessions est dans `docs/JOURNAL_DE_BORD.md`, le détail des
changements dans `docs/CHANGELOG.md`. Rien ne se lance sans l'accord de Franck.

## À faire

Ordre décidé par Franck le 11/11/2026 : d'abord l'audit et les découpages, puis les restes et
points relevés, puis une discussion pour trier toutes les idées.

### 1. ~~Audit de santé, puis découpage~~ : fait (4.38.0, 11/11/2026)

Audit `/audit-fiche` et corrections (lots A, C, D, E) ; découpage de `css/sheet.css`,
`js/rules/feat-effects.js` et `js/ui/spells.js` au lot D (voir `docs/ARCHITECTURE.md`). Le
prochain audit se fera à la demande de Franck.

### 2. Restes et points relevés : faits (4.39.0), décisions en attente

Faits en 4.39.0 (case Maîtrises d'armes, espèces de l'Odyssée, dragonnets 2024, restes des
sous-classes). Restent des décisions de Franck :
- Espèces de l'Odyssée : type de créature (Humanoïde ou Fée, le guide ne le dit pas) ; afficher
  ou non les bonus de caractéristiques et langues du guide (format 2014) ; limite du Regard
  pétrifiant ; humeur de la Sirène et chiffres du taureau (Rage maudite) restés en texte ;
  Chevelure serpentine sans Dextérité aux dégâts (lecture du livre à confirmer).
- Goliath : la fiche signale maintenant sa vitesse 2024 (10,5 m) ; à garder ou non.
- Dragonnets 2024 : le second souffle (sommeil, répulsion…) n'a plus de recharge ; garder la règle
  du pacte de l'Odyssée (une fois par repos) ? Noms des actions pris chez AideDD (Saignée…).
- Monté sur le dragon : remplacer vraiment la Perception passive par celle du dragon ?
- Monture d'Outremonde (Amazone) : case pour l'action bonus (une fois par repos long) ; noms
  français des actions à vérifier dans le livre ; sorts de la Magie des Amazones pas dans le grimoire.

### 3. Idées, toutes au même niveau (priorités à trier avec Franck : c'est la prochaine étape)

- Lanceur de dés (demande de janvier 2026) : toucher un bonus d'attaque ou une compétence lance le
  dé et affiche le total. Pas prioritaire pour l'instant.
- Fiche utilisable sans wifi, installée comme une application sur la tablette (attention aux
  mises à jour, qui doivent toujours arriver). Chantier seul. Pas prioritaire pour l'instant.
- Armes : dans le réglage ⚙ d'une arme, pouvoir ajouter des dégâts supplémentaires avec leur
  raison (ex. « +2d6 contre les dragons » d'une arme tueuse, « +1d6 radiants contre les
  morts-vivants »), affichés à côté des dégâts comme le fait déjà Fureur divine en Rage
  (demande de Franck, 11/11/2026).
- Outils : choisir les outils dans une liste (outils d'artisan, boîtes de jeux, instruments)
  au lieu de les écrire à la main, et faire le lien avec l'outil donné par l'historique (Korgul,
  Soldat : « une boîte de jeux au choix », signalée « À vérifier » dans l'encadré de l'historique ;
  à expliquer à Franck) (demande de Franck, 11/11/2026).
- Grimoire, suites possibles du chantier 4.40.0 (à décider par Franck) : Paladin et Rôdeur
  traités comme Clerc et Druide (fenêtre et rappel de repos long) ou non ; avertissement quand
  un sort préparé dépasse le plus haut emplacement ; cases de lancer gratuit (Châtiment divin,
  Marque du chasseur, Arcanum mystique…) proposées par « Lancer » ; Magicien : repères pour
  Maîtrise des sorts (18) et Sorts de prédilection (20), qui demanderaient une nouvelle clé,
  rappel de Mémorisation de sort au repos court, Aptitude érudite au niveau 3 (2 ou 3 sorts) ;
  Barde du Savoir : enregistrer ses deux Découvertes magiques ; rangement des sorts décochés
  qui s'accumulent au grimoire ; rituels du livre trop nombreux en vue au combat ?
- Grimoire : comme les objets magiques, un aspect qui monte en puissance avec le niveau du sort.
- Mode « Odyssée des Seigneurs Dragons » désactivable (demande de Franck, 18/11/2026) : retirer
  ce qui est propre à cette campagne (espèces, sous-classes Seigneur Dragon / Amazone /
  Odysséen, style Hoplite, dragonnets, fonds d'écran…) pour jouer une autre campagne. À étudier :
  inventaire des différences, réglage par fiche ou par appareil, compatibilité des sauvegardes.
- Explications des options (demande de Franck, 18/11/2026) : chaque bouton ou option dit en une
  phrase à quoi il sert, lisible aussi sur tablette (fait pour le grimoire en 4.40.0 ; reste
  toute la fiche à passer en revue).
- Outil pour le MJ (« feuille du MJ », demande de Franck, 18/11/2026) : à discuter d'abord.
  Est-ce une bonne idée, et pour quoi faire ? Dans ce projet (même site, même base, lien avec la
  « Vue du groupe ») ou dans un projet séparé (`E:\2 - CODE\<nouveau projet>\`) ? Rien à
  construire avant cette discussion.
- Bilan des capacités pour les autres joueurs (Iria, personnage de Catherine), comme pour Korgul.
- Vue du groupe (demande « synergies entre joueurs ») : PV, CA et perception passive de chaque
  personnage ; gros chantier, il faut décider qui voit quoi.
- Journal de campagne : notes datées par séance, suivi propre à l'Odyssée (serments, quêtes).
- Poids porté : total du matériel comparé à la capacité de charge (gardé en tête, pas utile pour
  le moment).
- Vérification des noms français, classe par classe, d'après les photos du manuel.
- Mode consultation sur téléphone (lecture seule).
- Connexion par lien magique (courriel), en plus du mot de passe.

## Aide-mémoire : publier un changement délicat

Pour une publication qui touche la sauvegarde ou la synchronisation (repris de la bascule v3 → v4) :

1. Avant : demander à Catherine d'ouvrir la fiche, de vérifier qu'elle est là, de se connecter
   (enregistrement en ligne) et d'exporter un fichier JSON (Safari efface le stockage d'un site non
   utilisé depuis 7 jours). Faire de même sur la tablette et l'ordinateur de Franck.
2. Supabase (tableau de bord → Authentication → Policies, table `characters`) : RLS activé et les
   4 règles présentes (SELECT, INSERT, UPDATE, DELETE pour `authenticated`, `auth.uid() = user_id`) ;
   sinon exécuter `supabase/policies.sql` (peut être relancé sans risque).
3. Publier entre deux parties, tous les onglets de la fiche fermés sur tous les appareils.
4. Après : rouvrir la fiche, puis recharger une fois environ 10 minutes plus tard (cache GitHub
   Pages). Ne jamais modifier une fiche dans un onglet ouvert avant la publication.
5. Retour en arrière possible vers la v3 : étiquette `v3-final`.

## Décisions qui valent pour la suite

### Règles (vérifiées dans le Manuel des joueurs 2024)

- Paladin et Rôdeur : 2 emplacements de sorts de niveau 1 dès le niveau 1 (la v3 en donnait 0).
- Clerc : Conduit divin à partir du niveau 2. Druide : Forme sauvage à partir du niveau 2,
  4ᵉ utilisation au niveau 17 ; maîtrise des armures légères et des boucliers seulement.
- Moine et Ensorceleur : points de discipline / de sorcellerie à partir du niveau 2. Moine : la
  Défense sans armure ne s'applique pas avec un bouclier.
- Les 10 dons de style de combat sont classés « Style de combat » (et non « Général »).
- Repos long : tous les dés de vie dépensés sont récupérés, après une fenêtre de confirmation.
- Bouclier : bonus de CA seulement si formé aux boucliers, un seul à la fois.
- Historique : un rappel ; « Appliquer » coche les compétences et remplit le don de niveau 1 s'il
  est vide, jamais les caractéristiques. Une valeur saisie n'est jamais modifiée par la fiche
  (seulement des mentions « dont +X »).

### Données et sauvegarde

- Anciens noms de dons gardés pour la recherche (`aliases`) : « Maître des armes lourdes » pour
  Cogneur lourd, « Empaleur » pour Perforateur, « Faveur de vision véritable » pour Faveur de vision
  lucide. L'identifiant `maitre_des_armes_lourdes_cogneur_lourd` reste tel quel : les sauvegardes de
  Korgul l'utilisent.
- Anciens noms de classes et sous-classes lus (`aliasesFr`, `DD_RULES.namesOf`) : une fiche
  enregistrée avec « Sorcier » s'affiche « Occultiste » sans être réécrite.
- Emplacements de sorts utilisés et bonus de combat (Rage…) font partie de la fiche (en v3 ils
  étaient gardés à part dans le navigateur, repris au premier lancement de la v4).

### Interface

- Polices : Cinzel pour titres et libellés, **Alegreya** pour les textes longs (choix de Franck).
- Tablette : propriétés et notes longues des armes abrégées avec « … » (texte complet au toucher).
- Impression : relevé du personnage (dons non choisis masqués) ; lignes de sorts vides imprimées et
  valeurs très longues coupées dans les cellules : acceptés tels quels.
- Restauration ensorcelée : case dans la fenêtre de repos court. Restauration arcanique et
  Récupération naturelle : rappel, emplacements à décocher soi-même.
- Filtres des armes : pastilles sur une ligne (pas de menu déroulant, ils tiennent à 820 px).
- Magie sauvage : bloc laissé déplié (une ligne, rappels utiles au moment d'agir).
