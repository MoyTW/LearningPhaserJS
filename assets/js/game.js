"use strict";

// Generates a random int from min to max, inclusive
function randomInt(seededRand, min, max) {
  return Math.floor(seededRand() * (max - min + 1)) + min;
}

// weights must be a reducible data structure. Annoying the map iterators aren't
// reducible by default in javascript (!?!?) so you can't actually call this on
// the iterator provided by map.keys(). Really, js?
function randomIndex(seededRand, weights) {
  var selection = randomInt(seededRand, 0, weights.reduce((a, b) => a+b, 0));

  var sum = 0;
  var idx = 0;
  for (var weight of weights) {
    sum += weight;
    if (selection <= sum) {
      return idx;
    }
    idx++;
  }
}

// weights must be a reducible data structure
function randomSelection(seededRand, options, weights) {
  var idx = randomIndex(seededRand, weights);
  return options[idx];
}

var Game = {

  cursors : null,

  board : null,
  manager : null,
  boardRand : null,
  gameRand : null,

  lastInput : 0,

  preload : function() {
    this.cursors = game.input.keyboard.createCursorKeys(),

    game.load.image('white_square', './assets/images/white_square.png');
    game.load.image('light_gray_square', './assets/images/light_gray_square.png');
    game.load.image('skiff', './assets/images/skiff.png');
    game.load.image('dreadnought', './assets/images/dreadnought.png');
    game.load.image('bullet', './assets/images/bullet.png');
    game.load.image('satellite', './assets/images/satellite.png');
    EntityBuilder.loadImages();
  },

  buildNewBoard : function (manager, boardRand) {
    var newBoard = Level.Board.CreateEmptyBoard(manager,
                                                Config.BOARD_WIDTH,
                                                Config.BOARD_HEIGHT);

    for (var x = 0; x < newBoard.width; x++) {
      for (var y = 0; y < newBoard.height; y++) {
        if (!newBoard.isPassable(x, y)) {
          var sprite = game.add.sprite(x, y, 'light_gray_square');
          sprite.x = x * 30;
          sprite.y = y * 30;
        }
      }
    }

    var zones = [];
    var zoneGenAttempts = 0;
    while (zoneGenAttempts < Config.MAX_ZONE_GEN_ATTEMPTS && zones.length < Config.MAX_ZONES) {
      var width = randomInt(boardRand, Config.ZONE_MIN_SIZE, Config.ZONE_MAX_SIZE);
      var height = randomInt(boardRand, Config.ZONE_MIN_SIZE, Config.ZONE_MAX_SIZE);
      var x = randomInt(boardRand, 0, Config.BOARD_WIDTH - width - 1);
      var y = randomInt(boardRand, 0, Config.BOARD_HEIGHT - height - 1);

      var newZone = Level.Zone.CreateZone(x, y, width, height, zones.length);

      var intersects = false;
      for (var existingZone of zones) {
        if (existingZone.intersects(newZone)) {
          intersects = true;
          break;
        }
      }

      if (!intersects) {
        zones.push(newZone);

        EntityBuilder.createSatellite(newBoard, this.manager, x, y);
        EntityBuilder.createSatellite(newBoard, this.manager, x + width, y);
        EntityBuilder.createSatellite(newBoard, this.manager, x, y + height);
        EntityBuilder.createSatellite(newBoard, this.manager, x + width, y + height);
      }

      zoneGenAttempts++;
    }

    return newBoard;
  },

  create: function () {
    // Seed the randomizer
    this.boardRand = new Math.seedrandom('seed');
    this.gameRand = new Math.seedrandom('other seed');

    // So the example shows the 'graphics' object being held in its own var. I
    // assume this is for if you want to have multiple 'graphics' objects?
    window.graphics = game.add.graphics(0, 0);

    this.manager = ECS.EntityManager.Create();
    this.board = this.buildNewBoard(this.manager, this.boardRand);

    var skiffEntity = EntityBuilder.createShipEntity(this.board, this.manager, this.gameRand, 5, 5, EntityBuilder.Ships.PlayerSkiff);

    // Follow the skiff
    game.world.setBounds(0, 0, this.board.width * 30, this.board.height * 30);
    game.camera.follow(skiffEntity.phaserSprite.sprite, Phaser.Camera.FOLLOW_LOCKON);

    EntityBuilder.createShipEntity(this.board, this.manager, this.gameRand, 10, 10, EntityBuilder.Ships.Scout);
    EntityBuilder.createShipEntity(this.board, this.manager, this.gameRand, 12, 12, EntityBuilder.Ships.Gunship);
    EntityBuilder.createShipEntity(this.board, this.manager, this.gameRand, 15, 15, EntityBuilder.Ships.Fighter);
  },

  takeInput : function() {
    if (game.time.now < this.lastInput + 100) {
      return false;
    }
    var player = this.manager.findPlayer();

    if (this.cursors.up.isDown) {
      this.lastInput = game.time.now;
      var cmd = Command.CreateMoveCommand(this.board, this.manager, 0, -1);
      return player.player.executeCommand(cmd);
    } else if (this.cursors.right.isDown) {
      this.lastInput = game.time.now;
      var cmd = Command.CreateMoveCommand(this.board, this.manager, 1, 0);
      return player.player.executeCommand(cmd);
    } else if (this.cursors.down.isDown) {
      this.lastInput = game.time.now;
      var cmd = Command.CreateMoveCommand(this.board, this.manager, 0, 1);
      return player.player.executeCommand(cmd);
    } else if (this.cursors.left.isDown) {
      this.lastInput = game.time.now;
      var cmd = Command.CreateMoveCommand(this.board, this.manager, -1, 0);
      return player.player.executeCommand(cmd);
    } else {
      return false;
    }
  },

  update: function () {
    this.runUntilInputRequired(this.board, this.manager);
  },

  gotoNextActor : function (actors) {
    var minTTL = 9999;
    var nextActor = null;
    var minActor = null;
    for (var i = 0; i < actors.length; i++) {
      if (actors[i].actor.ttl == 0 && actors[i].actor.speed == 0) {
        nextActor = actors[i];
        break;
      } else if (actors[i].actor.ttl < minTTL) {
        minTTL = actors[i].actor.ttl;
        minActor = actors[i];
      }
    }

    // If no active Actors, fast forward
    if (nextActor == null) {
      nextActor = minActor;
      for (var i = 0; i < actors.length; i++) {
        actors[i].actor.passTime(minTTL);
      }
    }

    return nextActor;
  },

  drawProjectilePaths : function (manager) {
    window.graphics.clear();
    var player = manager.findPlayer();

    if (!player) {
      return false;
    }

    for (var pEntity of manager.findByComponent(Component.ProjectileAI)) {
      var start = pEntity.projectileAI._path.currentPosition();
      var projected = pEntity.projectileAI.positionAtTicksFromNow(player.actor.speed);

      window.graphics.lineStyle(10, 0xFF0000, 0.8);
      window.graphics.moveTo(start[0] * 30 + 15, start[1] * 30 + 15);
      window.graphics.lineTo(projected[0] * 30 + 15, projected[1] * 30 + 15);
    }
    return true;
  },

  runUntilInputRequired : function (board, manager) {
    var nextActor;

    // Note how the nextActor is assigned. The nextActor is found and then a
    // turn is *immediately* taken, so if it does hit the nextActor == player,
    // that means the player turn is in fact over.
    //
    // There *could* be a perf hit from running all the nextActor stuff
    // constantly but - well, I guess it might eat a little battery? I'll keep
    // the next actor as a derived property for now.
    while (nextActor != manager.findPlayer() && manager.findPlayer() != null) {
      var actors = manager.findByComponent(Component.Actor);
      nextActor = this.gotoNextActor(actors);
      this.runTurn(board, manager, nextActor);
    }
  },

  runTurn : function(board, manager, nextActor) {
    // Run your action(s) and end turn
    if (nextActor == manager.findPlayer()) {
      if (this.takeInput()) {
        nextActor.actor.endTurn();
        this.drawProjectilePaths(manager);
      }
    } else if (nextActor.hasComponent(Component.FoeAI)) {
      nextActor.foeAI.takeTurn(board, manager);
      nextActor.actor.endTurn();
      this.drawProjectilePaths(manager);
    } else if (nextActor.hasComponent(Component.ProjectileAI)) {
      nextActor.projectileAI.takeTurn(board);
      nextActor.actor.endTurn();
      this.drawProjectilePaths(manager);
    }
  }

};
