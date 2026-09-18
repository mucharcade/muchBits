class EscenaDinoRun extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaDinoRun' });
    }

    preload() {
        this.load.spritesheet('jugador-run', 'pictures/plantilla.png', {
            frameWidth: 102,
            frameHeight: 153
        });
        this.load.image('arbusto', 'pictures/arbusto.png');
        this.load.image('arbol', 'pictures/arbol.png');
        this.load.image('roca', 'pictures/roca.png');
        this.load.spritesheet('terodactilo', 'pictures/terodactile.png', {
            frameWidth: 543,
            frameHeight: 724
        });
        this.load.spritesheet('dinosaurio-perseguidor', 'pictures/dinosaur-run.png', {
            frameWidth: 396,
            frameHeight: 396
        });
    }

    create() {
        this.cameras.main.setBackgroundColor('#17202b');
        this.puntuacion = 0;
        this.mejorPuntuacion = Number(localStorage.getItem('muchbits-dino-mejor-puntuacion') || 0);
        this.velocidad = 300;
        this.terminado = false;
        this.pausado = false;
        this.agachado = false;
        this.capturaIniciada = false;
        this.temporizadorObstaculo = 850;
        this.temporizadorArbol = Phaser.Math.Between(900, 1800);

        this.crearTexturas();
        this.crearFondo();
        this.crearControles();
        this.crearJugador();
        this.crearPerseguidor();
        this.crearInterfaz();
        this.crearObstaculos();
    }

    crearTexturas() {
        if (!this.anims.exists('terodactilo-volando')) {
            this.anims.create({
                key: 'terodactilo-volando',
                frames: this.anims.generateFrameNumbers('terodactilo', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!this.textures.exists('dino-suelo')) {
            const suelo = this.make.graphics({ x: 0, y: 0, add: false });
            suelo.fillStyle(0x5a3825, 1);
            suelo.fillRect(0, 0, 1000, 60);
            suelo.generateTexture('dino-suelo', 1000, 60);
            suelo.destroy();
        }
    }

    crearFondo() {
        this.fondo = this.add.graphics();
        this.fondo.fillStyle(0x6faed0, 1);
        this.fondo.fillRect(0, 0, 1000, 800);

        const montanasLejanas = this.add.graphics();
        montanasLejanas.fillStyle(0x78a66a, 1);
        montanasLejanas.fillPoints([
            { x: 0, y: 430 }, { x: 130, y: 250 }, { x: 260, y: 430 },
            { x: 390, y: 220 }, { x: 560, y: 430 }, { x: 720, y: 270 },
            { x: 900, y: 430 }, { x: 1000, y: 300 }, { x: 1000, y: 580 }, { x: 0, y: 580 }
        ], true);

        const montanasCercanas = this.add.graphics();
        montanasCercanas.fillStyle(0x356b3d, 1);
        montanasCercanas.fillPoints([
            { x: 0, y: 510 }, { x: 180, y: 340 }, { x: 340, y: 510 },
            { x: 520, y: 315 }, { x: 700, y: 510 }, { x: 850, y: 350 },
            { x: 1000, y: 510 }, { x: 1000, y: 580 }, { x: 0, y: 580 }
        ], true);

        this.fondo.fillStyle(0x5a3825, 1);
        this.fondo.fillRect(0, 580, 1000, 220);
        this.fondo.fillStyle(0x74482d, 0.9);
        for (let x = 18; x < 1000; x += 74) {
            this.fondo.fillEllipse(x, 615 + (x % 4) * 9, 22, 8);
            this.fondo.fillEllipse(x + 37, 710 + (x % 3) * 12, 16, 6);
        }
        this.fondo.fillStyle(0x8a6245, 0.85);
        for (let x = 45; x < 1000; x += 91) {
            this.fondo.fillEllipse(x, 660 + (x % 5) * 7, 12, 5);
            this.fondo.fillEllipse(x + 48, 770 - (x % 4) * 8, 20, 7);
        }

        // Arbustos de paisaje en el fondo
        this.grupoArbustos = this.add.group();
        for (let x = 50; x <= 1100; x += 150) {
            let arbusto = this.add.image(x, 545, 'arbusto')
                .setDisplaySize(70, 70)
                .setDepth(1)
                .setAlpha(0.85);
            this.grupoArbustos.add(arbusto);
        }

        this.grupoArboles = this.add.group();
        this.crearArbolPaisaje(820);

        this.suelo = this.physics.add.staticImage(500, 610, 'dino-suelo');
        this.suelo.setVisible(false);
    }

    crearControles() {
        this.teclado = this.input.keyboard.createCursorKeys();
        this.teclaEspacio = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.teclaP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.teclaESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.teclaENTER = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
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

        this.jugador = this.physics.add.sprite(220, 550, 'jugador-run', 12).setDepth(3);
        this.jugador.setDisplaySize(40, 60);
        this.jugador.body.setSize(40, 60, true);
        this.jugador.body.setGravityY(1050);
        this.jugador.setCollideWorldBounds(false);
        this.jugador.play('dino-run-derecha');
        this.physics.add.collider(this.jugador, this.suelo);
    }

    crearPerseguidor() {
        if (!this.anims.exists('dinosaurio-corriendo')) {
            this.anims.create({
                key: 'dinosaurio-corriendo',
                frames: this.anims.generateFrameNumbers('dinosaurio-perseguidor', { start: 0, end: 12 }),
                frameRate: 12,
                repeat: -1
            });
        }

        this.perseguidor = this.physics.add.sprite(50, 550, 'dinosaurio-perseguidor', 0)
            .setDisplaySize(170, 170)
            .setFlipX(true)
            .setDepth(2);
        this.perseguidor.body.setAllowGravity(true);
        this.perseguidor.body.setGravityY(1050);
        this.perseguidor.body.setSize(102, 122, true);
        this.perseguidor.play('dinosaurio-corriendo');
        this.physics.add.collider(this.perseguidor, this.suelo);
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

        this.botonPausa = this.add.text(790, 78, 'PAUSA [P]', {
            fontSize: '18px',
            fill: '#17202b',
            backgroundColor: '#f1c40f',
            padding: { x: 12, y: 8 },
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setInteractive({ useHandCursor: true });
        this.botonPausa.on('pointerdown', () => this.alternarPausa());

        this.botonSalir = this.add.text(900, 78, 'SALIR [ESC]', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#c0392b',
            padding: { x: 12, y: 8 },
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setInteractive({ useHandCursor: true });
        this.botonSalir.on('pointerdown', () => this.salirAlMapa());

        this.textoPausa = this.add.text(500, 355, 'JUEGO EN PAUSA\n\nPulsa P o CONTINUAR para volver', {
            fontSize: '28px',
            fill: '#ffffff',
            backgroundColor: '#111111',
            padding: { x: 28, y: 22 },
            align: 'center',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setVisible(false).setDepth(5);
        this.botonContinuar = this.add.text(500, 475, 'CONTINUAR', {
            fontSize: '22px',
            fill: '#17202b',
            backgroundColor: '#7ed957',
            padding: { x: 18, y: 10 },
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false).setDepth(5);
        this.botonContinuar.on('pointerdown', () => this.alternarPausa());
    }

    crearObstaculos() {
        this.obstaculos = this.physics.add.group();
        this.physics.add.overlap(this.jugador, this.obstaculos, this.terminarPorPerseguidor, null, this);
        this.crearObstaculo(760, 'bajo');
        this.crearObstaculo(1060, 'alto');
    }

    crearObstaculo(x, tipo) {
        const isBajo = (tipo === 'bajo');
        const yPos = isBajo ? 600 : 512;
        const obstaculo = this.obstaculos.create(
            x,
            yPos,
            isBajo ? 'roca' : 'terodactilo'
        ).setDepth(3);

        if (isBajo) {
            obstaculo.setOrigin(0.5, 1);
            obstaculo.setDisplaySize(56, 56);
            obstaculo.body.setSize(obstaculo.width * 0.85, obstaculo.height * 0.85, true);
        } else {
            obstaculo.setDisplaySize(105, 70);
            obstaculo.body.setSize(300, 100, true);
            obstaculo.play('terodactilo-volando');
        }

        obstaculo.body.setAllowGravity(false);
        obstaculo.body.setImmovable(true);
        obstaculo.body.setVelocityX(-this.velocidad);
        return obstaculo;
    }

    update(time, delta) {
        const escapeTactil = window.mobileControls?.consume('escape');
        const enterTactil = window.mobileControls?.consume('enter');

        if (Phaser.Input.Keyboard.JustDown(this.teclaESC) || escapeTactil) {
            this.salirAlMapa();
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.teclaP)) {
            this.alternarPausa();
        }

        if (this.pausado) return;

        if (this.terminado) {
            if (Phaser.Input.Keyboard.JustDown(this.teclaENTER) || enterTactil || Phaser.Input.Keyboard.JustDown(this.teclaEspacio)) {
                this.reiniciar();
            }
            return;
        }

        this.perseguidor.setVelocityX(0);

        // Movimiento de paralaje para los arbustos de paisaje en el fondo
        if (this.grupoArbustos) {
            let velParalaje = this.velocidad * 0.4 * (delta / 1000);
            this.grupoArbustos.children.iterate((arbusto) => {
                if (arbusto) {
                    arbusto.x -= velParalaje;
                    if (arbusto.x < -60) {
                        arbusto.x += 1150;
                    }
                }
            });
        }

        if (this.grupoArboles) {
            const velArbol = this.velocidad * 0.18 * (delta / 1000);
            this.grupoArboles.children.iterate((arbol) => {
                if (arbol) {
                    arbol.x -= velArbol;
                    if (arbol.x < -120) arbol.destroy();
                }
            });

            this.temporizadorArbol -= delta;
            if (this.temporizadorArbol <= 0) {
                this.crearArbolPaisaje(1060);
                this.temporizadorArbol = Phaser.Math.Between(1100, 2600);
            }
        }

        const enSuelo = this.jugador.body.blocked.down || this.jugador.body.touching.down;
        const saltoTactil = enSuelo && window.mobileControls?.consume('up');
        const saltoTeclado = Phaser.Input.Keyboard.JustDown(this.teclado.up) || Phaser.Input.Keyboard.JustDown(this.teclaEspacio);
        if ((saltoTeclado || saltoTactil) && enSuelo) {
            this.jugador.setVelocityY(-620);
        }

        const abajoActivo = this.teclado.down.isDown || window.mobileControls?.isDown('down');
        if (abajoActivo && enSuelo && !this.agachado) {
            this.jugador.setDisplaySize(40, 40);
            this.agachado = true;
        } else if (!abajoActivo && this.agachado) {
            this.jugador.setDisplaySize(40, 60);
            this.agachado = false;
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
        const mapa = this.scene.get('EscenaJuego');
        const salida = { x: 350, y: 150 };
        mapa.jugador.setPosition(salida.x, salida.y);
        mapa.jugador.setVelocity(0, 0);
        mapa.ultimaPosSegura = { x: salida.x, y: salida.y };
        mapa.enPortal = false;
        mapa.salaActual = null;
        mapa.ignoreEscape = true;
        this.scene.stop('EscenaDinoRun');
        this.scene.wake('EscenaJuego');
    }

    crearArbolPaisaje(x) {
        const arbol = this.add.image(x, 475, 'arbol')
            .setDisplaySize(130, 130)
            .setDepth(0)
            .setAlpha(0.92);
        this.grupoArboles.add(arbol);
        return arbol;
    }

    alternarPausa() {
        if (this.terminado) return;
        this.pausado = !this.pausado;
        this.textoPausa.setVisible(this.pausado);
        this.botonContinuar.setVisible(this.pausado);
        this.botonPausa.setText(this.pausado ? 'PAUSADO [P]' : 'PAUSA [P]');
    }

    terminarPorPerseguidor() {
        if (this.terminado || this.capturaIniciada) return;
        this.terminado = true;
        this.capturaIniciada = true;
        const posicionFinal = this.jugador.x - 30;
        this.perseguidor.body.enable = false;
        this.jugador.setVelocity(0, 0);
        this.perseguidor.setVelocity(0, 0);
        this.perseguidor.play('dinosaurio-corriendo');
        this.jugador.anims.stop();
        const puntuacionFinal = Math.floor(this.puntuacion);
        if (puntuacionFinal > this.mejorPuntuacion) {
            this.mejorPuntuacion = puntuacionFinal;
            localStorage.setItem('muchbits-dino-mejor-puntuacion', puntuacionFinal);
        }
        this.tweens.add({
            targets: this.perseguidor,
            x: posicionFinal,
            y: this.jugador.y - 15,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                this.textoEstado.setText(`¡EL DINOSAURIO TE ATRAPÓ!\nPuntuación: ${puntuacionFinal}\nMejor: ${this.mejorPuntuacion}\n\nENTER o ESPACIO para reintentar\nESC para volver al mapa`).setVisible(true);
            }
        });
    }

    terminar() {
        if (this.terminado) return;
        this.terminado = true;
        this.jugador.setVelocity(0, 0);
        this.perseguidor.setVelocity(0, 0);
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
        this.temporizadorArbol = Phaser.Math.Between(900, 1800);
        this.terminado = false;
        this.pausado = false;
        this.agachado = false;
        this.capturaIniciada = false;
        this.jugador.setPosition(220, 550);
        this.jugador.setVelocity(0, 0);
        this.perseguidor.setPosition(50, 550);
        this.perseguidor.setVelocity(0, 0);
        this.perseguidor.body.enable = true;
        this.perseguidor.play('dinosaurio-corriendo');
        this.jugador.setDisplaySize(40, 60);
        this.jugador.body.setSize(40, 60, true);
        this.jugador.play('dino-run-derecha');
        this.textoEstado.setVisible(false);
        this.crearObstaculo(760, 'bajo');
        this.crearObstaculo(1060, 'alto');
    }
}
