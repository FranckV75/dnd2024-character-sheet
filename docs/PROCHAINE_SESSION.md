# Point pour la prochaine session (mis à jour le 10/11/2026)

Ce fichier passe le relais à une nouvelle session de Claude. Franck le fait lire en début de session.

## Où en est le projet

- En ligne : version **4.33.0** (`master` = `d7c1fd0`), publiée avec l'accord de Franck.
- Enregistrée sur `v4`, **pas encore publiée** (attendre le « Publie » de Franck) : **4.34.0**.
  Elle regroupe :
  - les PX restants avant le niveau suivant, avec le bouton « + PX » ;
  - les boutons − / + sur Épuisement, Inspiration, renommée et PV des compagnons, et la « Bourse » ;
  - le numéro de version affiché dans la barre ;
  - les aptitudes de base des 12 classes et les sorts préparés / mineurs permis ;
  - les noms du Manuel des joueurs français (le Sorcier devient l'Occultiste ; sous-classes et
    aptitudes renommées). Les anciens noms restent lus : `aliasesFr` et `DD_RULES.namesOf` dans
    `js/data/dd-rules.js`.

  Détails dans `docs/CHANGELOG.md`.
- Franck possède le Manuel des joueurs 2024 en français (livre papier). Ses photos font foi pour
  les noms français. Elles sont rangées, avec un index (`INDEX.md`), dans
  `E:\2 - CODE\Ressources_0_Feuille_de_Perso_Antigravity\Photos Manuel des joueurs FR\`.
  Ce dossier est privé et ne va jamais dans le dépôt. Les textes de la fiche sont des résumés,
  jamais le texte du livre (le dépôt est public).

## À vérifier par Franck (tablette Android, iPad de Catherine)

- Le numéro « Version 4.34.0 » s'affiche en haut à droite après la mise à jour.
- PX :
  - vérifier la ligne « Encore X PX avant le niveau N » ;
  - le bouton « + PX » ;
  - le « + » du niveau qui s'allume au seuil.
  - Le bouton « + PX » écrit les PX en nombre seul (« 4990/6500 » devient « 5090 »).
- Boutons − / + : Épuisement, Inspiration, PV d'un compagnon. Bourse : gagner, puis dépenser plus
  que ce qu'on a (refusé).
- Fiche d'un Occultiste enregistrée avant la mise à jour : elle doit s'afficher « Occultiste »
  et « Protecteur … », sans rien perdre ; l'ancien site doit toujours l'ouvrir.
- Onglet Magie : « Préparés : x / y » ; rouge seulement si l'on a vraiment préparé trop de sorts.

## Points relevés, non traités (à proposer à Franck)

- Vitesse du Moine (Déplacement sans armure) pas ajoutée à la vitesse.
- Utilisations de Fougue, Inflexible (Guerrier) et Coup de chance (Roublard) non comptées.
- Historiques : ils n'appliquent rien à la fiche (dons et outils). Les noms français des dons et
  outils n'existent qu'en anglais dans les données.
- Espèces : options absentes (lignées elfiques, ascendances draconiques, portée de la vision dans
  le noir).
- Pages des Bottes d'arme (`js/data/weapon-masteries.js`) : numéros du livre anglais.
- Titre du livre « Formes du cercle améliorés » (sic) repris tel quel : Franck peut trancher.
- Dragonnets du Seigneur Dragon : blocs à vérifier sur le Manuel des monstres 2024 (plus tard).

## Ensuite, sur demande de Franck seulement

Lanceur de dés (seul), fiche sans wifi (seule, en dernier), puis audit `/audit-fiche` et découpage
des gros fichiers. Idées en attente : `docs/ROADMAP.md`.
