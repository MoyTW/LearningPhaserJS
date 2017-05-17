"use strict";

// Generates a random int from min to max, inclusive
function randomInt(seededRand, min, max) {
  return Math.floor(seededRand() * (max - min + 1)) + min;
}

var Game = {

  board : null,
  manager : null,
  boardRand : null,
  gameRand : null,

  preload : function() {
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

    var skiffEntity = EntityBuilder.createPlayer(this.board, this.manager, this.gameRand, 5, 5);

    // Follow the skiff
    game.world.setBounds(0, 0, this.board.width * 30, this.board.height * 30);
    game.camera.follow(skiffEntity.phaserSprite.sprite, Phaser.Camera.FOLLOW_LOCKON);

    EntityBuilder.createScout(this.board, this.manager, this.gameRand, 10, 10);
  },

  takeInput : function() {
    // You don't need to re-create these objects every time, actually! See: Menu
    // input code.
    var cursors = game.input.keyboard.createCursorKeys();
    var player = this.manager.findPlayer();

    if (cursors.up.isDown) {
      var cmd = Command.CreateMoveCommand(this.board, this.manager, 0, -1);
      return player.player.executeCommand(cmd);
    } else if (cursors.right.isDown) {
      var cmd = Command.CreateMoveCommand(this.board, this.manager, 1, 0);
      return player.player.executeCommand(cmd);
    } else if (cursors.down.isDown) {
      var cmd = Command.CreateMoveCommand(this.board, this.manager, 0, 1);
      return player.player.executeCommand(cmd);
    } else if (cursors.left.isDown) {
      var cmd = Command.CreateMoveCommand(this.board, this.manager, -1, 0);
      return player.player.executeCommand(cmd);
    } else {
      return false;
    }
  },

  update: function () {
    Game.runTurn(this.board, this.manager);
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

  runTurn : function(board, manager) {
    var actors = manager.findByComponent(Component.Actor);
    var nextActor = this.gotoNextActor(actors);

    // Run your action(s) and end turn
    if (nextActor == manager.findPlayer()) {
      if (Game.takeInput()) {
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
