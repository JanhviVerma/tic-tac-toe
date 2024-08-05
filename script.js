document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const cells = document.querySelectorAll('[data-cell]');
    const status = document.getElementById('status');
    const restartButton = document.getElementById('restartButton');
    const startGameButton = document.getElementById('startGame');
    const player1Input = document.getElementById('player1');
    const player2Input = document.getElementById('player2');
    const gameArea = document.getElementById('gameArea');
    const statistics = document.getElementById('statistics');
    const gamesPlayedElement = document.getElementById('gamesPlayed');
    const player1WinsElement = document.getElementById('player1Wins');
    const player2WinsElement = document.getElementById('player2Wins');
    const drawsElement = document.getElementById('draws');

    let currentPlayer = 'X';
    let gameActive = false;
    let player1Name = 'Player X';
    let player2Name = 'Player O';
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
        player2Name = player2Input.value || 'Player O';
        gameArea.classList.remove('hidden');
        statistics.classList.remove('hidden');
        gameActive = true;
        restartGame();
    }

    function handleCellClick(e) {
        const cell = e.target;
        const cellIndex = Array.from(cells).indexOf(cell);

        if (cell.textContent !== '' || !gameActive) return;

        cell.textContent = currentPlayer;
        cell.classList.add('populated');
        cell.setAttribute('aria-label', currentPlayer);

        if (checkWin()) {
            const winner = currentPlayer === 'X' ? player1Name : player2Name;
            status.textContent = `${winner} wins!`;
            gameActive = false;
            highlightWinningCombination();
            updateStatistics(currentPlayer);
        } else if (checkDraw()) {
            status.textContent = "It's a draw!";
            gameActive = false;
            updateStatistics('draw');
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            const currentPlayerName = currentPlayer === 'X' ? player1Name : player2Name;
            status.textContent = `${currentPlayerName}'s turn`;
        }
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

    function highlightWinningCombination() {
        winningCombinations.forEach(combination => {
            if (combination.every(index => cells[index].textContent === currentPlayer)) {
                combination.forEach(index => cells[index].style.backgroundColor = '#90EE90');
            }
        });
    }

    function restartGame() {
        currentPlayer = 'X';
        gameActive = true;
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('populated');
            cell.style.backgroundColor = '';
            cell.setAttribute('aria-label', 'Empty');
        });
        status.textContent = `${player1Name}'s turn`;
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

    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
        cell.addEventListener('keypress', handleKeyPress);
    });
    restartButton.addEventListener('click', restartGame);
    startGameButton.addEventListener('click', startGame);

    loadStatistics();
});