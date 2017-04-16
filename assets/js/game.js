"use strict";

var board;
var manager = new ECS.EntityManager();

var Game = {

  preload : function() {
    game.load.image('white_square', './assets/images/white_square.png');
    game.load.image('skiff', './assets/images/skiff.png');
    game.load.image('dreadnought', './assets/images/dreadnought.png');
  },

  create: function () {
    menu.width = 650;
    menu.height = 400;

    board = new Level.Board(15, 15);
    // Phaser has a concept of tilesets, which we will want to use eventually!
    for (var x = 0; x < board.width; x++) {
      for (var y = 0; y < board.height; y++) {
        if (!board.isPassable(x, y)) {
          var sprite = game.add.sprite(x, y, 'white_square');
          sprite.x = x * 30;
          sprite.y = y * 30;
        }
      }
    }

    var skiffEntity = manager.createEntity();
    // Honestly, this is a little silly, isn't it? I mean, I know partials are
    // second-nature for lispy folks but javascript's this is apparently a pit
    // of vipers.
    manager.addComponent(skiffEntity, Component.Player);
    manager.addComponent(skiffEntity, Component.Actor.bind(null, 100));
    manager.addComponent(skiffEntity, Component.Position.bind(null, board, 5, 5));
    var SpriteComponent = Component.PhaserSprite.bind(null,
                                                      skiffEntity.position.x,
                                                      skiffEntity.position.y,
                                                      'skiff');
    manager.addComponent(skiffEntity, SpriteComponent);

    var dreadnought = manager.createEntity();
    // Honestly, this is a little silly, isn't it? I mean, I know partials are
    // second-nature for lispy folks but javascript's this is apparently a pit
    // of vipers.
    manager.addComponent(dreadnought, Component.Position.bind(null, board, 10, 10));
    manager.addComponent(dreadnought, Component.Actor.bind(null, 200));
    SpriteComponent = Component.PhaserSprite.bind(null,
                                                  dreadnought.position.x,
                                                  dreadnought.position.y,
                                                  'dreadnought');
    manager.addComponent(dreadnought, SpriteComponent);
    manager.addComponent(dreadnought, Component.FoeAI.bind(null, board, dreadnought.position));
  },

  takeInput : function() {
    var cursors = game.input.keyboard.createCursorKeys();
    var player = manager.findPlayer();

    if (cursors.up.isDown) {
      player.position.step(0, -1);
      return true;
    } else if (cursors.right.isDown) {
      player.position.step(1, 0);
      return true;
    } else if (cursors.down.isDown) {
      player.position.step(0, 1);
      return true;
    } else if (cursors.left.isDown) {
      player.position.step(-1, 0);
      return true;
    } else {
      return false;
    }
  },

  update: function () {
    Game.runTurn(board, manager);
  },

  runTurn : function(board, manager) {
    // Find next active Actor
    var actors = manager.findByComponent(Component.Actor);
    var minTTL = 9999;
    var nextActor = null;
    var minActor = null;
    for (var i = 0; i < actors.length; i++) {
      if (actors[i].actor.ttl == 0) {
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
      if (Game.takeInput()) {
        nextActor.actor.endTurn();
      }
    } else if (nextActor.hasComponent(Component.FoeAI)) {
      var player = manager.findPlayer();
      nextActor.foeAI.pathTowards(player.position.x, player.position.y);
      nextActor.actor.endTurn();
    }
  }

};
