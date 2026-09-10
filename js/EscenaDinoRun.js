class EscenaDinoRun extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaDinoRun' });
    }

    preload() {
        this.load.spritesheet('jugador-run', 'pictures/plantilla.png', {
            frameWidth: 102,
            frameHeight: 153
        });
    }

    create() {
        this.cameras.main.setBackgroundColor('#17202b');
        this.puntuacion = 0;
        this.mejorPuntuacion = Number(localStorage.getItem('muchbits-dino-mejor-puntuacion') || 0);
        this.velocidad = 300;
        this.terminado = false;
        this.temporizadorObstaculo = 850;

        this.crearTexturas();
        this.crearFondo();
        this.crearControles();
        this.crearJugador();
        this.crearInterfaz();
        this.crearObstaculos();
    }

    crearTexturas() {
        const obstaculoBajo = this.make.graphics({ x: 0, y: 0, add: false });
        obstaculoBajo.fillStyle(0xd35400, 1);
        obstaculoBajo.fillRoundedRect(4, 4, 44, 52, 8);
        obstaculoBajo.fillStyle(0xf39c12, 1);
        obstaculoBajo.fillRect(12, 12, 8, 32);
        obstaculoBajo.generateTexture('dino-obstaculo-bajo', 52, 60);

        const obstaculoAlto = this.make.graphics({ x: 0, y: 0, add: false });
        obstaculoAlto.fillStyle(0x8e44ad, 1);
        obstaculoAlto.fillRoundedRect(4, 4, 102, 22, 8);
        obstaculoAlto.fillStyle(0xd7bde2, 1);
        obstaculoAlto.fillRect(20, 9, 28, 5);
        obstaculoAlto.generateTexture('dino-obstaculo-alto', 110, 30);

        const suelo = this.make.graphics({ x: 0, y: 0, add: false });
        suelo.fillStyle(0x253b2b, 1);
        suelo.fillRect(0, 0, 1000, 60);
        suelo.generateTexture('dino-suelo', 1000, 60);
    }

    crearFondo() {
        this.fondo = this.add.graphics();
        this.fondo.fillStyle(0x17202b, 1);
        this.fondo.fillRect(0, 0, 1000, 800);
        this.fondo.fillStyle(0x253b2b, 1);
        this.fondo.fillRect(0, 580, 1000, 220);
        this.fondo.lineStyle(5, 0x7ed957, 1);
        this.fondo.lineBetween(0, 580, 1000, 580);
        this.fondo.lineStyle(2, 0x35563a, 1);
        for (let x = 0; x < 1000; x += 55) {
            this.fondo.lineBetween(x, 610, x + 25, 610);
            this.fondo.lineBetween(x + 20, 675, x + 48, 675);
        }

        this.suelo = this.physics.add.staticImage(500, 610, 'dino-suelo');
        this.suelo.setVisible(false);
    }

    crearControles() {
        this.teclado = this.input.keyboard.createCursorKeys();
        this.teclaEspacio = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.teclaESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.teclaENTER = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.input.keyboard.on('keydown-ESC', this.salirAlMapa, this);
    }

    crearJugador() {
        if (!this.anims.exists('dino-run-derecha')) {
            this.anims.create({
                key: 'dino-run-derecha',
                frames: this.anims.generateFrameNumbers('jugador-run', { start: 12, end: 15 }),
                frameRate: 8,
                repeat: -1
            });
        }

        this.jugador = this.physics.add.sprite(220, 550, 'jugador-run', 12);
        this.jugador.setDisplaySize(40, 60);
        this.jugador.body.setSize(40, 60, true);
        this.jugador.body.setGravityY(1050);
        this.jugador.setCollideWorldBounds(false);
        this.jugador.play('dino-run-derecha');
        this.physics.add.collider(this.jugador, this.suelo);
    }

    crearInterfaz() {
        this.add.text(28, 24, 'DINO RUN', {
            fontSize: '30px',
            fill: '#7ed957',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        });
        this.add.text(30, 70, 'FLECHA ARRIBA / ESPACIO: saltar    FLECHA ABAJO: agacharse', {
            fontSize: '16px',
            fill: '#d5e8d4',
            fontFamily: 'Arial'
        });
        this.textoPuntuacion = this.add.text(970, 30, '', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(1, 0);
        this.textoEstado = this.add.text(500, 355, '', {
            fontSize: '28px',
            fill: '#ffffff',
            backgroundColor: '#111111',
            padding: { x: 22, y: 18 },
            align: 'center',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setVisible(false);
    }

    crearObstaculos() {
        this.obstaculos = this.physics.add.group();
        this.physics.add.overlap(this.jugador, this.obstaculos, this.terminar, null, this);
        this.crearObstaculo(760, 'bajo');
        this.crearObstaculo(1060, 'alto');
    }

    crearObstaculo(x, tipo) {
        const obstaculo = this.obstaculos.create(
            x,
            tipo === 'bajo' ? 550 : 512,
            tipo === 'bajo' ? 'dino-obstaculo-bajo' : 'dino-obstaculo-alto'
        );
        obstaculo.body.setAllowGravity(false);
        obstaculo.body.setImmovable(true);
        obstaculo.body.setVelocityX(-this.velocidad);
        return obstaculo;
    }

    update(time, delta) {
        if (this.terminado) {
            if (Phaser.Input.Keyboard.JustDown(this.teclaENTER) || Phaser.Input.Keyboard.JustDown(this.teclaEspacio)) {
                this.reiniciar();
            }
            return;
        }

        const enSuelo = this.jugador.body.blocked.down || this.jugador.body.touching.down;
        if ((Phaser.Input.Keyboard.JustDown(this.teclado.up) || Phaser.Input.Keyboard.JustDown(this.teclaEspacio)) && enSuelo) {
            this.jugador.setVelocityY(-620);
        }

        if (this.teclado.down.isDown && enSuelo) {
            this.jugador.setDisplaySize(40, 40);
            this.jugador.body.setSize(40, 40, true);
            this.jugador.y = 560;
        } else if (!this.teclado.down.isDown) {
            this.jugador.setDisplaySize(40, 60);
            this.jugador.body.setSize(40, 60, true);
        }

        this.puntuacion += delta * 0.01;
        this.velocidad = Math.min(620, 300 + this.puntuacion * 1.8);
        this.temporizadorObstaculo -= delta;
        this.textoPuntuacion.setText(`PUNTOS ${Math.floor(this.puntuacion)}   MEJOR ${this.mejorPuntuacion}`);

        this.obstaculos.children.iterate((obstaculo) => {
            if (obstaculo && obstaculo.active) {
                obstaculo.body.setVelocityX(-this.velocidad);
                if (obstaculo.x < -100) obstaculo.destroy();
            }
        });

        if (this.temporizadorObstaculo <= 0) {
            this.crearObstaculo(1050, Phaser.Math.Between(0, 1) === 0 ? 'bajo' : 'alto');
            this.temporizadorObstaculo = Phaser.Math.Between(900, 1450);
        }
    }

    salirAlMapa() { 
        this.input.keyboard.once('keyup-ESC', () => {
            this.scene.start('EscenaJuego', { ignoreEscape: true });
        });
    }

    terminar() {
        if (this.terminado) return;
        this.terminado = true;
        this.jugador.setVelocity(0, 0);
        this.jugador.anims.stop();
        const puntuacionFinal = Math.floor(this.puntuacion);
        if (puntuacionFinal > this.mejorPuntuacion) {
            this.mejorPuntuacion = puntuacionFinal;
            localStorage.setItem('muchbits-dino-mejor-puntuacion', puntuacionFinal);
        }
        this.textoEstado.setText(`FIN DE LA CARRERA\nPuntuación: ${puntuacionFinal}\nMejor: ${this.mejorPuntuacion}\n\nENTER o ESPACIO para reintentar\nESC para volver al mapa`).setVisible(true);
    }

    reiniciar() {
        this.obstaculos.clear(true, true);
        this.puntuacion = 0;
        this.velocidad = 300;
        this.temporizadorObstaculo = 850;
        this.terminado = false;
        this.jugador.setPosition(220, 550);
        this.jugador.setVelocity(0, 0);
        this.jugador.setDisplaySize(40, 60);
        this.jugador.body.setSize(40, 60, true);
        this.jugador.play('dino-run-derecha');
        this.textoEstado.setVisible(false);
        this.crearObstaculo(760, 'bajo');
        this.crearObstaculo(1060, 'alto');
    }
}
