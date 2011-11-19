/**
 * This is an implementation of Tetris in Dart.
 *
 * Warning: This is my first Dart program, and I haven't even read the tutorial
 * yet!  Nonetheless, it does work, and it's fairly clean.
 *
 * This code was inspired by Alexei Kourbatov (http://www.javascripter.net).
 */

#import('dart:dom');

class Game {

  static final NUM_SQUARES = 4;
  static final NUM_TYPES = 7;
  static final NUM_IMAGES = 8;
  static final DEFAULT_LEVEL = 1;
  static final MAX_LEVEL = 10;
  static final ROWS_PER_LEVEL = 5;
  static final WINNING_NUM_LINES = 5;
  static final BOARD_HEIGHT = 16;
  static final BOARD_WIDTH = 10;
  static final SLOWEST_SPEED = 700;
  static final FASTEST_SPEED = 60;
  static final SQUARE_WIDTH = 16;
  static final SQUARE_HEIGHT = 16;
  
  // Keystroke processing
  static final INITIAL_DELAY = 200;
  static final REPEAT_DELAY = 20;

  // These are for Netscape.
  static final LEFT_NN = ' 52 ';
  static final RIGHT_NN = ' 54 ';
  static final UP_NN = ' 56 53 ';
  static final DOWN_NN = ' 50 ';
  static final SPACE_NN = ' 32 ';

  // These are for Internet Explorer.
  static final LEFT_IE = ' 37 52 100 ';
  static final RIGHT_IE = ' 39 54 102 ';
  static final UP_IE = ' 38 56 53 104 101 ';
  static final DOWN_IE = ' 40 50 98 ';
  static final SPACE_IE = ' 32 ';
  
  num curLevel = DEFAULT_LEVEL;
  num curX = 1;
  num curY = 1;
  num curPiece;
  num skyline = BOARD_HEIGHT - 1;
  bool boardDrawn = false;
  bool gamePaused = false;
  bool gameStarted = false;
  bool sayingBye = false;
  num timerId = null;
  num numLines = 0;
  num speed = SLOWEST_SPEED - FASTEST_SPEED * DEFAULT_LEVEL;
  List<HTMLImageElement> squareImages;
  List<List<num>> board;
  List<num> xToErase;
  List<num> yToErase;
  List<num> dx;
  List<num> dy;
  List<num> dxPrime;
  List<num> dyPrime;
  List<List<num>> dxBank;
  List<List<num>> dyBank;
  
  // Keystroke processing
  bool isActiveLeft = false;
  num timerLeft = null;
  bool isActiveRight = false;
  num timerRight = null;
  bool isActiveUp = false;
  num timerUp = null;
  bool isActiveDown = false;
  num timerDown = null;
  bool isActiveSpace = false;
  num timerSpace = null;

  Game() {
    HTMLDocument doc = window.document;
    
    squareImages = [];
    board = [];
    xToErase = [0, 0, 0, 0];
    yToErase = [0, 0, 0, 0];
    dx = [0, 0, 0, 0];
    dy = [0, 0, 0, 0];
    dxPrime = [0, 0, 0, 0];
    dyPrime = [0, 0, 0, 0];
    dxBank = [[], [0, 1, -1, 0], [0, 1, -1, -1], [0, 1, -1, 1], [0, -1, 1, 0], [0, 1, -1, 0], [0, 1, -1, -2], [0, 1, 1, 0]];
    dyBank = [[], [0, 0, 0, 1], [0, 0, 0, 1], [0, 0, 0, 1], [0, 0, 1, 1], [0, 0, 1, 1], [0, 0, 0, 0], [0, 0, 1, 1]];

    for (num i = 0; i < NUM_IMAGES; i++) {
      HTMLImageElement img = doc.createElement("img");
      img.src = 'images/s' + i + '.png';
      squareImages.add(img);
    }

    for (num i = 0; i < BOARD_HEIGHT; i++) {
      board.add([]);
      for (num j = 0; j < BOARD_WIDTH; j++) {
        board[i].add(0);
      }
    }
    
    doc.onkeydown = onKeyDown;
    doc.onkeyup = onKeyUp;
    
    HTMLSelectElement levelSelect = doc.getElementById("level-select");
    levelSelect.onchange = (Event e) {
      setLevel();
      levelSelect.blur();
    };
    
    HTMLButtonElement startButton = doc.getElementById("start-button");
    HTMLButtonElement pauseButton = doc.getElementById("pause-button");
    startButton.onclick = (event) => start();
    pauseButton.onclick = (event) => pause();
  }

  void run() {
    drawBoard();
    resetGame();
  }
  
  void start() {
    HTMLDocument doc = window.document;
    if (sayingBye) {
      window.history.back();
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
    HTMLInputElement numLinesField = doc.getElementById("num-lines");
    numLinesField.value = numLines.toString();
    timerId = window.setTimeout(play, speed);
  }

  void drawBoard() {
    HTMLDocument doc = window.document;
    HTMLDivElement boardDiv = doc.getElementById("board-div");
    HTMLPreElement pre = doc.createElement("pre");
    boardDiv.appendChild(pre);
    pre.className = "board";    
    for (num i = 0; i < BOARD_HEIGHT; i++) {
      HTMLDivElement div = doc.createElement("div");
      pre.appendChild(div);
      for (num j = 0; j < BOARD_WIDTH; j++) {
        HTMLImageElement img = doc.createElement("img");
        div.appendChild(img);
        img.id = "s-" + i + "-" + j;
        img.src = "images/s" + board[i][j].abs() + ".png";
        img.width = SQUARE_WIDTH;
        img.height = SQUARE_HEIGHT;
      }
      HTMLImageElement rightMargin = doc.createElement("img");
      div.appendChild(rightMargin);
      rightMargin.src = "images/g.png";
      rightMargin.width = 1;
      rightMargin.height = SQUARE_HEIGHT;
    }
    HTMLDivElement trailingDiv = doc.createElement("div");    
    pre.appendChild(trailingDiv);
    HTMLImageElement trailingImg = doc.createElement("img");
    trailingDiv.appendChild(trailingImg);
    trailingImg.src = "images/g.png";
    trailingImg.id = "board-trailing-img";
    trailingImg.width = BOARD_WIDTH * 16 + 1;
    trailingImg.height = 1;
    boardDrawn = true;
  }
  
  void resetGame() {
    HTMLDocument doc = window.document;
    for (num i = 0; i < BOARD_HEIGHT; i++) {
      for (num j = 0; j < BOARD_WIDTH; j++) {
        board[i][j] = 0;
        HTMLImageElement img = doc.getElementById("s-" + i + "-" + j);
        img.src = 'images/s0.png';
      }
    }
    gameStarted = false;
    gamePaused = false;
    numLines = 0;
    curLevel = 1;
    skyline = BOARD_HEIGHT - 1;
    HTMLInputElement numLinesField = doc.getElementById("num-lines");
    numLinesField.value = numLines.toString();
    HTMLSelectElement levelSelect = doc.getElementById("level-select");
    levelSelect.selectedIndex = 0;
  }

  void play() {
    if (moveDown()) {
      timerId = window.setTimeout(play, speed);
    } else {
      fillMatrix();
      removeLines();
      if (skyline > 0 && getPiece()) {
        timerId = window.setTimeout(play, speed);
      } else {
        isActiveLeft = false;
        isActiveUp = false;
        isActiveRight = false;
        isActiveDown = false;
        window.alert('Game over!');
        resetGame();
      }
    }
  }

  void pause() {
    if (boardDrawn && gameStarted) {
      if (gamePaused) {
        resume();
        return;
      }
      window.clearTimeout(timerId);
      gamePaused = true;
    }
  }

  void onKeyDown(KeyboardEvent event) {
    // I'm positive there are more modern ways to do keyboard event handling.
    String keyNN, keyIE;
    keyNN = ' ' + event.keyCode + ' ';
    keyIE = ' ' + event.keyCode + ' ';

    // Only preventDefault if we can actually handle the keyDown event.  If we
    // capture all keyDown events, we break things like using ^r to reload the page.

    if (!gameStarted || !boardDrawn || gamePaused) {
      return;
    }

    if (LEFT_NN.indexOf(keyNN) != -1 || LEFT_IE.indexOf(keyIE) != -1) {
      if (!isActiveLeft) {
        isActiveLeft = true;
        isActiveRight = false;
        moveLeft();
        timerLeft = window.setTimeout(slideLeft, INITIAL_DELAY);
      }
    } else if (RIGHT_NN.indexOf(keyNN) != -1 || RIGHT_IE.indexOf(keyIE) != -1) {
      if (!isActiveRight) {
        isActiveRight = true;
        isActiveLeft = false;
        moveRight();
        timerRight = window.setTimeout(slideRight, INITIAL_DELAY);
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
        timerDown = window.setTimeout(slideDown, INITIAL_DELAY);
      }
    } else {
      return;
    }
    event.preventDefault();  
  }
  
  void onKeyUp(KeyboardEvent event) {
    // See comments in onKeyDown.
    var keyNN, keyIE;
    keyNN = ' ' + event.keyCode + ' ';
    keyIE = ' ' + event.keyCode + ' ';
    if (LEFT_NN.indexOf(keyNN) != -1 || LEFT_IE.indexOf(keyIE) != -1) {
      isActiveLeft = false;
      window.clearTimeout(timerLeft);
    } else if (RIGHT_NN.indexOf(keyNN) != -1 || RIGHT_IE.indexOf(keyIE) != -1) {
      isActiveRight = false;
      window.clearTimeout(timerRight);
    } else if (UP_NN.indexOf(keyNN) != -1 || UP_IE.indexOf(keyIE) != -1) {
      isActiveUp = false;
      window.clearTimeout(timerUp);
    } else if (DOWN_NN.indexOf(keyNN) != -1 || DOWN_IE.indexOf(keyIE) != -1) {
      isActiveDown = false;
      window.clearTimeout(timerDown);
    } else if (SPACE_NN.indexOf(keyNN) != -1 || SPACE_IE.indexOf(keyIE) != -1) {
      isActiveSpace = false;
      window.clearTimeout(timerSpace);
    } else {
      return;
    }
    event.preventDefault();
  }

  void fillMatrix() {
    num k, x, y;
    for (k = 0; k < NUM_SQUARES; k++) {
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

  void removeLines() {
    num i, j, k;
    bool gapFound;
    HTMLDocument doc = window.document;
    for (i = 0; i < BOARD_HEIGHT; i++) {
      gapFound = false;
      for (j = 0; j < BOARD_WIDTH; j++) {
        if (board[i][j] == 0) {
          gapFound = true;
          break;
        }
      }
      if (!gapFound) {
        for (k = i; k >= skyline; k--) {
          for (j = 0; j < BOARD_WIDTH; j++) {
            board[k][j] = board[k - 1][j];
            HTMLImageElement img = doc.getElementById("s-" + k + "-" + j);
            img.src = squareImages[board[k][j]].src;
          }
        }
        for (j = 0; j < BOARD_WIDTH; j++) {
          board[0][j] = 0;
          HTMLImageElement img = doc.getElementById("s-0-" + j);
          img.src = squareImages[0].src;
        }
        numLines++;
        skyline++;
        HTMLInputElement numLinesField = doc.getElementById("num-lines");
        numLinesField.value = numLines.toString();
        if (numLines % ROWS_PER_LEVEL == 0 && curLevel < MAX_LEVEL) {
          curLevel++;
        }
        if (numLines == WINNING_NUM_LINES) {
          HTMLDivElement nextUrlDiv = doc.getElementById('next-url');
          nextUrlDiv.style.setProperty("display", "block");
        }
        speed = SLOWEST_SPEED - FASTEST_SPEED * curLevel;
        HTMLSelectElement levelSelect = doc.getElementById("level-select");
        levelSelect.selectedIndex = curLevel - 1;
      }
    }
  }
  
  bool pieceFits(x, y) {
    num k, theX, theY;
    for (k = 0; k < NUM_SQUARES; k++) {
      theX = x + dxPrime[k];
      theY = y + dyPrime[k];
      if (theX < 0 || theX >= BOARD_WIDTH || theY >= BOARD_HEIGHT) {
        return false;
      }
      if (theY > -1 && board[theY][theX] > 0) {
        return false;
      }
    }
    return true;
  }

  void erasePiece() {
    num k, x, y;
    if (boardDrawn) {
      for (k = 0; k < NUM_SQUARES; k++) {
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
  
  void drawPiece() {
    num k, x, y;
    HTMLDocument doc = window.document;
    if (boardDrawn) {
      for (k = 0; k < NUM_SQUARES; k++) {
        x = curX + dx[k];
        y = curY + dy[k];
        if (0 <= y && y < BOARD_HEIGHT && 0 <= x && x < BOARD_WIDTH && board[y][x] != -curPiece) {
          HTMLImageElement img = doc.getElementById("s-" + y + "-" + x);
          img.src = squareImages[curPiece].src;
          board[y][x] = -curPiece;
        }
        x = xToErase[k];
        y = yToErase[k];
        if (board[y][x] == 0) {
          HTMLImageElement img = doc.getElementById("s-" + y + "-" + x);
          img.src = squareImages[0].src;
        }
      }
    }
  }

  bool moveDown() {
    num k;
    for (k = 0; k < NUM_SQUARES; k++) {
      dxPrime[k] = dx[k];
      dyPrime[k] = dy[k];
    }
    if (pieceFits(curX, curY + 1)) {
      erasePiece();
      curY++;
      drawPiece();
      return true;
    }
    return false;
  }

  void moveLeft() {
    num k;
    for (k = 0; k < NUM_SQUARES; k++) {
      dxPrime[k] = dx[k];
      dyPrime[k] = dy[k];
    }
    if (pieceFits(curX - 1, curY)) {
      erasePiece();
      curX--;
      drawPiece();
    }
  }

  void moveRight() {
    num k;
    for (k = 0; k < NUM_SQUARES; k++) {
      dxPrime[k] = dx[k];
      dyPrime[k] = dy[k];
    }
    if (pieceFits(curX + 1, curY)) {
      erasePiece();
      curX++;
      drawPiece();
    }
  }

  bool getPiece() {
    num k;
    curPiece = 1 + (NUM_TYPES * Math.random()).floor();
    curX = 5;
    curY = 0;
    for (k = 0; k < NUM_SQUARES; k++) {
      dx[k] = dxBank[curPiece][k];
      dy[k] = dyBank[curPiece][k];
    }
    for (k = 0; k < NUM_SQUARES; k++) {
      dxPrime[k] = dx[k];
      dyPrime[k] = dy[k];
    }
    if (pieceFits(curX, curY)) {
      drawPiece();
      return true;
    }
    return false;
  }

  void resume() {
    if (boardDrawn && gameStarted && gamePaused) {
      play();
      gamePaused = false;
    }
  }

  void setLevel() {
    HTMLDocument doc = window.document;
    HTMLSelectElement levelSelect = doc.getElementById("level-select");
    HTMLOptionElement selectedOption = levelSelect.options[levelSelect.selectedIndex];
    curLevel = Math.parseInt(selectedOption.value);
    speed = SLOWEST_SPEED - FASTEST_SPEED * curLevel;
  }

  void rotate() {
    num k;
    for (k = 0; k < NUM_SQUARES; k++) {
      dxPrime[k] = dy[k];
      dyPrime[k] = -dx[k];
    }
    if (pieceFits(curX, curY)) {
      erasePiece();
      for (k = 0; k < NUM_SQUARES; k++) {
        dx[k] = dxPrime[k];
        dy[k] = dyPrime[k];
      }
      drawPiece();
    }
  }
  
  void fall() {
    num k;
    for (k = 0; k < NUM_SQUARES; k++) {
      dxPrime[k] = dx[k];
      dyPrime[k] = dy[k];
    }
    if (!pieceFits(curX, curY + 1)) {
      return;
    }
    window.clearTimeout(timerId);
    erasePiece();
    while (pieceFits(curX, curY + 1)) {
      curY++;
    }
    drawPiece();
    timerId = window.setTimeout(play, speed);
  }

  void slideLeft() {
    if (isActiveLeft) {
      moveLeft();
      timerLeft = window.setTimeout(slideLeft, REPEAT_DELAY);
    }
  }

  void slideRight() {
    if (isActiveRight) {
      moveRight();
      timerRight = window.setTimeout(slideRight, REPEAT_DELAY);
    }
  }

  void slideDown() {
    if (isActiveDown) {
      moveDown();
      timerDown = window.setTimeout(slideDown, REPEAT_DELAY);
    }
  }

  void write(String message) {
    HTMLDocument doc = window.document;
    HTMLParagraphElement p = doc.createElement('p');
    p.textContent = message;
    doc.body.appendChild(p);
  }
  
}

void main() {
  new Game().run();
}