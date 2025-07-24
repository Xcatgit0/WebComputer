class RamDevice {
    constructor(size) {
        this.data = new Uint8Array(size);
    }
    read(index) {
        return this.data[index];
    }
    write(index, value) {
        if (isNaN(index)) { return; }
        let finalValue = isNaN(value) ? 0 : value;
        this.data[index] = finalValue;
    }
}
module.exports = RamDevice;