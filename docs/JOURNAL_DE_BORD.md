# Journal de bord

Le fil des sessions de travail. Franck le fait lire en début de session ; Claude le tient à jour
en fin de session :

- **En ce moment** est réécrit à chaque fin de session : état actuel, ce qui attend, ce qui reste.
- **Sessions** : une entrée par session, la plus récente en premier, avec un titre qui dit sur quoi
  on a travaillé (il change si le sujet change en route). 5 à 10 lignes : décisions et choses
  laissées de côté. Le détail des changements est dans `docs/CHANGELOG.md`, les idées dans
  `docs/ROADMAP.md`.
- Quand le fichier devient long, les vieilles entrées partent dans `docs/journal/<année>.md`.

## En ce moment

- **En ligne** : version **4.37.0** (`master` = `v4` = `e1ea8a8`), publiée le 10/11/2026 avec
  l'accord de Franck. Rien n'attend de publication.
- **Manuel français** : les photos de Franck font foi pour les noms français. Elles sont rangées,
  avec un index (`INDEX.md`), dans
  `E:\2 - CODE\Ressources_0_Feuille_de_Perso_Antigravity\Photos Manuel des joueurs FR\`.
  Ce dossier est privé et ne va jamais dans le dépôt. Les textes de la fiche sont des résumés,
  jamais le texte du livre (le dépôt est public).

### À vérifier par Franck (tablette Android, iPad de Catherine)

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

### Points relevés, non traités (à proposer à Franck)

- Bottes d'arme : la page 214 (liste des bottes) et la page 209 (Maître d'armes) citent encore le
  livre anglais ; il faudrait les photos du chapitre Équipement du livre français.
- Espèces de l'Odyssée (Centaure, Méduse, Minotaure, Satyre, Sirène, Nymphe) : pas de traits repris.
- Dragonnets du Seigneur Dragon : blocs à vérifier sur le Manuel des monstres 2024 (plus tard).
- Poids porté : gardé en tête par Franck, pas utile pour le moment.

### Ensuite, sur demande de Franck seulement

Lanceur de dés (seul), fiche sans wifi (seule, en dernier), puis audit `/audit-fiche` et découpage
des gros fichiers. Idées en attente : `docs/ROADMAP.md`.

## Sessions

### 11/11/2026 — Journal de bord

- L'ancienne note de passage `docs/PROCHAINE_SESSION.md` devient ce journal, au nom fixe (choix de
  Franck) : le sujet de chaque session est dans le titre de son entrée, pas dans le nom du fichier.

### 10/11/2026 (soir) — Espèces, historiques, rappels de classe et Concentration (4.35 → 4.37)

- Restes des classes (4.35.0) : vitesse du Moine et du Barbare, cases Fougue / Inflexible / Coup de
  chance, filtre « Magiques », pages françaises des Bottes d'arme.
- Encadré « Espèce & historique » (4.36.0). Décisions de Franck : l'historique est un rappel ; le
  bouton « Appliquer » coche les compétences et remplit le don de niveau 1 s'il est vide, jamais
  les caractéristiques. Les sorts d'espèce ne comptent pas dans les sorts préparés.
- Rappels des capacités de classe près des valeurs et Concentration (4.37.0). Les capacités à
  déclencher (réactions, relances) restent dans le texte des aptitudes.
- Relectures « ultracode » des trois lots : tous les défauts confirmés corrigés.
- Laissés de côté : poids porté (plus tard), dragonnets (photos du Manuel des monstres), espèces de
  l'Odyssée.

### 10/11/2026 — Sous-classes, file d'attente autonome, classes du Manuel français (4.28 → 4.34)

- Projet des sous-classes terminé (`docs/SOUS_CLASSES.md`), blocs repliables, noms du Manuel
  français ; publié en 4.28.1.
- File d'attente : sauvegardes de secours datées, suivi des états, assistant de montée de niveau
  (4.29 à 4.31), puis PX restants, boutons − / +, Bourse, aptitudes de base des 12 classes, sorts
  préparés permis, noms français (le Sorcier devient l'Occultiste) ; publié en 4.34.0.

### Avant le 10/11/2026

Voir `docs/CHANGELOG.md` (versions 4.0 à 4.27) et l'historique Git.
