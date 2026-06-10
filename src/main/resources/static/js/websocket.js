let stompClient = null;
let currentRoomId = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;
const activeSubscriptions = {};

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

function onWebSocketConnected() {
    isConnected = true;
    reconnectAttempts = 0;
    console.log('WebSocket conectado');

    stompClient.subscribe('/topic/rooms', function (message) {
        var data = JSON.parse(message.body);
        renderRoomList(data);
    });

    loadRooms();
}

function onWebSocketDisconnected() {
    isConnected = false;
    console.log('WebSocket desconectado');
    if (reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        showToast('Reconectando... intento ' + reconnectAttempts, 'warning');
    }
}

function onWebSocketError(frame) {
    console.error('Error STOMP:', frame);
    showToast('Error de conexión', 'error');
}

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
}

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

function disconnectWebSocket() {
    if (stompClient && stompClient.active) {
        stompClient.deactivate();
    }
    for (var key in activeSubscriptions) {
        if (activeSubscriptions.hasOwnProperty(key)) {
            delete activeSubscriptions[key];
        }
    }
    isConnected = false;
    currentRoomId = null;
}

function isWebSocketConnected() {
    return isConnected;
}