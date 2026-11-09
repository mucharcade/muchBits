/**
 * MuchBits - Sala C: Desarrollo Sustentable
 * Juego: Conexión de Energía Limpia (Nivel 2: Ruinas Mayas con Parque Eólico)
 *
 * Mecánica principal:
 * - El jugador carga un cable de suministro eléctrico desde el generador inicial.
 * - Debe cruzar plataformas flotantes: estáticas, móviles horizontales, elevadizas
 *   verticales y FRÁGILES (caen 2 segundos después de pisarlas).
 * - Esquiva espectros de viento/tormenta que patrullan zonas más amplias.
 * - Conecta el cable a la turbina eólica en el acantilado derecho.
 * - Físicas arcade, cable dinámico con catenaria, HUD retro estilo CRT.
 */

class EscenaSustentable2 extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaSustentable2' });
    }

    init(data) {
        this.origen    = data && data.origen    ? data.origen    : 'EscenaJuego';
        this.avatarKey = data && data.avatarKey ? data.avatarKey : (localStorage.getItem('muchbits-avatar') || 'user_male');
        this.nivelActual = 2;
        this.maxNiveles  = 3;
    }

    preload() {
        // Fondo Nivel 2: Paisaje Eólico / Ruinas Mayas (1699x926)
        this.load.image('fondo_sustentable_n2', 'pictures/sala_desarrollo_sustentable/Paisaje_Eolico_Ruinas_Maya.png');

        // Texturas de plataformas (mismo conjunto que N1)
        this.load.image('plat_estable',    'pictures/sala_desarrollo_sustentable/plataforma_estable.png');
        this.load.image('plat_movimiento', 'pictures/sala_desarrollo_sustentable/plataforma_movimiento.png');
        this.load.image('plat_fragil',     'pictures/sala_desarrollo_sustentable/plataforma_fragil.png');

        // Spritesheet del avatar seleccionado (4x4 frames de 64x64)
        this.load.spritesheet(`avatar-${this.avatarKey}`, `pictures/${this.avatarKey}.png`, {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    create() {
        this.initAudioSynthesizer();

        // ── Estado del juego ────────────────────────────────────────────────────
        this.vidas             = 3;
        this.maxVidas          = 3;
        this.puntuacion        = 0;
        this.tiempoRestante    = 65;        // un poco más de tiempo — nivel más largo
        this.juegoTerminado    = false;
        this.juegoPausado      = false;
        this.nivelCompletado   = false;
        this.invulnerable      = false;
        this.cableConectado    = false;
        this.distanciaPorcentaje = 0;

        this.longitudCableFT    = 0;
        this.maxLongitudCableFT = 160;      // Cable un poco más largo para N2

        // ── Dimensiones del mundo (mismo aspect ratio que N1: ~1.83) ───────────
        this.anchoMundo = 1500;
        this.altoMundo  = 800;
        this.physics.world.setBounds(0, 0, this.anchoMundo, this.altoMundo);

        // ── Texturas procedurales ───────────────────────────────────────────────
        this.generarTexturas();

        // ── Animaciones del avatar ──────────────────────────────────────────────
        this.crearAnimaciones();

        // ── Escena ─────────────────────────────────────────────────────────────
        this.crearFondo();
        this.crearNivel2();
        this.crearJugador();

        // ── Cámara con seguimiento suave ────────────────────────────────────────
        this.cameras.main.setBounds(0, 0, this.anchoMundo, this.altoMundo);
        this.cameras.main.startFollow(this.jugador, true, 0.08, 0.08);
        this.cameras.main.setDeadzone(100, 120);

        // ── Físicas y sistemas ─────────────────────────────────────────────────
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
     * TEXTURAS PROCEDURALES
     * ========================================================================= */
    generarTexturas() {
        // Plataforma estable a resolución nativa 135x52
        if (this.textures.exists('plat_estable') && !this.textures.exists('plat_estable_game')) {
            const src = this.textures.get('plat_estable').getSourceImage();
            const c = this.textures.createCanvas('plat_estable_game', 135, 52);
            if (c && c.context) { c.context.drawImage(src, 0, 0, 135, 52); c.refresh(); }
        }

        // Plataforma de movimiento a resolución nativa 135x52 y 100x44
        if (this.textures.exists('plat_movimiento') && !this.textures.exists('plat_movimiento_game')) {
            const src = this.textures.get('plat_movimiento').getSourceImage();
            const cM = this.textures.createCanvas('plat_movimiento_game', 135, 52);
            if (cM && cM.context) { cM.context.drawImage(src, 0, 0, 135, 52); cM.refresh(); }
            const cS = this.textures.createCanvas('plat_movimiento_sm_game', 100, 44);
            if (cS && cS.context) { cS.context.drawImage(src, 0, 0, 100, 44); cS.refresh(); }
        }

        // Plataforma frágil a resolución nativa 135x52
        if (this.textures.exists('plat_fragil') && !this.textures.exists('plat_fragil_game')) {
            const src = this.textures.get('plat_fragil').getSourceImage();
            const c = this.textures.createCanvas('plat_fragil_game', 135, 52);
            if (c && c.context) { c.context.drawImage(src, 0, 0, 135, 52); c.refresh(); }
        }

        // Espectro de tormenta (enemigo) — 48x44
        if (!this.textures.exists('espectro_tormenta2')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            // Aura exterior translúcida (tono verdoso para diferenciar del N1)
            c.fillStyle(0x55efc4, 0.3);
            c.fillCircle(24, 22, 20);
            // Cuerpo nuboso
            c.fillStyle(0xdfe6e9, 1);
            c.fillCircle(24, 18, 14);
            c.fillCircle(14, 22, 10);
            c.fillCircle(34, 22, 10);
            // Cola flotante
            c.fillStyle(0xb2bec3, 1);
            c.fillPoints([
                { x: 12, y: 26 }, { x: 4, y: 22 },
                { x: 10, y: 32 }, { x: 24, y: 30 }
            ], true);
            // Ojos con tono verde oscuro
            c.fillStyle(0x00b894, 1);
            c.fillEllipse(18, 17, 3.5, 4.5);
            c.fillEllipse(30, 17, 3.5, 4.5);
            c.fillStyle(0xffffff, 0.8);
            c.fillCircle(17, 16, 1.2);
            c.fillCircle(29, 16, 1.2);
            // Cejas fruncidas
            c.lineStyle(2, 0x2f3542, 1);
            c.strokeLineShape(new Phaser.Geom.Line(14, 12, 20, 15));
            c.strokeLineShape(new Phaser.Geom.Line(34, 12, 28, 15));
            c.generateTexture('espectro_tormenta2', 48, 44);
            c.destroy();
        }

        // Carrete/generador de cable (igual que N1 — reutiliza si existe)
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

        // 1. Torre y Góndola de la Turbina Eólica (Estática) — 80x160
        if (!this.textures.exists('turbina_base')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });

            // Base de anclaje en el suelo
            c.fillStyle(0x2f3640, 1);
            c.fillRoundedRect(20, 148, 40, 12, 3);
            c.lineStyle(2, 0x1e272e, 1);
            c.strokeRoundedRect(20, 148, 40, 12, 3);

            // Mástil / Torre troncocónica
            c.fillStyle(0xdfe6e9, 1);
            c.fillPoints([
                { x: 34, y: 34 },
                { x: 46, y: 34 },
                { x: 49, y: 148 },
                { x: 31, y: 148 }
            ], true);
            c.lineStyle(2, 0x718093, 1);
            c.strokePoints([
                { x: 34, y: 34 },
                { x: 46, y: 34 },
                { x: 49, y: 148 },
                { x: 31, y: 148 }
            ], true);

            // Líneas de ensamblaje de la torre
            c.lineStyle(1, 0xb2bec3, 0.8);
            c.strokeLineShape(new Phaser.Geom.Line(33, 72, 47, 72));
            c.strokeLineShape(new Phaser.Geom.Line(32, 110, 48, 110));

            // Terminal de conexión eléctrica en la base (lado izquierdo)
            c.fillStyle(0x2d3436, 1);
            c.fillRoundedRect(8, 106, 26, 38, 4);
            c.lineStyle(2, 0x00f2fe, 1);
            c.strokeRoundedRect(8, 106, 26, 38, 4);

            // Puerto / Enchufe de cable con conector cyan neón
            c.fillStyle(0x00f2fe, 1);
            c.fillCircle(12, 125, 4);
            c.fillStyle(0xffffff, 0.9);
            c.fillCircle(11, 124, 1.5);

            // Icono de rayo en la terminal
            c.fillStyle(0xf1c40f, 1);
            c.fillPoints([
                { x: 22, y: 115 },
                { x: 17, y: 124 },
                { x: 22, y: 124 },
                { x: 19, y: 132 },
                { x: 26, y: 121 },
                { x: 22, y: 121 }
            ], true);

            // Góndola superior (alojamiento del generador)
            c.fillStyle(0xf5f6fa, 1);
            c.fillRoundedRect(22, 18, 42, 24, 6);
            c.lineStyle(2, 0x718093, 1);
            c.strokeRoundedRect(22, 18, 42, 24, 6);

            // Detalle de rejilla de ventilación en la parte posterior
            c.fillStyle(0x718093, 1);
            c.fillRect(52, 24, 8, 3);
            c.fillRect(52, 30, 8, 3);
            c.fillRect(52, 36, 8, 3);

            // Soporte del eje del rotor (en X=40, Y=30)
            c.fillStyle(0x2f3640, 1);
            c.fillCircle(40, 30, 6);

            c.generateTexture('turbina_base', 80, 160);
            c.destroy();
        }

        // 2. Rotor con 3 aspas aerodinámicas simétricas a 120° (Rotatorio) — 160x160
        if (!this.textures.exists('turbina_aspas')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            const cx = 80;
            const cy = 80;

            // 3 ángulos exactamente a 120 grados de separación simétrica (-90°, 30°, 150°)
            const angulos = [
                -Math.PI / 2,
                -Math.PI / 2 + (2 * Math.PI / 3),
                -Math.PI / 2 + (4 * Math.PI / 3)
            ];

            angulos.forEach((ang) => {
                const ux = Math.cos(ang);
                const uy = Math.sin(ang);
                const vx = -Math.sin(ang);
                const vy = Math.cos(ang);

                // Perfil estilizado de pala eólica (más ancha en el medio, estilizada en la punta)
                const puntos = [
                    { x: cx + ux * 8 - vx * 3.5,  y: cy + uy * 8 - vy * 3.5 },
                    { x: cx + ux * 28 - vx * 7,    y: cy + uy * 28 - vy * 7 },
                    { x: cx + ux * 65 - vx * 2.5,  y: cy + uy * 65 - vy * 2.5 },
                    { x: cx + ux * 70,             y: cy + uy * 70 },
                    { x: cx + ux * 65 + vx * 2.5,  y: cy + uy * 65 + vy * 2.5 },
                    { x: cx + ux * 28 + vx * 7,    y: cy + uy * 28 + vy * 7 },
                    { x: cx + ux * 8 + vx * 3.5,   y: cy + uy * 8 + vy * 3.5 }
                ];

                c.fillStyle(0xf5f6fa, 1);
                c.fillPoints(puntos, true);

                c.lineStyle(2, 0x718093, 1);
                c.strokePoints(puntos, true);

                // Nervadura central aerodinámica
                c.lineStyle(1, 0xdcdde1, 0.9);
                c.strokeLineShape(new Phaser.Geom.Line(cx + ux * 10, cy + uy * 10, cx + ux * 65, cy + uy * 65));
            });

            // Buje central (Hub)
            c.fillStyle(0x2f3640, 1);
            c.fillCircle(cx, cy, 11);
            c.lineStyle(2, 0x718093, 1);
            c.strokeCircle(cx, cy, 11);

            // Tapa central dorada
            c.fillStyle(0xf1c40f, 1);
            c.fillCircle(cx, cy, 6);

            // Reflejo
            c.fillStyle(0xffffff, 0.9);
            c.fillCircle(cx - 2, cy - 2, 2);

            c.generateTexture('turbina_aspas', 160, 160);
            c.destroy();
        }

        // Orbe de energía (reutiliza si existe)
        if (!this.textures.exists('orbe_energia')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0x00f2fe, 0.3);
            c.fillCircle(12, 12, 11);
            c.fillStyle(0x00d2d3, 0.8);
            c.fillCircle(12, 12, 8);
            c.fillStyle(0xffffff, 1);
            c.fillCircle(10, 10, 4);
            c.generateTexture('orbe_energia', 24, 24);
            c.destroy();
        }

        // Chispa eléctrica (reutiliza si existe)
        if (!this.textures.exists('chispa_cable')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0xf1c40f, 1);
            c.fillCircle(6, 6, 4);
            c.fillStyle(0xffffff, 1);
            c.fillCircle(5, 5, 2);
            c.generateTexture('chispa_cable', 12, 12);
            c.destroy();
        }
    }

    /* =========================================================================
     * ANIMACIONES DE PERSONAJE
     * ========================================================================= */
    crearAnimaciones() {
        const key = `avatar-${this.avatarKey}`;
        const frameDerecha = this.avatarKey === 'user_male' ? 8 : 12;
        const frameIzquierda = this.avatarKey === 'user_male' ? 12 : 8;
        if (!this.anims.exists(`${key}-correr-der`)) {
            this.anims.create({ key: `${key}-correr-der`, frames: this.anims.generateFrameNumbers(key, { start: frameDerecha, end: frameDerecha + 3 }), frameRate: 10, repeat: -1 });
        }
        if (!this.anims.exists(`${key}-correr-izq`)) {
            this.anims.create({ key: `${key}-correr-izq`, frames: this.anims.generateFrameNumbers(key, { start: frameIzquierda, end: frameIzquierda + 3 }), frameRate: 10, repeat: -1 });
        }
        if (!this.anims.exists(`${key}-quieto`)) {
            this.anims.create({ key: `${key}-quieto`, frames: [{ key, frame: 0 }], frameRate: 1 });
        }
        if (!this.anims.exists(`${key}-salto`)) {
            this.anims.create({ key: `${key}-salto`, frames: [{ key, frame: frameDerecha + 1 }], frameRate: 1 });
        }
    }

    /* =========================================================================
     * FONDO DEL ESCENARIO
     * ========================================================================= */
    crearFondo() {
        // Fondo Nivel 2 — Paisaje Eólico / Ruinas Mayas (1699x926 → 1500x800)
        this.fondo = this.add.image(this.anchoMundo / 2, this.altoMundo / 2, 'fondo_sustentable_n2')
            .setDisplaySize(this.anchoMundo, this.altoMundo)
            .setDepth(0);

        // Capa ambiental tenue (tono verdoso / húmedo de selva)
        const filtroAmb = this.add.graphics().setDepth(1);
        filtroAmb.fillStyle(0x00b894, 0.06);
        filtroAmb.fillRect(0, 0, this.anchoMundo, this.altoMundo);

        // Nubes decorativas lejanas con movimiento lento
        this.nubesLejanas = [];
        for (let i = 0; i < 6; i++) {
            const x = Phaser.Math.Between(50, this.anchoMundo - 50);
            const y = Phaser.Math.Between(60, 200);
            const nube = this.add.graphics().setDepth(1).setAlpha(0.4);
            nube.fillStyle(0xdfe6e9, 0.6);
            nube.fillCircle(0, 0, 26);
            nube.fillCircle(22, -4, 18);
            nube.fillCircle(-22, 2, 20);
            nube.fillRoundedRect(-36, 2, 72, 14, 7);
            nube.x = x;
            nube.y = y;
            nube.velocidad = Phaser.Math.FloatBetween(0.12, 0.40);
            this.nubesLejanas.push(nube);
        }
    }

    /* =========================================================================
     * ESTRUCTURA DEL NIVEL 2
     * ========================================================================= */
    crearNivel2() {
        // Grupos de físicas
        this.plataformasEstaticas = this.physics.add.staticGroup();
        this.plataformasMoviles   = this.physics.add.group({ allowGravity: false, immovable: true });

        // Lista de plataformas frágiles (para lógica especial de caída)
        this.listaFragiles        = [];
        this.listaPlataformasMoviles = [];

        // ── 1. Acantilado Izquierdo (inicio, generador) ────────────────────────
        const acIzq = this.add.graphics();
        acIzq.fillStyle(0x3d2b1a, 1);
        acIzq.fillRoundedRect(-20, 555, 180, 285, 14);
        acIzq.fillStyle(0x5c3d1e, 1);
        acIzq.fillRect(0, 560, 150, 265);
        // Césped / vegetación selvática
        acIzq.fillStyle(0x27ae60, 1);
        acIzq.fillRoundedRect(-10, 548, 165, 20, 7);
        acIzq.fillStyle(0x2ecc71, 1);
        acIzq.fillRoundedRect(0, 550, 150, 8, 3);
        acIzq.setDepth(3);

        const colIzq = this.add.rectangle(75, 568, 150, 36, 0x000000, 0);
        this.physics.add.existing(colIzq, true);
        this.plataformasEstaticas.add(colIzq);

        // Generador de cable
        this.posicionSalidaCable = { x: 135, y: 530 };
        this.carreteGenerador = this.add.image(95, 522, 'carrete_generador')
            .setDisplaySize(72, 64).setDepth(5);

        this.ledGenerador = this.add.circle(75, 505, 3, 0x2ecc71, 1).setDepth(6);
        this.tweens.add({ targets: this.ledGenerador, alpha: { from: 0.3, to: 1 }, duration: 500, yoyo: true, repeat: -1 });

        // ── 2. Acantilado Derecho (destino, turbina eólica) ────────────────────
        const acDer = this.add.graphics();
        acDer.fillStyle(0x3d2b1a, 1);
        acDer.fillRoundedRect(1328, 548, 182, 292, 14);
        acDer.fillStyle(0x5c3d1e, 1);
        acDer.fillRect(1338, 553, 172, 272);
        // Césped
        acDer.fillStyle(0x27ae60, 1);
        acDer.fillRoundedRect(1328, 540, 182, 20, 7);
        acDer.fillStyle(0x2ecc71, 1);
        acDer.fillRoundedRect(1333, 542, 177, 8, 3);
        acDer.setDepth(3);

        const colDer = this.add.rectangle(1415, 558, 170, 36, 0x000000, 0);
        this.physics.add.existing(colDer, true);
        this.plataformasEstaticas.add(colDer);

        // 1. Torre y Góndola de la turbina eólica (ESTÁTICA, fija en el suelo del acantilado)
        this.turbinaBase = this.add.image(1420, 542, 'turbina_base')
            .setOrigin(0.5, 1)
            .setDisplaySize(80, 160)
            .setDepth(5);

        // 2. Rotor con 3 aspas simétricas a 120° (ROTATORIO, montado en el buje de la góndola)
        this.turbinaAspas = this.add.image(1420, 412, 'turbina_aspas')
            .setOrigin(0.5, 0.5)
            .setDisplaySize(140, 140)
            .setDepth(6);

        // SOLO rotan las aspas (la torre, la góndola y el enchufe se mantienen firmes)
        this.tweens.add({
            targets: this.turbinaAspas,
            angle: 360,
            duration: 3500,
            repeat: -1,
            ease: 'Linear'
        });

        // Punto exacto de enchufe (en el conector de la terminal estática izquierda)
        this.posicionEnchufeMeta = { x: 1392, y: 507 };
        this.zonaConexionTerminal = this.add.zone(1390, 507, 48, 72);
        this.physics.add.existing(this.zonaConexionTerminal, true);

        // Marcador de meta
        this.marcadorMeta = this.add.text(1392, 440, '⚡ CONECTA AQUÍ', {
            fontSize: '11px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#00f2fe',
            stroke: '#1e272e',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(12);

        this.tweens.add({
            targets: this.marcadorMeta,
            y: 432,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ── 3. Plataformas Intermedias con mayor separación ────────────────────
        this.listaPlataformasMoviles = [];

        // Plataforma 1 — ESTÁTICA: primer escalón seguro desde el acantilado
        this.crearPlataformaEstatica(285, 585);

        // Plataforma 3 — MÓVIL HORIZONTAL: patrulla en zona media-izquierda
        this.crearPlataformaMovilHorizontal(685, 470, 620, 750, 75);

        // Plataforma 4 — ELEVADIZA VERTICAL: sube y baja entre ruinas
        this.crearPlataformaElevadizaVertical(855, 445, 360, 530, 65);

        // Plataforma 6 — MÓVIL HORIZONTAL: puente dinámico hacia la meta
        this.crearPlataformaMovilHorizontal(1190, 480, 1140, 1240, 75);

        // Definición de las plataformas frágiles para crearlas y poder restaurarlas al revivir
        this.datosPlataformasFragiles = [
            { x: 475, y: 525 },  // Plataforma 2 (FRÁGIL): enlace entre estática 1 y móvil 3
            { x: 1020, y: 425 }, // Plataforma 5 (FRÁGIL): enlace entre elevadiza 4 y móvil 6
            { x: 1270, y: 510 }  // Plataforma 7 (FRÁGIL): escalón de llegada al acantilado
        ];

        this.restaurarPlataformasFragiles();
    }

    /* ── Creadores de plataformas ────────────────────────────────────────────── */

    crearPlataformaEstatica(x, y) {
        const key = this.textures.exists('plat_estable_game') ? 'plat_estable_game'
                  : this.textures.exists('plat_estable')      ? 'plat_estable'
                  : 'plataforma_flotante_med';
        const plat = this.plataformasEstaticas.create(x, y, key);
        plat.setDisplaySize(135, 52).setDepth(4).refreshBody();
        plat.body.setSize(124, 20);
        plat.body.setOffset(5, 4);
        plat.body.checkCollision.down  = false;
        plat.body.checkCollision.left  = false;
        plat.body.checkCollision.right = false;
        plat.body.checkCollision.up    = true;
        return plat;
    }

    crearPlataformaMovilHorizontal(x, y, minX, maxX, velocidad) {
        const key = this.textures.exists('plat_movimiento_game') ? 'plat_movimiento_game'
                  : this.textures.exists('plat_movimiento')      ? 'plat_movimiento'
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
        plat.body.checkCollision.down  = false;
        plat.body.checkCollision.left  = false;
        plat.body.checkCollision.right = false;
        plat.body.checkCollision.up    = true;
        plat.minX = minX; plat.maxX = maxX;
        plat.velocidadBase = velocidad;
        plat.body.setVelocityX(velocidad);
        plat.tipoMovimiento = 'horizontal';
        this.listaPlataformasMoviles.push(plat);
        return plat;
    }

    crearPlataformaElevadizaVertical(x, y, minY, maxY, velocidad) {
        const key = this.textures.exists('plat_movimiento_sm_game') ? 'plat_movimiento_sm_game'
                  : this.textures.exists('plat_movimiento')         ? 'plat_movimiento'
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
        plat.body.checkCollision.down  = false;
        plat.body.checkCollision.left  = false;
        plat.body.checkCollision.right = false;
        plat.body.checkCollision.up    = true;
        plat.minY = minY; plat.maxY = maxY;
        plat.velocidadBase = velocidad;
        plat.body.setVelocityY(velocidad);
        plat.tipoMovimiento = 'vertical';
        this.listaPlataformasMoviles.push(plat);
        return plat;
    }

    /**
     * Restaura todas las plataformas frágiles al revivir el jugador.
     * Cancela temblores/caídas activas y regenera las plataformas sólidas e intactas.
     */
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
            this.datosPlataformasFragiles.forEach((dato) => {
                this.crearPlataformaFragil(dato.x, dato.y);
            });
        }
    }

    /**
     * Crea una plataforma frágil que cae al vacío 2 segundos después
     * de que el jugador la pise por primera vez.
     */
    crearPlataformaFragil(x, y) {
        const key = this.textures.exists('plat_fragil_game') ? 'plat_fragil_game'
                  : this.textures.exists('plat_fragil')      ? 'plat_fragil'
                  : 'plataforma_flotante_med';

        // Las frágiles son inicialmente ESTÁTICAS sólidas
        const plat = this.plataformasEstaticas.create(x, y, key);
        plat.setDisplaySize(135, 52).setDepth(4).refreshBody();
        plat.body.setSize(124, 20);
        plat.body.setOffset(5, 4);
        plat.body.checkCollision.down  = false;
        plat.body.checkCollision.left  = false;
        plat.body.checkCollision.right = false;
        plat.body.checkCollision.up    = true;

        // Estado inicial intacto
        plat.esFragil   = true;
        plat.disparada  = false;
        plat.cayendo    = false;
        plat.setAlpha(1);
        plat.clearTint();

        // Efecto visual: leve pulsación para señalar fragilidad
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

    /**
     * Se llama cuando el jugador toca una plataforma frágil por primera vez.
     * Espera exactamente 2 segundos temblando en advertencia y luego cae al vacío.
     */
    activarCaidaFragil(plat) {
        if (plat.disparada) return;
        plat.disparada = true;

        this.reproducirSonido('crujido');
        plat.setTint(0xff7675); // Tinte rojizo de fractura

        // Vibración rápida de advertencia durante exactamente 2 segundos (20 ciclos * 100ms = 2000ms)
        plat.tweenTemblor = this.tweens.add({
            targets: plat,
            x: { from: plat.x - 3, to: plat.x + 3 },
            duration: 50,
            yoyo: true,
            repeat: 19,
            ease: 'Linear'
        });

        // A los 2 segundos exactos se desprende y cae al abismo
        plat.timerCaida = this.time.delayedCall(2000, () => {
            if (plat && plat.active) {
                this.iniciarCaidaLibre(plat);
            }
        });
    }

    iniciarCaidaLibre(plat) {
        if (!plat.active || plat.cayendo) return;
        plat.cayendo = true;

        // Desactivar colisión inmediatamente: si el jugador sigue arriba, caerá al vacío
        plat.body.enable = false;
        this.reproducirSonido('crujido');

        // Partículas de desprendimiento rocoso
        for (let i = 0; i < 8; i++) {
            const p = this.add.image(plat.x + Phaser.Math.Between(-50, 50), plat.y + 10, 'chispa_cable')
                .setDisplaySize(6, 6).setDepth(6);
            this.tweens.add({
                targets: p,
                x: p.x + Phaser.Math.Between(-30, 30),
                y: p.y + Phaser.Math.Between(20, 70),
                alpha: 0,
                scale: 0.2,
                duration: 450,
                onComplete: () => p.destroy()
            });
        }

        // Caída acelerada hacia el fondo del abismo
        plat.tweenCaida = this.tweens.add({
            targets: plat,
            y: this.altoMundo + 150,
            angle: Phaser.Math.Between(-12, 12),
            duration: 900,
            ease: 'Quad.easeIn',
            onComplete: () => {
                if (plat && plat.active) {
                    plat.destroy();
                }
            }
        });
    }

    /* =========================================================================
     * JUGADOR Y ARNES/MOCHILA DE CABLE
     * ========================================================================= */
    crearJugador() {
        this.puntoSpawn = { x: 100, y: 498 };
        this.jugador = this.physics.add.sprite(this.puntoSpawn.x, this.puntoSpawn.y, `avatar-${this.avatarKey}`);
        this.jugador.setDisplaySize(58, 58).setDepth(7).setCollideWorldBounds(true);
        this.jugador.body.setGravityY(980);
        this.jugador.body.setSize(30, 48);
        this.jugador.body.setOffset(17, 14);
        this.mochilaCable = this.add.graphics().setDepth(7.5);
        this.jugadorEnPlataforma = null;
        this.mirandoDerecha = true;
    }

    /* =========================================================================
     * COLISIONES Y CONTACTOS
     * ========================================================================= */
    configurarColisiones() {
        // Colisión jugador ↔ plataformas estáticas (incluye frágiles al inicio)
        this.physics.add.collider(this.jugador, this.plataformasEstaticas, (jugador, plat) => {
            this.jugadorEnPlataforma = null;

            // Si es frágil y el jugador la pisa desde arriba → activar cuenta regresiva
            if (plat.esFragil && jugador.body.touching.down && plat.body.touching.up) {
                this.activarCaidaFragil(plat);
            }
        });

        // Colisión jugador ↔ plataformas móviles
        this.physics.add.collider(this.jugador, this.plataformasMoviles, (jugador, plat) => {
            if (jugador.body.touching.down && plat.body.touching.up) {
                this.jugadorEnPlataforma = plat;
            }
        });

        // Conexión del cable con la turbina eólica
        this.physics.add.overlap(this.jugador, this.zonaConexionTerminal, () => {
            if (!this.cableConectado && !this.juegoTerminado) {
                this.conectarCableExitoso();
            }
        });
    }

    /* =========================================================================
     * ENEMIGOS — ESPECTROS DE TORMENTA (N2, rango más amplio)
     * ========================================================================= */
    crearEnemigos() {
        this.grupoEspectros = this.physics.add.group({ allowGravity: false, immovable: true });

        // Espectro 1: zona inicio — patrulla el espacio entre plataforma estática 1 y frágil 2
        this.crearEspectro(380, 430, 260, 490, 48, 13);

        // Espectro 2: zona media — patrulla entre móvil 3 y elevadiza 4
        this.crearEspectro(770, 365, 640, 890, 55, 16);

        // Espectro 3: zona final — patrulla el abismo entre plataforma frágil 5 y móvil 6
        this.crearEspectro(1110, 415, 990, 1220, 50, 14);

        // Contacto con el jugador → daño
        this.physics.add.overlap(this.jugador, this.grupoEspectros, (jugador, espectro) => {
            if (!this.invulnerable && !this.juegoTerminado) {
                this.recibirDanoPorImpacto(espectro);
            }
        });
    }

    crearEspectro(x, y, minX, maxX, velocidad, amplitudBobbing) {
        const espectro = this.grupoEspectros.create(x, y, 'espectro_tormenta2');
        espectro.setDisplaySize(48, 44).setDepth(6);
        espectro.body.setSize(34, 30);
        espectro.body.setOffset(7, 7);
        espectro.baseY   = y;
        espectro.minX    = minX;
        espectro.maxX    = maxX;
        espectro.velocidadX = velocidad;
        espectro.amplitud   = amplitudBobbing;
        espectro.fase    = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.tweens.add({
            targets: espectro,
            scaleX: { from: 1, to: 1.08 },
            scaleY: { from: 1, to: 0.94 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        return espectro;
    }

    /* =========================================================================
     * COLECCIONABLES DE ENERGÍA (ORBES)
     * ========================================================================= */
    crearColeccionables() {
        this.grupoOrbes = this.physics.add.group({ allowGravity: false, immovable: true });
        // CAMBIAMOS AQUI LAS POSICIONES DE LOS ORBES PARA EL NIVEL 2
        const posicionesOrbes = [
            { x: 360, y: 545 },
            { x: 600, y: 385 },
            { x: 770, y: 430 },
            { x: 940, y: 395 },
            { x: 1105, y: 435 },
            { x: 1200, y: 480 }
        ];

        posicionesOrbes.forEach((pos) => {
            const orbe = this.grupoOrbes.create(pos.x, pos.y, 'orbe_energia');
            orbe.setDisplaySize(24, 24).setDepth(5);
            orbe.body.setSize(20, 20);
            this.tweens.add({
                targets: orbe,
                y: pos.y - 8,
                duration: Phaser.Math.Between(900, 1300),
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
        this.reproducirSonido('orbe');
        this.mostrarTextoFlotante(orbe.x, orbe.y - 15, '+150 ⚡', '#00f2fe');
        for (let i = 0; i < 6; i++) {
            const p = this.add.image(orbe.x, orbe.y, 'chispa_cable').setDisplaySize(8, 8).setDepth(10);
            this.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-25, 25), y: p.y + Phaser.Math.Between(-25, 25), alpha: 0, scale: 0.2, duration: 350, onComplete: () => p.destroy() });
        }
        orbe.destroy();
    }

    /* =========================================================================
     * HUD RETRO ARCADE (CRT)
     * ========================================================================= */
    crearHUDArcade() {
        this.hudContainer = this.add.container(0, 0).setDepth(20).setScrollFactor(0);

        const barraSup = this.add.graphics();
        barraSup.fillStyle(0x000000, 0.95);
        barraSup.fillRect(0, 0, 1000, 52);
        barraSup.lineStyle(3, 0xf1c40f, 1);
        barraSup.strokeLineShape(new Phaser.Geom.Line(0, 52, 1000, 52));
        this.hudContainer.add(barraSup);

        this.textoScore = this.add.text(25, 18, 'SCORE: 000000', { fontSize: '15px', fontFamily: '"Press Start 2P", monospace', fill: '#ffffff' });
        this.hudContainer.add(this.textoScore);

        this.textoVidas = this.add.text(320, 18, 'LIVES: 3 ❤️❤️❤️', { fontSize: '15px', fontFamily: '"Press Start 2P", monospace', fill: '#ff4757' });
        this.hudContainer.add(this.textoVidas);

        this.textoCable = this.add.text(580, 18, 'CABLE: 000 FT', { fontSize: '15px', fontFamily: '"Press Start 2P", monospace', fill: '#f1c40f' });
        this.hudContainer.add(this.textoCable);

        this.textoTiempo = this.add.text(860, 18, '⏱ 01:05', { fontSize: '15px', fontFamily: '"Press Start 2P", monospace', fill: '#00f2fe' });
        this.hudContainer.add(this.textoTiempo);

        // Barra de progreso inferior
        this.contenedorProgreso = this.add.container(770, 720).setDepth(20).setScrollFactor(0);
        this.textoDistancia = this.add.text(0, -22, 'DISTANCE: 0%', { fontSize: '14px', fontFamily: '"Press Start 2P", monospace', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        const marcoBarra = this.add.graphics();
        marcoBarra.fillStyle(0x0a101d, 0.9);
        marcoBarra.fillRoundedRect(0, 0, 195, 24, 6);
        marcoBarra.lineStyle(3, 0xffffff, 1);
        marcoBarra.strokeRoundedRect(0, 0, 195, 24, 6);
        this.graficoBarraProgreso = this.add.graphics();
        this.iconoCorredor = this.add.text(5, 3, '🏃', { fontSize: '14px' });
        this.contenedorProgreso.add([this.textoDistancia, marcoBarra, this.graficoBarraProgreso, this.iconoCorredor]);

        // Marco CRT
        const marcoCRT = this.add.graphics().setDepth(25);
        marcoCRT.lineStyle(8, 0x111111, 0.9);
        marcoCRT.strokeRoundedRect(4, 4, 992, 792, 16);
        this.hudContainer.add(marcoCRT);

        // Botón salir ✖
        const btnSalir = this.add.text(980, 26, '✖', { fontSize: '18px', fontFamily: 'Arial', fill: '#ff6b81' })
            .setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(21);
        btnSalir.on('pointerdown', () => this.volverAlOrigen());
        this.hudContainer.add(btnSalir);
    }

    actualizarHUD() {
        // Formato de Score con ceros a la izquierda
        this.textoScore.setText(`SCORE: ${this.puntuacion.toString().padStart(6, '0')}`);

        // Vidas en corazones
        const corazones = '❤️'.repeat(Math.max(0, this.vidas));
        this.textoVidas.setText(`LIVES: ${this.vidas} ${corazones}`);

        // Cable en pies
        this.textoCable.setText(`CABLE: ${Math.round(this.longitudCableFT).toString().padStart(3, '0')} FT`);

        // Tiempo en formato MM:SS
        const minutos = Math.floor(this.tiempoRestante / 60);
        const segundos = this.tiempoRestante % 60;
        this.textoTiempo.setText(`⏱ ${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`);

        // Barra de progreso y porcentaje de distancia hacia la turbina eólica
        const progreso = Phaser.Math.Clamp(this.distanciaPorcentaje, 0, 1);
        this.textoDistancia.setText(`DISTANCE: ${Math.round(progreso * 100)}%`);

        this.graficoBarraProgreso.clear();
        this.graficoBarraProgreso.fillStyle(0x00f2fe, 1);
        const anchoLleno = (195 - 6) * progreso;
        if (anchoLleno > 4) {
            this.graficoBarraProgreso.fillRoundedRect(3, 3, anchoLleno, 18, 4);
        }

        // Posicionar el mini corredor en la punta de la barra
        this.iconoCorredor.x = Phaser.Math.Clamp(anchoLleno - 12, 3, 175);
    }

    /* =========================================================================
     * CONTROLES (Teclado + Touch D-Pad)
     * ========================================================================= */
    configurarControles() {
        this.cursores       = this.input.keyboard.createCursorKeys();
        this.teclaW         = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.teclaA         = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.teclaS         = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.teclaD         = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.teclaESPACIO   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.teclaESC       = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.teclaENTER     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.teclaESC.on('down', () => this.volverAlOrigen());
    }

    /* =========================================================================
     * LÓGICA DE MOVIMIENTO DEL JUGADOR
     * ========================================================================= */
    actualizarJugador() {
        if (this.juegoTerminado || this.nivelCompletado) return;

        const velocidadX = 220;
        const fuerzaSalto = -560;

        const moverIzq    = this.cursores.left.isDown  || this.teclaA.isDown || window.mobileControls?.isDown('left');
        const moverDer    = this.cursores.right.isDown || this.teclaD.isDown || window.mobileControls?.isDown('right');
        const intentarSalto = Phaser.Input.Keyboard.JustDown(this.cursores.up) ||
            Phaser.Input.Keyboard.JustDown(this.teclaW) ||
            Phaser.Input.Keyboard.JustDown(this.teclaESPACIO) ||
            window.mobileControls?.consume('up');

        const enSuelo = this.jugador.body.blocked.down || this.jugador.body.touching.down;
        if (!enSuelo) this.jugadorEnPlataforma = null;

        if (moverIzq) {
            this.jugador.setVelocityX(-velocidadX);
            this.mirandoDerecha = false;
            this.jugador.setFlipX(!enSuelo);
            if (enSuelo) this.jugador.play(`avatar-${this.avatarKey}-correr-izq`, true);
        } else if (moverDer) {
            this.jugador.setVelocityX(velocidadX);
            this.mirandoDerecha = true;
            this.jugador.setFlipX(false);
            if (enSuelo) this.jugador.play(`avatar-${this.avatarKey}-correr-der`, true);
        } else {
            if (this.jugadorEnPlataforma && this.jugadorEnPlataforma.body) {
                this.jugador.setVelocityX(this.jugadorEnPlataforma.body.velocity.x);
            } else {
                this.jugador.setVelocityX(0);
            }
            if (enSuelo) {
                this.jugador.setFlipX(false);
                this.jugador.play(`avatar-${this.avatarKey}-quieto`, true);
            }
        }

        if (intentarSalto && enSuelo) {
            this.jugador.setVelocityY(fuerzaSalto);
            this.jugador.setFlipX(!this.mirandoDerecha);
            this.jugador.play(`avatar-${this.avatarKey}-salto`, true);
            this.reproducirSonido('salto');
        }

        if (!enSuelo && this.jugador.body.velocity.y > 0) {
            this.jugador.setFlipX(!this.mirandoDerecha);
            this.jugador.play(`avatar-${this.avatarKey}-salto`, true);
        }

        // Si el jugador cae al abismo del cañón (fondo de la pantalla)
        if (this.jugador.y > 760) {
            this.recibirDanoPorCaida();
        }

        // Calcular porcentaje de distancia hacia la turbina eólica
        const progreso = (this.jugador.x - 100) / (this.posicionEnchufeMeta.x - 100);
        this.distanciaPorcentaje = Phaser.Math.Clamp(progreso, 0, 1);
    }

    /* =========================================================================
     * FÍSICAS Y DIBUJADO DINÁMICO DEL CABLE ELÉCTRICO (CATENARIA CON CURVAS DE BEZIER)
     * ========================================================================= */
    actualizarCableDinamico() {
        this.graficosCable.clear();

        // Origen del cable en la boquilla del generador izquierdo
        const origX = this.posicionSalidaCable.x;
        const origY = this.posicionSalidaCable.y;

        // Destino del cable en la mochila/espalda del jugador (o terminal si ya se conectó)
        let destX, destY;
        if (this.cableConectado) {
            destX = this.posicionEnchufeMeta.x;
            destY = this.posicionEnchufeMeta.y;
        } else {
            destX = this.jugador.x + (this.mirandoDerecha ? -14 : 14);
            destY = this.jugador.y - 4;
        }

        // Calcular distancia y catenaria (caída natural del cable por gravedad)
        const dx = destX - origX;
        const dy = destY - origY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Convertir la distancia en píxeles a unidades FT para el HUD retro
        this.longitudCableFT = (dist / 1280) * 115;

        // Curvatura del cable: cuelga más cuando está cerca, se tensa cuando el jugador salta o se aleja
        const mitadX = (origX + destX) / 2;
        const caidaGravedad = Phaser.Math.Clamp(dist * 0.12, 10, 45);
        const mitadY = (origY + destY) / 2 + caidaGravedad;

        // 1. Línea exterior oscura de contorno (estilo arcade pixel art)
        this.graficosCable.lineStyle(6, 0x1e272e, 1);
        this.dibujarCurvaCable(origX, origY, mitadX, mitadY, destX, destY);

        // 2. Línea principal amarilla de cable de alta tensión
        this.graficosCable.lineStyle(3.5, 0xf1c40f, 1);
        this.dibujarCurvaCable(origX, origY, mitadX, mitadY, destX, destY);

        // 3. Brillo neón interno
        this.graficosCable.lineStyle(1.5, 0xffffff, 0.9);
        this.dibujarCurvaCable(origX, origY, mitadX, mitadY - 1, destX, destY);

        // Dibujar mochila / arnés porta-cable sobre la espalda del jugador
        if (!this.cableConectado && this.jugador.active) {
            this.mochilaCable.clear();
            const mochX = this.jugador.x + (this.mirandoDerecha ? -16 : 6);
            const mochY = this.jugador.y - 12;

            // Mochila verde de explorador con refuerzos
            this.mochilaCable.fillStyle(0x27ae60, 1);
            this.mochilaCable.fillRoundedRect(mochX, mochY, 12, 20, 3);
            this.mochilaCable.lineStyle(1.5, 0x1e272e, 1);
            this.mochilaCable.strokeRoundedRect(mochX, mochY, 12, 20, 3);

            // Batería / conector amarillo en la mochila
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
        curva.draw(this.graficosCable);
    }

    /* =========================================================================
     * CONEXIÓN EXITOSA (VICTORIA)
     * ========================================================================= */
    conectarCableExitoso() {
        this.cableConectado  = true;
        this.nivelCompletado = true;
        this.reproducirSonido('conexion_exitosa');

        // Congelar jugador en la plataforma de llegada
        this.jugador.body.allowGravity = false;
        this.jugador.body.moves = false;
        this.jugador.body.enable = false;

        // Flash de energía
        this.cameras.main.flash(400, 0, 180, 255, false);
        this.cameras.main.shake(200, 0.012);

        // Chispas de celebración alrededor de la turbina
        for (let i = 0; i < 20; i++) {
            const p = this.add.image(this.posicionEnchufeMeta.x, this.posicionEnchufeMeta.y, 'chispa_cable')
                .setDisplaySize(10, 10).setDepth(15);
            this.tweens.add({
                targets: p,
                x: p.x + Phaser.Math.Between(-60, 60),
                y: p.y + Phaser.Math.Between(-60, 60),
                alpha: { from: 1, to: 0 },
                duration: Phaser.Math.Between(500, 800),
                ease: 'Cubic.easeOut',
                onComplete: () => p.destroy()
            });
        }

        // Calcular bonificaciones
        const bonusNivel  = 2000;
        const bonusTiempo = this.tiempoRestante * 30;
        const bonusCable  = Math.max(0, Math.floor((this.maxLongitudCableFT - this.longitudCableFT) * 5));
        this.puntuacion  += bonusNivel + bonusTiempo + bonusCable;

        this.time.delayedCall(900, () => {
            this.mostrarModalVictoria(bonusNivel, bonusTiempo, bonusCable);
        });
    }

    /* =========================================================================
     * DAÑO, CAÍDAS Y RESPAWN
     * ========================================================================= */
    recibirDanoPorImpacto(espectro) {
        if (this.nivelCompletado || this.juegoTerminado || this.invulnerable) return;
        this.vidas--;
        this.reproducirSonido('dano');
        this.actualizarHUD();
        const dirEmpuje = this.jugador.x < espectro.x ? -180 : 180;
        this.jugador.setVelocity(dirEmpuje, -300);
        this.cameras.main.shake(180, 0.007);
        this.mostrarTextoFlotante(this.jugador.x, this.jugador.y - 25, '¡ZAP! -1 VIDA', '#ff4757');
        if (this.vidas <= 0) {
            this.declararGameOver('¡Los vientos de tormenta cortaron el cable!');
            return;
        }
        this.invulnerable = true;
        this.tweens.add({ targets: this.jugador, alpha: { from: 0.3, to: 1 }, duration: 120, yoyo: true, repeat: 7, onComplete: () => { this.invulnerable = false; this.jugador.setAlpha(1); } });
    }

    recibirDanoPorCaida() {
        if (this.nivelCompletado || this.juegoTerminado) return;
        this.vidas--;
        this.reproducirSonido('dano');
        this.jugador.setPosition(this.puntoSpawn.x, this.puntoSpawn.y);
        this.jugador.setVelocity(0, 0);
        this.jugadorEnPlataforma = null;
        this.actualizarHUD();
        this.mostrarTextoFlotante(this.jugador.x, this.jugador.y - 30, '¡CAÍDA! -1 VIDA', '#ff4757');

        // Al revivir tras caer, restablecer todas las plataformas frágiles para el nuevo intento
        this.restaurarPlataformasFragiles();

        if (this.vidas <= 0) {
            this.declararGameOver('¡Caíste al vacío sin suministro!');
            return;
        }

        // Breve parpadeo de invulnerabilidad al reaparecer en el spawn
        this.invulnerable = true;
        this.tweens.add({
            targets: this.jugador,
            alpha: { from: 0.3, to: 1 },
            duration: 120,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.invulnerable = false;
                this.jugador.setAlpha(1);
            }
        });
    }

    /* =========================================================================
     * ACTUALIZACIÓN DE PLATAFORMAS MÓVILES Y ENEMIGOS
     * ========================================================================= */
    actualizarPlataformasYEnemigos() {
        // Plataformas móviles horizontales / verticales
        this.listaPlataformasMoviles.forEach((plat) => {
            if (!plat.active) return;
            if (plat.tipoMovimiento === 'horizontal') {
                if (plat.x >= plat.maxX && plat.body.velocity.x > 0) {
                    plat.body.setVelocityX(-plat.velocidadBase);
                } else if (plat.x <= plat.minX && plat.body.velocity.x < 0) {
                    plat.body.setVelocityX(plat.velocidadBase);
                }
            } else if (plat.tipoMovimiento === 'vertical') {
                if (plat.y >= plat.maxY && plat.body.velocity.y > 0) {
                    plat.body.setVelocityY(-plat.velocidadBase);
                } else if (plat.y <= plat.minY && plat.body.velocity.y < 0) {
                    plat.body.setVelocityY(plat.velocidadBase);
                }
            }
        });

        // Espectros de tormenta
        const tiempo = this.time.now * 0.003;
        this.grupoEspectros.getChildren().forEach((esp) => {
            if (esp.active) {
                esp.x += esp.velocidadX * 0.016;
                if (esp.x >= esp.maxX && esp.velocidadX > 0) {
                    esp.velocidadX = -Math.abs(esp.velocidadX);
                    esp.setFlipX(true);
                } else if (esp.x <= esp.minX && esp.velocidadX < 0) {
                    esp.velocidadX = Math.abs(esp.velocidadX);
                    esp.setFlipX(false);
                }
                esp.y = esp.baseY + Math.sin(tiempo + esp.fase) * esp.amplitud;
            }
        });

        // Nubes de fondo
        this.nubesLejanas.forEach((nube) => {
            nube.x -= nube.velocidad;
            if (nube.x < -60) {
                nube.x = this.anchoMundo + 60;
                nube.y = Phaser.Math.Between(60, 200);
            }
        });
    }

    /* =========================================================================
     * TEMPORIZADOR
     * ========================================================================= */
    iniciarTemporizador() {
        this.relojEvento = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (!this.juegoTerminado && !this.nivelCompletado && !this.juegoPausado) {
                    this.tiempoRestante--;
                    this.actualizarHUD();
                    if (this.tiempoRestante <= 0) {
                        this.declararGameOver('¡Se agotó el tiempo de suministro!');
                    }
                }
            },
            loop: true
        });
    }

    /* =========================================================================
     * MODALES DE VICTORIA Y GAME OVER
     * ========================================================================= */
    crearModalesFinDeJuego() {
        // ── Modal de Victoria ────────────────────────────────────────────────
        this.modalVictoria = this.add.container(500, 400).setDepth(30).setVisible(false).setAlpha(0).setScrollFactor(0);

        const telonV = this.add.graphics();
        telonV.fillStyle(0x000000, 0.75);
        telonV.fillRect(-500, -400, 1000, 800);

        const cardV = this.add.graphics();
        cardV.fillStyle(0x0c2461, 0.98);
        cardV.fillRoundedRect(-300, -210, 600, 420, 18);
        cardV.lineStyle(4, 0x00f2fe, 1);
        cardV.strokeRoundedRect(-300, -210, 600, 420, 18);

        const tituloV = this.add.text(0, -165, '★ ¡TURBINA CONECTADA! ★', { fontSize: '18px', fontFamily: '"Press Start 2P", monospace', fill: '#f1c40f' }).setOrigin(0.5);
        const subV    = this.add.text(0, -130, 'Nivel 2: Ruinas Mayas con Parque Eólico', { fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#7ed6df' }).setOrigin(0.5);

        this.textoDetalleVictoria = this.add.text(0, -20, '', { fontSize: '14px', fontFamily: '"Press Start 2P", monospace', fill: '#ffffff', align: 'center', lineSpacing: 14 }).setOrigin(0.5);
        this.modalVictoria.add([telonV, cardV, tituloV, subV, this.textoDetalleVictoria]);

        this.botonesVictoria = [
            this.crearBotonModalAbs(360, 540, 'REINTENTAR', 0xe67e22, () => this.reiniciarNivel()),
            this.crearBotonModalAbs(640, 540, 'SALIR',       0x27ae60, () => this.volverAlOrigen())
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

        const tituloGO = this.add.text(0, -130, '💀 TURBINA SIN ENERGÍA 💀', { fontSize: '18px', fontFamily: '"Press Start 2P", monospace', fill: '#ff4757' }).setOrigin(0.5);
        this.textoCausaGameOver  = this.add.text(0, -70, '', { fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#ff6b81', align: 'center' }).setOrigin(0.5);
        this.textoScoreGameOver  = this.add.text(0, -10, '', { fontSize: '14px', fontFamily: '"Press Start 2P", monospace', fill: '#f1c40f' }).setOrigin(0.5);
        this.modalGameOver.add([telonGO, cardGO, tituloGO, this.textoCausaGameOver, this.textoScoreGameOver]);

        this.botonesGameOver = [
            this.crearBotonModalAbs(380, 510, 'REINTENTAR', 0xe74c3c, () => this.reiniciarNivel()),
            this.crearBotonModalAbs(620, 510, 'SALIR',       0x747d8c, () => this.volverAlOrigen())
        ];
    }

    crearBotonModalAbs(absX, absY, texto, colorHex, accion) {
        const W = 200, H = 40;
        const bg = this.add.graphics().setScrollFactor(0).setDepth(31).setAlpha(0);
        const dibujarBg = (esc) => {
            bg.clear();
            const w = W * esc, h = H * esc;
            bg.fillStyle(colorHex, 1);
            bg.fillRoundedRect(absX - w / 2, absY - h / 2, w, h, 8);
            bg.lineStyle(2, 0xffffff, 0.8);
            bg.strokeRoundedRect(absX - w / 2, absY - h / 2, w, h, 8);
        };
        dibujarBg(1);
        const txt = this.add.text(absX, absY, texto, { fontSize: '12px', fontFamily: '"Press Start 2P", monospace', fill: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(32).setAlpha(0);
        const zone = this.add.zone(absX, absY, W, H).setScrollFactor(0).setDepth(33);
        zone.setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => { dibujarBg(1.06); txt.setScale(1.06); });
        zone.on('pointerout',  () => { dibujarBg(1);    txt.setScale(1); });
        zone.on('pointerdown', accion);
        return { bg, txt, zone };
    }

    _setBotonesVisible(botones, visible, alpha) {
        for (const b of botones) {
            b.bg.setAlpha(alpha);
            b.txt.setAlpha(alpha);
            if (visible) { b.zone.setInteractive({ useHandCursor: true }); }
            else { b.zone.disableInteractive(); }
        }
    }

    mostrarModalVictoria(bonusNivel, bonusTiempo, bonusCable) {
        this.textoDetalleVictoria.setText(
            `NIVEL SUPERADO : +${bonusNivel}\n` +
            `BONO TIEMPO    : +${bonusTiempo}\n` +
            `BONO CABLE     : +${bonusCable}\n\n` +
            `PUNTUACIÓN TOTAL : ${this.puntuacion}`
        );
        this._setBotonesVisible(this.botonesVictoria, false, 0);
        this.modalVictoria.setVisible(true);
        this.tweens.add({ targets: this.modalVictoria, alpha: 1, duration: 300, ease: 'Quad.easeOut',
            onComplete: () => this._setBotonesVisible(this.botonesVictoria, true, 1) });
    }

    declararGameOver(causa) {
        if (this.juegoTerminado) return;
        this.juegoTerminado = true;
        this.reproducirSonido('game_over');
        this.textoCausaGameOver.setText(causa);
        this.textoScoreGameOver.setText(`SCORE FINAL: ${this.puntuacion}`);
        this._setBotonesVisible(this.botonesGameOver, false, 0);
        this.modalGameOver.setVisible(true);
        this.tweens.add({ targets: this.modalGameOver, alpha: 1, duration: 300, ease: 'Quad.easeOut',
            onComplete: () => this._setBotonesVisible(this.botonesGameOver, true, 1) });
    }

    reiniciarNivel() { this.scene.restart(); }

    volverAlOrigen() {
        if (this.origen === 'EscenaMenu') {
            this.scene.start('EscenaMenu');
        } else {
            this.scene.start('EscenaJuego', { posInicial: { x: 820, y: 510 }, avatarKey: this.avatarKey });
        }
    }

    mostrarTextoFlotante(x, y, mensaje, colorHex) {
        const txt = this.add.text(x, y, mensaje, { fontSize: '13px', fontFamily: '"Press Start 2P", monospace', fill: colorHex, stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(25);
        this.tweens.add({ targets: txt, y: y - 35, alpha: 0, duration: 850, ease: 'Cubic.easeOut', onComplete: () => txt.destroy() });
    }

    /* =========================================================================
     * BUCLE PRINCIPAL (UPDATE)
     * ========================================================================= */
    update(time, delta) {
        this.actualizarJugador();
        this.actualizarCableDinamico();
        this.actualizarPlataformasYEnemigos();
        this.actualizarHUD();
    }

    /* =========================================================================
     * SINTETIZADOR DE AUDIO PROCEDURAL (Web Audio API)
     * ========================================================================= */
    initAudioSynthesizer() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.audioCtx = null;
        }
    }

    reproducirSonido(tipo) {
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;

        if (tipo === 'salto') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.15);
        } else if (tipo === 'crujido') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.35);
        } else if (tipo === 'orbe') {
            [523.25, 783.99].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const t = now + idx * 0.07;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.14, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(t); osc.stop(t + 0.18);
            });
        } else if (tipo === 'dano') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.35);
        } else if (tipo === 'conexion_exitosa') {
            [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const t = now + idx * 0.09;
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.22, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(t); osc.stop(t + 0.25);
            });
        } else if (tipo === 'game_over') {
            [392.00, 369.99, 329.63, 293.66].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const t = now + idx * 0.15;
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.18, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(t); osc.stop(t + 0.22);
            });
        }
    }
}
