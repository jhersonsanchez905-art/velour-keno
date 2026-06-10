/**
 * Módulo WebSocket para Velour Keno
 * Maneja la comunicación en tiempo real con el servidor mediante
 * STOMP sobre WebSocket para salas, sorteos y chat.
 *
 * Dependencias: api.js (getToken), game.js (funciones de UI)
 */

// ==========================================
// ESTADO GLOBAL
// ==========================================

let stompClient = null;
let currentRoomId = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;

// Almacén de suscripciones activas por sala
const activeSubscriptions = {};

// ==========================================
// CONEXIÓN WEBSOCKET
// ==========================================

/**
 * Inicia la conexión WebSocket con el servidor STOMP.
 */
function connectWebSocket() {
    if (isConnected) return;

    var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    var wsUrl = protocol + '//' + window.location.host + '/ws';

    stompClient = new StompJs.Client({
        brokerURL: wsUrl,
        connectHeaders: {
            Authorization: 'Bearer ' + getToken()
        },
        reconnectDelay: 5000,
        onConnect: onWebSocketConnected,
        onDisconnect: onWebSocketDisconnected,
        onStompError: onWebSocketError
    });

    stompClient.activate();
}

/**
 * Callback cuando se establece la conexión WebSocket.
 */
function onWebSocketConnected() {
    isConnected = true;
    reconnectAttempts = 0;
    console.log('WebSocket conectado');

    // Suscribirse al canal global de salas
    stompClient.subscribe('/topic/rooms', function (message) {
        var data = JSON.parse(message.body);
        renderRoomList(data);
    });

    loadRooms();
}

/**
 * Callback cuando se pierde la conexión WebSocket.
 */
function onWebSocketDisconnected() {
    isConnected = false;
    console.log('WebSocket desconectado');

    if (reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        showToast('Reconectando... intento ' + reconnectAttempts, 'warning');
    }
}

/**
 * Callback cuando ocurre un error STOMP.
 */
function onWebSocketError(frame) {
    console.error('Error STOMP:', frame);
    showToast('Error de conexión', 'error');
}

// ==========================================
// UNIRSE A UNA SALA
// ==========================================

function joinRoom(roomId) {
    if (!isConnected) {
        showToast('Sin conexión', 'error');
        return;
    }

    apiFetch('/rooms/' + roomId + '/join', 'POST')
        .then(function () {
            currentRoomId = roomId;
            setCurrentRoom(roomId);

            var subs = {};

            subs.players = stompClient.subscribe(
                '/topic/room/' + roomId + '/players',
                function (message) {
                    var data = JSON.parse(message.body);
                    renderPlayerList(data);
                }
            );

            subs.timer = stompClient.subscribe(
                '/topic/room/' + roomId + '/timer',
                function (message) {
                    var data = JSON.parse(message.body);
                    updateTimer(data.seconds);
                }
            );

            subs.draw = stompClient.subscribe(
                '/topic/room/' + roomId + '/draw',
                function (message) {
                    var data = JSON.parse(message.body);
                    animateDraw(data.number, data.index);
                }
            );

            subs.results = stompClient.subscribe(
                '/topic/room/' + roomId + '/results',
                function (message) {
                    var data = JSON.parse(message.body);
                    showResultsOverlay(data);
                }
            );

            subs.chat = stompClient.subscribe(
                '/topic/room/' + roomId + '/chat',
                function (message) {
                    var data = JSON.parse(message.body);
                    addChatMessage(data);
                }
            );

            activeSubscriptions[roomId] = subs;
            showToast('Te uniste a la sala #' + roomId, 'success');

            apiFetch('/rooms').then(function (rooms) {
                renderRoomList(rooms);
            });
        })
        .catch(function (error) {
            var msg = (error.data && error.data.mensaje) || 'Error al unirse a la sala';
            showToast(msg, 'error');
        });

    // PASO 1: Registrar en la BD via REST (este endpoint SÍ existe)
    apiFetch('/rooms/' + roomId + '/join', 'POST')
        .then(function () {
            // PASO 2: Guardar sala actual
            currentRoomId = roomId;
            setCurrentRoom(roomId);

            var subs = {};

            // PASO 3: Suscribirse a todos los canales de la sala
            subs.players = stompClient.subscribe(
                '/topic/room/' + roomId + '/players',
                function (message) {
                    var data = JSON.parse(message.body);
                    renderPlayerList(data);
                }
            );

            subs.timer = stompClient.subscribe(
                '/topic/room/' + roomId + '/timer',
                function (message) {
                    var data = JSON.parse(message.body);
                    updateTimer(data.seconds);
                }
            );

            subs.draw = stompClient.subscribe(
                '/topic/room/' + roomId + '/draw',
                function (message) {
                    var data = JSON.parse(message.body);
                    animateDraw(data.number, data.index);
                }
            );

            subs.results = stompClient.subscribe(
                '/topic/room/' + roomId + '/results',
                function (message) {
                    var data = JSON.parse(message.body);
                    showResultsOverlay(data);
                }
            );

            subs.chat = stompClient.subscribe(
                '/topic/room/' + roomId + '/chat',
                function (message) {
                    var data = JSON.parse(message.body);
                    addChatMessage(data);
                }
            );

            activeSubscriptions[roomId] = subs;

            showToast('Te uniste a la sala #' + roomId, 'success');

            // PASO 4: Pedir la lista actualizada de jugadores inmediatamente
            apiFetch('/rooms').then(function (rooms) {
                renderRoomList(rooms);
            });
        })
        .catch(function (error) {
            var msg = (error.data && error.data.mensaje) || 'Error al unirse a la sala';
            showToast(msg, 'error');
        });
}

    currentRoomId = roomId;
    setCurrentRoom(roomId);

    var subs = {};

    // Suscripción a jugadores
    subs.players = stompClient.subscribe('/topic/room/' + roomId + '/players', function (message) {
        var data = JSON.parse(message.body);
        renderPlayerList(data);
    });

    // Suscripción al temporizador
    subs.timer = stompClient.subscribe('/topic/room/' + roomId + '/timer', function (message) {
        var data = JSON.parse(message.body);
        updateTimer(data.seconds);
    });

    // Suscripción al sorteo (animación número por número)
    subs.draw = stompClient.subscribe('/topic/room/' + roomId + '/draw', function (message) {
        var data = JSON.parse(message.body);
        animateDraw(data.number, data.index);
    });

    // Suscripción a resultados finales
    subs.results = stompClient.subscribe('/topic/room/' + roomId + '/results', function (message) {
        var data = JSON.parse(message.body);
        showResultsOverlay(data);
    });

    // Suscripción al chat de la sala
    subs.chat = stompClient.subscribe('/topic/room/' + roomId + '/chat', function (message) {
        var data = JSON.parse(message.body);
        addChatMessage(data);
    });

    activeSubscriptions[roomId] = subs;

    // Notificar al servidor que el jugador se unió
    stompClient.publish({
        destination: '/app/room.join',
        body: JSON.stringify({ roomId: roomId })
    });

    showToast('Te uniste a la sala #' + roomId, 'success');


// ==========================================
// ENVIAR JUGADA
// ==========================================

/**
 * Envía los números seleccionados y la apuesta al servidor.
 * @param {number[]} selectedNumbers - Números elegidos.
 * @param {number} betAmount - Monto apostado.
 */
function sendPlay(selectedNumbers, betAmount) {
    if (!isConnected) {
        showToast('Sin conexión', 'error');
        return;
    }

    if (!currentRoomId) {
        showToast('No estás en una sala', 'warning');
        return;
    }

    stompClient.publish({
        destination: '/app/room.play',
        body: JSON.stringify({
            roomId: currentRoomId,
            selectedNumbers: selectedNumbers,
            betAmount: betAmount
        })
    });
}

// ==========================================
// ENVIAR MENSAJE DE CHAT
// ==========================================

/**
 * Envía un mensaje de chat a la sala actual.
 * @param {string} message - Contenido del mensaje.
 */
function sendChat(message) {
    if (!isConnected) {
        showToast('Sin conexión', 'error');
        return;
    }

    if (!currentRoomId) return;

    var trimmed = message.trim();
    if (!trimmed) return;

    stompClient.publish({
        destination: '/app/room.chat',
        body: JSON.stringify({
            roomId: currentRoomId,
            message: trimmed
        })
    });
}

// ==========================================
// DESCONEXIÓN
// ==========================================

/**
 * Desconecta el WebSocket y limpia suscripciones.
 */
function disconnectWebSocket() {
    if (stompClient && stompClient.active) {
        stompClient.deactivate();
    }

    // Limpiar suscripciones almacenadas
    for (var key in activeSubscriptions) {
        if (activeSubscriptions.hasOwnProperty(key)) {
            delete activeSubscriptions[key];
        }
    }

    isConnected = false;
    currentRoomId = null;
}

// ==========================================
// ESTADO DE CONEXIÓN
// ==========================================

/**
 * Retorna si el WebSocket está actualmente conectado.
 * @returns {boolean} true si hay conexión activa.
 */
function isWebSocketConnected() {
    return isConnected;
}
