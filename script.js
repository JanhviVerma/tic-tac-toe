document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const cells = document.querySelectorAll('[data-cell]');
    const status = document.getElementById('status');
    const restartButton = document.getElementById('restartButton');
    const startGameButton = document.getElementById('startGame');
    const gameArea = document.getElementById('gameArea');
    const statistics = document.getElementById('statistics');
    const gamesPlayedElement = document.getElementById('gamesPlayed');
    const playerWinsElement = document.getElementById('playerWins');
    const playerLossesElement = document.getElementById('playerLosses');
    const drawsElement = document.getElementById('draws');
    const singlePlayerModeButton = document.getElementById('singlePlayerMode');
    const localMultiPlayerModeButton = document.getElementById('localMultiPlayerMode');
    const onlineMultiPlayerModeButton = document.getElementById('onlineMultiPlayerMode');
    const themeToggle = document.getElementById('themeToggle');
    const soundToggle = document.getElementById('soundToggle');
    const fullscreenToggle = document.getElementById('fullscreenToggle');
    const leaderboard = document.getElementById('leaderboard');
    const leaderboardBody = document.getElementById('leaderboardBody');
    const createRoomButton = document.getElementById('createRoom');
    const joinRoomButton = document.getElementById('joinRoom');
    const roomCodeInput = document.getElementById('roomCode');
    const chatArea = document.getElementById('chatArea');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageButton = document.getElementById('sendMessage');
    const spectatorArea = document.getElementById('spectatorArea');
    const playerList = document.getElementById('playerList');
    const playerNameInput = document.getElementById('playerName');
    const emojiReactions = document.getElementById('emojiReactions');
    const gameHistory = document.getElementById('gameHistory');
    const historyList = document.getElementById('historyList');

    let currentPlayer = 'X';
    let gameActive = false;
    let player1Name = 'Player X';
    let player2Name = 'Player O';
    let isSinglePlayerMode = false;
    let isLocalMultiPlayerMode = false;
    let isOnlineMode = true;
    let difficulty = 'medium';
    let gameStats = {
        gamesPlayed: 0,
        playerWins: 0,
        playerLosses: 0,
        draws: 0
    };
    let isDarkTheme = false;
    let isSoundOn = true;
    let isFullscreen = false;
    let leaderboardData = [];
    let isSpectator = false;
    let roomCode = '';
    let playerName = '';
    let socket;
    let gameHistory = [];

    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    const sounds = {
        place: new Audio('place.mp3'),
        win: new Audio('win.mp3'),
        draw: new Audio('draw.mp3'),
        click: new Audio('click.mp3')
    };

    function initializeWebSocket() {
        // In a real implementation, you would connect to your WebSocket server here
        socket = {
            send: function(data) {
                console.log('Sent:', data);
                // Simulate receiving the same data
                setTimeout(() => this.onmessage({data: data}), 100);
            },
            onmessage: function(event) {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            }
        };
    }

    function handleWebSocketMessage(data) {
        switch(data.type) {
            case 'move':
                handleOpponentMove(data.cell);
                break;
            case 'chat':
                addChatMessage(data.player, data.message);
                break;
            case 'playerJoined':
                updatePlayerList(data.players);
                break;
            case 'gameStart':
                startOnlineGame(data.players);
                break;
            case 'emoji':
                handleEmojiReaction(data.player, data.emoji);
                break;
        }
    }

    function createRoom() {
        roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        socket.send(JSON.stringify({type: 'createRoom', room: roomCode, player: playerName}));
        roomCodeInput.value = roomCode;
    }

    function joinRoom() {
        roomCode = roomCodeInput.value.toUpperCase();
        socket.send(JSON.stringify({type: 'joinRoom', room: roomCode, player: playerName}));
    }

    function sendChatMessage() {
        const message = chatInput.value.trim();
        if (message) {
            socket.send(JSON.stringify({type: 'chat', room: roomCode, player: playerName, message: message}));
            chatInput.value = '';
        }
    }

    function addChatMessage(player, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        messageElement.textContent = `${player}: ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updatePlayerList(players) {
        playerList.innerHTML = '';
        players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player;
            playerList.appendChild(li);
        });
    }

    function startOnlineGame(players) {
        if (players.indexOf(playerName) === -1) {
            isSpectator = true;
            spectatorArea.classList.remove('hidden');
        } else {
            isSpectator = false;
            spectatorArea.classList.add('hidden');
        }
        gameArea.classList.remove('hidden');
        chatArea.classList.remove('hidden');
        updatePlayerList(players);
    }

    function handleOpponentMove(cellIndex) {
        if (!isSpectator && currentPlayer !== 'O') return;
        const cell = cells[cellIndex];
        placeMark(cell, 'O');
        if (checkWin()) {
            endGame(false);
        } else if (checkDraw()) {
            endGame(true);
        } else {
            currentPlayer = 'X';
            updateStatus();
        }
    }

    function handleCellClick(e) {
        if (isSpectator) return;
        
        const cell = e.target;
        const cellIndex = Array.from(cells).indexOf(cell);

        if (cell.textContent !== '' || !gameActive || (isOnlineMode && currentPlayer !== 'X')) return;

        placeMark(cell, currentPlayer);
        playSound('place');

        if (isOnlineMode) {
            socket.send(JSON.stringify({type: 'move', room: roomCode, player: playerName, cell: cellIndex}));
        }

        if (checkWin()) {
            endGame(false);
        } else if (checkDraw()) {
            endGame(true);
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateStatus();
            if (isSinglePlayerMode && currentPlayer === 'O') {
                disableBoard();
                setTimeout(() => {
                    makeAIMove();
                    enableBoard();
                }, 500);
            }
        }
    }

    function toggleGameMode(mode) {
        isSinglePlayerMode = mode === 'single';
        isLocalMultiPlayerMode = mode === 'local';
        isOnlineMode = mode === 'online';
        singlePlayerModeButton.classList.toggle('active', isSinglePlayerMode);
        localMultiPlayerModeButton.classList.toggle('active', isLocalMultiPlayerMode);
        onlineMultiPlayerModeButton.classList.toggle('active', isOnlineMode);
        
        const onlineElements = document.querySelectorAll('.online-controls, #playerName');
        onlineElements.forEach(el => el.style.display = isOnlineMode ? 'block' : 'none');
    }

    function startGame() {
        player1Name = playerNameInput.value || 'Player X';
        player2Name = isSinglePlayerMode ? 'AI' : (isOnlineMode ? 'Opponent' : 'Player O');
        gameArea.classList.remove('hidden');
        statistics.classList.remove('hidden');
        gameActive = true;
        restartGame();
        leaderboard.classList.remove('hidden');
        updateLeaderboard();
        emojiReactions.classList.remove('hidden');
        gameHistory.classList.remove('hidden');
    }

    function placeMark(cell, mark) {
        cell.textContent = mark;
        cell.classList.add('populated');
        cell.setAttribute('aria-label', mark);
        
        cell.style.animation = 'none';
        cell.offsetHeight; // Trigger reflow
        cell.style.animation = null;
        cell.classList.add('pop-in');
        setTimeout(() => cell.classList.remove('pop-in'), 300);
    }

    function checkWin() {
        return winningCombinations.some(combination => {
            return combination.every(index => {
                return cells[index].textContent === currentPlayer;
            });
        });
    }

    function checkDraw() {
        return Array.from(cells).every(cell => cell.textContent !== '');
    }

    function endGame(isDraw) {
        if (isDraw) {
            status.textContent = "It's a draw!";
            updateStatistics('draw');
            playSound('draw');
        } else {
            const winner = currentPlayer === 'X' ? player1Name : player2Name;
            status.textContent = `${winner} wins!`;
            highlightWinningCombination();
            updateStatistics(currentPlayer);
            updateLeaderboard();
            playSound('win');
        }
        gameActive = false;
        addToGameHistory(isDraw);
    }

    function highlightWinningCombination() {
        winningCombinations.forEach(combination => {
            if (combination.every(index => cells[index].textContent === currentPlayer)) {
                combination.forEach(index => cells[index].classList.add('win'));
            }
        });
    }

    function restartGame() {
        currentPlayer = 'X';
        gameActive = true;
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('populated', 'win');
            cell.setAttribute('aria-label', 'Empty');
        });
        updateStatus();
    }

    function updateStatus() {
        const currentPlayerName = currentPlayer === 'X' ? player1Name : player2Name;
        status.textContent = `${currentPlayerName}'s turn`;
        status.classList.add('fade-in');
        setTimeout(() => status.classList.remove('fade-in'), 500);
    }

    function updateStatistics(result) {
        gameStats.gamesPlayed++;
        if (result === 'X') {
            gameStats.playerWins++;
        } else if (result === 'O') {
            gameStats.playerLosses++;
        } else {
            gameStats.draws++;
        }
        updateStatisticsDisplay();
        saveStatistics();
    }

    function updateStatisticsDisplay() {
        gamesPlayedElement.textContent = gameStats.gamesPlayed;
        playerWinsElement.textContent = gameStats.playerWins;
        playerLossesElement.textContent = gameStats.playerLosses;
        drawsElement.textContent = gameStats.draws;
    }

    function saveStatistics() {
        localStorage.setItem('ticTacToeStats', JSON.stringify(gameStats));
    }

    function loadStatistics() {
        const savedStats = localStorage.getItem('ticTacToeStats');
        if (savedStats) {
            gameStats = JSON.parse(savedStats);
            updateStatisticsDisplay();
        }
    }

    function makeAIMove() {
        if (!gameActive) return;

        let bestMove;
        switch (difficulty) {
            case 'easy':
                bestMove = getRandomEmptyCell();
                break;
            case 'medium':
                bestMove = Math.random() < 0.5 ? getBestMove() : getRandomEmptyCell();
                break;
            case 'hard':
                bestMove = getBestMove();
                break;
        }

        placeMark(cells[bestMove], 'O');

        if (checkWin()) {
            endGame(false);
        } else if (checkDraw()) {
            endGame(true);
        } else {
            currentPlayer = 'X';
            updateStatus();
        }
    }

    function getRandomEmptyCell() {
        const emptyCells = Array.from(cells).filter(cell => cell.textContent === '');
        return Array.from(cells).indexOf(emptyCells[Math.floor(Math.random() * emptyCells.length)]);
    }

    function getBestMove() {
        let bestScore = -Infinity;
        let bestMove;
        for (let i = 0; i < cells.length; i++) {
            if (cells[i].textContent === '') {
                cells[i].textContent = 'O';
                let score = minimax(cells, 0, false);
                cells[i].textContent = '';
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        return bestMove;
    }

    function minimax(board, depth, isMaximizing) {
        if (checkWinForMinimax('O')) return 1;
        if (checkWinForMinimax('X')) return -1;
        if (checkDraw()) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < cells.length; i++) {
                if (cells[i].textContent === '') {
                    cells[i].textContent = 'O';
                    let score = minimax(board, depth + 1, false);
                    cells[i].textContent = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < cells.length; i++) {
                if (cells[i].textContent === '') {
                    cells[i].textContent = 'X';
                    let score = minimax(board, depth + 1, true);
                    cells[i].textContent = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    function checkWinForMinimax(player) {
        return winningCombinations.some(combination => {
            return combination.every(index => cells[index].textContent === player);
        });
    }

    function toggleTheme() {
        isDarkTheme = !isDarkTheme;
        document.body.classList.toggle('dark-theme', isDarkTheme);
        themeToggle.innerHTML = isDarkTheme ? '<i class="fas fa-sun"></i> Toggle Theme' : '<i class="fas fa-moon"></i> Toggle Theme';
        playSound('click');
    }

    function toggleSound() {
        isSoundOn = !isSoundOn;
        soundToggle.innerHTML = isSoundOn ? '<i class="fas fa-volume-up"></i> Toggle Sound' : '<i class="fas fa-volume-mute"></i> Toggle Sound';
        playSound('click');
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            isFullscreen = true;
            fullscreenToggle.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                isFullscreen = false;
                fullscreenToggle.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
            }
        }
    }

    function playSound(soundName) {
        if (isSoundOn) {
            sounds[soundName].currentTime = 0;
            sounds[soundName].play();
        }
    }

    function updateLeaderboard() {
        const currentPlayerName = currentPlayer === 'X' ? player1Name : player2Name;
        const playerIndex = leaderboardData.findIndex(player => player.name === currentPlayerName);
        
        if (playerIndex !== -1) {
            leaderboardData[playerIndex].wins++;
        } else {
            leaderboardData.push({ name: currentPlayerName, wins: 1 });
        }

        leaderboardData.sort((a, b) => b.wins - a.wins);
        
        leaderboardBody.innerHTML = '';
        leaderboardData.slice(0, 5).forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.name}</td>
                <td>${player.wins}</td>
            `;
            leaderboardBody.appendChild(row);
        });

        localStorage.setItem('ticTacToeLeaderboard', JSON.stringify(leaderboardData));
    }

    function loadLeaderboard() {
        const savedLeaderboard = localStorage.getItem('ticTacToeLeaderboard');
        if (savedLeaderboard) {
            leaderboardData = JSON.parse(savedLeaderboard);
            updateLeaderboard();
        }
    }

    function handleEmojiReaction(player, emoji) {
        const reactionElement = document.createElement('div');
        reactionElement.textContent = `${player} reacted with ${emoji}`;
        reactionElement.classList.add('emoji-reaction', 'fade-in');
        chatMessages.appendChild(reactionElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => {
            reactionElement.classList.remove('fade-in');
            reactionElement.classList.add('fade-out');
        }, 3000);

        setTimeout(() => {
            chatMessages.removeChild(reactionElement);
        }, 3500);
    }

    function addToGameHistory(isDraw) {
        const result = isDraw ? "Draw" : `${currentPlayer === 'X' ? player1Name : player2Name} won`;
        const historyEntry = `Game ${gameStats.gamesPlayed}: ${result}`;
        gameHistory.unshift(historyEntry);

        if (gameHistory.length > 10) {
            gameHistory.pop();
        }

        updateGameHistoryDisplay();
    }

    function updateGameHistoryDisplay() {
        historyList.innerHTML = '';
        gameHistory.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = entry;
            historyList.appendChild(li);
        });
    }

    function enableBoard() {
        cells.forEach(cell => cell.style.pointerEvents = 'auto');
    }

    function disableBoard() {
        cells.forEach(cell => cell.style.pointerEvents = 'none');
    }

    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
        cell.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                handleCellClick(e);
            }
        });
    });

    restartButton.addEventListener('click', restartGame);
    startGameButton.addEventListener('click', startGame);
    themeToggle.addEventListener('click', toggleTheme);
    soundToggle.addEventListener('click', toggleSound);
    fullscreenToggle.addEventListener('click', toggleFullscreen);
    createRoomButton.addEventListener('click', createRoom);
    joinRoomButton.addEventListener('click', joinRoom);
    sendMessageButton.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    singlePlayerModeButton.addEventListener('click', () => toggleGameMode('single'));
    localMultiPlayerModeButton.addEventListener('click', () => toggleGameMode('local'));
    onlineMultiPlayerModeButton.addEventListener('click', () => toggleGameMode('online'));

    playerNameInput.addEventListener('change', (e) => {
        playerName = e.target.value;
    });

    emojiReactions.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const emoji = btn.dataset.emoji;
            socket.send(JSON.stringify({type: 'emoji', room: roomCode, player: playerName, emoji: emoji}));
        });
    });

    initializeWebSocket();
    loadStatistics();
    loadLeaderboard();
});