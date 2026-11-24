/**
 * EscenaSustentable3.js — Nivel 3: Complejo Hidroeléctrico Presa Chicoasén
 * MuchBits Arcade Universe — Sala de Desarrollo Sustentable
 *
 * Características:
 * - Mapa extendido (2200 px de ancho) con cámara panorámica de seguimiento.
 * - Fondo oficial: Paisaje_Presa_Chicoasen_ok.png.
 * - Gran abismo dividido en dos sectores con un Mirador / Descanso Central en el medio.
 * - Mayor separación entre plataformas (~160-180 px) requiriendo precisión y confianza.
 * - Incorporación de los 3 tipos de plataformas: Estables, Móviles (H/V) y Frágiles.
 * - Acantilado final con Turbina Hidroeléctrica rotatoria que se activa al conectar el cable.
 * - Rayitos de luz (⚡) coleccionables, espectros de sobretensión y física de cable con catenaria.
 * - Sintetizador de audio procedural (Web Audio API) y HUD retro arcade estilo CRT.
 */

class EscenaSustentable3 extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaSustentable3' });
    }

    init(data) {
        this.origen = data.origen || 'EscenaMenu';
        this.avatarKey = data.avatarKey || localStorage.getItem('muchbits-avatar') || 'user_male';

        // Estado de juego
        this.puntuacion = 0;
        this.energiaRecolectada = 0;
        this.totalEnergia = 8;
        this.vidas = 3;
        this.tiempoRestante = 95;
        this.longitudCableFT = 0;
        this.maximaLongitudCableFT = 175;
        this.cableConectado = false;
        this.juegoTerminado = false;
        this.juegoCompletado = false;
        this.nivelPausado = false;
        this.cambiandoNivel = false;

        // Banderas de control de salto y contacto
        this.puedeSaltar = false;
        this.tiempoUltimoSuelo = 0;
        this.tiempoBufferSalto = 0;
        this.estaSaltando = false;
        this.invulnerable = false;
        this.esReinicio = false;
    }

    preload() {
        // Fondo oficial Nivel 3: Presa Chicoasén
        this.load.image('fondo_sustentable_n3', 'pictures/sala_desarrollo_sustentable/Paisaje_Presa_Chicoasen_ok.png');

        // Texturas oficiales de plataformas
        this.load.image('plat_estable', 'pictures/sala_desarrollo_sustentable/plataforma_estable.png');
        this.load.image('plat_movimiento', 'pictures/sala_desarrollo_sustentable/plataforma_movimiento.png');
        this.load.image('plat_fragil', 'pictures/sala_desarrollo_sustentable/plataforma_fragil.png');

        // Spritesheet del avatar estandarizado (256x256 por frame)
        this.load.spritesheet(`avatar-${this.avatarKey}`, `pictures/${this.avatarKey}.png`, {
            frameWidth: 256,
            frameHeight: 256
        });
    }

    create() {
        this.initAudioSynthesizer();

        // ── Mundo extendido Chicoasén ─────────────────────────────────────────
        this.anchoMundo = 2200;
        this.altoMundo = 800;
        this.physics.world.setBounds(0, 0, this.anchoMundo, this.altoMundo);

        this.generarTexturas();
        this.crearAnimaciones();
        this.crearEntornoYPlataformas();
        this.crearJugador();

        // ── Cámara con seguimiento suave panorámico ───────────────────────────
        this.cameras.main.setBounds(0, 0, this.anchoMundo, this.altoMundo);
        this.cameras.main.startFollow(this.jugador, true, 0.08, 0.08);
        this.cameras.main.setDeadzone(120, 120);

        // ── Físicas, HUD y sistemas ───────────────────────────────────────────
        this.configurarColisiones();
        this.graficosCable = this.add.graphics().setDepth(8);
        this.crearEnemigos();
        this.crearColeccionables();
        this.crearHUDArcade();
        this.configurarControles();
        this.iniciarTemporizador();
        this.crearModalesFinDeJuego();
    }

    /* =========================================================================
     * TEXTURAS PROCEDURALES DEL NIVEL 3
     * ========================================================================= */
    generarTexturas() {
        // Texturas de plataformas a resolución nativa
        if (this.textures.exists('plat_estable') && !this.textures.exists('plat_estable_game')) {
            const src = this.textures.get('plat_estable').getSourceImage();
            const c = this.textures.createCanvas('plat_estable_game', 135, 52);
            if (c && c.context) { c.context.drawImage(src, 0, 0, 135, 52); c.refresh(); }
        }

        if (this.textures.exists('plat_movimiento') && !this.textures.exists('plat_movimiento_game')) {
            const src = this.textures.get('plat_movimiento').getSourceImage();
            const cM = this.textures.createCanvas('plat_movimiento_game', 135, 52);
            if (cM && cM.context) { cM.context.drawImage(src, 0, 0, 135, 52); cM.refresh(); }
            const cS = this.textures.createCanvas('plat_movimiento_sm_game', 100, 44);
            if (cS && cS.context) { cS.context.drawImage(src, 0, 0, 100, 44); cS.refresh(); }
        }

        if (this.textures.exists('plat_fragil') && !this.textures.exists('plat_fragil_game')) {
            const src = this.textures.get('plat_fragil').getSourceImage();
            const c = this.textures.createCanvas('plat_fragil_game', 135, 52);
            if (c && c.context) { c.context.drawImage(src, 0, 0, 135, 52); c.refresh(); }
        }

        // Carrete de cable inicial
        if (!this.textures.exists('carrete_generador')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0x2d3436, 1);
            c.fillRoundedRect(6, 12, 60, 48, 6);
            c.lineStyle(3, 0xf1c40f, 1);
            c.strokeRoundedRect(6, 12, 60, 48, 6);
            c.fillStyle(0x1e272e, 1);
            c.fillCircle(36, 36, 18);
            c.fillStyle(0xf1c40f, 1);
            c.fillCircle(36, 36, 13);
            c.fillStyle(0xdfe6e9, 1);
            c.fillCircle(36, 36, 6);
            c.fillStyle(0x636e72, 1);
            c.fillRoundedRect(60, 30, 10, 12, 3);
            c.fillStyle(0xf1c40f, 1);
            c.fillRect(66, 34, 4, 4);
            c.fillStyle(0x2ecc71, 1);
            c.fillCircle(16, 20, 3);
            c.generateTexture('carrete_generador', 72, 64);
            c.destroy();
        }

        // ── Turbina Hidroeléctrica Chicoasén (Estática / Carcasa & Generador) ─ 120x150
        if (!this.textures.exists('turbina_hidro_base')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });

            // Base de concreto y pernos industriales
            c.fillStyle(0x2c3e50, 1);
            c.fillRoundedRect(10, 132, 100, 16, 4);
            c.lineStyle(2, 0x1e272e, 1);
            c.strokeRoundedRect(10, 132, 100, 16, 4);
            c.fillStyle(0x95a5a6, 1);
            c.fillCircle(20, 140, 3);
            c.fillCircle(100, 140, 3);

            // Carcasa voluta / caracol hidroeléctrico
            c.fillStyle(0x34495e, 1);
            c.fillCircle(65, 78, 48);
            c.lineStyle(3, 0x1a252f, 1);
            c.strokeCircle(65, 78, 48);

            // Cámara interior de agua
            c.fillStyle(0x1e272e, 1);
            c.fillCircle(65, 78, 38);
            c.lineStyle(2, 0x00d2d3, 0.8);
            c.strokeCircle(65, 78, 38);

            // Tubo de entrada de alta presión (penstock) en la derecha
            c.fillStyle(0x2980b9, 1);
            c.fillPoints([
                { x: 92, y: 35 },
                { x: 114, y: 40 },
                { x: 114, y: 95 },
                { x: 92, y: 90 }
            ], true);
            c.lineStyle(2, 0x1f618d, 1);
            c.strokePoints([
                { x: 92, y: 35 },
                { x: 114, y: 40 },
                { x: 114, y: 95 },
                { x: 92, y: 90 }
            ], true);

            // Caja de bornes / terminal eléctrica en el lado izquierdo
            c.fillStyle(0x2d3436, 1);
            c.fillRoundedRect(4, 92, 28, 42, 4);
            c.lineStyle(2, 0x00f2fe, 1);
            c.strokeRoundedRect(4, 92, 28, 42, 4);

            // Conector hembra de cable (luz cyan / dorado)
            c.fillStyle(0x00f2fe, 1);
            c.fillCircle(14, 113, 5);
            c.fillStyle(0xffffff, 0.95);
            c.fillCircle(13, 112, 2);

            // Manómetro indicador de presión de agua
            c.fillStyle(0xecf0f1, 1);
            c.fillCircle(38, 36, 11);
            c.lineStyle(2, 0x7f8c8d, 1);
            c.strokeCircle(38, 36, 11);
            c.fillStyle(0x2ecc71, 1);
            c.fillCircle(38, 36, 3);
            c.lineStyle(1.5, 0xe74c3c, 1);
            c.strokeLineShape(new Phaser.Geom.Line(38, 36, 44, 30));

            c.generateTexture('turbina_hidro_base', 120, 150);
            c.destroy();
        }

        // ── Rotor / Rodete de la Turbina Hidroeléctrica (Rotatorio) ────────── 80x80
        if (!this.textures.exists('turbina_hidro_rotor')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            const cx = 40;
            const cy = 40;

            // Aro exterior de soporte
            c.lineStyle(2.5, 0x7f8c8d, 0.9);
            c.strokeCircle(cx, cy, 33);

            // 6 álabes curvos de turbina hidráulica a 60°
            for (let i = 0; i < 6; i++) {
                const ang = (i * Math.PI) / 3;
                const ux = Math.cos(ang);
                const uy = Math.sin(ang);
                const vx = -Math.sin(ang);
                const vy = Math.cos(ang);

                const pts = [
                    { x: cx + ux * 8, y: cy + uy * 8 },
                    { x: cx + ux * 22 + vx * 6, y: cy + uy * 22 + vy * 6 },
                    { x: cx + ux * 32 + vx * 3, y: cy + uy * 32 + vy * 3 },
                    { x: cx + ux * 28 - vx * 2, y: cy + uy * 28 - vy * 2 },
                    { x: cx + ux * 16, y: cy + uy * 16 }
                ];
                c.fillStyle(0xbdc3c7, 1);
                c.fillPoints(pts, true);
                c.lineStyle(1.5, 0x34495e, 1);
                c.strokePoints(pts, true);

                // Brillo de agua en el álabe
                c.fillStyle(0x00d2d3, 0.8);
                c.fillCircle(cx + ux * 20 + vx * 3, cy + uy * 20 + vy * 3, 2);
            }

            // Buje central con capuchón
            c.fillStyle(0x34495e, 1);
            c.fillCircle(cx, cy, 11);
            c.fillStyle(0x00f2fe, 1);
            c.fillCircle(cx, cy, 6);
            c.fillStyle(0xffffff, 1);
            c.fillCircle(cx - 2, cy - 2, 2.5);

            c.generateTexture('turbina_hidro_rotor', 80, 80);
            c.destroy();
        }

        // Rayito de luz coleccionable (32x32)
        if (!this.textures.exists('orbe_energia')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0xfff200, 0.22);
            c.fillCircle(16, 16, 15);
            c.fillStyle(0xffd32a, 0.4);
            c.fillCircle(16, 16, 11);

            const ptsBorde = [
                { x: 19, y: 2 }, { x: 7, y: 15 }, { x: 14, y: 15 },
                { x: 10, y: 30 }, { x: 25, y: 13 }, { x: 16, y: 13 }
            ];
            c.fillStyle(0xf39c12, 1);
            c.fillPoints(ptsBorde, true);
            c.lineStyle(1.5, 0xd35400, 1);
            c.strokePoints(ptsBorde, true);

            const ptsCuerpo = [
                { x: 18, y: 4 }, { x: 9, y: 15 }, { x: 14, y: 15 },
                { x: 12, y: 27 }, { x: 23, y: 14 }, { x: 16, y: 14 }
            ];
            c.fillStyle(0xfff200, 1);
            c.fillPoints(ptsCuerpo, true);

            const ptsBrillo = [
                { x: 17, y: 6 }, { x: 12, y: 14 }, { x: 15, y: 14 },
                { x: 13, y: 23 }, { x: 20, y: 14 }, { x: 16, y: 14 }
            ];
            c.fillStyle(0xffffff, 1);
            c.fillPoints(ptsBrillo, true);

            c.generateTexture('orbe_energia', 32, 32);
            c.destroy();
        }

        // Chispas de cable
        if (!this.textures.exists('chispa_cable')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0xf1c40f, 1);
            c.fillCircle(6, 6, 4);
            c.fillStyle(0xffffff, 1);
            c.fillCircle(5, 5, 2);
            c.generateTexture('chispa_cable', 12, 12);
            c.destroy();
        }

        // Espectro de sobretensión eléctrica (enemigo flotante) — 48x44
        if (!this.textures.exists('espectro_tormenta3')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0x00cec9, 0.35);
            c.fillCircle(24, 22, 21);
            c.fillStyle(0x2d3436, 0.95);
            c.fillCircle(24, 18, 14);
            c.fillCircle(14, 22, 10);
            c.fillCircle(34, 22, 10);
            c.fillStyle(0x0984e3, 1);
            c.fillPoints([
                { x: 12, y: 26 }, { x: 4, y: 22 },
                { x: 10, y: 32 }, { x: 24, y: 30 }
            ], true);
            c.fillStyle(0x00f2fe, 1);
            c.fillEllipse(18, 17, 3.5, 4.5);
            c.fillEllipse(30, 17, 3.5, 4.5);
            c.fillStyle(0xffffff, 0.9);
            c.fillCircle(17, 16, 1.3);
            c.fillCircle(29, 16, 1.3);
            c.generateTexture('espectro_tormenta3', 48, 44);
            c.destroy();
        }

        // Partícula de roca para plataformas frágiles
        if (!this.textures.exists('plat_fragil_particula')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0x8c7b75, 1);
            c.fillRect(0, 0, 8, 8);
            c.generateTexture('plat_fragil_particula', 8, 8);
            c.destroy();
        }
    }

    /* =========================================================================
     * ANIMACIONES DEL JUGADOR
     * ========================================================================= */
    crearAnimaciones() {
        const key = `avatar-${this.avatarKey}`;
        const frameDerecha = 12;
        const frameIzquierda = 8;

        if (!this.anims.exists(`caminar-der-${this.avatarKey}`)) {
            this.anims.create({
                key: `caminar-der-${this.avatarKey}`,
                frames: this.anims.generateFrameNumbers(key, { start: frameDerecha, end: frameDerecha + 3 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.anims.exists(`caminar-izq-${this.avatarKey}`)) {
            this.anims.create({
                key: `caminar-izq-${this.avatarKey}`,
                frames: this.anims.generateFrameNumbers(key, { start: frameIzquierda, end: frameIzquierda + 3 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.anims.exists(`quieto-${this.avatarKey}`)) {
            this.anims.create({
                key: `quieto-${this.avatarKey}`,
                frames: [{ key: key, frame: 0 }],
                frameRate: 1
            });
        }
        if (!this.anims.exists(`salto-${this.avatarKey}`)) {
            this.anims.create({
                key: `salto-${this.avatarKey}`,
                frames: [{ key: key, frame: frameDerecha + 1 }],
                frameRate: 1
            });
        }
    }

    /* =========================================================================
     * ENTORNO, ACANTILADOS, DESCANSO CENTRAL Y PLATAFORMAS (NIVEL EXTENDIDO)
     * ========================================================================= */
    crearEntornoYPlataformas() {
        // Fondo oficial Chicoasén
        this.fondo = this.add.image(this.anchoMundo / 2, this.altoMundo / 2, 'fondo_sustentable_n3')
            .setDisplaySize(this.anchoMundo, this.altoMundo)
            .setDepth(0);

        // Capa sutil de iluminación ambiental hidroeléctrica (azul turquesa de río)
        const filtroAmb = this.add.graphics().setDepth(1);
        filtroAmb.fillStyle(0x0984e3, 0.04);
        filtroAmb.fillRect(0, 0, this.anchoMundo, this.altoMundo);

        // Nubes y neblina sobre el embalse
        this.crearNubesAmbiente();

        // Grupos de físicas
        this.plataformasEstaticas = this.physics.add.staticGroup();
        this.plataformasMoviles = this.physics.add.group({ allowGravity: false, immovable: true });
        this.listaFragiles = [];
        this.listaPlataformasMoviles = [];

        // ── 1. Acantilado Izquierdo (Inicio / Generador de Cable) ──────────────
        const acIzq = this.add.graphics();
        acIzq.fillStyle(0x2d3436, 1);
        acIzq.fillRoundedRect(-20, 555, 190, 285, 14);
        acIzq.fillStyle(0x3d4b52, 1);
        acIzq.fillRect(0, 560, 160, 265);
        acIzq.fillStyle(0x16a085, 1);
        acIzq.fillRoundedRect(-10, 548, 175, 20, 7);
        acIzq.fillStyle(0x1abc9c, 1);
        acIzq.fillRoundedRect(0, 550, 160, 8, 3);
        acIzq.setDepth(3);

        const colIzq = this.add.rectangle(80, 568, 160, 36, 0x000000, 0);
        this.physics.add.existing(colIzq, true);
        this.plataformasEstaticas.add(colIzq);

        // Subestación / carrete de cable en acantilado izquierdo
        this.posicionSalidaCable = { x: 135, y: 530 };
        this.carreteGenerador = this.add.image(95, 522, 'carrete_generador')
            .setDisplaySize(72, 64).setDepth(5);
        this.ledGenerador = this.add.circle(75, 505, 3, 0x2ecc71, 1).setDepth(6);
        this.tweens.add({ targets: this.ledGenerador, alpha: { from: 0.3, to: 1 }, duration: 500, yoyo: true, repeat: -1 });

        // ── 2. Descanso Central en el medio del mapa (Mirador Presa) ───────────
        // Ubicado en X: 1080 a 1300 (Centro exacto del mapa de 2200 px)
        const descanso = this.add.graphics();
        descanso.fillStyle(0x2d3436, 1);
        descanso.fillRoundedRect(1075, 545, 230, 290, 12);
        descanso.fillStyle(0x3d4b52, 1);
        descanso.fillRect(1085, 552, 210, 270);
        // Césped / vegetación
        descanso.fillStyle(0x27ae60, 1);
        descanso.fillRoundedRect(1075, 538, 230, 18, 6);
        descanso.fillStyle(0x2ecc71, 1);
        descanso.fillRoundedRect(1080, 540, 220, 8, 3);
        descanso.setDepth(3);

        const colDescanso = this.add.rectangle(1190, 555, 230, 36, 0x000000, 0);
        this.physics.add.existing(colDescanso, true);
        this.plataformasEstaticas.add(colDescanso);

        // Letrero arcade del Mirador Central
        const poste = this.add.graphics().setDepth(4);
        poste.fillStyle(0x57606f, 1);
        poste.fillRect(1187, 495, 6, 45);

        const letrero = this.add.container(1190, 485).setDepth(5);
        const bgLetrero = this.add.graphics();
        bgLetrero.fillStyle(0x1e272e, 0.95);
        bgLetrero.fillRoundedRect(-100, -14, 200, 28, 6);
        bgLetrero.lineStyle(2, 0x00f2fe, 1);
        bgLetrero.strokeRoundedRect(-100, -14, 200, 28, 6);

        const txtLetrero = this.add.text(0, 0, '◈ MIRADOR CHICOASÉN ◈', {
            fontSize: '9px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#00f2fe'
        }).setOrigin(0.5);
        letrero.add([bgLetrero, txtLetrero]);

        // ── 3. Acantilado Derecho (Destino / Turbina Hidroeléctrica) ───────────
        const acDer = this.add.graphics();
        acDer.fillStyle(0x2d3436, 1);
        acDer.fillRoundedRect(2035, 548, 195, 292, 14);
        acDer.fillStyle(0x3d4b52, 1);
        acDer.fillRect(2045, 553, 185, 272);
        acDer.fillStyle(0x16a085, 1);
        acDer.fillRoundedRect(2035, 540, 195, 20, 7);
        acDer.fillStyle(0x1abc9c, 1);
        acDer.fillRoundedRect(2040, 542, 190, 8, 3);
        acDer.setDepth(3);

        const colDer = this.add.rectangle(2132, 558, 195, 36, 0x000000, 0);
        this.physics.add.existing(colDer, true);
        this.plataformasEstaticas.add(colDer);

        // ── Turbina Hidroeléctrica de Chicoasén ────────────────────────────────
        // Base y carcasa estática
        this.turbinaBase = this.add.image(2135, 548, 'turbina_hidro_base')
            .setOrigin(0.5, 1)
            .setDisplaySize(120, 150)
            .setDepth(5);

        // Rodete / rotor con álabes que giran
        this.turbinaRotor = this.add.image(2140, 476, 'turbina_hidro_rotor')
            .setOrigin(0.5, 0.5)
            .setDisplaySize(76, 76)
            .setDepth(6);

        // Animación continua de rotación del agua en la turbina
        this.tweenTurbina = this.tweens.add({
            targets: this.turbinaRotor,
            angle: 360,
            duration: 2600,
            repeat: -1,
            ease: 'Linear'
        });

        // Punto de enchufe y zona de activación
        this.posicionEnchufeMeta = { x: 2085, y: 512 };
        this.zonaConexionTerminal = this.add.zone(2065, 510, 120, 140);
        this.physics.add.existing(this.zonaConexionTerminal, true);

        // Marcador flotante de objetivo
        this.marcadorMeta = this.add.text(2085, 435, '⚡ CONECTA LA TURBINA', {
            fontSize: '11px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f1c40f',
            stroke: '#1e272e',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(12);

        this.tweens.add({
            targets: this.marcadorMeta,
            y: 427,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ── 4. Plataformas del Nivel 3 (Los 3 tipos con mayor separación) ─────
        // SECTOR 1 (Hacia el descanso central):
        this.crearPlataformaEstatica(330, 580);
        this.crearPlataformaMovilHorizontal(530, 515, 470, 600, 75);
        this.crearPlataformaElevadizaVertical(920, 490, 420, 560, 65);

        // SECTOR 2 (Desde el descanso central hacia la turbina hidroeléctrica):
        this.crearPlataformaMovilHorizontal(1660, 440, 1600, 1740, 80);
        this.crearPlataformaElevadizaVertical(1860, 470, 390, 550, 70);

        // Plataformas frágiles (repartidas en ambos sectores)
        this.datosPlataformasFragiles = [
            { x: 740, y: 460 },   // Sector 1: Salto crucial entre móvil y elevadiza
            { x: 1470, y: 495 },  // Sector 2: Primer salto de salida del descanso
            { x: 1985, y: 510 }   // Sector 2: Escalón final de acceso a la turbina
        ];

        this.restaurarPlataformasFragiles();
    }

    crearNubesAmbiente() {
        this.nubesAmbiente = [];
        for (let i = 0; i < 7; i++) {
            const x = Phaser.Math.Between(80, this.anchoMundo - 80);
            const y = Phaser.Math.Between(60, 340);
            const w = Phaser.Math.Between(140, 240);
            const nube = this.add.graphics().setDepth(2);
            nube.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.12, 0.28));
            nube.fillRoundedRect(0, 0, w, 28, 14);
            nube.fillCircle(w * 0.35, 6, 22);
            nube.fillCircle(w * 0.65, 8, 18);
            nube.x = x;
            nube.y = y;
            nube.velocidad = Phaser.Math.FloatBetween(0.15, 0.45);
            this.nubesAmbiente.push(nube);
        }
    }

    /* ── Creadores de plataformas ────────────────────────────────────────────── */
    crearPlataformaEstatica(x, y) {
        const key = this.textures.exists('plat_estable_game') ? 'plat_estable_game'
            : this.textures.exists('plat_estable') ? 'plat_estable'
                : 'plataforma_flotante_med';
        const plat = this.plataformasEstaticas.create(x, y, key);
        plat.setDisplaySize(135, 52).setDepth(4);
        if (plat.scaleX === 1) {
            plat.body.setSize(124, 20);
            plat.body.setOffset(5, 4);
        } else {
            plat.body.setSize(124 / plat.scaleX, 20 / plat.scaleY);
            plat.body.setOffset(5 / plat.scaleX, 4 / plat.scaleY);
        }
        plat.body.checkCollision.down = false;
        plat.body.checkCollision.left = false;
        plat.body.checkCollision.right = false;
        plat.body.checkCollision.up = true;
        plat.refreshBody();
        return plat;
    }

    crearPlataformaMovilHorizontal(x, y, minX, maxX, velocidad) {
        const key = this.textures.exists('plat_movimiento_game') ? 'plat_movimiento_game'
            : this.textures.exists('plat_movimiento') ? 'plat_movimiento'
                : 'plataforma_flotante_med';
        const plat = this.plataformasMoviles.create(x, y, key);
        plat.setDisplaySize(135, 52).setDepth(4).setImmovable(true);
        plat.body.allowGravity = false;
        if (plat.scaleX === 1) {
            plat.body.setSize(124, 20);
            plat.body.setOffset(5, 4);
        } else {
            plat.body.setSize(124 / plat.scaleX, 20 / plat.scaleY);
            plat.body.setOffset(5 / plat.scaleX, 4 / plat.scaleY);
        }
        plat.body.checkCollision.down = false;
        plat.body.checkCollision.left = false;
        plat.body.checkCollision.right = false;
        plat.body.checkCollision.up = true;

        plat.minX = minX;
        plat.maxX = maxX;
        plat.velocidadBase = velocidad;
        plat.body.setVelocityX(velocidad);
        plat.tipoMovimiento = 'horizontal';

        this.listaPlataformasMoviles.push(plat);
        return plat;
    }

    crearPlataformaElevadizaVertical(x, y, minY, maxY, velocidad) {
        const key = this.textures.exists('plat_movimiento_sm_game') ? 'plat_movimiento_sm_game'
            : this.textures.exists('plat_movimiento') ? 'plat_movimiento'
                : 'plataforma_flotante_sm';
        const plat = this.plataformasMoviles.create(x, y, key);
        plat.setDisplaySize(100, 44).setDepth(4).setImmovable(true);
        plat.body.allowGravity = false;
        if (plat.scaleX === 1) {
            plat.body.setSize(92, 18);
            plat.body.setOffset(4, 3);
        } else {
            plat.body.setSize(92 / plat.scaleX, 18 / plat.scaleY);
            plat.body.setOffset(4 / plat.scaleX, 3 / plat.scaleY);
        }
        plat.body.checkCollision.down = false;
        plat.body.checkCollision.left = false;
        plat.body.checkCollision.right = false;
        plat.body.checkCollision.up = true;

        plat.minY = minY;
        plat.maxY = maxY;
        plat.velocidadBaseY = velocidad;
        plat.body.setVelocityY(velocidad);
        plat.tipoMovimiento = 'vertical';

        this.listaPlataformasMoviles.push(plat);
        return plat;
    }

    restaurarPlataformasFragiles() {
        if (this.listaFragiles) {
            this.listaFragiles.forEach((plat) => {
                if (plat) {
                    this.tweens.killTweensOf(plat);
                    if (plat.timerCaida) {
                        plat.timerCaida.remove(false);
                    }
                    if (plat.active) {
                        this.plataformasEstaticas.remove(plat, true, true);
                    }
                }
            });
        }
        this.listaFragiles = [];

        if (this.datosPlataformasFragiles) {
            this.datosPlataformasFragiles.forEach(dato => {
                this.crearPlataformaFragil(dato.x, dato.y);
            });
        }
    }

    crearPlataformaFragil(x, y) {
        const key = this.textures.exists('plat_fragil_game') ? 'plat_fragil_game'
            : this.textures.exists('plat_fragil') ? 'plat_fragil'
                : 'plataforma_flotante_med';

        const plat = this.plataformasEstaticas.create(x, y, key);
        plat.setDisplaySize(135, 52).setDepth(4);
        if (plat.scaleX === 1) {
            plat.body.setSize(124, 20);
            plat.body.setOffset(5, 4);
        } else {
            plat.body.setSize(124 / plat.scaleX, 20 / plat.scaleY);
            plat.body.setOffset(5 / plat.scaleX, 4 / plat.scaleY);
        }
        plat.body.checkCollision.down = false;
        plat.body.checkCollision.left = false;
        plat.body.checkCollision.right = false;
        plat.body.checkCollision.up = true;
        plat.refreshBody();

        plat.esFragil = true;
        plat.disparada = false;
        plat.cayendo = false;
        plat.setAlpha(1);
        plat.clearTint();

        plat.tweenPulso = this.tweens.add({
            targets: plat,
            alpha: { from: 1, to: 0.75 },
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.listaFragiles.push(plat);
        return plat;
    }

    activarCaidaFragil(plat) {
        if (!plat || plat.disparada) return;
        plat.disparada = true;

        this.reproducirSonido('crujido');
        plat.setTint(0xff7675); // Tinte rojizo de fractura

        // Vibración de advertencia antes de desprenderse
        plat.tweenTemblor = this.tweens.add({
            targets: plat,
            x: { from: plat.x - 3, to: plat.x + 3 },
            duration: 50,
            yoyo: true,
            repeat: 19,
            ease: 'Linear'
        });

        plat.timerCaida = this.time.delayedCall(2000, () => {
            if (plat && plat.active) {
                this.iniciarCaidaLibre(plat);
            }
        });
    }

    iniciarCaidaLibre(plat) {
        if (!plat.active || plat.cayendo) return;
        plat.cayendo = true;

        plat.body.enable = false;
        this.reproducirSonido('crujido');

        // Partículas de desmoronamiento
        for (let i = 0; i < 8; i++) {
            const p = this.add.image(plat.x + Phaser.Math.Between(-50, 50), plat.y + 10, 'plat_fragil_particula')
                .setDisplaySize(8, 8).setDepth(6);
            this.tweens.add({
                targets: p,
                x: p.x + Phaser.Math.Between(-30, 30),
                y: p.y + Phaser.Math.Between(30, 100),
                alpha: 0,
                duration: 500,
                onComplete: () => p.destroy()
            });
        }

        this.tweens.add({
            targets: plat,
            y: this.altoMundo + 150,
            duration: 800,
            ease: 'Quad.easeIn',
            onComplete: () => {
                if (plat && plat.active) {
                    plat.setVisible(false);
                }
            }
        });
    }

    /* =========================================================================
     * JUGADOR Y ARNES DE CABLE
     * ========================================================================= */
    crearJugador() {
        this.puntoSpawn = { x: 100, y: 498 };
        this.jugador = this.physics.add.sprite(this.puntoSpawn.x, this.puntoSpawn.y, `avatar-${this.avatarKey}`);
        this.jugador.setDisplaySize(70, 70).setDepth(7).setCollideWorldBounds(true);
        this.jugador.body.setGravityY(980);

        // Hitbox calibrada para contacto exacto sin flotar
        this.jugador.body.setSize(110, 180);
        this.jugador.body.setOffset(73, 34);

        this.mochilaCable = this.add.graphics().setDepth(7.5);
        this.jugadorEnPlataforma = null;
        this.mirandoDerecha = true;
    }

    configurarColisiones() {
        this.physics.add.collider(this.jugador, this.plataformasEstaticas, (jugador, plat) => {
            this.jugadorEnPlataforma = null;
            if (plat.esFragil && jugador.body.touching.down && plat.body.touching.up) {
                this.activarCaidaFragil(plat);
            }
        });

        this.physics.add.collider(this.jugador, this.plataformasMoviles, (jugador, plat) => {
            if (jugador.body.touching.down && plat.body.touching.up) {
                this.jugadorEnPlataforma = plat;
            }
        });

        // Conexión del cable con la turbina
        this.physics.add.overlap(this.jugador, this.zonaConexionTerminal, () => {
            if (!this.cableConectado && !this.juegoCompletado && !this.juegoTerminado) {
                this.conectarCableExitoso();
            }
        });
    }

    /* =========================================================================
     * ENEMIGOS: ESPECTROS DE SOBRETENSIÓN (NUBES ENEMIGAS CON RECORRIDO AMPLIO)
     * ========================================================================= */
    crearEnemigos() {
        this.grupoEspectros = this.physics.add.group({ allowGravity: false, immovable: true });

        // Rutas extendidas amplias en horizontal (310-360 px) y vertical (130-150 px)
        const datosEspectros = [
            { x: 620, baseY: 450, minX: 420, maxX: 820, velX: 70, amplitudY: 65, fase: 0 },
            { x: 1520, baseY: 430, minX: 1350, maxX: 1720, velX: 75, amplitudY: 70, fase: Math.PI / 2 },
            { x: 1850, baseY: 410, minX: 1700, maxX: 2010, velX: 70, amplitudY: 75, fase: Math.PI }
        ];

        datosEspectros.forEach(dato => {
            const esp = this.grupoEspectros.create(dato.x, dato.baseY, 'espectro_tormenta3');
            esp.setDisplaySize(50, 46).setDepth(6);
            esp.body.setSize(36, 32);
            esp.body.setOffset(7, 7);

            esp.baseY = dato.baseY;
            esp.minX = dato.minX;
            esp.maxX = dato.maxX;
            esp.velocidadX = dato.velX;
            esp.amplitudY = dato.amplitudY;
            esp.fase = dato.fase;
        });

        this.physics.add.overlap(this.jugador, this.grupoEspectros, (jugador, espectro) => {
            this.recibirDanoEspectro(espectro);
        });
    }

    recibirDanoEspectro(espectro) {
        if (this.invulnerable || this.juegoTerminado) return;
        this.invulnerable = true;
        this.vidas--;
        this.actualizarHUD();
        this.reproducirSonido('zap');

        // Empuje de retroceso
        const dir = this.jugador.x < espectro.x ? -190 : 190;
        this.jugador.body.setVelocity(dir, -260);

        this.mostrarTextoFlotante(this.jugador.x, this.jugador.y - 25, '¡ZAP! -1 VIDA', '#ff4757');

        this.tweens.add({
            targets: this.jugador,
            alpha: { from: 0.3, to: 1 },
            duration: 100,
            repeat: 6,
            onComplete: () => {
                this.jugador.setAlpha(1);
                this.invulnerable = false;
            }
        });

        if (this.vidas <= 0) {
            this.declararGameOver('Te alcanzó una sobretensión eléctrica.');
        }
    }

    /* =========================================================================
     * COLECCIONABLES: RAYITOS DE LUZ (⚡)
     * ========================================================================= */
    crearColeccionables() {
        this.grupoOrbes = this.physics.add.group({ allowGravity: false, immovable: true });

        // 8 Rayitos de luz colocados estratégicamente a lo largo de los 2200 px
        const posiciones = [
            { x: 330, y: 520 },
            { x: 530, y: 450 },
            { x: 740, y: 395 },
            { x: 920, y: 420 },
            { x: 1190, y: 460 }, // En el mirador de descanso central
            { x: 1470, y: 435 },
            { x: 1660, y: 380 },
            { x: 1860, y: 410 }
        ];

        posiciones.forEach((pos) => {
            const rayo = this.grupoOrbes.create(pos.x, pos.y, 'orbe_energia');
            rayo.setDisplaySize(26, 28).setDepth(5);
            rayo.body.setSize(18, 22);

            this.tweens.add({
                targets: rayo,
                y: pos.y - 8,
                duration: Phaser.Math.Between(900, 1300),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            this.tweens.add({
                targets: rayo,
                angle: { from: -8, to: 8 },
                duration: 1100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        this.physics.add.overlap(this.jugador, this.grupoOrbes, (jugador, orbe) => {
            this.recogerOrbe(orbe);
        });
    }

    recogerOrbe(orbe) {
        this.puntuacion += 150;
        this.energiaRecolectada++;
        this.reproducirSonido('orbe');
        this.actualizarHUD();
        this.mostrarTextoFlotante(orbe.x, orbe.y - 15, '+150 ⚡', '#f1c40f');

        for (let i = 0; i < 6; i++) {
            const p = this.add.image(orbe.x, orbe.y, 'chispa_cable').setDisplaySize(8, 8).setDepth(10);
            this.tweens.add({
                targets: p,
                x: p.x + Phaser.Math.Between(-25, 25),
                y: p.y + Phaser.Math.Between(-25, 25),
                alpha: 0,
                scale: 0.2,
                duration: 350,
                onComplete: () => p.destroy()
            });
        }
        orbe.destroy();
    }

    /* =========================================================================
     * HUD RETRO ARCADE (ESTILO CRT)
     * ========================================================================= */
    crearHUDArcade() {
        this.hudContainer = this.add.container(0, 0).setDepth(20).setScrollFactor(0);

        const barraSup = this.add.graphics();
        barraSup.fillStyle(0x000000, 0.95);
        barraSup.fillRect(0, 0, 1000, 52);
        barraSup.lineStyle(3, 0x00f2fe, 1);
        barraSup.strokeLineShape(new Phaser.Geom.Line(0, 52, 1000, 52));

        const titulo = this.add.text(18, 10, 'NIVEL 3: PRESA CHICOASÉN', {
            fontSize: '11px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#00f2fe'
        });

        this.textoSubtitulo = this.add.text(18, 28, 'CONECTA LA TURBINA HIDROELÉCTRICA', {
            fontSize: '8px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#7ed6df'
        });

        this.textoScore = this.add.text(420, 10, 'SCORE: 0000', {
            fontSize: '11px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f1c40f'
        });

        this.textoEnergia = this.add.text(420, 28, 'RAYOS: 0/8', {
            fontSize: '9px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f5cd79'
        });

        this.textoCable = this.add.text(620, 10, 'CABLE: 0 FT', {
            fontSize: '11px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#2ecc71'
        });

        this.textoVidas = this.add.text(620, 28, 'VIDAS: ❤️❤️❤️', {
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ff4757'
        });

        this.textoTiempo = this.add.text(820, 10, 'TIEMPO: 95', {
            fontSize: '11px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ffffff'
        });

        const btnSalir = this.add.text(935, 28, '[ESC] SALIR', {
            fontSize: '9px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#95afc0'
        }).setInteractive({ useHandCursor: true });
        btnSalir.on('pointerdown', () => this.volverAlOrigen());

        // Barra inferior de progreso del cable
        const barraInf = this.add.graphics();
        barraInf.fillStyle(0x000000, 0.85);
        barraInf.fillRect(0, 770, 1000, 30);
        barraInf.lineStyle(2, 0x00f2fe, 0.7);
        barraInf.strokeLineShape(new Phaser.Geom.Line(0, 770, 1000, 770));

        this.barraProgresoCable = this.add.graphics();
        this.hudContainer.add([
            barraSup, titulo, this.textoSubtitulo, this.textoScore,
            this.textoEnergia, this.textoCable, this.textoVidas,
            this.textoTiempo, btnSalir, barraInf, this.barraProgresoCable
        ]);

        // Efecto CRT Scanlines opcional
        const scanlines = this.add.graphics().setDepth(22).setScrollFactor(0);
        scanlines.fillStyle(0x000000, 0.04);
        for (let y = 0; y < 800; y += 4) {
            scanlines.fillRect(0, y, 1000, 2);
        }
    }

    actualizarHUD() {
        if (!this.textoScore) return;
        this.textoScore.setText(`SCORE: ${String(this.puntuacion).padStart(4, '0')}`);
        this.textoEnergia.setText(`RAYOS: ${this.energiaRecolectada}/${this.totalEnergia}`);

        const pies = Math.round(this.longitudCableFT);
        this.textoCable.setText(`CABLE: ${pies} FT`);

        const corazones = '❤️'.repeat(Math.max(0, this.vidas)) + '🖤'.repeat(Math.max(0, 3 - this.vidas));
        this.textoVidas.setText(`VIDAS: ${corazones}`);

        // Progreso horizontal del recorrido (0 a 100%)
        const progreso = Phaser.Math.Clamp((this.jugador.x - 100) / (this.posicionEnchufeMeta.x - 100), 0, 1);
        this.barraProgresoCable.clear();
        this.barraProgresoCable.fillStyle(0x2d3436, 1);
        this.barraProgresoCable.fillRect(300, 780, 400, 10);
        this.barraProgresoCable.fillStyle(progreso > 0.85 ? 0x2ecc71 : 0x00f2fe, 1);
        this.barraProgresoCable.fillRect(300, 780, 400 * progreso, 10);
        this.barraProgresoCable.lineStyle(1.5, 0xffffff, 0.8);
        this.barraProgresoCable.strokeRect(300, 780, 400, 10);
    }

    iniciarTemporizador() {
        this.temporizador = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.juegoTerminado || this.juegoCompletado || this.nivelPausado) return;
                this.tiempoRestante--;
                if (this.textoTiempo) {
                    this.textoTiempo.setText(`TIEMPO: ${this.tiempoRestante}`);
                    if (this.tiempoRestante <= 15) {
                        this.textoTiempo.setFill(this.tiempoRestante % 2 === 0 ? '#ff4757' : '#ffffff');
                        if (this.tiempoRestante === 10) this.reproducirSonido('alerta_tiempo');
                    }
                }
                if (this.tiempoRestante <= 0) {
                    this.declararGameOver('¡Tiempo agotado! La presión de agua colapsó.');
                }
            },
            loop: true
        });
    }

    /* =========================================================================
     * CONTROLES DEL JUGADOR
     * ========================================================================= */
    configurarControles() {
        this.cursores = this.input.keyboard.createCursorKeys();
        this.teclaA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.teclaD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.teclaW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.teclaESPACIO = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.teclaESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.teclaENTER = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.teclaESC.on('down', () => this.volverAlOrigen());
    }

    /* =========================================================================
     * BUCLE PRINCIPAL DE ACTUALIZACIÓN
     * ========================================================================= */
    update(time, delta) {
        if (this.juegoTerminado || this.juegoCompletado) return;

        this.actualizarPlataformasMoviles();
        this.actualizarEnemigos(time, delta);
        this.actualizarNubesAmbiente();
        this.actualizarMovimientoJugador(time);
        this.actualizarCable();
        this.verificarCaidaAlVacio();
        this.verificarConexionTerminal();
    }

    actualizarEnemigos(time, delta) {
        const dt = delta / 1000;
        this.grupoEspectros.getChildren().forEach(esp => {
            if (!esp.active) return;
            // Recorrido horizontal amplio
            esp.x += esp.velocidadX * dt;
            if (esp.x >= esp.maxX && esp.velocidadX > 0) {
                esp.velocidadX = -Math.abs(esp.velocidadX);
                esp.setFlipX(true);
            } else if (esp.x <= esp.minX && esp.velocidadX < 0) {
                esp.velocidadX = Math.abs(esp.velocidadX);
                esp.setFlipX(false);
            }
            // Recorrido vertical amplio (onda senoidal)
            const t = (time * 0.0022) + esp.fase;
            esp.y = esp.baseY + Math.sin(t) * esp.amplitudY;
        });
    }

    actualizarPlataformasMoviles() {
        this.listaPlataformasMoviles.forEach(plat => {
            if (!plat || !plat.body) return;

            // Movimiento horizontal
            if (plat.minX !== undefined && plat.maxX !== undefined) {
                if (plat.x >= plat.maxX) {
                    plat.body.setVelocityX(-plat.velocidadBase);
                } else if (plat.x <= plat.minX) {
                    plat.body.setVelocityX(plat.velocidadBase);
                }
            }

            // Movimiento vertical
            if (plat.minY !== undefined && plat.maxY !== undefined) {
                if (plat.y >= plat.maxY) {
                    plat.body.setVelocityY(-plat.velocidadBaseY);
                } else if (plat.y <= plat.minY) {
                    plat.body.setVelocityY(plat.velocidadBaseY);
                }
            }
        });
    }

    actualizarNubesAmbiente() {
        if (!this.nubesAmbiente) return;
        this.nubesAmbiente.forEach(nube => {
            nube.x -= nube.velocidad;
            if (nube.x < -250) {
                nube.x = this.anchoMundo + 60;
            }
        });
    }

    actualizarMovimientoJugador(time) {
        const velX = 255;
        const enSuelo = this.jugador.body.blocked.down || this.jugador.body.touching.down;

        if (enSuelo) {
            this.tiempoUltimoSuelo = time;
            this.estaSaltando = false;
        }

        // Coyote time (140ms tras dejar el borde para saltos seguros)
        const coyoteActivo = (time - this.tiempoUltimoSuelo) < 140;

        // Buffer de salto (140ms antes de tocar suelo)
        const quiereSaltar = Phaser.Input.Keyboard.JustDown(this.cursores.up) ||
            Phaser.Input.Keyboard.JustDown(this.teclaW) ||
            Phaser.Input.Keyboard.JustDown(this.teclaESPACIO) ||
            window.mobileControls?.consume('up');

        if (quiereSaltar) this.tiempoBufferSalto = time;
        const saltoBuffereado = (time - this.tiempoBufferSalto) < 140;

        // Movimiento horizontal
        const izq = this.cursores.left.isDown || this.teclaA.isDown || window.mobileControls?.isDown('left');
        const der = this.cursores.right.isDown || this.teclaD.isDown || window.mobileControls?.isDown('right');

        let velXObjetivo = 0;
        if (izq) {
            velXObjetivo = -velX;
            this.mirandoDerecha = false;
        } else if (der) {
            velXObjetivo = velX;
            this.mirandoDerecha = true;
        }

        // Si está sobre plataforma móvil, arrastrar velocidad base
        if (enSuelo && this.jugadorEnPlataforma && this.jugadorEnPlataforma.body) {
            this.jugador.body.setVelocityX(velXObjetivo + this.jugadorEnPlataforma.body.velocity.x);
        } else {
            this.jugador.body.setVelocityX(velXObjetivo);
        }

        // Ejecución de salto potente y enérgico
        const fuerzaSalto = -575;
        if (saltoBuffereado && coyoteActivo && !this.estaSaltando) {
            this.jugador.body.setVelocityY(fuerzaSalto);
            this.estaSaltando = true;
            this.tiempoUltimoSuelo = 0;
            this.tiempoBufferSalto = 0;
            this.reproducirSonido('salto');
            this.crearPolvoSalto(this.jugador.x, this.jugador.y + 28);
        }

        // Salto variable suave (permite saltos cortos sin cortar bruscamente)
        const soltoSalto = Phaser.Input.Keyboard.JustUp(this.cursores.up) ||
            Phaser.Input.Keyboard.JustUp(this.teclaW) ||
            Phaser.Input.Keyboard.JustUp(this.teclaESPACIO);
        if (soltoSalto && this.jugador.body.velocity.y < -280) {
            this.jugador.body.setVelocityY(-280);
        }

        // Animaciones
        if (!enSuelo) {
            this.jugador.play(`salto-${this.avatarKey}`, true);
            this.jugador.setFlipX(!this.mirandoDerecha);
        } else if (velXObjetivo !== 0) {
            const anim = this.mirandoDerecha ? `caminar-der-${this.avatarKey}` : `caminar-izq-${this.avatarKey}`;
            this.jugador.play(anim, true);
            this.jugador.setFlipX(false);
        } else {
            this.jugador.play(`quieto-${this.avatarKey}`, true);
            this.jugador.setFlipX(!this.mirandoDerecha);
        }
    }

    crearPolvoSalto(x, y) {
        for (let i = 0; i < 4; i++) {
            const c = this.add.circle(x + Phaser.Math.Between(-12, 12), y, Phaser.Math.Between(2, 4), 0xdfe6e9, 0.8).setDepth(6);
            this.tweens.add({
                targets: c,
                y: y + Phaser.Math.Between(-8, 6),
                alpha: 0,
                duration: 250,
                onComplete: () => c.destroy()
            });
        }
    }

    /* =========================================================================
     * DINÁMICA DE CABLE DE ALTA TENSIÓN
     * ========================================================================= */
    actualizarCable() {
        this.graficosCable.clear();

        const origX = this.posicionSalidaCable.x;
        const origY = this.posicionSalidaCable.y;

        let destX, destY;
        if (this.cableConectado) {
            destX = this.posicionEnchufeMeta.x;
            destY = this.posicionEnchufeMeta.y;
        } else {
            destX = this.jugador.x + (this.mirandoDerecha ? -18 : 18);
            destY = this.jugador.y - 4;
        }

        const dx = destX - origX;
        const dy = destY - origY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Conversión a pies retro para el HUD extendido de 2200 px
        this.longitudCableFT = (dist / 2200) * this.maximaLongitudCableFT;
        this.actualizarHUD();

        // Curvatura natural por gravedad (catenaria cuadrática)
        const mitadX = (origX + destX) / 2;
        const caidaGravedad = Phaser.Math.Clamp(dist * 0.11, 10, 55);
        const mitadY = (origY + destY) / 2 + caidaGravedad;

        // Capas visuales del cable
        // 1. Contorno negro arcade
        this.graficosCable.lineStyle(6, 0x1e272e, 1);
        this.dibujarCurvaCable(origX, origY, mitadX, mitadY, destX, destY);

        // 2. Línea de energía dorada
        this.graficosCable.lineStyle(3.5, 0xf1c40f, 1);
        this.dibujarCurvaCable(origX, origY, mitadX, mitadY, destX, destY);

        // 3. Brillo interno neón blanco
        this.graficosCable.lineStyle(1.5, 0xffffff, 0.9);
        this.dibujarCurvaCable(origX, origY, mitadX, mitadY - 1, destX, destY);

        // Terminal acoplada visible en la turbina cuando se conecta
        if (this.cableConectado) {
            this.graficosCable.fillStyle(0x1e272e, 1);
            this.graficosCable.fillRoundedRect(destX - 8, destY - 9, 16, 18, 4);
            this.graficosCable.lineStyle(2, 0x00f2fe, 1);
            this.graficosCable.strokeRoundedRect(destX - 8, destY - 9, 16, 18, 4);
            this.graficosCable.fillStyle(0xf1c40f, 1);
            this.graficosCable.fillCircle(destX, destY, 4.5);
            this.graficosCable.fillStyle(0xffffff, 1);
            this.graficosCable.fillCircle(destX - 1, destY - 1, 2);
        }

        // Mochila / arnés sobre la espalda del personaje
        if (!this.cableConectado && this.jugador.active) {
            this.mochilaCable.clear();
            const mochX = this.jugador.x + (this.mirandoDerecha ? -19 : 7);
            const mochY = this.jugador.y - 12;

            this.mochilaCable.fillStyle(0x16a085, 1);
            this.mochilaCable.fillRoundedRect(mochX, mochY, 12, 20, 3);
            this.mochilaCable.lineStyle(1.5, 0x1e272e, 1);
            this.mochilaCable.strokeRoundedRect(mochX, mochY, 12, 20, 3);
            this.mochilaCable.fillStyle(0xf1c40f, 1);
            this.mochilaCable.fillRect(mochX + 2, mochY + 4, 8, 5);
        } else {
            this.mochilaCable.clear();
        }
    }

    dibujarCurvaCable(x0, y0, cx, cy, x1, y1) {
        const curva = new Phaser.Curves.QuadraticBezier(
            new Phaser.Math.Vector2(x0, y0),
            new Phaser.Math.Vector2(cx, cy),
            new Phaser.Math.Vector2(x1, y1)
        );
        const puntos = curva.getPoints(28);
        this.graficosCable.beginPath();
        this.graficosCable.moveTo(puntos[0].x, puntos[0].y);
        for (let i = 1; i < puntos.length; i++) {
            this.graficosCable.lineTo(puntos[i].x, puntos[i].y);
        }
        this.graficosCable.strokePath();
    }

    /* =========================================================================
     * LÓGICA DE DERROTA Y VICTORIA
     * ========================================================================= */
    verificarCaidaAlVacio() {
        if (this.jugador.y > 750) {
            this.vidas--;
            this.actualizarHUD();
            this.reproducirSonido('caida');

            if (this.vidas <= 0) {
                this.declararGameOver('Caíste a las profundidades del cañón Chicoasén.');
            } else {
                this.mostrarTextoFlotante(this.jugador.x, 700, '¡CAÍDA! -1 VIDA', '#ff4757');
                this.reaparecerEnUltimoPuntoSeguro();
            }
        }
    }

    reaparecerEnUltimoPuntoSeguro() {
        // Si el jugador ya había cruzado el descanso central (X > 1150), reaparece en el descanso
        let puntoSpawn = this.puntoSpawn;
        if (this.jugador.x > 1150) {
            puntoSpawn = { x: 1190, y: 495 };
        }

        this.jugador.body.reset(puntoSpawn.x, puntoSpawn.y);
        this.jugador.setVelocity(0, 0);
        this.restaurarPlataformasFragiles();

        this.invulnerable = true;
        this.tweens.add({
            targets: this.jugador,
            alpha: { from: 0.3, to: 1 },
            duration: 100,
            repeat: 5,
            onComplete: () => {
                this.jugador.setAlpha(1);
                this.invulnerable = false;
            }
        });
    }

    verificarConexionTerminal() {
        if (this.cableConectado || this.juegoCompletado) return;

        const dist = Phaser.Math.Distance.Between(
            this.jugador.x, this.jugador.y,
            this.posicionEnchufeMeta.x, this.posicionEnchufeMeta.y
        );

        // Conexión garantizada al acercarse al acantilado final frente a la turbina
        if (dist < 85 || this.jugador.x >= 2040) {
            this.conectarCableExitoso();
        }
    }

    conectarCableExitoso() {
        if (this.cableConectado || this.juegoCompletado) return;
        this.cableConectado = true;
        this.juegoCompletado = true;
        this.marcadorMeta.setVisible(false);

        // Inmovilizar personaje limpiamente mirando hacia la turbina
        this.jugador.body.setVelocity(0, 0);
        this.jugador.body.allowGravity = false;
        this.jugador.body.immovable = true;
        this.jugador.play(`quieto-${this.avatarKey}`, true);
        this.jugador.setFlipX(false);

        this.reproducirSonido('conexion_exito');

        // Flash y vibración de energía
        this.cameras.main.flash(400, 0, 242, 254);
        this.cameras.main.shake(250, 0.012);

        // Acelerar rotación del rodete hidráulico a máxima velocidad
        if (this.tweenTurbina) this.tweenTurbina.stop();
        this.tweens.add({
            targets: this.turbinaRotor,
            angle: '+=360',
            duration: 450,
            repeat: -1,
            ease: 'Linear'
        });

        // Explosión de chispas y energía limpia acoplada al conector
        for (let i = 0; i < 24; i++) {
            const p = this.add.image(this.posicionEnchufeMeta.x, this.posicionEnchufeMeta.y, 'chispa_cable').setDisplaySize(12, 12).setDepth(15);
            const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const d = Phaser.Math.Between(20, 95);
            this.tweens.add({
                targets: p,
                x: this.posicionEnchufeMeta.x + Math.cos(ang) * d,
                y: this.posicionEnchufeMeta.y + Math.sin(ang) * d,
                alpha: 0,
                scale: 0.2,
                duration: 650,
                ease: 'Quad.easeOut',
                onComplete: () => p.destroy()
            });
        }

        // Cálculo de bonos de fin de misión
        const bonusNivel = 1500;
        const bonusTiempo = this.tiempoRestante * 20;
        const bonusCable = Math.max(0, Math.round((this.maximaLongitudCableFT - this.longitudCableFT) * 15));
        this.puntuacion += bonusNivel + bonusTiempo + bonusCable;
        this.actualizarHUD();

        this.time.delayedCall(1200, () => {
            this.mostrarModalVictoria(bonusNivel, bonusTiempo, bonusCable);
        });
    }

    /* =========================================================================
     * MODALES DE FIN DE JUEGO (VICTORIA Y GAME OVER)
     * ========================================================================= */
    crearModalesFinDeJuego() {
        // ── Modal de Victoria (Gran Final Nivel 3) ────────────────────────────
        this.modalVictoria = this.add.container(500, 400).setDepth(30).setVisible(false).setAlpha(0).setScrollFactor(0);

        const telonV = this.add.graphics();
        telonV.fillStyle(0x000000, 0.85);
        telonV.fillRect(-500, -400, 1000, 800);

        const cardV = this.add.graphics();
        cardV.fillStyle(0x0c2461, 0.98);
        cardV.fillRoundedRect(-300, -210, 600, 420, 18);
        cardV.lineStyle(4, 0x00f2fe, 1);
        cardV.strokeRoundedRect(-300, -210, 600, 420, 18);

        const tituloV = this.add.text(0, -165, '★ ¡PRESA CHICOASÉN ACTIVADA! ★', {
            fontSize: '15px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f1c40f'
        }).setOrigin(0.5);

        const subV = this.add.text(0, -130, '¡Complejo Hidroeléctrico Energizado con Éxito!', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#7ed6df'
        }).setOrigin(0.5);

        this.textoDetalleVictoria = this.add.text(0, -20, '', {
            fontSize: '13px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 14
        }).setOrigin(0.5);

        this.modalVictoria.add([telonV, cardV, tituloV, subV, this.textoDetalleVictoria]);

        this.botonesVictoria = [
            this.crearBotonModalAbs(360, 540, 'REINTENTAR', 0xe67e22, () => this.reiniciarNivel()),
            this.crearBotonModalAbs(640, 540, 'SALIR', 0x27ae60, () => this.volverAlOrigen())
        ];

        // ── Modal de Game Over ───────────────────────────────────────────────
        this.modalGameOver = this.add.container(500, 400).setDepth(30).setVisible(false).setAlpha(0).setScrollFactor(0);

        const telonGO = this.add.graphics();
        telonGO.fillStyle(0x000000, 0.82);
        telonGO.fillRect(-500, -400, 1000, 800);

        const cardGO = this.add.graphics();
        cardGO.fillStyle(0x2c0b0e, 0.98);
        cardGO.fillRoundedRect(-280, -180, 560, 360, 18);
        cardGO.lineStyle(4, 0xff4757, 1);
        cardGO.strokeRoundedRect(-280, -180, 560, 360, 18);

        const tituloGO = this.add.text(0, -130, '¡MISIÓN FALLIDA!', {
            fontSize: '20px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ff4757'
        }).setOrigin(0.5);

        this.textoCausaGameOver = this.add.text(0, -75, '', {
            fontSize: '11px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#dcdde1',
            align: 'center',
            wordWrap: { width: 480 }
        }).setOrigin(0.5);

        this.textoScoreGameOver = this.add.text(0, -15, '', {
            fontSize: '13px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f1c40f'
        }).setOrigin(0.5);

        this.modalGameOver.add([telonGO, cardGO, tituloGO, this.textoCausaGameOver, this.textoScoreGameOver]);

        this.botonesGameOver = [
            this.crearBotonModalAbs(380, 510, 'REINTENTAR', 0x27ae60, () => this.reiniciarNivel()),
            this.crearBotonModalAbs(620, 510, 'SALIR', 0x747d8c, () => this.volverAlOrigen())
        ];
    }

    crearBotonModalAbs(x, y, texto, colorHex, accion) {
        const bg = this.add.graphics().setDepth(32).setScrollFactor(0).setVisible(false).setAlpha(0);
        bg.fillStyle(colorHex, 1);
        bg.fillRoundedRect(x - 90, y - 22, 180, 44, 10);
        bg.lineStyle(2, 0xffffff, 0.9);
        bg.strokeRoundedRect(x - 90, y - 22, 180, 44, 10);

        const txt = this.add.text(x, y, texto, {
            fontSize: '11px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(33).setScrollFactor(0).setVisible(false).setAlpha(0);

        const zone = this.add.zone(x, y, 180, 44).setDepth(34).setScrollFactor(0).disableInteractive();
        zone.on('pointerdown', () => { this.reproducirSonido('click'); accion(); });
        zone.on('pointerover', () => { bg.setAlpha(0.85); txt.setScale(1.05); });
        zone.on('pointerout', () => { bg.setAlpha(1); txt.setScale(1); });

        return { bg, txt, zone };
    }

    _setBotonesVisible(botones, visible, alpha) {
        if (!botones) return;
        for (const b of botones) {
            b.bg.setVisible(visible);
            b.txt.setVisible(visible);
            b.bg.setAlpha(alpha);
            b.txt.setAlpha(alpha);
            if (visible) { b.zone.setInteractive({ useHandCursor: true }); }
            else { b.zone.disableInteractive(); }
        }
    }

    mostrarModalVictoria(bonusNivel, bonusTiempo, bonusCable) {
        this.textoDetalleVictoria.setText(
            `NIVEL 3 SUPERADO: +${bonusNivel}\n` +
            `BONO TIEMPO    : +${bonusTiempo}\n` +
            `BONO CABLE     : +${bonusCable}\n\n` +
            `RAYOS DE LUZ   : ${this.energiaRecolectada}/${this.totalEnergia}\n\n` +
            `PUNTUACIÓN TOTAL : ${this.puntuacion}`
        );
        this._setBotonesVisible(this.botonesVictoria, false, 0);
        this.modalVictoria.setVisible(true);
        this.tweens.add({
            targets: this.modalVictoria,
            alpha: 1,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => this._setBotonesVisible(this.botonesVictoria, true, 1)
        });
    }

    declararGameOver(causa) {
        if (this.juegoTerminado) return;
        this.juegoTerminado = true;
        this.reproducirSonido('game_over');
        this.textoCausaGameOver.setText(causa);
        this.textoScoreGameOver.setText(`SCORE FINAL: ${this.puntuacion}`);
        this._setBotonesVisible(this.botonesGameOver, false, 0);
        this.modalGameOver.setVisible(true);
        this.tweens.add({
            targets: this.modalGameOver,
            alpha: 1,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => this._setBotonesVisible(this.botonesGameOver, true, 1)
        });
    }

    reiniciarNivel() {
        this.esReinicio = true;
        this.scene.restart();
    }

    volverAlOrigen() {
        this.detenerMusicaFondo();
        if (this.origen === 'EscenaMenu') {
            this.scene.start('EscenaMenu');
        } else {
            this.scene.start('EscenaJuego', {
                posInicial: { x: 540, y: 535 },
                avatarKey: this.avatarKey
            });
        }
    }

    mostrarTextoFlotante(x, y, mensaje, colorHex) {
        const txt = this.add.text(x, y, mensaje, {
            fontSize: '13px',
            fontFamily: '"Press Start 2P", monospace',
            fill: colorHex,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(25);

        this.tweens.add({
            targets: txt,
            y: y - 35,
            alpha: 0,
            duration: 850,
            ease: 'Cubic.easeOut',
            onComplete: () => txt.destroy()
        });
    }

    /* =========================================================================
     * SINTETIZADOR DE AUDIO PROCEDURAL (WEB AUDIO API)
     * ========================================================================= */
    initAudioSynthesizer() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioCtx();
        } catch (e) {
            this.audioCtx = null;
        }
    }

    reproducirSonido(tipo) {
        if (!this.audioCtx) return;
        try {
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            const t = this.audioCtx.currentTime;

            if (tipo === 'salto') {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(160, t);
                osc.frequency.exponentialRampToValueAtTime(340, t + 0.12);
                gain.gain.setValueAtTime(0.12, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(t);
                osc.stop(t + 0.13);
            } else if (tipo === 'orbe') {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(520, t);
                osc.frequency.setValueAtTime(780, t + 0.08);
                osc.frequency.setValueAtTime(1040, t + 0.15);
                gain.gain.setValueAtTime(0.18, t);
                gain.gain.exponentialRampToValueAtTime(0.005, t + 0.35);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(t);
                osc.stop(t + 0.36);
            } else if (tipo === 'zap') {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(280, t);
                osc.frequency.linearRampToValueAtTime(70, t + 0.2);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(t);
                osc.stop(t + 0.21);
            } else if (tipo === 'conexion_exito') {
                const notas = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
                notas.forEach((f, idx) => {
                    const osc = this.audioCtx.createOscillator();
                    const gain = this.audioCtx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(f, t + idx * 0.1);
                    gain.gain.setValueAtTime(0, t + idx * 0.1);
                    gain.gain.linearRampToValueAtTime(0.2, t + idx * 0.1 + 0.03);
                    gain.gain.exponentialRampToValueAtTime(0.005, t + idx * 0.1 + 0.4);
                    osc.connect(gain);
                    gain.connect(this.audioCtx.destination);
                    osc.start(t + idx * 0.1);
                    osc.stop(t + idx * 0.1 + 0.42);
                });
            } else if (tipo === 'crujido') {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(90, t);
                osc.frequency.setValueAtTime(140, t + 0.04);
                gain.gain.setValueAtTime(0.08, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.09);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(t);
                osc.stop(t + 0.1);
            } else if (tipo === 'derrumbe') {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(110, t);
                osc.frequency.exponentialRampToValueAtTime(35, t + 0.25);
                gain.gain.setValueAtTime(0.14, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.25);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(t);
                osc.stop(t + 0.26);
            } else if (tipo === 'click') {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, t);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.05);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(t);
                osc.stop(t + 0.06);
            } else if (tipo === 'caida' || tipo === 'game_over') {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(240, t);
                osc.frequency.exponentialRampToValueAtTime(50, t + 0.5);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.5);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(t);
                osc.stop(t + 0.52);
            }
        } catch (e) {
            // Audio Web API silenciado ante restricciones del navegador
        }
    }

    detenerMusicaFondo() {
        if (this.audioCtx) {
            try { this.audioCtx.close(); } catch (e) { }
            this.audioCtx = null;
        }
    }
}
