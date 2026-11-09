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
        this.avatarKey = data && data.avatarKey ? data.avatarKey : (localStorage.getItem('muchbits-avatar') || 'user_default');
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

        // Turbina eólica (meta del N2) — 100x140
        if (!this.textures.exists('turbina_eolica')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            // Mástil
            c.fillStyle(0x718093, 1);
            c.fillRect(44, 60, 12, 80);
            c.lineStyle(2, 0x636e72, 1);
            c.strokeRect(44, 60, 12, 80);
            // Góndola
            c.fillStyle(0xdfe6e9, 1);
            c.fillRoundedRect(32, 50, 36, 18, 5);
            c.lineStyle(2, 0xb2bec3, 1);
            c.strokeRoundedRect(32, 50, 36, 18, 5);
            // Aspas (3 palas)
            c.fillStyle(0xecf0f1, 1);
            c.lineStyle(2, 0xbdc3c7, 1);
            // Pala superior
            c.fillRoundedRect(45, 4, 10, 48, 4);
            c.strokeRoundedRect(45, 4, 10, 48, 4);
            // Pala inferior-izquierda
            const ang1 = Math.PI * 2 / 3;
            c.fillStyle(0xecf0f1, 1);
            c.fillRoundedRect(10, 46, 36, 10, 4);
            c.strokeRoundedRect(10, 46, 36, 10, 4);
            // Pala inferior-derecha
            c.fillRoundedRect(54, 46, 36, 10, 4);
            c.strokeRoundedRect(54, 46, 36, 10, 4);
            // Buje central
            c.fillStyle(0x2d3436, 1);
            c.fillCircle(50, 58, 7);
            c.fillStyle(0xf1c40f, 1);
            c.fillCircle(50, 58, 4);
            // Enchufe de conexión
            c.fillStyle(0x718093, 1);
            c.fillRoundedRect(36, 108, 10, 14, 3);
            c.fillStyle(0x00f2fe, 1);
            c.fillCircle(41, 115, 3);
            c.generateTexture('turbina_eolica', 100, 140);
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
        if (!this.anims.exists(`${key}-correr-der`)) {
            this.anims.create({ key: `${key}-correr-der`, frames: this.anims.generateFrameNumbers(key, { start: 12, end: 15 }), frameRate: 10, repeat: -1 });
        }
        if (!this.anims.exists(`${key}-correr-izq`)) {
            this.anims.create({ key: `${key}-correr-izq`, frames: this.anims.generateFrameNumbers(key, { start: 8,  end: 11 }), frameRate: 10, repeat: -1 });
        }
        if (!this.anims.exists(`${key}-quieto`)) {
            this.anims.create({ key: `${key}-quieto`, frames: [{ key, frame: 0 }], frameRate: 1 });
        }
        if (!this.anims.exists(`${key}-salto`)) {
            this.anims.create({ key: `${key}-salto`, frames: [{ key, frame: 13 }], frameRate: 1 });
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

        // Turbina eólica (meta del nivel)
        this.turbina = this.add.image(1415, 478, 'turbina_eolica')
            .setDisplaySize(100, 140).setDepth(5);

        // Animación de aspas girando
        this.tweens.add({
            targets: this.turbina,
            angle: 360,
            duration: 4000,
            repeat: -1,
            ease: 'Linear'
        });

        // Punto exacto de enchufe
        this.posicionEnchufeMeta = { x: 1375, y: 515 };
        this.zonaConexionTerminal = this.add.zone(1368, 512, 48, 72);
        this.physics.add.existing(this.zonaConexionTerminal, true);

        // Marcador de meta
        this.marcadorMeta = this.add.text(1385, 428, '⚡ CONECTA AQUÍ', {
            fontSize: '11px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#00f2fe',
            stroke: '#1e272e',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(12);

        this.tweens.add({
            targets: this.marcadorMeta,
            y: 420,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ── 3. Plataformas Intermedias ─────────────────────────────────────────
        //
        // Distribución en 1500 px (inicio ~150, fin ~1340):
        //   Zona A (150–450):  estática + frágil
        //   Zona B (450–750):  móvil H + elevadiza V
        //   Zona C (750–1050): frágil + estática
        //   Zona D (1050–1340): móvil H + frágil + estática
        //
        // Plataforma 1 — ESTÁTICA: primer escalón desde el acantilado
        this.crearPlataformaEstatica(260, 585);

        // Plataforma 2 — FRÁGIL: obliga al jugador a ser rápido
        this.crearPlataformaFragil(400, 520);

        // Plataforma 3 — MÓVIL HORIZONTAL: patrulla zona A→B
        this.crearPlataformaMovilHorizontal(550, 475, 480, 620, 70);

        // Plataforma 4 — ELEVADIZA VERTICAL: sube y baja en zona B
        this.crearPlataformaElevadizaVertical(700, 440, 355, 530, 60);

        // Plataforma 5 — FRÁGIL: zona media peligrosa
        this.crearPlataformaFragil(850, 410);

        // Plataforma 6 — ESTÁTICA elevada: punto de descanso en zona C
        this.crearPlataformaEstatica(990, 395);

        // Plataforma 7 — FRÁGIL: combinada con móvil siguiente (secuencia de riesgo)
        this.crearPlataformaFragil(1115, 450);

        // Plataforma 8 — MÓVIL HORIZONTAL: puente final hacia el acantilado
        this.crearPlataformaMovilHorizontal(1240, 490, 1175, 1310, 72);
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
     * Crea una plataforma frágil que cae al vacío 2 segundos después
     * de que el jugador la pise por primera vez.
     */
    crearPlataformaFragil(x, y) {
        const key = this.textures.exists('plat_fragil_game') ? 'plat_fragil_game'
                  : this.textures.exists('plat_fragil')      ? 'plat_fragil'
                  : 'plataforma_flotante_med';

        // Las frágiles son inicialmente ESTÁTICAS; al pisarse pasan a DINÁMICAS
        const plat = this.plataformasEstaticas.create(x, y, key);
        plat.setDisplaySize(135, 52).setDepth(4).refreshBody();
        plat.body.setSize(124, 20);
        plat.body.setOffset(5, 4);
        plat.body.checkCollision.down  = false;
        plat.body.checkCollision.left  = false;
        plat.body.checkCollision.right = false;
        plat.body.checkCollision.up    = true;

        // Marcador de tipo y estado
        plat.esFragil   = true;
        plat.disparada  = false;   // aún no ha sido pisada
        plat.cayendo    = false;   // aún no está en caída libre

        // Efecto visual: leve vibración pulsante para indicar fragilidad
        this.tweens.add({
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
     * Espera 2 s y luego la hace caer con física real.
     */
    activarCaidaFragil(plat) {
        if (plat.disparada) return;
        plat.disparada = true;

        // Vibración rápida de advertencia durante ~1.4 s
        this.tweens.add({
            targets: plat,
            x: { from: plat.x - 3, to: plat.x + 3 },
            duration: 60,
            yoyo: true,
            repeat: 11,       // ~1.4 s
            ease: 'Linear',
            onComplete: () => {
                if (plat.active) {
                    this.iniciarCaidaLibre(plat);
                }
            }
        });
    }

    iniciarCaidaLibre(plat) {
        if (!plat.active || plat.cayendo) return;
        plat.cayendo = true;

        // Sacar del grupo estático y convertir en cuerpo dinámico con gravedad
        this.plataformasEstaticas.remove(plat, false, false);
        this.physics.world.enable(plat);
        plat.body.allowGravity = true;
        plat.body.setGravityY(900);
        plat.body.checkCollision.up = false; // ya no es piso sólido

        // Destruir cuando salga de la pantalla
        this.time.addEvent({
            delay: 3000,
            callback: () => {
                if (plat && plat.active) plat.destroy();
                const idx = this.listaFragiles.indexOf(plat);
                if (idx !== -1) this.listaFragiles.splice(idx, 1);
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

        // Espectro 1: zona inicio — rango amplio sobre el primer abismo
        this.crearEspectro(360, 425, 250, 480, 48, 13);

        // Espectro 2: zona media — largo recorrido sobre ruinas
        this.crearEspectro(720, 365, 580, 860, 58, 17);

        // Espectro 3: zona final — patrulla amplia antes del acantilado derecho
        this.crearEspectro(1070, 420, 960, 1200, 52, 15);

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

        const posicionesOrbes = [
            { x: 350, y: 548 },
            { x: 520, y: 442 },
            { x: 700, y: 408 },
            { x: 900, y: 378 },
            { x: 1050, y: 362 },
            { x: 1180, y: 418 }
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
        this.textoScore.setText(`SCORE: ${this.puntuacion.toString().padStart(6, '0')}`);
        const corazones = '❤️'.repeat(Math.max(0, this.vidas));
        this.textoVidas.setText(`LIVES: ${this.vidas} ${corazones}`);
        const cFT = Math.min(Math.floor(this.longitudCableFT), this.maxLongitudCableFT);
        this.textoCable.setText(`CABLE: ${cFT.toString().padStart(3, '0')} FT`);
        const mins = Math.floor(this.tiempoRestante / 60);
        const segs = this.tiempoRestante % 60;
        this.textoTiempo.setText(`⏱ ${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`);

        // Barra de progreso
        const pct = Math.min(this.distanciaPorcentaje, 100);
        this.graficoBarraProgreso.clear();
        this.graficoBarraProgreso.fillStyle(0x00f2fe, 1);
        this.graficoBarraProgreso.fillRoundedRect(4, 4, Math.max(0, (pct / 100) * 187), 16, 4);
        const corredorX = 5 + (pct / 100) * 170;
        this.iconoCorredor.x = corredorX;
        this.textoDistancia.setText(`DISTANCE: ${Math.floor(pct)}%`);
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
            this.jugador.setFlipX(true);
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
            if (enSuelo) this.jugador.play(`avatar-${this.avatarKey}-quieto`, true);
        }

        if (intentarSalto && enSuelo) {
            this.jugador.setVelocityY(fuerzaSalto);
            this.jugador.play(`avatar-${this.avatarKey}-salto`, true);
            this.reproducirSonido('salto');
        }

        if (!enSuelo && this.jugador.body.velocity.y > 0) {
            this.jugador.play(`avatar-${this.avatarKey}-salto`, true);
        }

        // Caída al vacío
        if (this.jugador.y > this.altoMundo + 60) {
            this.recibirDanoPorCaida();
        }

        // Distancia de cable
        const dxCable = this.jugador.x - this.posicionSalidaCable.x;
        const dyCable = this.jugador.y - this.posicionSalidaCable.y;
        this.longitudCableFT = Math.sqrt(dxCable * dxCable + dyCable * dyCable) * 0.3;

        // Progreso hacia la turbina
        const metaX = this.posicionEnchufeMeta.x;
        const origenX = this.posicionSalidaCable.x;
        this.distanciaPorcentaje = Math.max(0, Math.min(100,
            ((this.jugador.x - origenX) / (metaX - origenX)) * 100
        ));
    }

    /* =========================================================================
     * CABLE DINÁMICO (CATENARIA)
     * ========================================================================= */
    actualizarCableDinamico() {
        this.graficosCable.clear();
        if (this.juegoTerminado || this.nivelCompletado) return;

        const sx = this.posicionSalidaCable.x;
        const sy = this.posicionSalidaCable.y;
        const ex = this.jugador.x;
        const ey = this.jugador.y + 20;

        const segmentos = 18;
        const colgamiento = 0.35;

        this.graficosCable.lineStyle(3, 0xf1c40f, 0.9);
        this.graficosCable.beginPath();
        this.graficosCable.moveTo(sx, sy);
        for (let i = 1; i <= segmentos; i++) {
            const t = i / segmentos;
            const cx = sx + (ex - sx) * t;
            const cy = sy + (ey - sy) * t + Math.sin(t * Math.PI) * (ey - sy + 60) * colgamiento;
            this.graficosCable.lineTo(cx, cy);
        }
        this.graficosCable.strokePath();

        // Mochila visual del jugador
        this.mochilaCable.clear();
        this.mochilaCable.fillStyle(0x2d3436, 1);
        const mx = this.jugador.x + (this.mirandoDerecha ? -14 : 14);
        this.mochilaCable.fillRoundedRect(mx - 7, this.jugador.y - 10, 14, 20, 3);
        this.mochilaCable.lineStyle(2, 0xf1c40f, 1);
        this.mochilaCable.strokeRoundedRect(mx - 7, this.jugador.y - 10, 14, 20, 3);
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
        this.actualizarHUD();
        this.mostrarTextoFlotante(this.jugador.x, this.jugador.y - 30, '¡CAÍDA! -1 VIDA', '#ff4757');
        if (this.vidas <= 0) {
            this.declararGameOver('¡Caíste al vacío sin suministro!');
        }
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
