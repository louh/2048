function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.sharingContainer = document.querySelector(".score-sharing");
  this.thatsNumberwang  = document.querySelector(".thats-numberwang");
  this.rotateButton     = document.querySelector(".rotate-button");
  this.rotateTheBoard   = document.querySelector(".lets-rotate-the-board");
  this.gameContainer    = document.querySelector('.game-container')

  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continue = function () {
  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "restart");
  }

  this.clearMessage();
  this.gameContainer.classList.remove('rotate');
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  inner.textContent = tile.wangValue;

  // Some percent chance of seeing a flipped number
  if (Math.random() > 0.993) {
    inner.classList.add("flipped");
  }

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Fit numberwang values
  var wangLength = String(tile.wangValue).length
  if (wangLength >= 3) {
    if (wangLength > 6) {
      wangLength = 6;
    }
    classes.push("tile-small-" + wangLength);
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);
  this.clearContainer(this.thatsNumberwang);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = _randomScore();

    this.scoreContainer.appendChild(addition);
  }

  if (!this.rotateTheBoard.hasChildNodes() && Math.random() > 0.9 && score > 8 ) {
    this.showMessage()
    // multiple unreleated animationEnd events might fire
    // before rotate is done so setTimeout instead
    setTimeout(this.clearContainer.bind(this,this.rotateTheBoard),3000);
  }

  function _randomScore() {
    var random = Math.random(),
        sign = "+",
        wang = Math.ceil(Math.random() * (difference - (difference/2)) * 4);

    // Decimal number
    if (random > 0.94) {
      wang = wang.toString() + '.' + Math.ceil(Math.random() * 9).toString();
    }
    // Negative number
    else if (random < 0.04) {
      sign = '-';
    }
    // Zero
    else if (random > 0.46 && random < 0.465) {
      wang = 0;
    }
    // Hundred digit number
    else if (random > 0.09 && random < 0.12) {
      wang = wang + Math.floor(Math.random() * 1000);
    }
    // Four digit number
    else if (random > 0.05 && random < 0.08) {
      wang = wang + Math.floor(Math.random() * 10000);
    }
    // Five digit number
    else if (random > 0.080 && random < 0.082) {
      wang = wang + Math.floor(Math.random() * 100000);
    }
    // Six digit number
    else if (random > 0.085 && random < 0.086) {
      wang = wang + Math.floor(Math.random() * 1000000);
    }
    return sign + wang;
  }

  if (!this.gameContainer.classList.contains('rotate') && Math.random() > 0.9 && score > 600) {
    this.gameContainer.classList.add('rotate');
    var announce = document.createElement("p");
    announce.textContent = "Let's Rotate The Board!";
    this.rotateTheBoard.appendChild(announce);
  }

};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  this.clearContainer(this.thatsNumberwang);
  this.clearContainer(this.rotateTheBoard);

  var type    = won ? "game-won" : "game-over";
  var message = won ? "You’re the Numberwang!" : "You’ve been Wangernumbed!";

  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "end", type, this.score);
  }

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;

  this.clearContainer(this.sharingContainer);
  this.sharingContainer.appendChild(this.scoreTweetButton());
  twttr.widgets.load();
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.scoreTweetButton = function () {
  var tweet = document.createElement("a");
  tweet.classList.add("twitter-share-button");
  tweet.setAttribute("href", "https://twitter.com/share");
  tweet.setAttribute("data-via", "gabrielecirulli");
  tweet.setAttribute("data-url", "http://git.io/2048");
  tweet.setAttribute("data-counturl", "http://gabrielecirulli.github.io/2048/");
  tweet.textContent = "Tweet";

  var text = "I scored " + this.score + " points at 2048, a game where you " +
             "join numbers to score high! #2048game";
  tweet.setAttribute("data-text", text);

  return tweet;
};

HTMLActuator.prototype.showMessage = function (message) {
  message = message || "That’s Numberwang!";
  var announce = document.createElement("p");
  announce.classList.add("show-numberwang");
  announce.textContent = message;
  this.thatsNumberwang.appendChild(announce);
};

HTMLActuator.prototype.rotate = function () {
  this.gameContainer.classList.add('rotate');
  this.rotateButton.textContent = "Board rotated!"
}
