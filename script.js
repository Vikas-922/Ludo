// Game state variables
const board = document.getElementById('ludo-board');
const dice = document.getElementById('dice');
const currentPlayerDisplay = document.getElementById('current-player-color');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const messageButton = document.getElementById('message-button');
const diceImg = document.getElementById('diceImg');

// Define player colors and their starting/path/home positions
const players = {
    'red': {
        color: 'red',
        startCell: 'cell-7-2', // Red's actual start cell (index 0 in path)
        homePathTurn: 'cell-8-1', // Start of red's home path
        pieces: [], // Array to hold piece elements
        homeCircles: ['home-red-1', 'home-red-2', 'home-red-3', 'home-red-4'],
        pathOffset: 0, // Offset for red's path in the common path array
        finishCell: 'cell-8-7' // Center finish cell
    },
    'green': {
        color: 'green',
        startCell: 'cell-2-9', // Green's actual start cell
        homePathTurn: 'cell-1-8', // Start of green's home path
        pieces: [],
        homeCircles: ['home-green-1', 'home-green-2', 'home-green-3', 'home-green-4'],
        pathOffset: 13, // Offset for green's path
        finishCell: 'cell-7-8'
    },
    'yellow': {
        color: 'yellow',
        startCell: 'cell-14-7', // Yellow's actual start cell
        homePathTurn: 'cell-15-8', // Start of yellow's home path
        pieces: [],
        homeCircles: ['home-yellow-1', 'home-yellow-2', 'home-yellow-3', 'home-yellow-4'],
        pathOffset: 26, // Offset for yellow's path
        finishCell: 'cell-9-8'
    },
    'blue': {
        color: 'blue',
        startCell: 'cell-9-14', // Blue's actual start cell
        homePathTurn: 'cell-8-15', // Start of blue's home path
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

const fullPaths = {};

function intializeFullpaths() {
    ['red', 'green', 'yellow', 'blue'].forEach(color => {
        let fullPath = [];

        let Idx = commonPath.indexOf(players[color].startCell);
        let pathCell;

        // Append common path from startCell to homePathTurn (with wrap-around)
        while (true) {
            pathCell = commonPath[Idx % commonPath.length];
            fullPath.push(pathCell);
            Idx++;

            if (pathCell === players[color].homePathTurn) break;
        }

        // Append home path cells
        fullPath = fullPath.concat(homePaths[color]);

        // Store in fullPaths
        fullPaths[color] = fullPath;
    });

    // console.log('Full Paths:', fullPaths);
}

intializeFullpaths();


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


function animateDiceRoll(diceElement, finalValue) {
    return new Promise((resolve) => {
        const blurFrames = [
            "images/dice_blur_1.svg",
            "images/dice_blur_2.svg",
            "images/dice_blur_3.svg"
        ];

        const getRandomBlurFrame = () =>
            blurFrames[Math.floor(Math.random() * blurFrames.length)];

        const getRandomDiceFrame = () => {
            const tempValue = Math.floor(Math.random() * 6) + 1;
            return `images/dice_${tempValue}.svg`;
        };

        let rollCount = 6;
        const interval = 80;

        let angle = 0;

        const animation = setInterval(() => {
            diceElement.src = rollCount % 2 === 0 ? getRandomBlurFrame() : getRandomDiceFrame();

            // Diagonal 3D-style rotation
            angle += 100; // You can increase or randomize this for more dynamic effect
            diceElement.style.transform = `rotate3d(1, 1, 0, ${angle}deg)`;
            diceElement.style.transition = "transform 0.08s linear";

            rollCount--;

            if (rollCount === 0) {
                clearInterval(animation);

                // Final face + reset rotation smoothly
                setTimeout(() => {
                    diceElement.src = `images/dice_${finalValue}.svg`;
                    diceElement.style.transform = "rotate3d(0, 0, 0, 0deg)";
                    diceElement.style.transition = "transform 0.3s ease";
                    resolve();
                }, 50);
            }
        }, interval);
     
    });
}


/**
 * Handles the dice roll event.
 */

const FACE_ROTATIONS = {
  1: { x:   0,  y:   0 },  // front
  2: { x:  90,  y:   0 },  // top
  3: { x:   0,  y: 270 },  // right
  4: { x:   0,  y:  90 },  // left
  5: { x: 270,  y:   0 },  // bottom
  6: { x:   0,  y: 180 }   // back
};

let currentX = 0;
let currentY = 0;

// (Optional) you can keep a getDiceValue() that just double-checks,
// but if you never accumulate “illegal” combos, it’ll always match FACE_ROTATIONS.
function getDiceValue(x, y) {
  const nx = ((x % 360) + 360) % 360;
  const ny = ((y % 360) + 360) % 360;

  if (nx === 0 && ny === 0)   return 1; // front
  if (nx === 90 && ny === 0)  return 2; // top
  if (nx === 0 && ny === 270) return 4; // right
  if (nx === 0 && ny === 90)  return 3; // left
  if (nx === 270 && ny === 0) return 5; // bottom
  if (nx === 0 && ny === 180) return 6; // back
  return 1; // fallback
}

async function diceRollAnimation() {
  const dice = document.getElementById('dice');

  // 1) Pick a random face 1–6:
  const faceNum = Math.floor(Math.random() * 6) + 1;
  const { x: baseX, y: baseY } = FACE_ROTATIONS[faceNum];

  // 2) Add 720° or 1080° spins purely for show (no matter what base is):
  const spinX = 360 * (2 + Math.floor(Math.random() * 2)); // 720 or 1080
  const spinY = 360 * (2 + Math.floor(Math.random() * 2)); // 720 or 1080

  // 3) Final orientation is spin + the “base” for that face:
  const finalX = spinX + baseX;
  const finalY = spinY + baseY;

  // 4) Animate all at once:
  dice.style.transition = 'transform 1.5s ease-out';
  dice.style.transform  = `rotateX(${finalX}deg) rotateY(${finalY}deg)`;

  // 5) Wait until it finishes (1.5 seconds):
  document.querySelector('.dice-area').classList.add('rolling');
  await new Promise(res => setTimeout(res, 1500));
  document.querySelector('.dice-area').classList.remove('rolling');
  
  // 6) Now we know exactly which face is on top:
  const value = getDiceValue(finalX, finalY);

  // 7) For the next roll, store only the “base” part, not the huge spin:
  currentX = baseX;
  currentY = baseY;

  return value;
}


let abc = [6,5,2,1]
async function rollDice() {
    if (selectedPiece) {
        showMessage("Please move your selected piece or deselect it.");
        return;
    }

    // diceValue = abc[Math.floor(Math.random() * 3) + 0];
    diceValue = await diceRollAnimation();    

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
    const piecesOnPath = currentPlayer.pieces.filter(p => p.dataset.position.includes('path'));
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
    if (playablePieces.length === 0) {
        dice.style.pointerEvents = 'auto';
        nextTurn();
    }else if (playablePieces.length === 1) {
        //click on the playable piece
        playablePieces[0].classList.add('selected');
        selectedPiece = playablePieces[0]; 
        movePiece(selectedPiece, diceValue); // Move it immediately
        playablePieces[0].classList.remove('selected');
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
  const color  = player.color;    // e.g. 'red'
  const pathArray = fullPaths[color];
  const finishIndex = pathArray.length - 1; 
  const COMMON_LENGTH = 51;

  // --- If the piece is still at "home"…
  if (piece.dataset.position === 'home') {
    if (steps === 6) {
      // Let it appear at index = 0 of fullPaths[color]:
      const startCell = document.getElementById(pathArray[0]);
      if (!startCell) {
        console.error(`Cannot find start cell ${pathArray[0]}`);
        showMessage(`Error: start cell not found.`);
        deselectPiece();
        return;
      }
      startCell.appendChild(piece);
      piece.dataset.position = 'path';
      piece.dataset.pathIndex = "0";
      checkAndKillOpponent(piece); // check if it lands on an opponent
      resetTurn();
    } else {
    //   showMessage("You need a 6 to move out of home.");
      deselectPiece();
    }
    return;
  }

  // --- Otherwise, it’s already on the “path” or inside the home‐run portion:
  let currentIndex = parseInt(piece.dataset.pathIndex, 10);
  if (isNaN(currentIndex)) currentIndex = -1;

  let newIndex = currentIndex + steps;

  // (1) Overshoot: if newIndex > finishIndex, invalid:
  if (newIndex > finishIndex) {
    showMessage("Cannot move: Overshot the finish. Try again.");
    // deselectPiece();
    return;
  }

  // (2) If newIndex === finishIndex, that piece has finished:
  if (newIndex === finishIndex) {
    const finishCell = document.getElementById(pathArray[finishIndex]);
    if (!finishCell) {
      console.error(`Cannot find finish cell ${pathArray[finishIndex]}`);
      showMessage("Error: finish cell not found.");
      deselectPiece();
      return;
    }
    finishCell.appendChild(piece);
    piece.dataset.position = 'finished';
    piece.dataset.pathIndex = finishIndex.toString();
    piece.style.position = 'relative';
    piece.style.left = 'unset';
    piece.style.top  = 'unset';
    showMessage(`${color.toUpperCase()} piece finished!`);
    checkWinCondition();
    resetTurn();
    return;
  }

  // (3) Normal move: land on pathArray[newIndex]:
  const targetCellId = pathArray[newIndex];
  const targetCell   = document.getElementById(targetCellId);
  if (!targetCell) {
    console.error(`Cannot find target cell ${targetCellId}`);
    showMessage("Error: Target cell not found.");
    deselectPiece();
    return;
  }

  // Move the piece DOM‐node:
  targetCell.appendChild(piece);
  piece.dataset.position = (newIndex < COMMON_LENGTH ? 'path' : 'home-path');
  piece.dataset.pathIndex = newIndex.toString();

  // (4) If we landed in the “common” portion (i.e. newIndex < COMMON_LENGTH), try to kill:
  if (newIndex < COMMON_LENGTH) {
    checkAndKillOpponent(piece);
  }

  resetTurn();
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
                // showMessage(`${movedPiecePlayer.toUpperCase()} killed ${piece.dataset.player.toUpperCase()}'s piece!`);
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
};