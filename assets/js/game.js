"use strict";

// Generates a random int from min to max, inclusive
function randomInt(seededRand, min, max) {
  return Math.floor(seededRand() * (max - min + 1)) + min;
}

var Game = {

  board : null,
  manager : null,
  boardRand : null,

  preload : function() {
    game.load.image('white_square', './assets/images/white_square.png');
    game.load.image('light_gray_square', './assets/images/light_gray_square.png');
    game.load.image('skiff', './assets/images/skiff.png');
    game.load.image('dreadnought', './assets/images/dreadnought.png');
    game.load.image('bullet', './assets/images/bullet.png');
    game.load.image('satellite', './assets/images/satellite.png');
  },

  createSatellite : function (board, manager, x, y) {
    var satellite = manager.createEntity();

    var cPosition = Component.Position.bind(null, board, x, y, true);
    manager.addComponent(satellite, cPosition);

    var cSprite = Component.PhaserSprite.bind(null, x, y, 'satellite');
    manager.addComponent(satellite, cSprite);

    var cFighter = Component.Fighter.bind(null, 15, 0, 5);
    manager.addComponent(satellite, cFighter);

    return satellite;
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

        this.createSatellite(this.board, this.manager, x, y);
        this.createSatellite(this.board, this.manager, x + width, y);
        this.createSatellite(this.board, this.manager, x, y + height);
        this.createSatellite(this.board, this.manager, x + width, y + height);
      }

      zoneGenAttempts++;
    }

    return newBoard;
  },

  create: function () {
    // Seed the randomizer
    this.boardRand = new Math.seedrandom('seed');

    // So the example shows the 'graphics' object being held in its own var. I
    // assume this is for if you want to have multiple 'graphics' objects?
    window.graphics = game.add.graphics(0, 0);

    this.manager = ECS.EntityManager.Create();
    this.board = this.buildNewBoard(this.manager, this.boardRand);

    var skiffEntity = this.manager.createEntity();
    // Honestly, this is a little silly, isn't it? I mean, I know partials are
    // second-nature for lispy folks but javascript's this is apparently a pit
    // of vipers.
    this.manager.addComponent(skiffEntity, Component.Player);
    this.manager.addComponent(skiffEntity, Component.Actor.bind(null, 100));
    var cp = Component.Position.bind(null, this.board, 5, 5);
    this.manager.addComponent(skiffEntity, cp);
    var cSprite = Component.PhaserSprite.bind(null,
                                              skiffEntity.position.x,
                                              skiffEntity.position.y,
                                              'skiff');
    this.manager.addComponent(skiffEntity, cSprite);
    this.manager.addComponent(skiffEntity,
                              Component.Fighter.bind(null, 15, 0, 5));
    var onPlayerDestroyed = function () { game.state.start('GameOver'); }
    var cd = Component.Destroyable.bind(null, this.manager,onPlayerDestroyed)
    this.manager.addComponent(skiffEntity, cd);

    // Follow the skiff
    game.world.setBounds(0, 0, this.board.width * 30, this.board.height * 30);
    game.camera.follow(skiffEntity.phaserSprite.sprite, Phaser.Camera.FOLLOW_LOCKON);

    var dreadnought = this.manager.createEntity();
    // Honestly, this is a little silly, isn't it? I mean, I know partials are
    // second-nature for lispy folks but javascript's this is apparently a pit
    // of vipers.
    cp = Component.Position.bind(null, this.board, 10, 10);
    this.manager.addComponent(dreadnought, cp);
    this.manager.addComponent(dreadnought, Component.Actor.bind(null, 200));
    cSprite = Component.PhaserSprite.bind(null,
                                          dreadnought.position.x,
                                          dreadnought.position.y,
                                          'dreadnought');
    this.manager.addComponent(dreadnought, cSprite);
    this.manager.addComponent(dreadnought, Component.FoeAI);
    this.manager.addComponent(dreadnought,
                              Component.Fighter.bind(null, 10, 0, 2));
    this.manager.addComponent(dreadnought,
                              Component.Destroyable.bind(null, this.manager));
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
    var pEntity;
    for (pEntity of manager.findByComponent(Component.ProjectileAI)) {
      var start = pEntity.projectileAI._path.currentPosition();
      var player = manager.findPlayer();
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
