# Explications des options — revue bouton par bouton

> **État : proposition, rien n'est déployé.** Étude du 23/11/2026, faite sur la branche `v4` en
> lisant le code de la fiche (`index.html` et `js/ui/`) et le « Mode d'emploi » (`js/data/help.js`).
> Aucun fichier de la fiche n'a été modifié. Ce document sert à choisir, avec Franck, quelles
> explications afficher, comment, et quels boutons garder.

Demande de Franck : « revue bouton par bouton de toute la fiche, pour que chaque option dise en une
phrase à quoi elle sert ; ne serait-ce que pour voir ce qui est utile ou pas ; pas forcément le
déployer, mais me faire une proposition en expliquant l'intérêt pour chaque cas ».

## 1. Résumé pour Franck

### Ce qui a été regardé

Tous les contrôles de la fiche : boutons, cases à cocher, listes déroulantes, roues dentées,
boutons ▾, pastilles qu'on touche, boutons − / +, boutons de repos, onglets, et les boutons des
fenêtres qu'ils ouvrent. Un contrôle qui se répète (les 6 ronds « Sauv. », les 18 lignes de
compétences, une roue dentée par arme…) compte pour **une seule ligne** : on l'explique une fois.

### Les chiffres

- **178 sortes de contrôles**, rangées ci-dessous par onglet puis par encadré, dans l'ordre de
  l'écran (sections 2 à 8). (165 à la première lecture ; 13 ajoutés à la relecture, voir la
  section 10.)
- **37 n'ont aucune explication lisible au doigt** : leur explication n'existe que dans une
  infobulle (le petit texte qui apparaît quand on laisse la souris dessus), pour un lecteur
  d'écran, ou pas du tout. Sur tablette, une infobulle ne se voit jamais.
- **8 sont expliqués à moitié** au doigt (le nom se lit, mais le détail utile est en infobulle).
- **13 sont expliqués au doigt seulement par la barre du haut** : on les touche, une phrase s'y
  écrit (c'est déjà le cas des repères « Pas d'emplacement », des boutons ▾, des avertissements
  ⚠…). Ça marche, mais il faut savoir qu'il faut toucher.
- Les 120 autres se comprennent au doigt : leur nom suffit, une phrase est déjà écrite à côté, ou
  la fenêtre qu'ils ouvrent explique tout avant d'agir.
- **Intérêt d'afficher une phrase** : 40 « utile » (un joueur peut hésiter), 120 « déjà clair »,
  18 « à discuter ».

### Les 10 propositions les plus utiles

| # | Contrôle | Pourquoi c'est utile | Phrase proposée |
|---|---|---|---|
| 1 | Pastilles de **bonus de combat** au-dessus des armes (Rage, Attaque sournoise, Duel, Manœuvre…) | Toute la règle (quand l'allumer, ce qu'elle ajoute) est dans l'infobulle : invisible sur tablette. | « Allumez-la quand le bonus s'applique : il s'ajoute aux dégâts des armes. » |
| 2 | Bouton **« Modifiable » / « Verrouillée »** | Le bouton affiche l'état, pas ce qu'il fait ; on ne sait pas ce qui reste modifiable. | « Verrouillée : seuls PV, cases et repos se changent, pour jouer sans risque. » |
| 3 | Les **deux « + »** de l'en-tête (à côté du Niveau et des XP) | Même icône, rôles très différents ; aucun texte au doigt. | Niveau : « Passe au niveau suivant et montre ce qui change. » — XP : « Ajoute les XP gagnés, sans calcul. » |
| 4 | **Perception passive** (la valeur se touche) | Rien n'indique qu'on peut écrire une autre valeur, ni comment revenir au calcul. | « Calculée. Touchez-la pour écrire une autre valeur ; effacez pour revenir au calcul. » |
| 5 | **Classe d'armure** (écusson et colonne CA des armures) et **Initiative** | Le calcul s'ouvre au toucher, mais rien ne le dit. Le détail de l'Initiative n'existe qu'en infobulle : perdu sur tablette. | « Touchez la valeur pour voir son calcul. » |
| 6 | **Cases de la ressource de classe** (Rage, Second souffle…) et des capacités à cocher | Coché = dépensé n'est écrit nulle part à l'écran (pour la ressource de classe, chaque case se coche seule ; pour les dons et capacités, toucher la 3e case coche les 3 premières). | « Cochez une case par utilisation ; le bon repos les rend. » |
| 7 | Boutons **− / +** (PV, PV temporaires, Épuisement, Foi, renommée, compagnons) | L'appui long qui fait défiler vite n'est dit qu'en infobulle. | « Un point par toucher ; gardez le doigt appuyé pour aller plus vite. » |
| 8 | **− / + des emplacements de sorts** (fiche modifiable) | On peut croire qu'ils dépensent un emplacement : ils changent leur nombre. Aucune explication, même à la souris. | « Changent le nombre d'emplacements (objet, règle spéciale). Pour dépenser, cochez un rond. » |
| 9 | **Abréviations** : « Sauv. », « Discr. désav. », C / R / M des sorts, PC PA PE PO PP | Le sens complet est en infobulle seulement. | Une ligne de légende, comme celle des compétences (voir les tableaux). |
| 10 | **Roues dentées** (armes, armures) | Icône seule ; leur nom n'existe qu'en infobulle. | Arme : « Règle l'arme : bonus magique, dé, maîtrise, dégâts en plus. » |

Juste après ces dix : les boutons de **Sorcellerie sauvage** (« Bouffée ? (d20) », « Table (d100) »),
les pastilles **« Dégâts en plus » à allumer** sous une arme, la pastille **« Niv. »** d'un don
(elle replie la description, on la prend pour une simple étiquette), le curseur **« Opacité »**
(il règle la fiche, pas le fond) et le bouton **« Au combat »** du grimoire.

### Candidats au retrait ou au regroupement (avis franc, à trancher)

| Contrôle | Constat | Proposition |
|---|---|---|
| **Filtres des armes** (« Toutes », « Courantes », « Guerre », « Corps à corps », « Distance », « Magiques ») | Six pastilles pour trier un tableau qui a d'habitude 2 à 5 armes. Une ligne entière d'écran pour un usage rare. | Retirer, ou les cacher sous un bouton « Filtrer » replié. |
| Bouton **« Infobulles des sorts »** (icône de bulle, barre du grimoire) | Icône seule. Éteint par erreur, les descriptions de sorts « disparaissent » sans qu'on comprenne pourquoi. Rarement changé. | Retirer (descriptions toujours actives) ou le déplacer dans le menu « Gestion ». |
| Menu **« Liste de sorts »** (barre du grimoire) | Ne change que la liste proposée quand on ajoute un sort. La classe du personnage est déjà le bon choix presque toujours. | Le garder pour les cas rares (Découvertes magiques, multiclasse), mais plus discret ; ou le mettre dans la liste qui s'ouvre avec ▾. |
| **« Dés utilisés »** (à côté des PV) et la ligne **« N dés de vie disponibles sur X »** (sous les boutons de repos) | Même information deux fois, et dans deux sens contraires (utilisés / disponibles) : source d'erreur. | N'en garder qu'un sens, de préférence « disponibles ». |
| Case **« Taille »** (en-tête) | Texte libre, alors que l'espèce choisie donne la taille. | À discuter : la remplir d'après l'espèce, ou la retirer de l'en-tête. |
| Liste **« Dés de vie »** (d6 à d12) | La fiche la remplit déjà en choisissant la classe. | La garder (multiclasse, cas particuliers), mais sans phrase : ce n'est pas un réglage courant. |
| **« Cinéma »** | Gadget pour admirer le fond d'écran. Ne gêne pas. | Garder si Franck y tient ; sinon, le premier à retirer pour alléger le menu. |
| Pastille d'état **« Épuisement »** | Elle ne coche rien : elle emmène à la case « Épuisement » de l'encadré Repos. Double voulu, mais surprenant. | Garder, avec sa phrase (voir section 4.6). |

Deux petites incohérences relevées en passant (rien à voir avec les explications, mais à corriger) :

- La barre de mise en forme des grands textes a **deux boutons « G »** côte à côte : « Gras » et
  « Grande » taille. Proposition : écrire la taille « A- / A / A+ » ou « Petit / Normal / Grand ».
- Le Mode d'emploi (« Les repos ») dit que l'encadré « Repos » contient les dés de vie ; à l'écran,
  ils sont à côté des PV, dans la rangée du haut.

### Trois façons d'afficher les phrases sur tablette

| Façon | Comment ça se voit | Avantages | Inconvénients |
|---|---|---|---|
| **A. Phrase sous le bouton** | Une petite ligne grise, toujours visible, sous le contrôle (comme déjà sous « Choisir dans la liste » des outils). | Rien à apprendre ; lisible tout de suite. | Prend de la place : à réserver aux 10 ou 15 contrôles les plus utiles, et seulement fiche modifiable. |
| **B. Petite icône « ? » qui déplie** | Un « ? » à côté du contrôle ; on le touche, la phrase s'ouvre dessous, on le retouche, elle se replie. | Prend peu de place ; on lit seulement ce qu'on veut. | Ajoute des dizaines de petits boutons ; il faut viser juste au doigt. |
| **C. Mode « Aide » à cocher** | Une case « Aide » dans le menu « Gestion ». Cochée, toutes les phrases de cette étude apparaissent sous leurs contrôles ; décochée, la fiche redevient compacte. | Parfait pour découvrir la fiche ou pour un nouveau joueur ; aucune place perdue en jeu. | Il faut penser à l'allumer ; une fiche avec toutes les phrases est longue. |

La fiche a déjà une quatrième façon, pour une dizaine de repères : **toucher → la phrase s'écrit
dans la barre du haut**. Elle est discrète et marche bien pour un repère qu'on touche de toute façon
(⚠, « Pas d'emplacement »), mais pas pour un bouton qui agit (le toucher le déclenche).

**Suggestion** (à trancher) : C pour tout, plus A pour les 3 ou 4 cas où un joueur se trompe
vraiment (bonus de combat, − / + des emplacements, Perception passive). Le réglage « Aide » serait
gardé sur l'appareil, comme les encadrés repliés : rien ne change dans la sauvegarde du personnage.

### Comment lire les tableaux

- **Ce qu'il fait** : d'après le code, pas d'après son nom.
- **Explication aujourd'hui** : « infobulle » = texte qui n'apparaît qu'à la souris ; « nom
  accessible » = texte lu seulement par les lecteurs d'écran ; « notice » = rubrique du Mode
  d'emploi ; « phrase » = texte déjà écrit à l'écran.
- **Au doigt ?** : **Oui** (lisible sur tablette sans rien faire de spécial), **Barre** (le toucher
  écrit la phrase dans la barre du haut), **Fenêtre** (la fenêtre qui s'ouvre explique tout avant
  d'agir), **Non** (rien de lisible au doigt).
- **Phrase proposée** : 15 mots au plus, au joueur, sans mot technique. « — » quand le nom suffit.
- **Intérêt** : **Utile** (un joueur peut hésiter), **Déjà clair** (le nom suffit), **À discuter**.

## 2. Barre « Gestion » (en haut, tous onglets)

### 2.1 Commandes de la fiche

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| « Gestion » (≡) | Sur tablette, déplie ou replie toutes les commandes de la barre. | Notice « Le menu Gestion » | Oui | — | Déjà clair |
| « Modifiable » / « Verrouillée » (cadenas) | Verrouille la fiche : seuls les champs de jeu (PV, cases, sorts cochés, repos…) restent modifiables ; les boutons d'ajout et de suppression se cachent. | Infobulle ; notice « Fiche verrouillée ou modifiable » | Non | « Verrouillée : seuls PV, cases et repos se changent, pour jouer sans risque. » | Utile |
| « Nouvelle fiche » | Remplace la fiche par une fiche vierge, après confirmation ; l'ancienne est gardée dans « Revenir à… ». | Infobulle ; fenêtre de confirmation ; notice | Fenêtre | — | Déjà clair |
| « Importer » | Remplace la fiche par un fichier ou un texte exporté. | Infobulle ; phrase dans la fenêtre ; notice | Fenêtre | « Remplace cette fiche par une fiche exportée (fichier ou texte). » | À discuter (on peut croire qu'il ajoute un personnage) |
| « Exporter » | Ouvre la fenêtre pour télécharger la fiche en fichier ou copier son texte. | Infobulle ; phrases dans la fenêtre ; notice | Fenêtre | « Garde une copie de la fiche dans un fichier, pour la sauver ou la partager. » | Utile (la fiche s'enregistre déjà seule : à quoi bon ?) |
| « Imprimer » | Ouvre l'impression du navigateur (papier A4 ou PDF). | Infobulle ; notice | Oui | — | Déjà clair |
| « Revenir à… » | Liste les états précédents de la fiche gardés sur l'appareil (ouverture, avant un repos long, une montée de niveau…) et en rouvre un. | Infobulle ; phrase dans la fenêtre ; notice | Fenêtre | « Rouvre une version précédente de la fiche, gardée sur cet appareil. » | Utile (le nom ne dit pas « sauvegardes ») |
| « Mode d'emploi » | Ouvre la notice, avec sommaire. | Infobulle | Oui | — | Déjà clair |
| « Essayer un personnage d'exemple » | Ouvre un personnage fictif prêt à jouer ; la fiche ouverte est gardée dans « Revenir à… ». | Infobulle ; fenêtre ; notice | Fenêtre | — | Déjà clair |
| Case « Mode Odyssée » | Cochée : espèces, sous-classes, style de combat et Points de Foi de l'Odyssée proposés. Décochée : ils sortent des listes (rien n'est effacé). | Infobulle qui change selon la fiche ; message dans la barre après le changement ; notice | Barre (après coup) | « Cochée : les règles de l'Odyssée des Seigneurs Dragons sont proposées. » | Utile (on hésite avant de décocher) |

### 2.2 Affichage

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Lune / soleil (icône seule) | Passe au thème sombre ou clair. | Infobulle, nom accessible ; notice | Non | « Passe la fiche en couleurs sombres ou claires. » | Utile (icône seule) |
| « Cinéma » | Cache la fiche pour voir le fond d'écran ; devient « Quitter le mode cinéma ». | Infobulle ; notice | Non | « Cache la fiche pour admirer le fond d'écran. » | À discuter (gadget, voir les candidats au retrait) |
| « Sans animation » | Coupe les reflets et effets animés sur cet appareil (ou dit que l'appareil les coupe déjà). | Infobulle ; message dans la barre ; notice | Barre | — | Déjà clair |
| « Fonds » | Ouvre la galerie des images de fond. | Infobulle ; notice | Oui | — | Déjà clair |
| Curseurs « Position » et « Zoom » | Cadrent l'image de fond (hauteur, grossissement). | Infobulle avec la valeur ; notice | Non | « Cadrent l'image de fond : hauteur et grossissement. » | À discuter |
| Curseur « Opacité » | Rend la **fiche** plus ou moins transparente (pas le fond). | Infobulle ; notice | Non | « Rend la fiche plus transparente pour voir le fond à travers. » | Utile (on croit qu'il règle le fond) |

### 2.3 Compte en ligne et barre d'état

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| « Se connecter » / « Déconnexion » | Ouvre la fenêtre de connexion, ou déconnecte. | Phrase dans la fenêtre ; notice | Fenêtre | — | Déjà clair |
| « Mes personnages » | Liste les personnages du compte pour en ouvrir ou supprimer un. | Phrases dans la fenêtre ; notice | Fenêtre | — | Déjà clair |
| « Enregistrer en ligne » (seulement quand la fiche n'est pas dans le compte) | Ajoute cette fiche au compte sans rien écraser. | Infobulle ; notice | Non | « Ajoute cette fiche à votre compte, sans rien écraser. » | Utile (rare, on hésite avec « Exporter ») |
| État du compte (texte à droite) | Dit si la fiche est en ligne, en attente d'envoi, ou sur l'appareil seulement ; le détail (adresse, erreur) est en infobulle. | Texte visible ; détail en infobulle | En partie | « Dit où la fiche est enregistrée : en ligne ou sur cet appareil. » | À discuter (le détail d'une erreur est perdu au doigt) |
| Dernier message et sa petite flèche | Toucher le message coupé l'affiche en entier ; encore une fois, le replie. | Infobulle ; notice « Les phrases d'aide » | Oui | — | Déjà clair |
| Numéro de version | Simple texte : la version installée sur l'appareil. | Infobulle | Oui | — | Déjà clair |

### 2.4 Boutons des fenêtres de la barre

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Importer : « Choisir un fichier .json… », « Importer le texte collé », « Annuler » | Charge la fiche depuis un fichier ou un texte collé. | Phrases et titres dans la fenêtre | Fenêtre | — | Déjà clair |
| Exporter : « Télécharger », « Copier dans le presse-papiers », « Fermer » | Enregistre un fichier, ou copie le texte pour le recoller ailleurs. | Phrases dans la fenêtre | Fenêtre | — | Déjà clair |
| Revenir à… : « Revenir » (un par état) | Rouvre cet état, après confirmation. | Phrase en tête de la fenêtre | Fenêtre | — | Déjà clair |
| Fonds : vignettes, ✕ « Retirer de la galerie », « Ajouter », « Image de l'appareil » | Choisit un fond, en retire un, en ajoute par adresse ou depuis l'appareil. | Infobulles ; libellés | Oui (sauf ✕ : infobulle) | — | Déjà clair |
| Fonds : fenêtre « Image volumineuse » (« Afficher quand même », « Annuler ») | Image de l'appareil trop lourde : l'affiche sans la mémoriser (elle disparaît au rechargement), ou renonce. | Phrase dans la fenêtre | Fenêtre | — | Déjà clair |
| Connexion : « Connexion », « Créer un compte », « Mot de passe oublié ? » | Se connecter, créer le compte, recevoir un lien. | Phrase dans la fenêtre | Fenêtre | — | Déjà clair |
| Mes personnages : « Ouvrir », poubelle | Ouvre ce personnage ; le supprime du compte (confirmation). | Infobulle (poubelle) ; confirmation | Fenêtre | — | Déjà clair |
| Exemples : « Ouvrir cet exemple » | Ouvre le personnage d'exemple. | Fenêtre | Fenêtre | — | Déjà clair |
| Mode d'emploi : sommaire, « Imprimer le mode d'emploi », « Fermer » | Va à une rubrique ; imprime toute la notice. | Infobulle (imprimer) | Oui | — | Déjà clair |
| Mode d'emploi : « Rubrique suivante : … » (bas de chaque rubrique) | Passe à la rubrique suivante sans revenir au sommaire. | Libellé (titre de la rubrique suivante) | Oui | — | Déjà clair |
| Nouveautés : « Mode d'emploi », « Compris » | Montre les nouveautés de la version installée. | Fenêtre | Fenêtre | — | Déjà clair |
| Fenêtres de choix du compte (« Ouvrir la version en ligne », « Remplacer la version en ligne », « Garder… », « Ne rien faire », « Décider plus tard ») | Choisit quelle version garder quand l'appareil et le compte ne sont pas d'accord. | Liste d'explications dans la fenêtre | Fenêtre | — | Déjà clair |
| Fenêtre « Changement de nom » (« Renommer « … » », « Créer une copie « … » », « Annuler (garder l'ancien nom) ») | Le nom du personnage a changé : renomme la fiche du compte, en fait une copie sous le nouveau nom, ou remet l'ancien nom. | Phrase dans la fenêtre | Fenêtre | — | Déjà clair |
| Fenêtres « Personnage introuvable en ligne » (« La remettre dans mon compte », « La garder dans ce navigateur seulement »), « Fiche non enregistrée en ligne » (« Ouvrir « … » quand même », « Annuler »), « Nom déjà utilisé » (« Compris ») | Disent ce qui arrive à la fiche du compte (supprimée ailleurs, pas encore envoyée, nom pris) et proposent la suite. | Phrases dans la fenêtre | Fenêtre | — | Déjà clair |
| Connexion : cases adresse et mot de passe, « Annuler » ; « Choisissez un nouveau mot de passe » (« Enregistrer », « Plus tard ») ; « Lien expiré ou déjà utilisé » (« Compris ») | Saisie du compte ; après le lien « Mot de passe oublié ? », enregistre le nouveau mot de passe ; dit qu'un lien reçu par e-mail ne marche plus. | Phrases et libellés dans la fenêtre | Fenêtre | — | Déjà clair |
| Fenêtre « Fiche du navigateur illisible » (au démarrage) : « Télécharger la copie de secours », « Fermer » | La fiche gardée sur l'appareil est abîmée : une fiche vierge s'ouvre et l'ancien texte peut être téléchargé pour être réparé. | Phrases dans la fenêtre | Fenêtre | — | Déjà clair |

## 3. En-tête de la fiche (tous onglets)

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| « Nom du personnage » | Texte libre. | Libellé | Oui | — | Déjà clair |
| « Classe » (liste) | Choisit la classe ; met à jour le dé de vie et vide une sous-classe d'une autre classe. | Libellé ; notice | Oui | — | Déjà clair |
| « Niveau » (liste 1 à 20) | Change le niveau à la main. | Libellé | Oui | — | Déjà clair |
| « + » à côté du Niveau (fiche modifiable) | Ouvre « Passer au niveau N » : ce qui change, PV gagnés, puis niveau et PV maximum mis à jour. | Infobulle, nom accessible ; notice | Non | « Passe au niveau suivant et montre ce qui change. » | Utile (deux « + » dans l'en-tête) |
| Fenêtre « Passer au niveau N » : ronds « Valeur fixe » / « Mon jet de dN » et sa case, case « Ajouter aussi ces PV aux PV actuels » | Choisit les PV gagnés (valeur fixe ou dé lancé par le joueur) ; le nouveau maximum s'écrit en direct. | Phrases dans la fenêtre (« PV maximum : 39 → 46 ») | Fenêtre | — | Déjà clair |
| Fenêtre « Passer au niveau N » : « Passer au niveau N », « Annuler » | Garde la fiche dans « Revenir à… », puis change le niveau et les PV maximum ; la fenêtre liste les choix à faire ensuite (dons, sous-classe, sorts). | Liste dans la fenêtre ; message dans la barre | Fenêtre | — | Déjà clair |
| « Historique » (liste) | Choisit l'historique ; son détail est dans l'onglet Aptitudes & Traits. | Libellé ; notice | Oui | — | Déjà clair |
| « Espèce » (liste) | Choisit l'espèce ; ses traits s'affichent dans Aptitudes & Traits. | Libellé ; notice | Oui | — | Déjà clair |
| « Sous-classe » (liste) | Choisit la sous-classe de la classe. | Libellé ; notice | Oui | — | Déjà clair |
| « Taille » | Texte libre. | Libellé | Oui | — | À discuter (voir les candidats au retrait) |
| « XP » | Texte libre ; dessous, une ligne dit combien il manque pour le niveau suivant. | Libellé ; ligne de progression ; notice | Oui | — | Déjà clair |
| « + » à côté des XP | Ouvre un pavé de chiffres pour ajouter les XP gagnés. | Infobulle, nom accessible ; notice | Non | « Ajoute les XP gagnés à la séance, sans calcul. » | Utile (deux « + ») |
| Les quatre onglets | Changent la partie de la fiche affichée. | Libellés ; notice | Oui | — | Déjà clair |

## 4. Onglet « Caractéristiques & Combat »

### 4.1 Caractéristiques (colonne de gauche)

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Valeur de caractéristique (×6) | Saisie de la Force… au Charisme ; le modificateur est calculé dessous. | Libellé ; notice | Oui | — | Déjà clair |
| Rond « Sauv. » (×6) | Coché : le jet de sauvegarde est maîtrisé, son bonus est calculé. | Nom accessible ; notice | Non | Légende : « Rond « Sauv. » coché : vous maîtrisez ce jet de sauvegarde. » | Utile (abréviation) |
| Pastilles dorées ★ (sous une valeur, un jet, une compétence, la CA, l'Initiative, la Vitesse, les PV max, les jets contre la mort, la ressource de classe) | Disent qu'un don, un trait d'espèce ou une capacité change cette valeur ; un toucher ouvre le détail. | Infobulle, nom accessible ; texte visible (« ★ Vigilant ») | En partie | « Touchez la pastille pour voir ce que ce don change ici. » | Utile (on ne devine pas qu'elle s'ouvre) |

### 4.2 Valeurs du haut

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Écusson « Classe d'armure » | Toucher : une bulle détaille le calcul (armure, Dextérité, bouclier, dons…). | Nom accessible | Non | « Touchez la CA pour voir son calcul. » | Utile |
| « Initiative » | Valeur calculée ; son détail (« Dex +2, Vigilant +2 ») n'est que dans une infobulle, la case ne se touche pas. | Infobulle | Non | « Dextérité plus vos bonus ; touchez pour le détail. » (demande de rendre la case touchable comme la CA) | Utile (information perdue au doigt) |
| « Perception passive » | Valeur calculée ; fiche modifiable, la toucher permet d'en écrire une autre ; effacer revient au calcul. | Infobulle, nom accessible | Non | « Calculée. Touchez-la pour écrire une autre valeur ; effacez pour revenir au calcul. » | Utile |
| « Points de Foi » (mode Odyssée) et ses petits − / + autour du titre | Points à dépenser en faveurs divines ; − / + changent un point. | Notice ; infobulle des − / + | En partie | « Points à dépenser en faveurs divines ; − et + changent un point. » | Utile |
| Pastille dorée « +N par niveau » sous les Points de Foi | Ouvre la fenêtre des faveurs (1, 3 ou 5 points) avec les boutons « Dépenser ». | Infobulle, nom accessible ; notice | Non | « Touchez pour voir les faveurs divines et dépenser vos points. » | Utile |
| Pièce « Inspiration héroïque » | Toucher l'allume (« Disponible ») ou l'éteint (« Non disponible »). | Infobulle qui change ; mot visible ; message dans la barre ; notice | Oui | « Touchez quand vous la gagnez, retouchez quand vous la dépensez. » | À discuter (le mot « Disponible » aide déjà) |
| Fenêtre « Points de Foi » : « Dépenser » (×3), « Les dieux de Thyléa », « Retour », « Fermer » | Retire les points de la case ; montre les dieux et leurs faveurs. | Phrases dans la fenêtre ; « Possible » / « Il manque… » visibles ; notice | Fenêtre | — | Déjà clair |
| « Vitesse » | Texte libre. | Libellé | Oui | — | Déjà clair |

### 4.3 Points de vie et dés de vie

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| « PV actuels », « PV maximum », « PV temp. » | Saisie des points de vie. | Libellés ; notice | Oui | — | Déjà clair |
| − / + des PV actuels et des PV temporaires | Un point par toucher ; appui long : défilement rapide. | Infobulle « appui long : plusieurs » ; notice | Non | « Un point par toucher ; gardez le doigt appuyé pour aller plus vite. » | Utile (l'appui long ne se devine pas) |
| « Dégâts / Soins » | Pavé de chiffres : un montant, puis « Dégâts », « Soins » ou « PV temp. » ; il donne aussi le DD de Concentration. | Libellé ; notice | Oui | — | Déjà clair |
| « Dés de vie » (d6 à d12) | Le dé de vie ; rempli tout seul en choisissant la classe. | Libellé | Oui | — | À discuter (voir les candidats au retrait) |
| « Dés utilisés » (0 au niveau) | Nombre de dés de vie déjà dépensés. | Libellé | Oui | « Dés de vie déjà dépensés ; le repos long les rend. » | À discuter (en double avec la ligne « disponibles » du Repos) |

### 4.4 Ressource de classe et capacités à cocher

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Cases de la ressource de classe (Rage, Inspiration bardique…) | Une case cochée = une utilisation dépensée ; chaque case se coche seule (pas de remplissage des précédentes) ; le repos les vide. | Nom accessible ; notice « Les capacités à cocher » | Non | « Cochez une case par utilisation ; le bon repos les rend. » | Utile |
| Cases des dons et capacités de classe, de sous-classe ou d'espèce à usages limités | Une case cochée = un usage dépensé ; toucher la 3e coche les 3 premières, décocher la 1re les vide toutes ; à côté, une phrase dit l'usage et quand elles reviennent. Celles des dons se retrouvent aussi dans l'encadré du don (onglet Aptitudes & Traits). | Phrases visibles (« Chanceux · repos long ») | Oui | — | Déjà clair |
| « Bouffée ? (d20) » (Sorcellerie sauvage) | La fiche lance le d20 qui dit si une Bouffée se produit. | Infobulle | Non | « Après un sort d'Ensorceleur avec emplacement : la fiche lance le d20. » | Utile |
| « Table (d100) » (Sorcellerie sauvage) | La fiche tire directement un résultat sur la table des Bouffées. | Infobulle | Non | « Tire un effet sur la table des Bouffées (quand le MJ le demande). » | Utile |

### 4.5 Jets contre la mort

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Ronds « Succès » et « Échecs » (3 + 3) | Notent les jets à 0 PV. | Libellés ; notice | Oui | — | Déjà clair |

### 4.6 États et Concentration

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Pastilles d'état (À terre, Empoisonné…) | Toucher coche ou décoche l'état ; son rappel s'affiche dessous. | Rappel visible ; notice | Oui | — | Déjà clair |
| Pastille « Épuisement » | Ne coche rien : fait défiler jusqu'à la case « Épuisement » de l'encadré Repos. | Infobulle | Non | « L'Épuisement se règle dans l'encadré Repos : touchez pour y aller. » | Utile |
| « Tout retirer » | Décoche tous les états (pas l'Épuisement). | Infobulle ; notice | Oui | — | Déjà clair |
| Liste « Concentration » | Note le sort sur lequel on se concentre ; rappelle le jet de Constitution après des dégâts. | Rappel visible une fois choisi ; notice | En partie | « Choisissez le sort que vous maintenez ; la fiche rappelle le jet après des dégâts. » | Utile (vide, on ne sait pas à quoi elle sert) |
| « Terminer » (Concentration rompue) | Vide la Concentration. | Phrase visible | Oui | — | Déjà clair |

### 4.7 Armes

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Pastilles de bonus de combat (Rage, Attaque sournoise, Marque du chasseur, Duel, Cogneur lourd, Charge, Frénésie, Manœuvre, Frappe psionique, Visée infaillible, Dans l'ombre, Monté sur le dragon…) | Allumée : le bonus s'ajoute aux dégâts des armes concernées (ou un repère s'affiche près de la CA). | Infobulle détaillée pour chacune ; notice « Les bonus de combat » | Non | Commune : « Allumez-la quand le bonus s'applique : il s'ajoute aux dégâts des armes. » Plus une phrase par bonus, reprise de son infobulle en plus court. | Utile (le plus important de l'étude) |
| Pastille rouge ⚠ à côté de Rage | Rage sans effet en armure lourde ; toucher écrit pourquoi. | Infobulle ; message dans la barre ; notice | Barre | — | Déjà clair |
| Filtres « Toutes », « Courantes », « Guerre », « Corps à corps », « Distance », « Magiques » | N'affichent que les armes de ce genre. | Notice | Oui | — | À discuter (voir les candidats au retrait) |
| « Ajouter une arme ou un sort mineur » | Ajoute une ligne vide au tableau. | Libellé ; notice | Oui | — | Déjà clair |
| « Annuler la suppression » | Rétablit l'arme supprimée juste avant. | Libellé | Oui | — | Déjà clair |
| Nom de l'arme et bouton ▾ | Toucher le nom vide ou ▾ ouvre la liste des armes du manuel, sans clavier. | Infobulle ; message dans la barre à l'ouverture ; notice | Barre | — | Déjà clair |
| Bouton des rappels (sous le bonus d'attaque) | Déplie sous l'arme les rappels des dons qui la concernent. | Texte visible (noms des dons) ; infobulle | Oui | — | Déjà clair |
| Case « Dégâts » (se touche) | Affiche les dégâts écrits en entier, avec les dégâts en plus. | Message dans la barre | Barre | « Touchez les dégâts pour les lire en entier. » | Utile (rien ne dit qu'elle se touche) |
| Pastilles « Dégâts en plus » à allumer (sous l'arme) | Allumée : ces dégâts s'ajoutent quand la condition est remplie (« contre les dragons »). | Infobulle ; notice | Non | « Allumez-la quand la condition est remplie : ces dégâts s'ajoutent. » | Utile |
| Pastille « livre » de la botte d'arme | Ouvre la règle de la botte (Coup double, Ralentissement…). | Infobulle, nom accessible | Non | « Touchez pour lire la règle de la botte de cette arme. » | Utile (petite, ne se remarque pas) |
| Gemme d'objet magique (+1, +2, +3) | Toucher écrit l'effet de l'objet magique dans la barre. | Infobulle ; message dans la barre | Barre | — | Déjà clair |
| Cases « Propriétés », « Botte d'arme », « Munitions » (« Mun. » sur tablette), « Notes » | Texte libre, rempli d'après le manuel quand on choisit l'arme dans la liste. | Titres de colonne ; « Mun. » : infobulle seulement | En partie | Écrire « Munitions » en entier, ou l'ajouter à une légende. | À discuter (abréviation) |
| Roue dentée « Configuration de l'arme » | Ouvre les réglages de l'arme. | Infobulle ; notice | Non | « Règle l'arme : bonus magique, dé, maîtrise, dégâts en plus. » | Utile (icône seule) |
| Poubelle « Supprimer l'arme » | Supprime la ligne, après confirmation ; « Annuler la suppression » la rend. | Infobulle ; confirmation | Fenêtre | — | Déjà clair |

**Fenêtre « Configuration de l'arme »**

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| « Caractéristique d'attaque » | Auto (Force ou Dextérité selon l'arme), ou forcée (Pacte de la lame, Gourdin magique…). | Libellés des choix | Oui | « Laissez « Auto », sauf capacité spéciale (Pacte de la lame, Gourdin magique). » | Utile |
| « Bonus magique » | Ajoute +1 à +3 à l'attaque et aux dégâts. | Libellé | Oui | — | Déjà clair |
| « Dé de dégâts (facultatif) » | Remplace le dé de l'arme. | Phrase sous le champ | Oui | — | Déjà clair |
| « Type de dégâts » | Auto, ou un autre type. | Libellé « Auto (selon les données de l'arme) » | Oui | — | Déjà clair |
| « Arme maîtrisée » | Auto, Oui ou Non : compte ou non le bonus de maîtrise. | Phrase sous le champ | Oui | — | Déjà clair |
| « Dégâts en plus » : dégâts, raison, « Quand » (Toujours / À allumer), poubelle « Retirer ce dégât en plus », « Ajouter un dégât en plus » | Ajoute à l'arme des dégâts permanents ou à allumer en jeu (quatre au plus). | Phrase sous le titre (elle cite la corbeille) ; infobulle de la poubelle | Oui | — | Déjà clair |
| « Annuler », « Appliquer », puis « Continuer à modifier » / « Fermer sans appliquer » | Garde ou abandonne les changements. | Fenêtre de confirmation | Fenêtre | — | Déjà clair |

### 4.8 Armures, boucliers & autres avantages défensifs

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Ronds « Légères », « Intermédiaires », « Lourdes », « Boucliers » | Maîtrises d'armures du personnage. | Libellés ; notice | Oui | — | Déjà clair |
| « Ajouter une armure » | Ajoute une ligne vide. | Libellé ; notice | Oui | — | Déjà clair |
| Nom de l'armure et bouton ▾ | Ouvre la liste des armures du manuel, sans clavier. | Infobulle ; message dans la barre ; notice | Barre | — | Déjà clair |
| Valeur « CA » (se touche) | Bulle avec le calcul de cette ligne. | Infobulle sur le titre de colonne seulement ; notice | Non | « Touchez la CA pour voir son calcul. » | Utile |
| Case « Discr. désav. » | Cochée : Désavantage en Discrétion avec cette armure. | Infobulle sur le titre de colonne | Non | « Cochée : Désavantage en Discrétion quand vous la portez. » | Utile (abréviation) |
| Cases « For min. », « Poids », « Prix », « Commentaire » | Texte libre, rempli d'après le manuel. Si la Force du personnage est sous « For min. », un ⚠ s'affiche sur la ligne. | Titres de colonne | En partie | « For min. » : « Force minimale ; en dessous, votre Vitesse baisse. » | À discuter (abréviation) |
| Case « Équipée / actif » | Seul ce qui est coché compte dans la CA (et pour la Rage en armure lourde). | Libellé ; notice | Oui | « Cochez ce que vous portez : seul ce qui est coché compte. » | À discuter |
| Avertissement ⚠ de la ligne | Toucher écrit le problème dans la barre (Force trop basse, armure non maîtrisée…). | Infobulle ; message dans la barre | Barre | — | Déjà clair |
| Roue dentée « Réglages » | Ouvre type, valeur de base et bonus magique. | Infobulle | Non | « Règle le type, la valeur de base et le bonus magique. » | Utile (icône seule) |
| Poubelle « Supprimer » | Supprime la ligne, après confirmation. | Infobulle ; confirmation | Fenêtre | — | Déjà clair |
| Fenêtre « Réglages » : « Type », « Valeur de base », « Bonus magique », « Reprendre les valeurs du manuel », « Annuler » / « Appliquer » | Règle le calcul de CA de la ligne. | Phrases sous les champs ; confirmation si on ferme sans appliquer | Oui | — | Déjà clair |

### 4.9 Repos

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| « Épuisement (0-6) » et ses − / + | Niveau d'épuisement ; ses effets s'écrivent à côté. | Libellé ; effets visibles | Oui | — | Déjà clair |
| « Repos court (1 h) » | Ouvre la fenêtre : dés de vie à dépenser, soins, capacités rendues. | Libellé ; fenêtre ; notice | Fenêtre | — | Déjà clair |
| « Repos long (8 h) » | Après confirmation, rend PV, dés de vie, emplacements et capacités ; garde d'abord la fiche dans « Revenir à… ». | Libellé ; fenêtre ; notice | Fenêtre | — | Déjà clair |
| Fenêtre repos court : − / + « Dés à dépenser », « Total des dés », case « Restauration ensorcelée », « Lancer les dés », « Saisir le total », « Annuler » | Dépense des dés de vie, lancés par la fiche ou par le joueur. | Phrases dans la fenêtre | Fenêtre | — | Déjà clair |
| Fenêtre repos long : « Se reposer », « Annuler », puis « Préparer mes sorts » / « Plus tard » | Confirme le repos ; propose ensuite de préparer les sorts. | Fenêtre | Fenêtre | — | Déjà clair |

## 5. Onglet « Aptitudes & Traits »

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| « Alignement » | Texte libre. | Libellé | Oui | — | Déjà clair |
| Choix de l'espèce (listes sous un trait : lignée, ascendance…) | Retient l'option du trait ; la fiche en tire ses calculs. | Repère « À choisir » visible | Oui | — | Déjà clair |
| « Appliquer à la fiche » (historique) | Après confirmation, coche les compétences de l'historique et remplit le don de niveau 1 s'il est vide ; depuis la 4.48.0, note aussi l'outil précis de l'historique (un outil au choix ne l'est pas) ; les caractéristiques ne changent pas (la fenêtre le dit). | Phrase visible à côté (ce qui sera écrit) ; notice | Oui | — | Déjà clair |
| « Choisir dans la liste » sur la ligne « Outil » de l'historique (fiche modifiable) | Ouvre la fenêtre « Outils maîtrisés », avec l'outil de l'historique en tête. | Phrase visible à côté | Oui | — | Déjà clair |
| Replis « À venir : … » (traits d'espèce, aptitudes de classe, capacités de sous-classe) | Déplient ce que le personnage gagnera aux niveaux suivants. | Libellé (noms et niveaux) | Oui | — | Déjà clair |
| « Traits de personnage » (texte) | Texte libre. | Notice | Oui | — | Déjà clair |
| Listes des dons (une par niveau) | Choisit le don de ce niveau ; dessous, « Dans la fiche » dit ce qu'elle en fait. | Repères visibles ; notice | Oui | — | Déjà clair |
| Pastille « Niv. N » d'un don | Replie ou déplie la description du don. | Infobulle, nom accessible | Non | « Touchez « Niv. » pour replier ou déplier la description du don. » | Utile (on la prend pour une étiquette) |
| Choix sous un don (listes, cases) | Retient le choix du don (caractéristique, sorts, compétences…). | Libellés ; repère « À vérifier » | Oui | — | Déjà clair |
| Choix de sous-classe (listes, cases, compteurs − / +) | Retient l'option de la capacité ; les compteurs suivent une valeur de jeu. | Libellés ; phrase « quand » à côté | Oui | — | Déjà clair |
| « Autres écoles, non choisies » (et blocs semblables) | Déplie les options non retenues. | Libellé | Oui | — | Déjà clair |
| « Capacités de classe » (texte) | Texte libre sous les capacités calculées. | Notice | Oui | — | Déjà clair |
| Carte de compagnon : − / + des PV, PV actuels | Suit les PV du compagnon. | Nom accessible ; infobulle des − / + | Oui | — | Déjà clair |
| « Compagnons & familiers » (texte) | Texte libre. | Notice | Oui | — | Déjà clair |
| « Synergie entre joueurs » (texte) | Texte libre. | Notice | Oui | — | Déjà clair |

## 6. Onglet « Compétences & Histoire »

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Premier rond d'une compétence (×18) | Maîtrise : le bonus de maîtrise s'ajoute. | Légende visible en tête (« maîtrise / expertise ») ; notice | Oui | — | Déjà clair |
| Second rond d'une compétence (×18) | Expertise : le bonus de maîtrise compte double. | Légende visible ; notice | Oui | — | Déjà clair |
| « Maîtrises d'armes » (texte) | Texte libre ; rappel calculé au-dessus. | Phrase visible dessous | Oui | — | Déjà clair |
| « Outils » (texte) et « Choisir dans la liste » | Ouvre la fenêtre « Outils maîtrisés » ; cocher écrit le nom dans la case. | Phrase visible dessous ; notice | Oui | — | Déjà clair |
| Fenêtre « Outils maîtrisés » : recherche, cases, « Fermer » | Coche ou décoche les outils du manuel. | Phrases dans la fenêtre | Fenêtre | — | Déjà clair |
| « Langues » (texte) | Texte libre. | Notice | Oui | — | Déjà clair |
| « Destin héroïque » (liste, Odyssée) | Choisit le destin du héros. | Libellé ; notice | Oui | « Le destin de votre héros, propre à l'Odyssée. » | À discuter |
| « Points de renommée » et ses petits − / + (Odyssée) | Note la renommée (0 à 20) ; le palier s'affiche à côté. | Libellé ; infobulle des − / + ; notice | Oui | — | À discuter |
| « Apparence », « Histoire & personnalité » (textes) | Textes libres. | Notice | Oui | — | Déjà clair |

## 7. Onglet « Magie, équipement & trésors »

### 7.1 Les trois cases du haut et l'ouverture du grimoire

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| « Caractéristique d'incantation » (liste) | Choisit la caractéristique des sorts ; DD et bonus d'attaque sont calculés. | Libellé ; notice | Oui | — | Déjà clair |
| Bouton qui ouvre ou replie le grimoire (personnage sans magie) | Montre le grimoire pour noter un sort donné par un don ou une espèce. | Phrase visible au-dessus | Oui | — | Déjà clair |

### 7.2 Barre du grimoire

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Pastilles « Tous », 0, 1… 9 | N'affichent que les sorts du niveau choisi. | Nom accessible (« Sorts mineurs (niveau 0) ») ; notice | En partie | « 0 = sorts mineurs. » | À discuter (seul le 0 pose question) |
| « Au combat » | Ne garde que les sorts lançables (mineurs, préparés, donnés), avec un bouton « Lancer ». | Infobulle ; notice | Non | « Ne montre que les sorts lançables, avec un bouton « Lancer ». » | Utile |
| « Préparer mes sorts » (Clerc, Druide…) | Ouvre la liste de la classe pour cocher les sorts du jour. | Infobulle ; phrase dans la fenêtre ; notice | Fenêtre | — | Déjà clair |
| « Liste de sorts » (menu) | Change la liste proposée quand on ajoute un sort. | Infobulle ; notice | Non | « La liste où piocher un nouveau sort ; d'habitude, celle de votre classe. » | À discuter (voir les candidats au retrait) |
| Bouton bulle (icône seule) | Allume ou éteint la description qui s'ouvre en touchant un nom de sort. | Infobulle, nom accessible ; notice | Non | « Allume ou éteint la description qui s'ouvre en touchant un sort. » | À discuter (voir les candidats au retrait) |

### 7.3 Emplacements de sorts

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Ronds des emplacements | Coché = emplacement dépensé ; le repos long les rend. | Nom accessible ; notice | Oui | — | Déjà clair |
| − / + d'un niveau d'emplacements (fiche modifiable) | Changent le **nombre** d'emplacements de ce niveau (ne dépensent rien). | Nom accessible seulement | Non | « Changent le nombre d'emplacements (objet, règle spéciale). Pour dépenser, cochez un rond. » | Utile |
| « Emplacements niv. N » (fiche modifiable) | Ajoute le suivi d'un niveau d'emplacements de plus (Arcanum mystique, multiclasse). | Nom accessible seulement | Non | « Ajoute une ligne d'emplacements d'un niveau de plus. » | Utile |

### 7.4 Tableau des sorts

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Titres « Niv. », « Nom », « École » | Trient le tableau ; troisième toucher : ordre du grimoire. | Infobulle | Oui | — | Déjà clair |
| Losange ◇ / ◆ | Touchable : prépare ou non le sort ; plein et fixe : toujours préparé (le toucher dit pourquoi). | Infobulle ; message dans la barre (losange fixe) ; notice | En partie | Légende : « ◇ non préparé, ◆ préparé : touchez pour changer. » | Utile |
| Signe ∞ | Sort mineur : toujours disponible. | Infobulle | Non | Ajouter à la même légende : « ∞ sort mineur ». | À discuter |
| « Niv. » (liste), « Nom » et ▾, « École », « Temps d'incant. », « Portée », « Notes » | Description du sort ; ▾ ouvre la liste des sorts sans clavier. | Infobulle (▾) ; message dans la barre ; notice | Barre | — | Déjà clair |
| Cases « C », « R », « M » | Concentration, Rituel, composante matérielle. | Infobulle ; notice | Non | Légende : « C : Concentration · R : Rituel · M : composante matérielle. » | Utile (abréviations) |
| Repère « Lançable en rituel » (Magicien) | Toucher écrit l'explication du Savoir rituel. | Infobulle ; message dans la barre ; notice | Barre | — | Déjà clair |
| Repère « Pas d'emplacement » | Toucher écrit pourquoi ce sort ne peut pas encore être lancé. | Message dans la barre ; notice | Barre | — | Déjà clair |
| Repères « Adepte (feu) », « +Cha (+4, feu) » | Le sort profite d'Adepte élémentaire ou d'Affinité élémentaire. Ce repère ne se touche pas. | Infobulle seulement | Non | « Ce sort profite de votre don Adepte élémentaire. » (et le rendre touchable comme « Pas d'emplacement ») | Utile (information perdue au doigt) |
| Nom d'un sort (toucher) | Ouvre une bulle avec la description du sort. | Notice | Oui | — | Déjà clair |
| « Lancer » (vue « Au combat ») | Ouvre la fenêtre « Lancer » : choix de l'emplacement, qui se coche tout seul. | Infobulle ; phrase dans la fenêtre ; notice | Fenêtre | — | Déjà clair |
| Poubelle | Supprime le sort, après confirmation. | Infobulle ; confirmation | Fenêtre | — | Déjà clair |
| ✕ de la ligne de saisie | Vide la ligne en cours, sans rien supprimer d'enregistré. | Infobulle ; message dans la barre | Barre | — | Déjà clair |
| « Ajouter un sort » | Ajoute une ligne. | Libellé | Oui | — | Déjà clair |
| « Retirer les sorts non préparés » | Montre les sorts que la classe ne prépare plus, puis les retire. | Infobulle ; fenêtre ; notice | Fenêtre | — | Déjà clair |
| « Rituels du livre » (repli, Magicien) | Déplie les rituels du livre non préparés. | Infobulle ; message dans la barre ; notice | Barre | — | Déjà clair |
| Dans « Rituels du livre » : nom du sort et « Lancer » | Le nom ouvre la description ; « Lancer » ouvre la fenêtre « Lancer » réduite au choix « En rituel » (sans emplacement). | Infobulle, nom accessible ; phrase dans la fenêtre | Fenêtre | — | Déjà clair |

### 7.5 Sorts donnés (dons, sous-classe, espèce)

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Nom du sort | Ouvre la bulle de description. | Notice | Oui | — | Déjà clair |
| « Lancer » (vue « Au combat » seulement, sorts de niveau 1 et plus) | Ouvre la fenêtre « Lancer ». | Infobulle | Oui | — | Déjà clair |
| Case de lancer gratuit | Cochée : le lancer gratuit est utilisé ; revient au repos dit à côté. | Phrase visible (« 1 lancer sans emplacement, de nouveau après… ») ; notice | Oui | — | Déjà clair |
| « Autres terrains, pas préparés » (et blocs semblables) | Déplie les sorts non retenus. | Libellé | Oui | — | Déjà clair |

### 7.6 Fenêtres du grimoire

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| « Lancer » : « Niveau N », « Lancer gratuit », « En rituel », « Arcanum mystique », case « Me concentrer sur ce sort », « Annuler » | Dépense l'emplacement choisi (ou rien) et note la Concentration. | Petites phrases sous chaque bouton (« reste 2 », « +10 min, sans emplacement ») | Fenêtre | — | Déjà clair |
| « Préparer mes sorts » : recherche, cases, « Fermer » | Coche les sorts préparés ; compteur en direct. | Phrases dans la fenêtre | Fenêtre | — | Déjà clair |
| « Retirer les sorts non préparés » : cases, « Annuler », « Retirer » | Retire les sorts listés. | Phrases dans la fenêtre | Fenêtre | — | Déjà clair |

### 7.7 Équipement & trésor

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| « Équipement & trésor » (texte) | Texte libre. | Notice | Oui | — | Déjà clair |
| Cases PC, PA, PE, PO, PP | Nombre de pièces de chaque métal. | Infobulle sur l'abréviation ; nom accessible ; notice | Non | Légende : « PC cuivre · PA argent · PE électrum · PO or · PP platine. » | Utile (abréviations) |
| « Bourse : gagner / dépenser » | Pavé de chiffres : choisir la pièce, le montant, puis « Gagner » ou « Dépenser ». | Libellé ; notice | Oui | — | Déjà clair |

## 8. Commun à toute la fiche

| Contrôle | Ce qu'il fait | Explication aujourd'hui | Au doigt ? | Phrase proposée | Intérêt |
|---|---|---|---|---|---|
| Pastilles de repli (flèche près d'un titre) | Replient ou rouvrent l'encadré ; le choix reste sur l'appareil. | Infobulle ; notice | Non | — | Déjà clair (geste courant sur tablette) |
| Barre de mise en forme des textes (G, I, S ; P, N, G ; six couleurs et « Couleur par défaut ») | N'apparaît qu'en sélectionnant des mots dans un grand texte (fiche modifiable), ou par un clic droit ; met ces mots en gras, italique, souligné, taille ou couleur. | Infobulles ; notice | Non | « Mettez les mots choisis en gras, italique, souligné, taille ou couleur. » | Utile (deux « G », voir le résumé) |
| Pavés de chiffres (Dégâts / Soins, XP, Bourse) | Gros chiffres, puis un bouton d'action ; la fenêtre reste ouverte pour enchaîner. | Résultat écrit dans la fenêtre | Fenêtre | — | Déjà clair |
| Boutons « Fermer », « Annuler », « OK », ✕ des fenêtres | Ferment la fenêtre (avec question si un réglage n'est pas appliqué). | Libellés | Oui | — | Déjà clair |

## 9. Annexe : si Franck retient une façon d'afficher

Pistes pour la suite, sans engagement :

- Les phrases retenues seraient rangées dans un seul fichier de données (une phrase par contrôle),
  avec un test qui vérifie qu'aucune ne dépasse 15 mots et que chaque contrôle visé existe encore.
- Le choix « Aide » (façon C) ou l'état des « ? » dépliés (façon B) seraient gardés sur l'appareil,
  comme les encadrés repliés : **rien ne change dans la sauvegarde du personnage**, une fiche
  existante reste identique.
- Le Mode d'emploi garderait les explications longues ; les phrases de cette étude n'en sont que
  le résumé d'une ligne.
- À l'impression, les phrases ne seraient pas imprimées.

## 10. Relecture

Relecture de complétude du 23/11/2026 : l'inventaire a été comparé à `index.html` et à tous les
modules de `js/ui/` (grimoire, armes, fenêtres ouvertes par `modal.js`, menu « Gestion », repos,
montée de niveau, compte, nouveautés, éditeur de style, avis de démarrage). Les chiffres du
résumé (section 1) tiennent compte de ce qui suit.

**13 contrôles ajoutés** (165 → 178) :

- Barre « Gestion » (2.4) : « Rubrique suivante » du Mode d'emploi ; fenêtre « Image
  volumineuse » des fonds ; fenêtres du compte « Changement de nom », « Personnage introuvable en
  ligne » / « Fiche non enregistrée en ligne » / « Nom déjà utilisé », connexion et nouveau mot de
  passe / lien expiré ; fenêtre « Fiche du navigateur illisible » au démarrage.
- En-tête (3) : la fenêtre « Passer au niveau N » (choix des PV, puis ses deux boutons), qui
  manquait.
- Armes (4.7) : cases « Propriétés », « Botte d'arme », « Munitions » (« Mun. »), « Notes ».
- Armures (4.8) : cases « For min. », « Poids », « Prix », « Commentaire ».
- Aptitudes & Traits (5) : « Choisir dans la liste » de la ligne « Outil » de l'historique ;
  replis « À venir : … ».
- Grimoire (7.4) : nom et « Lancer » des rituels du livre.

Parmi eux, 11 « déjà clair » et 2 « à discuter » (les abréviations « Mun. » et « For min. »,
expliquées « en partie » au doigt).

**6 descriptions corrigées** d'après le code :

- Ressource de classe (4.4, et la proposition n° 6 du résumé) : ses cases se cochent une à une ;
  ce sont les cases des dons et capacités qui cochent les précédentes en même temps.
- Cases à usages limités (4.4) : elles concernent aussi les capacités de classe et d'espèce, et
  celles des dons reviennent dans l'encadré du don.
- Configuration de l'arme (4.7) : on retire un dégât en plus avec une poubelle, pas un ✕ ; quatre
  au plus par arme.
- « Appliquer à la fiche » (5) : coche les compétences et remplit le don de niveau 1 s'il est
  vide ; les caractéristiques ne changent pas (l'outil précis est noté depuis la 4.48.0).
- « Lancer » des sorts donnés (7.5) : visible seulement en vue « Au combat ».
- Barre de mise en forme (8) : elle n'apparaît qu'en sélectionnant des mots (ou par clic droit) ;
  elle a aussi « Couleur par défaut ».

Rien d'autre n'a été changé : les avis, propositions et candidats au retrait restent ceux de la
première lecture.
