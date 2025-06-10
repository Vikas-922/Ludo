// Persistent piece reaction system for Ludo game
// Each piece maintains an emotional state that reflects their current situation

// Emotional states with persistent reactions
const PIECE_EMOTIONS = {
    // Home states
    TRAPPED_AT_HOME: ['😤', '😒', '🙄', '😑', '😠', '😮‍💨'],
    EAGER_TO_START: ['😍', '🤩', '😋', '🥺', '👀', '🔥'],
    
    // Path states
    CONFIDENT: ['😎', '😏', '🕶️', '💪', '😈', '🔥'],
    HUNTING: ['👹', '👿', '😈', '👺', '🦈', '🎯'],
    VULNERABLE: ['😰', '😨', '👀', '🫣', '😬', '⚠️'],
    SCARED: ['😱', '😭', '🥺', '😰', '💀', '☠️'],
    SAFE_AND_HAPPY: ['😊', '😌', '🛡️', '😁', '🤗', '💚'],
    CAUTIOUS: ['🤔', '👀', '🕵️', '😐', '🔍', '⚡'],
    
    // Special states
    IN_DANGER_ZONE: ['😬', '⚠️', '😰', '🫨', '😵‍💫', '💥'],
    CHASING_OPPONENT: ['🏃‍♂️', '💨', '🎯', '⚡', '🔥', '😤'],
    BEING_CHASED: ['🏃‍♂️', '💨', '😱', '🫨', '😵', '💀'],
    ALMOST_HOME: ['🏁', '🎯', '✨', '🚀', '⭐', '🏆'],
    BLOCKING_ENEMY: ['🧱', '😏', '💪', '🛡️', '⚔️', '🔒'],
    
    // Victory states
    FINISHED: ['🏆', '👑', '🎉', '🥇', '🌟', '✨'],
    CLOSE_TO_WINNING: ['🔥', '😍', '🤩', '⚡', '🚀', '🎯'],
    
    // Momentary reactions (brief display)
    JUST_KILLED: ['😈', '💀', '🔥', '😎', '🎯', '💥'],
    JUST_GOT_KILLED: ['😭', '💔', '😵', '☠️', '😢', '💀'],
    ROLLED_SIX: ['🎲', '🔥', '😍', '🎊', '⚡', '🎉'],
    CANT_MOVE: ['😫', '🤷‍♂️', '😩', '😞', '🚫', '😤']
};

// Piece emotional state tracker
const pieceEmotionalStates = new Map();

// Initialize emotional state for a piece
function initializePieceEmotion(piece) {
    const pieceId = piece.dataset.pieceId;
    pieceEmotionalStates.set(pieceId, {
        currentEmotion: 'TRAPPED_AT_HOME',
        lastEmoji: '',
        emotionStartTime: Date.now(),
        temporaryReaction: null,
        temporaryReactionEnd: 0
    });
    updatePieceReaction(piece);
}

// Main function to update piece reactions based on game state
function updateAllPieceReactions() {
    const allPieces = document.querySelectorAll('.piece');
    allPieces.forEach(piece => {
        analyzePieceSituation(piece);
        updatePieceReaction(piece);
    });
}

// Analyze individual piece situation and determine emotion
function analyzePieceSituation(piece) {
    const pieceId = piece.dataset.pieceId;
    const position = piece.dataset.position;
    const pathIndex = parseInt(piece.dataset.pathIndex);
    const playerColor = piece.dataset.player;
    
    let newEmotion = 'CAUTIOUS'; // default
    
    // Get current emotional state
    let emotionalState = pieceEmotionalStates.get(pieceId);
    if (!emotionalState) {
        initializePieceEmotion(piece);
        emotionalState = pieceEmotionalStates.get(pieceId);
    }
    
    // Check for temporary reactions first
    if (emotionalState.temporaryReaction && Date.now() < emotionalState.temporaryReactionEnd) {
        return; // Keep temporary reaction
    } else if (emotionalState.temporaryReaction) {
        // Clear temporary reaction
        emotionalState.temporaryReaction = null;
    }
    
    // Determine persistent emotional state based on position
    if (position === 'home') {
        // Check if can move out (needs analysis of dice and turn)
        if (isPlayerTurn(playerColor)) {
            newEmotion = 'EAGER_TO_START';
        } else {
            newEmotion = 'TRAPPED_AT_HOME';
        }
    } else if (position === 'finished') {
        newEmotion = 'FINISHED';
    } else {
        // Piece is on the path - analyze situation
        newEmotion = analyzePieceOnPath(piece, pathIndex, playerColor);
    }
    
    // Update emotional state if changed
    if (emotionalState.currentEmotion !== newEmotion) {
        emotionalState.currentEmotion = newEmotion;
        emotionalState.emotionStartTime = Date.now();
    }
    
    pieceEmotionalStates.set(pieceId, emotionalState);
}

// Analyze piece situation when on path
function analyzePieceOnPath(piece, pathIndex, playerColor) {
    const fullPath = fullPaths[playerColor];
    const currentCell = piece.parentNode;
    
    // Check if close to finish
    if (pathIndex > fullPath.length - 10) {
        return 'ALMOST_HOME';
    }
    
    // Check if in home stretch
    if (pathIndex > 51) {
        return 'CLOSE_TO_WINNING';
    }
    
    // Check for immediate threats
    const threatsNearby = checkForThreats(piece, playerColor, pathIndex);
    const opponentsNearby = checkForOpponents(piece, playerColor, pathIndex);
    
    if (threatsNearby.length > 0) {
        if (threatsNearby.some(threat => threat.distance <= 6)) {
            return 'SCARED';
        } else {
            return 'VULNERABLE';
        }
    }
    
    // Check if can hunt opponents
    if (opponentsNearby.length > 0) {
        const huntableOpponents = opponentsNearby.filter(opp => 
            opp.distance <= 6 && !opp.piece.parentNode.classList.contains('safe-cell')
        );
        if (huntableOpponents.length > 0) {
            return 'HUNTING';
        }
    }
    
    // Check if on safe cell
    if (currentCell.classList.contains('safe-cell')) {
        return 'SAFE_AND_HAPPY';
    }
    
    // Check if blocking enemies
    const enemiesOnSameCell = Array.from(currentCell.querySelectorAll('.piece'))
        .filter(p => p.dataset.player !== playerColor);
    if (enemiesOnSameCell.length > 0) {
        return 'BLOCKING_ENEMY';
    }
    
    // Default confident state
    return 'CONFIDENT';
}

// Check for threats (enemy pieces that can reach this piece)
function checkForThreats(piece, playerColor, pathIndex) {
    const threats = [];
    const allPieces = document.querySelectorAll('.piece');
    const fullPath = fullPaths[playerColor];
    const pieceParent = piece.parentNode;
    
    if (pieceParent.classList.contains('safe-cell')) return threats; // Safe cell, no threats
    allPieces.forEach(enemyPiece => {
        // console.log("Enemy Piece:", enemyPiece, "isSafe", enemyPieceParent.classList.contains('safe-cell'));
        
        if (enemyPiece.dataset.player === playerColor) return; // Skip same color
        if (enemyPiece.dataset.position === 'home' || enemyPiece.dataset.position === 'finished') return;
        
        const enemyPathIndex = parseInt(enemyPiece.dataset.pathIndex);
        const enemyColor = enemyPiece.dataset.player;
        const enemyFullPath = fullPaths[enemyColor];
        
        // Calculate if enemy can reach this piece within 6 moves
        for (let moves = 1; moves <= 6; moves++) {
            const enemyNewIndex = enemyPathIndex + moves;
            if (enemyNewIndex < enemyFullPath.length) {
                const enemyTargetCell = enemyFullPath[enemyNewIndex];
                const myCurrentCell = fullPath[pathIndex];
                
                if (enemyTargetCell === myCurrentCell) {
                    threats.push({
                        piece: enemyPiece,
                        distance: moves
                    });
                    break;
                }
            }
        }
    });
    console.log("playerColor",playerColor,"threats:", threats);
    
    return threats;
}

// Check for opponents that this piece can potentially catch
function checkForOpponents(piece, playerColor, pathIndex) {
    const opponents = [];
    const allPieces = document.querySelectorAll('.piece');
    const fullPath = fullPaths[playerColor];
    
    allPieces.forEach(enemyPiece => {
        if (enemyPiece.dataset.player === playerColor) return;
        if (enemyPiece.dataset.position === 'home' || enemyPiece.dataset.position === 'finished') return;
        
        const enemyPathIndex = parseInt(enemyPiece.dataset.pathIndex);
        const enemyColor = enemyPiece.dataset.player;
        const enemyFullPath = fullPaths[enemyColor];
        const enemyCurrentCell = enemyFullPath[enemyPathIndex];
        
        // Check if this piece can reach the enemy within 6 moves
        for (let moves = 1; moves <= 6; moves++) {
            const myNewIndex = pathIndex + moves;
            if (myNewIndex < fullPath.length) {
                const myTargetCell = fullPath[myNewIndex];
                
                if (myTargetCell === enemyCurrentCell) {
                    opponents.push({
                        piece: enemyPiece,
                        distance: moves
                    });
                    break;
                }
            }
        }
    });
    
    return opponents;
}

// Update the visual reaction of a piece
function updatePieceReaction(piece) {
    const pieceId = piece.dataset.pieceId;
    const emotionalState = pieceEmotionalStates.get(pieceId);
    if (!emotionalState) return;
    
    const emojiSpan = piece.querySelector('.piece-emoji');
    if (!emojiSpan) return;
    
    // Use temporary reaction if active
    const currentEmotion = emotionalState.temporaryReaction || emotionalState.currentEmotion;
    const emotionEmojis = PIECE_EMOTIONS[currentEmotion] || ['😐'];
    
    // Rotate through emojis for variety (change every 3 seconds)
    const emotionDuration = Date.now() - emotionalState.emotionStartTime;
    const emojiIndex = Math.floor(emotionDuration / 3000) % emotionEmojis.length;
    const newEmoji = emotionEmojis[emojiIndex];
    
    // Only update if emoji changed to avoid constant DOM updates
    if (emotionalState.lastEmoji !== newEmoji) {
        emojiSpan.textContent = newEmoji;
        emojiSpan.style.display = 'block';
        emotionalState.lastEmoji = newEmoji;
        
        // Add appropriate styling
        applyEmotionalStyling(emojiSpan, currentEmotion);
        
        pieceEmotionalStates.set(pieceId, emotionalState);
    }
}

// Apply styling based on emotional state
function applyEmotionalStyling(emojiSpan, emotion) {
    // Reset styles
    emojiSpan.style.color = '';
    emojiSpan.style.textShadow = '';
    emojiSpan.style.filter = '';
    emojiSpan.style.animation = '';
    
    switch (emotion) {
        case 'HUNTING':
        case 'JUST_KILLED':
            emojiSpan.style.color = '#ff4444';
            emojiSpan.style.textShadow = '0 0 8px #ff4444';
            break;
            
        case 'SCARED':
        case 'JUST_GOT_KILLED':
        case 'VULNERABLE':
            emojiSpan.style.color = '#666';
            // emojiSpan.style.animation = 'shake 0.5s ease-in-out infinite';
            break;
            
        case 'SAFE_AND_HAPPY':
        case 'FINISHED':
            emojiSpan.style.color = '#44ff44';
            emojiSpan.style.textShadow = '0 0 6px #44ff44';
            break;
            
        case 'ALMOST_HOME':
        case 'CLOSE_TO_WINNING':
            emojiSpan.style.color = '#ffaa00';
            emojiSpan.style.textShadow = '0 0 8px #ffaa00';
            emojiSpan.style.animation = 'glow 1s ease-in-out infinite alternate';
            break;
            
        case 'ROLLED_SIX':
            emojiSpan.style.animation = 'bounce 0.5s ease-in-out 3';
            break;
    }
}

// Trigger temporary reaction (overrides persistent emotion briefly)
function triggerTemporaryReaction(piece, reactionType, duration = 3000) {
    const pieceId = piece.dataset.pieceId;
    const emotionalState = pieceEmotionalStates.get(pieceId);
    if (!emotionalState) return;
    
    emotionalState.temporaryReaction = reactionType;
    emotionalState.temporaryReactionEnd = Date.now() + duration;
    pieceEmotionalStates.set(pieceId, emotionalState);
    
    updatePieceReaction(piece);
}

// Helper function to check if it's a player's turn
function isPlayerTurn(playerColor) {
    return currentTurn === playerColor;
}

// Enhanced functions to integrate with the main game

// Call this when a piece kills another
function onPieceKill(killerPiece, killedPiece) {
    triggerTemporaryReaction(killerPiece, 'JUST_KILLED', 4000);
    triggerTemporaryReaction(killedPiece, 'JUST_GOT_KILLED', 4000);
    
    // Update all pieces reactions after kill
    setTimeout(() => {
        updateAllPieceReactions();
    }, 500);
}

// Call this when dice shows 6
function onRollSix(playerPieces) {
    playerPieces.forEach(piece => {
        if (piece.dataset.position === 'home') {
            triggerTemporaryReaction(piece, 'ROLLED_SIX', 2000);
        }
    });
}

// Call this when a piece can't move
function onPieceCantMove(piece) {
    triggerTemporaryReaction(piece, 'CANT_MOVE', 2000);
}

// Initialize all pieces when game starts
function initializeAllPieceEmotions() {
    const allPieces = document.querySelectorAll('.piece');
    allPieces.forEach(piece => {
        initializePieceEmotion(piece);
    });
}

// Main update loop - call this periodically to refresh reactions
function updateReactionsLoop() {
    updateAllPieceReactions();
    
    // Schedule next update
    // setTimeout(updateReactionsLoop, 2000); // Update every 2 seconds
}

// CSS animations (add to your stylesheet)
const reactionStyles = `
@keyframes bounce {
    0%, 20%, 60%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    80% { transform: translateY(-5px); }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
}

@keyframes glow {
    from { text-shadow: 0 0 5px currentColor; }
    to { text-shadow: 0 0 15px currentColor, 0 0 20px currentColor; }
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

`;

// Add styles to document
function addReactionStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = reactionStyles;
    document.head.appendChild(styleSheet);
}

let currentTurn = "yellow"; // Example initial turn, should be set dynamically
function updateCurrentTurn(playerColor) {
    currentTurn = playerColor; // Refresh reactions on turn change
}

let fullPaths = null
function initializeVariables(paths) {
    // console.log("Paths:", paths);
    fullPaths = paths
}

// Export functions for integration with main game
export {
    initializeAllPieceEmotions,
    updateAllPieceReactions,
    updateReactionsLoop,
    onPieceKill,
    onRollSix,
    onPieceCantMove,
    triggerTemporaryReaction,
    addReactionStyles,
    updateCurrentTurn,
    initializeVariables
};