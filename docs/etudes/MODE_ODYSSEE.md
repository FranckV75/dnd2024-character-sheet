# Étude : un mode « Odyssée des Seigneurs Dragons » désactivable

Étude du 19/11/2026 (demande de Franck du 18/11/2026), faite sur la version 4.42.0. C'est une
étude : rien n'est construit. Elle a été faite par une première recherche dans le code, puis
contre-vérifiée par une seconde ; ce que la seconde a changé est signalé par **(corrigé)** ou
**(ajouté)**. Les vraies sauvegardes des joueurs n'ont pas été lues. Les numéros de lignes sont
ceux de la version 4.42.0.

Suite : Franck répond aux questions du point 5, puis le chantier se lance sur sa demande
(voir `docs/FEUILLE_DE_ROUTE.md`, point 3).

## En bref

- La recommandation de la première étude est **confirmée** : un réglage **par fiche**, **actif par
  défaut**, et ce que la fiche utilise déjà reste toujours en place.
- L'Odyssée se voit sans qu'on l'utilise à **5 endroits** : 6 espèces, 12 sous-classes, le style
  Hoplite, l'encadré de l'onglet 3, les 8 fonds d'écran. Tout le reste (dragonnets, stimfée,
  monture, poème épique, sorts et cases) ne s'affiche que si la fiche a déjà la sous-classe ou
  l'espèce.
- Aucun calcul ne change. Le mode raccourcit des listes et cache un encadré vide.
- La seconde recherche n'a trouvé **aucun cas de perte de données**. Elle a trouvé **4 pièges
  techniques** à éviter pendant la construction, et quelques oublis sans gravité.
- Taille du chantier : petit à moyen. Rien n'est à construire maintenant.

## 1. Inventaire

| Élément | Où dans le code | Comment le code sait que c'est l'Odyssée | Ce que la fiche enregistre | Visible sans l'utiliser ? |
|---|---|---|---|---|
| **6 espèces** : Centaure, Méduse, Minotaure, Nymphe, Satyre, Sirène | `js/data/dd-rules.js`, `js/data/species-traits.js`, `js/rules/species.js`, `js/ui/species.js` ; liste remplie une seule fois (`js/ui/sheet.js`, ligne 236) | Champ `source: "Odyssée"` dans `dd-rules.js`. **(corrigé)** Aucun test ne protège ce champ pour les espèces. | `char_species`, `species_choices`, cases dans `subclass_uses` (« species.… ») | **Oui** : mêlées aux 10 espèces du manuel, sans mention |
| **12 sous-classes**, une par classe | `js/data/dd-rules.js`, `subclass-features.js`, `subclass-spells.js`, `subclass-choices.js` ; règles `js/rules/subclass-*.js`, `class-features.js`, **(ajouté)** `class-reminders.js`, `free-casts.js`, `rest.js`, `feat-effects/helpers.js` | Champ `source: "Odyssée"` (protégé par un test). Les règles reconnaissent la sous-classe par son identifiant. | `char_subclass`, `subclass_choices`, `subclass_uses`, `combat_buffs` | **Oui pour le choix** : ligne « (Odyssée) » dans la liste et dans la fenêtre « Passer au niveau » (`js/rules/level-up.js`, ligne 192) |
| **Compagnons** : stimfée, monture d'Outremonde, pseudodragon, dragon lié | `js/data/subclass-companions.js`, `js/rules/subclass-companions.js`, `js/ui/companions.js` | Identifiant de la sous-classe | `subclass_companions`, `subclass_choices` (**(corrigé)** `egg`, `steed`, `steed_level`, et aussi `stimfee`, `foe`), `combat_buffs.dragonMount` | Non |
| **Poème épique** | `js/rules/epic-poem.js` | Identifiant `college_of_epic_muse` | `subclass_choices.college_of_epic_muse` | Non |
| **Style de combat Hoplite** | `js/data/feats.js` (ligne 331), `js/rules/feat-effects/fighting-styles.js` | **Rien de fiable** : seulement le nom « Hoplite (Odyssée) ». Repère à ajouter. | `feat_2`, `feat_7` ou un autre emplacement = `hoplite` | **Oui (corrigé)** : dans 11 des 12 listes de dons (pas dans celle du second don de l'Humain) |
| **Encadré « Odyssée des Seigneurs Dragons »** : Destin héroïque, Points de renommée, Palier | `index.html` (lignes 397-414), `dd-rules.js` (`heroicDestinies`), `js/rules/character.js` (`renownTier`), `js/ui/counters.js`, `css/tab-skills.css`, `css/print.css` | Un bloc à part (classe `odyssey`) | `heroic_destiny`, `glory_score` (clés de l'ancienne version) ; `vanity_score` existe sans champ affiché | **Oui** : toujours affiché et imprimé |
| **8 fonds d'écran fournis** | `assets/backgrounds/`, `js/data/constants.js` (`DEFAULT_BGS`), `js/ui/gallery.js`, `js/rules/gallery.js` | **Rien** : une liste de noms de fichiers | Dans la fiche : `_visual_prefs.galleryBg`. Sur l'appareil : `dd2024_bg`, `dd2024_gallery_bg` | **Oui** : 8 vignettes. Aucun n'est posé d'office |
| **Textes** | `js/data/help.js` (ligne 276), `js/ui/subclass.js` | Texte écrit en dur | Rien | La notice : oui |

**Ce que la première étude avait oublié (ajouté)** :

- **Le repli de l'encadré.** Chaque tablette retient si l'encadré de l'Odyssée est replié
  (`js/ui/fold.js`, préférence `dd2024_blocks_folded`). Si on y met la case du mode, elle peut
  être cachée par un encadré replié.
- **Le verrou.** Destin et renommée ne se modifient pas fiche verrouillée (`js/ui/lock.js`). La
  case du mode suivra la même règle : pas de fausse manœuvre en pleine partie.
- **Les images sont celles de votre groupe.** Ces fonds ne viennent pas du livre. À vous de dire
  s'ils doivent partir avec le mode.
- **Les personnages d'exemple** (Humain Champion, Humain Évocateur) n'ont rien de l'Odyssée, mais
  ils s'ouvriront avec le mode actif, donc avec les choix de l'Odyssée dans les listes.
- **La page de contrôle du développeur** (`dev/validation.js`) affiche le destin héroïque. Sans
  effet pour les joueurs.
- **Le contenu à venir.** La feuille de route prévoit des outils propres à l'Odyssée et un journal
  de campagne (serments, quêtes). Tout ajout futur devra porter le même repère de source.

**Rien d'Odyssée (vérifié une seconde fois)** : les 16 historiques, les sorts (`data/spells.json`),
les armes, les armures, les outils, les deux exemples, la fenêtre « Nouveautés ».

**Le libellé « Inspiration héroïque ou points de Foi »** (onglet Combat) : son origine reste
inconnue. Voir la question 5.

**Quatre pièges techniques trouvés (ajouté)** :

1. **Les fonds.** La liste des 8 fonds sert aussi à reconnaître un fond déjà enregistré, y compris
   les anciennes adresses de la v3 (`js/ui/gallery.js`, lignes 70-72 ; `js/rules/gallery.js`,
   lignes 55-79). Il faudra cacher les **vignettes** (ligne 501), jamais raccourcir cette liste.
   Sinon un fond déjà choisi pourrait ne plus s'afficher.
2. **La liste des sous-classes** n'est refaite que si la classe change (`js/ui/sheet.js`, lignes
   398-403). Elle devra aussi se refaire quand le mode change.
3. **Les valeurs par défaut.** Toute clé placée dans la fiche vierge est ajoutée à chaque fiche à
   l'ouverture (`js/state/migrate.js`, ligne 244). La nouvelle clé ne doit donc **pas** y figurer.
4. **La fiche « vierge ».** Deux contrôles différents décident qu'une fiche est vierge
   (`js/cloud/controller.js`, lignes 75-81 ; `js/state/snapshots.js`, lignes 64-70). Une fiche
   neuve créée « hors Odyssée » sera vue vierge par l'un et pas par l'autre. Sans gravité, mais à
   traiter si on ajoute le choix de la campagne dans « Nouvelle fiche ».

## 2. Les options de réglage

**(a) Par fiche.** Une clé facultative voyage avec le personnage. Clé absente = Odyssée affichée.
Vos fiches s'ouvrent comme aujourd'hui. Le réglage suit le personnage d'une tablette à l'autre.
Un personnage de l'Odyssée et un personnage d'une autre campagne peuvent cohabiter sur la même
tablette. Risque : écrire la clé d'office dans toutes les fiches déclencherait de fausses
questions de synchronisation.

**(b) Par appareil.** Une préférence du navigateur. Rien n'entre dans la sauvegarde : c'est le plus
sûr techniquement. Mais il faut basculer à la main à chaque changement de personnage, refaire le
réglage sur chaque tablette, et il se perd si on vide les données du navigateur.

**(c) Automatique.** Déduit de ce que la fiche utilise. Impossible pour une fiche neuve. Et une
fiche de l'Odyssée sans espèce ni sous-classe de l'Odyssée serait mal classée. Inutilisable seule,
mais très bon filet de sécurité.

**(d) Mélange : (a) + le filet de sécurité de (c).** Réglage par fiche. Et quel que soit le
réglage, ce que la fiche utilise déjà reste affiché et calculé.

## 3. Recommandation

**Option (d), confirmée.** J'ai cherché les cas où elle ferait du tort. Résultat :

- **Perte pour un joueur : aucune.** Les règles lisent le nom enregistré dans la fiche, pas la
  liste. Un Centaure reste un Centaure, mode coupé ou non. Si un choix sortait de la liste par
  erreur, la fiche l'afficherait quand même avec la mention « (valeur enregistrée) ».
- **Le jour de la mise à jour : presque rien.** Vos fiches n'ont pas la clé, donc rien ne change
  et aucune question de synchronisation n'est posée. Seule nouveauté visible : une case en plus
  dans l'encadré de l'Odyssée, fiche déverrouillée. **(corrigé)** La première étude disait
  « aucune différence ».
- **Deux tablettes : pas de casse.** Le réglage est dans la fiche, il ne peut pas différer d'une
  tablette à l'autre. Une tablette pas encore mise à jour garde la clé sans la comprendre et
  affiche tout, comme aujourd'hui.
- **Ancienne version (v3) : pas de casse.** Elle ignore la clé. Si elle réenregistrait la fiche,
  la clé serait effacée et l'Odyssée réapparaîtrait. Rien n'est perdu.
- **Ce qui peut surprendre.** Mode coupé, un Centaure passe « Humain » par erreur : « Centaure »
  n'est plus dans la liste. Il suffit de recocher la case pour le retrouver. La phrase d'aide doit
  le dire.

**Précisions ajoutées :**

- **Clé** : par exemple `odyssey_mode`, qui vaut `"off"` quand le mode est coupé. Toute autre
  valeur, ou l'absence de clé, veut dire « actif ». Elle n'est écrite que lorsque le joueur touche
  la case. Elle est déclarée dans `V4_ONLY_KEYS`. **(corrigé)** `migrate.js` n'a pas à changer.
- **Reconnaître ce que la fiche utilise** avec les outils qui existent déjà (ceux qui lisent les
  noms français, anglais et les anciennes écritures). Ne pas comparer de simples textes.
- **Où** : une case dans l'encadré « Odyssée des Seigneurs Dragons » de l'onglet 3, fiche
  déverrouillée. Mode coupé et encadré vide, il ne reste que cette ligne, et l'encadré s'affiche
  déplié. Mode coupé, une petite ligne dit ce que la fiche utilise encore (« Cette fiche garde :
  Centaure, Hoplite »).
- **Phrase pour le joueur** : « Campagne de l'Odyssée des Seigneurs Dragons. Décochez pour jouer
  une autre campagne : les espèces, les sous-classes et le style de combat de l'Odyssée ne sont
  plus proposés. Ce que votre fiche utilise déjà reste en place. Recochez pour tout retrouver. »
- **Pourquoi pas par appareil** : vous jouerez l'autre campagne sur les mêmes tablettes. Il
  faudrait basculer à chaque changement de personnage.

## 4. Découpage du futur chantier

| Lot | Contenu | Taille | Risque principal |
|---|---|---|---|
| **1. Repères et règle** | Repère de source pour le style Hoplite. Liste à part pour les fonds à cacher (sans toucher `DEFAULT_BGS`). Petite règle pure : mode actif ? que garde la fiche ? quels choix proposer ? Tests, dont un qui protège le repère des espèces. Rien de visible. | Petit | Aucun |
| **2. La clé et la case** | Clé facultative, `V4_ONLY_KEYS`, case dans l'encadré. Test : une fiche sans la clé garde la même empreinte. | Petit | La clé ne doit jamais s'écrire toute seule |
| **3. Les listes** | Espèces, sous-classes (liste du haut et phrase de « Passer au niveau »), style Hoplite. Listes refaites quand le mode ou la fiche change. | Moyen | Piège n° 2. Le contrôle qui vide la sous-classe au changement de classe (`sheet.js`, ligne 283) doit lire la liste complète |
| **4. L'encadré, la notice** | Encadré caché s'il est vide et le mode coupé. Impression A4. Notice et « Nouveautés » (obligatoires à chaque version). | Petit | Encadré replié sur une tablette. **(corrigé)** Le test de la notice lit le code, pas l'écran : cacher l'encadré ne le casse pas |
| **5. Les fonds** (facultatif) | Les vignettes des fonds fournis sortent de la galerie, sauf le fond affiché. | Petit | Piège n° 1 |
| **6. Finitions** (facultatif) | Choix de la campagne dans « Nouvelle fiche » ; exemples ; libellé « points de Foi ». | Petit | Piège n° 4 |

**À laisser de côté** : toutes les règles de calcul, les compagnons, le poème épique, les sorts et
cases de sous-classe, les tests existants, `data/spells.json`, le README. Les lots 1 à 4 suffisent.

**À vérifier sur tablette le jour où ce sera construit** :

1. Les fiches de Franck et de Catherine s'ouvrent sans changement et sans question de
   synchronisation.
2. Sur une fiche de test : couper le mode, regarder les listes, le remettre.
3. Le réglage suit la fiche sur l'autre tablette.
4. Une fiche de l'Odyssée, mode coupé : espèce, sous-classe, dragon et fond sont toujours là.
5. L'encadré replié sur une tablette : la case reste trouvable.
6. Impression : l'encadré vide n'est plus imprimé, l'encadré rempli l'est toujours.

## 5. Questions pour Franck

1. **Réglage par fiche, actif par défaut ?** Conseil : oui.
2. **Mode coupé, mais la fiche a un destin ou des points de renommée : garder l'encadré ?**
   Conseil : oui. Il ne se cache que vide.
3. **Les 8 fonds fournis sont les images de votre groupe. Faut-il vraiment les retirer de la
   galerie quand le mode est coupé ?** Conseil : non pour l'instant (lot 5 en attente). Le fond en
   place n'est jamais retiré.
4. **Où placer la case : dans l'encadré de l'onglet 3 ou dans le menu « Gestion » ?** Conseil :
   dans l'encadré.
5. **Les « points de Foi » viennent-ils de l'Odyssée ?** Si oui, le libellé devient « Inspiration
   héroïque » seul quand le mode est coupé. Sinon on n'y touche pas.
6. **« Nouvelle fiche » : proposer tout de suite le choix de la campagne ?** Conseil : plus tard.
7. **(ajouté) Les deux personnages d'exemple : mode coupé d'office ?** Conseil : oui, ils sont
   faits avec le seul manuel. À faire avec le lot 6.
