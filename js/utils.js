// TODO: Add throttle function for scroll/resize event handlers
// TODO: Add deep clone utility that's more performant than JSON.parse/stringify
// TODO: Add string truncation utility with ellipsis for UI
// TODO: Consider moving DOM sanitization to DOMPurify for security

export const sanitize = (input) => {
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};
