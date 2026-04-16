// =============================================================================
// UI-REST.JS - SYSTÈME DE REPOS (COURT ET LONG)
// =============================================================================

let longRestTimer = null;
let longRestStartTime = 0;
const LONG_REST_DURATION = 2000; // 2 secondes

/**
 * Effectue un repos court (1 heure)
 * Restaure : ressources de classe + interface pour utiliser des dés de vie
 */
function performShortRest() {

    // Récupérer la classe et le niveau pour la restauration ciblée
    let clsName = '';
    const classSelect = document.getElementById('char_class');
    if (classSelect) {
        clsName = classSelect.value || classSelect.innerText || '';
    } else {
        const clsContent = document.querySelector('[data-name="char_class"]');
        if (clsContent) clsName = clsContent.innerText || '';
    }

    let lvl = 1;
    const lvlEl = document.getElementById('char_level') || document.querySelector('[data-name="char_level"]');
    if (lvlEl) lvl = parseInt(lvlEl.value || lvlEl.innerText) || 1;

    let mods = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    if (typeof getVal === 'function' && typeof calcMod === 'function') {
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(s => {
            let sc = getVal(s + '_score');
            if (!sc) sc = parseInt(document.querySelector(`[data-name="${s}_score"]`)?.innerText) || 10;
            mods[s] = calcMod(sc);
        });
    }

    // Récupérer l'info de reset spécifique
    const resInfo = typeof getClassResourceInfo === 'function' ? getClassResourceInfo(lvl, clsName, mods) : { reset: 'none' };

    // Restaurer les ressources de classe de manière intelligente
    const resSlots = document.getElementById('class-resource-slots');
    let restoredResourcesCount = 0;
    if (resSlots && resInfo.reset !== 'none') {
        const checkboxes = Array.from(resSlots.querySelectorAll('input[type="checkbox"]'));
        if (resInfo.reset === 'all') {
            checkboxes.forEach(cb => { 
                if(cb.checked) { cb.checked = false; restoredResourcesCount++; }
            });
        } else if (resInfo.reset === 'one') {
            // Find the first checked box and uncheck it
            const checkedBox = checkboxes.find(cb => cb.checked);
            if (checkedBox) {
                checkedBox.checked = false;
                restoredResourcesCount++;
            }
        }
    }

    // Restauration de la Magie de Pacte (Sorcier/Warlock)
    let warlockSlotsRestored = false;
    if (clsName.toLowerCase().includes('sorcier') || clsName.toLowerCase().includes('warlock')) {
        const savedSlots = JSON.parse(localStorage.getItem('spell_slots') || '{}');
        let slotsChanged = false;
        // Le sorcier n'utilise que des slots de pacte, qui reviennent au repos court.
        for (const key in savedSlots) {
            if (key.startsWith('used_')) {
                const level = parseInt(key.replace('used_', ''));
                if (level > 0 && savedSlots[key] > 0) {
                    savedSlots[key] = 0;
                    slotsChanged = true;
                }
            }
        }
        if (slotsChanged) {
            localStorage.setItem('spell_slots', JSON.stringify(savedSlots));
            warlockSlotsRestored = true;
            if (typeof updateSpellCount === 'function') updateSpellCount();
            if (typeof filterSpells === 'function') filterSpells(); // Force refresh ui
        }
    }

    // Récupérer les infos de dés de vie depuis l'onglet 1
    const hdType = document.getElementById('hd_type_select')?.value || 'd8';
    const hdCurrentSelect = document.getElementById('hd_current_select');
    const hdMaxDisplay = document.getElementById('hd_max_display');

    const hdUsed = parseInt(hdCurrentSelect?.value) || 0;
    const hdMax = parseInt(hdMaxDisplay?.innerText) || 1;
    const hdAvailable = hdMax - hdUsed;

    const conMod = calcMod(getVal('con_score'));

    let recoveryDetails = '';
    if (restoredResourcesCount > 0) recoveryDetails += '✅ '+restoredResourcesCount+' Ressource(s) de classe restaurée(s)<br>';
    if (warlockSlotsRestored) recoveryDetails += '✅ Emplacements de Pacte restaurés<br>';

    if (hdAvailable <= 0) {
        showModal((txt, btns, inp, area, close) => {
            txt.innerHTML = '🌙 <b>Repos Court Terminé</b><br><br>' +
                recoveryDetails +
                '<br>⚠️ Plus de dés de vie disponibles';

            const btnOk = document.createElement('button');
            btnOk.className = 'btn btn-save';
            btnOk.innerText = 'OK';
            btnOk.onclick = () => { if(typeof saveData === 'function') saveData(); close(); };
            btns.appendChild(btnOk);
        });
        return;
    }

    // Afficher la modal avec options de dés de vie
    showRestHitDiceModal(hdAvailable, hdType, conMod, hdUsed);
}

/**
 * Affiche la modal de repos court avec options Dés de Vie
 */
function showRestHitDiceModal(hdAvailable, hdType, conMod, hdUsed) {
    showModal((txt, btns, inp, area, close) => {
        const conSign = conMod >= 0 ? '+' : '';
        // Récupération des détails (s'ils existent) depuis l'affichage précédent s'il y a eu un re-render, sinon on les omet pour simplifier
        txt.innerHTML = `🌙 <b>Repos Court - Dés de Vie</b><br><br>` +
            `Dés disponibles : <b>${hdAvailable} ${hdType}</b><br>` +
            `Bonus Constitution : <b>${conSign}${conMod}</b><br><br>` +
            `<small><i>Vos ressources à récupération courte ont été restaurées.</i></small>`;

        const btnRoll = document.createElement('button');
        btnRoll.className = 'btn btn-save';
        btnRoll.innerText = '🎲 Lancer 1 dé';
        btnRoll.onclick = () => {
            close();
            rollAndApplyHitDice(hdType, conMod, hdUsed, hdAvailable);
        };

        const btnManual = document.createElement('button');
        btnManual.className = 'btn';
        btnManual.innerText = '✏️ Saisir manuellement';
        btnManual.onclick = () => {
            close();
            showManualHitDiceInput(hdType, conMod, hdUsed);
        };

        const btnSkip = document.createElement('button');
        btnSkip.className = 'btn';
        btnSkip.innerText = 'Terminer sans dé';
        btnSkip.onclick = () => { saveData(); close(); };

        btns.appendChild(btnRoll);
        btns.appendChild(btnManual);
        btns.appendChild(btnSkip);
    });
}

/**
 * Lance automatiquement un dé de vie et applique les soins
 */
function rollAndApplyHitDice(hdType, conMod, hdUsed, hdAvailable) {
    // Extraire le nombre de faces du dé (d6 -> 6, d8 -> 8, etc.)
    const dieFaces = parseInt(hdType.replace('d', '')) || 8;
    const dieResult = Math.floor(Math.random() * dieFaces) + 1;
    const healing = Math.max(1, dieResult + conMod);

    applyHitDiceHealing(healing, 1, hdUsed, dieResult, conMod, hdType, hdAvailable);
}

/**
 * Affiche le formulaire de saisie manuelle du résultat du dé
 */
function showManualHitDiceInput(hdType, conMod, hdUsed) {
    showModal((txt, btns, inp, area, close) => {
        const conSign = conMod >= 0 ? '+' : '';
        txt.innerHTML = `✏️ <b>Saisie Manuelle</b><br><br>` +
            `Entrez le résultat de votre <b>${hdType}</b> :<br>` +
            `<small>(Bonus CON ${conSign}${conMod} ajouté automatiquement)</small>`;

        if (inp) {
            inp.style.display = 'block';
            inp.value = '';
            inp.placeholder = 'Ex: 5';
            inp.type = 'number';
            inp.min = '1';
            setTimeout(() => inp.focus(), 100);
        }

        const btnValidate = document.createElement('button');
        btnValidate.className = 'btn btn-save';
        btnValidate.innerText = 'Valider';
        btnValidate.onclick = () => {
            const dieResult = parseInt(inp?.value) || 0;
            if (dieResult < 1) {
                showModal('Veuillez entrer une valeur valide (1 ou plus)');
                return;
            }
            const healing = Math.max(1, dieResult + conMod);
            close();
            applyHitDiceHealing(healing, 1, hdUsed, dieResult, conMod, hdType, 0);
        };

        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn';
        btnCancel.innerText = 'Annuler';
        btnCancel.onclick = close;

        btns.appendChild(btnValidate);
        btns.appendChild(btnCancel);
    });
}

/**
 * Applique les soins et met à jour le compteur de dés utilisés (onglet 1)
 */
function applyHitDiceHealing(healing, diceUsed, currentHdUsed, dieResult, conMod, hdType, hdAvailableAfter) {
    // Mettre à jour les PV
    const hpCurrent = document.querySelector('[data-name="hp_current"]');
    const hpMax = document.querySelector('[data-name="hp_max"]');
    let newHp = 0;

    if (hpCurrent && hpMax) {
        const currentHp = parseInt(hpCurrent.innerText) || 0;
        const maxHp = parseInt(hpMax.innerText) || 999;
        newHp = Math.min(currentHp + healing, maxHp);
        hpCurrent.innerText = newHp;
    }

    // Mettre à jour le compteur "Dés Utilisés" de l'onglet 1
    const hdCurrentSelect = document.getElementById('hd_current_select');
    if (hdCurrentSelect) {
        hdCurrentSelect.value = currentHdUsed + diceUsed;
    }

    const conSign = conMod >= 0 ? '+' : '';
    const remaining = hdAvailableAfter - 1;

    showModal((txt, btns, inp, area, close) => {
        txt.innerHTML = `✅ <b>Soins appliqués !</b><br><br>` +
            `🎲 Résultat ${hdType} : <b>${dieResult}</b><br>` +
            `Bonus CON : <b>${conSign}${conMod}</b><br>` +
            `<hr style="border-color:#8b4513; margin:10px 0;">` +
            `<span style="font-size:1.5rem; color:#2e8b57;"><b>+${healing} PV</b></span>`;

        const btnOk = document.createElement('button');
        btnOk.className = 'btn btn-save';
        btnOk.innerText = 'OK';
        btnOk.onclick = () => { saveData(); close(); };

        btns.appendChild(btnOk);

        // Si des dés sont encore disponibles, proposer de relancer
        if (remaining > 0) {
            const btnMore = document.createElement('button');
            btnMore.className = 'btn';
            btnMore.innerText = `🎲 Lancer encore (${remaining} restant${remaining > 1 ? 's' : ''})`;
            btnMore.onclick = () => {
                close();
                showRestHitDiceModal(remaining, hdType, conMod, currentHdUsed + 1);
            };
            btns.appendChild(btnMore);
        }
    });

}

/**
 * Effectue un repos long (8 heures)
 * Restaure : PV, dés de vie, emplacements de sorts, ressources de classe
 */
function performLongRest() {

    // Restaurer les PV au maximum
    const hpMax = document.querySelector('[data-name="hp_max"]');
    const hpCurrent = document.querySelector('[data-name="hp_current"]');
    if (hpMax && hpCurrent && hpMax.innerText.trim()) {
        hpCurrent.innerText = hpMax.innerText;
    }

    // Effacer les PV temporaires
    const hpTemp = document.querySelector('[data-name="hp_temp"]');
    if (hpTemp) hpTemp.innerText = '';

    // Restaurer les dés de vie à hauteur de la moitié du max (minimum 1)
    const hdMaxDisplay = document.getElementById('hd_max_display');
    const hdCurrentSelect = document.getElementById('hd_current_select');
    let recoveredHD = 0;
    if (hdMaxDisplay && hdCurrentSelect) {
        const maxHD = parseInt(hdMaxDisplay.innerText) || 1;
        const usedHD = parseInt(hdCurrentSelect.value) || 0;
        
        if (usedHD > 0) {
            recoveredHD = Math.max(1, Math.floor(maxHD / 2));
            const newUsedHD = Math.max(0, usedHD - recoveredHD);
            hdCurrentSelect.value = newUsedHD;
            recoveredHD = usedHD - newUsedHD; // Actual amount recovered
        }
    }

    // Réduire la fatigue de 1 (si existante)
    let fatigueReduced = false;
    const fatigueInput = document.getElementById('fatigue_level');
    if (fatigueInput) {
        const val = parseInt(fatigueInput.value) || 0;
        if (val > 0) {
            fatigueInput.value = val - 1;
            fatigueReduced = true;
            fatigueInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    // Restaurer tous les emplacements de sorts
    const savedSlots = JSON.parse(localStorage.getItem('spell_slots') || '{}');
    let slotsChanged = false;
    for (const key in savedSlots) {
        if (key.startsWith('used_')) {
            if (savedSlots[key] > 0) {
                savedSlots[key] = 0;
                slotsChanged = true;
            }
        }
    }
    if (slotsChanged) {
        localStorage.setItem('spell_slots', JSON.stringify(savedSlots));
        if (typeof updateSpellCount === 'function') updateSpellCount();
        if (typeof filterSpells === 'function') filterSpells(); // Force refresh ui
    }

    // Restaurer les ressources de classe
    const resSlots = document.getElementById('class-resource-slots');
    if (resSlots) {
        resSlots.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    // Effacer les jets contre la mort
    ['ds_s1', 'ds_s2', 'ds_s3', 'ds_f1', 'ds_f2', 'ds_f3'].forEach(name => {
        const checkbox = document.querySelector(`[name="${name}"]`);
        if (checkbox) checkbox.checked = false;
    });

    // Construction du feedback visuel
    let feedback = 'Vous avez pris un repos de 8 heures.\n\n' +
        '✅ PV restaurés au maximum\n';
    
    if (recoveredHD > 0) {
        feedback += `✅ ${recoveredHD} Dés de vie regagné(s)\n`;
    }
    feedback += '✅ Ressources de classe restaurées\n';
    
    if (slotsChanged) {
        feedback += '✅ Emplacements de sorts restaurés\n';
    }
    if (fatigueReduced) {
        feedback += '✅ Niveau de Fatigue réduit de 1\n';
    }
    
    feedback += '✅ Jets contre la mort réinitialisés\n' +
        '💡 N\'oubliez pas de préparer vos sorts';

    // Feedback visuel
    showModal((txt, btns, inp, area, close) => {
        txt.innerHTML = `<h3>🛏️ Repos Long Terminé</h3><div style="text-align:left; font-size:0.9rem; line-height:1.5;">${feedback.replace(/\n/g, '<br>')}</div>`;

        const btnOk = document.createElement('button');
        btnOk.className = 'btn btn-save';
        btnOk.innerText = 'OK';
        btnOk.onclick = () => {
            if (typeof saveData === 'function') saveData();
            if (typeof calcStats === 'function') calcStats();
            close();
        };

        btns.appendChild(btnOk);
    });

}

/**
 * Gère le feedback visuel pendant l'appui long
 * @param {HTMLElement} btn - Le bouton Repos Long
 * @param {number} progress - Progression (0 à 1)
 */
function updateLongRestProgress(btn, progress) {
    let progressBar = btn.querySelector('.rest-progress');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'rest-progress';
        progressBar.style.cssText = 'position: absolute; bottom: 0; left: 0; height: 4px; background: #d4af37; transition: width 0.1s linear;';
        btn.appendChild(progressBar);
    }
    progressBar.style.width = (progress * 100) + '%';
    btn.style.transform = `scale(${1 + progress * 0.05})`;
}

/**
 * Nettoie le feedback visuel de l'appui long
 * @param {HTMLElement} btn - Le bouton Repos Long
 */
function cleanupLongRestFeedback(btn) {
    const progressBar = btn.querySelector('.rest-progress');
    if (progressBar) progressBar.remove();
    btn.style.transform = '';
}

/**
 * Initialise le système de repos
 */
function initRestSystem() {
    // Bouton Repos Court - Clic simple
    const btnShortRest = document.getElementById('btn-short-rest');
    if (btnShortRest) {
        btnShortRest.addEventListener('click', performShortRest);
    }

    // Bouton Repos Long - Appui long 2 secondes
    const btnLongRest = document.getElementById('btn-long-rest');
    if (btnLongRest) {
        // Début de l'appui
        btnLongRest.addEventListener('mousedown', function (e) {
            e.preventDefault();
            longRestStartTime = Date.now();

            longRestTimer = setInterval(() => {
                const elapsed = Date.now() - longRestStartTime;
                const progress = Math.min(elapsed / LONG_REST_DURATION, 1);

                updateLongRestProgress(btnLongRest, progress);

                if (progress >= 1) {
                    clearInterval(longRestTimer);
                    cleanupLongRestFeedback(btnLongRest);
                    performLongRest();
                }
            }, 50);
        });

        // Fin de l'appui (relâchement trop tôt)
        btnLongRest.addEventListener('mouseup', function () {
            if (longRestTimer) {
                clearInterval(longRestTimer);
                longRestTimer = null;
                cleanupLongRestFeedback(btnLongRest);

                const elapsed = Date.now() - longRestStartTime;
                if (elapsed < LONG_REST_DURATION) {
                }
            }
        });

        // Annulation si on quitte le bouton
        btnLongRest.addEventListener('mouseleave', function () {
            if (longRestTimer) {
                clearInterval(longRestTimer);
                longRestTimer = null;
                cleanupLongRestFeedback(btnLongRest);
            }
        });

        // Support tactile (mobile)
        btnLongRest.addEventListener('touchstart', function (e) {
            e.preventDefault();
            longRestStartTime = Date.now();

            longRestTimer = setInterval(() => {
                const elapsed = Date.now() - longRestStartTime;
                const progress = Math.min(elapsed / LONG_REST_DURATION, 1);

                updateLongRestProgress(btnLongRest, progress);

                if (progress >= 1) {
                    clearInterval(longRestTimer);
                    cleanupLongRestFeedback(btnLongRest);
                    performLongRest();
                }
            }, 50);
        });

        btnLongRest.addEventListener('touchend', function () {
            if (longRestTimer) {
                clearInterval(longRestTimer);
                longRestTimer = null;
                cleanupLongRestFeedback(btnLongRest);

                const elapsed = Date.now() - longRestStartTime;
                if (elapsed < LONG_REST_DURATION) {
                }
            }
        });
    }
}
