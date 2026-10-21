/**
 * EscenaEnergia.js - MuchBits Sala B (Sala Energía)
 * Minijuego de la Presa Hidroeléctrica: Limpieza de Basura y Generación de Energía Limpia
 * 
 * Reglas:
 * - Fondo base: pictures/sala_energia/fondo_presa.jpg (Segunda imagen)
 * - Zonas delimitadoras: Zona de generación (izq), Área de juego clickeable (centro), Zona de llegada (der) (Tercera imagen)
 * - Barra de energía producida empieza al 50%.
 * - Cada basura recogida en el área de juego suma energía y puntuación.
 * - Cada basura que alcanza la presa (zona de llegada) resta energía por atasque de turbinas.
 */

class EscenaEnergia extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaEnergia' });
    }

    init(data) {
        this.avatarKey = data && data.avatarKey ? data.avatarKey : (localStorage.getItem('muchbits-avatar') || 'user_default');
        this.origen = data && data.origen ? data.origen : 'EscenaJuego';
    }

    preload() {
        // Cargar imagen de fondo base limpia (segunda imagen de referencia)
        this.load.image('fondo_presa', 'pictures/sala_energia/fondo_presa.png');

        // Cargar spritesheets animados de basura proporcionados en sala_energia/basura
        this.load.spritesheet('basura_llanta', 'pictures/sala_energia/basura/llanta.png', {
            frameWidth: 418,
            frameHeight: 271
        });

        this.load.spritesheet('basura_tronco', 'pictures/sala_energia/basura/tronco.png', {
            frameWidth: 256,
            frameHeight: 131
        });

        // Árboles decorativos de la sala B
        this.load.image('arbol_1_sala_b', 'pictures/sala_energia/Arbol_1_sala_B.png');
        this.load.image('arbol_2_sala_b', 'pictures/sala_energia/Arbol_2_sala_B.png');
        this.load.image('arbol_3_sala_b', 'pictures/sala_energia/Arbol_3_sala_B.png');

        // Spritesheet de Turbina Eólica (se intentará cargar pictures/sala_energia/turbina.png)
        this.load.spritesheet('turbina_eolica', 'pictures/sala_energia/turbina.png', {
            frameWidth: 64,
            frameHeight: 128
        });
    }

    create() {
        // Inicializar estado del juego
        this.energia = 50; // La barra empieza exactamente a la mitad (50%)
        this.energiaObjetivo = 50;
        this.puntuacion = 0;
        this.basuraRecogida = 0;
        this.basuraPerdida = 0;
        this.nivel = 1;
        this.combo = 0;
        this.ultimoClickTiempo = 0;
        this.tiempoSegundos = 0;
        this.juegoTerminado = false;
        this.juegoPausado = true; // Inicia pausado hasta que el jugador haga click en el banner de bienvenida
        this.mostrarGuiaZonas = false; // Modo guía visual de las 3 zonas

        // Coordenadas y delimitaciones calibradas para el canvas de 1000x800
        // Basadas en la tercera imagen (zonas delimitadoras):
        // Río verticalmente acotado al cauce de agua (Y: 345 a 700) para evitar desbordes
        // yMin y yMax son los limites verticales del área del rio, para la generacion de basura.
        //spawnXMin y spawnXMax son los limites horizontales del área de generación de basura.
        this.limitesRio = {
            yMin: 350,
            yMax: 620,
            // Zona de generación: izquierda (X: -40 a 90)
            spawnXMin: -40,
            spawnXMax: 90,
            // Área de juego (clickeable): centro
            juegoXMin: 100,
            // La zona de llegada y el vertedero ahora son diagonales según la inclinación de la presa:
            // Arriba (Y menor) la pared está mucho más a la izquierda (x~695),
            // Abajo (Y mayor) la pared llega más a la derecha (x~870).
        };

        // Inicializar generador de audio por síntesis Web Audio
        this.initAudioSynthesizer();

        // Generar texturas de pixel art adicionales para variedad de residuos
        this.generarTexturasBasura();

        // Crear animaciones de spritesheets
        this.crearAnimaciones();

        // Renderizar fondo y capas del escenario
        this.crearEscenario();

        // Capa de partículas de agua y efectos
        this.crearEfectosAgua();

        // Grupo de objetos de basura flotante
        this.grupoBasura = this.add.group();

        // Crear HUD estilo Arcade retro (inspirado en la primera imagen)
        this.crearHUD();

        // Capa de visualización de Zonas Delimitadoras (Tercera imagen)
        this.crearCapaZonas();

        // Controles de entrada (Ratón, Táctil, Teclado)
        this.crearControles();

        // Temporizador de generación de basura
        this.temporizadorGeneracion = this.time.addEvent({
            delay: 1600,
            callback: this.generarNuevaBasura,
            callbackScope: this,
            loop: true
        });

        // Temporizador de reloj del juego
        this.temporizadorReloj = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (!this.juegoTerminado && !this.juegoPausado) {
                    this.tiempoSegundos++;
                    this.actualizarRelojHUD();
                }
            },
            callbackScope: this,
            loop: true
        });

        // Banner informativo de bienvenida con instrucciones
        this.mostrarBannerBienvenida();
    }

    /* =========================================================================
     * GENERACIÓN DE TEXTURAS DE BASURA PIXEL-ART
     * ========================================================================= */
    generarTexturasBasura() {
        // 1. Lata Roja de Refresco (32x22)
        if (!this.textures.exists('basura_lata_roja')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            // Sombra bajo el agua
            c.fillStyle(0x0a4066, 0.4);
            c.fillEllipse(16, 20, 24, 6);
            // Cuerpo de la lata
            c.fillStyle(0xd63031, 1);
            c.fillRoundedRect(4, 4, 24, 14, 3);
            // Tapa metálica plateada
            c.fillStyle(0xdfe6e9, 1);
            c.fillRoundedRect(4, 4, 5, 14, 2);
            // Franja blanca clásica
            c.fillStyle(0xffffff, 0.9);
            c.fillRect(14, 4, 4, 14);
            // Brillo superior
            c.fillStyle(0xffffff, 0.5);
            c.fillRect(7, 5, 18, 2);
            c.generateTexture('basura_lata_roja', 32, 24);
            c.destroy();
        }

        // 2. Lata Amarilla / Naranja (32x22)
        if (!this.textures.exists('basura_lata_amarilla')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0x0a4066, 0.4);
            c.fillEllipse(16, 20, 24, 6);
            c.fillStyle(0xe67e22, 1);
            c.fillRoundedRect(4, 4, 24, 14, 3);
            c.fillStyle(0xdfe6e9, 1);
            c.fillRoundedRect(4, 4, 5, 14, 2);
            c.fillStyle(0xf1c40f, 1);
            c.fillRect(13, 4, 6, 14);
            c.fillStyle(0xffffff, 0.5);
            c.fillRect(7, 5, 18, 2);
            c.generateTexture('basura_lata_amarilla', 32, 24);
            c.destroy();
        }

        // 3. Botella de Plástico con Tapa Azul (44x20)
        if (!this.textures.exists('basura_botella_azul')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0x0a4066, 0.4);
            c.fillEllipse(22, 17, 34, 6);
            // Cuerpo transparente celeste
            c.fillStyle(0xa0e6ff, 0.75);
            c.fillRoundedRect(10, 4, 30, 12, 4);
            // Cuello de botella
            c.fillStyle(0x7ed6fa, 0.85);
            c.fillRect(6, 7, 5, 6);
            // Tapa azul
            c.fillStyle(0x0984e3, 1);
            c.fillRect(3, 6, 4, 8);
            // Brillos de plástico
            c.fillStyle(0xffffff, 0.8);
            c.fillRect(12, 5, 24, 2);
            c.fillRect(16, 12, 18, 1);
            c.generateTexture('basura_botella_azul', 44, 22);
            c.destroy();
        }

        // 4. Botella con Tapa Roja (44x20)
        if (!this.textures.exists('basura_botella_roja')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0x0a4066, 0.4);
            c.fillEllipse(22, 17, 34, 6);
            c.fillStyle(0x81ecec, 0.75);
            c.fillRoundedRect(10, 4, 30, 12, 4);
            c.fillStyle(0x55efc4, 0.85);
            c.fillRect(6, 7, 5, 6);
            c.fillStyle(0xd63031, 1);
            c.fillRect(3, 6, 4, 8);
            c.fillStyle(0xffffff, 0.8);
            c.fillRect(12, 5, 24, 2);
            c.generateTexture('basura_botella_roja', 44, 22);
            c.destroy();
        }

        // 5. Vaso de Unicel / Desechable (28x28)
        if (!this.textures.exists('basura_vaso')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0x0a4066, 0.4);
            c.fillEllipse(14, 25, 20, 5);
            // Copa cónica
            c.fillStyle(0xf5f6fa, 1);
            c.fillPoints([
                { x: 4, y: 5 }, { x: 24, y: 5 },
                { x: 20, y: 23 }, { x: 8, y: 23 }
            ], true);
            // Borde superior
            c.fillStyle(0xdcdde1, 1);
            c.fillRoundedRect(3, 3, 22, 4, 2);
            // Sombra lateral
            c.fillStyle(0xb2bec3, 0.6);
            c.fillRect(18, 5, 4, 18);
            c.generateTexture('basura_vaso', 28, 28);
            c.destroy();
        }

        // 6. Bolsa de Plástico Blanca Arrugada (38x30)
        if (!this.textures.exists('basura_bolsa')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0x0a4066, 0.4);
            c.fillEllipse(19, 25, 28, 6);
            c.fillStyle(0xecf0f1, 0.85);
            c.fillCircle(14, 14, 10);
            c.fillCircle(24, 15, 11);
            c.fillCircle(20, 12, 9);
            // Asas de la bolsa
            c.lineStyle(3, 0xbdc3c7, 0.9);
            c.strokeCircle(10, 8, 4);
            c.strokeCircle(28, 8, 4);
            c.generateTexture('basura_bolsa', 38, 30);
            c.destroy();
        }

        // 7. Partícula de Gota de Agua (16x16)
        if (!this.textures.exists('particula_gota')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0x00f2fe, 1);
            c.fillCircle(8, 8, 5);
            c.fillStyle(0xffffff, 0.8);
            c.fillCircle(6, 6, 2);
            c.generateTexture('particula_gota', 16, 16);
            c.destroy();
        }

        // 8. Partícula de Chispa de Energía Limpia (16x16)
        if (!this.textures.exists('chispa_energia')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0x2ecc71, 1);
            c.fillCircle(8, 8, 5);
            c.fillStyle(0xf1c40f, 1);
            c.fillCircle(8, 8, 3);
            c.fillStyle(0xffffff, 1);
            c.fillCircle(8, 8, 1);
            c.generateTexture('chispa_energia', 16, 16);
            c.destroy();
        }

        // 9. Textura Fallback para Turbina Eólica (si turbina.png no existe todavía)
        if (!this.textures.exists('turbina_eolica')) {
            const canvas = document.createElement('canvas');
            canvas.width = 64 * 4;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');

            for (let f = 0; f < 4; f++) {
                const ox = f * 64;
                const angBase = (f * Math.PI) / 6;

                // Torre blanca cónica
                ctx.fillStyle = '#dfe6e9';
                ctx.beginPath();
                ctx.moveTo(ox + 30, 48);
                ctx.lineTo(ox + 34, 48);
                ctx.lineTo(ox + 36, 126);
                ctx.lineTo(ox + 28, 126);
                ctx.closePath();
                ctx.fill();

                // Detalle sombra de la torre
                ctx.fillStyle = '#b2bec3';
                ctx.fillRect(ox + 32, 48, 2, 78);

                // Buje / Eje central
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ox + 32, 48, 5, 0, Math.PI * 2);
                ctx.fill();

                // 3 Aspas giratorias
                ctx.fillStyle = '#f5f6fa';
                ctx.strokeStyle = '#636e72';
                ctx.lineWidth = 1;

                for (let b = 0; b < 3; b++) {
                    const ang = angBase + (b * 2 * Math.PI) / 3;
                    const cosA = Math.cos(ang);
                    const sinA = Math.sin(ang);
                    const len = 38;

                    ctx.beginPath();
                    ctx.moveTo(ox + 32, 48);
                    ctx.lineTo(ox + 32 + cosA * len - sinA * 3, 48 + sinA * len + cosA * 3);
                    ctx.lineTo(ox + 32 + cosA * (len + 4), 48 + sinA * (len + 4));
                    ctx.lineTo(ox + 32 + cosA * len + sinA * 3, 48 + sinA * len - cosA * 3);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
            }

            this.textures.addSpriteSheet('turbina_eolica', canvas, {
                frameWidth: 64,
                frameHeight: 128
            });
        }
    }
    // FIN GENERACIÓN DE TEXTURAS DE BASURA PIXEL-ART

    /* =========================================================================
     * ANIMACIONES DE SPRITESHEETS
     * ========================================================================= */
    crearAnimaciones() {
        if (!this.anims.exists('anim_llanta_flotando')) {
            this.anims.create({
                key: 'anim_llanta_flotando',
                frames: this.anims.generateFrameNumbers('basura_llanta', { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1
            });
        }

        if (!this.anims.exists('anim_tronco_flotando')) {
            this.anims.create({
                key: 'anim_tronco_flotando',
                frames: this.anims.generateFrameNumbers('basura_tronco', { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1
            });
        }

        // Animación de rotación de la turbina eólica
        if (this.textures.exists('turbina_eolica') && !this.anims.exists('anim_turbina_girando')) {
            const numFrames = this.textures.get('turbina_eolica').frameTotal;
            if (numFrames > 1) {
                this.anims.create({
                    key: 'anim_turbina_girando',
                    frames: this.anims.generateFrameNumbers('turbina_eolica', { start: 0, end: Math.max(0, numFrames - 2) }),
                    frameRate: 8,
                    repeat: -1
                });
            }
        }
    }
    // FIN ANIMACIONES DE SPRITESHEETS

    /* =========================================================================
     * ESCENARIO Y CAPAS VISUALES
     * ========================================================================= */
    crearEscenario() {
        // Fondo base original de la presa (Segunda Imagen) escalado a 1000x800
        this.fondo = this.add.image(500, 400, 'fondo_presa')
            .setDisplaySize(1000, 800)
            .setDepth(0);

        // Bosque denso y variado a lo largo de las colinas y ribera del fondo
        this.crearBosqueFondo();

        // Destellos de luz en la caída de agua de la presa (vertedero)
        this.espumaVertedero = this.add.graphics().setDepth(2);
        this.animarEspumaVertedero();
    }

    /* =========================================================================
     * BOSQUE DE FONDO
     * CAPA 1: Colina lejana y alta (Y: 215 a 230)
     * CAPA 2: Pendiente intermedia (Y: 235 a 250) - Gran densidad de follaje con suave oscilación
     * CAPA 3: Prado con ligera inclinación (Y: 245 a 270) - Gran densidad de follaje con suave oscilación
     * ========================================================================= */
    crearBosqueFondo() {
        this.grupoArbolesFondo = this.add.group();

        // Usar exclusivamente los 3 árboles de la Sala B
        const clavesArboles = [
            'arbol_1_sala_b',
            'arbol_2_sala_b',
            'arbol_3_sala_b'
        ];

        // Determinar exactamente entre 3 y 4 posiciones aleatorias para las turbinas en total
        const totalTurbinas = Phaser.Math.Between(3, 4);
        const posicionesXPosibles = [];
        for (let x = 230; x <= 720; x += 55) {
            posicionesXPosibles.push(x + Phaser.Math.Between(-15, 15));
        }
        Phaser.Utils.Array.Shuffle(posicionesXPosibles);
        const posicionesTurbinas = posicionesXPosibles.slice(0, totalTurbinas);
        let turbinasRestantes = totalTurbinas;

        // Capa 1: Colina lejana y alta (Y: 204 a 226) - Máxima densidad en la línea del horizonte
        for (let x = 200; x <= 750; x += Phaser.Math.Between(10, 45)) {
            const y = Phaser.Math.Between(225, 255);
            const flip = Phaser.Math.Between(0, 1) === 1;
            const alpha = Phaser.Math.FloatBetween(0.85, 0.95);

            // Verificar si este punto coincide con una de las turbinas elegidas (máximo 4 en total)
            const indexTurbina = posicionesTurbinas.findIndex(tx => Math.abs(tx - x) < 26);
            const esTurbina = indexTurbina !== -1 && turbinasRestantes > 0 && this.textures.exists('turbina_eolica');

            if (esTurbina) {
                posicionesTurbinas.splice(indexTurbina, 1);
                turbinasRestantes--;

                const anchoT = Phaser.Math.Between(38, 50);
                const altoT = Phaser.Math.Between(78, 102);
                const turbina = this.add.sprite(x, y + 4, 'turbina_eolica')
                    .setDisplaySize(anchoT, altoT)
                    .setOrigin(0.5, 1)
                    .setAlpha(alpha)
                    .setDepth(1 + y * 0.001);

                if (this.anims.exists('anim_turbina_girando')) {
                    turbina.play('anim_turbina_girando');
                }

                this.grupoArbolesFondo.add(turbina);
            } else {
                const clave = Phaser.Utils.Array.GetRandom(clavesArboles);
                const ancho = Phaser.Math.Between(34, 48);
                const alto = Phaser.Math.Between(44, 64);

                const arbol = this.add.image(x, y, clave)
                    .setDisplaySize(ancho, alto)
                    .setOrigin(0.5, 1)
                    .setFlipX(flip)
                    .setAlpha(alpha)
                    .setDepth(1 + y * 0.001);

                // Oscilación suave en colina lejana
                if (Phaser.Math.Between(0, 1) === 0) {
                    const anguloMax = Phaser.Math.FloatBetween(1.8, 3.2);
                    this.tweens.add({
                        targets: arbol,
                        angle: { from: -anguloMax, to: anguloMax },
                        duration: Phaser.Math.Between(1800, 2800),
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        delay: Phaser.Math.Between(0, 1200)
                    });
                }

                this.grupoArbolesFondo.add(arbol);
            }
        }

        // Capa 2: Pendiente intermedia (Y: 226 a 250) - Gran densidad de follaje con suave oscilación
        for (let x = 220; x <= 730; x += Phaser.Math.Between(15, 45)) {
            const y = Phaser.Math.Between(260, 285);
            const flip = Phaser.Math.Between(0, 1) === 1;
            const alpha = Phaser.Math.FloatBetween(0.88, 0.98);

            // Si aún quedan turbinas pendientes por colocar de las 4 máximas
            const indexTurbina = posicionesTurbinas.findIndex(tx => Math.abs(tx - x) < 26);
            const esTurbina = indexTurbina !== -1 && turbinasRestantes > 0 && this.textures.exists('turbina_eolica');

            if (esTurbina) {
                posicionesTurbinas.splice(indexTurbina, 1);
                turbinasRestantes--;

                const anchoT = Phaser.Math.Between(46, 58);
                const altoT = Phaser.Math.Between(92, 118);
                const turbina = this.add.sprite(x, y + 6, 'turbina_eolica')
                    .setDisplaySize(anchoT, altoT)
                    .setOrigin(0.5, 1)
                    .setAlpha(alpha)
                    .setDepth(1 + y * 0.001);

                if (this.anims.exists('anim_turbina_girando')) {
                    turbina.play('anim_turbina_girando');
                }

                this.grupoArbolesFondo.add(turbina);
            } else {
                const clave = Phaser.Utils.Array.GetRandom(clavesArboles);
                const ancho = Phaser.Math.Between(50, 72);
                const alto = Phaser.Math.Between(64, 90);

                const arbol = this.add.image(x, y, clave)
                    .setDisplaySize(ancho, alto)
                    .setOrigin(0.5, 1)
                    .setFlipX(flip)
                    .setAlpha(alpha)
                    .setDepth(1 + y * 0.001);

                // Brisa visible en árboles intermedios
                const anguloMax = Phaser.Math.FloatBetween(2.5, 4.5);
                this.tweens.add({
                    targets: arbol,
                    angle: { from: -anguloMax, to: anguloMax },
                    duration: Phaser.Math.Between(1600, 2400),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    delay: Phaser.Math.Between(0, 1000)
                });

                this.grupoArbolesFondo.add(arbol);
            }
        }

        // Capa 3: Ribera cercana al agua (Y: 250 a 275) - Árboles frondosos de primer plano
        // Los arboles son definidos por las variables x, y, ancho, alto
        // flip: 0 no voltea el arbol, 1 voltea el arbol horizontalmente
        // alpha: opacidad del arbol  

        for (let x = 220; x <= 765; x += Phaser.Math.Between(25, 35)) {
            const clave = Phaser.Utils.Array.GetRandom(clavesArboles);
            const y = Phaser.Math.Between(300, 320);
            const ancho = Phaser.Math.Between(60, 92);
            const alto = Phaser.Math.Between(76, 110);
            const flip = Phaser.Math.Between(0, 1) === 1;

            const arbol = this.add.image(x, y, clave)
                .setDisplaySize(ancho, alto)
                .setOrigin(0.5, 1)
                .setFlipX(flip)
                .setAlpha(1.0)
                .setDepth(1 + y * 0.001);

            // Viento natural más evidente en árboles de primer plano
            const anguloMax = Phaser.Math.FloatBetween(3.0, 5.0);
            this.tweens.add({
                targets: arbol,
                angle: { from: -anguloMax, to: anguloMax },
                duration: Phaser.Math.Between(1500, 2200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: Phaser.Math.Between(0, 900)
            });

            this.grupoArbolesFondo.add(arbol);
        }
    }
    // FIN BOSQUE DE FONDO

    /* =========================================================================
     * CÁLCULO DE LÍMITES DIAGONALES DE LA PRESA
     * ========================================================================= */
    obtenerLimiteCaidaX(y) {
        // La pared diagonal de la presa (arriba desplazado un poco más a la derecha, abajo intacto):
        // Arriba (y = 350, donde Y es menor): x ≈ 742
        // Abajo (y = 620, donde Y es mayor): x ≈ 895
        const t = (y - 350) / (620 - 350);
        return 742 + t * (895 - 742);
    }

    obtenerLimiteLlegadaX(y) {
        // La zona de peligro / advertencia (no clickeable) está 60px antes de la pared diagonal
        return this.obtenerLimiteCaidaX(y) - 60;
    }

    /* =========================================================================
     * ESPUMA DEL VERTEDERO - Rectangulo blanco que simula la espuma del vertedero
     * ========================================================================= */
    animarEspumaVertedero() {
        this.tweens.addCounter({
            from: 0,
            to: 10,
            duration: 350,
            yoyo: true,
            repeat: -1,
            onUpdate: (tween) => {
                const val = tween.getValue();
                this.espumaVertedero.clear();
                this.espumaVertedero.fillStyle(0xffffff, 0.15 + (val / 10) * 0.15);
                // Zona espumosa al pie del vertedero coincidiendo con la pared diagonal
                this.espumaVertedero.fillPoints([
                    { x: 712, y: 345 },
                    { x: 752, y: 340 },
                    { x: 915, y: 630 },
                    { x: 855, y: 645 }
                ], true);
            }
        });
    }
    // FIN ESPUMA DEL VERTEDERO

    /* =========================================================================
     * EFECTOS DE AGUA
     * ========================================================================= */
    crearEfectosAgua() {
        // Líneas sutiles de corriente que viajan de izquierda a derecha en el río
        this.lineasCorriente = [];
        for (let i = 0; i < 7; i++) {
            const yPos = Phaser.Math.Between(this.limitesRio.yMin + 20, this.limitesRio.yMax - 20);
            const xPos = Phaser.Math.Between(0, 800);
            const linea = this.add.graphics().setDepth(1);
            linea.fillStyle(0xffffff, 0.25);
            linea.fillRect(0, 0, Phaser.Math.Between(30, 70), 2);
            linea.x = xPos;
            linea.y = yPos;
            linea.speed = Phaser.Math.Between(90, 150);
            this.lineasCorriente.push(linea);
        }
    }

    /* =========================================================================
     * HUD ESTILO ARCADE RETRO (Inspirado en Imagen 1)
     * ========================================================================= */
    crearHUD() {
        this.hudContainer = this.add.container(0, 0).setDepth(100);

        // Barra superior translúcida con bordes biselados arcade
        const barraSuperior = this.add.graphics();
        barraSuperior.fillStyle(0x08101a, 0.88);
        barraSuperior.fillRect(0, 0, 1000, 72);
        barraSuperior.lineStyle(2, 0x00f2fe, 0.7);
        barraSuperior.beginPath();
        barraSuperior.moveTo(0, 72);
        barraSuperior.lineTo(1000, 72);
        barraSuperior.strokePath();

        // Acentos de esquina cyber
        barraSuperior.fillStyle(0x00f2fe, 0.9);
        barraSuperior.fillRect(10, 68, 60, 4);
        barraSuperior.fillRect(930, 68, 60, 4);
        this.hudContainer.add(barraSuperior);

        // 1. PUNTUACIÓN (Izquierda)
        const tituloScore = this.add.text(25, 12, 'SCORE:', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '11px',
            color: '#94a3b8'
        });
        this.textoScore = this.add.text(25, 28, '00000', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '16px',
            color: '#ffffff'
        });
        this.hudContainer.add([tituloScore, this.textoScore]);

        // Contador de Basuras Limpiadas
        this.textoBasuras = this.add.text(25, 50, 'LIMPIADOS: 0', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '9px',
            color: '#7ed957'
        });
        this.hudContainer.add(this.textoBasuras);

        // 2. BARRA DE ENERGÍA LIMPIA (Centro)
        const tituloEnergia = this.add.text(500, 12, 'CLEAN ENERGY METER', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '11px',
            color: '#00f2fe'
        }).setOrigin(0.5, 0);

        // Marco de la barra de energía
        const marcoBarra = this.add.graphics();
        marcoBarra.lineStyle(3, 0x00f2fe, 1);
        marcoBarra.fillStyle(0x040810, 0.85);
        marcoBarra.strokeRoundedRect(320, 28, 360, 22, 6);
        marcoBarra.fillRoundedRect(320, 28, 360, 22, 6);

        // Relleno animado de la barra de energía
        this.graficoBarraEnergia = this.add.graphics();

        // Texto de porcentaje de energía
        this.textoPorcentajeEnergia = this.add.text(500, 39, '50%', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '11px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Nivel actual debajo de la barra
        this.textoNivel = this.add.text(500, 54, 'NIVEL: 1 - PRESA HIDROELÉCTRICA', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#cbd5e1'
        }).setOrigin(0.5, 0);

        this.hudContainer.add([
            tituloEnergia,
            marcoBarra,
            this.graficoBarraEnergia,
            this.textoPorcentajeEnergia,
            this.textoNivel
        ]);

        // 3. TIEMPO Y ESTADO (Derecha)
        const tituloTimer = this.add.text(860, 12, 'TIMER:', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '11px',
            color: '#94a3b8'
        });
        this.textoTimer = this.add.text(860, 28, '0:00', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '16px',
            color: '#ffffff'
        });
        this.hudContainer.add([tituloTimer, this.textoTimer]);

        // Botón para alternar guía visual de Zonas (Imagen 3)
        this.botonZonas = this.add.text(860, 50, '[👁️ ZONAS: OFF]', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#f1c40f',
            backgroundColor: '#1e272e',
            padding: { x: 5, y: 3 }
        }).setInteractive({ useHandCursor: true });

        this.botonZonas.on('pointerdown', () => this.alternarGuiaZonas());
        this.botonZonas.on('pointerover', () => this.botonZonas.setStyle({ color: '#ffffff', backgroundColor: '#e67e22' }));
        this.botonZonas.on('pointerout', () => this.botonZonas.setStyle({ color: '#f1c40f', backgroundColor: '#1e272e' }));
        this.hudContainer.add(this.botonZonas);

        // Botón de Salida / Volver
        this.botonSalir = this.add.text(975, 12, 'ESC ✖', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#ff4757'
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        this.botonSalir.on('pointerdown', () => this.salirAlMapa());
        this.hudContainer.add(this.botonSalir);

        // Dibujar barra en estado inicial al 50%
        this.actualizarBarraEnergia();
    }

    actualizarBarraEnergia() {
        const barraX = 323;
        const barraY = 31;
        const barraAnchoMax = 354;
        const barraAlto = 16;

        this.graficoBarraEnergia.clear();

        const anchoActual = Math.max(0, Math.min(barraAnchoMax, (this.energia / 100) * barraAnchoMax));

        // Color según el nivel de energía
        let colorBarra = 0x2ecc71; // Verde limpio (> 50%)
        if (this.energia < 30) {
            colorBarra = 0xe74c3c; // Rojo peligro
        } else if (this.energia < 55) {
            colorBarra = 0xf1c40f; // Amarillo advertencia
        }

        if (anchoActual > 0) {
            // Fondo con degradado o brillo
            this.graficoBarraEnergia.fillStyle(colorBarra, 1);
            this.graficoBarraEnergia.fillRoundedRect(barraX, barraY, anchoActual, barraAlto, 4);

            // Reflejo blanco en la parte superior de la barra
            this.graficoBarraEnergia.fillStyle(0xffffff, 0.45);
            this.graficoBarraEnergia.fillRect(barraX + 2, barraY + 2, Math.max(0, anchoActual - 4), 4);
        }

        this.textoPorcentajeEnergia.setText(`${Math.round(this.energia)}%`);

        // Si la energía es baja, parpadear en rojo
        if (this.energia <= 25) {
            this.textoPorcentajeEnergia.setColor('#ff4757');
        } else {
            this.textoPorcentajeEnergia.setColor('#ffffff');
        }
    }

    actualizarRelojHUD() {
        const mins = Math.floor(this.tiempoSegundos / 60);
        const segs = this.tiempoSegundos % 60;
        const segsStr = segs < 10 ? `0${segs}` : `${segs}`;
        this.textoTimer.setText(`${mins}:${segsStr}`);
    }

    /* =========================================================================
     * CAPA DE ZONAS DELIMITADORAS (Tercera Imagen de Referencia)
     * ========================================================================= */
    crearCapaZonas() {
        this.contenedorZonas = this.add.container(0, 0).setDepth(80).setVisible(false);

        const g = this.add.graphics();
        const yTop = this.limitesRio.yMin - 10;
        const yHeight = (this.limitesRio.yMax - this.limitesRio.yMin) + 20;

        // 1. ZONA DE GENERACIÓN (Amarillo punteado)
        // X: 10 a 130
        const genW = 125;
        g.fillStyle(0xf1c40f, 0.18);
        g.fillRoundedRect(10, yTop, genW, yHeight, 10);
        g.lineStyle(3, 0xf1c40f, 0.95);
        this.dibujarRectanguloPunteado(g, 10, yTop, genW, yHeight, 10);

        const etiquetaGen = this.add.text(10 + genW / 2, yTop - 24, 'ZONA DE GENERACIÓN', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#f1c40f',
            backgroundColor: '#1e272e',
            padding: { x: 4, y: 3 }
        }).setOrigin(0.5, 0);

        // 2. ÁREA DE JUEGO (Clickeable) (Cyan punteado)
        // Delimitada por la diagonal real de la presa
        const yBot = this.limitesRio.yMax + 10;
        const xLlegadaTop = this.obtenerLimiteLlegadaX(yTop);
        const xLlegadaBot = this.obtenerLimiteLlegadaX(yBot);

        g.fillStyle(0x00f2fe, 0.12);
        g.fillPoints([
            { x: 155, y: yTop },
            { x: xLlegadaTop, y: yTop },
            { x: xLlegadaBot, y: yBot },
            { x: 155, y: yBot }
        ], true);
        g.lineStyle(3, 0x00f2fe, 0.95);
        this.dibujarPoligonoPunteado(g, [
            { x: 155, y: yTop },
            { x: xLlegadaTop, y: yTop },
            { x: xLlegadaBot, y: yBot },
            { x: 155, y: yBot }
        ]);

        const etiquetaJuego = this.add.text((155 + (xLlegadaTop + xLlegadaBot) / 2) / 2, yTop - 24, 'ÁREA DE JUEGO (CLICKEABLE)', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '9px',
            color: '#00f2fe',
            backgroundColor: '#0a3d62',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5, 0);

        // 3. ZONA DE LLEGADA (No clickeable / Resta energía) (Rojo punteado diagonal)
        const xCaidaTop = this.obtenerLimiteCaidaX(yTop);
        const xCaidaBot = this.obtenerLimiteCaidaX(yBot);

        g.fillStyle(0xe74c3c, 0.28);
        g.fillPoints([
            { x: xLlegadaTop, y: yTop },
            { x: xCaidaTop, y: yTop },
            { x: xCaidaBot, y: yBot },
            { x: xLlegadaBot, y: yBot }
        ], true);
        g.lineStyle(3, 0xe74c3c, 0.95);
        this.dibujarPoligonoPunteado(g, [
            { x: xLlegadaTop, y: yTop },
            { x: xCaidaTop, y: yTop },
            { x: xCaidaBot, y: yBot },
            { x: xLlegadaBot, y: yBot }
        ]);

        const etiquetaLlegada = this.add.text((xLlegadaTop + xCaidaTop) / 2, yTop - 24, 'ZONA DE LLEGADA\n(NO CLICKEABLE)', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '7px',
            color: '#ff4757',
            backgroundColor: '#2c0b0e',
            align: 'center',
            padding: { x: 4, y: 3 }
        }).setOrigin(0.5, 0);

        // Panel de Leyenda inferior (idéntico a la tercera imagen)
        const panelLeyenda = this.add.graphics();
        panelLeyenda.fillStyle(0x0b1320, 0.92);
        panelLeyenda.fillRoundedRect(15, 720, 970, 68, 10);
        panelLeyenda.lineStyle(2, 0x334e68, 0.8);
        panelLeyenda.strokeRoundedRect(15, 720, 970, 68, 10);

        const textoLeyenda = this.add.text(35, 730,
            '🟨 ZONA DE GENERACIÓN: Aquí aparece la basura que la corriente arrastra.\n' +
            '🟦 ÁREA DE JUEGO: Haz CLICK sobre la basura aquí para retirarla y generar +ENERGÍA.\n' +
            '🟥 ZONA DE LLEGADA: Si la basura llega a la presa, NO se puede recoger y RESTA energía.', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
            color: '#f8fafc',
            lineSpacing: 4
        });

        this.contenedorZonas.add([
            g,
            etiquetaGen,
            etiquetaJuego,
            etiquetaLlegada,
            panelLeyenda,
            textoLeyenda
        ]);
    }

    dibujarPoligonoPunteado(g, puntos) {
        const segmento = 10;
        const espacio = 6;
        for (let i = 0; i < puntos.length; i++) {
            const p1 = puntos[i];
            const p2 = puntos[(i + 1) % puntos.length];
            const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
            const dx = (p2.x - p1.x) / dist;
            const dy = (p2.y - p1.y) / dist;

            let cur = 0;
            while (cur < dist) {
                const startX = p1.x + dx * cur;
                const startY = p1.y + dy * cur;
                const endLen = Math.min(cur + segmento, dist);
                const endX = p1.x + dx * endLen;
                const endY = p1.y + dy * endLen;
                g.moveTo(startX, startY);
                g.lineTo(endX, endY);
                cur += segmento + espacio;
            }
        }
        g.strokePath();
    }

    dibujarRectanguloPunteado(g, x, y, width, height, radius) {
        // Marco punteado simulado con trazos cortos
        const segmento = 10;
        const espacio = 6;
        // Borde superior
        for (let ix = x; ix < x + width; ix += segmento + espacio) {
            g.moveTo(ix, y);
            g.lineTo(Math.min(ix + segmento, x + width), y);
        }
        // Borde inferior
        for (let ix = x; ix < x + width; ix += segmento + espacio) {
            g.moveTo(ix, y + height);
            g.lineTo(Math.min(ix + segmento, x + width), y + height);
        }
        // Borde izquierdo
        for (let iy = y; iy < y + height; iy += segmento + espacio) {
            g.moveTo(x, iy);
            g.lineTo(x, Math.min(iy + segmento, y + height));
        }
        // Borde derecho
        for (let iy = y; iy < y + height; iy += segmento + espacio) {
            g.moveTo(x + width, iy);
            g.lineTo(x + width, Math.min(iy + segmento, y + height));
        }
        g.strokePath();
    }

    alternarGuiaZonas() {
        this.mostrarGuiaZonas = !this.mostrarGuiaZonas;
        this.contenedorZonas.setVisible(this.mostrarGuiaZonas);
        this.botonZonas.setText(this.mostrarGuiaZonas ? '[GUÍA DE ZONAS: ON]' : '[GUÍA DE ZONAS: OFF]');
        this.botonZonas.setColor(this.mostrarGuiaZonas ? '#2ecc71' : '#f1c40f');
    }

    /* =========================================================================
     * GENERACIÓN Y COMPORTAMIENTO DE BASURA FLOTANTE
     * ========================================================================= */
    generarNuevaBasura() {
        if (this.juegoTerminado || this.juegoPausado) return;

        // Generar entre 2 y 3 basuras por llamada, con pequeños desfases aleatorios
        const cantidad = Phaser.Math.Between(2, 3);
        for (let i = 0; i < cantidad; i++) {
            const delay = i * Phaser.Math.Between(200, 400);
            this.time.delayedCall(delay, () => this._spawnBasura());
        }
    }

    _spawnBasura() {
        if (this.juegoTerminado || this.juegoPausado) return;

        // Limitar la cantidad simultánea de basura en pantalla a máximo 10 piezas
        const basurasActivas = this.grupoBasura.getChildren().filter(b => b.active && (b.estado === 'en_juego' || b.estado === 'en_llegada')).length;
        // LIMITE DE LA CANTIDAD DE BASURA EN PANTALLA.
        if (basurasActivas >= 6) return;

        // Catálogo de basura disponible
        const tiposBasura = [
            { clave: 'basura_llanta', esSpriteSheet: true, anim: 'anim_llanta_flotando', escala: 0.22, valorEnergia: 7, puntos: 250, nombre: 'Neumático' },
            { clave: 'basura_tronco', esSpriteSheet: true, anim: 'anim_tronco_flotando', escala: 0.35, valorEnergia: 6, puntos: 200, nombre: 'Tronco' },
            { clave: 'basura_lata_roja', esSpriteSheet: false, escala: 1.3, valorEnergia: 4, puntos: 100, nombre: 'Lata' },
            { clave: 'basura_lata_amarilla', esSpriteSheet: false, escala: 1.3, valorEnergia: 4, puntos: 100, nombre: 'Lata' },
            { clave: 'basura_botella_azul', esSpriteSheet: false, escala: 1.3, valorEnergia: 5, puntos: 120, nombre: 'Botella' },
            { clave: 'basura_botella_roja', esSpriteSheet: false, escala: 1.3, valorEnergia: 5, puntos: 120, nombre: 'Botella' },
            { clave: 'basura_vaso', esSpriteSheet: false, escala: 1.4, valorEnergia: 3, puntos: 80, nombre: 'Vaso' },
            { clave: 'basura_bolsa', esSpriteSheet: false, escala: 1.4, valorEnergia: 5, puntos: 150, nombre: 'Bolsa' }
        ];

        const item = Phaser.Utils.Array.GetRandom(tiposBasura);

        // Posición inicial acotada dentro del cauce seguro del río
        // Podemos modificar los límites del río

        const posX = Phaser.Math.Between(this.limitesRio.spawnXMin, this.limitesRio.spawnXMax);
        const posY = Phaser.Math.Between(this.limitesRio.yMin, this.limitesRio.yMax);

        let sprite;
        if (item.esSpriteSheet) {
            sprite = this.add.sprite(posX, posY, item.clave).setScale(item.escala);
            sprite.play(item.anim);
        } else {
            sprite = this.add.image(posX, posY, item.clave).setScale(item.escala);
        }

        // Configuración de físicas y propiedades de flotación
        sprite.setDepth(10);
        sprite.itemInfo = item;
        sprite.baseY = posY;
        sprite.wobblePhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
        sprite.wobbleSpeed = Phaser.Math.FloatBetween(2.5, 4.5);
        sprite.wobbleAmp = Phaser.Math.FloatBetween(3, 7);

        // velocidadBase controla la velocidad de la basera, con cada nivel aumenta la velocidad.
        // Velocidad reducida para dar más tiempo de reacción al jugador
        const velocidadBase = Phaser.Math.Between(55, 80) + (this.nivel - 1) * 10;
        sprite.velocidadX = velocidadBase;

        sprite.estado = 'en_juego'; // 'en_juego', 'en_llegada', 'atascada', 'recogida'
        sprite.setInteractive({ useHandCursor: true });

        // Evento de interacción / limpieza al hacer click
        sprite.on('pointerdown', (pointer) => {
            this.intentarRecogerBasura(sprite, pointer);
        });

        // Efecto hover sutil
        sprite.on('pointerover', () => {
            if (sprite.estado === 'en_juego') {
                sprite.setTint(0x7ed957);
            }
        });
        sprite.on('pointerout', () => {
            if (sprite.estado === 'en_juego') {
                sprite.clearTint();
            }
        });

        this.grupoBasura.add(sprite);
    }

    intentarRecogerBasura(sprite, pointer) {
        if (this.juegoTerminado || this.juegoPausado) return;
        if (sprite.estado === 'recogida' || sprite.estado === 'atascada') return;

        // Comprobación de Zona Diagonal:
        // Si ya cruzó la línea diagonal de la zona de llegada según su coordenada Y actual:
        const limiteLlegadaX = this.obtenerLimiteLlegadaX(sprite.y);
        if (sprite.x >= limiteLlegadaX) {
            // Ya está en la zona de llegada! NO es clickeable
            this.reproducirSonido('rechazo');
            this.mostrarTextoFlotante(sprite.x, sprite.y - 20, '¡NO CLICKEABLE!', '#ff4757');
            return;
        }

        // Si está en el área de juego clickeable:
        sprite.estado = 'recogida';
        this.reproducirSonido('recoger');

        // Multiplicador de combo por clics rápidos
        const ahora = this.time.now;
        if (ahora - this.ultimoClickTiempo < 800) {
            this.combo = Math.min(this.combo + 1, 5);
        } else {
            this.combo = 1;
        }
        this.ultimoClickTiempo = ahora;

        // Sumar energía producida (cada basura retirada suma a la barra)
        const sumaEnergia = sprite.itemInfo.valorEnergia;
        this.energia = Math.min(100, this.energia + sumaEnergia);
        this.actualizarBarraEnergia();

        // Puntos
        const puntosGanados = sprite.itemInfo.puntos * this.combo;
        this.puntuacion += puntosGanados;
        this.basuraRecogida++;

        // Actualizar textos de HUD
        this.textoScore.setText(this.puntuacion.toString().padStart(5, '0'));
        this.textoBasuras.setText(`LIMPIADOS: ${this.basuraRecogida}`);

        // Efectos visuales de recogida
        this.crearEfectoSalpicadura(sprite.x, sprite.y);
        const comboTexto = this.combo > 1 ? ` x${this.combo}` : '';
        this.mostrarTextoFlotante(sprite.x, sprite.y - 20, `+${sumaEnergia}% ⚡ ${puntosGanados}${comboTexto}`, '#2ecc71');

        // Animación de recogida (se encoge y vuela suavemente hacia arriba)
        this.tweens.add({
            targets: sprite,
            y: sprite.y - 35,
            scaleX: sprite.scaleX * 1.3,
            scaleY: sprite.scaleY * 1.3,
            alpha: 0,
            duration: 220,
            ease: 'Back.easeIn',
            onComplete: () => {
                sprite.destroy();
            }
        });

        // Verificar si se alcanzó el 100% de energía limpia para subir de nivel
        if (this.energia >= 100) {
            this.activarSupercargaLimpia();
        }
    }

    basuraAtascadaEnPresa(sprite) {
        sprite.estado = 'atascada';
        this.basuraPerdida++;
        this.reproducirSonido('alarma');

        // Restar energía producida (cada basura que llega a la presa resta de la barra)
        const restaEnergia = 10;
        this.energia = Math.max(0, this.energia - restaEnergia);
        this.actualizarBarraEnergia();

        // Agitar cámara (efecto de atasque de turbina)
        this.cameras.main.shake(250, 0.008);

        // Alerta flotante
        this.mostrarTextoFlotante(sprite.x - 30, sprite.y - 20, `-${restaEnergia}% ⚠️ ¡ATASQUE!`, '#ff4757');

        // Destello rojo en pantalla
        this.destelloAlertaPresa();

        // Animación de succión por el vertedero
        this.tweens.add({
            targets: sprite,
            x: sprite.x + 80,
            y: sprite.y + 60,
            rotation: 1.5,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 380,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                sprite.destroy();
            }
        });

        // Comprobar si la energía llegó a 0% -> Game Over
        if (this.energia <= 0) {
            this.finalizarJuego(false);
        }
    }

    destelloAlertaPresa() {
        const destello = this.add.graphics().setDepth(90);
        destello.fillStyle(0xff0000, 0.22);
        destello.fillRect(0, 0, 1000, 800);
        this.tweens.add({
            targets: destello,
            alpha: 0,
            duration: 300,
            onComplete: () => destello.destroy()
        });
    }

    activarSupercargaLimpia() {
        this.nivel++;
        this.puntuacion += 1000;
        this.textoScore.setText(this.puntuacion.toString().padStart(5, '0'));
        this.textoNivel.setText(`NIVEL: ${this.nivel} - PRESA HIDROELÉCTRICA`);

        // Verificar si se alcanzó el nivel máximo (10)
        if (this.nivel >= 10) {
            this.juegoTerminado = true;
            this.reproducirSonido('victoria_final');
            // Pequeña pausa dramática antes de mostrar la pantalla de victoria
            this.time.delayedCall(800, () => {
                this.mostrarPantallaMaximoRendimiento();
            });
            return;
        }

        this.reproducirSonido('supercarga');

        // Destello dorado de felicitación
        this.mostrarTextoFlotante(500, 200, `¡100% ENERGÍA LIMPIA! NIVEL ${this.nivel} ⚡⚡⚡`, '#00f2fe', '18px');

        // Restablecer energía a un nivel desafiante (65%) para la siguiente oleada
        this.energia = 65;
        this.actualizarBarraEnergia();

        // Acelerar temporizador de generación para mayor dinamismo de forma controlada
        // Controlamos la velocidad de aparición de basura por medio del nivel
        if (this.temporizadorGeneracion) {
            const nuevoDelay = Math.max(600, 1600 - (this.nivel - 1) * 150);
            this.temporizadorGeneracion.delay = nuevoDelay;
        }
    }

    mostrarPantallaMaximoRendimiento() {
        // Overlay oscuro de fondo
        const overlay = this.add.graphics().setDepth(195);
        overlay.fillStyle(0x000a18, 0);
        overlay.fillRect(0, 0, 1000, 800);
        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 600,
            onUpdate: (tween) => {
                overlay.clear();
                overlay.fillStyle(0x000a18, 0.82 * tween.progress);
                overlay.fillRect(0, 0, 1000, 800);
            }
        });

        // Partículas de energía doradas flotando
        for (let i = 0; i < 30; i++) {
            this.time.delayedCall(i * 80, () => {
                const px = Phaser.Math.Between(50, 950);
                const py = Phaser.Math.Between(100, 750);
                const chispa = this.add.graphics().setDepth(196);
                chispa.fillStyle(Phaser.Utils.Array.GetRandom([0xf1c40f, 0x00f2fe, 0x2ecc71, 0xffffff]), 1);
                chispa.fillCircle(0, 0, Phaser.Math.Between(3, 7));
                chispa.x = px;
                chispa.y = py;
                this.tweens.add({
                    targets: chispa,
                    y: py - Phaser.Math.Between(60, 140),
                    alpha: 0,
                    duration: Phaser.Math.Between(1200, 2200),
                    ease: 'Cubic.easeOut',
                    onComplete: () => chispa.destroy()
                });
            });
        }

        // Contenedor del modal de victoria
        const modal = this.add.container(500, 400).setDepth(200).setAlpha(0);

        // Caja principal del modal
        const cajaModal = this.add.graphics();
        cajaModal.fillStyle(0x061525, 0.97);
        cajaModal.fillRoundedRect(-320, -230, 640, 460, 20);
        // Borde dorado brillante
        cajaModal.lineStyle(4, 0xf1c40f, 1);
        cajaModal.strokeRoundedRect(-320, -230, 640, 460, 20);
        // Acento interior cyan
        cajaModal.lineStyle(2, 0x00f2fe, 0.5);
        cajaModal.strokeRoundedRect(-310, -220, 620, 440, 16);

        // Icono de trofeo / rayo
        const iconoTexto = this.add.text(0, -190, '⚡🏆⚡', {
            fontSize: '40px'
        }).setOrigin(0.5);

        // Título principal
        const titulo = this.add.text(0, -140, '¡MÁXIMO RENDIMIENTO!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '20px',
            color: '#f1c40f',
            stroke: '#7d6000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);

        // Subtítulo de la presa
        const subtitulo = this.add.text(0, -98, 'PRESA HIDROELÉCTRICA', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '13px',
            color: '#00f2fe',
            align: 'center'
        }).setOrigin(0.5);

        // Mensaje descriptivo
        const mensaje = this.add.text(0, -48,
            '\nHEMOS ALCANZADO EL MÁXIMO RENDIMIENTO DE ENERGÍA.\n\n' +
            'Las turbinas operan a plena capacidad.\nEl suministro de energía limpia\nalimenta a toda la ciudad.', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '15px',
            color: '#e2e8f0',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        // Estadísticas finales
        const stats = this.add.text(0, 100,
            `PUNTUACIÓN FINAL: ${this.puntuacion.toString().padStart(6, '0')}\n` +
            `BASURA RETIRADA: ${this.basuraRecogida} piezas   TIEMPO: ${Math.floor(this.tiempoSegundos / 60)}m ${this.tiempoSegundos % 60}s`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '9px',
            color: '#94a3b8',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);

        // Divisor decorativo
        const divisor = this.add.graphics();
        divisor.lineStyle(2, 0xf1c40f, 0.6);
        divisor.lineBetween(-260, 140, 260, 140);

        // Botón "VOLVER AL MAPA"
        const botonMapa = this.add.text(0, 180, '🗺️  VOLVER AL MAPA', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#000000',
            backgroundColor: '#f1c40f',
            padding: { x: 28, y: 16 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        botonMapa.on('pointerdown', () => this.salirAlMapa());
        botonMapa.on('pointerover', () => {
            botonMapa.setStyle({ backgroundColor: '#ffd32a', color: '#000000' });
            this.tweens.add({ targets: botonMapa, scaleX: 1.05, scaleY: 1.05, duration: 100, ease: 'Back.easeOut' });
        });
        botonMapa.on('pointerout', () => {
            botonMapa.setStyle({ backgroundColor: '#f1c40f', color: '#000000' });
            this.tweens.add({ targets: botonMapa, scaleX: 1, scaleY: 1, duration: 100 });
        });

        modal.add([cajaModal, iconoTexto, titulo, subtitulo, mensaje, stats, divisor, botonMapa]);

        // Animación de entrada del modal
        this.tweens.add({
            targets: modal,
            alpha: 1,
            scaleX: { from: 0.7, to: 1 },
            scaleY: { from: 0.7, to: 1 },
            duration: 500,
            ease: 'Back.easeOut',
            delay: 300
        });

        // Efecto de pulso dorado en el borde del modal
        this.tweens.add({
            targets: modal,
            alpha: { from: 1, to: 0.92 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 900
        });
    }

    crearEfectoSalpicadura(x, y) {
        for (let i = 0; i < 8; i++) {
            const gota = this.add.image(x, y, 'particula_gota').setDepth(15);
            const angulo = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const dist = Phaser.Math.Between(20, 45);

            this.tweens.add({
                targets: gota,
                x: x + Math.cos(angulo) * dist,
                y: y + Math.sin(angulo) * dist - 15,
                alpha: 0,
                scale: 0.3,
                duration: Phaser.Math.Between(250, 400),
                ease: 'Quad.easeOut',
                onComplete: () => gota.destroy()
            });
        }
    }

    mostrarTextoFlotante(x, y, mensaje, color = '#ffffff', fontSize = '11px') {
        const texto = this.add.text(x, y, mensaje, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: fontSize,
            color: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(110);

        this.tweens.add({
            targets: texto,
            y: y - 45,
            alpha: 0,
            duration: 900,
            ease: 'Cubic.easeOut',
            onComplete: () => texto.destroy()
        });
    }

    /* =========================================================================
     * UPDATE LOOP
     * ========================================================================= */
    update(time, delta) {
        if (this.juegoTerminado || this.juegoPausado) return;

        const dtSegundos = delta / 1000;

        // Actualizar partículas de corriente
        this.lineasCorriente.forEach((linea) => {
            linea.x += linea.speed * dtSegundos;
            const limiteDerecho = this.obtenerLimiteCaidaX(linea.y);
            if (linea.x > limiteDerecho) {
                linea.x = -60;
                linea.y = Phaser.Math.Between(this.limitesRio.yMin + 20, this.limitesRio.yMax - 20);
            }
        });

        // Actualizar posición y movimiento de cada basura
        const basuras = this.grupoBasura.getChildren();
        for (let i = basuras.length - 1; i >= 0; i--) {
            const b = basuras[i];
            if (!b.active || b.estado === 'recogida' || b.estado === 'atascada') continue;

            const limiteLlegadaX = this.obtenerLimiteLlegadaX(b.y);
            const limiteCaidaX = this.obtenerLimiteCaidaX(b.y);

            // Movimiento hacia la derecha arrastrado por la corriente
            // Al acercarse a la zona de llegada, la corriente lo atrae más rápido
            let velocidadActual = b.velocidadX;
            if (b.x >= limiteLlegadaX) {
                velocidadActual *= 1.4;
            }
            b.x += velocidadActual * dtSegundos;

            // Oscilación suave de flotación vertical (acotada al agua sin desbordar el eje Y)
            const wobble = Math.sin((time / 1000) * b.wobbleSpeed + b.wobblePhase) * b.wobbleAmp;
            b.y = Phaser.Math.Clamp(b.baseY + wobble, this.limitesRio.yMin - 5, this.limitesRio.yMax + 5);

            // Transición a Zona de Llegada (No clickeable) según límite diagonal
            if (b.x >= limiteLlegadaX && b.estado === 'en_juego') {
                b.estado = 'en_llegada';
                // Tinte rojizo de peligro
                b.setTint(0xff7675);
            }

            // Si alcanza la pared diagonal de la presa -> Atasque en turbina
            if (b.x >= limiteCaidaX) {
                this.basuraAtascadaEnPresa(b);
            }
        }
    }

    /* =========================================================================
     * PANTALLAS DE FIN DE JUEGO Y MODALES
     * ========================================================================= */
    finalizarJuego(victoria) {
        this.juegoTerminado = true;
        this.reproducirSonido('game_over');

        // Modal oscuro centrado
        const modal = this.add.container(500, 400).setDepth(200);

        const fondoOverlay = this.add.graphics();
        fondoOverlay.fillStyle(0x050b14, 0.88);
        fondoOverlay.fillRect(-500, -400, 1000, 800);

        const cajaModal = this.add.graphics();
        cajaModal.fillStyle(0x0f1c2e, 0.96);
        cajaModal.fillRoundedRect(-280, -200, 560, 400, 16);
        cajaModal.lineStyle(3, 0xe74c3c, 1);
        cajaModal.strokeRoundedRect(-280, -200, 560, 400, 16);

        const titulo = this.add.text(0, -150, '¡PRESA ATASCADA!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '22px',
            color: '#ff4757',
            align: 'center'
        }).setOrigin(0.5);

        const subtitulo = this.add.text(0, -105,
            'La acumulación de basura obstruyó las turbinas.\nEl suministro de energía limpia ha caído a 0%.', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '15px',
            color: '#cbd5e1',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);

        // Estadísticas finales
        const statsTexto = this.add.text(0, -15,
            `PUNTUACIÓN FINAL: ${this.puntuacion}\n` +
            `BASURA RETIRADA: ${this.basuraRecogida} piezas\n` +
            `TIEMPO RESISTIDO: ${Math.floor(this.tiempoSegundos / 60)}m ${this.tiempoSegundos % 60}s\n` +
            `NIVEL ALCANZADO: ${this.nivel}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '11px',
            color: '#f8fafc',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        // Botón Reintentar
        const botonReintentar = this.add.text(0, 80, '🔄 REINTENTAR (ENTER)', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '13px',
            color: '#ffffff',
            backgroundColor: '#27ae60',
            padding: { x: 18, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        botonReintentar.on('pointerdown', () => this.reiniciarJuego());
        botonReintentar.on('pointerover', () => botonReintentar.setStyle({ backgroundColor: '#2ecc71', color: '#000' }));
        botonReintentar.on('pointerout', () => botonReintentar.setStyle({ backgroundColor: '#27ae60', color: '#fff' }));

        // Botón Salir al Mapa
        const botonSalir = this.add.text(0, 140, '🚪 VOLVER AL MAPA (ESC)', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '11px',
            color: '#ffffff',
            backgroundColor: '#c0392b',
            padding: { x: 14, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        botonSalir.on('pointerdown', () => this.salirAlMapa());
        botonSalir.on('pointerover', () => botonSalir.setStyle({ backgroundColor: '#e74c3c' }));
        botonSalir.on('pointerout', () => botonSalir.setStyle({ backgroundColor: '#c0392b' }));

        modal.add([fondoOverlay, cajaModal, titulo, subtitulo, statsTexto, botonReintentar, botonSalir]);
    }

    reiniciarJuego() {
        this.scene.restart();
    }

    salirAlMapa() {
        // Detener escena y regresar a la posición segura de la Sala B en EscenaJuego
        this.scene.stop('EscenaEnergia');
        this.scene.start('EscenaJuego', {
            avatarKey: this.avatarKey,
            posInicial: { x: 1750, y: 450 },
            ignoreEscape: true
        });
    }

    mostrarBannerBienvenida() {
        const banner = this.add.container(500, 260).setDepth(150);

        const fondo = this.add.graphics();
        fondo.fillStyle(0x060f1c, 0.94);
        fondo.fillRoundedRect(-260, -80, 520, 160, 12);
        fondo.lineStyle(2, 0x00f2fe, 1);
        fondo.strokeRoundedRect(-260, -80, 520, 160, 12);

        const t1 = this.add.text(0, -50, '⚡ SALA ENERGÍA: PRESA HIDROELÉCTRICA ⚡', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#00f2fe'
        }).setOrigin(0.5);

        const t2 = this.add.text(0, -5,
            'Haz click en la basura que arrastra la corriente para limpiarla.\n' +
            'No dejes que llegue a la presa o se atascarán las turbinas.\n' +
            'Tu barra de energía empieza al 50%. ¡Mantenla arriba!', {
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            color: '#f8fafc',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);

        const t3 = this.add.text(0, 48, '[ HAZ CLICK EN CUALQUIER LADO PARA COMENZAR ]', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#7ed957'
        }).setOrigin(0.5);

        banner.add([fondo, t1, t2, t3]);

        // INICIAR EL JUEGO
        // Cerrar banner y comenzar el juego al hacer click
        this.input.once('pointerdown', () => {
            this.juegoPausado = false;
            this.tweens.add({
                targets: banner,
                alpha: 0,
                duration: 250,
                onComplete: () => banner.destroy()
            });
        });
    }

    /* =========================================================================
     * ENTRADAS Y CONTROLES
     * ========================================================================= */
    crearControles() {
        this.teclaESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.teclaENTER = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.teclaESPACIO = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.input.keyboard.on('keydown-ESC', () => {
            if (this.juegoTerminado) {
                this.salirAlMapa();
            } else {
                this.salirAlMapa();
            }
        });

        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.juegoTerminado) {
                this.reiniciarJuego();
            }
        });

        // Soporte para controles móviles de la barra inferior
        this.time.addEvent({
            delay: 100,
            callback: () => {
                const escapeTactil = window.mobileControls?.consume('escape');
                const enterTactil = window.mobileControls?.consume('enter');

                if (escapeTactil) {
                    this.salirAlMapa();
                }
                if (enterTactil && this.juegoTerminado) {
                    this.reiniciarJuego();
                }
            },
            loop: true
        });
    }

    /* =========================================================================
     * SINTETIZADOR DE AUDIO PROCEDURAL (Web Audio API)
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
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        if (tipo === 'recoger') {
            // Chime arcade limpio brillante
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (tipo === 'alarma') {
            // Clank grave / alarma de bloqueo
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);

            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.28);
        } else if (tipo === 'supercarga') {
            // Fanfarria arpegiada rápida
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const noteTime = now + idx * 0.08;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.2, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(noteTime);
                osc.stop(noteTime + 0.18);
            });
        } else if (tipo === 'rechazo') {
            // Tono corto bajo de advertencia
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(180, now);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.09);
        } else if (tipo === 'game_over') {
            // Caída de tono dramática
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.6);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.6);
        } else if (tipo === 'victoria_final') {
            // Fanfarria épica de victoria: arpeggio ascendente + acorde final
            const notas = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
            notas.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const noteTime = now + idx * 0.10;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);
                gain.gain.setValueAtTime(0.22, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(noteTime);
                osc.stop(noteTime + 0.25);
            });
            // Acorde final sostenido
            [523.25, 659.25, 783.99].forEach((freq) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const startTime = now + 0.70;
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, startTime);
                gain.gain.setValueAtTime(0.15, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + 1.2);
            });
        }
    }
}
