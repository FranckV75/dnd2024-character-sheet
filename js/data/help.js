// =============================================================================
// HELP.JS (données) - Textes du « Mode d'emploi » (menu Gestion, js/ui/help.js)
//
// HELP_SECTIONS : les rubriques dans l'ordre du sommaire, chacune { id, title, entries } ;
// une entrée = { title, text } : un titre court et quelques phrases simples, adressées au
// joueur (« vous »).
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

/** @type {ReadonlyArray<{ id: string, title: string, entries: ReadonlyArray<{ title: string, text: string }> }>} */
export const HELP_SECTIONS = Object.freeze([
    {
        id: 'start',
        title: "Pour commencer",
        entries: [
            {
                title: "À quoi sert la fiche",
                text: "Cette fiche remplace la feuille de papier. Elle calcule vos bonus, garde vos points de vie, vos sorts et votre équipement. Elle s'enregistre toute seule : vous n'avez rien à faire."
            },
            {
                title: "Le haut de la fiche",
                text: "Le nom, la classe, la sous-classe, le niveau, l'historique, l'espèce et les PX restent affichés en haut, quel que soit l'onglet. Choisissez la classe, la sous-classe, l'espèce et l'historique dans leurs listes : la fiche affiche alors ce qui va avec."
            },
            {
                title: "Les quatre onglets",
                text: "La fiche est rangée en quatre onglets : « Caractéristiques & Combat », « Aptitudes & Traits », « Compétences & Histoire » et « Magie, équipement & trésors ». Touchez un onglet pour l'ouvrir."
            },
            {
                title: "Le menu « Gestion »",
                text: "Sur tablette, le bouton « Gestion », tout en haut, déplie les commandes : enregistrer, imprimer, changer l'affichage, se connecter. Touchez-le de nouveau pour les replier. Sur un grand écran d'ordinateur, elles sont déjà affichées."
            },
            {
                title: "Les phrases d'aide",
                text: "En haut à droite, une ligne vous dit ce que la fiche vient de faire. Plusieurs boutons y écrivent aussi une courte explication quand vous les touchez. À la souris, laissez le pointeur sur un bouton pour lire à quoi il sert."
            },
            {
                title: "Les encadrés repliables",
                text: "Beaucoup d'encadrés ont une petite pastille avec une flèche à côté de leur titre. Touchez-la pour replier l'encadré ou le rouvrir. Ce choix reste sur votre appareil ; à l'impression, tout est imprimé."
            },
            {
                title: "Essayer sans rien préparer",
                text: "Le bouton « Essayer un personnage d'exemple » ouvre un Guerrier de niveau 3 ou une Magicienne de niveau 5, prêts à jouer. Votre fiche est d'abord gardée dans « Revenir à… » ; pour la conserver durablement, faites un « Exporter » avant. L'exemple reste dans ce navigateur : vos personnages en ligne ne sont pas modifiés."
            }
        ]
    },
    {
        id: 'save',
        title: "Enregistrer et retrouver sa fiche",
        entries: [
            {
                title: "L'enregistrement automatique",
                text: "Chaque modification est enregistrée toute seule dans ce navigateur, sur cet appareil. En haut à droite, vous lisez alors « Enregistré dans ce navigateur ». Pour retrouver la fiche sur un autre appareil, utilisez le compte en ligne ou « Exporter »."
            },
            {
                title: "« Exporter »",
                text: "Ce bouton fait une copie de la fiche : « Télécharger » l'enregistre dans un fichier, « Copier dans le presse-papiers » la copie comme un texte à coller dans un message. Faites-le de temps en temps : c'est votre copie de sécurité."
            },
            {
                title: "« Importer »",
                text: "Ce bouton remplace la fiche ouverte par une fiche exportée : « Choisir un fichier .json… » pour un fichier, ou collez le texte puis « Importer le texte collé ». La fiche remplacée est gardée dans « Revenir à… »."
            },
            {
                title: "« Nouvelle fiche »",
                text: "Ce bouton commence une fiche vierge, après une confirmation (« Créer une fiche vierge »). La fiche remplacée est gardée dans « Revenir à… »."
            },
            {
                title: "« Revenir à… »",
                text: "L'appareil garde les dix derniers états de la fiche : à chaque ouverture, avant un repos long, une montée de niveau, un retrait de sorts du grimoire et tout remplacement de la fiche. Ouvrez « Revenir à… », puis touchez « Revenir » sur la ligne voulue. Ces copies restent sur cet appareil seulement, et les plus anciennes laissent la place aux nouvelles : pour garder une fiche longtemps, utilisez « Exporter »."
            },
            {
                title: "« Imprimer »",
                text: "Ce bouton imprime la fiche sur du papier A4, ou l'enregistre en PDF. Les quatre onglets sont imprimés l'un après l'autre, sans les boutons."
            }
        ]
    },
    {
        id: 'account',
        title: "Le compte en ligne",
        entries: [
            {
                title: "À quoi sert le compte",
                text: "Le compte garde vos personnages en ligne : vous les retrouvez sur tous vos appareils. Sans compte, la fiche reste dans ce navigateur seulement."
            },
            {
                title: "« Se connecter »",
                text: "Saisissez votre e-mail et votre mot de passe, puis « Connexion ». La première fois, utilisez « Créer un compte ». En cas d'oubli, « Mot de passe oublié ? » vous envoie un lien par e-mail."
            },
            {
                title: "L'envoi automatique",
                text: "Une fois connecté, la fiche ouverte est envoyée toute seule à votre compte après vos modifications. En haut à droite, une ligne dit où en est la fiche. Le personnage doit avoir un nom pour être enregistré en ligne."
            },
            {
                title: "« Mes personnages »",
                text: "Cette fenêtre liste les personnages de votre compte. « Ouvrir » charge un personnage à la place de la fiche ouverte. La corbeille (« Supprimer de mon compte ») retire un personnage du compte, après confirmation."
            },
            {
                title: "Quand la fiche pose une question",
                text: "Si la fiche de l'appareil et celle du compte sont différentes, la fiche vous demande laquelle garder. Rien n'est écrasé sans votre accord. En cas de doute, choisissez « Décider plus tard » ou « Ne rien faire », selon la question, puis faites un « Exporter »."
            },
            {
                title: "« Enregistrer en ligne »",
                text: "Ce bouton apparaît quand vous êtes connecté et que la fiche ouverte n'est que dans ce navigateur (un personnage d'exemple, par exemple). Il l'ajoute à votre compte, sans rien écraser."
            },
            {
                title: "« Déconnexion »",
                text: "Ce bouton ferme le compte sur cet appareil. La fiche ouverte reste dans ce navigateur."
            }
        ]
    },
    {
        id: 'display',
        title: "L'affichage",
        entries: [
            {
                title: "Thème clair ou sombre",
                text: "Le bouton avec une lune (ou un soleil) passe du thème clair au thème sombre, et inversement."
            },
            {
                title: "« Fonds »",
                text: "Ce bouton ouvre la galerie « Fonds d'écran ». Touchez une image pour la mettre derrière la fiche, ou « Aucun fond ». « Image de l'appareil » prend une de vos photos. Vous pouvez aussi coller l'adresse d'une image, puis « Ajouter »."
            },
            {
                title: "« Position », « Zoom » et « Opacité »",
                text: "Ces trois curseurs règlent le fond : sa hauteur, sa taille, et la transparence de la fiche posée dessus."
            },
            {
                title: "« Cinéma »",
                text: "Ce bouton masque la fiche pour admirer le fond. Touchez « Quitter le mode cinéma » pour la retrouver."
            },
            {
                title: "« Sans animation »",
                text: "Ce bouton coupe tout ce qui bouge dans la fiche (reflets, effets). Touchez-le de nouveau pour rallumer les animations."
            },
            {
                title: "Des réglages qui suivent le personnage",
                text: "Le thème, le fond et ses trois curseurs sont enregistrés avec le personnage. Quand vous ouvrez ce personnage sur un autre appareil (compte en ligne, « Importer », « Revenir à… »), l'appareil prend son thème et son fond. Une photo choisie avec « Image de l'appareil » reste sur l'appareil où vous l'avez choisie. Seul « Sans animation » est propre à chaque appareil."
            }
        ]
    },
    {
        id: 'lock',
        title: "Fiche verrouillée ou modifiable",
        entries: [
            {
                title: "Le bouton « Modifiable » / « Verrouillée »",
                text: "Ce bouton dit dans quel état est la fiche. Touchez « Modifiable » pour la verrouiller : il affiche alors « Verrouillée ». Touchez-le de nouveau pour la déverrouiller."
            },
            {
                title: "À quoi sert le verrou",
                text: "Pendant la partie, le verrou évite de changer une caractéristique ou un texte par accident. Verrouillez la fiche pour jouer, déverrouillez-la pour la remplir ou la corriger."
            },
            {
                title: "Ce qui reste utilisable en jeu",
                text: "Fiche verrouillée, vous pouvez toujours changer vos points de vie, les jets contre la mort, les dés de vie, l'épuisement, l'inspiration, les états et les pièces. Vous pouvez aussi cocher les emplacements de sorts et les sorts préparés, l'armure équipée, les bonus de combat, et prendre un repos."
            },
            {
                title: "Ce qui est masqué",
                text: "Fiche verrouillée, les boutons qui construisent ou remplacent la fiche disparaissent. C'est le cas des boutons pour ajouter ou supprimer une arme, une armure ou un sort. C'est aussi le cas de « Nouvelle fiche », « Importer », « Revenir à… », du personnage d'exemple et de la montée de niveau. Le mode d'emploi reste disponible."
            }
        ]
    },
    {
        id: 'combat',
        title: "Onglet « Caractéristiques & Combat »",
        entries: [
            {
                title: "Les six caractéristiques",
                text: "Saisissez vos six valeurs, de la Force au Charisme. La fiche calcule le modificateur de chacune. Cochez le rond « Sauv. » des jets de sauvegarde que votre personnage maîtrise : le bonus est calculé."
            },
            {
                title: "Les cases calculées",
                text: "La classe d'armure, l'initiative, la perception passive et le bonus de maîtrise sont calculés par la fiche, d'après vos caractéristiques, votre niveau, votre armure et vos dons."
            },
            {
                title: "Les points de vie",
                text: "Les boutons − et + changent les PV actuels ou les PV temporaires d'un point ; gardez le doigt appuyé pour aller plus vite. Le bouton « Dégâts / Soins » ouvre un pavé de chiffres : tapez un nombre, puis « Dégâts », « Soins » ou « PV temp. »."
            },
            {
                title: "« Jets contre la mort »",
                text: "À 0 point de vie, cochez un rond à chaque réussite ou échec de vos jets contre la mort."
            },
            {
                title: "« États »",
                text: "Touchez une pastille pour noter un état (À terre, Empoisonné…) : le rappel de ses effets s'affiche dessous. « Tout retirer » les enlève tous. La ligne « Concentration » note le sort sur lequel vous vous concentrez et rappelle le jet à faire après des dégâts."
            },
            {
                title: "Les armes",
                text: "Fiche modifiable, « Ajouter une arme ou un sort mineur » crée une ligne : tapez le début du nom et choisissez dans la liste. Le bonus d'attaque et les dégâts sont calculés. La roue dentée (« Configuration de l'arme ») règle les détails, comme un bonus magique. Les boutons au-dessus du tableau filtrent les armes affichées."
            },
            {
                title: "Les bonus de combat",
                text: "Selon votre classe et vos dons, des pastilles apparaissent au-dessus des armes (la Rage du Barbare, par exemple). Allumez-en une quand le bonus s'applique : il est ajouté aux dégâts des armes concernées."
            },
            {
                title: "Les armures",
                text: "Sous « Maîtrises d'armures », cochez les armures que votre personnage sait porter. « Ajouter une armure » crée une ligne pour une armure, un bouclier ou un autre bonus de défense. Cochez « Équipée / actif » quand vous la portez : la classe d'armure est recalculée. Touchez la valeur de la colonne CA pour voir le calcul."
            },
            {
                title: "Les capacités à cocher",
                text: "Les capacités de classe qui se dépensent (un Second souffle, par exemple) ont des cases à cocher près des points de vie. Cochez une case à chaque utilisation ; le repos qui convient vous les rend."
            },
            {
                title: "Les repos",
                text: "L'encadré « Repos » contient les dés de vie, l'épuisement et les deux boutons de repos. Voyez la rubrique sur les repos."
            }
        ]
    },
    {
        id: 'traits',
        title: "Onglet « Aptitudes & Traits »",
        entries: [
            {
                title: "« Espèce & historique »",
                text: "Cet encadré rappelle ce que donnent votre espèce et votre historique. « Appliquer à la fiche » reporte ce que donne l'historique. Les repères « À choisir » et « À vérifier » montrent ce qu'il vous reste à décider ou à contrôler."
            },
            {
                title: "« Dons »",
                text: "Choisissez vos dons dans les listes. Sous chaque don, l'encadré « Dans la fiche » montre ses choix et ce que la fiche en fait, ligne par ligne. « Calculé » : la fiche le compte, rien à faire. « À reporter » : à noter vous-même. « Rappel » : à garder en tête, rien n'est calculé. « À vérifier » : un choix manque ou ne convient pas. « Coché » : la case du don est cochée. « En attente » : pas actif pour l'instant."
            },
            {
                title: "« Capacités de classe »",
                text: "La fiche liste ce que votre classe et votre sous-classe vous donnent à votre niveau, avec un court rappel de chaque capacité."
            },
            {
                title: "« Traits de personnage »",
                text: "Un texte libre pour vos traits, vos capacités particulières et vos notes."
            },
            {
                title: "« Compagnons & familiers »",
                text: "Un encadré pour noter une monture, un familier ou un compagnon. Certaines sous-classes y affichent leur compagnon tout prêt."
            },
            {
                title: "« Synergie entre joueurs »",
                text: "Un texte libre pour noter les combinaisons qui marchent bien avec les autres personnages du groupe."
            }
        ]
    },
    {
        id: 'role',
        title: "Onglet « Compétences & Histoire »",
        entries: [
            {
                title: "« Compétences »",
                text: "Cochez le premier rond d'une compétence que vous maîtrisez, le second si vous en avez l'expertise. Le bonus de chaque compétence est calculé."
            },
            {
                title: "« Maîtrises d'armes »",
                text: "Un texte libre pour les armes que votre personnage sait manier."
            },
            {
                title: "« Outils »",
                text: "La case « Outils » est un texte libre. Fiche modifiable, le bouton « Choisir dans la liste » ouvre la fenêtre « Outils maîtrisés » : cochez vos outils dans la liste du manuel, leur nom s'écrit dans la case. Décocher retire seulement ce nom. Ce que vous avez écrit à la main ne bouge pas."
            },
            {
                title: "« Langues »",
                text: "Un texte libre pour les langues que parle votre personnage."
            },
            {
                title: "« Apparence » et « Histoire & personnalité »",
                text: "Des textes libres pour décrire votre personnage et raconter son histoire."
            },
            {
                title: "Mettre un texte en forme",
                text: "Dans les grands textes, sélectionnez quelques mots : une petite barre apparaît pour les mettre en gras, en italique, les souligner, changer leur taille ou leur couleur."
            },
            {
                title: "« Odyssée des Seigneurs Dragons »",
                text: "Cet encadré sert à la campagne du même nom : il contient notamment le « Destin héroïque » et les « Points de renommée »."
            }
        ]
    },
    {
        id: 'magic',
        title: "Onglet « Magie, équipement & trésors »",
        entries: [
            {
                title: "Les trois cases du haut",
                text: "Choisissez votre « Caractéristique d'incantation ». Le « DD de sauvegarde » et le « Bonus d'attaque » de vos sorts sont alors calculés."
            },
            {
                title: "Les emplacements de sorts",
                text: "La fiche affiche les emplacements de votre classe à votre niveau. Cochez un rond quand vous dépensez un emplacement. Le repos long les rend tous."
            },
            {
                title: "Ajouter un sort",
                text: "Fiche modifiable, touchez la case du nom vide en bas du tableau, ou le bouton ▾ (« Choisir dans la liste des sorts ») : la liste des sorts s'ouvre, sans clavier. Vous pouvez aussi taper le début du nom. Le menu « Liste de sorts » choisit la liste proposée, celle de votre classe par défaut."
            },
            {
                title: "Lire une ligne de sort",
                text: "Le losange de gauche dit si le sort est préparé : touchez-le pour le préparer ou non. Un losange plein et fixe marque un sort toujours préparé. Les lettres C, R et M signalent la Concentration, le Rituel et une composante matérielle."
            },
            {
                title: "La mention « Pas d'emplacement »",
                text: "Elle apparaît sous le nom d'un sort préparé dont le niveau dépasse vos emplacements : ce sort ne peut pas encore être lancé. C'est un simple avertissement, rien n'est décoché. Touchez la mention pour lire l'explication."
            },
            {
                title: "Voir un seul niveau",
                text: "Les pastilles « Tous », 0, 1, 2… n'affichent que les sorts du niveau choisi. Le 0 correspond aux sorts mineurs."
            },
            {
                title: "La description d'un sort",
                text: "Touchez le nom d'un sort pour lire sa description dans une bulle. Le bouton avec une bulle, dans la barre du grimoire, allume ou éteint ces descriptions."
            },
            {
                title: "« Préparer mes sorts »",
                text: "Pour le Clerc, le Druide, le Paladin et le Rôdeur, ce bouton ouvre toute la liste de la classe : cochez vos sorts préparés, après un repos long. Un compteur indique combien de sorts sont préparés."
            },
            {
                title: "« Retirer les sorts non préparés »",
                text: "Pour ces mêmes classes, les sorts décochés s'accumulent au grimoire. Fiche modifiable, ce bouton sous le tableau montre la liste des sorts non préparés de votre classe, puis les retire d'un coup. Vos sorts préparés, mineurs ou donnés restent toujours. Un sort où vous avez écrit une note reste aussi, sauf si vous le cochez. La fiche est d'abord gardée dans « Revenir à… »."
            },
            {
                title: "La vue « Au combat »",
                text: "Le bouton « Au combat » ne garde à l'écran que les sorts utilisables : sorts mineurs, sorts préparés et sorts donnés, avec les emplacements restants. Touchez-le de nouveau pour revoir tout le grimoire."
            },
            {
                title: "Le bouton « Lancer »",
                text: "Dans la vue « Au combat », chaque sort a un bouton « Lancer ». Choisissez le niveau d'emplacement : il est coché pour vous. « En rituel » lance le sort sans dépenser d'emplacement, quand le sort le permet."
            },
            {
                title: "« Lancer gratuit »",
                text: "Quand un don, votre espèce ou une capacité (Ennemi juré du Rôdeur, par exemple) offre un sort sans emplacement, la fenêtre « Lancer » propose d'abord « Lancer gratuit », avec le nombre de lancers restants. C'est la case de cette capacité qui se coche, pas un emplacement. Pour annuler, décochez-la. Une fois utilisé, le bouton est grisé jusqu'au repos qui le rend."
            },
            {
                title: "Les sorts donnés",
                text: "Les blocs « Sorts de dons », « Sorts de sous-classe » et « Sorts d'espèce » montrent les sorts donnés par vos dons, votre sous-classe et votre espèce. Ils sont toujours préparés et ne comptent pas dans vos sorts préparés. Cochez la case de leur lancer gratuit quand vous l'utilisez."
            },
            {
                title: "Le livre du Magicien",
                text: "Pour un Magicien, une ligne sous la barre compte les sorts de son livre et rappelle le coût d'une copie. Un rituel du livre non préparé porte la mention « Lançable en rituel ». Dans la vue « Au combat », ces rituels sont rangés sous la ligne « Rituels du livre », repliée au départ : touchez-la pour les voir. Chacun garde son bouton « Lancer », en rituel seulement : 10 minutes de plus, sans emplacement."
            },
            {
                title: "« Équipement & trésor »",
                text: "Un texte libre pour votre équipement, puis vos pièces : PC, PA, PE, PO et PP. Le bouton « Bourse : gagner / dépenser » ajoute ou retire des pièces sans calcul de tête."
            }
        ]
    },
    {
        id: 'rest',
        title: "Repos court et repos long",
        entries: [
            {
                title: "« Repos court (1 h) »",
                text: "Choisissez combien de dés de vie vous dépensez. « Lancer les dés » les lance pour vous ; « Saisir le total » sert si vous lancez vos propres dés. La fiche ajoute votre Constitution, vous soigne, et rend les capacités qui reviennent après un repos court."
            },
            {
                title: "« Repos long (8 h) »",
                text: "« Se reposer » rend tous vos points de vie, vos dés de vie, vos emplacements de sorts et vos capacités. L'épuisement baisse de 1 et les PV temporaires disparaissent. La fiche est d'abord gardée dans « Revenir à… », au cas où."
            },
            {
                title: "Après un repos long",
                text: "Pour un Clerc, un Druide, un Paladin ou un Rôdeur, la fiche propose de choisir les sorts du jour : « Préparer mes sorts », ou « Plus tard »."
            },
            {
                title: "Utilisables fiche verrouillée",
                text: "Les deux repos, les dés de vie et l'épuisement restent utilisables quand la fiche est verrouillée."
            }
        ]
    },
    {
        id: 'level',
        title: "Monter de niveau",
        entries: [
            {
                title: "Noter les points d'expérience",
                text: "Le bouton + à côté de la case PX (« Ajouter des PX gagnés ») ouvre un pavé de chiffres : tapez les « PX gagnés », puis « Ajouter ». Sous la case, la fiche dit combien de PX il manque avant le niveau suivant."
            },
            {
                title: "Passer au niveau suivant",
                text: "Fiche modifiable, le bouton + à côté de la case Niveau ouvre la fenêtre « Passer au niveau », suivie du numéro du nouveau niveau. Elle liste ce qui change : points de vie, bonus de maîtrise, dons, capacités de classe, sorts."
            },
            {
                title: "Les points de vie gagnés",
                text: "Dans cette fenêtre, choisissez la valeur fixe ou tapez le résultat de votre dé. La fiche ajoute votre Constitution, puis met à jour le niveau et les PV maximum."
            },
            {
                title: "En cas d'erreur",
                text: "Avant chaque montée de niveau, la fiche est gardée dans « Revenir à… » : vous pouvez revenir en arrière."
            },
            {
                title: "Ensuite",
                text: "Parcourez les onglets : un nouveau don ou une nouvelle capacité peut demander un choix (repère « À choisir »), et un lanceur de sorts note ses nouveaux sorts dans le grimoire."
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
