"use strict";

var Game = {

  cursors : null,

  board : null,
  manager : null,
  boardRand : null,
  gameRand : null,
  sector: 0,

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

  placeEmptyZones : function (manager, boardRand, newBoard) {
    var zones = [];
    var zoneGenAttempts = 0;

    while (zoneGenAttempts < Config.MAX_ZONE_GEN_ATTEMPTS && zones.length < Config.MAX_ZONES) {
      var width = Rand.randomInt(boardRand, Config.ZONE_MIN_SIZE, Config.ZONE_MAX_SIZE);
      var height = Rand.randomInt(boardRand, Config.ZONE_MIN_SIZE, Config.ZONE_MAX_SIZE);
      var x = Rand.randomInt(boardRand, 1, Config.BOARD_WIDTH - width - 2);
      var y = Rand.randomInt(boardRand, 1, Config.BOARD_HEIGHT - height - 2);

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

        // These are currently here just to mark boundaries
        EntityBuilder.createSatellite(newBoard, manager, x, y);
        EntityBuilder.createSatellite(newBoard, manager, x + width, y);
        EntityBuilder.createSatellite(newBoard, manager, x, y + height);
        EntityBuilder.createSatellite(newBoard, manager, x + width, y + height);
      }

      zoneGenAttempts++;
    }

    return zones;
  },

  buildNewBoard : function (manager, boardRand, sector) {
    var newBoard = Level.Board.CreateEmptyBoard(manager,
                                                Config.BOARD_WIDTH,
                                                Config.BOARD_HEIGHT);

    // Create sprites for the edges of the board
    for (var x = 0; x < newBoard.width; x++) {
      for (var y = 0; y < newBoard.height; y++) {
        if (!newBoard.isPassable(x, y)) {
          var sprite = game.add.sprite(x, y, 'light_gray_square');
          sprite.x = x * 30;
          sprite.y = y * 30;
        }
      }
    }

    // Generate empty zones
    var zones = Game.placeEmptyZones(manager, boardRand, newBoard);

    // Place the player in the first zone
    var player = manager.findPlayer();
    var center = zones[0].center;
    manager.addComponent(player, Component.Position.bind(null, newBoard, 0, 0));
    player.position.setCoordinates(center);

    // Add encounters to zones
    for (var i = 1; i < zones.length; i++) {
      var encounter = EncounterPicker.chooseEncounter(boardRand, sector);
      zones[i].setEncounter(boardRand, newBoard, this.gameRand, encounter);
    }

    // Add Jump Point to any non-zero zone
    var jumpZone = Rand.randomInt(boardRand, 1, zones.length - 1);
    var jumpCoordinates = zones[jumpZone].randomEmptyCoordinates(boardRand, newBoard);
    EntityBuilder.createJumpPoint(newBoard, manager, jumpCoordinates[0], jumpCoordinates[1]);

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
    var skiffEntity = EntityBuilder.createNoPositionShipEntity(this.board, this.manager, this.gameRand, EntityBuilder.Ships.PlayerSkiff);

    this.board = this.buildNewBoard(this.manager, this.boardRand, this.sector);

    // Follow the skiff
    game.world.setBounds(0, 0, this.board.width * 30, this.board.height * 30);
    game.camera.follow(skiffEntity.phaserSprite.sprite, Phaser.Camera.FOLLOW_LOCKON);

//    EntityBuilder.createShipEntity(this.board, this.manager, this.gameRand, 5, 15, EntityBuilder.Ships.Cruiser);
  },

  // TODO: Clean up this 'detach all existing items from the board' code.
  tryExecuteJump : function () {
    var player = this.manager.findPlayer();
    var jumpPoint = this.manager.findByComponent(Component.JumpPoint)[0];
    if (player.position.distanceToEntity(jumpPoint) == 0) {
      this.manager.removeComponent(player, Component.Position);
      var entitiesOnBoard = this.manager.findByComponent(Component.Position);
      for (var entity of entitiesOnBoard) {
        this.manager.removeEntity(entity);
      }
      this.sector++;
      this.board = this.buildNewBoard(this.manager, this.boardRand, this.sector);
    }
  },

  executeMove : function (dx, dy) {
    var cmd = Command.CreateMoveCommand(this.board, this.manager, dx, dy);
    var player = this.manager.findPlayer();
    return player.player.executeCommand(cmd);
  },

  takeInput : function() {
    var lastKey = game.input.keyboard.lastKey;
    if (game.time.now < this.lastInput + 100 || lastKey == undefined || !lastKey.isDown) {
      return false;
    }

    switch (lastKey.keyCode) {
      // Directions
      case Phaser.KeyCode.UP:
      case Phaser.KeyCode.NUMPAD_8:
      case Phaser.KeyCode.K:
        return this.executeMove(0, -1);

      case Phaser.KeyCode.NUMPAD_9:
      case Phaser.KeyCode.U:
        return this.executeMove(1, -1);

      case Phaser.KeyCode.RIGHT:
      case Phaser.KeyCode.NUMPAD_6:
      case Phaser.KeyCode.L:
        return this.executeMove(1, 0);

      case Phaser.KeyCode.NUMPAD_3:
      case Phaser.KeyCode.N:
        return this.executeMove(1, 1);

      case Phaser.KeyCode.NUMPAD_2:
      case Phaser.KeyCode.DOWN:
      case Phaser.KeyCode.J:
        return this.executeMove(0, 1);

      case Phaser.KeyCode.NUMPAD_1:
      case Phaser.KeyCode.B:
        return this.executeMove(-1, 1);

      case Phaser.KeyCode.NUMPAD_4:
      case Phaser.KeyCode.LEFT:
      case Phaser.KeyCode.H:
        return this.executeMove(-1, 0);

      case Phaser.KeyCode.NUMPAD_7:
      case Phaser.KeyCode.Y:
        return this.executeMove(-1, -1);

      // Jump Point
      case Phaser.KeyCode.PERIOD:
      case Phaser.KeyCode.COMMA:
        return this.tryExecuteJump();

      default:
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
        this.lastInput = game.time.now;
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
