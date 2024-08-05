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

    function startGame() {
        player1Name = player1Input.value || 'Player X';
        player2Name = isSinglePlayerMode ? 'AI' : (player2Input.value || 'Player O');
        gameArea.classList.remove('hidden');
        statistics.classList.remove('hidden');
        gameActive = true;
        difficulty = difficultySelect.value;
        restartGame();
    }

    function handleCellClick(e) {
        const cell = e.target;
        const cellIndex = Array.from(cells).indexOf(cell);

        if (cell.textContent !== '' || !gameActive) return;

        placeMark(cell, currentPlayer);

        if (checkWin()) {
            endGame(false);
        } else if (checkDraw()) {
            endGame(true);
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateStatus();
            if (isSinglePlayerMode && currentPlayer === 'O') {
                setTimeout(makeAIMove, 500);
            }
        }
    }

    function placeMark(cell, mark) {
        cell.textContent = mark;
        cell.classList.add('populated');
        cell.setAttribute('aria-label', mark);
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

    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
        cell.addEventListener('keypress', handleKeyPress);
    });
    restartButton.addEventListener('click', restartGame);
    startGameButton.addEventListener('click', startGame);
    singlePlayerModeButton.addEventListener('click', toggleGameMode);
    multiPlayerModeButton.addEventListener('click', toggleGameMode);

    loadStatistics();
});