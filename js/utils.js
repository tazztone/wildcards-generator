export const truncate = (str, maxLength, position = 'end') => {
    if (typeof str !== 'string' || str.length <= maxLength) return str || '';
    const ellipsis = '...';
    if (maxLength <= ellipsis.length) return str.slice(0, maxLength);
    const chars = maxLength - ellipsis.length;
    if (position === 'start') return ellipsis + str.slice(-chars);
    if (position === 'middle') {
        const rightChars = Math.floor(chars / 2);
        return str.slice(0, Math.ceil(chars / 2)) + ellipsis + (rightChars > 0 ? str.slice(-rightChars) : '');
    }
    return str.slice(0, chars) + ellipsis;
};

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
    if (typeof input !== 'string') {
        input = String(input ?? '');
    }
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
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
