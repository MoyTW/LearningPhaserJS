"use strict";

var Component = {
  Position : function Position (board, x, y) {
    this.board = board;
    this.x = x;
    this.y = y;
  },

  PhaserSprite : function PhaserSprite (x, y, spriteName) {
    this.sprite = game.add.sprite(x * 30, y * 30, spriteName);
    this.sprite.width = 30;
    this.sprite.height = 30;
  },
}

Component.Position.prototype.step = function(x, y) {
  if (! (-1 <= x <= 1) || ! (-1 <= y <= 1)) {
    throw new Error('You cannot step more than one square');
  }
  if (this.board.isPassable(this.x + x, this.y + y)) {
    this.x += x;
    this.y += y;
  }
}
