// TODO: Add string truncation utility with ellipsis for UI

export const deepClone = (obj) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(obj);
    }
    return JSON.parse(JSON.stringify(obj));
};

export const sanitize = (input) => {
    if (window.DOMPurify) {
        return window.DOMPurify.sanitize(input);
    }
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

export const throttle = (func, wait) => {
    let timeout = null;
    let previous = 0;
    let latestArgs;
    let context;

    const throttled = function(...args) {
        const now = Date.now();
        const remaining = wait - (now - previous);
        latestArgs = args;
        context = this;

        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            func.apply(context, latestArgs);
            latestArgs = null;
            context = null;
        } else if (!timeout) {
            timeout = setTimeout(() => {
                previous = Date.now();
                timeout = null;
                func.apply(context, latestArgs);
                latestArgs = null;
                context = null;
            }, remaining);
        }
    };

    return throttled;
};

export const debounce = (func, wait) => {
    let timeout;
    let latestArgs;
    let context;

    const debounced = function(...args) {
        latestArgs = args;
        context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, latestArgs);
        }, wait);
    };

    debounced.flush = function() {
        clearTimeout(timeout);
        if (latestArgs) {
            func.apply(context, latestArgs);
            latestArgs = null;
            context = null;
        }
    };

    return debounced;
};
