/*jslint devel: true, browser: true, maxerr: 50, indent: 2 */

// game is a module.  The exported functions are listed at the bottom.
var game = (function () {
  'use strict';

  var NUM_SQUARES = 4,
    NUM_TYPES = 7,
    NUM_IMAGES = 8,
    MAX_LEVEL = 10,
    ROWS_PER_LEVEL = 5,
    BOARD_HEIGHT = 16,
    BOARD_WIDTH = 10,
    SLOWEST_SPEED = 700,
    FASTEST_SPEED = 60,

    curLevel = 1,
    curX = 1,
    curY = 1,
    curPiece,
    skyline = BOARD_HEIGHT - 1,
    boardDrawn = false,
    gamePaused = false,
    gameStarted = false,
    sayingBye = false,
    timerId = null,
    numLines = 0,
    speed = SLOWEST_SPEED - FASTEST_SPEED * curLevel,
    squareImages = [],
    board = [],

    xToErase = [0, 0, 0, 0],
    yToErase = [0, 0, 0, 0],
    dx = [0, 0, 0, 0],
    dy = [0, 0, 0, 0],
    dxPrime = [0, 0, 0, 0],
    dyPrime = [0, 0, 0, 0],
    dxBank = [],
    dyBank = [],

    // Keystroke processing

    INITIAL_DELAY = 200,
    REPEAT_DELAY = 20,

    // These are for Netscape.

    LEFT_NN = ' 52 ',
    RIGHT_NN = ' 54 ',
    UP_NN = ' 56 53 ',
    DOWN_NN = ' 50 ',
    SPACE_NN = ' 32 ',

    // These are for Internet Explorer.

    LEFT_IE = ' 37 52 100 ',
    RIGHT_IE = ' 39 54 102 ',
    UP_IE = ' 38 56 53 104 101 ',
    DOWN_IE = ' 40 50 98 ',
    SPACE_IE = ' 32 ',

    isActiveLeft = false,
    timerLeft = null,
    isActiveRight = false,
    timerRight = null,
    isActiveUp = false,
    timerUp = null,
    isActiveDown = false,
    timerDown = null,
    isActiveSpace = false,
    timerSpace = null;

  dxBank[1] = [0, 1, -1, 0];
  dyBank[1] = [0, 0, 0, 1];
  dxBank[2] = [0, 1, -1, -1];
  dyBank[2] = [0, 0, 0, 1];
  dxBank[3] = [0, 1, -1, 1];
  dyBank[3] = [0, 0, 0, 1];
  dxBank[4] = [0, -1, 1, 0];
  dyBank[4] = [0, 0, 1, 1];
  dxBank[5] = [0, 1, -1, 0];
  dyBank[5] = [0, 0, 1, 1];
  dxBank[6] = [0, 1, -1, -2];
  dyBank[6] = [0, 0, 0, 0];
  dxBank[7] = [0, 1, 1, 0];
  dyBank[7] = [0, 0, 1, 1];

  function drawBoard() {
    var i, j, buf;
    buf = '<pre class=board>';
    for (i = 0; i < BOARD_HEIGHT; i += 1) {
      buf += '<div>';
      for (j = 0; j < BOARD_WIDTH; j += 1) {
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
    var i, j;
    for (i = 0; i < BOARD_HEIGHT; i += 1) {
      for (j = 0; j < BOARD_WIDTH; j += 1) {
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

  function fillMatrix() {
    var k, x, y;
    for (k = 0; k < NUM_SQUARES; k += 1) {
      x = curX + dx[k];
      y = curY + dy[k];
      if (0 <= y && y < BOARD_HEIGHT && 0 <= x && x < BOARD_WIDTH) {
        board[y][x] = curPiece;
        if (y < skyline) {
          skyline = y;
        }
      }
    }
  }

  function removeLines() {
    var i, j, k, gapFound;
    for (i = 0; i < BOARD_HEIGHT; i += 1) {
      gapFound = false;
      for (j = 0; j < BOARD_WIDTH; j += 1) {
        if (board[i][j] === 0) {
          gapFound = true;
          break;
        }
      }
      if (!gapFound) {
        for (k = i; k >= skyline; k -= 1) {
          for (j = 0; j < BOARD_WIDTH; j += 1) {
            board[k][j] = board[k - 1][j];
            document['s' + k + '_' + j].src = squareImages[board[k][j]].src;
          }
        }
        for (j = 0; j < BOARD_WIDTH; j += 1) {
          board[0][j] = 0;
          document['s0' + '_' + j].src = squareImages[0].src;
        }
        numLines += 1;
        skyline += 1;
        document.gameForm.numLines.value = numLines;
        if (numLines % ROWS_PER_LEVEL === 0) {
          if (curLevel < MAX_LEVEL) {
            curLevel += 1;
          }
        }
        speed = SLOWEST_SPEED - FASTEST_SPEED * curLevel;
        document.gameForm.levelSelector.selectedIndex = curLevel - 1;
      }
    }
  }

  function pieceFits(x, y) {
    var k, theX, theY;
    for (k = 0; k < NUM_SQUARES; k += 1) {
      theX = x + dxPrime[k];
      theY = y + dyPrime[k];
      if (theX < 0 || theX >= BOARD_WIDTH || theY >= BOARD_HEIGHT) {
        return 0;
      }
      if (theY > -1 && board[theY][theX] > 0) {
        return 0;
      }
    }
    return 1;
  }

  function erasePiece() {
    var k, x, y;
    if (boardDrawn) {
      for (k = 0; k < NUM_SQUARES; k += 1) {
        x = curX + dx[k];
        y = curY + dy[k];
        if (0 <= y && y < BOARD_HEIGHT && 0 <= x && x < BOARD_WIDTH) {
          xToErase[k] = x;
          yToErase[k] = y;
          board[y][x] = 0;
        }
      }
    }
  }

  function drawPiece() {
    var k, x, y;
    if (boardDrawn) {
      for (k = 0; k < NUM_SQUARES; k += 1) {
        x = curX + dx[k];
        y = curY + dy[k];
        if (0 <= y && y < BOARD_HEIGHT && 0 <= x && x < BOARD_WIDTH && board[y][x] !== -curPiece) {
          document['s' + y + '_' + x].src = squareImages[curPiece].src;
          board[y][x] = -curPiece;
        }
        x = xToErase[k];
        y = yToErase[k];
        if (board[y][x] === 0) {
          document['s' + y + '_' + x].src = squareImages[0].src;
        }
      }
    }
  }

  function moveDown() {
    var k;
    for (k = 0; k < NUM_SQUARES; k += 1) {
      dxPrime[k] = dx[k];
      dyPrime[k] = dy[k];
    }
    if (pieceFits(curX, curY + 1)) {
      erasePiece();
      curY += 1;
      drawPiece();
      return 1;
    }
    return 0;
  }

  function getPiece() {
    var k;
    curPiece = 1 + Math.floor(NUM_TYPES * Math.random());
    curX = 5;
    curY = 0;
    for (k = 0; k < NUM_SQUARES; k += 1) {
      dx[k] = dxBank[curPiece][k];
      dy[k] = dyBank[curPiece][k];
    }
    for (k = 0; k < NUM_SQUARES; k += 1) {
      dxPrime[k] = dx[k];
      dyPrime[k] = dy[k];
    }
    if (pieceFits(curX, curY)) {
      drawPiece();
      return 1;
    }
    return 0;
  }

  function play() {
    if (moveDown()) {
      timerId = setTimeout(play, speed);
    } else {
      fillMatrix();
      removeLines();
      if (skyline > 0 && getPiece()) {
        timerId = setTimeout(play, speed);
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

  function resume() {
    if (boardDrawn && gameStarted && gamePaused) {
      play();
      gamePaused = false;
    }
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
      clearTimeout(timerId);
      gamePaused = true;
    }
  }

  function getLevel() {
    curLevel = parseInt(document.gameForm.levelSelector.options[document.gameForm.levelSelector.selectedIndex].value, 10);
    speed = SLOWEST_SPEED - FASTEST_SPEED * curLevel;
  }

  function moveLeft() {
    var k;
    for (k = 0; k < NUM_SQUARES; k += 1) {
      dxPrime[k] = dx[k];
      dyPrime[k] = dy[k];
    }
    if (pieceFits(curX - 1, curY)) {
      erasePiece();
      curX -= 1;
      drawPiece();
    }
  }

  function moveRight() {
    var k;
    for (k = 0; k < NUM_SQUARES; k += 1) {
      dxPrime[k] = dx[k];
      dyPrime[k] = dy[k];
    }
    if (pieceFits(curX + 1, curY)) {
      erasePiece();
      curX += 1;
      drawPiece();
    }
  }

  function rotate() {
    var k;
    for (k = 0; k < NUM_SQUARES; k += 1) {
      dxPrime[k] = dy[k];
      dyPrime[k] = -dx[k];
    }
    if (pieceFits(curX, curY)) {
      erasePiece();
      for (k = 0; k < NUM_SQUARES; k += 1) {
        dx[k] = dxPrime[k];
        dy[k] = dyPrime[k];
      }
      drawPiece();
    }
  }

  function fall() {
    var k;
    for (k = 0; k < NUM_SQUARES; k += 1) {
      dxPrime[k] = dx[k];
      dyPrime[k] = dy[k];
    }
    if (!pieceFits(curX, curY + 1)) {
      return;
    }
    clearTimeout(timerId);
    erasePiece();
    while (pieceFits(curX, curY + 1)) {
      curY += 1;
    }
    drawPiece();
    timerId = setTimeout(play, speed);
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

  function keyDown(e) {
    var evt, keyNN, keyIE;
    evt = e || event;
    keyNN = ' ' + evt.keyCode + ' ';
    keyIE = ' ' + evt.keyCode + ' ';

    // Return false if we can handle the keypress and true otherwise.  If we
    // capture all key presses, we break things like using ^r to reload the page.

    if (!gameStarted || !boardDrawn || gamePaused) {
      return true;
    }

    if (LEFT_NN.indexOf(keyNN) !== -1 || LEFT_IE.indexOf(keyIE) !== -1) {
      if (!isActiveLeft) {
        isActiveLeft = true;
        isActiveRight = false;
        moveLeft();
        timerLeft = setTimeout(slideLeft, INITIAL_DELAY);
      }
    } else if (RIGHT_NN.indexOf(keyNN) !== -1 || RIGHT_IE.indexOf(keyIE) !== -1) {
      if (!isActiveRight) {
        isActiveRight = true;
        isActiveLeft = false;
        moveRight();
        timerRight = setTimeout(slideRight, INITIAL_DELAY);
      }
    } else if (UP_NN.indexOf(keyNN) !== -1 || UP_IE.indexOf(keyIE) !== -1) {
      if (!isActiveUp) {
        isActiveUp = true;
        isActiveDown = false;
        rotate();
      }
    } else if (SPACE_NN.indexOf(keyNN) !== -1 || SPACE_IE.indexOf(keyIE) !== -1) {
      if (!isActiveSpace) {
        isActiveSpace = true;
        isActiveDown = false;
        fall();
      }
    } else if (DOWN_NN.indexOf(keyNN) !== -1 || DOWN_IE.indexOf(keyIE) !== -1) {
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
    var evt, keyNN, keyIE;
    evt = e || event;
    keyNN = ' ' + evt.keyCode + ' ';
    keyIE = ' ' + evt.keyCode + ' ';

    // Return false if we can handle the keypress and true otherwise.  If we
    // capture all key presses, we break things like using ^r to reload the page.

    if (LEFT_NN.indexOf(keyNN) !== -1 || LEFT_IE.indexOf(keyIE) !== -1) {
      isActiveLeft = false;
      clearTimeout(timerLeft);
    } else if (RIGHT_NN.indexOf(keyNN) !== -1 || RIGHT_IE.indexOf(keyIE) !== -1) {
      isActiveRight = false;
      clearTimeout(timerRight);
    } else if (UP_NN.indexOf(keyNN) !== -1 || UP_IE.indexOf(keyIE) !== -1) {
      isActiveUp = false;
      clearTimeout(timerUp);
    } else if (DOWN_NN.indexOf(keyNN) !== -1 || DOWN_IE.indexOf(keyIE) !== -1) {
      isActiveDown = false;
      clearTimeout(timerDown);
    } else if (SPACE_NN.indexOf(keyNN) !== -1 || SPACE_IE.indexOf(keyIE) !== -1) {
      isActiveSpace = false;
      clearTimeout(timerSpace);
    } else {
      return true;
    }
    return false;
  }

  function init() {
    var i, j;
    for (i = 0; i < NUM_IMAGES; i += 1) {
      squareImages[i] = new Image();
      squareImages[i].src = 'images/s' + i + '.png';
    }

    for (i = 0; i < BOARD_HEIGHT; i += 1) {
      board[i] = [];
      for (j = 0; j < BOARD_WIDTH; j += 1) {
        board[i][j] = 0;
      }
    }

    document.onkeydown = keyDown;
    document.onkeyup = keyUp;

    drawBoard();
    resetGame();
  }

  // This is the list of exported functions.
  return {
    init: init,
    getLevel: getLevel,
    start: start,
    pause: pause
  };
}());