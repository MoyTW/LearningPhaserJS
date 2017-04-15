"use strict";

var skiffEntity;
var manager = new ECS.EntityManager();

var Game = {

  preload : function() {
    game.load.image('skiff', './assets/images/skiff.png');
  },

  create: function () {
    menu.width = 650;
    menu.height = 400;
    skiffEntity = manager.createEntity();
    // Honestly, this is a little silly, isn't it? I mean, I know partials are
    // second-nature for lispy folks but javascript's this is apparently a pit
    // of vipers.
    var SpriteComponent = Component.PhaserSprite.bind(null, 0, 0, 'skiff');
    manager.addComponent(skiffEntity, SpriteComponent);
  },

  update: function () {
    var cursors = game.input.keyboard.createCursorKeys();

    if (cursors.up.isDown)
    {
      skiffEntity.phaserSprite.sprite.y -= 5;
    }
    else if (cursors.right.isDown)
    {
      skiffEntity.phaserSprite.sprite.x += 5;
    }
    else if (cursors.down.isDown)
    {
      skiffEntity.phaserSprite.sprite.y += 5;
    }
    else if (cursors.left.isDown)
    {
      skiffEntity.phaserSprite.sprite.x -= 5;
    }
  },

};
