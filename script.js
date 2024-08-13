const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

const nextShapeCanvas = document.getElementById('nextShapeCanvas');
const nextShapeContext = nextShapeCanvas.getContext('2d');

const pauseLabel = document.getElementById('pauseLabel');
pauseLabel.style.display = 'none';
const gameOverLabel = document.getElementById('gameOverLabel');
gameOverLabel.style.display = 'none';

const scoreLabel = document.getElementById('scoreLabel');

// Game constants
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 32;

const SCORE_PER_LINES = [100, 300, 500, 800]; // Score for lines in a row
const LINES_PER_LEVEL = 10;
const MAX_LEVEL = 5;

const INTERVAL_PER_LEVEL = [500, 400, 300, 200, 100];

// Tetriminos
const tetriminos = 
	[
		{id:0, name:'I', turns:2, color:'cyan',
		 blocks:
			[
				[
				 [0, 1, 0, 0],
				 [0, 1, 0, 0],
				 [0, 1, 0, 0],
				 [0, 1, 0, 0]],
				[[1, 1, 1, 1],
				 [0, 0, 0, 0],
				 [0, 0, 0, 0],
				 [0, 0, 0, 0]]

			]
		},
		{id:1, name:'O', turns:1, color:'yellow',
		 blocks:
			[
				[[1, 1],
				 [1, 1]]
			]
		},
		{id:2, name:'T', turns:4, color:'purple',
		 blocks:
			[
				[[0, 0, 0],
				 [1, 1, 1],
				 [0, 1, 0]],
				[[0, 1, 0],
				 [1, 1, 0],
				 [0, 1, 0]],
				[[0, 1, 0],
				 [1, 1, 1],
				 [0, 0, 0]],
				[[0, 1, 0],
				 [0, 1, 1],
				 [0, 1, 0]]
			]
		},
		{id:3, name:'L', turns:4, color:'orange',
		 blocks:
			[
				[[0, 0, 1],
				 [1, 1, 1],
				 [0, 0, 0]],
				[[0, 1, 0],
				 [0, 1, 0],
				 [0, 1, 1]],
				[[0, 0, 0],
				 [1, 1, 1],
				 [1, 0, 0]],
				[[1, 1, 0],
				 [0, 1, 0],
				 [0, 1, 0]]
			]
		},
		{id:4, name:'J', turns:4, color:'blue',
		 blocks:
			[
				[[1, 0, 0],
				 [1, 1, 1],
				 [0, 0, 0]],
				[[0, 1, 1],
				 [0, 1, 0],
				 [0, 1, 0]],
				[[0, 0, 0],
				 [1, 1, 1],
				 [0, 0, 1]],
				[[0, 1, 0],
				 [0, 1, 0],
				 [1, 1, 0]]
			]
		},
		{id:5, name:'S', turns:2, color:'green',
		 blocks:
			[
				[[0, 1, 1],
				 [1, 1, 0],
				 [0, 0, 0]],
				[[0, 1, 0],
				 [0, 1, 1],
				 [0, 0, 1]]
			]
		},
		{id:6, name:'Z', turns:2, color:'red',
		 blocks:
			[
				[[1, 1, 0],
				 [0, 1, 1],
				 [0, 0, 0]],
				[[0, 0, 1],
				 [0, 1, 1],
				 [0, 1, 0]]
			]
		}
	]

// global vars
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(undefined));
let positionX = 4;
let positionY = 0;
let currentTetrimino = 0;
let nextTetrimino = Math.floor(Math.random() * (tetriminos.length));
let rotation = 0;
let paused = false;
let score = 0;
let level = 1;
let linesToNextLevel = LINES_PER_LEVEL;
let gameOver = false;

let intervalId = setInterval(onTimerEvent, INTERVAL_PER_LEVEL[0]);

function putShape(clear = false) {
	color = clear ? undefined : tetriminos[currentTetrimino].color;
	for (let i = 0; i < tetriminos[currentTetrimino].blocks[rotation].length; i++) {
		for (let j = 0; j < tetriminos[currentTetrimino].blocks[rotation][i].length; j++) {
			if (tetriminos[currentTetrimino].blocks[rotation][i][j] == 1) {
				board[positionY + i][positionX + j] = color;
			}
		}
	}
}

function clearShape() {
	putShape(true); // clear=true
}

function drawNextShape() {
    nextShapeContext.clearRect(0, 0, nextShapeCanvas.width, nextShapeCanvas.height);
	shape = tetriminos[nextTetrimino].blocks[0]; // always show the first rotation
	color = tetriminos[nextTetrimino].color;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                nextShapeContext.fillStyle = color;
                nextShapeContext.fillRect((col + 2) * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                nextShapeContext.strokeRect((col + 2) * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                context.fillStyle = board[row][col];
                context.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                context.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

function checkCollission(tetrimino, posY, posX) {
    for (let y = 0; y < tetrimino.length; y++) {
        for (let x = 0; x < tetrimino[y].length; x++) {
            if (tetrimino[y][x] !== 0) { // Check only filled cells of the Tetrimino
                let newX = posX + x;
                let newY = posY + y;
                // Check board boundaries
                if (newX < 0 || newX >= board[0].length || newY >= board.length) {
                    return true; // Collision with wall or floor
                }
                // Check if the cell is already occupied
                if (board[newY] && board[newY][newX] != undefined) {
                    return true; // Collision with another piece
                }
            }
        }
    }
    return false; // No collision
}

document.addEventListener('keydown', function(event) {
	if (gameOver) return;
	let newPositionX, newPositionY;
   	clearShape();
	switch(event.key) {
        case 'ArrowLeft':
			newPositionX = positionX - 1;
			if (!checkCollission(tetriminos[currentTetrimino].blocks[rotation], positionY, newPositionX)) {
				positionX = newPositionX;
			}
            break;
        case 'ArrowRight':
			newPositionX = positionX + 1;
			if (!checkCollission(tetriminos[currentTetrimino].blocks[rotation], positionY, newPositionX)) {
				positionX = newPositionX;
			}
            break;
        case 'ArrowDown':
			newPositionY = positionY + 1;
			if (!checkCollission(tetriminos[currentTetrimino].blocks[rotation], newPositionY, positionX)) {
				positionY = newPositionY;
			}
            break;
        case 'ArrowUp':
		case 'Insert':
		case ' ':		
			newRotation = rotation + 1;
			if (newRotation == tetriminos[currentTetrimino].turns)
				newRotation = 0;
			if (!checkCollission(tetriminos[currentTetrimino].blocks[newRotation], positionY, positionX)) 
				rotation = newRotation;
			break;
		case 'p':
			if (!paused) {
				clearInterval(intervalId);
				pauseLabel.style.display = 'block';
				paused = true;
			} else {
				intervalId = setInterval(onTimerEvent, INTERVAL_PER_LEVEL[level-1]);
			    pauseLabel.style.display = 'none';
				paused = false;
			}
    }
	putShape();	
    drawBoard(); // Redraw block in new position
});

function setNewShape() {
	positionX = 4;
	positionY = 0;
	currentTetrimino = nextTetrimino;
	nextTetrimino = Math.floor(Math.random() * (tetriminos.length));
	rotation = 0;
	drawNextShape();
}

function updateScore(score, level) {
	scoreLabel.innerHTML = '<b>Score</b><br>' + score +'<br><br><b>Level</b><br>' + level + '</div>';
}

function checkLine() {
	clearInterval(intervalId);
	let linesCleared = 0;
    for (let row = 0; row < ROWS; row++) {
		let completeRow = true;
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] == undefined) {
				completeRow = false;
            }
        }
		if (completeRow) {
			++linesCleared;
			--linesToNextLevel;
			console.log("linesClear="+linesCleared+" linesToNextLevel="+linesToNextLevel);
			if (linesToNextLevel == 0) {
				if (level == MAX_LEVEL) {
					gameOver = true;
					clearInterval(intervalId);
					gameOverLabel.textContent = 'VICTORY!';
					gameOverLabel.style.display = 'block';
					return;
				}
				linesToNextLevel = LINES_PER_LEVEL;
				++level;
			}
			console.log("  level=" + level + " interval="+INTERVAL_PER_LEVEL[level-1]);
			board.splice(row, 1);
            board.unshift(Array(COLS).fill(undefined));
		}
    }
	if (linesCleared > 0) { // Can't be more than 4
		score += level * SCORE_PER_LINES[linesCleared - 1];
		updateScore(score, level);
	}
	intervalId = setInterval(onTimerEvent, INTERVAL_PER_LEVEL[level-1]);
}

function onTimerEvent() {
	clearShape();
	let newPositionY = positionY + 1;
	if (checkCollission(tetriminos[currentTetrimino].blocks[rotation], newPositionY, positionX)) {
		putShape();
		checkLine();
		setNewShape();
		if (checkCollission(tetriminos[currentTetrimino].blocks[rotation], positionY, positionX)) {
			gameOver = true;
			clearInterval(intervalId);
			gameOverLabel.style.display = 'block';
		}
		putShape();
	} else {
		positionY = newPositionY;
		putShape();	
	}
    drawBoard();
}

function gameLoop() {
    drawBoard();
    requestAnimationFrame(gameLoop);
}

setNewShape();
putShape();
gameLoop();
