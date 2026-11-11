---
name: audit-fiche
description: Audit complet de la Feuille de Personnage D&D 2024 (v4) — règles du manuel, sauvegardes et synchronisation, santé du code, affichage tablette, vitesse, sécurité, hygiène du dépôt — puis rapport en français simple pour Franck. À utiliser quand Franck demande un audit, un bilan de santé ou un « état des lieux » du projet, pas pour relire un seul changement (utiliser alors /code-review).
---

# Audit de la fiche (v4)

Ce skill remplace l'ancien audit de la v3, `.agent/workflows/audit.md` (Antigravity, février 2026),
supprimé en 4.18.0 avec les autres anciennes procédures de `.agent/workflows/` (accord de Franck).

Un audit regarde **tout le projet**, pas un changement. Il **ne corrige rien** : il produit un
rapport, et Franck choisit ensuite quoi corriger (chaque correction suit le circuit habituel :
tests, captures, « Enregistre », « Publie »).

Franck n'est pas développeur : rapport en français simple, phrases courtes, pas de jargon sans
explication, captures d'écran quand c'est visuel.

## 0. Avant de commencer (à dire à Franck, puis attendre son accord)

- Annoncer le plan en une ligne par angle (section 2) et, **pour chaque phase**, dire si
  l'ultracode est utile et pourquoi (règle de Franck) :
  - inventaire (section 1) : pas utile, quelques commandes ;
  - examen des angles : utile, angles indépendants à mener en parallèle ;
  - vérification adverse des problèmes trouvés : utile, évite les fausses alertes ;
  - rapport : pas utile.
- Le mot « ultracode » seul n'est pas un accord : attendre son « oui ».
- Proposer aussi un audit **léger** (angles 2, 3, 4 seulement, sans vérification adverse) si
  Franck veut limiter le coût.

## Interdits pendant l'audit (en plus de CLAUDE.md)

- Ne modifier **aucun** fichier du dépôt ; scripts et sorties temporaires dans le dossier
  scratchpad de la session.
- Ne jamais se connecter à Supabase ni y écrire : la sécurité de la base se juge en lisant
  `supabase/policies.sql` et le code, pas en essayant.
- `tests/fixtures/local/` (vraies sauvegardes de Korgul) : lecture seule, jamais citées en entier
  dans le rapport (le dépôt et les rapports peuvent devenir publics).
- Ne pas toucher à `E:\2 - CODE\0_Feuille_de_Perso_Antigravity` (lecture du manuel seulement), ni
  au dossier `.agent/` pendant l'audit. En dehors de l'audit aussi : jamais `.agent/rules/`, jamais
  `.agent/context/`, jamais déplacer `.agent/`.
- Navigateur : Edge **en mode invisible** (headless) avec un profil séparé, jamais de fenêtre
  visible. Pas de saisie de mot de passe.
- Aucun push, aucun commit.

## 1. Inventaire (rapide, sans ultracode)

- Version (`package.json`), branche, derniers commits, `git status` propre ou non.
- `npm run check` : résultat exact (nombre de tests).
- Taille des fichiers JS/CSS (repérer les plus gros), nombre de tests par fichier.
- Documentation à confronter au code : `docs/FEUILLE_DE_ROUTE.md`, `docs/ARCHITECTURE.md`,
  `docs/etudes/DONS_ACTIFS.md`, `docs/CHANGELOG.md`, `CLAUDE.md`.

## 2. Angles d'examen

Chaque angle rend une liste de constats : **quoi**, **où** (fichier:ligne), **scénario concret**
(fiche, action, résultat obtenu / attendu), **preuve** (commande lancée, texte du manuel), gravité.
Pas de remarques de style.

1. **Règles du jeu.** Un échantillon de calculs comparé au manuel 2024 : CA (armures, sans armure
   du Barbare et du Moine, boucliers), attaque et dégâts (Frappe à mains nues, Moine, styles,
   bottes d'armes), sauvegardes, compétences, emplacements de sorts par classe, repos court et
   long, dons (au moins un par famille : calcul, case à cocher, choix, rappel). Manuel anglais :
   `E:\2 - CODE\Ressources_0_Feuille_de_Perso_Antigravity\Documentation\` (Player's Handbook 2024),
   texte extractible avec `pdftotext` ; même manuel anglais (malgré son nom français) :
   `E:\2 - CODE\0_Feuille_de_Perso_Antigravity\Manuels\Manuel-du-joueur_D&D2025.pdf`. Il n'y a pas
   de manuel du joueur en français : les noms français de la fiche viennent de `js/data/`.
   L'OCR coupe parfois les titres (« WEA PO N MAST ER ») : chercher aussi par bouts de mots
   avant de conclure qu'une règle « n'existe pas ».
2. **Sauvegardes et synchronisation.** Toutes les fiches de `tests/fixtures/` (et `local/` en
   lecture) se chargent, se migrent (`js/state/migrate.js`) et se réenregistrent sans perdre ni
   renommer de clé ; clés propres à la v4 (`V4_ONLY_KEYS`, `js/cloud/sync.js`) complètes ; une
   fiche v3 relue par la v4 puis renvoyée garde ses données ; import/export de fichier.
3. **Santé du code.** Code mort (exports jamais importés), doublons de logique entre modules,
   fichiers trop gros à découper (ex. `js/rules/feat-effects.js`), règles d'architecture de
   CLAUDE.md respectées (règles pures sans DOM dans `js/rules/`, pas de `window`, pas de
   gestionnaire inline, `innerHTML` seulement via DOMPurify, pas de `!important` hors
   `css/motion.css`), documentation qui ne suit plus le code, tests manquants sur une règle.
4. **Affichage.** Edge headless, viewport tactile 820 × 1180 et 1024 × 768, thèmes clair et sombre,
   les 4 onglets, fiche verrouillée et déverrouillée, une fenêtre de chaque sorte (repos,
   règle d'une botte, détail d'un repère), impression A4. Fiches : `dev/preview.html?fixture=…`
   (localhost seulement, `npm run dev` lancé en arrière-plan). Critères : 0 erreur console, pas de
   défilement horizontal, rien de coupé ni chevauché, polices Cinzel / Alegreya, couleurs par
   variables CSS. Repérer ce qui est risqué sur Safari / iPad (non testable ici) et le signaler
   « à vérifier sur l'iPad de Catherine ».
5. **Vitesse sur tablette.** Ce qui est recalculé à chaque frappe (`render` dans
   `js/ui/sheet.js`, `featEffects`, `deriveCharacter`) ; mesurer le temps d'un rendu sur une
   grosse fiche (Korgul) en headless avec ralentissement CPU ×4 ; signaler seulement ce qui se
   sentirait (> 50 ms par frappe).
6. **Sécurité.** Contenu saisi par l'utilisateur affiché sans protection, liens et imports de
   fichier, clé Supabase publiable (normale) et règles RLS (`supabase/policies.sql`, dont la
   règle DELETE), dépendances chargées depuis un CDN (version figée ?).
7. **Hygiène du dépôt public.** Fichiers qui ne devraient pas être publics (PDF de manuels,
   anciennes sauvegardes) dans l'arbre actuel **et** dans l'historique git (`git log --all
   --stat`, `git rev-list --objects --all`) ; `.gitignore`. Point déjà connu : l'historique
   contient encore des PDF et de vieilles sauvegardes de Korgul (nettoyage = réécriture de
   l'historique, à ne proposer que comme option, jamais à faire pendant l'audit).
   `.agent/workflows/` (anciennes procédures d'Antigravity) a été vidé en 4.18.0 avec l'accord de
   Franck ; s'il réapparaît, lister chaque fichier « à supprimer » ou « à garder » (raison en une
   ligne) et ne rien supprimer sans son accord. Jamais `.agent/rules/` ni `.agent/context/`.

## 3. Vérification adverse

Pour chaque constat de gravité moyenne ou haute : un vérificateur indépendant essaie de le
**réfuter** (relire le code, reproduire avec node ou en headless, relire la règle). Constat gardé
seulement s'il est reproduit. En cas de doute : « à surveiller », pas « à corriger ». Un choix
documenté (CLAUDE.md, DONS_ACTIFS.md, CHANGELOG, mémoire du projet) n'est pas un défaut, par
exemple : la fiche ne modifie jamais une valeur saisie ni une case cochée (elle affiche
« dont +X » ou « à cocher ») ; pas de mobile < 768 px.

## 4. Rapport à Franck

En français simple, dans cet ordre :

1. **En bref** : 3 à 5 phrases sur l'état général (pas de note sur 10).
2. **À corriger** : défauts confirmés, du plus gênant au moins gênant, chacun avec ce que le
   joueur verrait, où, et l'effort estimé (petit / moyen / gros).
3. **À surveiller** : risques non confirmés, points à vérifier sur une vraie tablette.
4. **En ordre** : ce qui a été vérifié et va bien (pour savoir ce qui est couvert).
5. **Non couvert** : ce que l'audit n'a pas pu vérifier, et pourquoi.
6. **Proposition** : lots de corrections suggérés, avec pour chacun l'avis ultracode phase par
   phase, puis demander lequel lancer.

Joindre les captures utiles (chemins absolus). Enregistrer aussi le rapport complet dans le
scratchpad pour pouvoir y revenir ; ne pas l'ajouter au dépôt sans l'accord de Franck.
