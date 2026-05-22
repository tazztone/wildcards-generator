const str = "This is a test __my_var__ and ~~another_var~~ and __normal__";
const regex1 = /(?:~~([^~]+)~~|__([^_]+)__)/g;
const regex2 = /(?:~~(.+?)~~|__(.+?)__)/g;

console.log("Original regex:");
[...str.matchAll(regex1)].forEach(match => console.log(match));

console.log("\nNew regex:");
[...str.matchAll(regex2)].forEach(match => console.log(match));
