import {setSelectedPiece, diceValue, AI_DIFFICULTY, 
     fullPaths, players, selectedPiece, movePiece, pieceSize 
} from './computer.js';



const dice = document.getElementById('dice'); // Assuming dice is a global element

/**
 * Handles computer player move selection using AI strategy
 */
async function handleComputerMove(playablePieces,currentDifficulty) {
    if (playablePieces.length === 0) {
        return;
    }

    // console.log("Computer is thinking... playablePieces:", playablePieces);
    await new Promise(resolve => setTimeout(resolve, 400 + parseInt(Math.random() * 300)));
        
    let bestPiece; //
    
    switch(currentDifficulty) {
        case AI_DIFFICULTY.EASY:
            bestPiece = selectRandomMove(playablePieces);
            break;
        case AI_DIFFICULTY.MEDIUM:
            bestPiece = selectMediumMove(playablePieces);
            break;
        case AI_DIFFICULTY.HARD:
            bestPiece = selectBestMove(playablePieces);
            break;
        default:
            bestPiece = selectBestMove(playablePieces);
    }
    
    // console.log("Computer thinking done, selecting piece...");

    // Highlight selected piece briefly
    bestPiece.classList.add('selected');
    setSelectedPiece(bestPiece);
    
    // Short delay to show selection
    // await new Promise(resolve => setTimeout(resolve, 500));
    
    await movePiece(selectedPiece, diceValue);
    bestPiece.classList.remove('selected');
}

/**
 * Easy AI: Random selection
 */
function selectRandomMove(playablePieces) {
    return playablePieces[Math.floor(Math.random() * playablePieces.length)];
}

/**
 * Medium AI: Basic strategy
 */
function selectMediumMove(playablePieces) {
    // Priority 1: Move pieces out of home if rolled 6
    if (diceValue === 6) {
        const homePieces = playablePieces.filter(p => p.dataset.position === 'home');
        if (homePieces.length > 0) {
            return homePieces[0];
        }
    }
    
    // Priority 2: Finish pieces that are close to home
    const finishablePieces = playablePieces.filter(piece => {
        const pathIndex = stringToInteger(piece.dataset.pathIndex);
        const color = piece.dataset.player;
        const pathArray = fullPaths[color];
        const finishIndex = pathArray.length - 1;
        return pathIndex + diceValue === finishIndex;
    });
    
    if (finishablePieces.length > 0) {
        return finishablePieces[0];
    }
    
    // Priority 3: Kill opponent pieces
    const killingMoves = findKillingMoves(playablePieces);
    if (killingMoves.length > 0) {
        return killingMoves[0];
    }
    
    // Default: Move furthest piece
    return selectFurthestPiece(playablePieces);
}

/**
 * Hard AI: Advanced strategy with multiple considerations
 */
function selectBestMove(playablePieces) {
    let bestMove = null;
    let bestScore = -Infinity;
    
    for (const piece of playablePieces) {
        const score = evaluateMoveScore(piece, diceValue);
        // console.log(" @@@ score ", piece.dataset.pieceId, ":", score);

        if (score > bestScore) {
            bestScore = score;
            bestMove = piece;
        }
    }
    // console.log("🤖🤖Score history:", scorehistory);
    scorehistory = {}; // Clear after evaluation

    return bestMove || playablePieces[0];
}

/**
 * Evaluates the score of a potential move for each piece
 * considering multiple factors like finishing, killing opponents, safety, and progress.
 */
const safeSquares = ["cell-14-7","cell-9-3","cell-7-2","cell-3-7",
        "cell-2-9", "cell-7-13", "cell-9-14", "cell-13-9"
    ]; 

function isPieceInSafeSquare(piece) {    
    const pathcell = piece.parentElement.id; // Assuming piece is inside a cell element
    const currentPosition = pathcell; // Get the current position of the piece
    // console.log("Checking if piece is in a safe square:", piece, "at position:", currentPosition);
    return safeSquares.includes(currentPosition);
}

function stringToInteger(value) {
    const rawInteger = parseInt(value);
    const integer = Number.isNaN(rawInteger) ? -1 : rawInteger; // Handle NaN case
    return integer;
}

let scorehistory = {}; /// i want an object to store the score history of each piece
function evaluateMoveScore(piece, steps) {
    scorehistory[piece.dataset.pieceId] = {};
    let score = 0;
    const color = piece.dataset.player;
    const pathArray = fullPaths[color];
    const currentIndex = stringToInteger(piece.dataset.pathIndex);
    const newIndex = currentIndex + steps;
    const finishIndex = pathArray.length - 1;
    
    // Priority 1: Finishing a piece (highest priority)
    if (newIndex === finishIndex) {
        return 1000;
    }
    
    // Priority 2: Moving out of home with a 6
    if (piece.dataset.position === 'home' && steps === 6) {
        score += 800;
        
        // Bonus if we can kill someone from start position
        // const startPosition = pathArray[0];
        // const opponentAtStart = getOpponentPiecesAtPosition(startPosition, color);
        // if (opponentAtStart.length > 0) {
        //     score += 200;
        // }
        return score;
    }
    
    // Can't move from home without 6
    if (piece.dataset.position === 'home') {
        return -1000;
    }
    
    // Priority 3: Killing opponent pieces
    const targetPosition = pathArray[newIndex];
    if (targetPosition && newIndex < 51) { // Only in common path
        const opponentsAtTarget = getOpponentPiecesAtPosition(targetPosition, color);
        if (opponentsAtTarget.length > 0) {
            score += 660;
            // Bonus for killing pieces closer to finish
            opponentsAtTarget.forEach(opponent => {
                const oppIndex = stringToInteger(opponent.dataset.pathIndex);
                score += oppIndex * 2; // More points for killing advanced pieces
            });

            scorehistory[piece.dataset.pieceId]["killing opponent pieces"] = score; // add to score history
        }
    }
    
    // Priority 4: Avoid being killed
    const safetyScore = evaluateSafety(piece, newIndex, color);
    score += safetyScore;
    scorehistory[piece.dataset.pieceId]["safetyScore"] = safetyScore; // add to score history

    // Penalty for moving out of a safe square
    // const currentPosition = pathArray[currentIndex];
    if (isPieceInSafeSquare(piece) && !safeSquares.includes(targetPosition)) {
        score -= 320; // Penalty for leaving a safe square
        scorehistory[piece.dataset.pieceId]["leaving safe square"] = -320; // add to score history
    }


    // Priority 5: Progress towards finish
    const progressScore = evaluateProgress(currentIndex, newIndex, finishIndex);
    score += progressScore;
    scorehistory[piece.dataset.pieceId]["progressScore"] = progressScore; // add to score history

    // Priority 6: relative bonus for reaching safe squares
    const positionScore = evaluatePosition(newIndex, color);
    score += positionScore;
    scorehistory[piece.dataset.pieceId]["score for reaching safe squares"] = positionScore; // add to score history

    // Priority 7: Blocking opponents
    // const blockingScore = evaluateBlocking(targetPosition, color);
    // score += blockingScore;
     
    return score;
}

/**
 * Evaluates safety of a position (avoid being killed)
 */
function evaluateSafety(piece, newIndex, color) {
    const safetyScore = {};
    const currentIndex = stringToInteger(piece.dataset.pathIndex);
    const pathArray = fullPaths[color];
    const targetPosition = pathArray[newIndex];
    const currentPosition = pathArray[currentIndex];
    
    if (!targetPosition || newIndex >= 51) {        
        safetyScore["target, safe in home"] = 200;
        safetyScore["targetposition"] = targetPosition;
        scorehistory[piece.dataset.pieceId]["evaluate safety"] = safetyScore; // add to score history
        return 200; // Safe in home stretch
    }
    
    // Check if position is a safe square
    if (safeSquares.includes(targetPosition)) {
        safetyScore["targetposition"] = targetPosition;
        safetyScore["target, safe square"] = 200;
        scorehistory[piece.dataset.pieceId]["evaluate safety"] = safetyScore; // add to score history
        return 200;
    }
    
    // Check threat from opponents
    let threatScore = 0;
    const allColors = ['red', 'yellow', 'blue', 'green'];
    
    for (const oppColor of allColors) {
        if (oppColor === color) continue; // Skip own color
        
        const oppPlayer = players[oppColor];
        if (!oppPlayer) continue;
        // console.log("👲",oppPlayer.pieces);

        for (const oppPiece of oppPlayer.pieces) {
            const oppIndex = stringToInteger(oppPiece.dataset.pathIndex);
            if (isNaN(oppIndex) || oppIndex < 0) continue;
            
            // Check if opponent can reach our target position in 1-6 moves
            const oppPath = fullPaths[oppColor];
            for (let dice = 1; dice <= 6; dice++) {
                const oppNewIndex = oppIndex + dice;
                if (oppNewIndex < oppPath.length && oppPath[oppNewIndex] === targetPosition) {
                    threatScore -= 300; // Penalty for being in danger at target position
                    safetyScore["target, threat from " + oppColor + " at " + targetPosition] = -300;
                    break;
                }
                if (oppNewIndex < oppPath.length && oppPath[oppNewIndex] === currentPosition && !isPieceInSafeSquare(piece)) {
                    threatScore += 340; // This piece is threatened at current position
                    safetyScore["current, threat from " + oppColor + " at " + currentPosition] = 340;
                }
            }
        }
    }
    scorehistory[piece.dataset.pieceId]["evaluate safety"] = safetyScore; // add to score history
    return threatScore;
}

/**
 * Evaluates progress towards finish
 */
function evaluateProgress(currentIndex, newIndex, finishIndex) {
    const progressRatio = newIndex / finishIndex;
    return Math.floor(progressRatio * 100);
}

/**
 * Evaluates strategic position value
 */
function evaluatePosition(index, color) {
    // Bonus for reaching certain strategic positions    
     const strategicPositions = {
        "red": {
            "cell-3-7": 20,  
            "cell-2-9": 30,  
            "cell-7-13": 40,  
            "cell-9-14": 50 ,
            "cell-13-9": 60, 
            "cell-14-7": 70, 
            "cell-9-3": 80,
        },
        "yellow": {
            "cell-9-3": 20,  
            "cell-7-2": 30,  
            "cell-3-7": 40,  
            "cell-2-9": 50 ,
            "cell-7-13": 60, 
            "cell-9-14": 70, 
            "cell-13-9": 80,
        },
        "blue": {
            "cell-13-9": 20,  
            "cell-14-7": 30,  
            "cell-9-3": 40,  
            "cell-7-2": 50 ,
            "cell-3-7": 60, 
            "cell-2-9": 70, 
            "cell-7-13": 80,
        },
        "green": {
            "cell-7-13": 20,  
            "cell-9-14": 30,  
            "cell-13-9": 40,  
            "cell-14-7": 50 ,
            "cell-9-3": 60, 
            "cell-7-2": 70, 
            "cell-3-7": 80,
        }
    };
    
    const pathArray = fullPaths[color];
    const position = pathArray[index];

    return strategicPositions[color][position] || 0;
}

/**
 * Evaluates blocking potential
 */
function evaluateBlocking(targetPosition, color) {
    if (!targetPosition) return 0;
    
    let blockingScore = 0;
    const allColors = ['red', 'yellow', 'blue', 'green'];
    
    // Check if we're blocking opponents from progressing
    for (const oppColor of allColors) {
        if (oppColor === color) continue;
        
        const oppPlayer = players[oppColor];
        if (!oppPlayer) continue;
        
        for (const oppPiece of oppPlayer.pieces) {
            const oppIndex = stringToInteger(oppPiece.dataset.pathIndex);
            if (isNaN(oppIndex) || oppIndex < 0) continue;
            
            const oppPath = fullPaths[oppColor];
            // Check if our target position blocks their path
            for (let futureIndex = oppIndex + 1; futureIndex <= oppIndex + 6; futureIndex++) {
                if (futureIndex < oppPath.length && oppPath[futureIndex] === targetPosition) {
                    blockingScore += 30;
                    break;
                }
            }
        }
    }
    
    return blockingScore;
}

/**
 * Finds pieces that can kill opponents
 */
function findKillingMoves(playablePieces) {
    const killingMoves = [];
    
    for (const piece of playablePieces) {
        const color = piece.dataset.player;
        const currentIndex = stringToInteger(piece.dataset.pathIndex);
        const newIndex = currentIndex + diceValue;
        const pathArray = fullPaths[color];
        
        if (piece.dataset.position === 'home' && diceValue === 6) {
            // Check start position for kills
            const startPosition = pathArray[0];
            const opponents = getOpponentPiecesAtPosition(startPosition, color);
            if (opponents.length > 0) {
                killingMoves.push(piece);
            }
        } else if (newIndex < 51 && newIndex < pathArray.length) {
            // Check target position for kills
            const targetPosition = pathArray[newIndex];
            const opponents = getOpponentPiecesAtPosition(targetPosition, color);
            if (opponents.length > 0) {
                killingMoves.push(piece);
            }
        }
    }
    
    return killingMoves;
}

/**
 * Gets opponent pieces at a specific position
 */
function getOpponentPiecesAtPosition(position, playerColor) {
    const cell = document.getElementById(position);
    if (!cell) return [];
    
    const pieces = Array.from(cell.querySelectorAll('.piece'));
    return pieces.filter(piece => piece.dataset.player !== playerColor);
}

/**
 * Selects the furthest advanced piece
 */
function selectFurthestPiece(playablePieces) {
    let furthestPiece = playablePieces[0];
    let maxIndex = -1;
    
    for (const piece of playablePieces) {
        const index = stringToInteger(piece.dataset.pathIndex);
        if (index > maxIndex) {
            maxIndex = index;
            furthestPiece = piece;
        }
    }
    
    return furthestPiece;
}



function restartAudio(audio, fromTime = 0) {
  audio.pause();
  audio.currentTime = fromTime;
  return audio.play();   // returns a Promise you can await if needed
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function animatePieceToCell(piece, targetCell, duration = 200) {
  dice.style.pointerEvents = 'none'; 
//   const startCell = piece.parentElement;
  const pieceRect = piece.getBoundingClientRect();
  const targetRect = targetCell.getBoundingClientRect();

  const dx = targetRect.left - pieceRect.left;
  const dy = targetRect.top - pieceRect.top;

  // Set position absolute (if not already)
  piece.style.position = 'absolute';
  piece.style.pointerEvents = 'none'; // Prevent click during animation
  piece.style.zIndex = 1000;
  piece.style.transition = `transform ${duration}ms ease`;

  piece.style.transform = `translate(${dx}px, ${dy}px)`;

  await new Promise(resolve => setTimeout(resolve, duration));

  // Reset transform and move DOM element
  piece.style.transition = 'none';
  piece.style.transform = 'none';
  piece.style.pointerEvents = '';
  piece.style.zIndex = '';

  targetCell.appendChild(piece);
//   piece.style.position = 'relative';
  piece.style.left = 'unset';
  piece.style.top = 'unset';

}



function arrangePiecesInCell(cell) {
  const pieces = cell.querySelectorAll('.piece'); // Make sure each piece has class="piece"
  const total = pieces.length;
  const radius = 8; // You can tweak this to control spacing

  if (total === 1) {
    pieces[0].style.left = 'unset';
    pieces[0].style.top = 'unset';
    pieces[0].style.transform = 'none';
    pieces[0].style.width = `${pieceSize}px`;
    pieces[0].style.height = `${pieceSize}px`;
    pieces[0].style.zIndex = 2;
    return;
  }

  let zIndex = 2; 
  pieces.forEach((p, index) => {
    const angle = (index / total) * (2 * Math.PI);
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;

    p.style.position = 'absolute';
    p.style.width = '20px'; 
    p.style.height = '20px';
    p.style.left = `calc(50% + ${offsetX}px)`;
    p.style.top = `calc(50% + ${offsetY}px)`;
    p.style.transform = 'translate(-50%, -50%)'; // Center the piece
    p.style.zIndex = zIndex++;
  });
}



async function animatePieceMovementToTargetIndex(piece,pathArray, fromIndex, toIndex) {
    const startCell = document.getElementById(pathArray[fromIndex]);
    const targetCell = document.getElementById(pathArray[toIndex]);
    dice.style.pointerEvents = 'none'; 
    for (let i = fromIndex + 1; i <= toIndex; i++) {
        const cellId = pathArray[i];
        const cell = document.getElementById(cellId);
        if (!cell) {
            console.error(`Cell ${cellId} not found during animation.`);
            showMessage("Error: Path animation failed.");
            return;
        }

        await animatePieceToCell(piece, cell); // Animate to next step
    }

    arrangePiecesInCell(startCell);
    arrangePiecesInCell(targetCell);
}


const homeRed = document.getElementsByClassName('home-red'); // Assuming this is the red home element
const homeBlue = document.getElementsByClassName('home-blue'); // Assuming this is the blue home element
const homeGreen = document.getElementsByClassName('home-green'); // Assuming this is the green home element
const homeYellow = document.getElementsByClassName('home-yellow'); // Assuming this is the yellow home element

// To start the heartbeat
function startHeartbeat(color) {
    if (color === 'blue') {
        homeBlue[0].classList.add('heartbeat');
    }
    else if (color === 'green') {
        homeGreen[0].classList.add('heartbeat');
    }
    else if (color === 'yellow') {
        homeYellow[0].classList.add('heartbeat');
    }
    else if (color === 'red') {
        homeRed[0].classList.add('heartbeat'); // Remove heartbeat from others
    }
}

// To stop the heartbeat
function stopHeartbeat(color) {
  if (color === 'blue') {
    homeBlue[0].classList.remove('heartbeat');
  }
  else if (color === 'green') {
    homeGreen[0].classList.remove('heartbeat');
  }
  else if (color === 'yellow') {
    homeYellow[0].classList.remove('heartbeat');
  }
  else if (color === 'red') {
    homeRed[0].classList.remove('heartbeat');
  }
}

const diceFaces = document.getElementsByClassName('face'); // Assuming dice faces have this class
function changeDiceColor(color) {
    for (let i = 0; i < diceFaces.length; i++) {
        diceFaces[i].classList.remove('red', 'green', 'yellow', 'blue');
        diceFaces[i].classList.add(color);
    }
}


function roundoff(size) {
    return Math.round(parseFloat(size));
}

export {handleComputerMove, 
    restartAudio,
    animatePieceToCell,
    arrangePiecesInCell,
    animatePieceMovementToTargetIndex,
    startHeartbeat,
    stopHeartbeat,
    changeDiceColor,
    sleep,
    roundoff
}
