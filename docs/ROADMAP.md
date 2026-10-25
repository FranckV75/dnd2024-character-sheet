# Feuille de route — reconstruction v4

Chaque étape se termine par un jalon validé par Franck.

| Étape                | Contenu                                                                                  | Jalon de validation                                 | État                                               |
| -------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------- |
| 0. Mise en place     | Branche `v4`, structure, serveur local, garde-fous (`npm run check`), CI, `CLAUDE.md`    | Page vide sans erreur console                       | ✅                                                  |
| 1. Règles métier     | `js/rules/` pur + données `js/data/` sans `window`, tests étendus, corrections de règles | Tests verts, règles vérifiées dans les manuels      | ✅                                                  |
| 2. État & sauvegarde | Store unique, schéma, migration v3, localStorage, import/export JSON                     | Les sauvegardes de Korgul se chargent sans perte    | ✅ (validé par Franck)                             |
| 3. HTML & CSS        | 4 onglets, thèmes, tablette 768–1100 px, sans `!important` ni handlers inline            | Rendu validé à 820, 1024, 1280 px dans les 2 thèmes | 🔄 à valider par Franck                            |
| 4. Fonctionnalités   | Combat, dons, compétences, repos, grimoire, verrouillage, galerie, impression            | Validation par lots                                 | ⏳                                                  |
| 5. Cloud             | Supabase (auth, roster, conflits) sur la même base que la v3                             | Synchronisation testée                              | ⏳                                                  |
| 6. Bascule           | Comparaison v3/v4, fusion de `v4` dans `master`                                          | 0 régression, 0 erreur console                      | ⏳                                                  |

## Corrections de règles apportées (vérifiées dans le Manuel du joueur 2024)

- Paladin et Rôdeur : 2 emplacements de sorts de niveau 1 dès le niveau 1 (la v3 en donnait 0).
- Clerc : Conduit divin à partir du niveau 2 (la v3 l'affichait dès le niveau 1).
- Druide : Forme sauvage à partir du niveau 2, 4ᵉ utilisation au niveau 17 (la v3 : niveau 1 et 14).
- Moine et Ensorceleur : points de discipline / de sorcellerie à partir du niveau 2.
- Moine : la Défense sans armure ne s'applique plus avec un bouclier.
- Les 10 dons de style de combat sont classés « Style de combat » (et non « Général »).

## Données à compléter

- Les 12 Faveurs épiques n'ont pas de description (à rechercher, pas urgent).
- ✅ Don « Cogneur lourd » (nom 2024) : l'ancien nom 2014 « Maître des armes lourdes » est rangé dans
  `aliases` pour la recherche (étape 4). L'identifiant `maitre_des_armes_lourdes_cogneur_lourd` est
  conservé tel quel : les sauvegardes de Korgul l'utilisent.
- ✅ Même cas pour « Perforateur » (alias « Empaleur ») et « Faveur de vision lucide »
  (alias « Faveur de vision véritable »). Sur AideDD, « A|B » = ancien nom | nom officiel WotC France ;
  « vision lucide » confirmé par le glossaire des règles 2024 d'AideDD, « Perforateur » confirmé par
  Franck dans le Manuel des joueurs 2024 en français.

## Changements faits sur `master` (v3) depuis le début de la v4, à reporter

- `0aa093a` : connexion Supabase reconnue après une session initiale vide.
- `46043d9` : formulaire de connexion mémorisable par le navigateur (`<form>`, autocomplete,
  PasswordCredential), « Mot de passe oublié ? » (`resetPasswordForEmail`) et fenêtre
  « nouveau mot de passe » (événement `PASSWORD_RECOVERY`), workflow
  `.github/workflows/supabase-keepalive.yml` (empêche la mise en pause du projet Supabase gratuit).
- Supabase (réglé par Franck) : Site URL et Redirect URLs = `https://franckv75.github.io/dnd2024-character-sheet/`.

→ Étape 5 : reprendre ces comportements (et envisager la connexion par lien magique).
→ Étape 6 : fusionner `master` dans `v4` avant la bascule, pour garder au minimum le workflow keep-alive.

## À reprendre dans l'interface (étapes 4-5)

- Étape 3 : armes, armures et sorts sont affichés en lecture seule ; ajout, modification et
  suppression des lignes à l'étape 4 (ainsi que boutons de repos, bonus de combat, galerie,
  verrouillage, éditeur de style, impression, « Nouvelle fiche » et bascule perception passive manuelle).
- Les champs courts (scores, PV, niveau…) sont désormais de vrais champs de saisie : une mise en
  forme (gras, couleur) posée en v3 sur ces champs s'affiche en texte simple.

- En v3, les emplacements de sorts cochés et les bonus de combat (Rage…) étaient stockés à part,
  hors de la fiche : ils n'étaient ni exportés ni synchronisés. En v4, ils feront partie de la fiche.

## Décisions prises

- Police : Cinzel pour les titres et libellés, une police avec de vraies minuscules pour les textes
  longs (historique, traits, notes). Choix de la police précise à l'étape 3, sur échantillons.
- v3 : workflow keep-alive lancé et « Mot de passe oublié » testé par Franck (OK).

## Décisions en attente

- Police précise des textes longs : échantillons dans `dev/polices.html` (EB Garamond en attendant).

- Demandes non réalisées en v3 : lanceur de dés, synergies entre joueurs (à compléter ?).
