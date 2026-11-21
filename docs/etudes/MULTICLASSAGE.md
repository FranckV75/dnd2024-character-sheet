# Étude : le multiclassage (un personnage à plusieurs classes) — version contre-vérifiée

Étude du 21/11/2026 (demande de Franck du 18/11/2026), faite sur la version 4.43.1 (commit
`ec2e65e`), puis relue point par point par un second lecteur. C'est une étude : rien n'est
construit, aucun fichier du dépôt n'a été modifié, rien n'a été publié, Supabase n'a pas été
contacté, les vraies sauvegardes des joueurs n'ont pas été lues.

Comment lire ce document :

- les numéros de lignes sont ceux du commit `ec2e65e` (4.43.1). Depuis, la 4.44.0 (mode Odyssée)
  a été préparée sur la branche : les lignes de quelques fichiers ont bougé (voir piège 15) ;
- « PHB » = Manuel des joueurs 2024 en anglais (le PDF), « FR » = vos photos du manuel français ;
- les règles sont résumées avec mes mots, jamais recopiées ;
- **(corrigé)** marque ce que la relecture a changé, **(ajouté)** ce qu'elle a ajouté. Ce qui
  n'est pas marqué a été vérifié et gardé tel quel.

Bilan de la relecture, en une phrase : les règles, les numéros de lignes et les mesures d'écran de
la première étude sont exacts (tous recontrôlés) ; la recommandation tient ; les corrections
portent sur la place réelle de l'ancien site, sur des parties de la fiche oubliées dans
l'inventaire (surtout la **maîtrise des armes**, que la fiche calcule), sur les dons, sur les
pages du livre français et sur six pièges de sauvegarde en plus.

Vocabulaire : la **classe de départ** est celle du niveau 1 du personnage ; les **classes en
plus** sont celles prises ensuite ; le **niveau total** est la somme des niveaux de toutes les
classes.

## En bref

- **C'est faisable sans casser les fiches existantes.** Le conseil est confirmé : garder les
  cases actuelles telles quelles (« Classe » = classe de départ, « Niveau » = niveau total) et
  ajouter **une seule nouvelle information facultative**, la liste des classes en plus. Une fiche
  qui n'a pas cette information reste une fiche à une classe, exactement comme aujourd'hui : rien
  à convertir.
- **(corrigé) L'ancien site (v3) n'est plus en ligne depuis le 27/10/2026** (la 4.0.0 l'a
  remplacé ; il ne reste que l'étiquette de secours `v3-final`). La compatibilité avec lui est
  donc un **filet de sécurité** (retour en arrière, onglet resté ouvert), pas un usage de tous
  les jours. Avec le format conseillé, il ouvrirait toujours la fiche : classe de départ, niveau
  total, bonus de maîtrise juste. S'il enregistrait, il effacerait les classes en plus en ligne ;
  la tablette qui a la fiche les remettrait seule, comme elle le fait déjà pour les emplacements
  de sorts.
- **Les règles sont courtes** (2 pages, PHB p. 44-45), mais elles touchent presque toute la
  fiche. **(corrigé)** Environ 33 des 48 fichiers de règles et une quinzaine de fichiers d'écran
  lisent « la » classe ou « le » niveau (la première étude en comptait 24 et 10) : 103 lectures
  directes du niveau, 253 mentions de la classe.
- **Le point le plus délicat est la magie** : emplacements calculés avec une table commune, magie
  de pacte de l'Occultiste à part, sorts préparés comptés classe par classe, chaque sort rattaché
  à une classe.
- **(ajouté) Bonne nouvelle pour le cas Clerc / Magicien** du bouton « Retirer les sorts non
  préparés » : une protection simple peut arriver dès la première version visible, sans attendre
  le lot « magie » (un sort qui figure aussi sur la liste d'une autre de vos classes n'est plus
  proposé au retrait).
- **(ajouté) Vos multiclassés actuels devront être « déclarés » une fois** : aujourd'hui leur
  fiche porte une seule classe, un niveau (total ou non, on ne le sait pas) et des emplacements
  ajoutés à la main. Une petite étape guidée posera les questions et remettra les emplacements
  sur le calcul automatique.
- **Taille du chantier : gros.** 5 lots, publiés en 3 versions, en commençant par un socle
  invisible pour les joueurs. Rien n'est à construire avant vos réponses (point 8).
- **Photos** : les pages du multiclassage en français (chapitre 2, sans doute p. 44 et 45) ne
  sont pas photographiées. Détail au point 9.

## 1. Les règles (résumé)

Source : PHB p. 44-45 (« Multiclassing »), p. 41-42 (montée de niveau), p. 33 (tableau des
classes), et le bloc « en tant que personnage multiclassé » de chaque classe. Tout a été relu
dans le PDF : le résumé de la première étude est exact.

**(corrigé) Noms français** vérifiés sur 5 photos (Barbare FR p. 51, Moine FR p. 127, Occultiste
FR p. 135, Paladin FR p. 147, et Rôdeur FR p. 157 relu pour cette contre-vérification). Le livre
français dit bien « **multiclassage** », « en tant que **personnage multiclassé** »,
« **emplacements de sort** », « Sorts préparés », « Caractéristique d'incantation », « Formation
aux armures », « Bottes d'arme », « Dé de vie », « Caractéristique principale ».

**Le principe (p. 44).** À chaque montée de niveau, on peut prendre un niveau dans une nouvelle
classe au lieu de continuer la sienne.

**Prérequis (p. 44).** Il faut 13 ou plus dans la caractéristique principale de la nouvelle
classe **et** de chacune des classes qu'on a déjà.

| Classe | Caractéristique principale | À avoir à 13 |
|---|---|---|
| Barbare | Force | Force |
| Barde, Ensorceleur, Occultiste | Charisme | Charisme |
| Clerc, Druide | Sagesse | Sagesse |
| Guerrier | Force **ou** Dextérité | l'une des deux |
| Magicien | Intelligence | Intelligence |
| Moine, Rôdeur | Dextérité **et** Sagesse | les deux |
| Paladin | Force **et** Charisme | les deux |
| Roublard | Dextérité | Dextérité |

**XP (p. 44).** Le seuil du niveau suivant dépend du niveau total.

**Points de vie et dés de vie (p. 44, p. 42).** Les PV « de niveau 1 » (dé au maximum) ne se
gagnent qu'une fois, avec la classe de départ. Chaque niveau suivant donne les PV de la classe
qui monte (jet de son dé ou valeur fixe : 7 Barbare ; 6 Guerrier, Paladin, Rôdeur ; 5 Barde,
Clerc, Druide, Moine, Roublard, Occultiste ; 4 Ensorceleur, Magicien ; plus la Constitution). Les
dés de vie s'additionnent ; ceux du même type forment une seule réserve, ceux de types différents
se comptent à part (exemple du manuel : Clerc 5 / Paladin 5 = cinq d8 et cinq d10).

**Bonus de maîtrise (p. 44).** Il suit le niveau total.

**Maîtrises (p. 44 et chaque classe).** En prenant une nouvelle classe, on ne reçoit qu'une
partie de ses maîtrises de départ. **(ajouté)** Les jets de sauvegarde maîtrisés, l'équipement de
départ et la liste complète des maîtrises ne viennent que de la **classe de départ** : c'est pour
cela que l'ordre des classes compte et que la fiche doit retenir laquelle est la première.

| Nouvelle classe | Ce qu'on reçoit en plus du dé de vie | PHB | **(ajouté)** FR |
|---|---|---|---|
| Barbare | armes de guerre, boucliers | 51 | 51 |
| Barde | 1 compétence au choix, 1 instrument de musique, armures légères | 59 | 59 (probable) |
| Clerc | armures légères et intermédiaires, boucliers | 69 | 69 (probable) |
| Druide | armures légères, boucliers | 79 | 79 (probable) |
| Guerrier | armes de guerre, armures légères et intermédiaires, boucliers | 91 | 105 |
| Moine | rien d'autre | 101 | 127 |
| Paladin | armes de guerre, armures légères et intermédiaires, boucliers | 109 | 147 (déduit) |
| Rôdeur | armes de guerre, 1 compétence de la liste du Rôdeur, armures légères et intermédiaires, boucliers | 119 | 157 |
| Roublard | 1 compétence de la liste du Roublard, outils de voleur, armures légères | 129 | 167 |
| Ensorceleur | rien d'autre | 139 | 91 |
| Occultiste | armures légères | 153 | 135 |
| Magicien | rien d'autre | 165 | 115 (déduit) |

À noter : personne ne gagne les armures lourdes en multiclassant. **(corrigé)** Les pages
françaises des classes ne sont pas celles du livre anglais : le livre français range les classes
dans l'ordre alphabétique français (pages FR d'après `INDEX.md`).

**Aptitudes de classe (p. 44).** On reçoit les aptitudes du niveau atteint **dans cette classe**,
**(ajouté)** y compris toutes celles du niveau 1 de la nouvelle classe (Bottes d'arme, Rage,
Style de combat du Guerrier, Sorts…). La sous-classe arrive au niveau 3 de la classe, les dons aux
niveaux 4, 8, 12, 16 de la classe (plus 6 et 14 pour le Guerrier, 10 pour le Roublard), la faveur
épique au niveau 19 de la classe. Trois cas particuliers :

- **Classe d'armure** : plusieurs façons de calculer la CA ne se cumulent pas, on en choisit une.
- **Attaque supplémentaire** : venue de deux classes, elle ne s'additionne pas ; on ne dépasse
  deux attaques que si une aptitude le dit (Guerrier niveau 11). Même chose avec la manifestation
  Lame assoiffée de l'Occultiste.
- **Sorts** : voir ci-dessous.

**Magie (p. 44-45).**

- Si une seule classe donne l'aptitude Sorts, on suit simplement la table de cette classe.
- Avec deux classes de lanceur ou plus, les **emplacements** viennent d'une table commune (p. 45).
  On additionne : tous les niveaux de Barde, Clerc, Druide, Ensorceleur, Magicien ; la moitié
  (arrondie **au supérieur**) des niveaux de Paladin et Rôdeur ; un tiers (arrondi à l'inférieur)
  des niveaux de Guerrier ou Roublard s'il est Chevalier occulte ou Arnaqueur arcanique.
- **(ajouté) Deux précisions utiles au calcul**, vérifiées sur les tables de la fiche :
  la table des demi-lanceurs (Paladin, Rôdeur) est exactement la table commune lue à « moitié du
  niveau, arrondie au supérieur » : une seule formule suffit pour eux, seuls ou multiclassés.
  En revanche la table du Chevalier occulte et de l'Arnaqueur arcanique seuls est **plus
  généreuse** que « un tiers arrondi à l'inférieur » (3 emplacements au niveau 4, contre 2 par la
  formule). La règle « une seule classe à Sorts : on suit sa table » doit donc être programmée
  pour de bon : un Chevalier occulte 4 / Barbare 1 garde sa table, un Chevalier occulte 4 /
  Magicien 1 passe à la table commune.
- **(ajouté) Point flou du manuel** : pour un Paladin / Rôdeur, faut-il additionner les deux
  niveaux puis prendre la moitié, ou arrondir chaque classe à part ? La phrase se lit plutôt
  « on additionne, puis on prend la moitié ». La différence n'existe que si les deux niveaux sont
  impairs (Paladin 1 / Rôdeur 1…). À trancher par le MJ (question 13).
- Les **sorts préparés** se comptent classe par classe, comme si chaque classe était seule
  (nombre de sorts, niveau maximum). Exemple du manuel : Rôdeur 4 / Ensorceleur 3 a des
  emplacements de niveau 3 mais ne peut préparer aucun sort de niveau 3. **(ajouté)** Pour la
  fiche, cela veut dire deux nombres différents : « les emplacements que j'ai » (table commune)
  et « le plus haut niveau de sort que cette classe peut préparer » (table de la classe seule, à
  son niveau). Aujourd'hui la fiche confond les deux (un seul calcul).
- Chaque sort préparé **appartient à une classe** et utilise la caractéristique d'incantation de
  cette classe (donc un DD et un bonus d'attaque par classe).
- Les **sorts mineurs** qui grandissent le font avec le niveau total.
- **Magie de pacte** (Occultiste) : ses emplacements restent à part (ils reviennent au repos
  court, PHB p. 153-154) et ne comptent pas dans l'addition ci-dessus, mais ils peuvent servir à
  lancer les sorts des autres classes, et inversement.

**Ce que le manuel 2024 ne dit pas** (à trancher avec le MJ, voir point 8) :

- Conduit divin du Clerc (p. 70) et du Paladin (p. 110) : le texte parle du Conduit divin « de
  cette classe » ; il n'y a plus de règle de multiclassage à ce sujet. Lecture la plus directe :
  deux réserves séparées.
- Bottes d'arme de deux classes (Barbare 2 types, Guerrier 3…) : rien n'est écrit sur le cumul.
- Prérequis « Niveau 4+ » des dons (dons p. 202 et suivantes ; règle générale des prérequis
  p. 199) : le manuel ne précise pas s'il s'agit du niveau total ; c'est la lecture habituelle.
  **(ajouté)** Il précise seulement qu'un prérequis de classe demande au moins 1 niveau dans
  cette classe.

## 2. Ce que la fiche fait aujourd'hui

**Une seule lecture, un seul couple classe + niveau.** Toute la fiche passe par `deriveCharacter`
(`js/rules/character.js:609-698`) : le niveau vient de `char_level` (ligne 610), le bonus de
maîtrise de ce niveau (611), la classe de `char_class` (612-613), la sous-classe de
`char_subclass` (614). Le résultat (`level`, `classSlug`, `subclass`, `spellSlots`,
`classResource`, `hitDie`, lignes 661-697) est ensuite lu partout. C'est une bonne nouvelle : il
y a **un seul point d'entrée** à faire évoluer. La mauvaise : le mot `level` sert aujourd'hui à
deux choses que le multiclassage sépare.

Toutes les références de fichiers et de lignes ci-dessous ont été recontrôlées une à une dans le
commit `ec2e65e` : elles sont exactes.

**Ce qui doit suivre le niveau total** (déjà juste si « Niveau » reste le total) :

| Sujet | Où |
|---|---|
| Bonus de maîtrise | `js/rules/logic.js:19`, `js/rules/character.js:611` |
| XP et palier suivant | `js/rules/experience.js:43` |
| Traits d'espèce (souffle, sorts d'espèce) | `js/rules/species.js:103-146` |
| Don Robuste (2 PV par niveau), don Gaillard | `js/rules/feat-effects/general.js:22-25`, `203-209` |
| Nombre total de dés de vie | `js/rules/rest.js:53-63`, `index.html:254-257` |
| Libellé des sauvegardes de secours | `js/state/snapshots.js:196-197`, `js/ui/snapshots.js:20` |
| **(ajouté)** Dons d'origine, choix de dons « à partir du niveau N » | `js/rules/feat-choices.js:279` |
| **(ajouté)** Don épique pris « avant le niveau 19 » (avertissement) | `js/rules/feat-effects.js:186` |

**Ce qui doit suivre le niveau dans la classe** (faux pour un multiclassé tant que la fiche ne
connaît qu'un niveau) :

| Sujet | Où (commit `ec2e65e`) |
|---|---|
| Ressource de classe (Rages, Conduit divin, Second souffle…) : **une seule**, cases `class_res_N` | `js/rules/logic.js:45-128`, `js/ui/sheet.js:418-430` |
| Dégâts de Rage, dé des Arts martiaux, Attaque sournoise, Marque du chasseur | `js/rules/logic.js:244`, `272` ; `js/rules/character.js:424`, `453`, `473-522` |
| Boutons de combat (Rage, Sournoise, Marque) : ceux d'**une** classe | `js/rules/weapons.js:38-42`, `349-399` |
| **(ajouté)** Libellés des boutons de combat (bonus de Rage, dé de supériorité, dés psioniques) | `js/ui/weapons.js:100-176`, `822`, `855`, `1162` ; `js/rules/subclass-combat.js` |
| Dé de vie de la classe, imposé au changement de classe | `js/rules/character.js:51`, `js/ui/sheet.js:281-288` |
| **(ajouté)** Liste « Dés utilisés » de 0 au niveau | `js/ui/sheet.js:405-409` |
| CA sans armure (Barbare, Moine, Draconique, Danse) | `js/rules/class-features.js:133-148`, `js/rules/character.js:296-333` |
| Aura de protection, Touche-à-tout, vitesse de classe | `js/rules/class-features.js:87`, `99`, `348` |
| **(ajouté) Maîtrise des armes, calculée d'après la classe** (sans elle, pas de bonus de maîtrise à l'attaque) et case « Maîtrises d'armes » | `js/rules/class-features.js:204-313`, `js/rules/character.js:482`, `js/rules/feat-effects/weapon-notes.js:145`, `js/ui/weapons.js:939`, `js/ui/sheet.js:442` |
| **(ajouté)** Formation aux armures « déjà donnée par la classe » (dons d'armure) | `js/rules/feat-effects/helpers.js:62-64` |
| **(ajouté)** Sauvegardes maîtrisées par la classe (don Résilient) : à lire sur la classe **de départ** seulement | `js/rules/feat-effects/choice-notes.js:25`, `109` |
| **(ajouté)** « A la capacité Sorts » (prérequis de dons), Arts martiaux et dons, option à la place du style | `js/rules/feat-effects/helpers.js:128-129`, `145`, `163` ; `js/rules/feat-effects/epic.js:53` |
| Table d'aptitudes de la classe, sorts mineurs et sorts préparés permis | `js/rules/class-progression.js:40`, `63`, `79`, `108` ; `js/ui/class-progression.js:42-58` |
| Rappels de classe, formation aux sauvegardes | `js/rules/class-reminders.js:118-140` |
| Sous-classe : capacités, calculs, cases, choix, compagnons, formes | `js/rules/subclass-features.js:714`, `765` ; `subclass-calcs.js:72-241` ; `subclass-uses.js:430-439` ; `subclass-choices.js:63`, `152` ; `subclass-companions.js:444` ; `subclass-forms.js:40` ; **(ajouté)** `js/ui/subclass.js:159-162` |
| **(ajouté)** Sous-classes à mécanique propre : Magie sauvage, Muse épique (Odyssée) | `js/rules/wild-magic.js:88-122`, `js/rules/epic-poem.js:86-136` |
| **(ajouté)** Concentration (la Rage la rompt ; Rôdeur 13) | `js/rules/concentration.js:81-82` |
| **(ajouté)** Lancers gratuits : Ennemi juré du Rôdeur, compté dans les cases `class_res_N` | `js/rules/free-casts.js:71-74`, `127` |
| Bottes d'arme (nombre de types par classe) | `js/rules/weapon-masteries.js:182-199` |
| Dons : emplacements atteints selon `char_level`, emplacements réservés à une classe | `js/state/schema.js:35`, `49-55` ; `js/rules/feats.js:92-104`, `127-156`, `180-193` ; `js/rules/level-up.js:108` |
| « Passer au niveau » : une classe, un dé, un niveau | `js/rules/level-up.js:68-83`, `241-265`, `273-281` ; `js/ui/level-up.js:31-42`, `101` |
| Repos : dés de vie, Restauration magique, Restauration ensorcelée, magie de pacte | `js/rules/rest.js:53-63`, `166-174`, `191-193`, `243-250`, `365-366` |
| Emplacements de sorts d'une classe | `js/data/dd-rules.js:736-778`, `js/rules/character.js:64`, `692` |
| Suivi des emplacements (un compteur par niveau de sort) | `js/rules/spells.js:496-584`, `js/ui/spells/slots.js:66` |
| Caractéristique d'incantation : **une seule**, choisie à la main | `index.html:436-437`, `js/rules/character.js:377`, `691` ; `js/ui/sheet.js:443-444` |
| Liste de sorts proposée, niveau maximum proposé | `js/rules/spells.js:168-176`, `js/rules/spell-picker.js:25`, `66-76` ; `js/ui/spells.js:517-537` |
| Sorts préparés : liste fixe ou à cocher, selon **la** classe | `js/rules/spell-preparation.js:44-78`, `120-123`, `320-357` |
| Fenêtre « Préparer mes sorts » | `js/ui/spells/prepare.js:39`, `82-94`, `193` |
| Bouton « Retirer les sorts non préparés » | `js/rules/spell-preparation.js:530-551`, `js/ui/spells/cleanup.js:37-39` |
| Grimoire du Magicien, rituels du livre, Arcanum mystique | `js/rules/spellbook.js:45`, `115` ; `js/rules/spell-preparation.js:258` ; `js/ui/spells.js:945-953`, `1059` |
| En-tête : une liste « Classe », une liste « Niveau » de 1 à 20, une liste « Sous-classe » | `index.html:89-130`, `js/ui/sheet.js:230-233`, `396-403` |
| Impression de l'en-tête | `css/print.css:420-436` |
| **(ajouté)** Textes et outils : notice, personnages d'exemple, page de validation des développeurs, une phrase qui cite déjà « multiclasse » | `js/data/help.js`, `js/data/examples.js`, `dev/validation.js`, `js/data/subclass-choices.js:203` |

**Ce que la fiche fait déjà bien pour le multiclassage** :

- La CA sans armure est déjà une liste de formules dont la fiche retient **la meilleure, une
  seule** (`js/rules/character.js:316-333`) : il suffira d'y mettre les formules de toutes les
  classes.
- « Attaque supplémentaire » n'est qu'un texte de rappel (`js/data/class-progression.js:31`,
  `158`, `213`, `269`, `296`) : aucun calcul ne risque de l'additionner.
- La table commune du lanceur multiclassé (PHB p. 45) est **la même** que celle des lanceurs
  complets, déjà dans la fiche (`js/data/dd-rules.js:639-660`, recomparée ligne par ligne avec le
  PDF) : pas de nouvelle table à saisir. La table de pacte y est aussi (`709-730`).
- Les cases des capacités à usages (`subclass_uses`), les choix de sous-classe
  (`subclass_choices`) et les compagnons sont déjà rangés **par classe ou sous-classe**
  (`js/rules/subclass-uses.js:375`, `js/rules/subclass-choices.js:8-11`). **(ajouté)** Les
  compteurs des aptitudes de base (Fougue, Inflexible, Coup de chance…) y sont déjà rangés par
  classe (`js/rules/subclass-uses.js:432-439`).
- Le suivi des emplacements accepte déjà un niveau ajouté à la main (`js/rules/spells.js:564-578`) :
  c'est le contournement actuel.
- **(ajouté)** Les PV maximum ne sont pas calculés par la fiche : c'est une saisie, que « Passer
  au niveau » augmente. Il n'y a donc **aucun recalcul de PV** à écrire, seulement le bon dé au
  moment de monter.
- **(ajouté)** Le filtre « classe du grimoire » existe déjà dans la sauvegarde
  (`spell_class_filter`, `js/rules/spells.js:168`) : c'est ce qui permet aujourd'hui à un Clerc /
  Magicien de chercher dans la liste du Magicien. Il servira tel quel.
- **(ajouté)** Les choix et usages des dons sont rangés par numéro d'emplacement
  (`js/rules/feat-choices.js:305`, `js/rules/feat-spells.js:46`) : garder les mêmes emplacements
  ne déplace rien.

**Ce que la fiche dit aujourd'hui à un multiclassé** : « Classe non reconnue (ou multiclasse) :
seuls le niveau et les points de vie sont calculés » (`js/rules/level-up.js:262`).

**Données à corriger au passage** : la caractéristique principale du Barde est notée Charisme et
Dextérité (`js/data/dd-rules.js:27`) alors que le manuel dit Charisme seul (PHB p. 33 et 59) ;
et la liste ne distingue pas « ou » (Guerrier) de « et » (Moine, Paladin, Rôdeur). Vérifié :
aucun autre fichier ne lit cette donnée aujourd'hui ; elle servira aux prérequis.

**(ajouté) Donnée à créer** : les maîtrises reçues en multiclassant (tableau du point 1). Elle
n'existe nulle part dans le code. Comme la fiche **calcule** la maîtrise des armes (et donc le
bonus à l'attaque), il ne suffira pas de les afficher : un Magicien qui prend un niveau de
Guerrier doit voir ses armes de guerre devenir maîtrisées.

## 3. Format de sauvegarde

### Ce qu'on ne peut pas toucher

- `char_class`, `char_subclass`, `char_level` restent tels quels (`js/state/schema.js:102-106`).
- L'ancien site (v3, étiquette `v3-final`) n'enregistre que ce que sa page affiche : il relit
  tous ses champs et reconstruit les listes ligne par ligne (`js/storage.js:119-200` de la v3,
  vérifié). Toute clé qu'il ne connaît pas disparaît quand il enregistre ; dans une ligne de
  sort, tout champ autre que niveau, nom, temps, portée, note, C, R, M, préparé, école disparaît.
- Dans la v3, « Classe » est une liste fermée (`index.html:147` de la v3, vérifié) : **il ne faut
  jamais écrire autre chose qu'un nom de classe dans `char_class`.**
- La v3 impose le dé de vie de la classe à chaque ouverture ; la v4 fait pareil pour une fiche
  v3 (`js/state/migrate.js:278-287`).
- **(corrigé) Poids réel de cette contrainte** : la v3 n'est plus servie aux joueurs depuis le
  27/10/2026. Elle ne peut réécrire une fiche que par un retour en arrière volontaire ou un
  onglet resté ouvert depuis des semaines. La vraie contrainte de tous les jours est ailleurs :
  **les fiches déjà enregistrées** (tablettes, compte en ligne, fichiers JSON) et **une tablette
  pas encore mise à jour** doivent continuer de s'ouvrir sans question ni perte.

### Les options

**Option A (conseillée, confirmée) : les cases actuelles + une clé facultative pour les classes
en plus.**

- `char_class` = classe de départ ; `char_subclass` = sa sous-classe ; `char_level` = **niveau
  total**.
- Nouvelle clé facultative, par exemple `extra_classes` : la liste des classes en plus, chacune
  avec son identifiant, sa sous-classe et son niveau. Exemple pour Clerc 3 / Magicien 2 :
  `char_class: "Clerc"`, `char_level: "5"`, `extra_classes: [{ "cls": "wizard", "sub": "evoker", "lvl": 2 }]`.
- Niveau de la classe de départ = niveau total moins les niveaux des classes en plus.
- Clé absente = une seule classe. **Aucune fiche existante ne change, rien à convertir.**
- **(ajouté)** Écrire dans la clé les **identifiants internes** (« wizard », « evoker »), pas les
  noms français : les noms français de la fiche sont encore corrigés d'après vos photos, un
  identifiant ne change jamais. La lecture reste tolérante (identifiant, nom français ou
  anglais), avec les fonctions qui lisent déjà `char_class` et `char_subclass`.
- **(ajouté)** Ce n'est pas une première : la 4.44.0 (mode Odyssée) ajoute de la même façon une
  clé facultative de réglage, absente par défaut et déclarée dans `V4_ONLY_KEYS`
  (`odyssey_mode`). Le multiclassage suit le même modèle.

**Option B : une liste complète de toutes les classes**, la classe de départ comprise, avec
`char_class` et `char_level` recopiés. Plus lisible pour un développeur, mais la même information
existe alors deux fois : si une ancienne version ou un fichier retouché change l'une sans
l'autre, la fiche se contredit et il faut des règles d'arbitrage à chaque ouverture.

**Option C : tout écrire dans la case Classe** (« Clerc 3 / Magicien 2 »). À écarter : toute la
fiche lit cette case comme un nom de classe (`js/rules/identity.js:22-31`), et la v3 l'efface.

**Option D : des cases « à plat » en plus** (`char_class_2`, `char_level_2`, `char_subclass_2`…).
Même idée que A, écrite autrement ; nombre de classes figé et trois clés par classe à déclarer.
A est plus propre : une clé, une seule écriture.

**(ajouté) Est-ce la solution la plus simple qui marche ?** Oui, pour trois raisons vérifiées
dans le code : (1) la migration garde déjà toute clé inconnue (`js/state/migrate.js:244`) et la
comparaison avec une version v3 ignore déjà les clés de `V4_ONLY_KEYS`
(`js/cloud/sync.js:143-147`) : il n'y a qu'un mot à ajouter à une liste ; (2) rien n'est écrit
dans les fiches à une classe, donc aucune empreinte ne bouge ; (3) une version plus ancienne
(v3, ou v4 pas à jour) continue de calculer quelque chose de sensé : la classe de départ au
niveau total. Le seul défaut d'A est que le niveau de la classe de départ se déduit par une
soustraction (piège 4).

### Pourquoi A tient avec les fiches déjà enregistrées et avec la v3

- **Les empreintes ne bougent pas.** La synchronisation compare une empreinte du contenu
  (`js/cloud/sync.js:43-51`), calculée sur la forme normalisée de la fiche
  (`js/cloud/controller.js:91-96`). Tant que la clé est absente des fiches à une classe, leur
  empreinte est la même qu'aujourd'hui : aucune tablette ne croira sa fiche « modifiée ».
- **La v3 ouvrirait la fiche** : elle voit une classe connue et un niveau (son champ Niveau est
  un texte libre lu comme un nombre). Bonus de maîtrise et XP justes, capacités de classe fausses
  (elle croit à une seule classe). Elle ne casse rien en lisant.
- **Si la v3 enregistrait**, la clé disparaîtrait en ligne. La v4 sait déjà reconnaître ce cas :
  une version écrite par la v3 n'est jamais chargée en silence, et si elle ne diffère de la fiche
  de l'appareil que par les clés propres à la v4, l'appareil remet son contenu en ligne sans
  poser de question (`js/cloud/controller.js:247-248`, `520-523`, `607-609`, vérifié). Il suffit
  que la nouvelle clé soit dans `V4_ONLY_KEYS` (`js/cloud/sync.js:126-136`).

### Migration (`js/state/migrate.js`)

- **Rien à convertir** pour les fiches actuelles. La clé ne doit **pas** être ajoutée à la fiche
  vierge (`js/state/schema.js:99-151`) ni créée par défaut à la lecture : faire comme pour les
  États, laissés absents quand la fiche n'en a pas (`js/state/migrate.js:314-316`).
- La migration vérifie seulement la forme (une liste) ; la lecture tolérante se fait dans une
  fonction pure des règles, testée : classe inconnue, niveau illisible, classe en double ou égale
  à la classe de départ, total des classes en plus supérieur ou égal au niveau total. Règle à
  fixer et à tester : une entrée illisible est **ignorée, jamais effacée**.
- **(ajouté)** La migration ne doit **rien réécrire** dans une liste valide (ni trier, ni changer
  un nombre en texte) : sinon la fiche enregistrée et sa forme normalisée diffèrent, et le test
  « forme déjà normalisée » des exemples (`tests/examples.test.js:87`) le signalerait.
- Tests sur des fiches fictives à publier dans `tests/fixtures/` (par exemple Clerc / Magicien,
  Guerrier / Roublard, Paladin / Occultiste, **(ajouté)** Chevalier occulte / Magicien pour la
  règle du tiers) et, sans les lire en entier, sur les vraies sauvegardes locales, qui doivent
  ressortir identiques.

### Ce qu'il faudra ranger en plus (propositions, à décider lot par lot)

| Besoin | Proposition | Nouvelle clé ? |
|---|---|---|
| Dés de vie de types différents | `hd_type` reste le dé de la classe de départ, `hd_current` reste le **total** des dés utilisés ; la part utilisée dans chaque classe en plus est notée dans `extra_classes` (voir piège 9) | Non |
| Ressource de la 2e classe (Rages + Second souffle) | `class_res_N` reste la ressource de la classe de départ ; celle d'une classe en plus va dans `subclass_uses`, qui range déjà les compteurs par classe (voir piège 13) | Non |
| Magie de pacte en plus d'emplacements ordinaires | une entrée « pacte » dans `spell_slots_state`, à côté des niveaux 1 à 9 ; un Occultiste seul ne change pas. Vérifié : une version plus ancienne ignore cette entrée sans l'effacer (`js/rules/spells.js:574-575`) | Non |
| Classe de chaque sort | voir « Classe d'un sort » ci-dessous | À décider |
| Caractéristique d'incantation par classe | calculée d'après la classe (Sagesse pour le Clerc…) ; `spell_ability` garde le réglage actuel | Non |
| Dons | voir ci-dessous | Une ou deux, pour des cas rares |

**(corrigé) Dons.** Les cinq emplacements ordinaires (`feat_4`, `feat_8`, `feat_12`, `feat_16`,
`feat_19`) peuvent rester : un personnage de niveau 20 ne peut pas gagner plus de cinq dons
ordinaires, quelle que soit la répartition (vérifié : chacun demande 4 niveaux d'une classe). Il
suffit de les lire comme « 1er don gagné, 2e don gagné… ». Ce que la première étude ne disait pas :

- les pastilles « Niv. 4 », « Niv. 8 »… et la légende « Actif au niveau 12 » devront changer pour
  un multiclassé (« 2e don : Guerrier niveau 8 ») ;
- `feat_19` n'est pas réservé aux dons épiques dans la fiche (il propose toutes les catégories,
  `js/ui/sheet.js:206`) : il peut donc servir de 5e don ordinaire ; l'avertissement « don épique
  avant le niveau 19 » (`js/rules/feat-effects.js:186`) devra regarder le niveau total ;
- les emplacements réservés lisent aujourd'hui **la** classe du personnage, donc la classe de
  départ seulement (`js/rules/feats.js:127-156`) : un Magicien / Guerrier 6 ne verrait pas le don
  du Guerrier. À étendre à toutes les classes, avec le niveau de la bonne classe ;
- styles de combat : il existe déjà deux emplacements, `feat_2` et `feat_7` (second style du
  Champion). Deux classes parmi Guerrier, Paladin, Rôdeur donnent chacune un style ; un Champion
  qui multiclasse peut en avoir trois. Il faudra donc une clé de plus (deux dans le pire cas),
  pas « une seule pour Guerrier + Paladin ou Rôdeur ».

**(ajouté) Classe d'un sort : trois façons de la noter**, à choisir au lot 4.

1. Un champ facultatif dans la ligne du sort (proposition de la première étude). Naturel, suit le
   sort quand on trie. Défaut : si une version v3 réenregistre, le champ disparaît et la
   réparation silencieuse ne marche plus (piège 2).
2. Une clé à part, propre à la v4, qui associe un nom de sort à une classe. La réparation
   silencieuse marche sans rien changer, les lignes de sorts ne sont pas touchées. Défaut : un
   sort renommé perd son rattachement ; le même sort noté deux fois ne peut pas avoir deux classes.
3. Ne rien noter quand c'est évident : la classe se **déduit** quand le sort ne figure que sur
   une seule des listes du personnage ; on ne note (par 1 ou 2) que les sorts ambigus ou corrigés
   par le joueur. Moins de données, moins de risques, et les fiches actuelles marchent sans rien
   confirmer pour la plupart des sorts.

Conseil : 3, avec le champ dans la ligne (1) pour les seuls cas ambigus. La v3 n'étant plus en
service, le défaut de 1 est petit, et on apprend de toute façon à la comparaison à ignorer ce
champ.

### Pièges

1. **Ne jamais ajouter la clé par défaut** (empreintes, voir plus haut). Le test des personnages
   d'exemple refuse d'ailleurs toute clé inconnue hors `V4_ONLY_KEYS` (`tests/examples.test.js:96`).
2. **Le champ « classe » d'un sort et la v3.** La comparaison « identique à l'état v4 près »
   (`comparableWithV3`, `js/cloud/sync.js:167-175`) ne retire aujourd'hui que des clés de premier
   niveau. Si la v3 réenregistre une fiche dont les sorts portent une classe, la question des
   deux versions sera posée au lieu d'une réparation silencieuse. Il faudra apprendre à cette
   comparaison à ignorer ce champ, avec un test. (Même défaut déjà noté pour les pastilles des
   armes, feuille de route, restes de la 4.43.0.)
3. **Un appareil neuf** qui charge une fiche réécrite par la v3 n'a pas de copie locale pour
   réparer : les classes en plus sont perdues, comme toutes les clés v4 aujourd'hui.
4. **Le niveau total peut contredire les classes en plus** (niveau baissé à la main sur une
   version plus ancienne, fichier retouché). **(corrigé)** Règle précise à écrire une fois et à
   tester : la classe de départ garde au moins 1 niveau ; le niveau total utilisé par la fiche est
   le plus grand des deux nombres « Niveau enregistré » et « 1 + niveaux des classes en plus » ;
   la fiche le signale au joueur et ne réécrit rien d'elle-même.
5. **Changer la classe de départ** remet aujourd'hui la sous-classe à zéro et impose le dé de vie
   (`js/ui/sheet.js:281-288`) ; il faudra aussi gérer le cas où la nouvelle classe figure déjà
   dans les classes en plus.
6. **Chaque écran ne se redessine que pour certaines clés** (`js/ui/spells.js:104`,
   `js/ui/armors.js:42`, `js/ui/concentration.js:24`, `js/ui/class-progression.js:86`,
   `js/ui/level-up.js:40` et `101`, `js/ui/experience.js:49`, liste recontrôlée) : la nouvelle clé
   doit être ajoutée à chaque liste, sinon l'écran reste sur l'ancienne valeur.
7. **Un Occultiste qui prend une classe de lanceur** : ses cases cochées sous « niveau 3 » étaient
   des emplacements de pacte ; elles deviendraient des emplacements ordinaires. À convertir au
   moment où la classe est ajoutée.
8. **Une tablette restée sur une version plus ancienne de la v4** garde la clé inconnue
   (`js/state/migrate.js:244`) mais calcule comme pour une seule classe (la classe de départ au
   niveau total) jusqu'à sa mise à jour. Vérifié : elle n'efface rien et n'écrit rien de faux
   toute seule.
9. **(ajouté) Dés de vie par type et version plus ancienne.** Un repos court fait sur une
   tablette pas à jour ajoute les dés dépensés au total (`hd_current`) sans savoir de quelle
   classe ils viennent ; un repos long remet le total à 0 sans toucher aux parts notées dans
   `extra_classes`. Règle de lecture à écrire et tester : les parts sont ramenées au total si
   elles le dépassent, et un total à 0 vaut « tout est récupéré ».
10. **(ajouté) Les emplacements réglés à la main par vos multiclassés actuels.** Un réglage manuel
    passe avant le calcul (`js/rules/spells.js:496-499`) et reste enregistré même quand il devient
    égal à la table. Quand la fiche saura calculer les emplacements communs, ces vieux réglages
    resteraient figés et ne suivraient plus les montées de niveau. Au moment où le joueur déclare
    ses classes, la fiche doit proposer « revenir aux emplacements calculés » (les cases cochées
    sont gardées).
11. **(ajouté) Le sens de « Niveau » sur les fiches multiclassées actuelles.** Aujourd'hui, un
    Clerc / Magicien est noté « Clerc » avec un niveau qui peut être le niveau total (pour avoir
    le bon bonus de maîtrise) ou le niveau de Clerc (pour avoir les bonnes aptitudes). La fiche
    ne peut pas le deviner : la fenêtre « Classes » doit demander le niveau de **chaque** classe
    et écrire elle-même le total (question 2).
12. **(ajouté) La question « deux versions différentes » face à une version de l'ancien site.**
    Si la v3 a réenregistré la fiche **avec** un vrai changement, la question est posée
    (`js/cloud/controller.js:524-529`). Choisir « version en ligne » charge une fiche sans classes
    en plus, qui est ensuite renvoyée en ligne par la v4 : les classes en plus sont alors perdues
    sur tous les appareils. Parades : le texte de la question doit le dire pour un multiclassé,
    et la sauvegarde de secours prise avant tout remplacement (« Revenir à… ») permet de revenir.
13. **(ajouté) Une même ressource rangée à deux endroits selon la place de la classe.** La Rage
    d'un Barbare de départ est dans `class_res_N` ; celle d'un Barbare « en plus » serait dans
    `subclass_uses`. Tout ce qui lit les cases de la ressource de classe doit connaître les deux
    rangements : le repos (`js/rules/rest.js:310-317`), l'Ennemi juré du Rôdeur
    (`js/rules/free-casts.js:71-74`), les repères posés près de la ressource (Magie sauvage, Muse
    épique). À couvrir par un test par ressource dans les deux positions.
14. **(ajouté) Liste vide ou clé absente.** Retirer la dernière classe en plus laisse une liste
    vide, qui n'a pas la même empreinte qu'une clé absente : un envoi en ligne de plus, sans
    gravité. Ne surtout pas « nettoyer » cela à la lecture (ce serait réécrire des fiches). De
    même, une fiche sans nom et sans classe reste « vierge » pour la synchronisation quelle que
    soit cette clé (`js/cloud/controller.js:75-81`), comme pour le réglage du mode Odyssée.
15. **(ajouté) Partir de la 4.44.0.** Le chantier du mode Odyssée a déjà modifié sur la branche
    des fichiers que le multiclassage touchera (`js/cloud/sync.js`, `js/cloud/controller.js`,
    `js/ui/sheet.js`, `js/rules/level-up.js`, `js/state/snapshots.js`, `index.html`). Le
    multiclassage doit partir de cette version ; les listes de sous-classes de la nouvelle
    fenêtre « Classes » devront respecter le mode Odyssée coupé, comme la liste actuelle.
16. **(ajouté) Le piège du mot `level`.** Pour une fiche à une classe, niveau total et niveau de
    classe sont égaux : **aucun test actuel ne peut voir une règle qui lit le mauvais des deux**.
    Avec 103 lectures directes et 70 lectures indirectes, un oubli est probable. Parade au point 5.

## 4. Options d'interface sur tablette

Mesures faites à l'écran (Edge invisible, tablette simulée, fiche d'essai fictive supprimée
ensuite). **(ajouté)** Refaites pour cette relecture à 768 et 820 px sur la 4.44.0 servie en
local : mêmes nombres, console à 0 erreur.

| Largeur | Case « Classe » | Case « Sous-classe » | Largeur de l'en-tête | Hauteur de l'en-tête |
|---|---|---|---|---|
| 768 px | 231 px | 353 px | 720 px | 199 px |
| 820 px | 248 px | 379 px | 772 px | 199 px |
| 1024 px | 316 px | 481 px | 976 px | 199 px |
| 1100 px | 341 px | 519 px | 1052 px | 199 px |

Dans la police de l'en-tête (Cinzel gras 18,4 px, 26 px de marges dans la case) :
« Clerc 3 / Magicien 2 » mesure 199 px, « Ensorceleur 10 / Occultiste 10 » 306 px,
« Barbare 5 / Guerrier 3 / Roublard 2 » 353 px.

### Comment afficher plusieurs classes dans l'en-tête

- **Option 1 : le résumé dans la case « Classe ».** « Clerc 3 / Magicien 2 » tient tout juste à
  768 px (199 px pour 205 disponibles) ; « Ensorceleur 10 / Occultiste 10 » ne tient qu'à partir
  de 1100 px ; trois classes ne tiennent nulle part. Il faudrait abréger ou couper : pas fiable.
- **Option 2 (conseillée) : une ligne « Classes » sur toute la largeur**, seulement pour un
  multiclassé. Elle remplace les cases « Classe » et « Sous-classe » et liste chaque classe avec
  son niveau et sa sous-classe (« Clerc 3, Domaine de la Vie · Magicien 2, Évocateur »). 720 px
  à 768 px : deux classes tiennent sur une ligne, trois passent sur deux lignes. L'en-tête
  grandit d'environ 70 px pour ces personnages seulement. La case « Niveau » affiche le niveau
  total.
- **(ajouté) Option 2 bis : garder les cases « Classe » et « Sous-classe » et ajouter la ligne
  « Classes » dessous.** Plus simple à construire (l'en-tête actuel ne bouge pas), même hauteur
  en plus. Défauts : la classe de départ est écrite deux fois, et la liste « Classe » reste
  modifiable directement pour un multiclassé, ce qui ouvre le piège 5. C'est pourquoi l'option 2
  reste conseillée ; la 2 bis est la solution de repli si la maquette de la 2 ne convainc pas.
- **Option 3 : une rangée de cases par classe** (Classe, Niveau, Sous-classe répétées). Tout se
  règle sans fenêtre, mais l'en-tête grandit de 70 px par classe et « Niveau » voudrait dire
  deux choses.

Pour un personnage à une seule classe, **rien ne change à l'écran** dans toutes les options.

### Où choisir les classes

- **Fenêtre « Classes »** (conseillée), ouverte en touchant la ligne « Classes », ou par un
  petit bouton près de « Classe » pour un personnage qui n'en a encore qu'une : une ligne par
  classe (classe, sous-classe, niveau), « Ajouter une classe », « Retirer », le niveau total
  affiché, et l'avertissement de prérequis. Fiche déverrouillée seulement, comme la classe
  aujourd'hui. Une sauvegarde de secours est gardée avant (« Revenir à… »).
- Pour un multiclassé, la case « Niveau » n'est plus modifiable directement (elle afficherait
  un total qu'on ne saurait pas répartir) : on passe par la fenêtre ou par « Passer au niveau ».
- **(ajouté) Première déclaration d'un multiclassé déjà joué** : la fenêtre demande le niveau de
  chaque classe (elle ne suppose pas que « Niveau » était le total), montre le total obtenu, et
  propose de revenir aux emplacements de sorts calculés (pièges 10 et 11). Rien n'est changé aux
  PV, aux sorts notés ni aux textes saisis.

### « Passer au niveau »

Une première question s'ajoute en tête de la fenêtre actuelle : **quelle classe monte ?** (les
classes du personnage, puis « Une nouvelle classe… »). Le reste de la fenêtre se met à jour
selon le choix :

- points de vie avec le dé de la classe choisie (valeur fixe ou jet, comme aujourd'hui) ;
- pour une nouvelle classe : les prérequis (« Sagesse 13 demandée, vous avez 12 »), et la liste
  des maîtrises reçues (tableau du point 1) ;
- ce qui change dans cette classe (aptitudes, sous-classe au niveau 3 de la classe, don au
  niveau 4 de la classe) ;
- les emplacements de sorts recalculés avec la table commune.

Le bouton « + » près du niveau garde son libellé « Passer au niveau N » (N = niveau total).

### Ailleurs dans la fiche

- **Dés de vie** : deux types tiennent côte à côte (« d8 : 1 / 3 » et « d6 : 0 / 2 »), trois
  passent sur deux lignes. La fenêtre de repos court demande quels dés dépenser.
- **Ressources** : la case de la classe de départ reste où elle est ; celle d'une classe en plus
  rejoint les cases à cocher des capacités.
- **Capacités de classe** (onglet Aptitudes & Traits) : un bloc repliable par classe, comme les
  blocs actuels.
- **(ajouté) Maîtrises d'armes** : la case « Maîtrises d'armes » gagne une ligne par classe en
  plus (« Guerrier, classe en plus : armes de guerre »), et le calcul des attaques en tient compte.
- **Magie** : sous « Caractéristique d'incantation », une ligne par classe (classe,
  caractéristique, DD, bonus d'attaque). Emplacements : une seule rangée commune, plus la rangée
  « Magie de pacte ». Dans le tableau des sorts, une petite mention de la classe du sort, et le
  filtre par classe (il existe déjà, `js/ui/spells/filters.js:54`) limité aux classes du
  personnage.
- **Impression** : la ligne « Classes », les dés de vie par type et les DD par classe doivent
  tenir en A4 ; l'en-tête imprimé est réglé dans `css/print.css:420-436`.

## 5. Recommandation

1. **Format : option A**, confirmée. Cases actuelles conservées, niveau total dans « Niveau »,
   une clé facultative `extra_classes` déclarée dans `V4_ONLY_KEYS`, absente des fiches à une
   classe, écrite avec les identifiants internes.
2. **Code : une « vue par classe ».** `deriveCharacter` garde ses valeurs actuelles et ajoute la
   liste des classes ; chaque règle de classe, qui reçoit déjà `{ classSlug, subclass, level }`,
   est appelée une fois par classe avec le niveau de cette classe. Pour une fiche à une classe,
   le résultat est identique à aujourd'hui : les tests actuels (**(corrigé)** environ 1 500, pas
   1 600) doivent passer sans être modifiés.
3. **(ajouté) Deux garde-fous de plus, parce que les tests actuels ne suffisent pas** (piège 16) :
   - dès le lot 1, des fiches de test multiclassées, et pour chaque règle de classe un test qui
     vérifie qu'elle voit **le niveau de sa classe et jamais le niveau total** ;
   - un contrôle automatique dans `npm run check` : la liste des fichiers autorisés à lire le
     niveau « tout court » est écrite noir sur blanc ; un nouveau fichier qui le lit fait échouer
     le contrôle tant qu'on n'a pas dit lequel des deux niveaux il lui faut.
4. **(ajouté) Règle du socle** : dès qu'une fiche a une classe en plus, toutes les règles de
   classe voient la classe de départ **à son niveau à elle**. Ce qui n'est pas encore construit
   pour les classes en plus n'affiche rien (avec un mot « pas encore calculé »), mais rien de
   faux n'est affiché.
5. **Écran : option 2** (ligne « Classes »), fenêtre « Classes », et la question « Quelle classe
   monte ? » dans « Passer au niveau ».
6. **Prérequis : avertir sans bloquer** (le MJ peut en décider autrement).
7. **Sorts** : la classe d'un sort est déduite quand c'est évident, demandée au joueur quand le
   sort figure sur deux de ses listes ; un sort dont la classe n'est pas sûre n'est jamais
   proposé au retrait. **(ajouté)** Et sans attendre le lot « magie » : dès la première version
   visible, « Retirer les sorts non préparés » ne propose plus un sort qui figure sur la liste
   d'une autre classe du personnage.
8. **Publier en trois fois**, la première version visible rendant déjà service (classes,
   niveaux, PV, dés de vie, emplacements communs affichés, protection du bouton de retrait).

## 6. Découpage en lots

Pour tous les lots : modèle Fable 5.2. « Ultracode » = revue par plusieurs agents avant de
publier. Point de départ : la 4.44.0.

| Lot | Contenu | Taille | Risque | Effort conseillé | Ultracode |
|---|---|---|---|---|---|
| 1. Socle (invisible) | Clé `extra_classes`, lecture tolérante, `V4_ONLY_KEYS`, comparaison v3, liste des classes dans `deriveCharacter`, séparation niveau total / niveau de classe **dans toutes les règles**, emplacements communs et pacte à part (calcul seul, règle du tiers comprise), prérequis (calcul seul), correction de la donnée du Barde, **(ajouté)** donnée des maîtrises de multiclassage, garde-fous du point 5, fiches de test fictives | **(corrigé)** Gros | **Élevé** (sauvegarde, synchronisation, une trentaine de fichiers de règles) | Élevé | **Oui** |
| 2. Classes à l'écran | Ligne « Classes », fenêtre « Classes » avec la première déclaration d'un multiclassé déjà joué, niveau total, sous-classe par classe, « Passer au niveau » avec choix de la classe et PV, dés de vie par type (bloc, repos court et long), libellé de « Revenir à… », **(ajouté)** emplacements communs et rangée de pacte affichés, protection du bouton « Retirer les sorts non préparés », texte de la question des deux versions | Moyen à gros | Moyen (tablette) | Moyen à élevé | Utile pour la relecture, pas indispensable |
| 3. Capacités des classes en plus | Bloc d'aptitudes par classe, ressource de la 2e classe, cases et rappels, sous-classes, boutons de combat, CA (meilleure formule), **(ajouté)** maîtrise des armes et formation aux armures calculées, bottes d'arme, dons selon les niveaux de classe, styles de combat en plus | Gros (surtout mécanique) | Moyen | Élevé | **Oui** |
| 4. Magie par classe | Classe de chaque sort, DD et bonus par classe, sorts préparés comptés par classe (niveau maximum par classe), « Préparer mes sorts » par classe, « Retirer les sorts non préparés » complet, grimoire du Magicien, pacte dans les repos, « Lancer » (quel emplacement) | Gros | **Élevé** (le grimoire est l'écran le plus complexe : 1 300 lignes dans `js/ui/spells.js`) | Élevé | **Oui** |
| 5. Finitions | Impression A4, notice (`js/data/help.js`), « Nouveautés », personnage d'exemple multiclassé, restes | Petit à moyen | Faible | Moyen | Non |

**Ordre et versions.** Lot 1 d'abord, obligatoirement : il peut être publié seul sans que les
joueurs voient quoi que ce soit, et il permet de vérifier sur les vraies tablettes qu'aucune
fiche ne se croit « modifiée ». Puis une première version visible avec les lots 2 et 3 ; la magie
(lot 4) dans une deuxième ; les finitions (lot 5) avec elle ou juste après. Si le seul
multiclassé de la table est un lanceur de sorts (Clerc / Magicien), on peut inverser les lots 3
et 4 ; grâce à la protection ajoutée au lot 2, son problème du bouton de retrait est de toute
façon réglé dès la première version visible.

**Ce qui peut attendre** : bloquer vraiment les prérequis ; cocher toute seule les formations aux
armures et les compétences gagnées ; l'aspect à trois classes ou plus (le format les accepte dès
le lot 1, l'écran est d'abord soigné pour deux) ; les sorts mineurs qui grandissent avec le
niveau total (la fiche ne calcule pas leurs dégâts) ; un personnage d'exemple multiclassé ; le
Magicien 18 / 20 (déjà reporté).

## 7. Ce qu'il faudra vérifier sur tablette

Sur Android et iPad, portrait et paysage, thèmes clair et sombre :

- Une fiche actuelle (Korgul, Iria) s'ouvre **sans aucun changement**, et la barre n'annonce
  aucune modification à envoyer. À faire dès la publication du lot 1.
- **(ajouté)** Déclarer un multiclassé déjà joué : la fenêtre demande les niveaux, le total est
  juste, les emplacements reviennent au calcul, rien d'autre n'a bougé (PV, sorts, textes).
- La ligne « Classes » à 768 px, 820 px et en paysage : deux classes sur une ligne, trois sur
  deux lignes, rien de coupé, même police que les cases voisines.
- Fenêtre « Classes » : listes faciles à toucher (44 px), ajout et retrait, clavier qui ne
  cache pas les boutons.
- « Passer au niveau » : choisir une classe déjà prise, puis une nouvelle classe ; PV, dés de vie,
  maîtrises annoncées.
- Dés de vie de deux types : bloc lisible, repos court (choix des dés), repos long.
- **(ajouté)** Onglet Combat : une arme de guerre d'un personnage qui a pris un niveau de
  Guerrier compte bien le bonus de maîtrise.
- Onglet Magie : DD par classe, rangée commune et rangée « Magie de pacte », repos court d'un
  Occultiste multiclassé.
- « Préparer mes sorts » et « Retirer les sorts non préparés » pour un Clerc / Magicien : aucun
  sort du grimoire du Magicien n'est proposé au retrait.
- Synchronisation : modifier sur une tablette, retrouver sur l'autre. **(ajouté)** Aussi : une
  tablette mise à jour et une tablette pas encore mise à jour ouvrent la même fiche multiclassée
  l'une après l'autre, sans question et sans perte.
- **(corrigé)** Ancien site : seulement si vous savez encore l'ouvrir (il n'est plus en ligne) :
  ouvrir la fiche sans enregistrer, puis revenir sur le nouveau.
- Impression A4 d'un multiclassé.
- Déjà vrai aujourd'hui, revu pendant les mesures : le bouton « + » du niveau fait 36 × 36 px,
  sous la cible de 44 px.

## 8. Questions pour Franck

1. **Quels personnages multiclassés avez-vous à votre table** (classes et niveaux) ? *Conseil :*
   cela décide de l'ordre des lots 3 et 4 et des fiches de test.
2. **(ajouté) Sur leurs fiches actuelles, la case « Niveau » contient-elle le niveau total ou le
   niveau de la classe écrite ?** Et leurs emplacements de sorts sont-ils réglés à la main ?
   *Conseil :* peu importe la réponse, la fenêtre « Classes » posera la question ; mais cela dit
   ce qu'il faut tester en premier.
3. **Combien de classes au maximum ?** *Conseil :* aucune limite dans la sauvegarde, écran soigné
   pour deux, correct pour trois.
4. **La case « Classe » reste-t-elle la classe de départ**, même si une autre classe a plus de
   niveaux ? *Conseil :* oui, c'est elle qui donne les jets de sauvegarde et les PV du niveau 1.
5. **Prérequis (13 dans les caractéristiques) : avertir ou interdire ?** *Conseil :* avertir.
6. **En-tête : option 2** (ligne « Classes » sur toute la largeur à la place des cases « Classe »
   et « Sous-classe », 70 px de plus pour ces personnages) ? *Conseil :* oui ; l'option 2 bis
   (garder les deux cases et ajouter la ligne) est le repli.
7. **Maîtrises gagnées** : pour les armes, la fiche les comptera d'office (elle calcule les
   attaques). Pour les armures et les compétences, les lister seulement, ou proposer un bouton
   « Appliquer » qui coche les cases ? *Conseil :* les lister d'abord, le bouton plus tard.
8. **Sorts d'un multiclassé** : d'accord pour que la fiche devine la classe d'un sort quand il
   n'est que sur une de vos listes, et vous demande seulement pour les sorts communs à deux
   classes ? *Conseil :* oui, et dans le doute le sort n'est jamais retiré.
9. **Conduit divin d'un Clerc / Paladin** : deux réserves séparées (lecture du manuel 2024) ou une
   seule ? *Conseil :* deux, sauf avis contraire du MJ.
10. **Bottes d'arme de deux classes** : le manuel ne dit rien. *Conseil :* afficher le nombre de
    chaque classe sans les additionner d'office.
11. **Publier en trois fois** (socle invisible, puis classes et capacités, puis magie) ou tout
    d'un coup ? *Conseil :* en trois fois.
12. **(corrigé) Ancien site** : il n'est plus en ligne depuis le 27/10/2026. Quelqu'un l'ouvre-t-il
    encore (onglet gardé, copie sur un ordinateur) ? *Conseil :* si non, on garde simplement la
    fiche lisible par lui en cas de retour en arrière, et la notice dit qu'un multiclassé ne doit
    pas être enregistré avec l'ancien site.
13. **(ajouté) Paladin / Rôdeur (cas rare)** : pour les emplacements, on additionne les deux
    niveaux puis on prend la moitié, ou on arrondit chaque classe à part ? *Conseil :* additionner
    puis prendre la moitié (lecture la plus directe de la phrase du manuel), sauf avis du MJ.
14. **Un personnage d'exemple multiclassé** dans « Essayer un personnage d'exemple » ? *Conseil :*
    plus tard, au lot 5.

## 9. Photos à demander à Franck

Les noms français de la fiche viennent de vos photos. `INDEX.md` ne contient aucune photo du
chapitre 2. Il manque :

1. **Chapitre 2, section du multiclassage : deux pages entières**, sans doute les pages 44 et 45.
   **(corrigé)** Raison : le chapitre 3 commence à la même page dans les deux livres (Barbare
   p. 51 en français comme en anglais), donc les chapitres 1 et 2 ont très probablement la même
   pagination ; ce n'est plus vrai ensuite, les classes étant rangées dans l'ordre alphabétique
   français. À vérifier au sommaire. La page de droite porte la **table du lanceur de sorts
   multiclassé** : son titre et ses en-têtes exacts en français sont ce qui manque le plus, avec
   les titres des paragraphes (prérequis, points de vie et dés de vie, attaque supplémentaire,
   magie de pacte…).
2. **Chapitre 2, « gagner un niveau »** : la page de la table des **points de vie fixes par
   classe** (sans doute p. 42) et celle de la **table d'avancement** (XP et bonus de maîtrise,
   sans doute p. 41).
3. **Chapitre 2, table récapitulative des classes** (colonne « Caractéristique principale »,
   sans doute p. 33). Facultatif : les traits de base de chaque classe la donnent déjà.

Déjà en votre possession : le bloc « En tant que personnage multiclassé » figure sur la première
photo de chaque classe. **(corrigé)** Il a été relu sur 5 des 12 (Barbare, Moine, Occultiste,
Paladin, Rôdeur) ; les 7 autres (Barde, Clerc, Druide, Ensorceleur, Guerrier, Magicien, Roublard)
seront relus au lot 1, et je vous dirai si l'un est coupé.

## Annexe (ajoutée) : ce que la relecture a contrôlé

- **Règles** : PHB p. 33, 42, 44-45, 70, 110, 199 et 202, et le bloc de multiclassage des douze
  classes (p. 51, 59, 69, 79, 91, 101, 109, 119, 129, 139, 153, 165). Aucune erreur de règle dans
  la première étude ; trois précisions ajoutées (tiers de lanceur, arrondi Paladin / Rôdeur,
  niveau maximum préparable par classe).
- **Code** : toutes les références `fichier:ligne` de la première étude relues dans le commit
  `ec2e65e`, ainsi que `js/cloud/sync.js`, `js/cloud/controller.js`, `js/cloud/repository.js`,
  `js/state/migrate.js`, `js/state/schema.js`, `js/state/store.js` en entier ou presque. Aucune
  référence fausse (une borne de ligne décalée d'un cran, corrigée).
- **Ancien site** : `index.html` et `js/storage.js` relus à l'étiquette `v3-final` ; le journal
  de bord confirme qu'il a été remplacé en ligne le 27/10/2026.
- **Écran** : mesures refaites à 768 et 820 px (Edge invisible, profil neuf, arrêté ensuite,
  fiche d'essai supprimée).
- **Non contrôlé** : les mesures à 1024 et 1100 px (reprises telles quelles), et le comportement
  réel sur une tablette, qui reste à voir par Franck.
