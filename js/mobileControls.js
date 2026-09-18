const touchControlState = {
    up: false,
    down: false,
    left: false,
    right: false,
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
    }
};

document.querySelectorAll('[data-control], [data-action]').forEach((button) => {
    const control = button.dataset.control || button.dataset.action;

    const release = () => {
        touchControlState[control] = false;
        button.classList.remove('is-pressed');
    };

    button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        touchControlState[control] = true;
        touchControlState.queued.add(control);
        button.classList.add('is-pressed');
        try {
            button.setPointerCapture?.(event.pointerId);
        } catch (error) {
            // Algunos navegadores no permiten capturar un puntero sintético.
        }
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
});