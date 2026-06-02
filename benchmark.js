const validRoles = ['Subject', 'Location', 'Style', 'Modifier', 'Wearable', 'Object', 'Action'];
const validRolesLower = validRoles.map(r => ({ original: r, lower: r.toLowerCase() }));
const validRolesMap = new Map(validRoles.map(r => [r.toLowerCase(), r]));

const items = Array.from({ length: 1000000 }, (_, i) => {
    return { role: validRoles[i % validRoles.length] };
});

console.time('Array.find');
for (let i = 0; i < items.length; i++) {
    const itemRoleLower = items[i].role.toLowerCase();
    const found = validRolesLower.find(v => v.lower === itemRoleLower);
    if (found) {
        const x = found.original;
    }
}
console.timeEnd('Array.find');

console.time('Map.get');
for (let i = 0; i < items.length; i++) {
    const itemRoleLower = items[i].role.toLowerCase();
    const found = validRolesMap.get(itemRoleLower);
    if (found !== undefined) {
        const x = found;
    }
}
console.timeEnd('Map.get');
