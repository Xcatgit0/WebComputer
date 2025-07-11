// Disk.js

const fs = require("fs");
var Disk = "";
const DiskPath = "./Disk/disk1.dat";
function loadDisk() {
    Disk = fs.readFileSync(DiskPath);
}
function SaveDisk() {
    fs.writeFileSync(DiskPath, Disk);
}
function write(index, data) {
    Disk[index] = data;
}
function read(index) {
    return Disk[index];
}

module.exports = { loadDisk, SaveDisk, write, read };