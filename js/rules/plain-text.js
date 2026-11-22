// =============================================================================
// PLAIN-TEXT.JS (règles) - Texte brut des saisies (le HTML des anciennes sauvegardes v3)
//
// Les cellules de la v3 étaient des zones modifiables : leur contenu enregistré est du HTML
// (« <div>Korgul</div> », « 1&nbsp;200 », « Arc&nbsp;long<br> »). La fiche ne réécrit jamais ces
// valeurs : elle les LIT en texte brut, avec cette seule fonction (plus de copie de l'expression
// /<[^>]*>/ dans js/rules, js/state, js/data, js/ui et js/cloud : tests/plain-text.test.js le
// vérifie ; le grimoire et le tableau des armes passent par plainText de js/rules/spells.js et
// stripHTML de js/state/migrate.js, qui l'appellent, et les messages d'erreur en ligne aussi).
// Règle commune :
//  - balises retirées, puis entités décodées (&nbsp; devient une espace ordinaire, &amp; « & »,
//    &lt; « < », &#39; « ' »…), espaces du début et de la fin retirées ;
//  - par défaut une balise disparaît sans laisser d'espace : un nom ou un nombre reste d'un seul
//    tenant (« <b>4</b>0 » → « 40 », « <div>Korgul</div> » → « Korgul ») ;
//  - option spaced : une balise compte comme une espace et les suites d'espaces sont ramenées à
//    une seule (« <div>Arc</div><div>long</div> » → « Arc long ») : textes où l'on cherche des
//    mots (historique, espèce, capacités, sorts de concentration) ;
//  - option squash seule : suites d'espaces ramenées à une seule, balises sans espace (grimoire).
// Fonction pure. Testé : tests/plain-text.test.js.
// =============================================================================

/** Entités nommées reconnues (celles qu'écrit un navigateur, plus les guillemets typographiques) */
const ENTITIES = { nbsp: ' ', lt: '<', gt: '>', quot: '"', apos: "'", amp: '&', rsquo: '’', lsquo: '‘', hellip: '…' };
const ENTITY = /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi;
const TAG = /<[^>]*>/g;

/**
 * Décode les entités HTML (« &amp; » → « & », « &#233; » → « é ») ; une entité inconnue reste telle quelle.
 * @param {string} text
 * @returns {string}
 */
export function decodeEntities(text) {
    return String(text).replace(ENTITY, (match, code) => {
        if (code[0] === '#') {
            const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
            return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
        }
        return ENTITIES[code.toLowerCase()] ?? match;
    });
}

/**
 * Texte brut d'une valeur saisie (voir la règle en tête du fichier).
 * @param {*} value - null ou undefined : ''
 * @param {{ spaced?: boolean, squash?: boolean }} [options]
 *   spaced : une balise compte comme une espace (et squash est alors actif) ;
 *   squash : suites d'espaces (retours à la ligne compris) ramenées à une seule
 * @returns {string}
 */
export function plainText(value, { spaced = false, squash = spaced } = {}) {
    if (value === null || value === undefined) return '';
    const text = decodeEntities(String(value).replace(TAG, spaced ? ' ' : ''));
    return (squash ? text.replace(/\s+/g, ' ') : text).trim();
}
