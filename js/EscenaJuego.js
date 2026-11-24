class EscenaJuego extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaJuego' });
    }

    init(data) {
        this.ignoreEscape = Boolean(data && data.ignoreEscape);
        let pos = (data && data.posInicial) ? data.posInicial : null;
        // Mapeo retrocompatible si una escena regresa con coordenadas del mapa antiguo
        if (pos) {
            if (pos.x === 710 && pos.y === 560) {
                pos = { x: 810, y: 535 }; // Regreso de Sala A (Biodiversidad)
            } else if (pos.x === 725 && (pos.y === 460 || pos.y === 465)) {
                pos = { x: 900, y: 455 }; // Regreso de Sala B (Energía)
            } else if (pos.x === 512 && pos.y === 510) {
                pos = { x: 540, y: 535 }; // Regreso de Sala C (Sustentabilidad)
            } else if (pos.x === 312 && (pos.y === 190 || pos.y === 135)) {
                pos = { x: 320, y: 180 }; // Regreso de Sala Dino
            } else if (pos.x > 1024 || pos.y > 800) {
                if (pos.x >= 1500) {
                    pos = { x: 900, y: 455 }; // Regreso de Sala B (Energía)
                } else if (pos.x >= 1200) {
                    pos = { x: 810, y: 535 }; // Regreso de Sala A (Biodiversidad)
                } else if (pos.x >= 600) {
                    pos = { x: 540, y: 535 }; // Regreso de Sala C (Sustentabilidad)
                } else {
                    pos = { x: 320, y: 180 }; // Regreso de Sala Dino
                }
            }
        }
        this.posInicial = pos;
        this.avatarKey = (data && data.avatarKey) ? data.avatarKey : (localStorage.getItem('muchbits-avatar') || 'user_male');
    }

    preload() {
        // Cargar mapa y salas de la carpeta pictures/mapa
        this.load.image('mapa_fondo', 'pictures/mapa/mapa.jpg');
        this.load.image('sala_dino_img', 'pictures/mapa/Sala Dino.png');
        this.load.image('sala_a_img', 'pictures/mapa/Sala A.png');
        this.load.image('sala_b_img', 'pictures/mapa/Sala B.png');
        this.load.image('sala_c_img', 'pictures/mapa/Sala C.png');

        if (!this.textures.exists(`avatar-${this.avatarKey}`)) {
            this.load.spritesheet(`avatar-${this.avatarKey}`, `pictures/${this.avatarKey}.png`, {
                frameWidth: 256,
                frameHeight: 256
            });
        }
    }

    create() {
        this.iniciarMusicaMapa();
        this.events.once('shutdown', () => this.detenerMusicaMapa());
        this.events.once('destroy', () => this.detenerMusicaMapa());

        // Dimensiones reducidas del nuevo mapa según requerimiento: 1024 x 800
        const anchoMundo = 1024;
        const altoMundo = 800;

        let startX = (this.posInicial && this.posInicial.x) ? this.posInicial.x : 100;
        let startY = (this.posInicial && this.posInicial.y) ? this.posInicial.y : 400;

        this.ultimaPosSegura = { x: startX, y: startY };
        this.enPortal = false;

        this.physics.world.setBounds(0, 0, anchoMundo, altoMundo);
        this.cameras.main.setBounds(0, 0, anchoMundo, altoMundo);

        // Fondo del mapa con pasto y caminos integrados (pictures/mapa/Pasto y camino.png)
        this.add.image(anchoMundo / 2, altoMundo / 2, 'mapa_fondo')
            .setDisplaySize(anchoMundo, altoMundo)
            .setDepth(0);

        // =========================================================================
        // SALAS / EDIFICIOS (Imágenes de pictures/mapa)
        // =========================================================================

        // 1. SALA SBEEL (Arco de piedra al norte)
        this.add.image(320, 110, 'sala_dino_img')
            .setDisplaySize(216, 116)
            .setDepth(2);
        this.add.text(320, 42, 'SALA SBEEL', { // SALA DINO
            fontSize: '11px',
            fill: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(3);

        // 2. SALA DESARROLLO SUSTENTABLE (Plataformas flotantes)
        this.add.image(540, 380, 'sala_c_img')
            .setDisplaySize(310, 240)
            .setDepth(2);
        this.add.text(540, 245, 'SALA C\nDESARROLLO SUSTENTABLE', { // SALA C
            fontSize: '10px',
            fill: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(3);

        // 3. SALA DE ENERGÍA (Presa hidroeléctrica al este)
        this.add.image(900, 310, 'sala_b_img')
            .setDisplaySize(180, 208)
            .setDepth(2);
        this.add.text(900, 190, 'SALA B\nENERGÍA', { // SALA B
            fontSize: '10px',
            fill: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(3);

        // 4. Sala A (Biodiversidad / Pabellón Jaguar al sur)
        this.add.image(810, 660, 'sala_a_img')
            .setDisplaySize(200, 192)
            .setDepth(2);
        this.add.text(810, 775, 'SALA A: BIODIVERSIDAD', {
            fontSize: '10px',
            fill: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(3);

        // =========================================================================
        // COLISIONES SÓLIDAS PARA LOS EDIFICIOS
        // =========================================================================
        let colisionDino = this.add.zone(320, 95, 216, 70); // (x, y, ancho, alto)
        this.physics.add.existing(colisionDino, true);

        let colisionC = this.add.zone(540, 365, 280, 170);
        this.physics.add.existing(colisionC, true);

        let colisionB = this.add.zone(900, 295, 170, 170);
        this.physics.add.existing(colisionB, true);

        let colisionA = this.add.zone(810, 675, 180, 145);
        this.physics.add.existing(colisionA, true);

        this.edificiosGroup = this.physics.add.staticGroup([
            colisionDino,
            colisionC,
            colisionB,
            colisionA
        ]);

        // =========================================================================
        // ZONAS DE PORTAL (Entradas a los minijuegos) -- HABILITA DEBUG PARA VER VISUALMENTE --
        // =========================================================================
        this.salas = this.physics.add.staticGroup();

        let salaD = this.salas.create(320, 140, null).setVisible(false); // Circulo para entrar a Sala Dino SBEEL
        salaD.body.setCircle(32);
        salaD.setData({ nombre: 'DINO', salida: { x: 320, y: 180 } });

        let salaC_portal = this.salas.create(540, 480, null).setVisible(false);
        salaC_portal.body.setCircle(35);
        salaC_portal.setData({ nombre: 'SUSTENTABILIDAD', salida: { x: 540, y: 535 } });

        let salaB_portal = this.salas.create(900, 405, null).setVisible(false);
        salaB_portal.body.setCircle(35);
        salaB_portal.setData({ nombre: 'ENERGÍA (Presa)', salida: { x: 900, y: 455 } });

        let salaA_portal = this.salas.create(810, 580, null).setVisible(false);
        salaA_portal.body.setCircle(35);
        salaA_portal.setData({ nombre: 'BIODIVERSIDAD', salida: { x: 810, y: 535 } });

        // Animaciones del avatar (Fila 0: abajo, Fila 1: arriba, Fila 2: izquierda, Fila 3: derecha)
        const avatarTexKey = `avatar-${this.avatarKey}`;
        const frameDerecha = 12;
        const frameIzquierda = 8;
        if (this.anims.exists('avatar-abajo')) this.anims.remove('avatar-abajo');
        if (this.anims.exists('avatar-arriba')) this.anims.remove('avatar-arriba');
        if (this.anims.exists('avatar-izquierda')) this.anims.remove('avatar-izquierda');
        if (this.anims.exists('avatar-derecha')) this.anims.remove('avatar-derecha');

        this.anims.create({ key: 'avatar-abajo', frames: this.anims.generateFrameNumbers(avatarTexKey, { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'avatar-arriba', frames: this.anims.generateFrameNumbers(avatarTexKey, { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'avatar-izquierda', frames: this.anims.generateFrameNumbers(avatarTexKey, { start: frameIzquierda, end: frameIzquierda + 3 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'avatar-derecha', frames: this.anims.generateFrameNumbers(avatarTexKey, { start: frameDerecha, end: frameDerecha + 3 }), frameRate: 8, repeat: -1 });

        // Jugador
        this.jugador = this.physics.add.sprite(startX, startY, avatarTexKey, 0).setDepth(4);
        this.jugador.setDisplaySize(65, 70); // MODIFICAMOS EL TAMAÑO DEL AVATAR (ANCHO, ALTO)
        this.jugador.body.setSize(120, 176, true);
        this.jugador.setCollideWorldBounds(true);
        this.jugador.play('avatar-abajo');
        this.cameras.main.startFollow(this.jugador, true, 0.08, 0.08);

        this.physics.add.collider(this.jugador, this.edificiosGroup);
        this.physics.add.overlap(this.jugador, this.salas, this.entrarAAnuncioPortal, null, this);

        this.teclado = this.input.keyboard.createCursorKeys();
        this.teclaESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.teclaENTER = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.teclaS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.teclaN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);

        this.textoPortal = this.add.text(512, 400, '', {
            fontSize: '22px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 20, y: 20 },
            align: 'center',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(10);

        this.add.text(10, 10, 'Presiona [ESC] para volver al Menú principal', {
            fontSize: '13px',
            fill: '#ffffff',
            backgroundColor: '#111111',
            padding: { x: 6, y: 4 },
            fontFamily: 'Arial'
        }).setScrollFactor(0).setDepth(10);

        this.textoCoordenadas = this.add.text(512, 12, `X: ${startX} | Y: ${startY}`, {
            fontSize: '13px',
            fill: '#ffffff',
            backgroundColor: '#111111',
            padding: { x: 10, y: 4 },
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);

        let botonMenu = this.add.text(anchoMundo - 15, 12, 'VOLVER AL MENÚ', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#c0392b',
            fontFamily: 'Arial',
            padding: { x: 10, y: 6 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(10);

        botonMenu.on('pointerdown', () => {
            this.scene.stop('EscenaDinoRun');
            this.scene.start('EscenaMenu');
        });

        botonMenu.on('pointerover', () => botonMenu.setStyle({ fill: '#f1c40f' }));
        botonMenu.on('pointerout', () => botonMenu.setStyle({ fill: '#ffffff' }));
    }

    update() {
        const enterTactil = window.mobileControls?.consume('enter');
        const escapeTactil = window.mobileControls?.consume('escape');

        if (this.textoCoordenadas && this.jugador) {
            let xInt = Math.round(this.jugador.x);
            let yInt = Math.round(this.jugador.y);
            this.textoCoordenadas.setText(`X: ${xInt} | Y: ${yInt}`);
        }

        if (this.enPortal) {
            this.jugador.setVelocity(0);

            const nombreSala = this.salaActual ? this.salaActual.getData('nombre').toUpperCase() : '';

            if (nombreSala === 'DINO') {
                if (Phaser.Input.Keyboard.JustDown(this.teclaENTER) || enterTactil || Phaser.Input.Keyboard.JustDown(this.teclaS)) {
                    this.textoPortal.setVisible(false);
                    this.enPortal = false;
                    this.detenerMusicaMapa();
                    this.scene.sleep('EscenaJuego');
                    this.scene.launch('EscenaDinoRun');
                } else if (Phaser.Input.Keyboard.JustDown(this.teclaESC) || escapeTactil || Phaser.Input.Keyboard.JustDown(this.teclaN)) {
                    this.textoPortal.setVisible(false);
                    this.enPortal = false;
                    this.reiniciarJugador();
                }
            } else if (nombreSala === 'BIODIVERSIDAD') {
                if (Phaser.Input.Keyboard.JustDown(this.teclaENTER) || enterTactil || Phaser.Input.Keyboard.JustDown(this.teclaS)) {
                    this.textoPortal.setVisible(false);
                    this.enPortal = false;
                    this.scene.start('EscenaBiodiversidad', {
                        avatarKey: this.avatarKey
                    });
                } else if (Phaser.Input.Keyboard.JustDown(this.teclaESC) || escapeTactil || Phaser.Input.Keyboard.JustDown(this.teclaN)) {
                    this.textoPortal.setVisible(false);
                    this.enPortal = false;
                    this.reiniciarJugador();
                }
            } else if (nombreSala.includes('ENERGÍA') || nombreSala === 'B') {
                if (Phaser.Input.Keyboard.JustDown(this.teclaENTER) || enterTactil || Phaser.Input.Keyboard.JustDown(this.teclaS)) {
                    this.textoPortal.setVisible(false);
                    this.enPortal = false;
                    this.scene.start('EscenaEnergia', {
                        avatarKey: this.avatarKey
                    });
                } else if (Phaser.Input.Keyboard.JustDown(this.teclaESC) || escapeTactil || Phaser.Input.Keyboard.JustDown(this.teclaN)) {
                    this.textoPortal.setVisible(false);
                    this.enPortal = false;
                    this.reiniciarJugador();
                }
            } else if (nombreSala.includes('SUSTENTAB') || nombreSala === 'C') {
                if (Phaser.Input.Keyboard.JustDown(this.teclaENTER) || enterTactil || Phaser.Input.Keyboard.JustDown(this.teclaS)) {
                    this.textoPortal.setVisible(false);
                    this.enPortal = false;
                    this.scene.start('EscenaSustentable', {
                        avatarKey: this.avatarKey,
                        origen: 'EscenaJuego'
                    });
                } else if (Phaser.Input.Keyboard.JustDown(this.teclaESC) || escapeTactil || Phaser.Input.Keyboard.JustDown(this.teclaN)) {
                    this.textoPortal.setVisible(false);
                    this.enPortal = false;
                    this.reiniciarJugador();
                }
            } else {
                if (Phaser.Input.Keyboard.JustDown(this.teclaENTER) ||
                    enterTactil ||
                    Phaser.Input.Keyboard.JustDown(this.teclaESC)) {
                    this.textoPortal.setVisible(false);
                    this.enPortal = false;
                    this.reiniciarJugador();
                }
            }
            return;
        }

        if (this.ignoreEscape) {
            if (!this.teclaESC.isDown) this.ignoreEscape = false;
        } else if (Phaser.Input.Keyboard.JustDown(this.teclaESC) || escapeTactil) {
            this.scene.stop('EscenaDinoRun');
            this.scene.start('EscenaMenu');
            return;
        }

        let posPreviaX = this.jugador.x;
        let posPreviaY = this.jugador.y;
        this.jugador.setVelocity(0);

        const controlesTactiles = window.mobileControls;
        controlesTactiles?.consume('up');
        controlesTactiles?.consume('down');
        controlesTactiles?.consume('left');
        controlesTactiles?.consume('right');
        const izquierdaActiva = this.teclado.left.isDown || controlesTactiles?.isDown('left');
        const derechaActiva = this.teclado.right.isDown || controlesTactiles?.isDown('right');
        const arribaActivo = this.teclado.up.isDown || controlesTactiles?.isDown('up');
        const abajoActivo = this.teclado.down.isDown || controlesTactiles?.isDown('down');

        const vel = 170;
        if (izquierdaActiva) this.jugador.setVelocityX(-vel);
        else if (derechaActiva) this.jugador.setVelocityX(vel);

        if (arribaActivo) this.jugador.setVelocityY(-vel);
        else if (abajoActivo) this.jugador.setVelocityY(vel);

        if (this.jugador.body.velocity.x < 0) this.jugador.anims.play('avatar-izquierda', true);
        else if (this.jugador.body.velocity.x > 0) this.jugador.anims.play('avatar-derecha', true);
        else if (this.jugador.body.velocity.y < 0) this.jugador.anims.play('avatar-arriba', true);
        else if (this.jugador.body.velocity.y > 0) this.jugador.anims.play('avatar-abajo', true);
        else this.jugador.anims.stop();

        this.ultimaPosSegura.x = posPreviaX;
        this.ultimaPosSegura.y = posPreviaY;
    }

    entrarAAnuncioPortal(jugador, sala) {
        if (this.enPortal) return;

        this.enPortal = true;
        this.salaActual = sala;
        let destino = sala.getData('nombre');

        this.textoPortal.setText(
            `¡Sala ${destino} Detectada!\n\n` +
            `Presiona [ENTER] para Entrar\n` +
            `Presiona [ESC] para Salir`
        );
        this.textoPortal.setVisible(true);
    }

    reiniciarJugador() {
        let salida = this.salaActual
            ? this.salaActual.getData('salida')
            : { x: 100, y: 400 };

        this.jugador.x = salida.x;
        this.jugador.y = salida.y;
        this.ultimaPosSegura = { x: salida.x, y: salida.y };
        this.salaActual = null;
    }

    iniciarMusicaMapa() {
        const musicaExistente = this.sound.get('menu-intro');
        if (musicaExistente && musicaExistente.isPlaying) {
            this.musicaMapa = musicaExistente;
            return;
        }

        this.sound.stopByKey('menu-intro');
        this.musicaMapa = this.sound.add('menu-intro', { loop: true, volume: 0 });
        this.musicaMapa.play();

        this.musicaMapaVolumen = { valor: 0 };
        this.tweens.add({
            targets: this.musicaMapaVolumen,
            valor: 0.7,
            duration: 2600,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                if (this.musicaMapa) {
                    this.musicaMapa.setVolume(this.musicaMapaVolumen.valor);
                }
            }
        });
    }

    detenerMusicaMapa() {
        if (this.musicaMapa) {
            this.sound.stopByKey('menu-intro');
            this.musicaMapa.stop();
            this.musicaMapa = null;
        }
    }
}
