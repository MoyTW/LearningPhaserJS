"use strict";

var Level = {
  Tile : function Tile (blocked, blocks_sight) {
    this.blocked = blocked;
    this.blocks_sight = blocks_sight;
  },

  Board : function Board (width, height) {
    this.width = width;
    this.height = height;

    this._tiles = new Array(width);
    for (var i = 0; i < height; i++) {
      this._tiles[i] = new Array(height);
    }
    for (var x = 0; x < width; x++) {
      for (var y = 0; y < height; y++) {
        var edge = this.isEdge(x, y);
        this._tiles[x][y] = new Level.Tile(edge, false);
      }
    }
  },
}

Level.Board.prototype.isEdge = function(x, y) {
  return x == 0 || y == 0 || x >= this.width - 1 || y >= this.height - 1;
}

Level.Board.prototype.isPassable = function(x, y) {
  return (x >= 0 && y >= 0 && x < this.width && y < this.height) &&
    !this._tiles[x][y].blocked;
}
