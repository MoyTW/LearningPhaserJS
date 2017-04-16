"use strict";

var Component = {
  Position : function Position (x, y) {
    this.x = x;
    this.y = y;
  },

  PhaserSprite : function PhaserSprite (x, y, spriteName) {
    this.sprite = game.add.sprite(x, y, spriteName);
    this.sprite.width = 30;
    this.sprite.height = 30;
  },
}
