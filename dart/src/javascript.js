NUM_SQUARES = 4;
NUM_TYPES = 7;
NUM_IMAGES = 8;
MAX_LEVEL = 10;
ROWS_PER_LEVEL = 5;
BOARD_HEIGHT = 16;
BOARD_WIDTH = 10;
SLOWEST_SPEED = 700;
FASTEST_SPEED = 60;

curLevel = 1;
curX = 1;
curY = 1;
skyline = BOARD_HEIGHT - 1;
boardDrawn = false;
gamePaused = false;
gameStarted = false;
sayingBye = false;
timerId = null;
numLines = 0;
speed = SLOWEST_SPEED - FASTEST_SPEED * curLevel;
squareImages = new Array();
board = new Array();

xToErase = new Array(0, 0, 0, 0);
yToErase = new Array(0, 0, 0, 0);
dx = new Array(0, 0, 0, 0);
dy = new Array(0, 0, 0, 0);
dx_ = new Array(0, 0, 0, 0);
dy_ = new Array(0, 0, 0, 0);
dxBank = new Array();
dyBank = new Array();
dxBank[1] = new Array(0, 1, -1, 0);
dyBank[1] = new Array(0, 0, 0, 1);
dxBank[2] = new Array(0, 1, -1, -1);
dyBank[2] = new Array(0, 0, 0, 1);
dxBank[3] = new Array(0, 1, -1, 1);
dyBank[3] = new Array(0, 0, 0, 1);
dxBank[4] = new Array(0, -1, 1, 0);
dyBank[4] = new Array(0, 0, 1, 1);
dxBank[5] = new Array(0, 1, -1, 0);
dyBank[5] = new Array(0, 0, 1, 1);
dxBank[6] = new Array(0, 1, -1, -2);
dyBank[6] = new Array(0, 0, 0, 0);
dxBank[7] = new Array(0, 1, 1, 0);
dyBank[7] = new Array(0, 0, 1, 1);

function drawBoard() {
  var buf = '<pre class=board>';
  for (var i = 0; i < BOARD_HEIGHT; i++) {
    buf += '<div>';
    for (var j = 0; j < BOARD_WIDTH; j++) {
      buf += '<img name="s' + i + '_' + j + '" src="images/s' + Math.abs(board[i][j]) + '.png" width=16 height=16>';
    }
    buf += '<img src="images/g.png" width=1 height=16>';
    buf += '</div>';
  }
  buf += '<div><img src="images/g.png" width=' + (BOARD_WIDTH * 16 + 1) + ' height=1 valign=top></div>';
  buf += '</pre>';
  document.getElementById("board-div").innerHTML = buf;
  boardDrawn = true;
}

function resetGame() {
  for (var i = 0; i < BOARD_HEIGHT; i++) {
    for (var j = 0; j < BOARD_WIDTH; j++) {
      board[i][j] = 0;
      document['s' + i + '_' + j].src = 'images/s0.png';
    }
  }
  gameStarted = false;
  gamePaused = false;
  numLines = 0;
  skyline = BOARD_HEIGHT - 1;
  document.gameForm.numLines.value = numLines;
}

function start() {
  if (sayingBye) {
    history.back();
    sayingBye = false;
  }
  if (gameStarted) {
    if (!boardDrawn) {
      return;
    }
    if (gamePaused) {
      resume();
    }
    return;
  }
  getPiece();
  drawPiece();
  gameStarted = true;
  gamePaused = false;
  document.gameForm.numLines.value = numLines;
  timerId = setTimeout(play, speed);
}

function pause() {
  if (boardDrawn && gameStarted) {
    if (gamePaused) {
      resume();
      return;
    }
    clearTimeout(timerId)
    gamePaused = true;
  }
}

function resume() {
  if (boardDrawn && gameStarted && gamePaused) {
    play();
    gamePaused = false;
  }
}

function play() {
  if (moveDown()) {
    timerId = setTimeout(play, speed);
    return;
  } else {
    fillMatrix();
    removeLines();
    if (skyline > 0 && getPiece()) {
      timerId = setTimeout(play, speed);
      return;
    } else {
      isActiveLeft = false;
      isActiveUp = false;
      isActiveRight = false;
      isActiveDown = false;
      alert('Game over!');
      resetGame();
    }
  }
}

function fillMatrix() {
  for (var k = 0; k < NUM_SQUARES; k++) {
    X = curX + dx[k];
    Y = curY + dy[k];
    if (0 <= Y && Y < BOARD_HEIGHT && 0 <= X && X < BOARD_WIDTH) {
      board[Y][X] = curPiece;
      if (Y < skyline) {
        skyline = Y;
      }
    }
  }
}

function removeLines() {
  for (var i = 0; i < BOARD_HEIGHT; i++) {
    gapFound = false;
    for (var j = 0; j < BOARD_WIDTH; j++) {
      if (board[i][j] == 0) {
        gapFound = true;
        break;
      }
    }
    if (gapFound) {
      continue;
    }
    for (var k = i; k >= skyline; k--) {
      for (var j = 0; j < BOARD_WIDTH; j++) {
        board[k][j] = board[k - 1][j];
        document['s' + k + '_' + j].src = squareImages[board[k][j]].src;
      }
    }
    for (var j = 0; j < BOARD_WIDTH; j++) {
      board[0][j] = 0;
      document['s0' + '_' + j].src = squareImages[0].src;
    }
    numLines++;
    skyline++;
    document.gameForm.numLines.value = numLines;
    if (numLines % ROWS_PER_LEVEL == 0) {
      if (curLevel < MAX_LEVEL) {
        curLevel++;
      }
    }
    speed = SLOWEST_SPEED - FASTEST_SPEED * curLevel;
    document.gameForm.levelSelector.selectedIndex = curLevel - 1;
  }
}

function getLevel() {
  curLevel = parseInt(document.gameForm.levelSelector.options[document.gameForm.levelSelector.selectedIndex].value);
  speed = SLOWEST_SPEED - FASTEST_SPEED * curLevel;
}

function drawPiece() {
  if (boardDrawn) {
    for (var k = 0; k < NUM_SQUARES; k++) {
      X = curX + dx[k];
      Y = curY + dy[k];
      if (0 <= Y && Y < BOARD_HEIGHT && 0 <= X && X < BOARD_WIDTH && board[Y][X] != -curPiece) {
        document['s' + Y + '_' + X].src = squareImages[curPiece].src;
        board[Y][X] = -curPiece;
      }
      X = xToErase[k];
      Y = yToErase[k];
      if (board[Y][X] == 0) {
        document['s' + Y + '_' + X].src = squareImages[0].src;
      }
    }
  }
}

function erasePiece() {
  if (boardDrawn) {
    for (var k = 0; k < NUM_SQUARES; k++) {
      X = curX + dx[k];
      Y = curY + dy[k];
      if (0 <= Y && Y < BOARD_HEIGHT && 0 <= X && X < BOARD_WIDTH) {
        xToErase[k] = X;
        yToErase[k] = Y;
        board[Y][X] = 0;
      }
    }
  }
}

function pieceFits(x, y) {
  for (var k = 0; k < NUM_SQUARES; k++) {
    theX = x + dx_[k];
    theY = y + dy_[k];
    if (theX < 0 || theX >= BOARD_WIDTH || theY >= BOARD_HEIGHT) {
      return 0;
    }
    if (theY > -1 && board[theY][theX] > 0) {
      return 0;
    }
  }
  return 1;
}

function moveLeft() {
  for (var k = 0; k < NUM_SQUARES; k++) {
    dx_[k] = dx[k];
    dy_[k] = dy[k];
  }
  if (pieceFits(curX - 1, curY)) {
    erasePiece();
    curX--;
    drawPiece();
  }
}

function moveRight() {
  for (var k = 0; k < NUM_SQUARES; k++) {
    dx_[k] = dx[k];
    dy_[k] = dy[k];
  }
  if (pieceFits(curX + 1, curY)) {
    erasePiece();
    curX++;
    drawPiece();
  }
}

function rotate() {
  for (var k = 0; k < NUM_SQUARES; k++) {
    dx_[k] = dy[k];
    dy_[k] = -dx[k];
  }
  if (pieceFits(curX, curY)) {
    erasePiece();
    for (var k = 0; k < NUM_SQUARES; k++) {
      dx[k] = dx_[k];
      dy[k] = dy_[k];
    }
    drawPiece();
  }
}

function moveDown() {
  for (var k = 0; k < NUM_SQUARES; k++) {
    dx_[k] = dx[k];
    dy_[k] = dy[k];
  }
  if (pieceFits(curX, curY + 1)) {
    erasePiece();
    curY++;
    drawPiece();
    return 1;
  }
  return 0;
}

function fall() {
  for (var k = 0; k < NUM_SQUARES; k++) {
    dx_[k] = dx[k];
    dy_[k] = dy[k];
  }
  if (!pieceFits(curX, curY + 1)) {
    return;
  }
  clearTimeout(timerId);
  erasePiece();
  while (pieceFits(curX, curY + 1)) {
    curY++;
  }
  drawPiece();
  timerId = setTimeout(play, speed);
}

function getPiece() {
  curPiece = 1 + Math.floor(NUM_TYPES * Math.random());
  curX = 5;
  curY = 0;
  for (var k = 0; k < NUM_SQUARES; k++) {
    dx[k] = dxBank[curPiece][k];
    dy[k] = dyBank[curPiece][k];
  }
  for (var k = 0; k < NUM_SQUARES; k++) {
    dx_[k] = dx[k];
    dy_[k] = dy[k];
  }
  if (pieceFits(curX, curY)) {
    drawPiece();
    return 1;
  }
  return 0;
}

// Keystroke processing

INITIAL_DELAY = 200;
REPEAT_DELAY = 20;

// These are for Netscape.

LEFT_NN = ' 52 ';
RIGHT_NN = ' 54 ';
UP_NN = ' 56 53 ';
DOWN_NN = ' 50 ';
SPACE_NN = ' 32 ';

// These are for Internet Explorer.

LEFT_IE = ' 37 52 100 ';
RIGHT_IE = ' 39 54 102 ';
UP_IE = ' 38 56 53 104 101 ';
DOWN_IE = ' 40 50 98 ';
SPACE_IE = ' 32 ';

isActiveLeft = false;
timerLeft = null;
isActiveRight = false;
timerRight = null;
isActiveUp = false;
timerUp = null;
isActiveDown = false;
timerDown = null;
isActiveSpace = false;
timerSpace = null;

function keyDown(e) {
  var evt = e ? e : event;
  var keyNN = ' ' + evt.keyCode + ' ';
  var keyIE = ' ' + evt.keyCode + ' ';

  // Return false if we can handle the keypress and true otherwise.  If we
  // capture all key presses, we break things like using ^r to reload the page.

  if (!gameStarted || !boardDrawn || gamePaused) {
    return true;
  }

  if (LEFT_NN.indexOf(keyNN) != -1 || LEFT_IE.indexOf(keyIE) != -1) {
    if (!isActiveLeft) {
      isActiveLeft = true;
      isActiveRight = false;
      moveLeft();
      timerLeft = setTimeout(slideLeft, INITIAL_DELAY);
    }
  } else if (RIGHT_NN.indexOf(keyNN) != -1 || RIGHT_IE.indexOf(keyIE) != -1) {
    if (!isActiveRight) {
      isActiveRight = true;
      isActiveLeft = false;
      moveRight();
      timerRight = setTimeout(slideRight, INITIAL_DELAY);
    }
  } else if (UP_NN.indexOf(keyNN) != -1 || UP_IE.indexOf(keyIE) != -1) {
    if (!isActiveUp) {
      isActiveUp = true;
      isActiveDown = false;
      rotate();
    }
  } else if (SPACE_NN.indexOf(keyNN) != -1 || SPACE_IE.indexOf(keyIE) != -1) {
    if (!isActiveSpace) {
      isActiveSpace = true;
      isActiveDown = false;
      fall();
    }
  } else if (DOWN_NN.indexOf(keyNN) != -1 || DOWN_IE.indexOf(keyIE) != -1) {
    if (!isActiveDown) {
      isActiveDown = true;
      isActiveUp = false;
      moveDown();
      timerDown = setTimeout(slideDown, INITIAL_DELAY);
    }
  } else {
    return true;
  }
  return false;
}

function keyUp(e) {
  var evt = e ? e : event;
  var keyNN = ' ' + evt.keyCode + ' ';
  var keyIE = ' ' + evt.keyCode + ' ';

  // Return false if we can handle the keypress and true otherwise.  If we
  // capture all key presses, we break things like using ^r to reload the page.

  if (LEFT_NN.indexOf(keyNN) != -1 || LEFT_IE.indexOf(keyIE) != -1) {
    isActiveLeft = false;
    clearTimeout(timerLeft);
  } else if (RIGHT_NN.indexOf(keyNN) != -1 || RIGHT_IE.indexOf(keyIE) != -1) {
    isActiveRight = false;
    clearTimeout(timerRight);
  } else if (UP_NN.indexOf(keyNN) != -1 || UP_IE.indexOf(keyIE) != -1) {
    isActiveUp = false;
    clearTimeout(timerUp);
  } else if (DOWN_NN.indexOf(keyNN) != -1 || DOWN_IE.indexOf(keyIE) != -1) {
    isActiveDown = false;
    clearTimeout(timerDown);
  } else if (SPACE_NN.indexOf(keyNN) != -1 || SPACE_IE.indexOf(keyIE) != -1) {
    isActiveSpace = false;
    clearTimeout(timerSpace);
  } else {
    return true;
  }
  return false;
}

function slideLeft() {
  if (isActiveLeft) {
    moveLeft();
    timerLeft = setTimeout(slideLeft, REPEAT_DELAY);
  }
}

function slideRight() {
  if (isActiveRight) {
    moveRight();
    timerRight = setTimeout(slideRight, REPEAT_DELAY);
  }
}

function slideDown() {
  if (isActiveDown) {
    moveDown();
    timerDown = setTimeout(slideDown, REPEAT_DELAY);
  }
}

function init() {
  for (var i = 0; i < NUM_IMAGES; i++) {
    squareImages[i] = new Image();
    squareImages[i].src = 'images/s' + i + '.png';
  }

  for (var i = 0; i < BOARD_HEIGHT; i++) {
    board[i] = new Array();
    for (var j = 0; j < BOARD_WIDTH; j++) {
      board[i][j] = 0;
    }
  }

  document.onkeydown = keyDown;
  document.onkeyup = keyUp;

  drawBoard();
  resetGame();
}