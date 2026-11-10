# Point pour la prochaine session (mis à jour le 10/11/2026, soir)

Ce fichier passe le relais à une nouvelle session de Claude. Franck le fait lire en début de session.

## Où en est le projet

- En ligne : version **4.34.0** (`master` = `3f52d88`). Sur `v4`, pas encore publié (attend le
  « Publie » de Franck) :
  - 4.35.0 : vitesse du Moine et du Barbare, cases Fougue / Inflexible / Coup de chance, filtre
    « Magiques » des armes, pages françaises des Bottes d'arme, « Formes du cercle améliorées » ;
  - 4.36.0 : encadré « Espèce & historique » (traits et options d'espèce, sorts d'espèce, Souffle,
    historique avec « À vérifier » et bouton « Appliquer ») ;
  - 4.37.0 : rappels des capacités de classe près des valeurs, Concentration.

  Détails dans `docs/CHANGELOG.md`.
- Franck possède le Manuel des joueurs 2024 en français (livre papier). Ses photos font foi pour
  les noms français. Elles sont rangées, avec un index (`INDEX.md`), dans
  `E:\2 - CODE\Ressources_0_Feuille_de_Perso_Antigravity\Photos Manuel des joueurs FR\`.
  Ce dossier est privé et ne va jamais dans le dépôt. Les textes de la fiche sont des résumés,
  jamais le texte du livre (le dépôt est public).

## À vérifier par Franck (tablette Android, iPad de Catherine), après publication

- Onglet Aptitudes & Traits, encadré « Espèce & historique » : choisir l'option de l'espèce (fiche
  déverrouillée), voir la Vision dans le noir et les Résistances ; bouton « Appliquer à la fiche »
  de l'historique sur une fiche de test.
- Onglet Magie : bloc « Sorts d'espèce » (Drow, Tieffelin, Aasimar…) ; les sorts préparés ne
  changent pas.
- Onglet Combat : cases des traits d'espèce (Souffle, Poussée d'adrénaline…) vidées au repos ;
  Fougue et Inflexible pour un Guerrier.
- Encadré « États » : menu « Concentration », puis « Dégâts / Soins » → jet de Constitution chiffré.
- Rappels près des valeurs (Korgul : Sens du danger, Instinct sauvage ; Rage allumée : Avantage
  aux tests de Force, Résistance C/P/T).
- Une fiche enregistrée avant la mise à jour s'ouvre sans rien perdre ; l'ancien site l'ouvre
  toujours (nouvelles clés facultatives `species_choices` et `concentration`).

## Points relevés, non traités (à proposer à Franck)

- Bottes d'arme : la page 214 (liste des bottes) et la page 209 (Maître d'armes) citent encore le
  livre anglais ; il faudrait les photos du chapitre Équipement du livre français.
- Espèces de l'Odyssée (Centaure, Méduse, Minotaure, Satyre, Sirène, Nymphe) : pas de traits repris.
- Dragonnets du Seigneur Dragon : blocs à vérifier sur le Manuel des monstres 2024 (plus tard).
- Poids porté : gardé en tête par Franck, pas utile pour le moment.

## Ensuite, sur demande de Franck seulement

Lanceur de dés (seul), fiche sans wifi (seule, en dernier), puis audit `/audit-fiche` et découpage
des gros fichiers. Idées en attente : `docs/ROADMAP.md`.
