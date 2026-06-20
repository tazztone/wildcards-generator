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
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
