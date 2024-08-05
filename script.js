document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const cells = document.querySelectorAll('[data-cell]');
    const status = document.getElementById('status');
    const restartButton = document.getElementById('restartButton');

    let currentPlayer = 'X';
    let gameActive = true;

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

    function handleCellClick(e) {
        const cell = e.target;
        const cellIndex = Array.from(cells).indexOf(cell);

        if (cell.textContent !== '' || !gameActive) return;

        cell.textContent = currentPlayer;
        if (checkWin()) {
            status.textContent = `Player ${currentPlayer} wins!`;
            gameActive = false;
        } else if (checkDraw()) {
            status.textContent = "It's a draw!";
            gameActive = false;
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            status.textContent = `Player ${currentPlayer}'s turn`;
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

    function restartGame() {
        currentPlayer = 'X';
        gameActive = true;
        cells.forEach(cell => cell.textContent = '');
        status.textContent = `Player ${currentPlayer}'s turn`;
    }

    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    restartButton.addEventListener('click', restartGame);

    status.textContent = `Player ${currentPlayer}'s turn`;
});