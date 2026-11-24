class EscenaDinoRun extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaDinoRun' });
    }

    preload() {
        const avatarKey = localStorage.getItem('muchbits-avatar') || 'user_male';
        this.avatarKey = avatarKey;
        if (!this.textures.exists(`avatar-${avatarKey}`)) {
            this.load.spritesheet(`avatar-${avatarKey}`, `pictures/${avatarKey}.png`, {
                frameWidth: 256,
                frameHeight: 256
            });
        }

        // Elementos de flora prehistórica (árboles y arbustos)
        this.load.image('arbol', 'pictures/dino_sbeel/Arbol_1.png');
        this.load.image('arbol_grande', 'pictures/dino_sbeel/Arbol_2.png');
        this.load.image('arbusto', 'pictures/dino_sbeel/arbusto.png');
        this.load.image('arbusto_extendido', 'pictures/dino_sbeel/arbusto_extendido.png');

        // Obstáculos y criaturas
        this.load.image('roca', 'pictures/sala_sbeel_dinosaurios/roca.png');
        this.load.spritesheet('terodactilo', 'pictures/sala_sbeel_dinosaurios/terodactile.png', {
            frameWidth: 524,
            frameHeight: 412
        });
        this.load.spritesheet('dinosaurio-perseguidor', 'pictures/sala_sbeel_dinosaurios/dinosaur-run.png', {
            frameWidth: 396,
            frameHeight: 326
        });
    }

    create() {
        this.initAudio();

        this.cameras.main.setBackgroundColor('#6faed0');
        this.puntuacion = 0;
        this.mejorPuntuacion = Number(localStorage.getItem('muchbits-dino-mejor-puntuacion') || 0);
        this.esNuevoRecord = false;
        this.proximoHito = 100;

        this.velocidad = 310;
        this.terminado = false;
        this.pausado = false;
        this.agachado = false;
        this.capturaIniciada = false;
        this.usarArbolGrande = false;

        // Tiempos y dinámicas
        this.temporizadorObstaculo = 850;
        this.temporizadorArbol = Phaser.Math.Between(900, 1800);
        this.tiempoUltimoSuelo = 0;
        this.tiempoBufferSalto = 0;
        this.ultimoPolvoJugador = 0;
        this.ultimoPolvoDino = 0;

        this.crearTexturasProcedurales();
        this.crearFondoConParalaje();
        this.crearSolYCieloVivo();
        this.crearVientoYParticulas();
        this.crearControles();
        this.crearJugador();
        this.crearPerseguidor();
        this.crearObstaculos();
        this.crearHUDArcade();
        this.crearModales();

        // Efecto de entrada suave
        this.cameras.main.fadeIn(300, 0, 0, 0);
    }

    /* =========================================================================
     * SINTETIZADOR DE AUDIO RETRO (Web Audio API)
     * ========================================================================= */
    initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        } catch (e) {
            this.audioCtx = null;
        }
    }

    reproducirSonido(tipo) {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        if (tipo === 'salto') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(480, now + 0.12);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.13);
        } else if (tipo === 'agacharse') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.09);
        } else if (tipo === 'hito') {
            // Doble bip estilo Chrome Dino cada 100 puntos
            [0, 0.09].forEach((delay, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(idx === 0 ? 587.3 : 880, now + delay);
                gain.gain.setValueAtTime(0.12, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + delay);
                osc.stop(now + delay + 0.09);
            });
        } else if (tipo === 'game_over') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(55, now + 0.38);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.39);
        } else if (tipo === 'click') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
        }
    }

    /* =========================================================================
     * TEXTURAS PROCEDURALES Y ANIMACIONES
     * ========================================================================= */
    crearTexturasProcedurales() {
        const animKeyRun = `dino-jugador-corriendo-${this.avatarKey}`;
        const frameDerecha = 12;
        if (this.anims.exists(animKeyRun)) {
            this.anims.remove(animKeyRun);
        }
        this.anims.create({
            key: animKeyRun,
            frames: this.anims.generateFrameNumbers(`avatar-${this.avatarKey}`, { start: frameDerecha, end: frameDerecha + 3 }),
            frameRate: 10,
            repeat: -1
        });

        if (!this.anims.exists('terodactilo-volando')) {
            this.anims.create({
                key: 'terodactilo-volando',
                frames: this.anims.generateFrameNumbers('terodactilo', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // --- 1. Textura Seamless de Montañas Lejanas (Paralaje lento) ---
        if (!this.textures.exists('tex-montanas-lejanas')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            // Picos distantes con gradiente y cimas rocosas
            g.fillStyle(0x78a66a, 1);
            g.fillPoints([
                { x: 0, y: 280 }, { x: 120, y: 120 }, { x: 260, y: 280 },
                { x: 380, y: 90 }, { x: 540, y: 280 }, { x: 680, y: 140 },
                { x: 820, y: 280 }, { x: 960, y: 110 }, { x: 1100, y: 280 },
                { x: 1200, y: 160 }, { x: 1200, y: 300 }, { x: 0, y: 300 }
            ], true);

            // Sombras y facetas angulares en los picos
            g.fillStyle(0x5f8753, 0.7);
            g.fillPoints([
                { x: 120, y: 120 }, { x: 170, y: 180 }, { x: 260, y: 280 }, { x: 120, y: 280 }
            ], true);
            g.fillPoints([
                { x: 380, y: 90 }, { x: 440, y: 160 }, { x: 540, y: 280 }, { x: 380, y: 280 }
            ], true);
            g.fillPoints([
                { x: 960, y: 110 }, { x: 1020, y: 190 }, { x: 1100, y: 280 }, { x: 960, y: 280 }
            ], true);

            g.generateTexture('tex-montanas-lejanas', 1200, 300);
            g.destroy();
        }

        // --- 2. Textura Seamless de Colinas Cercanas (Paralaje medio) ---
        if (!this.textures.exists('tex-montanas-cercanas')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x356b3d, 1);
            g.fillPoints([
                { x: 0, y: 220 }, { x: 160, y: 80 }, { x: 320, y: 220 },
                { x: 480, y: 65 }, { x: 660, y: 220 }, { x: 820, y: 95 },
                { x: 1000, y: 220 }, { x: 1000, y: 240 }, { x: 0, y: 240 }
            ], true);

            // Facetas de iluminación
            g.fillStyle(0x43864d, 0.6);
            g.fillPoints([
                { x: 160, y: 80 }, { x: 220, y: 140 }, { x: 320, y: 220 }, { x: 160, y: 220 }
            ], true);
            g.fillPoints([
                { x: 480, y: 65 }, { x: 550, y: 130 }, { x: 660, y: 220 }, { x: 480, y: 220 }
            ], true);

            g.generateTexture('tex-montanas-cercanas', 1000, 240);
            g.destroy();
        }

        // --- 3. Textura Seamless del Suelo en Movimiento (Paralaje completo) ---
        if (!this.textures.exists('tex-suelo-carrera')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            // Capa superior de césped y musgo prehistórico
            g.fillStyle(0x27ae60, 1);
            g.fillRect(0, 0, 800, 5);
            g.fillStyle(0x2ecc71, 0.9);
            g.fillRect(0, 5, 800, 3);

            // Capa de tierra compactada
            g.fillStyle(0x5a3825, 1);
            g.fillRect(0, 8, 800, 52);

            // Guijarros y vetas de tierra para sensación de alta velocidad
            g.fillStyle(0x74482d, 1);
            for (let x = 12; x < 800; x += 32) {
                g.fillEllipse(x, 18 + (x % 3) * 6, 12, 4);
                g.fillEllipse(x + 14, 38 + (x % 4) * 4, 16, 5);
            }

            g.fillStyle(0x8a6245, 0.85);
            for (let x = 6; x < 800; x += 44) {
                g.fillCircle(x, 26, 2.5);
                g.fillCircle(x + 22, 46, 3);
            }

            // Piedrecillas claras dispersas
            g.fillStyle(0xdfe6e9, 0.7);
            for (let x = 20; x < 800; x += 70) {
                g.fillCircle(x, 22, 1.8);
                g.fillCircle(x + 35, 42, 2.2);
            }

            g.generateTexture('tex-suelo-carrera', 800, 60);
            g.destroy();
        }

        // Suelo estático con físicas invisible (la colisión real está en Y=580)
        if (!this.textures.exists('dino-suelo-fisica')) {
            const suelo = this.make.graphics({ x: 0, y: 0, add: false });
            suelo.fillStyle(0x000000, 1);
            suelo.fillRect(0, 0, 1000, 40);
            suelo.generateTexture('dino-suelo-fisica', 1000, 40);
            suelo.destroy();
        }
    }

    /* =========================================================================
     * ENTORNO, PAISAJE DINÁMICO Y PARALAJE MULTINIVEL
     * ========================================================================= */
    crearFondoConParalaje() {
        // Cielo dinámico con gradiente
        this.fondoCielo = this.add.graphics().setDepth(0);
        this.actualizarColorCielo(0);

        // Capa 1 de Paralaje: Montañas lejanas en TileSprite infinito (Velocidad: 0.05x)
        this.tileMontanasLejanas = this.add.tileSprite(500, 360, 1000, 300, 'tex-montanas-lejanas')
            .setDepth(0)
            .setAlpha(0.9);

        // Capa 2 de Paralaje: Colinas verdes cercanas en TileSprite infinito (Velocidad: 0.15x)
        this.tileMontanasCercanas = this.add.tileSprite(500, 470, 1000, 240, 'tex-montanas-cercanas')
            .setDepth(1)
            .setAlpha(0.95);

        // Capa 3: Vegetación arbórea de fondo
        this.grupoArboles = this.add.group();
        this.crearArbolPaisaje(750);
        this.crearArbolPaisaje(1050);

        // Capa 4: Arbustos vivos sobre el borde del camino (alternando texturas)
        this.grupoArbustos = this.add.group();
        for (let x = 60; x <= 1100; x += 160) {
            this.crearArbustoPaisaje(x);
        }

        // Capa 5 de Paralaje: Pista de tierra en TileSprite infinito (Velocidad: 1.0x completa)
        this.tileSuelo = this.add.tileSprite(500, 608, 1000, 60, 'tex-suelo-carrera')
            .setDepth(2);

        // Relleno profundo de tierra inferior
        this.tierraProfunda = this.add.graphics().setDepth(2);
        this.tierraProfunda.fillStyle(0x432617, 1);
        this.tierraProfunda.fillRect(0, 638, 1000, 170);

        // Suelo estático con físicas invisible para colisiones
        this.suelo = this.physics.add.staticImage(500, 600, 'dino-suelo-fisica');
        this.suelo.setVisible(false);
    }

    crearSolYCieloVivo() {
        // Sol prehistórico brillante en el cielo
        this.contenedorSol = this.add.container(820, 110).setDepth(0);

        this.haloSol = this.add.circle(0, 0, 52, 0xffd32a, 0.22);
        this.coronaSol = this.add.circle(0, 0, 38, 0xfffa65, 0.45);
        this.discoSol = this.add.circle(0, 0, 26, 0xffffff, 0.95);

        this.contenedorSol.add([this.haloSol, this.coronaSol, this.discoSol]);

        // Pulso sutil de los rayos solares
        this.tweens.add({
            targets: this.haloSol,
            scale: { from: 0.9, to: 1.15 },
            alpha: { from: 0.15, to: 0.32 },
            duration: 2400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Nubes esponjosas en el cielo
        this.nubes = [];
        for (let i = 0; i < 6; i++) {
            const x = Phaser.Math.Between(30, 970);
            const y = Phaser.Math.Between(30, 180);
            const w = Phaser.Math.Between(110, 210);
            const nube = this.add.graphics().setDepth(0);
            nube.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.55, 0.85));
            nube.fillRoundedRect(0, 0, w, 24, 12);
            nube.fillCircle(w * 0.35, 4, 18);
            nube.fillCircle(w * 0.65, 6, 15);
            nube.x = x;
            nube.y = y;
            nube.velocidad = Phaser.Math.FloatBetween(14, 30);
            this.nubes.push(nube);
        }
    }

    crearVientoYParticulas() {
        // Hojas y esporas prehistóricas flotando impulsadas por la velocidad
        this.particulasViento = [];
        const coloresViento = [0x2ecc71, 0x27ae60, 0xf1c40f, 0xe67e22];

        for (let i = 0; i < 18; i++) {
            const px = Phaser.Math.Between(20, 980);
            const py = Phaser.Math.Between(220, 560);
            const pr = Phaser.Math.FloatBetween(1.8, 3.2);
            const color = Phaser.Utils.Array.GetRandom(coloresViento);
            const p = this.add.circle(px, py, pr, color, Phaser.Math.FloatBetween(0.5, 0.85))
                .setDepth(2.5);

            this.particulasViento.push({
                grafico: p,
                x: px,
                y: py,
                baseY: py,
                velocidadRel: Phaser.Math.FloatBetween(0.6, 1.2),
                fase: Phaser.Math.FloatBetween(0, Math.PI * 2)
            });
        }
    }

    actualizarColorCielo(puntuacion) {
        this.fondoCielo.clear();
        let colorCielo = 0x6faed0;
        let colorHorizonte = 0xa5d5e2;

        if (puntuacion > 800) {
            // Noche profunda prehistórica
            colorCielo = 0x0c2461;
            colorHorizonte = 0x1e3799;
            if (this.discoSol) this.discoSol.setFillStyle(0xdff9fb, 0.95);
            if (this.haloSol) this.haloSol.setFillStyle(0x7ed6df, 0.25);
        } else if (puntuacion > 400) {
            // Atardecer cálido cretácico
            colorCielo = 0xeb4d4b;
            colorHorizonte = 0xf0932b;
            if (this.discoSol) this.discoSol.setFillStyle(0xffbe76, 0.95);
            if (this.haloSol) this.haloSol.setFillStyle(0xf0932b, 0.35);
        } else {
            // Día radiante
            if (this.discoSol) this.discoSol.setFillStyle(0xffffff, 0.95);
            if (this.haloSol) this.haloSol.setFillStyle(0xffd32a, 0.22);
        }

        // Gradiente vertical simulado
        this.fondoCielo.fillGradientStyle(colorCielo, colorCielo, colorHorizonte, colorHorizonte, 1);
        this.fondoCielo.fillRect(0, 0, 1000, 580);
    }

    /* =========================================================================
     * FLORA Y PAISAJE EN MOVIMIENTO
     * ========================================================================= */
    crearArbolPaisaje(x) {
        this.usarArbolGrande = !this.usarArbolGrande;
        const keyTextura = this.usarArbolGrande ? 'arbol_grande' : 'arbol';
        const displayW = this.usarArbolGrande ? 145 : 120;
        const displayH = this.usarArbolGrande ? 160 : 135;
        // Apoyado exactamente en el suelo (eliminando padding transparente de 6.6%)
        const arbol = this.add.image(x, 580, keyTextura)
            .setOrigin(0.5, 0.934)
            .setDisplaySize(displayW, displayH)
            .setDepth(1.5)
            .setAlpha(0.92);

        // Suave balanceo del follaje por el viento
        this.tweens.add({
            targets: arbol,
            angle: { from: -1.2, to: 1.2 },
            duration: Phaser.Math.Between(1600, 2200),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.grupoArboles.add(arbol);
        return arbol;
    }

    crearArbustoPaisaje(x) {
        const esExtendido = Phaser.Math.Between(0, 1) === 0;
        const key = esExtendido ? 'arbusto_extendido' : 'arbusto';
        const w = esExtendido ? 96 : 74;
        const h = esExtendido ? 48 : 50;
        // Ajuste de origen para compensar el padding transparente inferior (11% y 12%)
        const originY = esExtendido ? 0.882 : 0.892;

        const arbusto = this.add.image(x, 580, key)
            .setOrigin(0.5, originY)
            .setDisplaySize(w, h)
            .setDepth(2.2)
            .setAlpha(0.9);

        this.grupoArbustos.add(arbusto);
        return arbusto;
    }

    /* =========================================================================
     * CONTROLES
     * ========================================================================= */
    crearControles() {
        this.teclado = this.input.keyboard.createCursorKeys();
        this.teclaW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.teclaS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.teclaEspacio = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.teclaP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        this.teclaESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.teclaENTER = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    /* =========================================================================
     * JUGADOR Y HITBOXES CALIBRADAS
     * ========================================================================= */
    crearJugador() {
        const animKeyRun = `dino-jugador-corriendo-${this.avatarKey}`;
        const frameDerecha = 12;

        // Origin Y en 0.824 compensa los 45 px de padding transparente inferior del frame de 256x256
        this.jugador = this.physics.add.sprite(230, 580, `avatar-${this.avatarKey}`, frameDerecha)
            .setOrigin(0.5, 0.824)
            .setDepth(4);

        this.aplicarHitboxParado();
        this.jugador.body.setGravityY(1180);
        this.jugador.setCollideWorldBounds(false);
        this.jugador.setFlipX(false);
        this.jugador.play(animKeyRun, true);

        this.physics.add.collider(this.jugador, this.suelo);
    }

    aplicarHitboxParado() {
        this.jugador.setDisplaySize(68, 68);
        this.jugador.setOrigin(0.5, 0.824);
        // Cuerpo de colisión ajustado a los píxeles reales del avatar (offset 36 + altura 175 = 211 al suelo)
        this.jugador.body.setSize(110, 175);
        this.jugador.body.setOffset(73, 36);
    }

    aplicarHitboxAgachado() {
        this.jugador.setDisplaySize(68, 48);
        this.jugador.setOrigin(0.5, 0.824);
        this.jugador.body.setSize(130, 95);
        this.jugador.body.setOffset(63, 116);
    }

    /* =========================================================================
     * DINOSAURIO PERSEGUIDOR (T-REX CON PISADAS PESADAS Y ANIMACIÓN HACIA ADELANTE)
     * ========================================================================= */
    crearPerseguidor() {
        if (this.anims.exists('dinosaurio-corriendo')) {
            this.anims.remove('dinosaurio-corriendo');
        }
        // Invertimos el orden de frames (.reverse()) para que la carrera avance hacia adelante y no hacia atras
        this.anims.create({
            key: 'dinosaurio-corriendo',
            frames: this.anims.generateFrameNumbers('dinosaurio-perseguidor', { start: 0, end: 11 }).reverse(),
            frameRate: 13,
            repeat: -1
        });

        // Origin Y en 0.938 compensa los 20 px de espacio inferior para apoyar las garras firmemente en tierra
        this.perseguidor = this.physics.add.sprite(60, 580, 'dinosaurio-perseguidor', 0)
            .setOrigin(0.5, 0.938)
            .setDisplaySize(225, 185)
            .setFlipX(false)
            .setDepth(3.5);

        this.perseguidor.body.setAllowGravity(true);
        this.perseguidor.body.setGravityY(1180);
        this.perseguidor.body.setSize(100, 120);
        this.perseguidor.body.setOffset(148, 170);
        this.perseguidor.play('dinosaurio-corriendo');

        this.physics.add.collider(this.perseguidor, this.suelo);
    }

    /* =========================================================================
     * OBSTÁCULOS: ROCA (Salto) Y TERODÁCTILO (Agacharse)
     * ========================================================================= */
    crearObstaculos() {
        this.obstaculos = this.physics.add.group();
        this.physics.add.overlap(this.jugador, this.obstaculos, this.terminarPorPerseguidor, null, this);
        this.crearObstaculo(820, 'bajo');
        this.crearObstaculo(1160, 'alto');
    }

    crearObstaculo(x, tipo) {
        const isBajo = (tipo === 'bajo');
        // Roca se apoya sobre el suelo (Y=580). Terodáctilo vuela a Y=522 (requiere agacharse)
        const yPos = isBajo ? 580 : 522;
        const obstaculo = this.obstaculos.create(
            x,
            yPos,
            isBajo ? 'roca' : 'terodactilo'
        ).setOrigin(0.5, 1).setDepth(3);

        if (isBajo) {
            obstaculo.setDisplaySize(62, 54);
            obstaculo.body.setSize(obstaculo.width * 0.52, obstaculo.height * 0.52, true);
        } else {
            obstaculo.setDisplaySize(115, 90);
            obstaculo.body.setSize(85, 55, true);
            obstaculo.body.setOffset(18, obstaculo.height * 0.22);
            obstaculo.play('terodactilo-volando');
        }

        obstaculo.body.setAllowGravity(false);
        obstaculo.body.setImmovable(true);
        obstaculo.body.setVelocityX(-this.velocidad);
        return obstaculo;
    }

    /* =========================================================================
     * INTERFAZ ARCADE
     * ========================================================================= */
    crearHUDArcade() {
        this.add.text(28, 22, '★ DINO RUN ★', {
            fontSize: '18px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#7ed957',
            stroke: '#102010',
            strokeThickness: 3
        }).setDepth(5);

        this.add.text(30, 50, '▲ / ESPACIO: SALTAR    ▼: AGACHARSE', {
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#a3cb38',
            stroke: '#102010',
            strokeThickness: 2
        }).setDepth(5);

        // Marcadores de Puntuación Arcade
        this.contenedorHUDScore = this.add.container(970, 22).setDepth(5);

        this.badgePuntos = this.add.graphics();
        this.badgePuntos.fillStyle(0x111a24, 0.85);
        this.badgePuntos.fillRoundedRect(-320, 0, 320, 36, 6);
        this.badgePuntos.lineStyle(2, 0x00d2d3, 0.8);
        this.badgePuntos.strokeRoundedRect(-320, 0, 320, 36, 6);

        this.textoPuntuacion = this.add.text(-10, 18, 'HI 00000  00000', {
            fontSize: '13px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f1c40f',
            stroke: '#102010',
            strokeThickness: 2
        }).setOrigin(1, 0.5);

        this.contenedorHUDScore.add([this.badgePuntos, this.textoPuntuacion]);

        // Botón Pausa
        this.botonPausa = this.add.text(770, 68, '[P] PAUSA', {
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#1e272e',
            backgroundColor: '#f1c40f',
            padding: { x: 10, y: 6 }
        }).setDepth(5).setInteractive({ useHandCursor: true });
        this.botonPausa.on('pointerdown', () => this.alternarPausa());

        // Botón Salir
        this.botonSalir = this.add.text(880, 68, '[ESC] SALIR', {
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ffffff',
            backgroundColor: '#e74c3c',
            padding: { x: 10, y: 6 }
        }).setDepth(5).setInteractive({ useHandCursor: true });
        this.botonSalir.on('pointerdown', () => this.salirAlMapa());
    }

    crearModales() {
        // Modal de Pausa
        this.modalPausa = this.add.container(500, 350).setDepth(15).setVisible(false);
        const bgPausa = this.add.graphics();
        bgPausa.fillStyle(0x0b131e, 0.92);
        bgPausa.fillRoundedRect(-180, -90, 360, 180, 12);
        bgPausa.lineStyle(3, 0xf1c40f, 1);
        bgPausa.strokeRoundedRect(-180, -90, 360, 180, 12);

        const txtPausa = this.add.text(0, -45, 'JUEGO EN PAUSA', {
            fontSize: '16px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f1c40f'
        }).setOrigin(0.5);

        const btnReanudar = this.add.text(0, 15, '▶ CONTINUAR [P]', {
            fontSize: '12px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#1e272e',
            backgroundColor: '#2ecc71',
            padding: { x: 14, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btnReanudar.on('pointerdown', () => this.alternarPausa());

        const subPausa = this.add.text(0, 55, 'Presiona ESC para salir al mapa', {
            fontSize: '9px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#bdc3c7'
        }).setOrigin(0.5);

        this.modalPausa.add([bgPausa, txtPausa, btnReanudar, subPausa]);

        // Modal de Game Over
        this.modalGameOver = this.add.container(500, 330).setDepth(20).setVisible(false);

        const bgGO = this.add.graphics();
        bgGO.fillStyle(0x0a0e17, 0.96);
        bgGO.fillRoundedRect(-240, -145, 480, 290, 14);
        bgGO.lineStyle(3, 0xe74c3c, 1);
        bgGO.strokeRoundedRect(-240, -145, 480, 290, 14);

        const tituloGO = this.add.text(0, -105, '¡EL DINOSAURIO TE ALCANZÓ!', {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ff4757',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.txtScoreGO = this.add.text(0, -55, 'PUNTOS: 00000', {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.txtRecordGO = this.add.text(0, -22, 'MEJOR RÉCORD: 00000', {
            fontSize: '12px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f1c40f'
        }).setOrigin(0.5);

        this.bannerNuevoRecord = this.add.text(0, 10, '★ ¡NUEVO RÉCORD CONSEGUIDO! ★', {
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#00d2d3'
        }).setOrigin(0.5).setVisible(false);

        const btnReintentar = this.add.text(-105, 75, 'REINTENTAR\n[ENTER / ESPACIO]', {
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#1e272e',
            backgroundColor: '#2ecc71',
            padding: { x: 12, y: 9 },
            align: 'center'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btnReintentar.on('pointerdown', () => this.reiniciar());

        const btnVolver = this.add.text(105, 75, 'VOLVER AL MAPA\n[ESC]', {
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ffffff',
            backgroundColor: '#e74c3c',
            padding: { x: 12, y: 9 },
            align: 'center'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btnVolver.on('pointerdown', () => this.salirAlMapa());

        this.modalGameOver.add([
            bgGO, tituloGO, this.txtScoreGO, this.txtRecordGO,
            this.bannerNuevoRecord, btnReintentar, btnVolver
        ]);
    }

    /* =========================================================================
     * BUCLE PRINCIPAL (UPDATE)
     * ========================================================================= */
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

        const dt = delta / 1000;

        // Mantener posición X fija del dinosaurio persiguiendo
        this.perseguidor.setVelocityX(0);

        // --- 1. Paralaje Infinito de Fondo en Movimiento ---
        if (this.tileMontanasLejanas) {
            this.tileMontanasLejanas.tilePositionX += this.velocidad * 0.05 * dt;
        }
        if (this.tileMontanasCercanas) {
            this.tileMontanasCercanas.tilePositionX += this.velocidad * 0.15 * dt;
        }
        if (this.tileSuelo) {
            this.tileSuelo.tilePositionX += this.velocidad * dt;
        }

        // --- 2. Movimiento de Nubes en el Cielo ---
        if (this.nubes) {
            this.nubes.forEach(nube => {
                nube.x -= (nube.velocidad + this.velocidad * 0.04) * dt;
                if (nube.x < -220) {
                    nube.x = 1050;
                    nube.y = Phaser.Math.Between(30, 180);
                }
            });
        }

        // --- 3. Partículas de Viento y Hojas Prehistóricas ---
        if (this.particulasViento) {
            this.particulasViento.forEach(p => {
                p.x -= (this.velocidad * p.velocidadRel * 0.8) * dt;
                p.y = p.baseY + Math.sin(time * 0.003 + p.fase) * 14;
                p.grafico.setPosition(p.x, p.y);

                if (p.x < -20) {
                    p.x = Phaser.Math.Between(1020, 1080);
                    p.baseY = Phaser.Math.Between(220, 560);
                }
            });
        }

        // --- 4. Paralaje de Vegetación (Árboles y Arbustos) ---
        if (this.grupoArbustos) {
            const velArbustos = this.velocidad * 0.65 * dt;
            this.grupoArbustos.children.iterate((arbusto) => {
                if (arbusto) {
                    arbusto.x -= velArbustos;
                    if (arbusto.x < -120) {
                        arbusto.x += 1220;
                    }
                }
            });
        }

        if (this.grupoArboles) {
            const velArbol = this.velocidad * 0.35 * dt;
            this.grupoArboles.children.iterate((arbol) => {
                if (arbol) {
                    arbol.x -= velArbol;
                    if (arbol.x < -160) arbol.destroy();
                }
            });

            this.temporizadorArbol -= delta;
            if (this.temporizadorArbol <= 0) {
                this.crearArbolPaisaje(1080);
                this.temporizadorArbol = Phaser.Math.Between(1200, 2600);
            }
        }

        // --- 5. Salto con Coyote Time y Jump Buffer ---
        const enSuelo = this.jugador.body.blocked.down || this.jugador.body.touching.down;
        if (enSuelo) {
            this.tiempoUltimoSuelo = time;
        }

        const coyoteActivo = (time - this.tiempoUltimoSuelo) < 130;
        const quiereSaltar = Phaser.Input.Keyboard.JustDown(this.teclado.up) ||
            Phaser.Input.Keyboard.JustDown(this.teclaW) ||
            Phaser.Input.Keyboard.JustDown(this.teclaEspacio) ||
            window.mobileControls?.consume('up');

        if (quiereSaltar) {
            this.tiempoBufferSalto = time;
        }
        const saltoBuffereado = (time - this.tiempoBufferSalto) < 130;

        if (saltoBuffereado && coyoteActivo) {
            this.tiempoBufferSalto = 0;
            this.tiempoUltimoSuelo = 0;
            this.jugador.setVelocityY(-630);
            this.reproducirSonido('salto');
            this.crearBocanadaPolvo(this.jugador.x, 580, 1.2);
        }

        // Salto variable suave
        const soltoSalto = Phaser.Input.Keyboard.JustUp(this.teclado.up) ||
            Phaser.Input.Keyboard.JustUp(this.teclaW) ||
            Phaser.Input.Keyboard.JustUp(this.teclaEspacio);
        if (soltoSalto && this.jugador.body.velocity.y < -300) {
            this.jugador.body.setVelocityY(-300);
        }

        // --- 6. Mecánica de Agacharse con Hitbox Real ---
        const abajoActivo = this.teclado.down.isDown || this.teclaS.isDown || window.mobileControls?.isDown('down');
        if (abajoActivo && enSuelo && !this.agachado) {
            this.agachado = true;
            this.aplicarHitboxAgachado();
            this.reproducirSonido('agacharse');
        } else if ((!abajoActivo || !enSuelo) && this.agachado) {
            this.agachado = false;
            this.aplicarHitboxParado();
        }

        // --- 7. Efectos de Pisadas y Pisotones Pesados del T-Rex ---
        if (enSuelo && time > this.ultimoPolvoJugador + 200) {
            this.ultimoPolvoJugador = time;
            this.crearBocanadaPolvo(this.jugador.x - 14, 580, 0.8);
        }

        // Pisotones del T-Rex con sacudida sutil de cámara cada zancada
        if (time > this.ultimoPolvoDino + 360) {
            this.ultimoPolvoDino = time;
            this.crearBocanadaPolvo(this.perseguidor.x - 20, 580, 1.6);
            this.cameras.main.shake(65, 0.0016);
        }

        // --- 8. Puntuación, Hitos y Curva de Velocidad ---
        this.puntuacion += delta * 0.012;
        this.velocidad = Math.min(680, 310 + this.puntuacion * 1.6);
        this.temporizadorObstaculo -= delta;

        // Bip cada 100 puntos y cambio de cielo
        const puntosEnteros = Math.floor(this.puntuacion);
        if (puntosEnteros >= this.proximoHito) {
            this.proximoHito += 100;
            this.reproducirSonido('hito');
            this.actualizarColorCielo(puntosEnteros);
        }

        // Formato Score retro (5 dígitos)
        const strPuntos = String(puntosEnteros).padStart(5, '0');
        const strMejor = String(Math.max(this.mejorPuntuacion, puntosEnteros)).padStart(5, '0');
        this.textoPuntuacion.setText(`HI ${strMejor}  ${strPuntos}`);

        // --- 9. Mover obstáculos y reciclar ---
        this.obstaculos.children.iterate((obstaculo) => {
            if (obstaculo && obstaculo.active) {
                obstaculo.body.setVelocityX(-this.velocidad);
                if (obstaculo.x < -120) obstaculo.destroy();
            }
        });

        // Generar siguiente obstáculo con separación justa
        if (this.temporizadorObstaculo <= 0) {
            const tipo = Phaser.Math.Between(0, 1) === 0 ? 'bajo' : 'alto';
            this.crearObstaculo(1050, tipo);
            const intervaloMin = Math.max(780, 1400 - (this.velocidad * 0.9));
            const intervaloMax = intervaloMin + Phaser.Math.Between(350, 750);
            this.temporizadorObstaculo = Phaser.Math.Between(intervaloMin, intervaloMax);
        }
    }

    crearBocanadaPolvo(x, y, escala = 1) {
        const polvo = this.add.circle(
            x,
            y - 4,
            Phaser.Math.Between(3, 5) * escala,
            0x8a6245,
            0.7
        ).setDepth(2.5);

        this.tweens.add({
            targets: polvo,
            x: x - Phaser.Math.Between(15, 35),
            y: y - Phaser.Math.Between(8, 18),
            scale: 0.2,
            alpha: 0,
            duration: 350,
            ease: 'Quad.easeOut',
            onComplete: () => polvo.destroy()
        });
    }

    alternarPausa() {
        if (this.terminado) return;
        this.pausado = !this.pausado;
        this.reproducirSonido('click');
        this.modalPausa.setVisible(this.pausado);
        this.botonPausa.setText(this.pausado ? '[P] PAUSADO' : '[P] PAUSA');
    }

    /* =========================================================================
     * GAME OVER Y CAPTURA POR EL DINOSAURIO
     * ========================================================================= */
    terminarPorPerseguidor() {
        if (this.terminado || this.capturaIniciada) return;
        this.terminado = true;
        this.capturaIniciada = true;
        this.reproducirSonido('game_over');

        this.cameras.main.shake(280, 0.018);

        const posicionFinal = this.jugador.x - 36;
        this.perseguidor.body.enable = false;
        this.jugador.setVelocity(0, 0);
        this.perseguidor.setVelocity(0, 0);
        this.jugador.anims.stop();

        const puntuacionFinal = Math.floor(this.puntuacion);
        if (puntuacionFinal > this.mejorPuntuacion) {
            this.mejorPuntuacion = puntuacionFinal;
            this.esNuevoRecord = true;
            localStorage.setItem('muchbits-dino-mejor-puntuacion', puntuacionFinal);
        }

        // Animación de captura con salto del T-Rex
        this.tweens.add({
            targets: this.perseguidor,
            x: posicionFinal,
            y: this.jugador.y,
            duration: 520,
            ease: 'Power2',
            onComplete: () => {
                const strPuntos = String(puntuacionFinal).padStart(5, '0');
                const strMejor = String(this.mejorPuntuacion).padStart(5, '0');
                this.txtScoreGO.setText(`PUNTOS: ${strPuntos}`);
                this.txtRecordGO.setText(`MEJOR RÉCORD: ${strMejor}`);
                this.bannerNuevoRecord.setVisible(this.esNuevoRecord);
                this.modalGameOver.setVisible(true);

                if (this.esNuevoRecord) {
                    this.tweens.add({
                        targets: this.bannerNuevoRecord,
                        scale: { from: 0.9, to: 1.1 },
                        duration: 500,
                        yoyo: true,
                        repeat: -1
                    });
                }
            }
        });
    }

    /* =========================================================================
     * REINICIO Y RETORNO
     * ========================================================================= */
    reiniciar() {
        if (window.mobileControls && typeof window.mobileControls.clear === 'function') {
            window.mobileControls.clear();
        }
        this.reproducirSonido('click');
        this.obstaculos.clear(true, true);

        this.puntuacion = 0;
        this.velocidad = 310;
        this.proximoHito = 100;
        this.temporizadorObstaculo = 850;
        this.temporizadorArbol = Phaser.Math.Between(900, 1800);
        this.terminado = false;
        this.pausado = false;
        this.agachado = false;
        this.capturaIniciada = false;
        this.esNuevoRecord = false;

        this.actualizarColorCielo(0);

        // Reposicionar jugador con hitbox parado consistente
        this.jugador.setPosition(230, 580);
        this.jugador.setVelocity(0, 0);
        this.aplicarHitboxParado();
        this.jugador.setFlipX(false);
        const animKeyRun = `dino-jugador-corriendo-${this.avatarKey}`;
        this.jugador.play(animKeyRun, true);

        // Reposicionar T-Rex
        this.perseguidor.setPosition(60, 580);
        this.perseguidor.setOrigin(0.5, 0.938);
        this.perseguidor.setVelocity(0, 0);
        this.perseguidor.body.enable = true;
        this.perseguidor.play('dinosaurio-corriendo');

        this.modalGameOver.setVisible(false);
        this.crearObstaculo(820, 'bajo');
        this.crearObstaculo(1160, 'alto');
    }

    salirAlMapa() {
        this.reproducirSonido('click');
        const mapa = this.scene.get('EscenaJuego');
        const salida = { x: 400, y: 220 };
        mapa.jugador.setPosition(salida.x, salida.y);
        mapa.jugador.setVelocity(0, 0);
        mapa.ultimaPosSegura = { x: salida.x, y: salida.y };
        mapa.enPortal = false;
        mapa.salaActual = null;
        mapa.ignoreEscape = true;
        this.scene.stop('EscenaDinoRun');
        this.scene.wake('EscenaJuego');
        mapa.iniciarMusicaMapa();
    }
}
