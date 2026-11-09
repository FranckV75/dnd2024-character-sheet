// =============================================================================
// CONTROLLER.JS - Synchronisation de la fiche avec le compte en ligne (sans DOM)
//
// Tout ce qui décide d'écrire ou de lire en ligne est ici, testable sans
// navigateur (tests/cloud-controller.test.js). L'interface (js/ui/account.js)
// fournit seulement les questions posées à l'utilisateur et l'affichage.
//
// « Base » de synchronisation de la fiche ouverte :
//   name      personnage en ligne auquel la fiche est liée ('' = aucun)
//   userId    compte auquel ce lien appartient
//   updatedAt version en ligne connue (updated_at)
//   hash      empreinte du contenu correspondant à cette version
//   sentHashes empreintes des derniers envois non confirmés (réponses éventuellement perdues)
//   detached  l'utilisateur a choisi de garder cette fiche hors ligne
//   charHash  (enregistré seulement) empreinte de la fiche enregistrée avec cette base
// « Modifiée » = l'empreinte actuelle de la fiche diffère de base.hash.
//
// Empreintes : toujours calculées sur la forme normalisée de la fiche (sheetFingerprint :
// celle qu'elle aura après enregistrement puis relecture, migrateCharacter), jamais sur la
// fiche telle qu'elle est en mémoire : un espace final ou une caractéristique vidée, retouchés
// à la relecture, ne font plus croire à une autre fiche (fausse question « existe déjà en
// ligne » / « deux versions différentes »). Les valeurs saisies ne sont pas modifiées.
// Une base enregistrée par la v4.15 (empreintes de la fiche en mémoire) reste reconnue : voir
// storedBaseFor.
//
// Autre onglet (js/state/local-save.js) : quand la fiche enregistrée a été changée par un autre onglet du
// même navigateur, elle est reprise avec la base enregistrée en même temps qu'elle (même personnage :
// les opérations en cours continuent ; un nouveau nom tapé là-bas n'est pas renommé ici).
//
// La base est enregistrée dans le navigateur EN MÊME TEMPS que la fiche (main.js).
// Au chargement, si la fiche enregistrée ne correspond pas à sa base (charHash),
// le lien est oublié : on reposera la question prudente plutôt que de se tromper
// de personnage.
//
// Garanties :
//  - une version en ligne modifiée ailleurs n'est jamais écrasée sans accord ;
//  - une nouvelle fiche ou un import ne peut que CRÉER un personnage en ligne ;
//  - aucun envoi pendant qu'une question est posée ; fermer une question sans
//    répondre choisit l'option la plus prudente (ne rien écraser) ;
//  - une opération en ligne commencée avant un changement de fiche (nouvelle
//    fiche, import, chargement) ou de compte s'arrête sans rien écrire (« génération ») ;
//  - un renommage n'est traité qu'une fois le nom validé (champ quitté) ;
//  - les opérations en ligne s'exécutent l'une après l'autre (file d'attente).
//
// Bascule depuis la v3 (même table, mêmes clés du navigateur) :
//  - une version en ligne écrite par la v3 (sans spell_slots_state) n'est jamais chargée en
//    silence : un onglet v3 resté ouvert a pu remettre des valeurs anciennes (question 'conflict',
//    legacy = true), sauf si elle ne diffère que par l'état de jeu v4, qui est alors remis en ligne ;
//  - premier lancement : une ligne nommée par la v3 un peu autrement (mise en forme dans le nom,
//    dd2024_active_char_name) est renommée au nom de la v4 si son contenu est identique (création
//    puis suppression conditionnelle de l'ancienne), sinon la question 'exists' est posée.
// =============================================================================

import {
    listCharacters, fetchCharacter, insertCharacter, updateIfUnchanged, deleteCharacter, deleteIfUnchanged
} from './repository.js';
import {
    decideOnCheck, cloudName, fingerprint, friendlyError, isLegacyRowName, withoutV4State
} from './sync.js';
import { characterName, STORAGE_KEYS } from '../state/persistence.js';
import { migrateCharacter, normalizeCharacter, isV3Save } from '../state/migrate.js';
import { createDefaultCharacter } from '../state/schema.js';

export const SYNC_KEY = 'dd2024_cloud_sync';
export const LAST_SAVED_KEY = 'dd2024_last_saved';
/** Nom exact de la ligne en ligne enregistré par la v3 (puis par la v4 à chaque sauvegarde) */
export const ACTIVE_NAME_KEY = STORAGE_KEYS.activeName;
const PUSH_DELAY_MS = 2000;

/** La fiche ne contient rien qui mérite d'être préservé */
export function isBlankCharacter(character) {
    const blank = createDefaultCharacter();
    return !characterName(character) && Object.keys(blank).every(key =>
        JSON.stringify(character?.[key] ?? null) === JSON.stringify(blank[key]));
}

/** Dernière empreinte calculée (la fiche du store ne change d'objet qu'à chaque modification) */
let lastHashed = { character: null, hash: '' };

/**
 * Empreinte du contenu d'une fiche, calculée sur sa forme normalisée (voir l'en-tête).
 * @param {Object} character
 * @returns {string}
 */
export function sheetFingerprint(character) {
    if (character && character === lastHashed.character) return lastHashed.hash;
    const hash = fingerprint(normalizeCharacter(character));
    if (character && typeof character === 'object') lastHashed = { character, hash };
    return hash;
}

const EMPTY_BASE = { name: '', userId: '', updatedAt: null, hash: '', sentHashes: [], detached: false };
const MAX_UNCONFIRMED = 3;

/**
 * Lit une base enregistrée (tolère l'absence ou une valeur illisible).
 * @param {string|null} text
 * @returns {Object} base, avec charHash si présent
 */
export function parseBase(text) {
    try {
        const v = JSON.parse(text || 'null');
        if (v && typeof v === 'object' && 'hash' in v) {
            return {
                name: String(v.name || ''), userId: String(v.userId || ''),
                updatedAt: v.updatedAt || null, hash: String(v.hash || ''),
                sentHashes: Array.isArray(v.sentHashes) ? v.sentHashes.filter(h => typeof h === 'string').slice(-MAX_UNCONFIRMED) : [],
                detached: Boolean(v.detached), charHash: String(v.charHash || '')
            };
        }
    } catch {
        // valeur illisible : fiche non liée
    }
    return { ...EMPTY_BASE };
}

/**
 * @param {{
 *   client: Object|null,
 *   store: Object,
 *   storage: { get(key): string|null },
 *   persist: () => void,            // enregistre fiche + base ensemble (main.js)
 *   ui: { ask(kind: string, data: Object): Promise<string|null>, status(message: string): void },
 *   now?: () => Date, setTimer?: Function, clearTimer?: Function, pushDelay?: number
 * }} deps
 *
 * Questions posées (ui.ask) et réponses attendues (null = fenêtre fermée sans choix) :
 *   'exists'           {name, cloudUpdatedAt, localSavedAt} → 'open' | 'replace' | null
 *   'conflict'         {name, cloudUpdatedAt, localSavedAt, legacy} → 'cloud' | 'local' | null
 *                      (legacy = la version en ligne vient d'être écrite par l'ancienne version, v3)
 *   'missing'          {name}                               → 'recreate' | null
 *   'rename'           {oldName, newName}                   → 'rename' | 'copy' | null
 *   'rename-taken'     {oldName, newName}                   → (information)
 *   'replace-unsynced' {name, target}                       → 'confirm' | null
 */
export function createCloudSync({
    client, store, storage, persist, ui,
    now = () => new Date(), setTimer = setTimeout, clearTimer = clearTimeout, pushDelay = PUSH_DELAY_MS
}) {
    let user = null;
    let base = startupBase();
    let epoch = 0;                // « génération » de la fiche ouverte (voir l'en-tête)
    let pending = false;          // une question est affichée
    let ownChange = false;        // modification du store faite par ce module
    let nameEditing = false;      // le champ Nom est en cours de saisie
    let timer = null;
    let queue = Promise.resolve();
    let needsCheck = false;
    let lastError = '';
    // Nouveau nom repris d'un autre onglet, où la question du renommage est posée : jamais
    // reposée ici (une seule question, dans l'onglet où le nom a été tapé)
    let renameElsewhere = '';
    // Premier lancement de la v4 dans ce navigateur (aucun suivi de synchronisation) : nom exact
    // sous lequel la v3 a enregistré cette fiche en ligne, utilisé une seule fois par attach()
    let legacyName = storage.get(SYNC_KEY) === null ? String(storage.get(ACTIVE_NAME_KEY) || '').trim() : '';
    const listeners = new Set();

    /** Base enregistrée, seulement si elle correspond bien à la fiche enregistrée avec elle */
    function startupBase() {
        return storedBaseFor(store.get(), readStoredSheet()) ?? { ...EMPTY_BASE };
    }

    /** Fiche telle qu'elle est écrite dans le navigateur (avant toute normalisation), ou null */
    function readStoredSheet() {
        try {
            const raw = JSON.parse(storage.get(STORAGE_KEYS.character) || 'null');
            return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : null;
        } catch {
            return null;
        }
    }

    /**
     * Base enregistrée (SYNC_KEY) si elle a été enregistrée avec la fiche `character`, sinon null.
     * Base de la v4.15 : son charHash est l'empreinte de la fiche en mémoire, c'est-à-dire du texte
     * enregistré tel quel (`storedRaw`). Reconnue ainsi, elle est convertie : les empreintes qui
     * désignaient ce même contenu (hash, sentHashes) prennent la forme normalisée.
     * @param {Object} character - fiche ouverte (déjà migrée)
     * @param {Object|null} storedRaw - fiche brute enregistrée avec la base
     * @returns {Object|null}
     */
    function storedBaseFor(character, storedRaw) {
        try {
            const { charHash, ...rest } = parseBase(storage.get(SYNC_KEY));
            if (!charHash) return null;
            const current = sheetFingerprint(character);
            if (charHash === current) return { ...EMPTY_BASE, ...rest };
            const legacy = storedRaw ? fingerprint(storedRaw) : '';
            if (!legacy || charHash !== legacy || sheetFingerprint(storedRaw) !== current) return null;
            const upgrade = (hash) => (hash === legacy ? current : hash);
            return { ...EMPTY_BASE, ...rest, hash: upgrade(rest.hash), sentHashes: rest.sentHashes.map(upgrade) };
        } catch {
            return null; // fiche enregistrée illisible (valeur que la lecture ne sait pas convertir)
        }
    }

    /** Base enregistrée qui va avec la fiche brute `storedRaw` enregistrée par un autre onglet, ou null */
    function storedBaseForRaw(storedRaw) {
        if (!storedRaw) return null;
        try {
            return storedBaseFor(normalizeCharacter(storedRaw), storedRaw);
        } catch {
            return null;
        }
    }

    /** Même personnage en ligne (nom, compte, gardé hors ligne ou non) */
    const sameLink = (a, b) => a.name === b.name && a.userId === b.userId && a.detached === b.detached;

    /**
     * Base reprise d'un autre onglet (fiche ou base enregistrées là-bas). Une question posée ici
     * concernait l'ancien lien : si le lien a changé, elle est abandonnée (génération suivante).
     */
    function adoptBase(next) {
        if (pending && !sameLink(base, next)) epoch += 1;
        base = next;
        // Nouveau nom repris de l'autre onglet : c'est lui qui pose la question du renommage
        const name = current();
        renameElsewhere = linked() && name && name !== linked() ? name : '';
    }

    const current = () => cloudName(characterName(store.get()));
    /** Nom du personnage lié, valable pour l'utilisateur connecté */
    const linked = () => (base.name && !base.detached && user && base.userId === user.id ? base.name : '');
    const isDirty = () => sheetFingerprint(store.get()) !== base.hash;
    const contentOf = (row) => sheetFingerprint(row.data);
    /** Version écrite par la v3, identique à la fiche à l'état de jeu v4 près (que la v3 ne connaît pas) */
    const sameApartFromV4State = (row, character) => isV3Save(row.data)
        && fingerprint(withoutV4State(normalizeCharacter(row.data))) === fingerprint(withoutV4State(normalizeCharacter(character)));

    /** Photographie (génération + compte) ; stale(s) = la fiche ou le compte a changé depuis */
    const snapshot = () => ({ epoch, userId: user?.id || null });
    const stale = (s) => s.epoch !== epoch || s.userId !== (user?.id || null);

    function setBase(patch) {
        base = { ...base, ...patch };
        persist();
        emit();
    }

    /** Lie la fiche à une version en ligne, dont `data` est le contenu envoyé ou chargé */
    function linkTo(name, userId, updatedAt, data) {
        setBase({ name, userId, updatedAt, hash: sheetFingerprint(data), sentHashes: [], detached: false });
        if (isDirty()) schedulePush();
    }

    function detach(name, message) {
        setBase({ name: name || '', userId: user?.id || '', detached: true });
        if (message) ui.status(message);
    }

    function emit() {
        const state = getState();
        for (const listener of listeners) {
            try {
                listener(state);
            } catch (error) {
                console.error('Erreur dans l\'affichage de la synchronisation :', error);
            }
        }
    }

    function enqueue(task) {
        const run = queue.then(async () => {
            try {
                await task();
                lastError = '';
            } catch (error) {
                lastError = friendlyError(error);
                ui.status(`⚠️ ${lastError}. La fiche reste enregistrée dans ce navigateur.`);
            }
            emit();
        });
        // La file ne reste jamais bloquée, même si l'affichage échoue
        queue = run.catch(() => {});
        return queue;
    }

    /** Pose une question ; renvoie null si la fiche ou le compte a changé entre-temps */
    async function ask(kind, data) {
        const s = snapshot();
        pending = true;
        clearTimer(timer);
        timer = null;
        emit();
        try {
            const answer = await ui.ask(kind, data);
            return stale(s) ? null : answer;
        } finally {
            pending = false;
            emit();
        }
    }

    function changeStore(fn) {
        ownChange = true;
        try {
            fn();
        } finally {
            ownChange = false;
        }
    }

    function load(row, message) {
        const { character } = migrateCharacter(row.data);
        // Nom de ligne v3 différent du nom affiché (mise en forme…) : la fiche prend le nom en ligne
        if (cloudName(characterName(character)) !== row.name) character.char_name = row.name;
        epoch += 1;
        changeStore(() => store.replace(character));
        setBase({
            name: row.name, userId: user.id, updatedAt: row.updated_at, hash: sheetFingerprint(character), sentHashes: [], detached: false
        });
        ui.status(message || `☁️ « ${row.name} » chargé depuis votre compte.`);
    }

    function restoreName(name) {
        store.update({ char_name: name });
        schedulePush();
    }

    // ------------------------------------------------------------- Envoi
    /**
     * @param {boolean} nameCommitted - true quand le nom vient d'être validé (seul moment où
     *        un renommage ou une création sous un nouveau nom est traité)
     */
    async function push(nameCommitted = false) {
        if (!client || !user || pending || base.detached) return;
        const s = snapshot();
        const name = current();
        if (!name) {
            if (isDirty() && !isBlankCharacter(store.get())) ui.status('☁️ Donnez un nom au personnage pour l\'enregistrer en ligne.');
            return;
        }
        const attached = linked();
        const nameReady = nameCommitted && !nameEditing;
        if (!attached) {
            if (nameReady || !nameEditing) await attach(name, s);
            return;
        }
        if (name !== attached) {
            // Nom tapé dans un autre onglet : la question y est posée, pas ici
            if (nameReady && name !== renameElsewhere) await renameFlow(name, s);
            return;
        }
        if (!isDirty()) return;

        const data = store.get();
        setBase({ sentHashes: [...base.sentHashes, sheetFingerprint(data)].slice(-MAX_UNCONFIRMED) });
        const updatedAt = await updateIfUnchanged(client, user.id, name, data, base.updatedAt, now());
        if (stale(s)) return;
        if (updatedAt) {
            linkTo(name, s.userId, updatedAt, data);
            return;
        }
        // Rien n'a été écrit : la version en ligne a changé ou n'existe plus
        const row = await fetchCharacter(client, user.id, name);
        if (stale(s)) return;
        if (!row) await handleMissing(name, s);
        else await handleConflict(name, row, s);
    }

    /**
     * Pendant une lecture en ligne, un autre onglet de ce navigateur a lié la fiche à `name` (il
     * l'a créée ou envoyée en ligne, adoptStoredBase) : plus de question à poser, l'envoi suivant
     * ajoute les changements de cet onglet.
     */
    function linkedMeanwhile(name) {
        if (linked() !== name) return false;
        if (isDirty()) schedulePush();
        return true;
    }

    /**
     * Lie une fiche non liée au personnage en ligne du même nom, ou le crée.
     * La ligne existante est lue AVANT toute création (une création refusée laisserait une
     * erreur 409 dans la console du navigateur) ; la création reste « création seule ».
     */
    async function attach(name, s) {
        // Date de la fiche de ce navigateur avant toute écriture faite ici (comparée à la version en ligne)
        const localSavedAt = storage.get(LAST_SAVED_KEY);
        const hint = legacyName;
        legacyName = '';
        let row = await fetchCharacter(client, s.userId, name);
        if (stale(s) || linkedMeanwhile(name)) return;
        if (!row && isLegacyRowName(hint, name)) {
            // Fiche enregistrée par la v3 sous un nom un peu différent (mise en forme dans le nom)
            const old = await fetchCharacter(client, s.userId, hint);
            if (stale(s)) return;
            if (old) {
                await attachLegacyRow(name, old, localSavedAt, s);
                return;
            }
        }
        if (!row) {
            const data = store.get();
            const result = await insertCharacter(client, s.userId, name, data, now());
            if (stale(s)) return;
            if (result.ok) {
                linkTo(name, s.userId, result.updatedAt, data);
                ui.status(`☁️ « ${name} » ajouté à votre compte.`);
                return;
            }
            // Créé ailleurs entre la lecture et la création
            row = await fetchCharacter(client, s.userId, name);
            if (stale(s)) return;
        }
        if (linkedMeanwhile(name)) return;
        if (!row) throw new Error(`« ${name} » est momentanément indisponible en ligne, nouvel essai à la prochaine modification`);
        if (contentOf(row) === sheetFingerprint(store.get())) {
            linkTo(name, s.userId, row.updated_at, store.get());
            return;
        }
        // Version écrite par la v3, identique à l'état de jeu près (repris des anciennes clés du
        // navigateur) : liée, puis complétée en ligne par l'envoi qui suit
        if (sameApartFromV4State(row, store.get())) {
            linkTo(name, s.userId, row.updated_at, migrateCharacter(row.data).character);
            return;
        }
        if (linkedMeanwhile(name)) return;
        const choice = await ask('exists', { name, cloudUpdatedAt: row.updated_at, localSavedAt });
        if (stale(s)) return;
        if (choice === 'open') {
            load(row);
        } else if (choice === 'replace') {
            const sent = store.get();
            const updatedAt = await updateIfUnchanged(client, s.userId, name, sent, row.updated_at, now());
            if (stale(s)) return;
            if (updatedAt) {
                linkTo(name, s.userId, updatedAt, sent);
                ui.status(`☁️ Version en ligne de « ${name} » remplacée.`);
            } else {
                ui.status(`⚠️ « ${name} » vient d'être modifié ailleurs : rien n'a été remplacé.`);
            }
        } else {
            detach('', `Fiche « ${name} » gardée dans ce navigateur seulement : votre compte n'est pas modifié.`);
        }
    }

    /**
     * Premier lancement de la v4 : la v3 avait enregistré cette fiche en ligne sous un nom écrit
     * autrement (`old.name`, ex. « Korgul B rise-Crâne »). Plutôt qu'un doublon, la ligne passe au
     * nom de la v4 : création sous ce nom, puis suppression de l'ancienne ligne seulement si elle
     * n'a pas changé entre-temps. Contenu différent : la question habituelle est posée d'abord.
     */
    async function attachLegacyRow(name, old, localSavedAt, s) {
        const same = contentOf(old) === sheetFingerprint(store.get()) || sameApartFromV4State(old, store.get());
        if (!same) {
            const choice = await ask('exists', { name: old.name, cloudUpdatedAt: old.updated_at, localSavedAt });
            if (stale(s)) return;
            if (choice === 'open') {
                load(old);
                return;
            }
            if (choice !== 'replace') {
                detach('', `Fiche « ${name} » gardée dans ce navigateur seulement : votre compte n'est pas modifié.`);
                return;
            }
        }
        const data = store.get();
        const result = await insertCharacter(client, s.userId, name, data, now());
        if (stale(s)) return;
        if (!result.ok) {
            // Le nouveau nom vient d'être créé ailleurs : cas ordinaire (lecture, comparaison, question)
            await attach(name, s);
            return;
        }
        linkTo(name, s.userId, result.updatedAt, data);
        if (await deleteIfUnchanged(client, s.userId, old.name, old.updated_at)) {
            ui.status(`☁️ « ${old.name} » (nom enregistré par l'ancienne version) renommé en « ${name} ».`);
        } else {
            ui.status(`☁️ « ${name} » ajouté ; « ${old.name} » a été modifié ailleurs et a été conservé.`);
        }
    }

    async function handleMissing(name, s) {
        const choice = await ask('missing', { name });
        if (stale(s)) return;
        if (choice === 'recreate') {
            setBase({ ...EMPTY_BASE });
            await attach(current() || name, s);
        } else {
            detach('', `Fiche « ${name} » gardée dans ce navigateur seulement.`);
        }
    }

    async function handleConflict(name, row, s) {
        const cloudContent = contentOf(row);
        if (cloudContent === sheetFingerprint(store.get())) {
            linkTo(name, s.userId, row.updated_at, store.get());
            return;
        }
        // Un de nos envois est bien arrivé (réponse perdue), puis la fiche a encore changé :
        // ce n'est pas un conflit, on reprend la version en ligne comme base et on renvoie
        if (base.sentHashes.includes(cloudContent)) {
            setBase({ updatedAt: row.updated_at, hash: cloudContent, sentHashes: [] });
            schedulePush();
            return;
        }
        // Réenregistrée par la v3 (onglet resté ouvert) sans autre changement que la perte de
        // l'état de jeu v4 : rien à demander, la fiche de ce navigateur le remet en ligne
        if (sameApartFromV4State(row, store.get())) {
            linkTo(name, s.userId, row.updated_at, migrateCharacter(row.data).character);
            return;
        }
        const choice = await ask('conflict', {
            name, cloudUpdatedAt: row.updated_at, localSavedAt: storage.get(LAST_SAVED_KEY), legacy: isV3Save(row.data)
        });
        if (stale(s)) return;
        if (choice === 'cloud') {
            load(row);
        } else if (choice === 'local') {
            const sent = store.get();
            const updatedAt = await updateIfUnchanged(client, s.userId, name, sent, row.updated_at, now());
            if (stale(s)) return;
            if (updatedAt) {
                linkTo(name, s.userId, updatedAt, sent);
                ui.status(`☁️ Version en ligne de « ${name} » remplacée par celle de ce navigateur.`);
            } else {
                ui.status(`⚠️ « ${name} » vient encore d'être modifié ailleurs : rien n'a été remplacé.`);
            }
        } else {
            detach(name, `Fiche « ${name} » non synchronisée : rien n'a été remplacé.`);
        }
    }

    async function renameFlow(newName, s) {
        const oldName = linked();
        const oldUpdatedAt = base.updatedAt;
        const taken = await fetchCharacter(client, s.userId, newName);
        if (stale(s)) return;
        if (taken) {
            await ask('rename-taken', { oldName, newName });
            if (!stale(s)) restoreName(oldName);
            return;
        }
        const choice = await ask('rename', { oldName, newName });
        if (stale(s)) return;
        if (choice !== 'rename' && choice !== 'copy') {
            restoreName(oldName);
            return;
        }
        const data = store.get();
        const result = await insertCharacter(client, s.userId, newName, data, now());
        if (stale(s)) return;
        if (result.conflict) {
            await ask('rename-taken', { oldName, newName });
            if (!stale(s)) restoreName(oldName);
            return;
        }
        linkTo(newName, s.userId, result.updatedAt, data);
        if (choice === 'copy') {
            ui.status(`☁️ Copie « ${newName} » créée ; « ${oldName} » est conservé.`);
        } else if (await deleteIfUnchanged(client, s.userId, oldName, oldUpdatedAt)) {
            ui.status(`☁️ « ${oldName} » renommé en « ${newName} ».`);
        } else {
            ui.status(`☁️ « ${newName} » créé ; « ${oldName} » a été modifié ailleurs et a été conservé.`);
        }
    }

    // ------------------------------------------------------------- Vérification
    async function check({ atLogin = false } = {}) {
        if (!client || !user || pending) return;
        const s = snapshot();
        // Fiche liée au compte d'une autre personne (même navigateur) : jamais ajoutée en douce
        if (base.name && base.userId && base.userId !== user.id && !base.detached) {
            detach('', 'Cette fiche vient d\'un autre compte : elle reste dans ce navigateur. « ☁️ Enregistrer en ligne » pour l\'ajouter au vôtre.');
            return;
        }
        try {
            const attachedName = linked();
            const row = attachedName ? await fetchCharacter(client, s.userId, attachedName) : undefined;
            if (stale(s)) return;
            const latest = atLogin && !attachedName && isBlankCharacter(store.get())
                ? await fetchCharacter(client, s.userId) : undefined;
            if (stale(s)) return;
            needsCheck = false;
            // État relu APRÈS les requêtes : l'utilisateur a pu taper entre-temps
            const decision = decideOnCheck({
                attachedName, baseUpdatedAt: base.updatedAt, dirty: isDirty(), detached: base.detached,
                localIsBlank: isBlankCharacter(store.get()), localName: current(), allowLatest: atLogin, row, latest
            });
            switch (decision.action) {
                case 'push':
                case 'attach':
                    await push(true);
                    break;
                case 'load':
                    // Écrite par l'ancienne version (onglet v3 resté ouvert ailleurs) : elle a pu remettre
                    // des valeurs plus anciennes et a perdu l'état de jeu v4 → jamais chargée sans demander
                    if (isV3Save(row.data)) await handleConflict(attachedName, row, s);
                    else load(row, `☁️ « ${row.name} » mis à jour depuis votre compte (modifié sur un autre appareil).`);
                    break;
                case 'load-latest':
                    load(latest);
                    break;
                case 'conflict':
                    await handleConflict(attachedName, row, s);
                    break;
                case 'missing':
                    await handleMissing(attachedName, s);
                    break;
                default:
                    break;
            }
        } catch (error) {
            needsCheck = true;
            throw error;
        }
    }

    // ------------------------------------------------------------- Événements
    function schedulePush() {
        if (!client || !user || base.detached || pending) return;
        clearTimer(timer);
        timer = setTimer(() => {
            timer = null;
            enqueue(() => push(false));
        }, pushDelay);
    }

    let lastSeen = store.get();
    store.subscribe((state, changedKeys, meta = {}) => {
        const previous = lastSeen;
        lastSeen = state;
        if (ownChange) return;
        if (changedKeys === null && meta.source === 'other-tab') {
            // Fiche reprise d'un autre onglet (main.js), qui l'a enregistrée avec sa base : la base
            // est reprise aussi. Même personnage (même nom) : une opération en ligne en cours ici
            // continue (une création réussie lie la fiche ; l'envoi suivant ajoute les changements
            // repris). Autre personnage : abandonnée (génération suivante).
            const samePerson = cloudName(characterName(previous)) === current();
            if (!samePerson) epoch += 1;
            clearTimer(timer);
            timer = null;
            legacyName = '';
            // Base pas encore lisible : elle arrive dans un événement séparé, souvent juste après
            // celui de la fiche (main.js). Celle de cet onglet est gardée pour le même personnage,
            // puis remplacée par adoptStoredBase dès que la base enregistrée arrive.
            adoptBase(storedBaseForRaw(meta.stored ?? null) ?? (samePerson ? base : { ...EMPTY_BASE }));
            emit();
            // Saisies de cet onglet gardées par-dessus (meta.merged) : envoyées comme d'habitude
            if (meta.merged && current()) schedulePush();
            return;
        }
        if (changedKeys === null) {
            // Import d'un fichier ou nouvelle fiche : plus lié à aucun personnage en ligne,
            // et toute opération en cours concernant l'ancienne fiche est abandonnée
            epoch += 1;
            clearTimer(timer);
            timer = null;
            base = { ...EMPTY_BASE };
            legacyName = '';
            emit();
            if (user && current()) schedulePush();
            return;
        }
        emit();
        // Le nom est traité quand on quitte le champ (nameCommitted)
        if (changedKeys.length === 1 && changedKeys[0] === 'char_name') return;
        schedulePush();
    });

    function getState() {
        return {
            available: Boolean(client),
            user,
            name: linked(),
            dirty: Boolean(linked()) && isDirty(),
            // La fiche a un nom (sans nom, elle n'est jamais envoyée en ligne)
            named: Boolean(current()),
            // Nouveau nom tapé dans un autre onglet, où la question du renommage attend
            renameElsewhere: Boolean(renameElsewhere) && renameElsewhere === current() && renameElsewhere !== linked(),
            detached: base.detached,
            pending,
            needsCheck,
            lastError
        };
    }

    const signedIn = () => {
        if (user && client) return true;
        ui.status('Connectez-vous pour gérer vos personnages en ligne.');
        return false;
    };

    return {
        getState,
        /** Base à enregistrer avec la fiche (main.js), avec l'empreinte de la fiche enregistrée */
        getBase: () => ({ ...base, charHash: sheetFingerprint(store.get()) }),

        /**
         * Un autre onglet a changé la base enregistrée sans changer la fiche (envoi en ligne
         * réussi là-bas) : reprise si elle a été enregistrée avec la fiche `storedRaw` (texte du
         * navigateur) et si aucune question n'est posée ici ; sinon la base de cet onglet reste.
         * @param {Object|null} storedRaw
         */
        adoptStoredBase(storedRaw) {
            const adopted = storedBaseForRaw(storedRaw);
            if (!adopted) return;
            adoptBase(adopted);
            emit();
        },
        onChange(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },

        /** Utilisateur connecté (ou null). Déclenche la vérification à la connexion. */
        setUser(nextUser) {
            const changed = (user?.id || null) !== (nextUser?.id || null);
            user = nextUser || null;
            if (changed) {
                epoch += 1;
                clearTimer(timer);
                timer = null;
            }
            emit();
            return changed && user ? enqueue(() => check({ atLogin: true })) : queue;
        },

        /** Le champ Nom est en cours de saisie (true) ou vient d'être quitté (false) */
        setNameEditing(editing) {
            nameEditing = Boolean(editing);
        },

        /** Vérifier de nouveau (retour sur l'onglet, retour du réseau) */
        check() {
            return enqueue(() => check());
        },

        /** Le champ Nom a été validé (on l'a quitté) */
        nameCommitted() {
            nameEditing = false;
            renameElsewhere = ''; // nom validé dans cet onglet : la question est posée ici
            if (!user || base.detached) return queue;
            clearTimer(timer);
            timer = null;
            return enqueue(() => push(true));
        },

        /** Envoyer tout de suite ce qui attend (page masquée, déconnexion, changement de fiche) */
        flush() {
            if (timer === null) return queue;
            clearTimer(timer);
            timer = null;
            return enqueue(() => push(false));
        },

        list() {
            if (!client || !user) return Promise.resolve([]);
            return listCharacters(client, user.id);
        },

        /** Ouvrir un personnage du compte (demande si la fiche ouverte n'est pas en sécurité) */
        open(name) {
            return enqueue(async () => {
                if (!signedIn()) return;
                if (timer !== null) {
                    clearTimer(timer);
                    timer = null;
                    await push(false);
                }
                const s = snapshot();
                const row = await fetchCharacter(client, s.userId, name);
                if (stale(s)) return;
                if (!row) throw new Error(`« ${name} » est introuvable dans votre compte`);
                // Évalué APRÈS la requête : rien ne peut être perdu si la fiche est vierge,
                // ou liée et à jour en ligne
                const safe = isBlankCharacter(store.get()) || (linked() && linked() === current() && !isDirty());
                if (!safe) {
                    const choice = await ask('replace-unsynced', { name: current() || 'sans nom', target: name });
                    if (choice !== 'confirm' || stale(s)) return;
                }
                load(row);
            });
        },

        /** Supprimer un personnage du compte (la fiche ouverte n'est jamais effacée) */
        remove(name) {
            return enqueue(async () => {
                if (!signedIn()) return;
                await deleteCharacter(client, user.id, name);
                if (name === linked()) detach('');
                ui.status(`« ${name} » supprimé de votre compte.`);
            });
        },

        /** Remettre en ligne une fiche gardée hors ligne */
        reattach() {
            return enqueue(async () => {
                if (!signedIn()) return;
                const keep = base.detached && base.name && base.userId === user.id;
                setBase(keep ? { detached: false } : { ...EMPTY_BASE });
                await push(true);
            });
        }
    };
}
