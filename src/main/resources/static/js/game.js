/**
 * Módulo del juego para Velour Keno
 * Maneja el tablero, selección de números, apuestas, animaciones
 * y comunicación con el servidor WebSocket.
 *
 * Dependencias: api.js, utils.js, navbar.js, websocket.js
 */

// ==========================================
// ESTADO GLOBAL
// ==========================================

let selectedNumbers = [];
let betAmount = 100;
let drawSpeed = 'normal';
let isDrawing = false;
// currentRoomId declarado en websocket.js
let totalTimer = 210;
let currentBalance = 0; // se actualiza al cargar el perfil

const DRAW_SPEEDS = {
    'slow': 1200,
    'normal': 700,
    'fast': 400,
    'very-fast': 200,
    'instant': 0
};

// ==========================================
// TABLERO DE JUEGO
// ==========================================

/**
 * Renderiza los 80 botones numéricos del tablero.
 */
function renderBoard() {
    var container = document.getElementById('gameBoard');
    if (!container) return;
    container.innerHTML = '';

    for (var i = 1; i <= 80; i++) {
        var btn = document.createElement('button');
        btn.className = 'board-number';
        btn.setAttribute('data-number', i);
        btn.textContent = i;
        btn.onclick = makeToggleHandler(i);
        container.appendChild(btn);
    }
}

function makeToggleHandler(number) {
    return function () {
        toggleNumber(number);
    };
}

/**
 * Selecciona o deselecciona un número del tablero.
 * @param {number} number - Número a togglear (1-80).
 */
function toggleNumber(number) {
    if (isDrawing) return;

    var idx = selectedNumbers.indexOf(number);
    var btn = document.querySelector('.board-number[data-number="' + number + '"]');

    if (idx !== -1) {
        selectedNumbers.splice(idx, 1);
        if (btn) btn.classList.remove('selected');
    } else {
        if (selectedNumbers.length >= 10) {
            showToast('Máximo 10 números', 'warning');
            return;
        }
        selectedNumbers.push(number);
        if (btn) btn.classList.add('selected');
    }

    document.getElementById('selectedCount').textContent = selectedNumbers.length;
    updatePlayButtonState();
}

/**
 * Activa o desactiva el botón de jugar según la selección.
 */
function updatePlayButtonState() {
    var playBtn = document.getElementById('playBtn');
    if (!playBtn) return;
    playBtn.disabled = selectedNumbers.length === 0;
}

// ==========================================
// QUICK PICK
// ==========================================

/**
 * Selecciona aleatoriamente 'count' números únicos.
 * @param {number} count - Cantidad de números a seleccionar.
 */
function quickPick(count) {
    clearSelection();

    var picks = [];
    while (picks.length < count) {
        var num = Math.floor(Math.random() * 80) + 1;
        if (picks.indexOf(num) === -1) {
            picks.push(num);
        }
    }

    for (var i = 0; i < picks.length; i++) {
        selectedNumbers.push(picks[i]);
        var btn = document.querySelector('.board-number[data-number="' + picks[i] + '"]');
        if (btn) btn.classList.add('selected');
    }

    document.getElementById('selectedCount').textContent = selectedNumbers.length;
    updatePlayButtonState();
    showToast('Quick Pick: ' + count + ' números seleccionados', 'info');
}

// ==========================================
// LIMPIAR SELECCIÓN
// ==========================================

/**
 * Limpia toda la selección actual y resetea el tablero.
 */
function clearSelection() {
    selectedNumbers = [];

    var numbers = document.querySelectorAll('.board-number');
    for (var i = 0; i < numbers.length; i++) {
        numbers[i].classList.remove('selected', 'hit', 'miss', 'drawn');
    }

    document.getElementById('selectedCount').textContent = '0';
    updatePlayButtonState();
}

// ==========================================
// AJUSTE DE APUESTA
// ==========================================

/**
 * Ajusta el monto de la apuesta actual.
 * @param {number} amount - Cantidad a sumar (puede ser negativa).
 */
function adjustBet(amount) {
    betAmount = betAmount + amount;
    var maxBet = Math.min(1000, currentBalance);
    if (betAmount > maxBet) betAmount = maxBet;
    if (betAmount < 10) betAmount = 10;

    document.getElementById('betAmount').value = betAmount;
    document.getElementById('playSubtitle').textContent = 'Apuesta: ' + formatCredits(betAmount);
}

// ==========================================
// VALIDAR APUESTA
// ==========================================

/**
 * Valida que la apuesta sea correcta antes de enviar.
 * @returns {boolean} true si la apuesta es válida.
 */
function validateBet() {
    if (betAmount > currentBalance) {
        showToast('Saldo insuficiente', 'error');
        return false;
    }
    if (betAmount < 10) {
        showToast('Apuesta mínima: 10 créditos', 'warning');
        return false;
    }
    return true;
}

// ==========================================
// ENVIAR JUGADA
// ==========================================

/**
 * Envía la jugada al servidor a través de WebSocket.
 */
function submitPlay() {
    if (selectedNumbers.length === 0) {
        showToast('Selecciona al menos un número', 'warning');
        return;
    }

    if (!validateBet()) return;

    if (!currentRoomId) {
        showToast('Únete a una sala primero', 'warning');
        return;
    }

    document.getElementById('playBtn').disabled = true;
    sendPlay(selectedNumbers, betAmount);
    showToast('¡Apuesta enviada!', 'success');
}

// ==========================================
// ANIMACIÓN DE SORTEO
// ==========================================

/**
 * Anima la revelación de un número sorteado en el tablero.
 * @param {number} number - Número sorteado.
 * @param {number} index - Índice en la secuencia (0-19).
 */
function animateDraw(number, index) {
    var btn = document.querySelector('.board-number[data-number="' + number + '"]');
    if (!btn) return;

    isDrawing = true;
    btn.classList.add('drawing');

    setTimeout(function () {
        btn.classList.remove('drawing');

        if (selectedNumbers.indexOf(number) !== -1) {
            btn.classList.remove('selected');
            btn.classList.add('hit');
        } else {
            btn.classList.add('drawn');
        }

        if (index === 19) {
            isDrawing = false;
            document.getElementById('playBtn').disabled = false;
        }
    }, 300);
}

// ==========================================
// MOSTRAR RESULTADOS EN TABLERO
// ==========================================

/**
 * Marca los números en el tablero según los resultados del sorteo.
 * @param {number[]} drawnNumbers - Números sorteados.
 * @param {number[]} playerSelected - Números seleccionados por el jugador.
 */
function showResults(drawnNumbers, playerSelected) {
    for (var i = 0; i < playerSelected.length; i++) {
        var num = playerSelected[i];
        var btn = document.querySelector('.board-number[data-number="' + num + '"]');
        if (!btn) continue;

        btn.classList.remove('selected');

        if (drawnNumbers.indexOf(num) !== -1) {
            btn.classList.add('hit');
        } else {
            btn.classList.add('miss');
        }
    }

    for (var j = 0; j < drawnNumbers.length; j++) {
        var drawn = drawnNumbers[j];
        var el = document.querySelector('.board-number[data-number="' + drawn + '"]');
        if (!el) continue;
        if (playerSelected.indexOf(drawn) === -1) {
            el.classList.add('drawn');
        }
    }
}

// ==========================================
// ACTUALIZAR ÚLTIMO RESULTADO
// ==========================================

/**
 * Muestra la tarjeta del último resultado del jugador.
 * @param {number} hits - Aciertos.
 * @param {number} selected - Números seleccionados.
 * @param {number} bet - Apuesta.
 * @param {number} winAmount - Premio obtenido.
 */
function updateLastResult(hits, selected, bet, winAmount) {
    var card = document.getElementById('lastResult');
    if (!card) return;
    card.style.display = 'block';

    document.getElementById('resultSelected').textContent = selected;
    document.getElementById('resultHits').textContent = hits;
    document.getElementById('resultBet').textContent = formatCredits(bet);

    var prizeEl = document.getElementById('resultPrize');
    prizeEl.textContent = formatCredits(winAmount);
    prizeEl.className = 'stat-value' + (winAmount > 0 ? ' gold' : '');
}

// ==========================================
// FILA DE NÚMEROS SORTEADOS
// ==========================================

/**
 * Renderiza los 20 números sorteados como chips indicando aciertos.
 * @param {number[]} drawnNumbers - Números sorteados.
 * @param {number[]} playerSelected - Números seleccionados.
 */
function updateDrawnNumbersRow(drawnNumbers, playerSelected) {
    var container = document.getElementById('drawnNumbersRow');
    if (!container) return;
    container.innerHTML = '';

    for (var i = 0; i < drawnNumbers.length; i++) {
        var chip = document.createElement('div');
        chip.className = 'drawn-number-chip';
        chip.textContent = drawnNumbers[i];

        if (playerSelected.indexOf(drawnNumbers[i]) !== -1) {
            chip.classList.add('hit');
        } else {
            chip.classList.add('miss');
        }

        container.appendChild(chip);
    }
}

// ==========================================
// TEMPORIZADOR
// ==========================================

/**
 * Actualiza el temporizador visual del sorteo.
 * @param {number} seconds - Segundos restantes.
 */
function updateTimer(seconds) {
    var display = document.getElementById('timerDisplay');
    var fill = document.getElementById('timerFill');
    if (!display || !fill) return;

    display.textContent = formatTimer(seconds);

    var pct = (seconds / totalTimer) * 100;
    fill.style.width = pct + '%';

    if (seconds <= 30) {
        display.classList.add('urgent');
    } else {
        display.classList.remove('urgent');
    }
}

// ==========================================
// ACTUALIZAR SALDO
// ==========================================

/**
 * Actualiza el saldo del jugador en toda la interfaz.
 * @param {number} newBalance - Nuevo saldo.
 */
function updateBalance(newBalance) {
    currentBalance = newBalance;
    var el = document.getElementById('balanceDisplay');
    if (el) el.textContent = 'Saldo: ' + formatCredits(newBalance);
    updateNavBalance(newBalance);
}

// ==========================================
// LISTA DE SALAS
// ==========================================

/**
 * Renderiza las tarjetas de salas disponibles.
 * @param {object[]} rooms - Lista de salas del servidor.
 */
function renderRoomList(rooms) {
    var container = document.getElementById('roomList');
    if (!container) return;
    container.innerHTML = '';

    if (!rooms || rooms.length === 0) {
        container.innerHTML =
            '<div class="lobby-empty" style="text-align:center;padding:40px;">' +
            '<p style="color:#8A7A75;font-size:14px;margin-bottom:16px;">No hay salas disponibles</p>' +
            '<button onclick="loadRooms()" class="join-btn" style="width:auto;padding:0 24px;display:inline-flex;">' +
            'RECARGAR</button></div>';
        return;
    }

    for (var i = 0; i < rooms.length; i++) {
        var room = rooms[i];
        var card = document.createElement('div');
        card.className = 'room-card';

        var statusClass = room.status === 'WAITING' ? 'waiting' : 'locked';

        card.innerHTML =
            '<h3 class="room-card-title">Sala #' + room.id + '</h3>' +
            '<p class="room-card-players">' + room.currentPlayers + '/5 jugadores</p>' +
            '<span class="room-card-status ' + statusClass + '">' + room.status + '</span>' +
            '<button class="join-btn" onclick="handleJoinRoom(' + room.id + ')"' +
            (room.status !== 'WAITING' ? ' disabled style="opacity:0.5;cursor:not-allowed;"' : '') +
            '>UNIRSE</button>';

        container.appendChild(card);
    }
}

/**
 * Maneja el clic en "UNIRSE" desde el lobby.
 * Primero cambia la vista, luego ejecuta el join.
 * @param {number} roomId - ID de la sala.
 */
function handleJoinRoom(roomId) {
    // Cambiar vista primero
    document.getElementById('gameView').style.display = '';
    document.getElementById('lobbyView').style.display = 'none';

    // Luego hacer el join (REST + WebSocket)
    joinRoom(roomId);
}

// ==========================================
// LISTA DE JUGADORES
// ==========================================

/**
 * Renderiza la lista de jugadores en la sala.
 * @param {object} roomData - Datos de la sala.
 */
function renderPlayerList(roomData) {
    document.getElementById('playerCount').textContent = roomData.currentPlayers + '/5';
    document.getElementById('roundNumber').textContent = 'Ronda ' + roomData.roundNumber;
    document.getElementById('roomStatus').textContent = roomData.status;

    var container = document.getElementById('playerList');
    if (!container) return;
    container.innerHTML = '';

    for (var i = 0; i < roomData.players.length; i++) {
        var player = roomData.players[i];
        var item = document.createElement('div');
        item.className = 'player-item';

        item.innerHTML =
            '<div class="player-avatar">' + getInitials(player.username) + '</div>' +
            '<span class="player-name">' + player.username + '</span>' +
            '<span class="player-status ' + player.status.toLowerCase() + '">' + player.status + '</span>';

        container.appendChild(item);
    }
}

// ==========================================
// OVERLAY DE RESULTADOS
// ==========================================

/**
 * Muestra el overlay con los resultados de la ronda.
 * @param {object} resultsData - Datos de resultados.
 */
function showResultsOverlay(resultsData) {
    var overlay = document.getElementById('resultsOverlay');
    var table = document.getElementById('resultsTable');
    if (!overlay || !table) return;

    overlay.style.display = 'flex';
    table.innerHTML = '';

    var results = resultsData.results || [];

    for (var i = 0; i < results.length; i++) {
        var r = results[i];
        var row = document.createElement('div');
        row.className = 'result-row' + (r.isWinner ? ' winner' : '');

        row.innerHTML =
            '<span class="result-player-name">' + r.username + '</span>' +
            '<span class="result-hits">' + r.hits + '</span>' +
            '<span class="result-bet">' + formatCredits(r.betAmount) + '</span>' +
            '<span class="result-prize' + (r.winAmount <= 0 ? ' no-win' : '') + '">' +
            formatCredits(r.winAmount) + '</span>';

        table.appendChild(row);
    }

    // Cuenta regresiva de 10 segundos
    var countdown = 10;
    var countdownEl = document.getElementById('nextRoundCountdown');
    countdownEl.textContent = countdown;

    var interval = setInterval(function () {
        countdown--;
        countdownEl.textContent = countdown;

        if (countdown <= 0) {
            clearInterval(interval);
            overlay.style.display = 'none';
            clearSelection();
            document.getElementById('playBtn').disabled = false;
        }
    }, 1000);
}

// ==========================================
// CHAT
// ==========================================

/**
 * Expande o colapsa el panel de chat.
 */
function toggleChat() {
    var panel = document.getElementById('chatPanel');
    var icon = document.getElementById('chatToggleIcon');
    var header = panel.querySelector('.chat-header');
    if (!panel || !icon) return;

    panel.classList.toggle('collapsed');

    var isCollapsed = panel.classList.contains('collapsed');
    icon.textContent = isCollapsed ? '▲' : '▼';
    header.setAttribute('aria-expanded', !isCollapsed);
}

/**
 * Agrega un mensaje al chat.
 * @param {object} data - Datos del mensaje (username, message, sentAt).
 */
function addChatMessage(data) {
    var container = document.getElementById('chatMessages');
    if (!container) return;

    var msg = document.createElement('div');
    msg.className = 'chat-message';
    msg.innerHTML =
        '<div class="chat-message-header">' +
        '<span class="chat-username">' + data.username + '</span>' +
        '<span class="chat-time">' + timeAgo(data.sentAt) + '</span>' +
        '</div>' +
        '<div class="chat-text">' + escapeHtml(data.message) + '</div>';

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

/**
 * Escapa HTML para evitar inyección en el chat.
 * @param {string} text - Texto a escapar.
 * @returns {string} Texto escapado.
 */
function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

/**
 * Envía un mensaje de chat desde el input.
 */
function submitChat() {
    var input = document.getElementById('chatInput');
    var message = input.value.trim();
    if (!message) return;

    if (!currentRoomId) {
        showToast('Únete a una sala primero', 'warning');
        return;
    }

    sendChat(message);
    input.value = '';
}

/**
 * Maneja el evento keypress en el input de chat.
 * @param {Event} event - Evento keypress.
 */
function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        submitChat();
    }
}

// ==========================================
// CARGAR SALAS
// ==========================================

/**
 * Obtiene la lista de salas disponibles desde el servidor.
 */
function loadRooms() {
    apiFetch('/rooms')
        .then(function (data) {
            renderRoomList(data);
        })
        .catch(function (error) {
            showToast('Error cargando salas', 'error');
        });
}

// ==========================================
// SALA ACTUAL
// ==========================================

/**
 * Establece la sala actual del jugador.
 * @param {number} roomId - ID de la sala.
 */
function setCurrentRoom(roomId) {
    currentRoomId = roomId;
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

(function () {
    // Input de apuesta
    var betInput = document.getElementById('betAmount');
    if (betInput) {
        betInput.addEventListener('change', function () {
            betAmount = parseInt(this.value) || 10;
            document.getElementById('playSubtitle').textContent = 'Apuesta: ' + formatCredits(betAmount);
        });
    }

    // Botones de velocidad — event delegation
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('speed-btn')) {
            document.querySelectorAll('.speed-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            e.target.classList.add('active');
            drawSpeed = e.target.getAttribute('data-speed');
            showToast('Velocidad: ' + e.target.textContent, 'info');
        }
    });

    // Renderizar tablero si está vacío
    var board = document.getElementById('gameBoard');
    if (board && board.children.length === 0) {
        renderBoard();
    }
})();
