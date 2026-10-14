const touchControlState = {
    up: false,
    down: false,
    left: false,
    right: false,
    enter: false,
    escape: false,
    queued: new Set()
};

window.mobileControls = {
    isDown(control) {
        return touchControlState[control] === true;
    },
    consume(control) {
        if (!touchControlState.queued.has(control)) return false;
        touchControlState.queued.delete(control);
        return true;
    },
    clear() {
        touchControlState.queued.clear();
        touchControlState.up = false;
        touchControlState.down = false;
        touchControlState.left = false;
        touchControlState.right = false;
        touchControlState.enter = false;
        touchControlState.escape = false;
    }
};

const keyEventMap = {
    up: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
    down: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
    left: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
    right: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
    enter: { key: 'Enter', code: 'Enter', keyCode: 13 },
    escape: { key: 'Escape', code: 'Escape', keyCode: 27 }
};

const dispatchSyntheticKey = (control, type) => {
    const k = keyEventMap[control];
    if (!k) return;
    try {
        const ev = new KeyboardEvent(type, {
            key: k.key,
            code: k.code,
            keyCode: k.keyCode,
            which: k.keyCode,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(ev);
    } catch (e) {}
};

// Prevenir el menú contextual (opciones de clic derecho o pulsación larga en móvil)
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
}, { passive: false });

document.addEventListener('selectstart', (event) => {
    event.preventDefault();
}, { passive: false });

const quitaFocoHtml = (element) => {
    if (element && typeof element.blur === 'function') {
        element.blur();
    }
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
    }
};

document.querySelectorAll('[data-control], [data-action]').forEach((button) => {
    const control = button.dataset.control || button.dataset.action;

    const press = () => {
        touchControlState[control] = true;
        touchControlState.queued.add(control);
        button.classList.add('is-pressed');
        dispatchSyntheticKey(control, 'keydown');
    };

    const release = () => {
        touchControlState[control] = false;
        button.classList.remove('is-pressed');
        quitaFocoHtml(button);
        dispatchSyntheticKey(control, 'keyup');
    };

    button.addEventListener('focus', (event) => {
        event.preventDefault();
        quitaFocoHtml(button);
    });

    button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
            event.preventDefault();
            quitaFocoHtml(button);
        }
    });

    button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        quitaFocoHtml(button);
        press();
        try {
            button.setPointerCapture?.(event.pointerId);
        } catch (error) {
            // Algunos navegadores no permiten capturar un puntero sintético.
        }
    });

    button.addEventListener('pointerenter', (event) => {
        if (event.buttons > 0) {
            press();
        }
    });

    button.addEventListener('pointerleave', (event) => {
        release();
    });

    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('click', (event) => {
        event.preventDefault();
        quitaFocoHtml(button);
    });
});

// Lógica de Pantalla Completa para Teléfonos y Pantallas Móviles
const btnFullscreen = document.getElementById('btn-fullscreen');

function updateFullscreenBtn() {
    if (!btnFullscreen) return;
    const isFS = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );
    const fsText = btnFullscreen.querySelector('.fs-text');
    const fsIcon = btnFullscreen.querySelector('.fs-icon');
    if (fsText) fsText.textContent = isFS ? 'SALIR PANTALLA' : 'PANTALLA COMPLETA';
    if (fsIcon) fsIcon.textContent = isFS ? '🗗' : '⛶';
    btnFullscreen.classList.toggle('is-fullscreen', isFS);
}

if (btnFullscreen) {
    const alternarPantallaCompleta = (event) => {
        if (event) event.preventDefault();
        quitaFocoHtml(btnFullscreen);

        const isFS = Boolean(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );

        if (!isFS) {
            const docEl = document.documentElement;
            if (docEl.requestFullscreen) {
                docEl.requestFullscreen().catch(() => { });
            } else if (docEl.webkitRequestFullscreen) {
                docEl.webkitRequestFullscreen();
            } else if (docEl.mozRequestFullScreen) {
                docEl.mozRequestFullScreen();
            } else if (docEl.msRequestFullscreen) {
                docEl.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => { });
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    };

    btnFullscreen.addEventListener('pointerdown', alternarPantallaCompleta);
    btnFullscreen.addEventListener('click', alternarPantallaCompleta);

    document.addEventListener('fullscreenchange', updateFullscreenBtn);
    document.addEventListener('webkitfullscreenchange', updateFullscreenBtn);
    document.addEventListener('mozfullscreenchange', updateFullscreenBtn);
    document.addEventListener('MSFullscreenChange', updateFullscreenBtn);
}