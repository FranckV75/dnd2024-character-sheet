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

    // Champs contenteditable "riches" : on PRÉSERVE le HTML (styles utilisateur)
    // getVal() extrait les nombres via regex, donc les calculs ne sont pas affectés
    const richFields = [
        'str_score', 'dex_score', 'con_score', 'int_score', 'wis_score', 'cha_score',
        'char_level', 'char_name', 'char_size', 'char_xp',
        'ac', 'hp_max', 'hp_current', 'hp_temp', 'speed'
    ];

    // Champs <select> ou <input> : on nettoie le HTML (pas de rich-text possible)
    const selectInputFields = [
        'char_class', 'char_subclass', 'char_background', 'char_species',
        'heroic_inspiration', 'hd_total', 'hd_spent', 'hd_type',
        'hd_current', 'hd_max', 'gp', 'sp', 'cp', 'ep', 'pp'
    ];

    // Nettoyer tous les champs
    for (const key in data) {
        if (!data.hasOwnProperty(key)) continue;

        const value = data[key];

        // Champs riches : conserver tel quel (HTML préservé)
        if (richFields.includes(key)) {
            cleaned[key] = value;
        }
        // Champs select/input : nettoyer le HTML résiduel
        else if (selectInputFields.includes(key)) {
            cleaned[key] = stripHTML(value);
        }
        // Traiter les tableaux (armes, sorts) — conserver le HTML dans les noms/notes
        else if (Array.isArray(value)) {
            cleaned[key] = value.map(item => {
                if (typeof item === 'object' && item !== null) {
                    const cleanedItem = {};
                    for (const itemKey in item) {
                        if (item.hasOwnProperty(itemKey)) {
                            // Préserver le HTML dans les champs de contenu des armes/sorts
                            cleanedItem[itemKey] = item[itemKey];
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
    // Vérifier si le champ est vide ou ne contient aucun chiffre
    const hasNumber = (v) => {
        if (typeof v === 'number') return v !== 0;
        if (typeof v === 'string') return /\d/.test(v);
        return false;
    };
    if (!hasNumber(cleaned.str_score)) cleaned.str_score = '10';
    if (!hasNumber(cleaned.dex_score)) cleaned.dex_score = '10';
    if (!hasNumber(cleaned.con_score)) cleaned.con_score = '10';
    if (!hasNumber(cleaned.int_score)) cleaned.int_score = '10';
    if (!hasNumber(cleaned.wis_score)) cleaned.wis_score = '10';
    if (!hasNumber(cleaned.cha_score)) cleaned.cha_score = '10';
    if (!hasNumber(cleaned.char_level)) cleaned.char_level = '1';

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
        const key = el.name || el.dataset.name;
        if (key) {
            if (el.type === 'checkbox') d[key] = el.checked;
            else d[key] = el.value;
        }
    });
    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
        let key = el.dataset.name || el.id;
        if (key) {
            if (!el.classList.contains('wpn-name') && !el.classList.contains('wpn-atk') &&
                !el.classList.contains('wpn-dmg') && !el.classList.contains('wpn-note') &&
                !el.classList.contains('wpn-prop') && !el.classList.contains('wpn-prof') && !el.classList.contains('wpn-ammo') &&
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
                name: tr.querySelector('.wpn-name') ? tr.querySelector('.wpn-name').innerHTML : '',
                prop: tr.querySelector('.wpn-prop') ? tr.querySelector('.wpn-prop').innerHTML : '',
                prof: tr.querySelector('.wpn-prof') ? tr.querySelector('.wpn-prof').innerHTML : '',
                ammo: tr.querySelector('.wpn-ammo') ? tr.querySelector('.wpn-ammo').innerHTML : '',
                note: tr.querySelector('.wpn-note') ? tr.querySelector('.wpn-note').innerHTML : '',
                category: tr.dataset.category || '',
                atkKey: tr.dataset.atkKey || '',
                baseDmg: tr.dataset.baseDmg || '',
                weaponConfig: tr.dataset.weaponConfig || ''
            });
        });
    }
    d['dynamic_weapons'] = weapons;

    // Armures dynamiques (Story 5)
    const armors = [];
    const aBody = document.getElementById('armors_body');
    if (aBody) {
        aBody.querySelectorAll('tr').forEach(tr => {
            armors.push({
                name: tr.querySelector('.armor-name') ? tr.querySelector('.armor-name').innerHTML : '',
                type: tr.querySelector('.armor-type') ? tr.querySelector('.armor-type').value : 'none',
                ca: tr.querySelector('.armor-ca') ? tr.querySelector('.armor-ca').innerHTML : '',
                str: tr.querySelector('.armor-str') ? tr.querySelector('.armor-str').innerHTML : '',
                stealth: tr.querySelector('.armor-stealth') ? tr.querySelector('.armor-stealth').checked : false,
                weight: tr.querySelector('.armor-weight') ? tr.querySelector('.armor-weight').innerHTML : '',
                price: tr.querySelector('.armor-price') ? tr.querySelector('.armor-price').innerHTML : '',
                comment: tr.querySelector('.armor-comment') ? tr.querySelector('.armor-comment').innerHTML : '',
                equipped: tr.querySelector('.armor-equipped') ? tr.querySelector('.armor-equipped').checked : false
            });
        });
    }
    d['dynamic_armors'] = armors;

    // Niveau de Fatigue D&D 2024
    const fatigueEl = document.getElementById('fatigue_level');
    d['fatigue_level'] = fatigueEl ? parseInt(fatigueEl.value) || 0 : 0;

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
                prep: tr.querySelector('.spl-prep-btn') ? tr.querySelector('.spl-prep-btn').dataset.prepared === 'true' : false,
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

    // Capturer les préférences visuelles (opacité, fond, thème)
    d['_visual_prefs'] = {
        opacity: localStorage.getItem('dd2024_opacity') || '1',
        theme: document.body.getAttribute('data-theme') || 'light',
        galleryBg: localStorage.getItem('dd2024_gallery_bg') || null,
        bgZoom: localStorage.getItem('dd2024_bg_zoom') || '100',
        bgPosY: localStorage.getItem('dd2024_bg_pos_y') || '50'
    };
    // Le fond d'écran custom est exclu (trop volumineux pour Supabase)

    return d;
}

/**
 * Applique les donnÃ©es au formulaire
 * @param {Object} d - DonnÃ©es Ã  appliquer
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

    // Mettre à jour l'affichage des dons après restauration
    document.querySelectorAll('.feat-select').forEach(select => {
        let key = select.dataset.name;
        if (key && d.hasOwnProperty(key)) {
            select.value = d[key];
            select.dispatchEvent(new Event('change'));
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

    // Armures dynamiques (Story 5)
    const tbodyA = document.getElementById('armors_body');
    if (tbodyA) {
        tbodyA.innerHTML = '';
        if (d.dynamic_armors && Array.isArray(d.dynamic_armors)) {
            d.dynamic_armors.forEach(a => addArmorRow(a));
        }
    }

    // Niveau de Fatigue D&D 2024
    const fatigueEl = document.getElementById('fatigue_level');
    if (fatigueEl && d.fatigue_level !== undefined) {
        fatigueEl.value = d.fatigue_level;
        // Mettre à jour la description si initFatigueDisplay a déjà été appelé
        fatigueEl.dispatchEvent(new Event('input'));
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

    // Restaurer les préférences visuelles
    if (d['_visual_prefs']) {
        const vp = d['_visual_prefs'];
        if (vp.opacity && typeof updateOpacity === 'function') {
            updateOpacity(parseFloat(vp.opacity));
            const slider = document.getElementById('opacity_slider');
            if (slider) slider.value = vp.opacity;
        }
        if (vp.theme && typeof setTheme === 'function') {
            setTheme(vp.theme);
        }
        if (vp.galleryBg) {
            localStorage.setItem('dd2024_gallery_bg', vp.galleryBg);
        }
        if (vp.bgZoom && typeof updateBgZoom === 'function') {
            updateBgZoom(vp.bgZoom);
            const zSlider = document.getElementById('bg-zoom');
            if (zSlider) zSlider.value = vp.bgZoom;
        }
        if (vp.bgPosY && typeof updateBgPosY === 'function') {
            updateBgPosY(vp.bgPosY);
            const ySlider = document.getElementById('bg-pos-y');
            if (ySlider) ySlider.value = vp.bgPosY;
        }
    }
}

// =============================================================================
// SAUVEGARDE ET CHARGEMENT
// =============================================================================

/**
 * Sauvegarde les données dans localStorage et synchronise avec Supabase
 */
async function saveData(silent = true) {
    const data = getFormData();

    // 1. Sauvegarde locale (immédiate)
    localStorage.setItem('dd2024_char', JSON.stringify(data));
    if (!silent) {
        showModal('Sauvegardé localement !');
    }

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

// Note: openAuthModal et handleAuthAction ont été migrés vers supabase-config.js


// AGENT 3 : Force Update Hit Dice Logic after load
if (typeof updateHitDiceType === 'function') updateHitDiceType();
if (typeof updateHitDiceCount === 'function') updateHitDiceCount();

