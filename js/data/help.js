// =============================================================================
// HELP.JS (données) - Textes du « Mode d'emploi » (menu Gestion, js/ui/help.js)
//
// HELP_SECTIONS : les rubriques dans l'ordre du sommaire, chacune { id, title, entries } ;
// une entrée = { title, text, files } : un titre court et quelques phrases simples, adressées au
// joueur (« vous ») ; files = les fichiers de l'interface qui font ce que l'entrée décrit.
// RELECTURE À CHAQUE VERSION : `npm run notice` liste les entrées dont un fichier a changé depuis
// la version en ligne (branche master) : les relire face à la fiche, corriger ce qui est devenu
// faux, retirer ce qui complique. Un nouveau fichier de js/ui/ doit être cité par une entrée, ou
// rangé dans HELP_INTERNAL_FILES s'il n'a rien à expliquer au joueur (testé).
// RÈGLES D'ÉCRITURE (vérifiées par tests/help.test.js) :
//  - on ne décrit que ce qui existe dans la fiche ;
//  - un libellé de bouton, d'onglet ou d'encadré est écrit entre « » EXACTEMENT comme à l'écran :
//    le test cherche chaque texte entre « » dans le code de l'interface, et échoue si un bouton a
//    été renommé sans que la notice suive. Ne rien mettre d'autre entre « » ;
//  - phrases courtes, aucun mot technique, aucun texte recopié d'un livre de règles.
// HELP_CONTENTS : ces rubriques suivies de la rubrique « Nouveautés » (une entrée par version,
// tirée de js/data/whats-new.js ; ses entrées portent « items », une liste, au lieu de « text »).
// =============================================================================

import { WHATS_NEW } from './whats-new.js';

/**
 * Fichiers de l'interface qui n'ont rien à expliquer au joueur (outils partagés, protections) :
 * aucune entrée ne les cite. Tout autre fichier de js/ui/ doit être cité par une entrée (testé).
 */
export const HELP_INTERNAL_FILES = Object.freeze([
    'js/ui/cell-text.js', 'js/ui/derived.js', 'js/ui/dom.js', 'js/ui/modal.js', 'js/ui/ornaments.js',
    'js/ui/sanitize.js', 'js/ui/spells/context.js', 'js/ui/weapons/shared.js'
]);

/** @type {ReadonlyArray<{ id: string, title: string, entries: ReadonlyArray<{ title: string, text: string, files: ReadonlyArray<string> }> }>} */
export const HELP_SECTIONS = Object.freeze([
    {
        id: 'start',
        title: "Pour commencer",
        entries: [
            {
                title: "À quoi sert la fiche",
                text: "Cette fiche remplace la feuille de papier. Elle calcule vos bonus, garde vos points de vie, vos sorts et votre équipement. Elle s'enregistre toute seule : vous n'avez rien à faire.",
                files: ["index.html", "js/ui/sheet.js"]
            },
            {
                title: "Le haut de la fiche",
                text: "Le nom, la classe, la sous-classe, le niveau, l'historique, l'espèce et les XP restent affichés en haut, quel que soit l'onglet. Choisissez la classe, la sous-classe, l'espèce et l'historique dans leurs listes : la fiche affiche alors ce qui va avec.",
                files: ["index.html", "js/ui/sheet.js"]
            },
            {
                title: "Les quatre onglets",
                text: "La fiche est rangée en quatre onglets : « Caractéristiques & Combat », « Aptitudes & Traits », « Compétences & Histoire » et « Magie, équipement & trésors ». Touchez un onglet pour l'ouvrir.",
                files: ["index.html", "js/ui/tabs.js"]
            },
            {
                title: "Le menu « Gestion »",
                text: "Sur tablette, le bouton « Gestion », tout en haut, déplie les commandes : verrou, export, impression, affichage, compte en ligne, mode d'emploi. Touchez-le de nouveau pour les replier. Sur un grand écran d'ordinateur, elles sont déjà affichées.",
                files: ["js/ui/toolbar.js", "index.html", "js/ui/help.js"]
            },
            {
                title: "La case « Mode Odyssée »",
                text: "Dans le menu « Gestion », fiche modifiable, cette case dit si le personnage joue la campagne de L'Odyssée des Seigneurs Dragons. Elle est cochée au départ. Décochez-la pour une autre campagne : les espèces, les sous-classes, le style de combat et le chakram de l'Odyssée ne sont plus proposés dans les listes. Recochez-la pour tout retrouver. Ce réglage est enregistré avec le personnage.",
                files: ["js/ui/odyssey.js", "js/ui/sheet.js"]
            },
            {
                title: "« Mode Odyssée » décoché : ce qui reste",
                text: "Rien n'est retiré de votre fiche : un Centaure reste un Centaure, avec ses traits et ses calculs, et la fiche vous dit ce qu'elle garde. L'encadré « Odyssée des Seigneurs Dragons » reste affiché s'il est rempli ; vide, il disparaît. La case « Points de Foi » de l'onglet Combat devient la pièce « Inspiration héroïque ».",
                files: ["js/ui/odyssey.js"]
            },
            {
                title: "« Mode Odyssée » décoché : retrouver un choix",
                text: "Si vous quittez un choix de l'Odyssée (une autre espèce, par exemple), il sort aussitôt de sa liste, et la barre du haut vous le dit. Recochez la case « Mode Odyssée » pour le retrouver. Faites de même pour revoir et remplir l'encadré « Odyssée des Seigneurs Dragons » quand il a disparu.",
                files: ["js/ui/odyssey.js"]
            },
            {
                title: "Les phrases d'aide",
                text: "En haut à droite, une ligne vous dit ce que la fiche vient de faire. Certains boutons y écrivent aussi une courte explication quand vous les touchez. Un message trop long est coupé et suivi d'une petite flèche : touchez-le pour le lire en entier, encore une fois pour le replier. À la souris, laissez le pointeur sur un bouton pour lire à quoi il sert.",
                files: ["js/ui/status-bar.js", "js/ui/toolbar.js", "index.html"]
            },
            {
                title: "Les encadrés repliables",
                text: "Beaucoup d'encadrés ont une petite pastille avec une flèche à côté de leur titre. Touchez-la pour replier l'encadré ou le rouvrir. Ce choix reste sur votre appareil ; à l'impression, tout est imprimé.",
                files: ["js/ui/fold.js", "js/ui/sheet.js"]
            },
            {
                title: "Essayer sans rien préparer",
                text: "Le bouton « Essayer un personnage d'exemple » ouvre un personnage prêt à jouer de la classe de votre choix (une par classe, du niveau 3 au niveau 15). Votre fiche est d'abord gardée dans « Revenir à… » ; pour la conserver durablement, faites un « Exporter » avant. L'exemple reste dans ce navigateur : vos personnages en ligne ne sont pas modifiés.",
                files: ["js/ui/examples.js", "js/ui/toolbar.js"]
            },
            {
                title: "Les mises à jour",
                text: "Quand une nouvelle version est en ligne, la fiche s'installe toute seule à l'ouverture, ou quand vous revenez sur elle, après avoir enregistré votre personnage. Une fenêtre « Nouveautés » résume alors ce qui change ; vous la retrouvez à la fin de ce mode d'emploi. Le numéro de version est écrit en haut à droite.",
                files: ["js/ui/update.js", "js/ui/whats-new.js"]
            }
        ]
    },
    {
        id: 'save',
        title: "Enregistrer et retrouver sa fiche",
        entries: [
            {
                title: "L'enregistrement automatique",
                text: "Chaque modification est enregistrée toute seule dans ce navigateur, sur cet appareil. En haut à droite, vous lisez alors « Enregistré dans ce navigateur ». Pour retrouver la fiche sur un autre appareil, utilisez le compte en ligne ou « Exporter ».",
                files: ["index.html", "js/main.js", "js/ui/status-bar.js", "js/ui/boot-notices.js"]
            },
            {
                title: "« Exporter »",
                text: "Ce bouton fait une copie de la fiche : « Télécharger » l'enregistre dans un fichier, « Copier dans le presse-papiers » la copie comme un texte à coller dans un message. Faites-le de temps en temps : c'est votre copie de sécurité.",
                files: ["js/ui/toolbar.js"]
            },
            {
                title: "« Importer »",
                text: "Ce bouton remplace la fiche ouverte par une fiche exportée : « Choisir un fichier .json… » pour un fichier, ou collez le texte puis « Importer le texte collé ». La fiche remplacée est gardée dans « Revenir à… ».",
                files: ["js/ui/toolbar.js", "js/ui/snapshots.js"]
            },
            {
                title: "« Nouvelle fiche »",
                text: "Ce bouton commence une fiche vierge, après une confirmation (« Créer une fiche vierge »). La fiche remplacée est gardée dans « Revenir à… ».",
                files: ["js/ui/toolbar.js"]
            },
            {
                title: "« Revenir à… »",
                text: "La fiche garde sur cet appareil ses dix derniers états : à l'ouverture, avant un repos long ou une montée de niveau, et avant tout remplacement de la fiche. Ouvrez « Revenir à… », puis touchez « Revenir » sur la ligne voulue. Les plus anciens laissent la place aux nouveaux : pour garder une fiche longtemps, utilisez « Exporter ».",
                files: ["js/ui/snapshots.js"]
            },
            {
                title: "« Imprimer »",
                text: "Ce bouton imprime la fiche sur du papier A4, ou l'enregistre en PDF. Les quatre onglets sont imprimés l'un après l'autre, sans les boutons.",
                files: ["js/ui/toolbar.js", "css/print.css"]
            }
        ]
    },
    {
        id: 'account',
        title: "Le compte en ligne",
        entries: [
            {
                title: "À quoi sert le compte",
                text: "Le compte garde vos personnages en ligne : vous les retrouvez sur tous vos appareils. Sans compte, la fiche reste dans ce navigateur seulement.",
                files: ["js/ui/account.js"]
            },
            {
                title: "« Se connecter »",
                text: "Saisissez votre e-mail et votre mot de passe, puis « Connexion ». La première fois, utilisez « Créer un compte ». En cas d'oubli, « Mot de passe oublié ? » vous envoie un lien par e-mail.",
                files: ["js/ui/account.js"]
            },
            {
                title: "L'envoi automatique",
                text: "Une fois connecté, la fiche ouverte est envoyée toute seule à votre compte après vos modifications. En haut à droite, une ligne dit où en est la fiche. Le personnage doit avoir un nom pour être enregistré en ligne.",
                files: ["js/ui/account.js", "js/cloud/sync.js"]
            },
            {
                title: "« Mes personnages »",
                text: "Cette fenêtre liste les personnages de votre compte. « Ouvrir » charge un personnage à la place de la fiche ouverte, qui est gardée dans « Revenir à… ». La corbeille retire un personnage du compte, après confirmation ; la fiche ouverte dans ce navigateur n'est pas effacée.",
                files: ["js/ui/account.js"]
            },
            {
                title: "Quand la fiche pose une question",
                text: "Si la fiche de l'appareil et celle du compte sont différentes, la fiche vous demande laquelle garder. Rien n'est écrasé sans votre accord. En cas de doute, choisissez « Décider plus tard » ou « Ne rien faire », selon la question, puis faites un « Exporter ».",
                files: ["js/ui/account.js"]
            },
            {
                title: "« Enregistrer en ligne »",
                text: "Ce bouton apparaît quand vous êtes connecté et que la fiche ouverte n'est que dans ce navigateur (un personnage d'exemple, par exemple). Il l'ajoute à votre compte, sans rien écraser.",
                files: ["js/ui/account.js"]
            },
            {
                title: "« Déconnexion »",
                text: "Ce bouton ferme le compte sur cet appareil. La fiche ouverte reste dans ce navigateur.",
                files: ["js/ui/account.js"]
            }
        ]
    },
    {
        id: 'display',
        title: "L'affichage",
        entries: [
            {
                title: "Thème clair ou sombre",
                text: "Le bouton avec une lune (ou un soleil) passe du thème clair au thème sombre, et inversement.",
                files: ["js/ui/toolbar.js", "js/ui/theme.js"]
            },
            {
                title: "« Fonds »",
                text: "Ce bouton ouvre la galerie « Fonds d'écran ». Touchez une image pour la mettre derrière la fiche, ou « Aucun fond ». « Image de l'appareil » prend une de vos photos. Vous pouvez aussi coller l'adresse d'une image, puis « Ajouter ».",
                files: ["js/ui/gallery.js"]
            },
            {
                title: "« Position », « Zoom » et « Opacité »",
                text: "Ces trois curseurs règlent le fond : sa hauteur, sa taille, et la transparence de la fiche posée dessus.",
                files: ["js/ui/gallery.js"]
            },
            {
                title: "« Cinéma »",
                text: "Ce bouton masque la fiche pour admirer le fond. Touchez « Quitter le mode cinéma » pour la retrouver.",
                files: ["js/ui/toolbar.js"]
            },
            {
                title: "« Sans animation »",
                text: "Ce bouton coupe tout ce qui bouge dans la fiche (reflets, effets). Touchez-le de nouveau pour rallumer les animations.",
                files: ["js/ui/toolbar.js", "js/ui/motion-pref.js", "js/ui/motion.js", "js/ui/feedback.js"]
            },
            {
                title: "Des réglages qui suivent le personnage",
                text: "Le thème, le fond et ses trois curseurs sont enregistrés avec le personnage. Quand vous ouvrez un personnage (« Mes personnages », « Importer », « Revenir à… »), la fiche reprend son thème et son fond, quel que soit l'appareil. Une photo choisie avec « Image de l'appareil » reste sur l'appareil où vous l'avez choisie. « Sans animation », lui, reste propre à chaque appareil.",
                files: ["js/ui/gallery.js", "js/ui/theme.js", "js/rules/gallery.js"]
            }
        ]
    },
    {
        id: 'lock',
        title: "Fiche verrouillée ou modifiable",
        entries: [
            {
                title: "Le bouton « Modifiable » / « Verrouillée »",
                text: "Ce bouton est dans le menu « Gestion ». Il dit dans quel état est la fiche : touchez « Modifiable » pour la verrouiller, il affiche alors « Verrouillée ». Touchez-le de nouveau pour la déverrouiller.",
                files: ["js/ui/toolbar.js", "js/ui/lock.js"]
            },
            {
                title: "À quoi sert le verrou",
                text: "Pendant la partie, le verrou évite de changer une caractéristique ou un texte par accident. Verrouillez la fiche pour jouer, déverrouillez-la pour la remplir ou la corriger.",
                files: ["js/ui/lock.js"]
            },
            {
                title: "Ce qui reste utilisable en jeu",
                text: "Fiche verrouillée, ce qui sert en partie reste utilisable : points de vie, jets contre la mort, dés de vie, épuisement, points de Foi et inspiration, états et concentration, cases des capacités, pièces. Vous pouvez aussi cocher les emplacements de sorts et les sorts préparés, l'armure équipée, les bonus de combat, et prendre un repos.",
                files: ["js/ui/lock.js", "js/ui/conditions.js", "js/ui/concentration.js", "js/ui/armors.js"]
            },
            {
                title: "Ce qui est masqué",
                text: "Fiche verrouillée, les boutons qui construisent ou remplacent la fiche disparaissent. C'est le cas des boutons pour ajouter ou supprimer une arme, une armure ou un sort. C'est aussi le cas de « Nouvelle fiche », « Importer », « Revenir à… », de la case « Mode Odyssée », du personnage d'exemple et de la montée de niveau. Le mode d'emploi reste disponible.",
                files: ["js/ui/lock.js", "js/ui/toolbar.js", "js/ui/snapshots.js", "js/ui/odyssey.js"]
            }
        ]
    },
    {
        id: 'combat',
        title: "Onglet « Caractéristiques & Combat »",
        entries: [
            {
                title: "Les six caractéristiques",
                text: "Saisissez vos six valeurs, de la Force au Charisme. La fiche calcule le modificateur de chacune. Cochez le rond « Sauv. » des jets de sauvegarde que votre personnage maîtrise : le bonus est calculé.",
                files: ["js/ui/sheet.js"]
            },
            {
                title: "Les cases calculées",
                text: "La classe d'armure, l'initiative, la perception passive et le bonus de maîtrise sont calculés par la fiche, d'après vos caractéristiques, votre niveau, votre armure et vos dons. Touchez la classe d'armure pour voir son calcul. Fiche modifiable, touchez la perception passive pour saisir une autre valeur ; effacez-la pour revenir au calcul.",
                files: ["js/ui/sheet.js", "index.html", "js/ui/calc-bubble.js"]
            },
            {
                title: "Les repères dorés",
                text: "Sous certaines cases (classe d'armure, initiative, vitesse, PV maximum…), un repère doré avec une étoile donne le nom d'un don, d'un trait ou d'une capacité qui change la valeur. Touchez-le pour lire ce qu'il fait.",
                files: ["index.html", "js/ui/sheet.js"]
            },
            {
                title: "Points de Foi ou Inspiration héroïque",
                text: "Mode Odyssée coché, la case s'appelle « Points de Foi ». À chaque niveau, elle repart à votre bonus de maîtrise plus votre modificateur de Sagesse (au moins 1) : la pastille dorée dessous donne ce nombre, et « Passer au niveau » remet la case pour vous. Les petits − et + autour du titre changent un point. Mode décoché, la case devient la pièce « Inspiration héroïque ».",
                files: ["js/ui/odyssey.js", "js/ui/counters.js", "js/rules/odyssey.js", "js/rules/level-up.js"]
            },
            {
                title: "Dépenser ses points de Foi",
                text: "Touchez la pastille dorée sous « Points de Foi » : une fenêtre liste les faveurs divines à 1, 3 ou 5 points et marque « Possible » celles que vos points permettent. Le bouton « Dépenser » d'une faveur retire ses points de la case ; le bouton + de la case les rend en cas d'erreur. Le MJ a le dernier mot.",
                files: ["js/ui/odyssey.js", "js/rules/odyssey.js", "js/data/faith-favors.js"]
            },
            {
                title: "La pièce « Inspiration héroïque »",
                text: "Touchez la pièce quand vous gagnez l'Inspiration héroïque : elle devient dorée et affiche « Disponible ». Retouchez-la une fois dépensée : elle affiche « Non disponible ». Mode Odyssée coché, elle a sa propre colonne à côté des « Points de Foi », qui ne la remplacent pas ; décoché, elle prend la place de la case. Elle marche aussi fiche verrouillée.",
                files: ["js/ui/odyssey.js", "js/rules/odyssey.js"]
            },
            {
                title: "Les dieux de Thyléa",
                text: "Chaque faveur se demande à un dieu et doit entrer dans son domaine. Dans la fenêtre des points de Foi, le bouton « Les dieux de Thyléa » les rappelle : titans et Cinq Dieux, leur domaine, une courte présentation et les faveurs qu'ils accordent volontiers. « Retour » ramène aux faveurs.",
                files: ["js/ui/odyssey.js", "js/data/faith-favors.js"]
            },
            {
                title: "Les points de vie",
                text: "Les petits − et + autour des titres « PV actuels » et « PV temp. » changent les PV d'un point ; gardez le doigt appuyé pour aller plus vite. Le bouton « Dégâts / Soins » ouvre un pavé de chiffres : tapez un nombre, puis « Dégâts », « Soins » ou « PV temp. ».",
                files: ["js/ui/hit-points.js", "js/ui/stepper.js", "js/ui/number-pad.js"]
            },
            {
                title: "Les dés de vie",
                text: "« Dés de vie » donne le dé de votre classe, rempli quand vous la choisissez. « Dés utilisés » compte ceux que vous avez dépensés, sur votre niveau : le repos court l'augmente quand vous en lancez, le repos long les rend tous.",
                files: ["index.html", "js/ui/sheet.js", "js/ui/rest.js"]
            },
            {
                title: "« Jets contre la mort »",
                text: "À 0 point de vie, cochez un rond à chaque réussite ou échec de vos jets contre la mort.",
                files: ["index.html"]
            },
            {
                title: "« États »",
                text: "Touchez une pastille pour noter un état (À terre, Empoisonné…) : le rappel de ses effets s'affiche dessous. « Tout retirer » les enlève tous. La ligne « Concentration » note le sort sur lequel vous vous concentrez et rappelle le jet à faire après des dégâts.",
                files: ["js/ui/conditions.js", "js/ui/concentration.js"]
            },
            {
                title: "Les armes",
                text: "Fiche modifiable, « Ajouter une arme ou un sort mineur » crée une ligne. Touchez son nom vide, ou le bouton ▾ : la liste des armes du manuel s'ouvre, sans clavier. Vous pouvez aussi taper le début du nom. Le bonus d'attaque et les dégâts sont calculés.",
                files: ["js/ui/weapons/edit.js", "js/ui/weapons/rows.js", "js/ui/autocomplete.js", "js/ui/weapons/mastery.js"]
            },
            {
                title: "Régler une arme, filtrer le tableau",
                text: "Fiche modifiable, la roue dentée d'une arme (« Configuration de l'arme ») règle ses détails, comme un bonus magique ; touchez « Appliquer » pour les garder. Les boutons au-dessus du tableau (« Toutes », « Magiques »…) filtrent les armes affichées.",
                files: ["js/ui/weapons/config.js", "js/ui/weapons.js", "js/ui/weapons/rows.js", "js/ui/magic.js"]
            },
            {
                title: "Les bonus de combat",
                text: "Selon votre classe et vos dons, des boutons apparaissent à côté du titre « Armes » (la Rage du Barbare, par exemple). Allumez-en un quand il s'applique : la plupart ajoutent leur bonus aux dégâts des armes concernées. Touchez-le de nouveau pour l'éteindre ; le repos long les éteint tous. Ils marchent aussi fiche verrouillée.",
                files: ["js/ui/weapons/buffs.js", "js/ui/weapons.js", "js/rules/rage.js"]
            },
            {
                title: "Les dégâts en plus d'une arme",
                text: "Pour une arme spéciale, ouvrez sa roue dentée, rubrique « Dégâts en plus », puis « Ajouter un dégât en plus » : écrivez les dégâts (2d6) et la raison (contre les dragons). « Toujours » les compte en permanence. « À allumer » pose une pastille sous l'arme : touchez-la quand la condition est remplie, même fiche verrouillée. Le repos long éteint ces pastilles. Touchez les dégâts de l'arme pour les lire en entier.",
                files: ["js/ui/weapons/config-extras.js", "js/ui/weapons/damage.js", "js/ui/weapons/rows.js"]
            },
            {
                title: "Les armures",
                text: "Cochez sous « Maîtrises d'armures » celles que vous savez porter. « Ajouter une armure » crée une ligne : touchez son nom vide, ou le bouton ▾, pour choisir une armure du manuel ou dans le groupe « Autres » (anneau, cape, sort…). Cochez « Équipée / actif » quand elle sert. Touchez la CA pour voir le calcul. La roue dentée règle la magie d'une ligne.",
                files: ["js/ui/armors.js", "index.html", "js/rules/armor-picker.js", "js/rules/armors.js"]
            },
            {
                title: "Les capacités à cocher",
                text: "Les capacités de classe qui se dépensent (un Second souffle, par exemple) ont des cases à cocher près des points de vie. Cochez une case à chaque utilisation ; le repos qui convient vous les rend.",
                files: ["js/ui/sheet.js", "index.html", "js/rules/logic.js", "js/ui/wild-magic.js"]
            },
            {
                title: "Les repos",
                text: "L'encadré « Repos » contient l'épuisement et les boutons « Repos court (1 h) » et « Repos long (8 h) ». Les dés de vie sont à côté des points de vie. Voyez la rubrique sur les repos.",
                files: ["index.html", "js/ui/rest.js"]
            }
        ]
    },
    {
        id: 'traits',
        title: "Onglet « Aptitudes & Traits »",
        entries: [
            {
                title: "« Espèce & historique »",
                text: "Cet encadré rappelle ce que donnent votre espèce et votre historique. Fiche modifiable, « Appliquer à la fiche » coche les compétences de l'historique, inscrit son don au niveau 1 si la place est libre et note son outil s'il est précis. Vos caractéristiques ne changent pas. Les repères « À choisir » et « À vérifier » montrent ce qu'il vous reste à décider ou à contrôler.",
                files: ["js/ui/background.js", "js/ui/species.js", "index.html"]
            },
            {
                title: "« Dons »",
                text: "Choisissez vos dons dans les listes. Sous chaque don, l'encadré « Dans la fiche » montre ses choix et ce que la fiche en fait, ligne par ligne. « Calculé » : la fiche le compte, rien à faire. « À reporter » : à noter vous-même. « Rappel » : à garder en tête, rien n'est calculé. « À vérifier » : un choix manque ou ne convient pas. « Coché » : la case du don est cochée. « En attente » : pas actif pour l'instant.",
                files: ["js/ui/sheet.js", "index.html"]
            },
            {
                title: "« Capacités de classe »",
                text: "La fiche liste ce que votre classe et votre sous-classe vous donnent à votre niveau, avec un rappel de chaque capacité ; celles des niveaux suivants sont repliées sous « À venir ». Certaines capacités ont un menu pour faire votre choix. En dessous, un texte libre pour vos notes.",
                files: ["js/ui/class-progression.js", "js/ui/subclass.js", "index.html"]
            },
            {
                title: "« Traits de personnage »",
                text: "Un texte libre pour vos traits, vos capacités particulières et vos notes.",
                files: ["index.html"]
            },
            {
                title: "« Compagnons & familiers »",
                text: "Un encadré pour noter une monture, un familier ou un compagnon. Certaines sous-classes y affichent leur compagnon tout prêt : suivez ses points de vie avec les petits − et + autour de leur titre, même fiche verrouillée.",
                files: ["js/ui/companions.js", "index.html"]
            },
            {
                title: "« Synergie entre joueurs »",
                text: "Un texte libre pour noter les combinaisons qui marchent bien avec les autres personnages du groupe.",
                files: ["index.html"]
            }
        ]
    },
    {
        id: 'role',
        title: "Onglet « Compétences & Histoire »",
        entries: [
            {
                title: "« Compétences »",
                text: "Cochez le premier rond d'une compétence que vous maîtrisez, le second si vous en avez l'expertise. Le bonus de chaque compétence est calculé. Une étoile suivie d'un nom, sur la ligne d'une compétence, signale un don, un trait ou une capacité qui la touche : touchez-la pour le détail.",
                files: ["js/ui/sheet.js", "index.html"]
            },
            {
                title: "« Maîtrises d'armes »",
                text: "Au-dessus de la case, la fiche rappelle les armes que vous maîtrisez par votre classe, et parfois par un don ou votre sous-classe. La case est un texte libre : ce que vous y écrivez ne change pas vos attaques. Pour une autre arme maîtrisée, ouvrez sa roue dentée dans l'onglet Combat et réglez « Arme maîtrisée » sur Oui.",
                files: ["index.html", "js/ui/sheet.js", "js/ui/weapons/config.js"]
            },
            {
                title: "« Outils »",
                text: "La case « Outils » est un texte libre. Fiche modifiable, « Choisir dans la liste » ouvre la liste des outils du manuel : cochez les vôtres, leur nom s'écrit dans la case. Décocher retire seulement ce nom. En haut de la fenêtre, « D'où viennent vos outils » rappelle ce que donnent votre historique et vos dons.",
                files: ["js/ui/tools.js", "index.html"]
            },
            {
                title: "« Langues »",
                text: "Un texte libre pour les langues que parle votre personnage.",
                files: ["index.html"]
            },
            {
                title: "« Apparence » et « Histoire & personnalité »",
                text: "Des textes libres pour décrire votre personnage et raconter son histoire.",
                files: ["index.html"]
            },
            {
                title: "Mettre un texte en forme",
                text: "Fiche modifiable, sélectionnez quelques mots dans un texte libre : une petite barre apparaît pour les mettre en gras, en italique, les souligner, changer leur taille ou leur couleur.",
                files: ["js/ui/style-editor.js", "js/ui/lock.js"]
            },
            {
                title: "« Odyssée des Seigneurs Dragons »",
                text: "Cet encadré sert à la campagne du même nom : choisissez votre « Destin héroïque » et notez vos « Points de renommée » ; la fiche en déduit le « Palier ». Case « Mode Odyssée » décochée, l'encadré disparaît s'il est vide. Recochez la case pour le revoir et le remplir.",
                files: ["js/ui/odyssey.js", "index.html"]
            }
        ]
    },
    {
        id: 'magic',
        title: "Onglet « Magie, équipement & trésors »",
        entries: [
            {
                title: "Les trois cases du haut",
                text: "Choisissez votre « Caractéristique d'incantation ». Le « DD de sauvegarde » et le « Bonus d'attaque » de vos sorts sont alors calculés.",
                files: ["index.html", "js/ui/sheet.js", "js/rules/character.js"]
            },
            {
                title: "Les emplacements de sorts",
                text: "La fiche affiche les emplacements de votre classe à votre niveau. Cochez un rond quand vous dépensez un emplacement ; le repos long les rend tous. Fiche modifiable, les boutons − et + changent le nombre d'emplacements (objet magique, règle spéciale) : ils ne dépensent rien.",
                files: ["js/ui/spells/slots.js", "js/rules/spells.js", "js/rules/rest.js"]
            },
            {
                title: "Ajouter un sort",
                text: "Fiche modifiable, touchez le bouton ▾ de la ligne vide, en bas du tableau : la liste des sorts s'ouvre, sans clavier. Vous pouvez aussi taper le début du nom dans cette ligne. Le menu « Liste de sorts » choisit la liste proposée, celle de votre classe par défaut.",
                files: ["js/ui/spells/picker.js", "js/ui/autocomplete.js", "js/ui/spells/filters.js", "js/ui/spells/rows.js", "js/ui/spells/entry.js", "js/ui/spells/notice.js"]
            },
            {
                title: "Lire une ligne de sort",
                text: "Le losange de gauche dit si le sort est préparé : touchez-le pour le préparer ou non. Un losange plein et fixe marque un sort toujours préparé. Les lettres C, R et M signalent la Concentration, le Rituel et une composante matérielle.",
                files: ["js/ui/spells/rows.js", "js/rules/spell-preparation.js", "js/ui/spells/table.js"]
            },
            {
                title: "La mention « Pas d'emplacement »",
                text: "Elle apparaît sous le nom d'un sort préparé dont le niveau dépasse vos emplacements : ce sort ne peut pas encore être lancé. C'est un simple avertissement, rien n'est décoché. Touchez la mention pour lire l'explication.",
                files: ["js/ui/spells/rows.js", "js/rules/spell-preparation.js"]
            },
            {
                title: "Voir un seul niveau",
                text: "Les pastilles « Tous », 0, 1, 2… n'affichent que les sorts du niveau choisi. Le 0 correspond aux sorts mineurs.",
                files: ["js/ui/spells/filters.js"]
            },
            {
                title: "La description d'un sort",
                text: "Touchez le nom d'un sort pour lire sa description dans une bulle. Le bouton avec une bulle, dans la barre du grimoire, allume ou éteint ces descriptions.",
                files: ["js/ui/spells/tooltip.js", "js/ui/spells/rows.js", "js/ui/spells/filters.js", "js/ui/spells/prefs.js"]
            },
            {
                title: "« Préparer mes sorts »",
                text: "Pour le Clerc, le Druide, le Paladin et le Rôdeur, ce bouton ouvre toute la liste de la classe : cochez vos sorts préparés, après un repos long. Un compteur indique combien de sorts sont préparés. Le Paladin et le Rôdeur ne changent qu'un seul sort par repos long : une ligne le rappelle.",
                files: ["js/ui/spells/prepare.js", "js/rules/spell-preparation.js"]
            },
            {
                title: "« Retirer les sorts non préparés »",
                text: "Pour ces mêmes classes, les sorts décochés restent au grimoire. Fiche modifiable, ce bouton sous le tableau vous montre ceux de votre classe, puis les retire d'un coup. Il n'apparaît que s'il y en a. Vos sorts préparés, mineurs ou donnés restent toujours. Un sort où vous avez écrit reste aussi, sauf si vous le cochez. La fiche est d'abord gardée dans « Revenir à… ».",
                files: ["js/ui/spells/cleanup.js", "js/rules/spell-preparation.js"]
            },
            {
                title: "La vue « Au combat »",
                text: "Le bouton « Au combat » ne garde à l'écran que les sorts utilisables : sorts mineurs, sorts préparés et sorts donnés, avec les emplacements restants. Touchez-le de nouveau pour revoir tout le grimoire.",
                files: ["js/ui/spells/filters.js", "js/ui/spells.js", "js/ui/spells/slots.js", "js/rules/spell-preparation.js"]
            },
            {
                title: "Le bouton « Lancer »",
                text: "Dans la vue « Au combat », chaque sort de niveau 1 ou plus a un bouton « Lancer », marqué d'une étincelle. Touchez le niveau d'emplacement à dépenser : il se coche pour vous. « En rituel » lance le sort sans emplacement, quand le sort le permet. Pour un sort à Concentration, une case cochée d'office la note aussi dans « États ». Pour annuler, décochez l'emplacement.",
                files: ["js/ui/spells/cast.js", "js/ui/spells/rows.js", "js/ui/spells/granted.js", "js/rules/spell-preparation.js"]
            },
            {
                title: "« Lancer gratuit »",
                text: "Quand un don, votre espèce ou une capacité (Ennemi juré, Arcanum mystique…) offre un sort sans emplacement, la fenêtre « Lancer » propose d'abord « Lancer gratuit », avec les lancers restants. C'est la case de cette capacité qui se coche, pas un emplacement. Pour annuler, décochez-la. Une fois utilisé, le bouton est grisé jusqu'au repos qui le rend.",
                files: ["js/ui/spells/cast.js", "js/rules/free-casts.js"]
            },
            {
                title: "Les sorts donnés",
                text: "Au-dessus du tableau, les blocs « Sorts de classe », « Sorts de dons », « Sorts de sous-classe » et « Sorts d'espèce » montrent les sorts donnés par votre classe, vos dons, votre sous-classe et votre espèce. Ils sont toujours préparés et ne comptent pas dans vos sorts préparés. Si un sort a un lancer gratuit, cochez sa case quand vous l'utilisez.",
                files: ["js/ui/spells/granted.js", "js/ui/spells.js", "js/rules/class-progression.js", "js/rules/free-casts.js", "js/ui/spells/choices.js"]
            },
            {
                title: "Le livre du Magicien",
                text: "Pour un Magicien, une ligne sous la barre compte les sorts de son livre et rappelle le coût d'une copie. Un rituel du livre non préparé porte la mention « Lançable en rituel ». Dans la vue « Au combat », ces rituels sont rangés sous la ligne « Rituels du livre », repliée au départ : touchez-la pour les voir. Chacun garde son bouton « Lancer », en rituel seulement : 10 minutes de plus, sans emplacement.",
                files: ["js/ui/spells/book.js", "js/ui/spells/rows.js", "js/rules/spellbook.js"]
            },
            {
                title: "« Équipement & trésor »",
                text: "Un texte libre pour votre équipement, puis vos pièces : PC, PA, PE, PO et PP. Le bouton « Bourse : gagner / dépenser » ajoute ou retire des pièces sans calcul de tête.",
                files: ["index.html", "js/ui/counters.js", "js/rules/counters.js"]
            }
        ]
    },
    {
        id: 'rest',
        title: "Repos court et repos long",
        entries: [
            {
                title: "« Repos court (1 h) »",
                text: "Choisissez combien de dés de vie vous dépensez. « Lancer les dés » les lance pour vous ; « Saisir le total » sert si vous lancez vos propres dés. La fiche ajoute votre Constitution, vous soigne, et rend les capacités qui reviennent après un repos court.",
                files: ["js/ui/rest.js", "js/rules/rest.js"]
            },
            {
                title: "« Repos long (8 h) »",
                text: "« Se reposer » rend tous vos points de vie, vos dés de vie, vos emplacements de sorts et vos capacités. L'épuisement baisse de 1 et les PV temporaires disparaissent. La fiche est d'abord gardée dans « Revenir à… », au cas où.",
                files: ["js/ui/rest.js", "js/rules/rest.js"]
            },
            {
                title: "Après un repos long",
                text: "Pour un Clerc, un Druide, un Paladin ou un Rôdeur, la fiche propose de choisir les sorts du jour : « Préparer mes sorts », ou « Plus tard ».",
                files: ["js/ui/rest.js", "js/ui/spells/prepare.js", "js/rules/spell-preparation.js"]
            },
            {
                title: "Utilisables fiche verrouillée",
                text: "Les deux repos, les dés de vie et l'épuisement restent utilisables quand la fiche est verrouillée.",
                files: ["js/ui/rest.js", "js/ui/lock.js", "index.html"]
            }
        ]
    },
    {
        id: 'level',
        title: "Monter de niveau",
        entries: [
            {
                title: "Noter les points d'expérience",
                text: "Le bouton + à côté de la case XP ouvre un pavé de chiffres : tapez les XP gagnés, puis « Ajouter ». Il marche aussi fiche verrouillée. Sous la case, la fiche dit combien d'XP il manque avant le niveau suivant.",
                files: ["js/ui/experience.js", "js/ui/number-pad.js", "js/rules/experience.js"]
            },
            {
                title: "Passer au niveau suivant",
                text: "Fiche modifiable, le bouton + à côté de la case Niveau ouvre la fenêtre « Passer au niveau », suivie du numéro du nouveau niveau. Elle liste ce qui change : points de vie, bonus de maîtrise, dons, capacités de classe, sorts. Avec le mode Odyssée, elle remet aussi vos points de Foi.",
                files: ["js/ui/level-up.js", "js/rules/level-up.js", "js/rules/odyssey.js"]
            },
            {
                title: "Les points de vie gagnés",
                text: "Dans cette fenêtre, choisissez la valeur fixe ou tapez le résultat de votre dé. La fiche ajoute votre Constitution, puis met à jour le niveau et les PV maximum.",
                files: ["js/ui/level-up.js", "js/rules/level-up.js"]
            },
            {
                title: "En cas d'erreur",
                text: "Avant chaque montée de niveau, la fiche est gardée dans « Revenir à… » : vous pouvez revenir en arrière.",
                files: ["js/ui/level-up.js", "js/ui/snapshots.js"]
            },
            {
                title: "Ensuite",
                text: "La fenêtre « Passer au niveau » liste aussi les choix à faire : don, sous-classe, sorts. La fiche ne choisit pas pour vous : faites ces choix ensuite dans les onglets. Un lanceur de sorts note ses nouveaux sorts dans le grimoire.",
                files: ["js/ui/level-up.js", "js/rules/level-up.js"]
            }
        ]
    }
].map((section) => Object.freeze({
    ...section,
    entries: Object.freeze(section.entries.map((entry) => Object.freeze(entry)))
})));

/** Rubrique « Nouveautés » : ce qui a changé, version par version (la plus récente d'abord) */
export const HELP_NEWS_SECTION = Object.freeze({
    id: 'news',
    title: "Nouveautés",
    entries: Object.freeze(WHATS_NEW.map(({ version, items }) => Object.freeze({ title: `Version ${version}`, items })))
});

/** Tout le mode d'emploi, dans l'ordre du sommaire */
export const HELP_CONTENTS = Object.freeze([...HELP_SECTIONS, HELP_NEWS_SECTION]);
