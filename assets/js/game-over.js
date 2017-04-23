"use strict";

var GameOver = {

  preload : function () { },

  create : function () {
    var textParams = {boundsAlignH: "center",
                      boundsAlignV: "middle",
                      fontSize: '64px',
                      fill: '#FFF' };
    var text = game.add.text(0, 0, 'RIP You', textParams);
    text.setTextBounds(0, 0, this.world.width, this.world.height);

    this.spaceKey = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    this.enterKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);
  },

  endGame : function () {
    this.state.start('Menu');
  },

  update : function () {
    if (this.spaceKey.isDown || this.enterKey.isDown) {
      this.endGame();
    }
  }

};
