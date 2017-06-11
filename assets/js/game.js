"use strict";

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

        // These are current here just to mark boundaries
        EntityBuilder.createSatellite(newBoard, this.manager, x, y);
        EntityBuilder.createSatellite(newBoard, this.manager, x + width, y);
        EntityBuilder.createSatellite(newBoard, this.manager, x, y + height);
        EntityBuilder.createSatellite(newBoard, this.manager, x + width, y + height);
      }

      zoneGenAttempts++;
    }

    return zones;
  },

  buildNewBoard : function (manager, boardRand) {
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
    var player = this.manager.findPlayer();
    var center = zones[0].center;
    manager.addComponent(player, Component.Position.bind(null, newBoard, 0, 0));
    player.position.setCoordinates(center);

    // Add encounters to zones
    for (var i = 1; i < zones.length; i++) {
      var encounter = EncounterPicker.chooseEncounter(boardRand, 0);
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

    this.board = this.buildNewBoard(this.manager, this.boardRand);

    // Follow the skiff
    game.world.setBounds(0, 0, this.board.width * 30, this.board.height * 30);
    game.camera.follow(skiffEntity.phaserSprite.sprite, Phaser.Camera.FOLLOW_LOCKON);

//    EntityBuilder.createShipEntity(this.board, this.manager, this.gameRand, 5, 15, EntityBuilder.Ships.Cruiser);
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
