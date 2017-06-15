"use strict";

var Level = Level || {};

// I think the reason I like the OLN is that it gives clear indentation
// information. That is, Level.Tile functions are indented from Level.Tile,
// whereas Level.Tile.FunctionName append-to-object syntax doesn't give you
// that, so it's less easy to tell where Level.Tile ends and Level.Board begins.
//
// I didn't use Python a *ton* but I really liked that aspect of it.

/********
 * Tile *
 ********/
Level.Tile = {};

// Realistically, we don't need initTile, we could do this in createTile. This
// is because I don't intend to link it to any other objects; if we did, this
// init function would be helpful. Included as exercise.
Level.Tile.initTile = function (blocked, blocksSight) {
  this.blocked = blocked;
  this.blocksSight = blocksSight;
}

Level.Tile.CreateTile = function (blocked, blocksSight) {
  var o = Object.create( Level.Tile );
  o.initTile(blocked, blocksSight);
  return o;
}


/********
 * Zone *
 ********/
Level.Zone = {};

Level.Zone.initZone = function (x, y, width, height, name) {
  this.x1 = x;
  this.y1 = y;
  this.x2 = x + width;
  this.y2 = y + height;

  this.width = width;
  this.height = height;

  this.center = [(this.x1 + this.x2) / 2, (this.y1 + this.y2) / 2]

  this.name = "Zone " + name;
}

Level.Zone.CreateZone = function (x, y, width, height, name) {
  var o = Object.create( Level.Zone );
  o.initZone(x, y, width, height, name);
  return o;
}

Level.Zone.intersects = function (otherZone) {
  return this.x1 <= otherZone.x2 && this.x2 >= otherZone.x1 &&
    this.y1 <= otherZone.y2 && this.y2 >= otherZone.y1;
}

Level.Zone.randomCoordinates = function (seededRand) {
  var x = Rand.randomInt(seededRand, this.x1 + 1, this.x2 - 1);
  var y = Rand.randomInt(seededRand, this.y1 + 1, this.y2 - 1);
  return [x, y];
}

Level.Zone.randomEmptyCoordinates = function (seededRand, board) {
  var coordinates = this.randomCoordinates(seededRand);
  while (!board.isPassable(coordinates[0], coordinates[1])) {
    coordinates = this.randomCoordinates(seededRand);
  }
  return coordinates;
}

// TODO: Maybe put this into the init?
Level.Zone.setEncounter = function (boardRand, board, gameRand, encounter) {
  if (this.encounter != undefined) {
    throw new Error('Cannot double-set encounter for zone!');
  }

  // TODO: init!
  this.encounter = encounter;
  for (var ship of encounter.ships) {
    var coordinates = this.randomEmptyCoordinates(boardRand, board);
    // TODO: iffy 'private' access?
    EntityBuilder.createShipEntity(board, board._entityManager, gameRand, coordinates[0], coordinates[1], ship);
  }
}


/*********
 * Board *
 *********/
Level.Board = {}

// Again - not necessary, because not intending to link board; included as an
// exercise.
Level.Board.initBoard = function (entityManager, width, height) {
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
}

Level.Board.CreateEmptyBoard = function (entityManager, width, height) {
  var o = Object.create( Level.Board );
  o.initBoard(entityManager, width, height);
  return o;
}

Level.Board.isEdge= function (x, y) {
  return x == 0 || y == 0 || x >= this.width - 1 || y >= this.height - 1;
}

Level.Board.isTileOccupied = function (x, y) {
  var occupiers = this._entityManager.findByTag([x, y].toString());
  if (occupiers) {
    var o;
    for (o of occupiers) {
      if (o.hasComponent(Component.Position) && o.position.blocksMovement) {
        return true;
      }
    }
  }
  return false;
}

Level.Board.tileOccupiers = function (position, onlyCollidables) {
  var entities = this._entityManager.findByTag(position.toString());
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
}

// I am not going to lie. As an implementation this is not the prettiest thing
// it could be, nor is it the most elegant. I mostly copied it from the code I
// wrote when doing the 7DRL, and that code is..not the best.
//
// However, unless it turns out to be a bottleneck, I'll leave it.
Level.Board.tilesInRadius = function (position, radius) {
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
}

Level.Board.occupiersInRadius = function (position, radius, onlyCollidables) {
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
}

Level.Board.isTerrainPassable = function (x, y) {
  return (x >= 0 && y >= 0 && x < this.width && y < this.height) &&
    !this._tiles[x][y].blocked;
}

Level.Board.isPassable = function (x, y) {
  return this.isTerrainPassable(x, y) && !this.isTileOccupied(x, y);
}

Level.Board.notifyAdded = function (entity) {
  this._entityManager.addTag(entity, entity.position.getCurrentCoordinates().toString());
}

Level.Board.notifyMoved = function (entity) {
  this._entityManager.replaceTag(entity,
                                 entity.position.getLastCoordinates().toString(),
                                 entity.position.getCurrentCoordinates().toString());
}
