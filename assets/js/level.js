"use strict";

var Level = Level || {};

// If I were going to be more consistent about 'linked' classes and 'non-linked'
// classes, this would mean that it'd look something like:
//
// Level.Tile = {};
//
// ...all Level.Tile functions...
//
// Level.Board = {};
//
// ...all Level.Board functions...
//
// This is because if we wanted to 'link' Board to, say, BoardFoo, we'd do:
//
// Level.BoardFoo = Object.create(Level.Board);
//
// ...all Level.BoardFoo functions (delegating to Level.Board)...
//
// However, I really just like the object literal syntax over a bunch of
// Level.Tile.FunctionName = function. So...I'm going to have to settle on a
// consistent approach, and I think it'll be the non-object literal syntax. A
// pity.

/********
 * Tile *
 ********/
Level.Tile = {

  // Realistically, we don't need initTile, we could do this in createTile. This
  // is because I don't intend to link it to any other objects; if we did, this
  // init function would be helpful. Included as exercise.
  initTile : function (blocked, blocksSight) {
    this.blocked = blocked;
    this.blocksSight = blocksSight;
  },

  CreateTile : function (blocked, blocksSight) {
    var o = Object.create( Level.Tile );
    o.initTile(blocked, blocksSight);
    return o;
  }

}

/*********
 * Board *
 *********/
Level.Board = {

  // Again - not necessary, because not intending to link board; included as an
  // exercise.
  initBoard : function (entityManager, width, height) {
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
        this._tiles[x][y] = Level.Tile.CreateTile(edge, false);
      }
    }
  },

  CreateBoard : function (entityManager, width, height) {
    var o = Object.create( Level.Board );
    o.initBoard(entityManager, width, height);
    return o;
  },

  isEdge: function (x, y) {
    return x == 0 || y == 0 || x >= this.width - 1 || y >= this.height - 1;
  },

  isTileOccupied : function (x, y) {
    var occupiers = this._entityManager.findByTag([x, y]);
    if (occupiers) {
      var o;
      for (o of occupiers) {
        if (o.hasComponent(Component.Position) && o.position.blocksMovement) {
          return true;
        }
      }
    }
    return false;
  },

  tileOccupiers : function (position, onlyCollidables) {
    var entities = this._entityManager.findByTag(position);
    if (entities && onlyCollidables) {
      // Lord but I *really* wanted to use a filter here, like Clojure has taught
      // me, but SURPRISE! Javascript only implements it for arrays. No filter for
      // Sets! Well, I mean, not natively. I'm disappointed by this.
      var e;
      for (e of entities) {
        if (e.hasComponent(Component.Position) && !e.position.blocksMovement) {
          entities.delete(e);
        }
      }
      return entities;
    } else {
      return entities || new Set();
    }
  },

  // I am not going to lie. As an implementation this is not the prettiest thing
  // it could be, nor is it the most elegant. I mostly copied it from the code I
  // wrote when doing the 7DRL, and that code is..not the best.
  //
  // However, unless it turns out to be a bottleneck, I'll leave it.
  tilesInRadius : function (position, radius) {
    var pX = position[0];
    var pY = position[1];
    var xMin = pX - radius;
    var xMax = pX + radius;
    var yMin = pY - radius;
    var yMax = pY + radius;

    var tiles = [];
    for (var x = xMin; x <= xMax; x++) {
      for (var y = yMin; y <= yMax; y++) {
        var dx = x - pX;
        var dy = y - pY;
        var d = Math.ceil(Math.sqrt(dx * dx + dy * dy));
        if (!(dx == 0 && dy == 0) && d <= radius) {
          tiles.push([x, y]);
        }
      }
    }

    return tiles;
  },

  occupiersInRadius : function (position, radius, onlyCollidables) {
    var tiles = this.tilesInRadius(position, radius);
    var entities = new Set();

    var tilePos;
    var entity;
    for (var tilePos of tiles) {
      for (var entity of this.tileOccupiers(tilePos, onlyCollidables)) {
        entities.add(entity);
      }
    }

    return entities;
  },

  isTerrainPassable : function (x, y) {
    return (x >= 0 && y >= 0 && x < this.width && y < this.height) &&
      !this._tiles[x][y].blocked;
  },

  isPassable : function (x, y) {
    return this.isTerrainPassable(x, y) && !this.isTileOccupied(x, y);
  },

  notifyMoved : function (entity, lastPosition, nextPosition) {
    this._entityManager.replaceTag(entity, lastPosition, nextPosition);
  }

}
