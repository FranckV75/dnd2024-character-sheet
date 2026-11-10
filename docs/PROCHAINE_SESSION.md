# Point pour la prochaine session (écrit le 10/11/2026)

Ce fichier passe le relais à une nouvelle session de Claude. Franck le fait lire en début de session.
À supprimer (ou à réécrire) une fois la file terminée.

## Où en est le projet

- En ligne : version **4.28.1** (`master` = `4171fd8`). Tout est enregistré. Seuls ce fichier et les
  idées ajoutées à `docs/ROADMAP.md` sont sur la branche `v4` de cet ordinateur sans être poussés ni
  publiés (de la documentation seulement : ils partiront avec la prochaine publication).
- Faits récemment : capacités de sous-classe (lots 0 à 7), blocs repliables (`js/ui/fold.js`), noms
  du Manuel des joueurs 2024 **français** pour les manœuvres et les actions.
- Franck possède le Manuel des joueurs 2024 en français (livre papier). Ses photos font foi pour les
  noms français ; elles sont rangées, avec un index, dans
  `E:\2 - CODE\Ressources_0_Feuille_de_Perso_Antigravity\Documentation\Photos Manuel des joueurs FR\`
  (dossier privé, jamais dans le dépôt). Le PDF du dossier Manuels est en anglais.

## La mission : une file de 3 chantiers, en autonomie

Franck a choisi (10/11/2026) d'enchaîner ces trois améliorations, dans cet ordre :

1. **Sauvegardes de secours datées** : la fiche garde ses 5 à 10 derniers états sur l'appareil, avec
   un écran « Revenir à… » (date et heure, nom du personnage, niveau).
   D'abord regarder ce qui existe : `js/state/local-save.js`, `js/state/persistence.js` et la clé
   `dd2024_char_backup` (une copie de secours existe déjà depuis la 4.16.0).
2. **Suivi des états** (Empoisonné, À terre, Effrayé, Entravé…) : pastilles à cocher dans l'onglet
   Combat, rappel de l'effet au toucher. Aujourd'hui seul l'Épuisement est suivi (`fatigue_level`).
   Noms français à prendre dans les photos du manuel ; s'ils n'y sont pas, demander une photo de la
   liste des états à Franck plutôt que de traduire de l'anglais.
3. **Assistant de montée de niveau** : un bouton « Passer au niveau N » qui liste ce qui change (PV,
   don à choisir, emplacements de sorts, nouvelles capacités de classe et de sous-classe), puis
   applique le niveau. S'appuyer sur ce qui existe (`subclassFeatures` et son « À venir », emplacements
   de dons de `js/state/schema.js`, emplacements de sorts de `js/rules/spells.js`).

Ensuite, plus tard et sur demande : lanceur de dés (seul), fiche sans wifi (seule, en dernier), puis
audit `/audit-fiche` et découpage des gros fichiers. Ne pas les commencer dans cette file.

## Avant de coder : questions à poser à Franck en une seule fois

Poser ces questions au tout début (outil de questions), puis ne plus l'interrompre :

- **Enregistrement** : « Puis-je enregistrer (commit local sur `v4`) après chaque chantier, une fois
  les contrôles passés ? » Franck a accepté le principe ; le faire confirmer. Jamais de publication
  sans son « Publie ».
- **Sauvegardes** : combien d'états garder (5 ou 10) ? Une sauvegarde à chaque ouverture de la fiche,
  ou aussi avant chaque repos long et chaque import ? Où mettre l'écran (barre « Gestion ») ?
- **États** : la liste complète du manuel ou seulement les plus courants ? Où les placer dans
  l'onglet Combat (près des PV, ou dans un encadré repliable) ? L'état est-il enregistré dans la
  fiche et synchronisé (nouvelle clé facultative), ou seulement sur l'appareil ?
- **Montée de niveau** : l'assistant change-t-il lui-même le niveau et les PV maximum (moyenne ou
  dé saisi par le joueur), ou affiche-t-il seulement la liste de ce qu'il faut faire ?

## Modèle, effort, ultracode (demande de Franck)

Modèle : **Opus 5.5** pour toute la file. Franck autorise la session à régler elle-même l'effort
selon la tâche : avec l'outil de réglage de l'effort de la session s'il est disponible, sinon en
donnant l'effort aux agents lancés. Dire à Franck, à chaque phase, ce qui a été choisi.

| Phase (pour chaque chantier) | Effort | Ultracode |
|---|---|---|
| Lecture du code existant, conception, questions | élevé | non (oui pour la montée de niveau : un agent par famille de règles : PV, dons, sorts, capacités) |
| Écriture des règles pures et de leurs tests | moyen | non |
| Écriture de l'interface et du CSS | moyen | non |
| Relecture finale du chantier | élevé | **oui** : relecteurs (règles, sauvegardes et synchronisation, affichage tablette) et un contradicteur par constat |
| Vérification dans le navigateur, journal des versions | moyen | non |

Les sauvegardes touchent aux données des joueurs : relecture approfondie obligatoire (fiches déjà
enregistrées toujours lisibles, rien d'effacé, deux onglets ouverts, stockage plein ou indisponible).

## Règles à respecter (en plus de `CLAUDE.md`)

- Parler à Franck en français simple ; il n'est pas développeur.
- Un commit par chantier, `npm run check` vert avant, une version par chantier (4.29.0, 4.30.0,
  4.31.0) avec son entrée dans `docs/CHANGELOG.md` ; cocher l'idée dans `docs/ROADMAP.md`.
- Format de sauvegarde : aucune clé renommée ni supprimée ; une nouvelle clé v4 va dans
  `V4_ONLY_KEYS` (`js/cloud/sync.js`) et passe par `js/state/migrate.js`, avec des tests.
- Les vraies sauvegardes de Korgul (`tests/fixtures/local/`) ne sont jamais copiées ni publiées.
- Ne pas enregistrer `.claude/launch.json`.
- Vérifier chaque chantier dans le navigateur : 820 px, clair et sombre, 0 erreur console,
  impression. Remettre le personnage de test dans l'état trouvé.
- Tout bloc d'information long doit être repliable (`js/ui/fold.js`), comme les dons.
- Si un chantier bute sur un choix que seul Franck peut faire : le noter, passer au chantier suivant,
  et poser toutes les questions restantes à la fin.

## À la fin de la file

Dire à Franck, en clair : ce qui est fait et enregistré, ce qui reste à vérifier sur sa tablette et
sur l'iPad de Catherine, les questions en suspens, et attendre son « Publie ».
