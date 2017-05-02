"use strict";

var Game = {

  board : null,
  manager : null,
  drewPaths : false,

  preload : function() {
    game.load.image('white_square', './assets/images/white_square.png');
    game.load.image('light_gray_square', './assets/images/light_gray_square.png');
    game.load.image('skiff', './assets/images/skiff.png');
    game.load.image('dreadnought', './assets/images/dreadnought.png');
    game.load.image('bullet', './assets/images/bullet.png');
  },

  create: function () {
    // So the example shows the 'graphics' object being held in its own var. I
    // assume this is for if you want to have multiple 'graphics' objects?
    window.graphics = game.add.graphics(0, 0);

    this.manager = ECS.EntityManager.Create();

    this.board = Level.Board.CreateEmptyBoard(this.manager, 20, 40);
    // Phaser has a concept of tilesets, which we will want to use eventually!
    for (var x = 0; x < this.board.width; x++) {
      for (var y = 0; y < this.board.height; y++) {
        if (!this.board.isPassable(x, y)) {
          var sprite = game.add.sprite(x, y, 'light_gray_square');
          sprite.x = x * 30;
          sprite.y = y * 30;
        }
      }
    }

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

  runTurn : function(board, manager) {
    // Find next active Actor
    var actors = manager.findByComponent(Component.Actor);
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

    // Run your action(s) and end turn
    if (nextActor == manager.findPlayer()) {
      if (!this.drewPaths) {
        var pEntity;
        for (pEntity of this.manager.findByComponent(Component.ProjectileAI)) {
          var start = pEntity.projectileAI._path.currentPosition();
          var projected = pEntity.projectileAI.positionAtTicksFromNow(nextActor.actor.speed);

          window.graphics.lineStyle(10, 0xFF0000, 0.8);
          window.graphics.moveTo(start[0] * 30 + 15, start[1] * 30 + 15);
          window.graphics.lineTo(projected[0] * 30 + 15, projected[1] * 30 + 15);
        }
        this.drewPaths = true;
      }
      if (Game.takeInput()) {
        nextActor.actor.endTurn();
        window.graphics.clear();
        this.drewPaths = false;
      }
    } else if (nextActor.hasComponent(Component.FoeAI)) {
      nextActor.foeAI.takeTurn(board, manager);
      nextActor.actor.endTurn();
    } else if (nextActor.hasComponent(Component.ProjectileAI)) {
      nextActor.projectileAI.takeTurn(board);
      nextActor.actor.endTurn();
    }
  }

};
