"use strict";

// All components are assumed to have an "_owner" property, injected when it's
// added to a class by the manager. I don't know how to properly express that
// expectation in JS, so I'm putting it in a comment here.
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

// Position

Component.Position.prototype.step = function(x, y) {
  if (! (-1 <= x <= 1) || ! (-1 <= y <= 1)) {
    throw new Error('You cannot step more than one square');
  }
  if (this.board.isPassable(this.x + x, this.y + y)) {
    this.x += x;
    this.y += y;

    // I'd prefer some way of tying the render position to the logical position
    // which is - well, not quite as stateful as this? I might want to go have a
    // look at the documentation. In my previous Python implementation there was
    // a render step where I myself derived the x/y of the rendered tile on
    // every call, but the examples Phaser shows don't follow that approach.
    //
    // Also this will probably change drastically when the camera enters the
    // equation!
    if (!!this.owner.phaserSprite) {
      this.owner.phaserSprite.sprite.x = this.x * 30;
      this.owner.phaserSprite.sprite.y = this.y * 30;
    }
  }
}
