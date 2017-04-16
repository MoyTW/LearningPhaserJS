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
    manager.addComponent(skiffEntity, Component.Position.bind(null, 0, 0));
  },

  update: function () {
    var cursors = game.input.keyboard.createCursorKeys();

    if (cursors.up.isDown)
    {
      skiffEntity.position.y -= 1;
      skiffEntity.phaserSprite.sprite.y = skiffEntity.position.y * 30;
    }
    else if (cursors.right.isDown)
    {
      skiffEntity.position.x += 1;
      skiffEntity.phaserSprite.sprite.x = skiffEntity.position.x * 30;
    }
    else if (cursors.down.isDown)
    {
      skiffEntity.position.y += 1;
      skiffEntity.phaserSprite.sprite.y = skiffEntity.position.y * 30;
    }
    else if (cursors.left.isDown)
    {
      skiffEntity.position.x -= 1;
      skiffEntity.phaserSprite.sprite.x = skiffEntity.position.x * 30;
    }
  },

};
