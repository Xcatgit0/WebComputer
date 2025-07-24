const kbMap = [
    { addr: 0x3F0, name: "InputBuffer" },
    { addr: 0x3F1, name: "Status" }
];
let Buffer = 0;
let ready = false;

function key(/** @type {string} */char,/** @type {boolean}*/raw) {
    if (!ready) {
        Buffer = (!raw) ? char.charCodeAt(0) : Number(char);
        ready = true;
    }
};
function read(addr) {
    if (addr == 0x3F0) {
        return Buffer;
    }
    return 0;
}
function write(addr, value) {
    if (addr === 0x3F1) {
        Buffer = 0;
        ready = false;
    }
}
function getBuffer() {
    return Buffer;
}
module.exports = { read, write, key, getBuffer };