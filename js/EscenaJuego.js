class EscenaJuego extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaJuego' });
    }

    init(data) {
        this.ignoreEscape = Boolean(data && data.ignoreEscape);
    }

    preload() {
        this.load.spritesheet('jugador', 'pictures/plantilla.png', {
            frameWidth: 102,
            frameHeight: 153
        });
        this.load.image('arbusto', 'pictures/arbusto.png');
    }

    create() {
        const anchoMundo = 2000;
        const altoMundo = 1200;

        this.ultimaPosSegura = { x: 160, y: 420 };
        this.enPortal = false;

        this.physics.world.setBounds(0, 0, anchoMundo, altoMundo);
        this.cameras.main.setBounds(0, 0, anchoMundo, altoMundo);

        let fondoPasto = this.make.graphics({ x: 0, y: 0, add: false });
        fondoPasto.fillStyle(0x27ae60, 1);
        fondoPasto.fillRect(0, 0, anchoMundo, altoMundo);
        fondoPasto.generateTexture('textura_pasto', anchoMundo, altoMundo);
        this.add.image(anchoMundo / 2, altoMundo / 2, 'textura_pasto');

        const mitadArbusto = 75;

        for (let x = mitadArbusto; x <= anchoMundo - mitadArbusto; x += 90) {
            this.add.image(x, mitadArbusto, 'arbusto').setDisplaySize(150, 150);
            this.add.image(x, altoMundo - mitadArbusto, 'arbusto').setDisplaySize(150, 150);
        }

        for (let y = mitadArbusto; y <= altoMundo - mitadArbusto; y += 95) {
            this.add.image(mitadArbusto, y, 'arbusto').setDisplaySize(150, 150);
            this.add.image(anchoMundo - mitadArbusto, y, 'arbusto').setDisplaySize(150, 150);
        }

        let edificios = this.add.graphics();
        edificios.fillStyle(0x7f8c8d, 1);
        edificios.fillRect(70, 230, 150, 170);
        edificios.fillRect(70, 760, 170, 190);
        edificios.lineStyle(4, 0x34495e, 1);
        edificios.strokeRect(70, 230, 150, 170);
        edificios.strokeRect(70, 760, 170, 190);
        this.add.text(145, 315, 'EDIFICIO', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(155, 855, 'AUDITORIO', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        let gSala = this.make.graphics({ x: 0, y: 0, add: false });
        gSala.fillStyle(0xe74c3c, 0.4);
        gSala.lineStyle(4, 0xe74c3c, 1);
        gSala.fillCircle(60, 60, 60);
        gSala.generateTexture('textura_sala', 120, 120);

        this.anims.create({ key: 'caminar-abajo', frames: this.anims.generateFrameNumbers('jugador', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'caminar-izquierda', frames: this.anims.generateFrameNumbers('jugador', { start: 8, end: 11 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'caminar-derecha', frames: this.anims.generateFrameNumbers('jugador', { start: 12, end: 15 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'caminar-arriba', frames: this.anims.generateFrameNumbers('jugador', { start: 4, end: 7 }), frameRate: 8, repeat: -1 });

        let graficosBorde = this.add.graphics();
        let graficosCamino = this.add.graphics();
        graficosBorde.lineStyle(76, 0x1e272c, 1);
        graficosCamino.lineStyle(70, 0x7f8c8d, 1);

        let caminoOriginal = new Phaser.Curves.Spline([
            160, 420,
            280, 300,
            420, 220,
            700, 180,
            1050, 180,
            1400, 190,
            1680, 300,
            1780, 450,
            1800, 650,
            1750, 800,
            1600, 900,
            1400, 940,
            1100, 900,
            850, 760,
            600, 620,
            380, 560,
            220, 580,
            160, 620
        ]);

        let entradaBorde = this.add.graphics();
        let entradaPasto = this.add.graphics();
        entradaBorde.lineStyle(116, 0x1e272c, 1);
        entradaPasto.lineStyle(100, 0x7f8c8d, 1);

        caminoOriginal.draw(graficosBorde, 64);
        caminoOriginal.draw(graficosCamino, 64);

        let graficosRamalesBorde = this.add.graphics();
        let graficosRamales = this.add.graphics();
        graficosRamalesBorde.lineStyle(56, 0x1e272c, 1);
        graficosRamales.lineStyle(50, 0x7f8c8d, 1);

        let caminoDino = new Phaser.Curves.Spline([400, 220, 350, 175, 300, 130, 300, 90]);
        let caminoSalaC = new Phaser.Curves.Spline([820, 180, 800, 320, 820, 460, 820, 600]);
        let caminoSalaB = new Phaser.Curves.Spline([1780, 450, 1840, 450]);
        let caminoSalaA = new Phaser.Curves.Spline([1400, 940, 1400, 1080]);

        caminoDino.draw(graficosRamalesBorde, 42); caminoDino.draw(graficosRamales, 42);
        caminoSalaC.draw(graficosRamalesBorde, 32); caminoSalaC.draw(graficosRamales, 32);
        caminoSalaB.draw(graficosRamalesBorde, 32); caminoSalaB.draw(graficosRamales, 32);
        caminoSalaA.draw(graficosRamalesBorde, 32); caminoSalaA.draw(graficosRamales, 32);

        this.salas = this.physics.add.staticGroup();

        let salaD = this.salas.create(300, 90, 'textura_sala');
        salaD.setData({ nombre: 'Dino', salida: { x: 350, y: 150 } });
        this.add.text(275, 80, 'DINO', { fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial' });

        let salaA = this.salas.create(1400, 1080, 'textura_sala');
        salaA.setData({ nombre: 'Sala A', salida: { x: 1400, y: 1000 } });
        this.add.text(1375, 1070, 'SALA A', { fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial' });

        let salaB = this.salas.create(1840, 450, 'textura_sala');
        salaB.setData({ nombre: 'Sala B', salida: { x: 1750, y: 450 } });
        this.add.text(1815, 440, 'SALA B', { fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial' });

        let salaC = this.salas.create(820, 600, 'textura_sala');
        salaC.setData({ nombre: 'Sala C', salida: { x: 820, y: 510 } });
        this.add.text(795, 590, 'SALA C', { fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial' });

        this.salas.children.iterate((sala) => { sala.body.setCircle(60); });

        this.jugador = this.physics.add.sprite(160, 420, 'jugador', 0);
        this.jugador.setDisplaySize(40, 60);
        this.jugador.body.setSize(40, 72, true);
        this.jugador.play('caminar-abajo');
        this.jugador.setCollideWorldBounds(true);
        // La camara sigue al jugador con un efecto de suavizado
        this.cameras.main.startFollow(this.jugador, true, 0.08, 0.08);

        this.physics.add.overlap(this.jugador, this.salas, this.entrarAAnuncioPortal, null, this);

        this.teclado = this.input.keyboard.createCursorKeys();
        this.teclaESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.teclaENTER = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.textoPortal = this.add.text(500, 400, '', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 20, y: 20 },
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(10); //setScrollFactor(0) para que el texto no se mueva con la cámara y setDepth(10) para que esté por encima de otros elementos

        this.add.text(10, 10, 'Presiona [ESC] para volver al Menú principal', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#111111',
            padding: { x: 5, y: 5 }
        }).setScrollFactor(0).setDepth(10);

        let botonMenu = this.add.text(800, 20, 'VOLVER AL MENÚ', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#c0392b',
            fontFamily: 'Arial',
            padding: { x: 10, y: 8 }
        }).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(10);

        botonMenu.on('pointerdown', () => {
            this.scene.start('EscenaMenu');
        });

        botonMenu.on('pointerover', () => botonMenu.setStyle({ fill: '#f1c40f' }));
        botonMenu.on('pointerout', () => botonMenu.setStyle({ fill: '#ffffff' }));
    }

    update() {
        if (this.enPortal) {
            this.jugador.setVelocity(0);

            if (Phaser.Input.Keyboard.JustDown(this.teclaENTER) ||
                Phaser.Input.Keyboard.JustDown(this.teclaESC)) {
                this.textoPortal.setVisible(false);
                this.enPortal = false;
                this.reiniciarJugador();
            }
            return;
        }

        if (this.ignoreEscape) {
            if (!this.teclaESC.isDown) this.ignoreEscape = false;
        } else if (Phaser.Input.Keyboard.JustDown(this.teclaESC)) {
            this.scene.start('EscenaMenu');
            return;
        }

        let posPreviaX = this.jugador.x;
        let posPreviaY = this.jugador.y;
        this.jugador.setVelocity(0);

        if (this.teclado.left.isDown) this.jugador.setVelocityX(-160);
        else if (this.teclado.right.isDown) this.jugador.setVelocityX(160);

        if (this.teclado.up.isDown) this.jugador.setVelocityY(-160);
        else if (this.teclado.down.isDown) this.jugador.setVelocityY(160);

        if (this.jugador.body.velocity.x < 0) this.jugador.anims.play('caminar-izquierda', true);
        else if (this.jugador.body.velocity.x > 0) this.jugador.anims.play('caminar-derecha', true);
        else if (this.jugador.body.velocity.y < 0) this.jugador.anims.play('caminar-arriba', true);
        else if (this.jugador.body.velocity.y > 0) this.jugador.anims.play('caminar-abajo', true);

        if (this.sys.game.canvas) {
            let ctx = this.sys.game.canvas.getContext('2d');
            let camara = this.cameras.main;
            let pixelX = Math.floor(this.jugador.x - camara.scrollX);
            let pixelY = Math.floor(this.jugador.y + 10 - camara.scrollY);

            if (pixelX < 0 || pixelY < 0 ||
                pixelX >= this.sys.game.canvas.width ||
                pixelY >= this.sys.game.canvas.height) {
                return;
            }

            let pixel = ctx.getImageData(pixelX, pixelY, 1, 1).data;
            let r = pixel[0];
            let g = pixel[1];
            let b = pixel[2];

            if (r === 39 && g === 174 && b === 96) {
                this.jugador.x = this.ultimaPosSegura.x;
                this.jugador.y = this.ultimaPosSegura.y;
                this.jugador.setVelocity(0);
            } else {
                this.ultimaPosSegura.x = posPreviaX;
                this.ultimaPosSegura.y = posPreviaY;
            }
        }
    }

    entrarAAnuncioPortal(jugador, sala) {
        if (this.enPortal) return;

        if (sala.getData('nombre') === 'Dino') {
            this.scene.start('EscenaDinoRun');
            return;
        }

        this.enPortal = true;
        this.salaActual = sala;
        let destino = sala.getData('nombre');

        this.textoPortal.setText(
            `¡Portal Detectado: ${destino}!\n\n` +
            `Presiona [ENTER] para Cerrar\n` +
            `Presiona [ESC] para salir de la sala`
        );
        this.textoPortal.setVisible(true);
    }

    reiniciarJugador() {
        let salida = this.salaActual
            ? this.salaActual.getData('salida')
            : { x: 160, y: 420 };

        this.jugador.x = salida.x;
        this.jugador.y = salida.y;
        this.ultimaPosSegura = { x: salida.x, y: salida.y };
        this.salaActual = null;
    }
}
