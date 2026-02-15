// =============================================================================
// STORAGE.JS - GESTION DE LA PERSISTANCE (localStorage, import/export)
// =============================================================================

// =============================================================================
// NETTOYAGE DES DONNÉES LEGACY
// =============================================================================

/**
 * Nettoie les données legacy des balises HTML et convertit les types
 * @param {Object} data - Données brutes à nettoyer
 * @returns {Object} - Données nettoyées
 */
function cleanLegacyData(data) {
    if (!data || typeof data !== 'object') return {};

    const cleaned = {};

    // Fonction utilitaire pour supprimer les balises HTML
    const stripHTML = (str) => {
        if (typeof str !== 'string') return str;
        // Supprime toutes les balises HTML et décode les entités HTML basiques
        return str.replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
    };

    // Fonction pour extraire un nombre d'une chaîne
    const extractNumber = (str) => {
        if (typeof str === 'number') return str;
        if (typeof str !== 'string') return 0;
        const clean = stripHTML(str);
        const match = clean.match(/-?\d+/);
        return match ? parseInt(match[0], 10) : 0;
    };

    // Liste des champs numériques
    const numericFields = [
        'str_score', 'dex_score', 'con_score', 'int_score', 'wis_score', 'cha_score',
        'char_level', 'ac', 'hp_max', 'hp_current', 'hp_temp', 'hd_current', 'hd_max',
        'gp', 'sp', 'cp', 'ep', 'pp'
    ];

    // Liste des champs texte qui doivent être nettoyés du HTML
    const textFields = [
        'char_name', 'char_class', 'char_subclass', 'char_background',
        'char_species', 'char_size', 'char_xp', 'heroic_inspiration',
        'speed', 'initiative', 'passive_perception', 'hd_total', 'hd_spent', 'hd_type'
    ];

    // Nettoyer tous les champs
    for (const key in data) {
        if (!data.hasOwnProperty(key)) continue;

        const value = data[key];

        // Traiter les champs numériques
        if (numericFields.includes(key)) {
            cleaned[key] = extractNumber(value);
        }
        // Traiter les champs texte
        else if (textFields.includes(key)) {
            cleaned[key] = stripHTML(value);
        }
        // Traiter les tableaux (armes, sorts)
        else if (Array.isArray(value)) {
            cleaned[key] = value.map(item => {
                if (typeof item === 'object' && item !== null) {
                    // Nettoyage récursif des objets dans les tableaux
                    const cleanedItem = {};
                    for (const itemKey in item) {
                        if (item.hasOwnProperty(itemKey)) {
                            cleanedItem[itemKey] = typeof item[itemKey] === 'string'
                                ? stripHTML(item[itemKey])
                                : item[itemKey];
                        }
                    }
                    return cleanedItem;
                }
                return item;
            });
        }
        // Copier les autres valeurs telles quelles (checkboxes, etc.)
        else {
            cleaned[key] = value;
        }
    }

    // Valeurs par défaut pour les champs essentiels
    cleaned.str_score = cleaned.str_score || 10;
    cleaned.dex_score = cleaned.dex_score || 10;
    cleaned.con_score = cleaned.con_score || 10;
    cleaned.int_score = cleaned.int_score || 10;
    cleaned.wis_score = cleaned.wis_score || 10;
    cleaned.cha_score = cleaned.cha_score || 10;
    cleaned.char_level = cleaned.char_level || 1;

    return cleaned;
}

// =============================================================================
// COLLECTE ET APPLICATION DES DONNÉES
// =============================================================================

/**
 * Collecte toutes les données du formulaire
 * @returns {Object} - Objet contenant toutes les données de la fiche
 */
function getFormData() {
    const d = {};
    document.querySelectorAll('input, select').forEach(el => {
        if (el.name) {
            if (el.type === 'checkbox') d[el.name] = el.checked;
            else d[el.name] = el.value;
        }
    });
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        let key = el.dataset.name || el.id;
        if (key) {
            if (!el.classList.contains('wpn-name') && !el.classList.contains('wpn-atk') &&
                !el.classList.contains('wpn-dmg') && !el.classList.contains('wpn-note') &&
                !el.classList.contains('spl-lvl') && !el.classList.contains('spl-name') &&
                !el.classList.contains('spl-time') && !el.classList.contains('spl-range') &&
                !el.classList.contains('spl-note')) {
                d[key] = el.innerHTML;
            }
        }
    });
    const weapons = [];
    const wBody = document.getElementById('weapons_body');
    if (wBody) {
        wBody.querySelectorAll('tr').forEach(tr => {
            weapons.push({
                name: tr.querySelector('.wpn-name').innerHTML,
                atk: tr.querySelector('.wpn-atk').innerHTML,
                dmg: tr.querySelector('.wpn-dmg').innerHTML,
                note: tr.querySelector('.wpn-note').innerHTML
            });
        });
    }
    d['dynamic_weapons'] = weapons;

    const spells = [];
    const sBody = document.getElementById('spells_body');
    if (sBody) {
        sBody.querySelectorAll('tr').forEach(tr => {
            spells.push({
                lvl: (tr.querySelector('.spl-lvl').tagName === 'SELECT') ? tr.querySelector('.spl-lvl').value : tr.querySelector('.spl-lvl').innerHTML,
                name: tr.querySelector('.spl-name').innerHTML,
                time: tr.querySelector('.spl-time').innerHTML,
                range: tr.querySelector('.spl-range').innerHTML,
                note: tr.querySelector('.spl-note').innerHTML,
                c: tr.querySelector('.spl-c').checked,
                r: tr.querySelector('.spl-r').checked,
                m: tr.querySelector('.spl-m').checked,
                prep: tr.querySelector('.spl-prep') ? tr.querySelector('.spl-prep').checked : false,
                school: tr.querySelector('.spl-school') ? tr.querySelector('.spl-school').textContent : ''
            });
        });
    }
    d['dynamic_spells'] = spells;

    let pp = document.getElementById('passive_perc');
    if (pp && pp.dataset.manual) d['passive_perc_manual'] = 'true';

    // Save dynamic class resource checks
    const resSlots = document.getElementById('class-resource-slots');
    if (resSlots && resSlots.children.length > 0) {
        for (let i = 0; i < resSlots.children.length; i++) {
            d[`class_res_${i}`] = resSlots.children[i].checked;
        }
    }

    // Odyssée des Seigneurs Dragons
    const heroicDestinyEl = document.getElementById('heroic_destiny');
    if (heroicDestinyEl) d['heroic_destiny'] = heroicDestinyEl.value;

    const gloryEl = document.getElementById('glory_score');
    if (gloryEl) d['glory_score'] = gloryEl.value;

    const vanityEl = document.getElementById('vanity_score');
    if (vanityEl) d['vanity_score'] = vanityEl.value;

    return d;
}

/**
 * Applique les données au formulaire
 * @param {Object} d - Données à appliquer
 */
function applyFormData(d) {
    document.querySelectorAll('input, select').forEach(el => {
        if (el.name && d.hasOwnProperty(el.name)) {
            if (el.type === 'checkbox') el.checked = d[el.name];
            else el.value = d[el.name];
        }
    });
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        let key = el.dataset.name || el.id;
        if (key && d.hasOwnProperty(key)) {
            el.innerHTML = d[key];
        }
    });

    // Legacy migration
    if (d.profs_other && !d.profs_weapons) {
        let el = document.querySelector('[data-name="profs_weapons"]');
        if (el) el.innerHTML = d.profs_other;
    }

    const tbodyW = document.getElementById('weapons_body');
    if (tbodyW) {
        tbodyW.innerHTML = '';
        if (d.dynamic_weapons && Array.isArray(d.dynamic_weapons)) {
            d.dynamic_weapons.forEach(w => addWeaponRow(w));
        } else {
            for (let i = 0; i < 4; i++) addWeaponRow();
        }
    }

    const tbodyS = document.getElementById('spells_body');
    if (tbodyS) {
        tbodyS.innerHTML = '';
        if (d.dynamic_spells && Array.isArray(d.dynamic_spells)) {
            d.dynamic_spells.forEach(s => addSpellRow(s));
        } else {
            for (let i = 0; i < 6; i++) addSpellRow();
        }
    }

    let pp = document.getElementById('passive_perc');
    if (pp && d['passive_perc_manual']) pp.dataset.manual = 'true';

    // Restore class resource checks AFTER calcStats potentially recreates them
    calcStats();

    const resSlots = document.getElementById('class-resource-slots');
    if (resSlots && resSlots.children.length > 0) {
        for (let i = 0; i < resSlots.children.length; i++) {
            if (d[`class_res_${i}`]) {
                resSlots.children[i].checked = true;
            }
        }
    }

    // Odyssée des Seigneurs Dragons
    const heroicDestinyEl = document.getElementById('heroic_destiny');
    if (heroicDestinyEl && d.heroic_destiny) heroicDestinyEl.value = d.heroic_destiny;

    const gloryEl = document.getElementById('glory_score');
    if (gloryEl && d.glory_score) gloryEl.value = d.glory_score;

    const vanityEl = document.getElementById('vanity_score');
    if (vanityEl && d.vanity_score) vanityEl.value = d.vanity_score;

    // Mettre à jour les sous-classes après avoir restauré la classe
    const classSelect = document.getElementById('char_class');
    if (classSelect && classSelect.value) {
        updateSubclassOptions(classSelect.value);
        // Restaurer la sous-classe après avoir rempli les options
        const subclassSelect = document.getElementById('char_subclass');
        if (subclassSelect && d.char_subclass) {
            // Petit délai pour que les options soient remplies
            setTimeout(() => {
                subclassSelect.value = d.char_subclass;
            }, 50);
        }
    }
}

// =============================================================================
// SAUVEGARDE ET CHARGEMENT
// =============================================================================

/**
 * Sauvegarde les données dans localStorage et synchronise avec Supabase
 */
async function saveData() {
    const data = getFormData();

    // 1. Sauvegarde locale (immédiate)
    localStorage.setItem('dd2024_char', JSON.stringify(data));
    showModal('Sauvegardé localement !');

    // 2. Synchronisation Cloud (si connecté)
    if (currentUser) {
        try {
            console.log('☁️ Supabase : Tentative de synchronisation...');
            const { error } = await supabase
                .from('characters')
                .upsert({
                    name: data.char_name || 'Sans nom',
                    data: data,
                    user_id: currentUser.id,
                    updated_at: new Date()
                }, { onConflict: 'name, user_id' });

            if (error) throw error;
            console.log('✅ Supabase : Synchronisé avec succès');
        } catch (err) {
            console.warn('❌ Supabase : Échec de synchronisation', err.message);
        }
    }
}

/**
 * Charge les données depuis Supabase (priorité si connecté) avec fallback localStorage
 */
async function loadData() {
    // 1. Essayer de charger depuis Supabase si connecté
    if (window.currentUser) {
        try {
            console.log('☁️ Supabase : Chargement des données pour', window.currentUser.id);
            const { data, error } = await supabase
                .from('characters')
                .select('data')
                .eq('user_id', window.currentUser.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (data && data.data) {
                console.log('✅ Supabase : Données cloud chargées');
                const cleanedData = cleanLegacyData(data.data);
                applyFormData(cleanedData);
                return;
            }
        } catch (err) {
            console.log('ℹ️ Supabase : Pas de données cloud pour cet utilisateur');
        }
    }

    // 2. Fallback sur localStorage
    let d = localStorage.getItem('dd2024_char');
    if (d) {
        const rawData = JSON.parse(d);
        const cleanedData = cleanLegacyData(rawData);
        applyFormData(cleanedData);
    }
}

/**
 * Importe des données depuis un fichier
 * @param {HTMLInputElement} el - Input file element
 */
function importData(el) {
    let f = el.files[0];
    if (!f) return;
    let r = new FileReader();
    r.onload = e => {
        try {
            const rawData = JSON.parse(e.target.result);
            const cleanedData = cleanLegacyData(rawData);
            applyFormData(cleanedData);
            showModal('Fiche chargée et nettoyée !');
        }
        catch (err) {
            console.error('Erreur import:', err);
            showModal('Erreur fichier.');
        }
    };
    r.readAsText(f);
    el.value = '';
}

// =============================================================================
// AUTHENTIFICATION UI
// =============================================================================

function openAuthModal() {
    const content = `
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
            <input type="email" id="auth-email" placeholder="Email" class="std-input">
            <input type="password" id="auth-pwd" placeholder="Mot de passe" class="std-input">
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button class="btn" onclick="handleAuthAction('signin')">Connexion</button>
                <button class="btn btn-save" onclick="handleAuthAction('signup')">Créer un compte</button>
            </div>
            <p style="font-size:0.7rem; color:#666; margin-top:5px;">Si c'est votre première fois, cliquez sur 'Créer un compte'.</p>
        </div>
    `;

    showModal('Accès au Grimoire Cloud', null, true);
    const modalContent = document.querySelector('.modal-content');
    const authWrapper = document.getElementById('auth-wrapper') || document.createElement('div');
    authWrapper.id = 'auth-wrapper';
    authWrapper.innerHTML = content;
    modalContent.appendChild(authWrapper);
}

async function handleAuthAction(type) {
    const email = document.getElementById('auth-email').value;
    const pwd = document.getElementById('auth-pwd').value;

    if (!email || !pwd) {
        alert('Veuillez remplir email et mot de passe.');
        return;
    }

    try {
        if (type === 'signup') {
            const { error } = await supabase.auth.signUp({ email, password: pwd });
            if (error) throw error;
            showModal('Compte créé ! Vous pouvez maintenant vous connecter.');
        } else {
            const { error, data } = await supabase.auth.signInWithPassword({ email, password: pwd });
            if (error) throw error;
            updateUIForUser(data.user);
            const modal = document.getElementById('custom-modal');
            if (modal) modal.style.display = 'none';
            showModal('Connexion réussie !');
        }
    } catch (err) {
        alert('Erreur: ' + err.message);
    }
}

// AGENT 3 : Force Update Hit Dice Logic after load
if (typeof updateHitDiceType === 'function') updateHitDiceType();
if (typeof updateHitDiceCount === 'function') updateHitDiceCount();

