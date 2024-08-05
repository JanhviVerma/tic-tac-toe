document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const cells = document.querySelectorAll('[data-cell]');
    const status = document.getElementById('status');
    const restartButton = document.getElementById('restartButton');
    const startGameButton = document.getElementById('startGame');
    const player1Input = document.getElementById('player1');
    const player2Input = document.getElementById('player2');
    const player2Container = document.getElementById('player2Container');
    const difficultyContainer = document.getElementById('difficultyContainer');
    const difficultySelect = document.getElementById('difficulty');
    const gameArea = document.getElementById('gameArea');
    const statistics = document.getElementById('statistics');
    const gamesPlayedElement = document.getElementById('gamesPlayed');
    const player1WinsElement = document.getElementById('player1Wins');
    const player2WinsElement = document.getElementById('player2Wins');
    const drawsElement = document.getElementById('draws');
    const singlePlayerModeButton = document.getElementById('singlePlayerMode');
    const multiPlayerModeButton = document.getElementById('multiPlayerMode');
    const themeToggle = document.getElementById('themeToggle');
    const soundToggle = document.getElementById('soundToggle');
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
    // const singlePlayerModeButton = document.getElementById('singlePlayerMode');
    const localMultiPlayerModeButton = document.getElementById('localMultiPlayerMode');
    const onlineMultiPlayerModeButton = document.getElementById('onlineMultiPlayerMode');

    let currentPlayer = 'X';
    let gameActive = false;
    let player1Name = 'Player X';
    let player2Name = 'Player O';
    let isSinglePlayerMode = true;
    let difficulty = 'easy';
    let gameStats = {
        gamesPlayed: 0,
        player1Wins: 0,
        player2Wins: 0,
        draws: 0
    };
    let isDarkTheme = false;
    let isSoundOn = true;
    let leaderboardData = [];
    let isOnlineMode = true;
    let isSpectator = false;
    let roomCode = '';
    let playerName = '';
    let socket;

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
            // Add more cases as needed
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
        isOnlineMode = mode === 'online';
        singlePlayerModeButton.classList.toggle('active', mode === 'single');
        localMultiPlayerModeButton.classList.toggle('active', mode === 'local');
        onlineMultiPlayerModeButton.classList.toggle('active', mode === 'online');
        
        const onlineElements = document.querySelectorAll('.online-controls, #playerName');
        onlineElements.forEach(el => el.style.display = isOnlineMode ? 'block' : 'none');
    }

    function startGame() {
        player1Name = player1Input.value || 'Player X';
        player2Name = isSinglePlayerMode ? 'AI' : (player2Input.value || 'Player O');
        gameArea.classList.remove('hidden');
        statistics.classList.remove('hidden');
        gameActive = true;
        difficulty = difficultySelect.value;
        restartGame();
        leaderboard.classList.remove('hidden');
        updateLeaderboard();
    }

    function handleCellClick(e) {
        const cell = e.target;
        const cellIndex = Array.from(cells).indexOf(cell);
    
        if (cell.textContent !== '' || !gameActive) return;
    
        placeMark(cell, currentPlayer);
        playSound('place');
    
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

    function enableBoard() {
        cells.forEach(cell => cell.style.pointerEvents = 'auto');
    }

    function disableBoard() {
        cells.forEach(cell => cell.style.pointerEvents = 'none');
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

    function placeMark(cell, mark) {
        cell.textContent = mark;
        cell.classList.add('populated');
        cell.setAttribute('aria-label', mark);
        
        // Add pop-in animation
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
        } else {
            const winner = currentPlayer === 'X' ? player1Name : player2Name;
            status.textContent = `${winner} wins!`;
            highlightWinningCombination();
            updateStatistics(currentPlayer);
        }
        gameActive = false;
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

    function handleKeyPress(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            handleCellClick(e);
        }
    }

    function updateStatistics(result) {
        gameStats.gamesPlayed++;
        if (result === 'X') {
            gameStats.player1Wins++;
        } else if (result === 'O') {
            gameStats.player2Wins++;
        } else {
            gameStats.draws++;
        }
        updateStatisticsDisplay();
        saveStatistics();
    }

    function updateStatisticsDisplay() {
        gamesPlayedElement.textContent = gameStats.gamesPlayed;
        player1WinsElement.textContent = gameStats.player1Wins;
        player2WinsElement.textContent = gameStats.player2Wins;
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

    function toggleGameMode() {
        isSinglePlayerMode = !isSinglePlayerMode;
        singlePlayerModeButton.classList.toggle('active');
        multiPlayerModeButton.classList.toggle('active');
        player2Container.style.display = isSinglePlayerMode ? 'none' : 'block';
        difficultyContainer.style.display = isSinglePlayerMode ? 'block' : 'none';
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

    function playSound(soundName) {
        if (isSoundOn) {
            sounds[soundName].currentTime = 0;
            sounds[soundName].play();
        }
    }

    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
        cell.addEventListener('keypress', handleKeyPress);
    });
    restartButton.addEventListener('click', restartGame);
    startGameButton.addEventListener('click', startGame);
    singlePlayerModeButton.addEventListener('click', toggleGameMode);
    multiPlayerModeButton.addEventListener('click', toggleGameMode);
    themeToggle.addEventListener('click', toggleTheme);
    soundToggle.addEventListener('click', toggleSound);
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

    initializeWebSocket();
    loadStatistics();
    loadLeaderboard();

});