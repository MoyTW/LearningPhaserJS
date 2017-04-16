"use strict";

var Level = {
  Tile : function Tile (blocked, blocks_sight) {
    this.blocked = blocked;
    this.blocks_sight = blocks_sight;
  },

  Board : function Board (width, height) {
    this.width = width;
    this.height = height;

    this.tiles = new Array(width);
    for (var i = 0; i < height; i++) {
      this.tiles[i] = new Array(height);
    }
    for (var x = 0; x < width; x++) {
      for (var y = 0; y < height; y++) {
        var edge = this.isEdge(x, y);
        this.tiles[x][y] = new Level.Tile(edge, false);
      }
    }
  },
}

Level.Board.prototype.isEdge = function(x, y) {
  return x == 0 || y == 0 || x >= this.width - 1 || y >= this.height - 1;
}
