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
    console.log('⚔️ Repos Court commencé...');

    // Restaurer les ressources de classe (décocher toutes les cases)
    const resSlots = document.getElementById('class-resource-slots');
    if (resSlots) {
        resSlots.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    // Récupérer les infos de dés de vie depuis l'onglet 1
    const hdType = document.getElementById('hd_type_select')?.value || 'd8';
    const hdCurrentSelect = document.getElementById('hd_current_select');
    const hdMaxDisplay = document.getElementById('hd_max_display');

    const hdUsed = parseInt(hdCurrentSelect?.value) || 0;
    const hdMax = parseInt(hdMaxDisplay?.innerText) || 1;
    const hdAvailable = hdMax - hdUsed;

    const conMod = calcMod(getVal('con_score'));

    if (hdAvailable <= 0) {
        showModal((txt, btns, inp, area, close) => {
            txt.innerHTML = '🌙 <b>Repos Court Terminé</b><br><br>' +
                '✅ Ressources de classe restaurées<br><br>' +
                '⚠️ Plus de dés de vie disponibles';

            const btnOk = document.createElement('button');
            btnOk.className = 'btn btn-save';
            btnOk.innerText = 'OK';
            btnOk.onclick = () => { saveData(); close(); };
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
        txt.innerHTML = `🌙 <b>Repos Court - Dés de Vie</b><br><br>` +
            `Dés disponibles : <b>${hdAvailable} ${hdType}</b><br>` +
            `Bonus Constitution : <b>${conSign}${conMod}</b><br><br>` +
            `✅ Ressources de classe restaurées`;

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

    console.log(`✅ Repos Court : +${healing} PV (${dieResult} ${conSign}${conMod})`);
}

/**
 * Effectue un repos long (8 heures)
 * Restaure : PV, dés de vie, emplacements de sorts, ressources de classe
 */
function performLongRest() {
    console.log('🛏️ Repos Long commencé...');

    // Restaurer les PV au maximum
    const hpMax = document.querySelector('[data-name="hp_max"]');
    const hpCurrent = document.querySelector('[data-name="hp_current"]');
    if (hpMax && hpCurrent && hpMax.innerText.trim()) {
        hpCurrent.innerText = hpMax.innerText;
    }

    // Effacer les PV temporaires
    const hpTemp = document.querySelector('[data-name="hp_temp"]');
    if (hpTemp) hpTemp.innerText = '';

    // Restaurer les dés de vie (remettre à 0 utilisés)
    const hdSpent = document.querySelector('[data-name="hd_spent"]');
    if (hdSpent) hdSpent.innerText = '0';

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

    // Feedback visuel
    showModal(
        '🛏️ Repos Long Terminé',
        'Vous avez pris un repos de 8 heures.\n\n' +
        '✅ PV restaurés au maximum\n' +
        '✅ Dés de vie restaurés\n' +
        '✅ Ressources de classe restaurées\n' +
        '✅ Jets contre la mort réinitialisés\n' +
        '💡 N\'oubliez pas de préparer vos sorts',
        [
            { label: 'OK', callback: () => { saveData(); calcStats(); } }
        ]
    );

    console.log('✅ Repos Long terminé');
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
                    console.log('⏱️ Repos Long annulé (appui trop court)');
                }
            }
        });

        // Annulation si on quitte le bouton
        btnLongRest.addEventListener('mouseleave', function () {
            if (longRestTimer) {
                clearInterval(longRestTimer);
                longRestTimer = null;
                cleanupLongRestFeedback(btnLongRest);
                console.log('⏱️ Repos Long annulé (souris sortie)');
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
                    console.log('⏱️ Repos Long annulé (appui tactile trop court)');
                }
            }
        });
    }
}
