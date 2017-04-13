var Menu = {

  preload : function () {
    game.load.image('menu', './assets/images/star.png');
  },

  create: function () {
    menu = this.add.button(0, 0, 'menu', this.startGame, this);
    menu.width = 650;
    menu.height = 400;
  },

  startGame: function () {
    this.state.start('Game');
  }

};
