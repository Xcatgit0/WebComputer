// Computer.js

const fs = require("fs");
const Disk = require("./Disk");
const { Gpu, stopServer } = require("./Gpu");
const { validateSyntax } = require("./Syntax");
const { update, stop, OIPS, tty } = require("./tui");
const stat = require("./Stat.js");
const kb = require("./keyboard.js");
const { argv } = require("process");
const RamDevice = require('./Ram.js');
function validateInst(inst) {
    const words = inst.trim().split(/\s+/);
    const semicolonIndex = words.findIndex(word => word.startsWith(";"));
    const cleaned = semicolonIndex >= 0 ? words.slice(0, semicolonIndex) : words;

    const opcode = cleaned[0];
    /** @type {Array<number,any>} */
    const args = cleaned.slice(1);

    const result = { opcode, args };
    args.forEach((val, i) => {
        result[`src${i + 1}`] = val;
    });

    return result;
}

function srcToReg(src) {
    if (!src) return;
    const reg = parseInt(src.slice(1), 0);
    return reg;
}
const keyb = "keyboard";
const devs = [
    { name: "Ram", start: 0x00000000, end: 0x000003E8 },
    { name: keyb, start: 0x000003F0, end: 0x000003FF },
    { name: "Gpu", start: 0x00000400, end: 0x00001400 },
    { name: "Disk", start: 0x00001500, end: 0x000094FF },
    { name: "Ram2", start: 0x00009500, end: 0x0000B4A2 }
]
let Ram2 = new RamDevice(0x1FA0);
function addrToDev(addr) {
    for (let device of devs) {
        if (addr >= device.start && addr <= device.end) {
            return device.name;
        }
    }
}
let defines = {};
function replaceDefines(code) {
    return code.replace(/\b\w+\b/g, word => {
        return defines[word] !== undefined ? defines[word] : word;
    });
}
if (!(process, argv[2])) { throw new Error('No Input file') }
const code = fs.readFileSync(process.argv[2], 'utf8');
const main = code.split('\n');
var Memory = new Array(1024).fill(0);
var registers = new Array(64).fill(0);
var flags = { zf: 0, sf: 0 }
var pc = 0;
let codes = "";
var regs = {};
console.log(registers);
var labels = [];
var currentProgram = "main";
function loadLabels() {
    for (let i = 0; i < codes.length; i++) {
        const { type, string } = validateSyntax(codes[i]);
        //console.log(string, type);
        if (type == "label") {
            labels.push({ string: string, pc: i });
        }
    };
}
function jumpTolabel(name, call) {
    ////console.log(name,labels);
    for (let label of labels) {
        if (label.string == name) {
            ////console.log(label);
            if (call) {
                if (called.length != 0) {
                    if (called[called.length - 1].name != name) { called.push({ name: name, pc: pc, program: currentProgram }) }
                } else if (called.length === 0) {
                    called.push({ name: name, pc: pc, program: currentProgram });
                }
            }
            pc = label.pc;
        }
    }
}
let Programs = { main: { codes: main, labels: [] } }
console.log(labels);
var called = [];
function LoadProgram(name, code, labels) {
    if (code) {
        Programs[name].codes = code;
        Programs[name].labels = labels;
        return;
    }
    codes = Programs[name].codes;
    labels = Programs[name].labels;
    loadLabels();
    if (labels.length < 1) {
        labels = [];
        loadLabels();
        Programs[name].labels = labels;
    }
    pc = 0;
    console.log(JSON.stringify(labels, undefined, 2));
    jumpTolabel('start');
    return true;
}
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


function jump(src, call, goto) {
    ////console.log(src);
    if (/^[A-Za-z]+$/.test(src)) {
        jumpTolabel(src, call);
    } else if (/^[0-9]+$/.test(src) || (goto == true)) {
        pc = parseInt(src, 0) - 1;
    }
}
codes = Programs[currentProgram].codes;
let ProcessedCode = replaceDefines(codes.join('\n'));
let ProcessedCodes = ProcessedCode.split('\n');
let InsExecuted = 0;
tty('clear');
tty('print', "Starting WebComputer...");
function execute() {
    const { type, string } = validateSyntax(ProcessedCodes[pc]);
    //let inst = {};
    if (type == "cmd") {
        ////inst = validateInst(codes[pc]);
    } else if (type == "label") {
        update(pc, flags, registers, Memory, labels, string, called, ProcessedCodes, defines);
        pc++;
        return;
        ////  console.log("label",string,pc);
    } else {
        update(pc, flags, registers, Memory, labels, string, called, ProcessedCodes, defines);
        pc++;
        return;
    }
    const inst = validateInst(ProcessedCodes[pc]);
    if (inst.opcode == '') {
        pc++
        return;
    }

    //Disk.loadDisk();
    const opcode = inst.opcode;
    const src1 = inst.src1;
    const src2 = inst.src2;
    regs = reg(src1, src2);
    //update(pc, flags, registers, Memory, labels, string, called, codes);
    const timer = stat.startTimer(opcode + ' ' + inst.args.join(' '));
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

        case 'not':
            regs.reg2 = regs.reg1 > 0 ? 0 : 1;
            sreg(regs, undefined, srcToReg(inst.src2));
            break;

        case 'wise':
            regs.reg1 = regs.reg1 > 0 ? 0 : 1;
            sreg(regs, srcToReg(inst.src1));
            break;

        case 'cmp':
            const src2 = regs.reg2 > 0 ? regs.reg2 : parseInt(inst.src2);
            const output = regs.reg1 - src2;
            setFlags(output ?? 0);
            break;

        case 'ldi':
            regs.reg1 = parseInt(inst.src2, 0);
            sreg(regs, srcToReg(inst.src1));
            break;

        case 'adi':
            let s2 = isNaN(parseInt(inst.src2, 0)) ? regs.reg2 : parseInt(inst.src2, 0);
            regs.reg1 += s2;
            sreg(regs, srcToReg(inst.src1));
            setFlags(regs.reg1);
            break;

        case 'sdi':
            let s22 = isNaN(parseInt(inst.src2, 0)) ? regs.reg2 : parseInt(inst.src2, 0);
            regs.reg1 -= s22;
            sreg(regs, srcToReg(inst.src1));
            setFlags(regs.reg1);
            break;

        case 'mov':
            regs.reg2 = regs.reg1;
            //regs.reg1 = 0;
            sreg(regs, srcToReg(inst.src1), srcToReg(inst.src2));
            break;

        case 'in': {
            const addr = regs.reg1 ?? parseInt(inst.src1, 0);
            const name = addrToDev(addr);

            let value;
            switch (name) {
                case "Ram":
                    value = Memory[addr];
                    break;
                case "Disk":
                    value = Disk.read(addr - 0x1500);
                    break;
                case "keyboard":
                    value = kb.read(addr);
                    break;
                case 'Ram2':
                    value = Ram2.read(addr - 0x1FA0);
                    break;
            }

            if (value !== undefined) {
                regs.reg2 = value;
                sreg(regs, undefined, srcToReg(inst.src2));
            }
            break;
        }

        case 'out': {
            const addr = regs.reg1 ?? parseInt(inst.src1, 0);
            const name = addrToDev(addr);

            switch (name) {
                case "Ram": {
                    const val = regs.reg2 ?? parseInt(inst.src2, 0);
                    Memory[addr] = val;
                    break;
                }
                case 'Ram2': {
                    const val = regs.reg2 ?? parseInt(inst.src2, 0);
                    Ram2.write(addr - 0x1FA0, val);
                    break;
                }
                case "Disk": {
                    Disk.write(addr - 0x1500, regs.reg2);
                    break;
                }
                case "Gpu": {
                    const x = addr;
                    const y = inst.src2[0] === "r" ? regs.reg2 : parseInt(inst.src2, 0);
                    ////tty('print', `${x} ${y}`);
                    Gpu(x, y);
                    break;
                }
                case "keyboard": {
                    const val = inst.src2[0] === "r" ? regs.reg2 : parseInt(inst.src2, 0);
                    kb.write(addr, val);
                    break;
                }
            }
            break;
        }


        case 'tty':
            const mode = inst.src1;
            const value = isNaN(parseInt(inst.src2)) ? regs.reg2 : parseInt(inst.src2, 0);
            switch (mode) {
                case '0':
                    setImmediate(() => { tty('printASCII', value); });
                    break;
                case '1':
                    setImmediate(() => { tty('print', regs.reg2 ?? (inst.src2.replace(/^"|"$/g, '').replace(/~/g, ' '))); });
                    break;
                case '2':
                    tty('clear');
                    break;
                case '3':
                    let string = "";
                    inst.args.forEach((v, idx) => {
                        string += String.fromCharCode(v ?? 0x3F);
                    });
                    tty('print', string);
                    break;
            }
            break;

        case 'define':
            defines[inst.src1] = inst.src2;
            break;

        case 'Rdefine':
            ProcessedCode = replaceDefines(codes.join('\n'));
            ProcessedCodes = ProcessedCode.split('\n');
            break;

        case 'mul': // คำสั่งคูณ
            let ss2 = isNaN(parseInt(inst.src2, 0)) ? regs.reg2 : parseInt(inst.src2, 0)
            regs.reg1 *= ss2;
            sreg(regs, srcToReg(inst.src1), srcToReg(inst.src2));
            setFlags(regs.reg1);
            break;

        case 'div': // คำสั่งหาร
            if (regs.reg2 === 0) {
                //throw new Error("Division by zero!");
            }
            regs.reg1 = Math.floor(regs.reg1 / regs.reg2); // หารเอาค่าเต็ม
            sreg(regs, srcToReg(inst.src1), srcToReg(inst.src2));
            setFlags(regs.reg1);
            break;

        case 'jmp': // กระโดดไปยังตำแหน่งคำสั่ง
            jump(inst.src1);
            break;

        case 'call':
            jump(inst.src1, true);
            break;

        case 'goto':
            jump(inst.src1, undefined, true);
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
            const call = called[called.length - 1];
            called.pop();
            if (call) { } else { throw new Error('No Call before end : ' + JSON.stringify(called, undefined, 4)) };
            if (call.program != currentProgram) {
                let result = LoadProgram(call.program);
                if (result != true) throw new Error('Failed to load program: ' + JSON.stringify(call, undefined, 4));
            }
            pc = call.pc;
            break;
        case 'hlt':
            if (interval) {
                stop();
                clearInterval(interval);
                stopServer();
                timer();
                Disk.SaveDisk();
                stat.printStats();
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
    timer();
    pc++;
    update(pc, flags, registers, Memory, labels, string, called, ProcessedCodes, defines);

    InsExecuted++;
}
LoadProgram('main', false);
console.log(codes);

var interval;
const loop = () => {
    tty('clear');
    interval = setInterval(() => { execute() }, process.argv[3] ?? 0.4);
}
Disk.loadDisk();
setTimeout(loop, 5000);
setInterval(() => { OIPS(InsExecuted); InsExecuted = 0; }, 1000);
