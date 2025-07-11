// Computer.js

const fs = require("fs");
const Disk = require("./Disk");
const { Gpu, stopServer } = require("./Gpu");
const { validateSyntax } = require("./Syntax");
const { update, stop, OIPS } = require("./tui");

function validateInst(inst) {
    const words = inst.trim().split(/\s+/);
    if (words[1] && words[1].startsWith(";")) {
        words[1] = "";
        words[2] = "";
    } else if (words[2] && words[2].startsWith(";")) {
        words[2] = "";
    }
    return {
        opcode: words[0],
        src1: words[1],
        src2: words[2]
    };

}
function srcToReg(src) {
    if (!src) return;
    const reg = parseInt(src.slice(1));
    return reg;
}
const devs = [
    { name: "Ram", start: 0x00000000, end: 0x000003FF },
    { name: "Disk", start: 0x00000400, end: 0x00001400 },
    { name: "Gpu", start: 0x00001500, end: 0x000015FF }
]
function addrToDev(addr) {
    for (let device of devs) {
        if (addr >= device.start && addr <= device.end) {
            return device.name;
        }
    }
}
const code = fs.readFileSync('ncode', 'utf8');
const codes = code.split('\n');
var Memory = new Array(1024).fill(0);
var registers = new Array(16).fill(0);
var flags = { zf: 0, sf: 0 }
var pc = 0;
function reg(src1, src2) {
    const reg1 = registers[srcToReg(src1)];
    const reg2 = registers[srcToReg(src2)];
    return { reg1, reg2 };

}
function sreg(regs, src1, src2) {
    if (src1) {
        registers[src1] = regs.reg1;
    }

    if (src2) {
        registers[src2] = regs.reg2;
    }
}
function setFlags(number) {
    if (number == 0) {
        flags.zf = 1;
        flags.sf = 0;
    } else {
        flags.zf = 0;
        if (number < 0) {
            flags.sf = 1;
        }
    }
}
var regs = {};
console.log(registers);
var labels = [];
for (let i = 0; i < codes.length; i++) {
    const { type, string } = validateSyntax(codes[i]);
    console.log(string, type);
    if (type == "label") {
        labels.push({ string: string, pc: i });
    }
};
console.log(labels);
var called = [];
function jumpTolabel(name) {
    //console.log(name,labels);
    for (let label of labels) {
        if (label.string == name) {
            ////console.log(label);
            if (called.length != 0) {
                if (called[called.length - 1].name != name) { called.push({ name: name, pc: pc }) }
            } else if (called.length === 0) {
                called.push({ name: name, pc: pc });
            }
            pc = label.pc;
        }
    }
}
function jump(src) {
    //console.log(src);
    if (/^[A-Za-z]+$/.test(src)) {
        jumpTolabel(src);
    } else if (/^[0-9]+$/.test(src)) {
        pc = parseInt(src) - 1;
    }
}

let InsExecuted = 0;

function execute() {
    const { type, string } = validateSyntax(codes[pc]);
    let inst = {};
    if (type == "cmd") {
        inst = validateInst(codes[pc]);
    } else if (type == "label") {


        //  console.log("label",string,pc);
    } else {
        pc++;
        return;
    }
    if (!inst.opcode) {
        pc++
        return;
    }
    //Disk.loadDisk();
    const opcode = inst.opcode;
    const src1 = inst.src1;
    const src2 = inst.src2;
    regs = reg(src1, src2);
    update(pc, flags, registers, Memory, labels, string, called, codes);
    switch (opcode) {
        case 'add':
            regs.reg1 += regs.reg2;
            sreg(regs, srcToReg(inst.src1), srcToReg(inst.src2));
            setFlags(regs.reg1);
            break;

        case 'sub':
            regs.reg1 -= regs.reg2;
            sreg(regs, srcToReg(inst.src1), srcToReg(inst.src2));
            setFlags(regs.reg1);
            break;

        case 'cmp':
            regs.reg1 -= regs.reg2;
            setFlags(regs.reg1);
            break;

        case 'ldi':
            regs.reg1 = parseInt(inst.src2);
            sreg(regs, srcToReg(inst.src1));
            break;

        case 'adi':
            regs.reg1 += parseInt(inst.src2);
            sreg(regs, srcToReg(inst.src1));
            setFlags(regs.reg1);
            break;

        case 'sdi':
            regs.reg1 -= parseInt(inst.src2);
            sreg(regs, srcToReg(inst.src1));
            setFlags(regs.reg1);
            break;

        case 'mov':
            regs.reg2 = regs.reg1;
            //regs.reg1 = 0;
            sreg(regs, srcToReg(inst.src1), srcToReg(inst.src2));
            break;

        case 'in':
            const name1 = addrToDev(regs.reg1 || parseInt(inst.src1));
            if (name1 == "Ram") {
                const v = parseInt(inst.src1);
                regs.reg2 = Memory[v];
                sreg(regs, undefined, srcToReg(inst.src2));
            } else if (name1 == "Disk") {
                //Disk.loadDisk();
                let index = (regs.reg1 || parseInt(inst.src1)) - parseInt("0x00000400");
                regs.reg2 = Disk.read(index);
                sreg(regs, undefined, srcToReg(inst.src2));
            }
            break;

        case 'out':
            const name2 = addrToDev(parseInt(regs.reg1 || inst.src1));
            if (name2 == "Ram") {
                if (!inst.src1[0] == "r") {
                    const v = parseInt(inst.src1);
                    Memory[v] = regs.reg2 || parseInt(inst.src1);
                } else {
                    Memory[regs.reg1] = regs.reg2 || parseInt(inst.src1);
                }
                sreg(regs, undefined, srcToReg(inst.src2));
            } else if (name2 == "Disk") {
                let index = (regs.reg1 || parseInt(inst.src1)) - parseInt("0x00000400");
                Disk.write(index, regs.reg2);
                Disk.SaveDisk();
                Disk.LoadDisk()
            } else if (name2 == "Gpu") {
                if (inst.src2[0] == "r") {
                    Gpu(parseInt(inst.src1), regs.reg2);
                } else {
                    Gpu(parseInt(inst.src1), parseInt(inst.src2));
                }
            }
            break;

        case 'mul': // คำสั่งคูณ
            regs.reg1 *= regs.reg2;
            sreg(regs, srcToReg(inst.src1), srcToReg(inst.src2));
            setFlags(regs.reg1);
            break;

        case 'div': // คำสั่งหาร
            if (regs.reg2 === 0) {
                throw new Error("Division by zero!");
            }
            regs.reg1 = Math.floor(regs.reg1 / regs.reg2); // หารเอาค่าเต็ม
            sreg(regs, srcToReg(inst.src1), srcToReg(inst.src2));
            setFlags(regs.reg1);
            break;

        case 'jmp': // กระโดดไปยังตำแหน่งคำสั่ง
            jump(inst.src1);
            break;

        case 'je':
            if (flags.zf == 1) {
                jump(inst.src1);
            }
            break;

        case 'jez':
            if (regs.reg2 == 0) {
                jump(inst.src1);
            }
            break;

        case 'jgz':
            if (regs.reg2 > 0) {
                jump(inst.src1);
            }
            break;

        case 'jnz':
            if (regs.reg2 != 0) {
                jump(inst.src1);
            }
            break;
        case 'end':
            const tpc = called[called.length - 1].pc;
            called.pop();
            pc = tpc;
            break;
        case 'hlt':
            if (interval) {
                stop();
                clearInterval(interval);
                stopServer();
                process.exit(0);
            } else {
                stopServer();
                throw new Error("Error Cant Stop an Interval Id");
            }
            break;

        default:
            console.error("unsupport instruction: " + opcode);
            break;
    }
    pc++;
    update(pc, flags, registers, Memory, labels, string, called, codes);
    InsExecuted++;
}
console.log(codes);
var interval;
const loop = () => {
    interval = setInterval(() => { execute() }, 10);
}
Disk.loadDisk();
setTimeout(loop, 5000);
setInterval(() => { OIPS(InsExecuted); InsExecuted = 0; }, 1000);
