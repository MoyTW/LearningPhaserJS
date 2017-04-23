"use strict";

var Level = {
  Tile : function Tile (blocked, blocks_sight) {
    this.blocked = blocked;
    this.blocks_sight = blocks_sight;
  },

  Board : function Board (entityManager, width, height) {
    this._entityManager = entityManager;
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
  }
}

Level.Board.prototype.isEdge = function(x, y) {
  return x == 0 || y == 0 || x >= this.width - 1 || y >= this.height - 1;
}

Level.Board.prototype.isTileOccupied = function (x, y) {
  var occupiers = this._entityManager.findByTag([x, y]);
  if (occupiers) {
    var o;
    for (o of occupiers) {
      if (o.hasComponent(Component.Position) && o.position.blocks_movement) {
        return true;
      }
    }
  }
  return false;
}

Level.Board.prototype.isTerrainPassable = function (x, y) {
  return (x >= 0 && y >= 0 && x < this.width && y < this.height) &&
    !this._tiles[x][y].blocked;
}

Level.Board.prototype.isPassable = function(x, y) {
  return this.isTerrainPassable(x, y) && !this.isTileOccupied(x, y);
}
