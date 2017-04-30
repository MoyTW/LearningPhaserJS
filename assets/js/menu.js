"use strict";

var Menu = {

  preload : function () {
    game.load.image('menu', './assets/images/star.png');
  },

  create : function () {
    var menu = this.add.button(0, 0, 'menu', this.startGame, this);
    menu.width = 600;
    menu.height = 450;

    // The version of Phaser I'm using doesn't have addKeys!?!?!?
    this.spaceKey = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    this.enterKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);
  },

  startGame : function () {
    this.state.start('Game');
  },

  update : function () {
    if (this.spaceKey.isDown || this.enterKey.isDown) {
      this.startGame();
    }
  }

};
