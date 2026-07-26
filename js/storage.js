// =============================================================================
// STORAGE.JS - GESTION DE LA PERSISTANCE (MODULE ES6, localStorage, Supabase)
// =============================================================================

import { getState, setState, resetState } from './store.js';

/**
 * Injecte du HTML purifié dans un élément DOM.
 * Neutralise tout XSS (scripts, event handlers, iframes…)
 * @param {HTMLElement} el - Élément cible
 * @param {string} html - HTML brut à purifier
 */
export function setRichHTML(el, html) {
    if (!el) return;
    if (typeof window.DOMPurify !== 'undefined') {
        el.innerHTML = window.DOMPurify.sanitize(html || '', {
            ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'br', 'span', 'sub', 'sup', 'mark'],
            ALLOWED_ATTR: ['style', 'class'],
            ALLOW_DATA_ATTR: false
        });
    } else {
        el.textContent = html || '';
    }
}

// Verrou global : empêche les sauvegardes pendant le chargement des données
let _isLoading = false;

// Nom du personnage actif (traqué pour détecter les renommages)
let _activeCharName = null;

/**
 * Nettoie les données legacy des balises HTML et convertit les types
 * @param {Object} data - Données brutes à nettoyer
 * @returns {Object} - Données nettoyées
 */
export function cleanLegacyData(data) {
    if (!data || typeof data !== 'object') return {};

    const cleaned = {};

    const stripHTML = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
    };

    const richFields = [
        'str_score', 'dex_score', 'con_score', 'int_score', 'wis_score', 'cha_score',
        'char_level', 'char_name', 'char_size', 'char_xp',
        'ac', 'hp_max', 'hp_current', 'hp_temp', 'speed'
    ];

    const selectInputFields = [
        'char_class', 'char_subclass', 'char_background', 'char_species',
        'heroic_inspiration', 'hd_total', 'hd_spent', 'hd_type',
        'hd_current', 'hd_max', 'gp', 'sp', 'cp', 'ep', 'pp'
    ];

    for (const key in data) {
        if (!data.hasOwnProperty(key)) continue;

        const value = data[key];

        if (richFields.includes(key)) {
            cleaned[key] = value;
        } else if (selectInputFields.includes(key)) {
            cleaned[key] = stripHTML(value);
        } else if (Array.isArray(value)) {
            cleaned[key] = value.map(item => {
                if (typeof item === 'object' && item !== null) {
                    const cleanedItem = {};
                    for (const itemKey in item) {
                        if (item.hasOwnProperty(itemKey)) {
                            cleanedItem[itemKey] = item[itemKey];
                        }
                    }
                    return cleanedItem;
                }
                return item;
            });
        } else {
            cleaned[key] = value;
        }
    }

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

/**
 * Collecte toutes les données du formulaire et synchronise avec le Store centralisé
 * @returns {Object}
 */
export function getFormData() {
    const d = {};
    document.querySelectorAll('input, select').forEach(el => {
        const key = el.name || el.dataset.name;
        if (key) {
            if (el.type === 'checkbox') d[key] = el.checked;
            else d[key] = el.value;
        }
    });
    document.querySelectorAll('[contenteditable]').forEach(el => {
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

    const fatigueEl = document.getElementById('fatigue_level');
    d['fatigue_level'] = fatigueEl ? parseInt(fatigueEl.value) || 0 : 0;

    const spells = [];
    const sBody = document.getElementById('spells_body');
    if (sBody) {
        sBody.querySelectorAll('tr').forEach(tr => {
            spells.push({
                lvl: (tr.querySelector('.spl-lvl')?.tagName === 'SELECT') ? tr.querySelector('.spl-lvl').value : tr.querySelector('.spl-lvl')?.innerHTML,
                name: tr.querySelector('.spl-name')?.innerHTML,
                time: tr.querySelector('.spl-time')?.innerHTML,
                range: tr.querySelector('.spl-range')?.innerHTML,
                note: tr.querySelector('.spl-note')?.innerHTML,
                c: tr.querySelector('.spl-c')?.checked || false,
                r: tr.querySelector('.spl-r')?.checked || false,
                m: tr.querySelector('.spl-m')?.checked || false,
                prep: tr.querySelector('.spl-prep-btn') ? tr.querySelector('.spl-prep-btn').dataset.prepared === 'true' : false,
                school: tr.querySelector('.spl-school') ? tr.querySelector('.spl-school').textContent : ''
            });
        });
    }
    d['dynamic_spells'] = spells;

    let pp = document.getElementById('passive_perc');
    if (pp && pp.dataset.manual) d['passive_perc_manual'] = 'true';

    const resSlots = document.getElementById('class-resource-slots');
    if (resSlots && resSlots.children.length > 0) {
        for (let i = 0; i < resSlots.children.length; i++) {
            d[`class_res_${i}`] = resSlots.children[i].checked;
        }
    }

    const heroicDestinyEl = document.getElementById('heroic_destiny');
    if (heroicDestinyEl) d['heroic_destiny'] = heroicDestinyEl.value;

    const gloryEl = document.getElementById('glory_score');
    if (gloryEl) d['glory_score'] = gloryEl.value;

    const vanityEl = document.getElementById('vanity_score');
    if (vanityEl) d['vanity_score'] = vanityEl.value;

    d['_visual_prefs'] = {
        opacity: localStorage.getItem('dd2024_opacity') || '1',
        theme: document.body.getAttribute('data-theme') || 'light',
        galleryBg: localStorage.getItem('dd2024_gallery_bg') || null,
        bgZoom: localStorage.getItem('dd2024_bg_zoom') || '100',
        bgPosY: localStorage.getItem('dd2024_bg_pos_y') || '50'
    };

    // Mettre à jour le Store centralisé
    setState({
        char_name: d.char_name || "",
        char_class: d.char_class || "",
        char_level: parseInt(d.char_level) || 1,
        scores: {
            str: parseInt(d.str_score) || 10,
            dex: parseInt(d.dex_score) || 10,
            con: parseInt(d.con_score) || 10,
            int: parseInt(d.int_score) || 10,
            wis: parseInt(d.wis_score) || 10,
            cha: parseInt(d.cha_score) || 10
        },
        fatigue_level: d.fatigue_level,
        weapons: d.dynamic_weapons,
        armors: d.dynamic_armors,
        spells: d.dynamic_spells
    }, { silent: true });

    return d;
}

/**
 * Applique les données au formulaire
 * @param {Object} d - Données à appliquer
 */
export function applyFormData(d) {
    _isLoading = true;
    document.querySelectorAll('input, select').forEach(el => {
        if (el.name && d.hasOwnProperty(el.name)) {
            if (el.type === 'checkbox') el.checked = d[el.name];
            else el.value = d[el.name];
        }
    });
    document.querySelectorAll('[contenteditable]').forEach(el => {
        let key = el.dataset.name || el.id;
        if (key && d.hasOwnProperty(key)) {
            setRichHTML(el, d[key]);
        }
    });

    document.querySelectorAll('.feat-select').forEach(select => {
        let key = select.dataset.name;
        if (key && d.hasOwnProperty(key)) {
            select.value = d[key];
            select.dispatchEvent(new Event('change'));
        }
    });

    if (d.profs_other && !d.profs_weapons) {
        let el = document.querySelector('[data-name="profs_weapons"]');
        if (el) setRichHTML(el, d.profs_other);
    }

    const tbodyW = document.getElementById('weapons_body');
    if (tbodyW) {
        tbodyW.innerHTML = '';
        if (d.dynamic_weapons && Array.isArray(d.dynamic_weapons)) {
            d.dynamic_weapons.forEach(w => window.addWeaponRow && window.addWeaponRow(w));
        } else {
            for (let i = 0; i < 4; i++) window.addWeaponRow && window.addWeaponRow();
        }
    }

    const tbodyS = document.getElementById('spells_body');
    if (tbodyS) {
        tbodyS.innerHTML = '';
        if (d.dynamic_spells && Array.isArray(d.dynamic_spells)) {
            d.dynamic_spells.forEach(s => window.addSpellRow && window.addSpellRow(s));
        } else {
            for (let i = 0; i < 6; i++) window.addSpellRow && window.addSpellRow();
        }
    }

    const tbodyA = document.getElementById('armors_body');
    if (tbodyA) {
        tbodyA.innerHTML = '';
        if (d.dynamic_armors && Array.isArray(d.dynamic_armors)) {
            d.dynamic_armors.forEach(a => window.addArmorRow && window.addArmorRow(a));
        }
    }

    const fatigueEl = document.getElementById('fatigue_level');
    if (fatigueEl && d.fatigue_level !== undefined) {
        fatigueEl.value = d.fatigue_level;
        fatigueEl.dispatchEvent(new Event('input'));
    }

    let pp = document.getElementById('passive_perc');
    if (pp && d['passive_perc_manual']) pp.dataset.manual = 'true';

    if (typeof window.calcStats === 'function') window.calcStats();

    const resSlots = document.getElementById('class-resource-slots');
    if (resSlots && resSlots.children.length > 0) {
        for (let i = 0; i < resSlots.children.length; i++) {
            if (d[`class_res_${i}`]) {
                resSlots.children[i].checked = true;
            }
        }
    }

    const heroicDestinyEl = document.getElementById('heroic_destiny');
    if (heroicDestinyEl && d.heroic_destiny) heroicDestinyEl.value = d.heroic_destiny;

    const gloryEl = document.getElementById('glory_score');
    if (gloryEl && d.glory_score) gloryEl.value = d.glory_score;

    const vanityEl = document.getElementById('vanity_score');
    if (vanityEl && d.vanity_score) vanityEl.value = d.vanity_score;

    const classSelect = document.getElementById('char_class');
    if (classSelect && classSelect.value) {
        if (typeof window.updateSubclassOptions === 'function') window.updateSubclassOptions(classSelect.value);
        const subclassSelect = document.getElementById('char_subclass');
        if (subclassSelect && d.char_subclass) {
            setTimeout(() => {
                subclassSelect.value = d.char_subclass;
            }, 50);
        }
    }

    if (d['_visual_prefs']) {
        const vp = d['_visual_prefs'];
        if (vp.opacity && typeof window.updateOpacity === 'function') {
            window.updateOpacity(parseFloat(vp.opacity));
            const slider = document.getElementById('opacity_slider');
            if (slider) slider.value = vp.opacity;
        }
        if (vp.theme && typeof window.setTheme === 'function') {
            window.setTheme(vp.theme);
        }
        if (vp.galleryBg) {
            localStorage.setItem('dd2024_gallery_bg', vp.galleryBg);
        }
        if (vp.bgZoom && typeof window.updateBgZoom === 'function') {
            window.updateBgZoom(vp.bgZoom);
            const zSlider = document.getElementById('bg-zoom');
            if (zSlider) zSlider.value = vp.bgZoom;
        }
        if (vp.bgPosY && typeof window.updateBgPosY === 'function') {
            window.updateBgPosY(vp.bgPosY);
            const ySlider = document.getElementById('bg-pos-y');
            if (ySlider) ySlider.value = vp.bgPosY;
        }
    }

    // Mettre à jour le Store centralisé
    setState({
        char_name: d.char_name || "",
        char_class: d.char_class || "",
        char_level: parseInt(d.char_level) || 1,
        scores: {
            str: parseInt(d.str_score) || 10,
            dex: parseInt(d.dex_score) || 10,
            con: parseInt(d.con_score) || 10,
            int: parseInt(d.int_score) || 10,
            wis: parseInt(d.wis_score) || 10,
            cha: parseInt(d.cha_score) || 10
        },
        fatigue_level: d.fatigue_level || 0,
        weapons: d.dynamic_weapons || [],
        armors: d.dynamic_armors || [],
        spells: d.dynamic_spells || []
    }, { silent: true });

    _isLoading = false;
}

export function showCloudError(message) {
    const existing = document.getElementById('cloud-error-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'cloud-error-toast';
    toast.textContent = '⚠️ ' + message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

export async function performSave(charName, data) {
    localStorage.setItem('dd2024_char', JSON.stringify(data));
    localStorage.setItem('dd2024_last_saved', new Date().toISOString());

    _activeCharName = charName || null;
    if (_activeCharName) {
        localStorage.setItem('dd2024_active_char_name', _activeCharName);
    }

    if (window.currentUser && window.sb) {
        try {
            const { error } = await window.sb
                .from('characters')
                .upsert({
                    name: charName || 'Sans nom',
                    data: data,
                    user_id: window.currentUser.id,
                    updated_at: new Date()
                }, { onConflict: 'name, user_id' });

            if (error) throw error;
        } catch (err) {
            console.warn('❌ Supabase : Échec de synchronisation', err.message);
            showCloudError('Sauvegarde cloud échouée. Vos données sont conservées localement.');
        }
    }
}

export async function saveData(silent = true) {
    if (_isLoading) return;
    const data = getFormData();

    const nameEl = document.querySelector('[data-name="char_name"]');
    const currentName = nameEl ? nameEl.innerText.trim().replace(/\s+/g, ' ') : '';

    if (_activeCharName && currentName && currentName !== _activeCharName) {
        if (typeof window.showModal === 'function') {
            window.showModal((txt, btns, inp, area, close) => {
                txt.innerHTML = '<b>Changement de nom détecté</b><br>';
                const msgP = document.createElement('span');
                msgP.textContent = 'Le personnage ';
                const oldNameEm = document.createElement('em');
                oldNameEm.style.color = 'var(--accent-color)';
                oldNameEm.textContent = _activeCharName;
                const midText = document.createTextNode(' a été renommé en ');
                const newNameEm = document.createElement('em');
                newNameEm.style.color = 'var(--accent-color)';
                newNameEm.textContent = currentName;
                const endText = document.createTextNode('.');
                msgP.appendChild(oldNameEm);
                msgP.appendChild(midText);
                msgP.appendChild(newNameEm);
                msgP.appendChild(endText);
                txt.appendChild(msgP);
                txt.appendChild(document.createElement('br'));
                txt.appendChild(document.createElement('br'));
                const askText = document.createTextNode('Que souhaitez-vous faire ?');
                txt.appendChild(askText);

                const btnRename = document.createElement('button');
                btnRename.className = 'btn btn-save';
                btnRename.innerText = `✏️ Renommer "${_activeCharName}"`;
                btnRename.onclick = async () => {
                    close();
                    if (typeof window.deleteCharacter === 'function') {
                        await window.deleteCharacter(_activeCharName);
                    }
                    await performSave(currentName, data);
                    if (!silent && typeof window.showModal === 'function') window.showModal('Personnage renommé !');
                };

                const btnCopy = document.createElement('button');
                btnCopy.className = 'btn';
                btnCopy.innerText = `📋 Créer une copie "${currentName}"`;
                btnCopy.onclick = async () => {
                    close();
                    await performSave(currentName, data);
                    if (!silent && typeof window.showModal === 'function') window.showModal('Copie créée !');
                };

                const btnCancel = document.createElement('button');
                btnCancel.className = 'btn btn-bg';
                btnCancel.innerText = '✖ Annuler';
                btnCancel.onclick = () => {
                    if (nameEl) nameEl.innerText = _activeCharName;
                    close();
                };

                btns.appendChild(btnRename);
                btns.appendChild(btnCopy);
                btns.appendChild(btnCancel);
            });
        }
        return;
    }

    await performSave(currentName, data);
    if (!silent && typeof window.showModal === 'function') window.showModal('Sauvegardé !');
}

export async function loadData(targetName = null) {
    if (window.currentUser && window.sb) {
        try {
            let query = window.sb
                .from('characters')
                .select('data, name, updated_at')
                .eq('user_id', window.currentUser.id);

            if (targetName) {
                query = query.eq('name', targetName).single();
            } else {
                query = query.order('updated_at', { ascending: false }).limit(1).single();
            }

            const { data, error } = await query;

            if (data && data.data) {
                const localSavedAt = localStorage.getItem('dd2024_last_saved');
                const cloudUpdatedAt = data.updated_at;

                if (!targetName && localSavedAt && cloudUpdatedAt) {
                    const localDate = new Date(localSavedAt);
                    const cloudDate = new Date(cloudUpdatedAt);

                    if (localDate.getTime() - cloudDate.getTime() > 5000) {
                        const formatDate = (d) => d.toLocaleDateString('fr-FR', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                        });

                        if (typeof window.showModal === 'function') {
                            window.showModal((txt, btns, inp, area, close) => {
                                txt.innerHTML = '<b>⚔️ Conflit de synchronisation</b><br><br>';
                                const msg = document.createElement('span');
                                msg.style.fontSize = '0.80rem';
                                msg.textContent = 'Votre fiche locale est plus récente que la version cloud.';
                                txt.appendChild(msg);
                                txt.appendChild(document.createElement('br'));
                                txt.appendChild(document.createElement('br'));

                                const cloudInfo = document.createElement('div');
                                cloudInfo.style.cssText = 'font-size:0.75rem; text-align:left; padding:6px 10px; border-radius:6px; background:rgba(139,69,19,0.08); border:1px solid rgba(139,69,19,0.2); margin-bottom:8px;';
                                cloudInfo.textContent = '☁️ Cloud : ' + formatDate(cloudDate);
                                txt.appendChild(cloudInfo);

                                const localInfo = document.createElement('div');
                                localInfo.style.cssText = 'font-size:0.75rem; text-align:left; padding:6px 10px; border-radius:6px; background:rgba(139,69,19,0.08); border:1px solid rgba(139,69,19,0.2); margin-bottom:12px;';
                                localInfo.textContent = '💾 Local : ' + formatDate(localDate);
                                txt.appendChild(localInfo);

                                const btnCloud = document.createElement('button');
                                btnCloud.className = 'btn';
                                btnCloud.innerText = '☁️ Charger le Cloud';
                                btnCloud.onclick = () => {
                                    close();
                                    const cleanedData = cleanLegacyData(data.data);
                                    applyFormData(cleanedData);
                                    _activeCharName = data.name || targetName;
                                    localStorage.setItem('dd2024_active_char_name', _activeCharName);
                                };

                                const btnLocal = document.createElement('button');
                                btnLocal.className = 'btn btn-save';
                                btnLocal.innerText = '💾 Garder le local';
                                btnLocal.onclick = () => {
                                    close();
                                    _loadFromLocalStorage();
                                    setTimeout(() => saveData(true), 500);
                                };

                                btns.appendChild(btnCloud);
                                btns.appendChild(btnLocal);
                            });
                        }
                        return;
                    }
                }

                const cleanedData = cleanLegacyData(data.data);
                applyFormData(cleanedData);
                _activeCharName = data.name || targetName;
                localStorage.setItem('dd2024_active_char_name', _activeCharName);
                return;
            }
        } catch (err) {
            console.warn('⚠️ Erreur Supabase au chargement, utilisation du localStorage.', err.message);
        }
    }

    _loadFromLocalStorage();
}

function _loadFromLocalStorage() {
    let d = localStorage.getItem('dd2024_char');
    if (d) {
        let rawData;
        try {
            rawData = JSON.parse(d);
        } catch (parseErr) {
            console.warn('⚠️ Données locales corrompues, réinitialisation.', parseErr.message);
            localStorage.removeItem('dd2024_char');
            return;
        }
        const cleanedData = cleanLegacyData(rawData);
        applyFormData(cleanedData);
        const nameEl = document.querySelector('[data-name="char_name"]');
        _activeCharName = nameEl ? nameEl.innerText.trim() : (localStorage.getItem('dd2024_active_char_name') || null);
    }
}

export function importData(el) {
    let f = el.files[0];
    if (!f) return;
    let r = new FileReader();
    r.onload = e => {
        try {
            const rawData = JSON.parse(e.target.result);
            const cleanedData = cleanLegacyData(rawData);
            applyFormData(cleanedData);
            if (typeof window.showModal === 'function') window.showModal('Fiche chargée et nettoyée !');
        }
        catch (err) {
            console.error('Erreur import:', err);
            if (typeof window.showModal === 'function') window.showModal('Erreur fichier.');
        }
    };
    r.readAsText(f);
    el.value = '';
}

// Bindings globaux window pour HTML
window.setRichHTML = setRichHTML;
window.cleanLegacyData = cleanLegacyData;
window.getFormData = getFormData;
window.applyFormData = applyFormData;
window.saveData = saveData;
window.loadData = loadData;
window.importData = importData;
window.showCloudError = showCloudError;
window.performSave = performSave;
