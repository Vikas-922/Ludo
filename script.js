// Game state variables
const board = document.getElementById('ludo-board');
const dice = document.getElementById('dice');
const currentPlayerDisplay = document.getElementById('current-player-color');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const messageButton = document.getElementById('message-button');

// Define player colors and their starting/path/home positions
const players = {
    'red': {
        color: 'red',
        startCell: 'cell-7-2', // Red's actual start cell (index 0 in path)
        homePathStart: 'cell-8-2', // Start of red's home path
        pieces: [], // Array to hold piece elements
        homeCircles: ['home-red-1', 'home-red-2', 'home-red-3', 'home-red-4'],
        pathOffset: 0, // Offset for red's path in the common path array
        finishCell: 'cell-8-7' // Center finish cell
    },
    'green': {
        color: 'green',
        startCell: 'cell-2-9', // Green's actual start cell
        homePathStart: 'cell-2-8', // Start of green's home path
        pieces: [],
        homeCircles: ['home-green-1', 'home-green-2', 'home-green-3', 'home-green-4'],
        pathOffset: 13, // Offset for green's path
        finishCell: 'cell-7-8'
    },
    'yellow': {
        color: 'yellow',
        startCell: 'cell-14-7', // Yellow's actual start cell
        homePathStart: 'cell-14-8', // Start of yellow's home path
        pieces: [],
        homeCircles: ['home-yellow-1', 'home-yellow-2', 'home-yellow-3', 'home-yellow-4'],
        pathOffset: 26, // Offset for yellow's path
        finishCell: 'cell-9-8'
    },
    'blue': {
        color: 'blue',
        startCell: 'cell-9-14', // Blue's actual start cell
        homePathStart: 'cell-8-14', // Start of blue's home path
        pieces: [],
        homeCircles: ['home-blue-1', 'home-blue-2', 'home-blue-3', 'home-blue-4'],
        pathOffset: 39, // Offset for blue's path
        finishCell: 'cell-8-9'
    }
};

let currentTurn = 'red';
let diceValue = 0;
let selectedPiece = null;
let gameStarted = false;

// Common path for all players (52 cells)
// This array defines the sequence of cells for pieces to move on.
// The indices correspond to the grid positions (row-col).
const commonPath = [
    'cell-7-1', 'cell-7-2', 'cell-7-3', 'cell-7-4', 'cell-7-5', 'cell-7-6', // Red's initial path (6 cells)
    'cell-6-7', 'cell-5-7', 'cell-4-7', 'cell-3-7', 'cell-2-7', 'cell-1-7', 'cell-1-8', // Path towards green (6 cells)
    'cell-1-9', 'cell-2-9', 'cell-3-9', 'cell-4-9', 'cell-5-9', 'cell-6-9', // Green's initial path (6 cells)
    'cell-7-10', 'cell-7-11', 'cell-7-12', 'cell-7-13', 'cell-7-14', 'cell-7-15', 'cell-8-15', // Path towards yellow (6 cells)
    'cell-9-15', 'cell-9-14', 'cell-9-13', 'cell-9-12', 'cell-9-11', 'cell-9-10', // Yellow's initial path (6 cells)
    'cell-10-9', 'cell-11-9', 'cell-12-9', 'cell-13-9', 'cell-14-9', 'cell-15-9', 'cell-15-8',// Path towards blue (6 cells)
    'cell-15-7', 'cell-14-7', 'cell-13-7', 'cell-12-7', 'cell-11-7', 'cell-10-7', // Blue's initial path (6 cells)
    'cell-9-6', 'cell-9-5', 'cell-9-4', 'cell-9-3', 'cell-9-2', 'cell-9-1','cell-8-1', // Path back to red (6 cells)
];

// Home paths for each player (6 cells each)
const homePaths = {
    'red': ['cell-8-2', 'cell-8-3', 'cell-8-4', 'cell-8-5', 'cell-8-6', 'cell-8-7'],
    'green': ['cell-2-8', 'cell-3-8', 'cell-4-8', 'cell-5-8', 'cell-6-8', 'cell-7-8'],
    'yellow': ['cell-14-8', 'cell-13-8', 'cell-12-8', 'cell-11-8', 'cell-10-8', 'cell-9-8'],
    'blue': ['cell-8-14', 'cell-8-13', 'cell-8-12', 'cell-8-11', 'cell-8-10', 'cell-8-9']
};

// Safe cells (marked with shield)
const safeCells = [
    'cell-9-3', 'cell-7-2', 'cell-3-7','cell-2-9', 'cell-7-13', 'cell-9-14', 'cell-13-9','cell-14-7'
];

/**
 * Displays a message box with the given text.
 * @param {string} message - The message to display.
 * @param {boolean} isLoading - If true, shows a loading indicator and no OK button.
 */
function showMessage(message, isLoading = false) {
    messageText.innerHTML = message; // Use innerHTML for potential loading spinner
    
    // messageBox.style.display = 'block';
    messageBox.classList.add("show");
    if (isLoading) {
        messageButton.style.display = 'none';
    } else {
        messageButton.style.display = 'block';
        messageButton.onclick = () => {
            messageBox.classList.remove("show");
            // Additional logic after message is dismissed, if needed
        };
        // setTimeout(() => {
        //     messageBox.classList.remove('show');
        // }, 1000);
    }
}

/**
 * Initializes the Ludo board by creating cells and placing home areas.
 */
function initializeBoard() {
    for (let r = 1; r <= 15; r++) {
        for (let c = 1; c <= 15; c++) {
            // Skip cells covered by home areas and center
            if ((r >= 1 && r <= 6 && c >= 1 && c <= 6) || // Red home
                (r >= 1 && r <= 6 && c >= 10 && c <= 15) || // Green home
                (r >= 10 && r <= 15 && c >= 1 && c <= 6) || // Yellow home
                (r >= 10 && r <= 15 && c >= 10 && c <= 15) || // Blue home
                (r >= 7 && r <= 9 && c >= 7 && c <= 9)) { // Center
                continue;
            }

            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = `cell-${r}-${c}`;
            board.appendChild(cell);

            // Position cells using grid-area
            cell.style.gridArea = `${r} / ${c} / span 1 / span 1`;

            // Add specific classes for path cells
            if (commonPath.includes(cell.id) || Object.values(homePaths).some(path => path.includes(cell.id))) {
                cell.classList.add('path-cell');
            }

            // Add color classes for specific path segments
            if (cell.id === players.red.startCell) cell.classList.add('red-path', 'start-cell');
            if (cell.id === players.green.startCell) cell.classList.add('green-path', 'start-cell');
            if (cell.id === players.yellow.startCell) cell.classList.add('yellow-path', 'start-cell');
            if (cell.id === players.blue.startCell) cell.classList.add('blue-path', 'start-cell');

            // Add safe cell class
            if (safeCells.includes(cell.id)) {
                cell.classList.add('safe-cell');
            }

            // Add home path colors
            if (homePaths.red.includes(cell.id) && cell.id !== players.red.finishCell) cell.classList.add('red-path');
            if (homePaths.green.includes(cell.id) && cell.id !== players.green.finishCell) cell.classList.add('green-path');
            if (homePaths.yellow.includes(cell.id) && cell.id !== players.yellow.finishCell) cell.classList.add('yellow-path');
            if (homePaths.blue.includes(cell.id) && cell.id !== players.blue.finishCell) cell.classList.add('blue-path');
        }
    }
}

/**
 * Creates and places player pieces on their respective home circles.
 */
function createPieces() {
    for (const playerColor in players) {
        const player = players[playerColor];
        for (let i = 0; i < 4; i++) {
            const piece = document.createElement('div');
            piece.classList.add('piece', player.color);
            piece.dataset.player = player.color;
            piece.dataset.pieceId = `${player.color}-${i + 1}`;
            piece.dataset.position = 'home'; // 'home', 'path-index', 'home-path-index', 'finished'
            piece.dataset.pathIndex = -1; // -1 for home, actual index for path
            piece.textContent = i + 1; // Number on the piece

            // Place piece in its initial home circle
            const homeCircle = document.getElementById(player.homeCircles[i]);
            if (homeCircle) {
                homeCircle.appendChild(piece);
            } else {
                console.error(`Home circle ${player.homeCircles[i]} not found.`);
            }
            player.pieces.push(piece);

            // Add click listener to pieces
            piece.addEventListener('click', handlePieceClick);
        }
    }
}

/**
 * Fetches a Ludo Insight from the Gemini API.
 * @param {string} playerColor - The color of the current player.
 * @param {number} rolledValue - The value rolled on the dice.
 * @returns {Promise<string>} A promise that resolves with the insight text.
 */
async function fetchLudoInsight(playerColor, rolledValue) {
    const prompt = `Given that the current player is ${playerColor} and they just rolled a ${rolledValue} in Ludo, provide a short, fun, and encouraging or slightly mischievous 'Ludo Insight' or commentary about the turn. Keep it under 30 words.`;
    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    const payload = { contents: chatHistory };
    const apiKey = ""; // If you want to use models other than gemini-2.0-flash or imagen-3.0-generate-002, provide an API key here. Otherwise, leave this as-is.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.error("Gemini API response structure unexpected:", result);
            return "No insight available.";
        }
    } catch (error) {
        console.error("Error fetching Ludo insight:", error);
        return "Failed to get Ludo insight.";
    }
}

/**
 * Handles the dice roll event.
 */
async function rollDice() {
    if (selectedPiece) {
        showMessage("Please move your selected piece or deselect it.");
        return;
    }

    diceValue = Math.floor(Math.random() * 6) + 1;
    dice.textContent = diceValue === 1 ? '⚀' :
                        diceValue === 2 ? '⚁' :
                        diceValue === 3 ? '⚂' :
                        diceValue === 4 ? '⚃' :
                        diceValue === 5 ? '⚄' : '⚅';
    dice.style.pointerEvents = 'none'; // Disable dice after rolling

    // let initialMessage = `${currentTurn.toUpperCase()} rolled a ${diceValue}!`;
    // showMessage(initialMessage + '<br>✨ Getting Ludo Insight... ✨', true); // Show loading

    // const ludoInsight = await fetchLudoInsight(currentTurn, diceValue);
    // showMessage(`${initialMessage}<br>${ludoInsight}`); // Update with insight

    // Determine playable pieces
    const currentPlayer = players[currentTurn];
    let playablePieces = [];

    // Check pieces in home
    const piecesInHome = currentPlayer.pieces.filter(p => p.dataset.position === 'home');
    if (diceValue === 6 && piecesInHome.length > 0) {
        // If 6 is rolled, any piece in home can come out
        playablePieces.push(...piecesInHome);
    }
    console.log('dice-value', diceValue);
    
    // Check pieces on the path
    const piecesOnPath = currentPlayer.pieces.filter(p => p.dataset.position.startsWith('path'));
    piecesOnPath.forEach(piece => {
        const currentPathIndex = parseInt(piece.dataset.pathIndex);
        // Simplified check: if on common path, it can move. More complex logic is in movePiece.
        // This part just determines if *any* piece is movable.
        if (currentPathIndex !== -1) { // If it's on the path (not home)
            playablePieces.push(piece);
        }
    });
    // console.log('b');
    
    // If no playable pieces, end turn
    console.log("aaa", playablePieces);
    // console.log(playablePieces.length);
    
    
    if (playablePieces.length === 0) {
        dice.style.pointerEvents = 'auto';
        nextTurn();
        // setTimeout(() => {
        //     // showMessage("No valid moves. Next turn!");
        //     dice.style.pointerEvents = 'auto'; // Re-enable dice for next player
        //     setTimeout(nextTurn, 1000);
        // }, 1000); // Give time for insight to be read
    } else {
        // Highlight playable pieces
        playablePieces.forEach(piece => piece.classList.add('selected'));
    }
    // console.log('c');
}

/**
 * Handles piece click events.
 * @param {Event} event - The click event.
 */
function handlePieceClick(event) {
    const clickedPiece = event.currentTarget;
    const playerColor = clickedPiece.dataset.player;

    if (playerColor !== currentTurn || diceValue === 0) {
        // showMessage("It's not your turn or you haven't rolled the dice yet.");
        return;
    }

    // If a piece is already selected, deselect it
    if (selectedPiece) {
        selectedPiece.classList.remove('selected');
    }

    // Select the clicked piece
    selectedPiece = clickedPiece;
    selectedPiece.classList.add('selected');

    // Attempt to move the piece
    movePiece(selectedPiece, diceValue);
}

/**
 * Moves a piece based on the dice value.
 * @param {HTMLElement} piece - The piece element to move.
 * @param {number} steps - The number of steps to move.
 */
function movePiece(piece, steps) {
    const player = players[currentTurn];
    const currentPosition = piece.dataset.position;
    let currentPathIndex = parseInt(piece.dataset.pathIndex);

    // Logic for moving piece from home
    if (currentPosition === 'home') {
        if (steps === 6) {
            // Move piece from home to start cell
            const startCellId = player.startCell;
            const startCell = document.getElementById(startCellId);
            if (startCell) {
                startCell.appendChild(piece);
                piece.dataset.position = 'path';
                // Find the actual index of the startCell in the commonPath
                const actualStartIndex = commonPath.indexOf(startCellId);
                piece.dataset.pathIndex = actualStartIndex;
                // showMessage(`${player.color.toUpperCase()} piece moved out of home!`);
                checkAndKillOpponent(piece);
                resetTurn();
            } else {
                console.error(`Start cell ${startCellId} not found.`);
                showMessage("Error: Start cell not found.");
            }
        } else {
            showMessage("You need to roll a 6 to move a piece out of home.");
            deselectPiece();
        }
        return;
    }

    // Logic for moving piece on the path
    if (currentPosition.startsWith('path') || currentPosition.startsWith('home-path')) {
        let newPathIndex = currentPathIndex + steps;
        let targetCellId;
        let targetPathArray;
        let movedIntoHomePath = false;

        const totalCommonPathLength = commonPath.length; // 52
        const totalHomePathLength = homePaths[currentTurn].length; // 6

        // Determine the absolute index on the common path for the current piece
        let absoluteCurrentCommonPathIndex = -1;
        if (currentPosition === 'path') {
            absoluteCurrentCommonPathIndex = currentPathIndex;
        } else {
            // If already in home path, it's not on the common path for this calculation
            // This means a piece already in home path cannot go back to common path.
            // This logic is for moving from common path INTO home path or moving WITHIN home path.
        }

        // Logic to check if the piece is entering its home path
        // This is the index in the commonPath array where a player's piece would branch off to their home path.
        let entryPointCommonPathIndex;
        switch (currentTurn) {
            case 'red': entryPointCommonPathIndex = commonPath.indexOf('cell-8-1'); break; // cell-7-1 is the last common cell before red's home path
            case 'green': entryPointCommonPathIndex = commonPath.indexOf('cell-1-8'); break; // cell-1-7 is the last common cell before green's home path
            case 'yellow': entryPointCommonPathIndex = commonPath.indexOf('cell-15-8'); break; // cell-14-7 is the last common cell before yellow's home path
            case 'blue': entryPointCommonPathIndex = commonPath.indexOf('cell-8-15'); break; // cell-7-14 is the last common cell before blue's home path
        }

        // If the piece is currently on the common path
        if (currentPosition === 'path') {
            console.log('currentPathIndex', currentPathIndex);
            console.log('newPathIndex', newPathIndex);
            console.log('entryPointCommonPathIndex', entryPointCommonPathIndex);
            
            if (newPathIndex >= entryPointCommonPathIndex && currentPathIndex < entryPointCommonPathIndex) {
                // The piece is crossing into its home path
                const stepsIntoHomePath = newPathIndex - entryPointCommonPathIndex;
                if (stepsIntoHomePath < totalHomePathLength) {
                    targetPathArray = homePaths[currentTurn];
                    targetCellId = targetPathArray[stepsIntoHomePath];
                    piece.dataset.position = 'home-path';
                    piece.dataset.pathIndex = stepsIntoHomePath;
                    movedIntoHomePath = true;
                } else {
                    // Overshot the home path
                    showMessage("Cannot move: Overshot the home path. Try again.");
                    deselectPiece();
                    return;
                }
            } else if (newPathIndex < totalCommonPathLength) {
                // Still on common path
                targetPathArray = commonPath;
                targetCellId = commonPath[newPathIndex];
                piece.dataset.pathIndex = newPathIndex;
            } else {
                // Overshot common path without entering home path (should not happen with correct entryPointCommonPathIndex)
                showMessage("Cannot move: Overshot the path. Try again.");
                deselectPiece();
                return;
            }
        } else if (currentPosition === 'home-path') {
            // Already in home path
            if (newPathIndex < totalHomePathLength) {
                targetPathArray = homePaths[currentTurn];
                targetCellId = targetPathArray[newPathIndex];
                piece.dataset.pathIndex = newPathIndex;
            } else {
                // Overshot home path
                showMessage("Cannot move: Overshot the home path. Try again.");
                deselectPiece();
                return;
            }
        }

        // Check if piece reached the finish cell
        if (targetCellId === player.finishCell && piece.dataset.position === 'home-path') {
            const finishCell = document.getElementById(player.finishCell);
            if (finishCell) {
                finishCell.appendChild(piece);
                piece.dataset.position = 'finished';
                piece.style.position = 'relative'; // Adjust styling for finished pieces
                piece.style.left = 'unset';
                piece.style.top = 'unset';
                showMessage(`${player.color.toUpperCase()} piece finished!`);
                checkWinCondition();
                resetTurn();
                return; // Piece finished, no need for further checks
            }
        }

        // Move the piece to the target cell
        const targetCell = document.getElementById(targetCellId);
        if (targetCell) {
            targetCell.appendChild(piece);
            // showMessage(`${player.color.toUpperCase()} piece moved ${steps} steps.`);
            if (!movedIntoHomePath) { // Only check for kills if still on common path
                checkAndKillOpponent(piece);
            }
            resetTurn();
        } else {
            console.error(`Target cell ${targetCellId} not found.`);
            showMessage("Error: Target cell not found.");
            deselectPiece();
        }
    }
}


/**
 * Checks if the moved piece has landed on an opponent's piece and kills it.
 * @param {HTMLElement} movedPiece - The piece that just moved.
 */
function checkAndKillOpponent(movedPiece) {
    const currentCell = movedPiece.parentNode;
    const movedPiecePlayer = movedPiece.dataset.player;

    // Don't kill if on a safe cell
    if (currentCell.classList.contains('safe-cell')) {
        return;
    }

    const piecesOnCell = Array.from(currentCell.querySelectorAll('.piece'));

    piecesOnCell.forEach(piece => {
        if (piece !== movedPiece && piece.dataset.player !== movedPiecePlayer) {
            // This is an opponent's piece, kill it!
            const opponentPlayer = players[piece.dataset.player];
            const pieceId = piece.dataset.pieceId;
            const pieceNumber = parseInt(pieceId.split('-')[1]);

            // Move piece back to its home circle
            const homeCircle = document.getElementById(opponentPlayer.homeCircles[pieceNumber - 1]);
            if (homeCircle) {
                homeCircle.appendChild(piece);
                piece.dataset.position = 'home';
                piece.dataset.pathIndex = -1;
                showMessage(`${movedPiecePlayer.toUpperCase()} killed ${piece.dataset.player.toUpperCase()}'s piece!`);
            } else {
                console.error(`Home circle for killed piece ${pieceId} not found.`);
            }
        }
    });
}

/**
 * Checks if the current player has won the game.
 */
function checkWinCondition() {
    const currentPlayer = players[currentTurn];
    const finishedPieces = currentPlayer.pieces.filter(p => p.dataset.position === 'finished');
    if (finishedPieces.length === 4) {
        showMessage(`${currentTurn.toUpperCase()} wins the game! Congratulations!`);
        dice.style.pointerEvents = 'none'; // Disable dice
        gameStarted = false; // End game
    }
}

/**
 * Resets the turn after a piece has been moved or no valid moves exist.
 */
function resetTurn() {
    deselectPiece(); // Deselect any active piece
    dice.style.pointerEvents = 'auto'; // Enable dice for next roll
    if (diceValue !== 6) { // If not a 6, switch turn
        nextTurn();
    } else {
        // showMessage(`${currentTurn.toUpperCase()} rolled a 6! Roll again!`);
    }
    diceValue = 0; // Reset dice value
}

/**
 * Deselects the currently selected piece.
 */
function deselectPiece() {
    if (selectedPiece) {
        selectedPiece.classList.remove('selected');
        selectedPiece = null;
    }
    // Remove highlighting from all pieces
    document.querySelectorAll('.piece.selected').forEach(p => p.classList.remove('selected'));
}

/**
 * Switches to the next player's turn.
 */
function nextTurn() {
    const playerColors = ['red', 'yellow', 'blue', 'green'];
    
    const currentIndex = playerColors.indexOf(currentTurn);
    console.log(currentTurn, (currentIndex + 1) % playerColors.length);
    currentTurn = playerColors[(currentIndex + 1) % playerColors.length];
    // currentPlayerDisplay.textContent = currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1);
    currentPlayerDisplay.textContent = currentTurn;
    currentPlayerDisplay.className = ''; // Clear previous color class
    currentPlayerDisplay.classList.add(`${currentTurn}-turn`);
    // showMessage(`It's ${currentTurn.toUpperCase()}'s turn!`);
}

// Event Listeners
dice.addEventListener('click', rollDice);

// Initial setup on window load
window.onload = function() {
    initializeBoard();
    createPieces();
    nextTurn(); // Set initial player display
    gameStarted = true;
    // showMessage("Welcome to Ludo! Red player starts. Roll the dice!");

    // console.log(document.getElementById("cell-8-6"));
};