const config = {
    type: Phaser.CANVAS,
    width: 1000,
    height: 800,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.NO_CENTER
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
            //debug: true
        }
    },
    scene: [EscenaMenu, EscenaJuego, EscenaDinoRun, EscenaBiodiversidad, EscenaEnergia, EscenaSustentable, EscenaSustentable2, EscenaSustentable3]
};

const game = new Phaser.Game(config);
window.game = game;
