// Computer.js

const fs = require("fs");
const Disk = require("./Disk");
const { Gpu } = require("./Gpu");


function validateInst(inst) {
    const pattern = /^(\w+)\s+(\w+)\s+(\w+)$/;
    // ตรวจสอบข้อความ
    const match = inst.match(pattern);

    if (match) {
        // หากข้อความตรงกับรูปแบบ ดึงข้อมูล <opcode>, <src1>, <src2>
        const opcode = match[1];
        const src1 = match[2];
        const src2 = match[3];

        return {
            opcode: opcode,
            src1: src1,
            src2: src2
        };
    } else {
        console.error("Invalid Syntax: "+ inst);
    }
}
function srcToReg(src) {
    const reg = parseInt(src.slice(1));
    return reg;
}
const devs = [
    { name: "Ram", start: 0x00000000, end: 0x000003FF },
    { name: "Disk", start: 0x00000400, end: 0x00001400 },
    { name: "Gpu", start: 0x00001500, end: 0x000015FF }
]
function addrToDev(addr) {
    for (let device of devs ) {
        if ( addr >= device.start && addr <= device.end ) {
            return device.name;
        }
    }
}
const code = fs.readFileSync('code.txt','utf8');
const codes = code.split('\n');
var Memory = new Array(1024).fill(0);
var registers = new Array(16).fill(0);
var flags = { zf: 0, sf: 0 }
var pc = 0;
function reg(src1,src2) {
    const reg1 = registers[srcToReg(src1)];
    const reg2 = registers[srcToReg(src2)];
    return {reg1, reg2};
    
}
function sreg( regs , src1 , src2 ) {
    if ( src1 ) {
        registers[src1] = regs.reg1;
    }

    if ( src2 ) {
    registers[src2] = regs.reg2;
    }
}
function setFlags ( number ) {
     if ( number == 0 ) {
            flags.zf = 1;
            flags.sf = 0;
        } else {
            flags.zf = 0;
            if ( number < 0 ) {
                flags.sf = 1;
            }
    }
}
var regs = {};
console.log(registers);
function execute() {
const inst = validateInst(codes[pc]);
if (inst==null) {
    throw new Error("Program Ended.");
}
Disk.loadDisk();
console.log (codes[pc]);
const opcode = inst.opcode;
const src1 = inst.src1;
const src2 = inst.src2;
regs = reg(src1,src2);
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
        sreg(regs,srcToReg(inst.src1), srcToReg(inst.src2));
        break;

    case 'in':
        const name1 = addrToDev(parseInt(inst.src1, 16));
        if ( name1=="Ram") {
            const v = parseInt(inst.src1, 16);
            regs.reg2 = Memory[v];
            sreg(regs, undefined, srcToReg(inst.src2));
        } else if ( name1 == "Disk") {
            let index = parseInt(inst.src1,16) - parseInt("0x00000400",16);
            regs.reg2 = Disk.read(index);
            sreg(regs, undefined, srcToReg(inst.src2));
        }
        break;

    case 'out':
        const name2 = addrToDev(parseInt(inst.src1, 16));
        if ( name2=="Ram") {
            const v = parseInt(inst.src1, 16);
            Memory[v] = regs.reg2;
            sreg(regs, undefined, srcToReg(inst.src2));
        } else if ( name2 == "Disk") {
            let index = parseInt(inst.src1,16) - parseInt("0x00000400",16);
            Disk.write(index,regs.reg2);
            Disk.SaveDisk();
        } else if ( name2 == "Gpu" ) {
            if (inst.src2[0] == "r") {
                Gpu(parseInt(inst.src1, 16), regs.reg2);
            } else {
                Gpu(parseInt(inst.src1, 16), parseInt(inst.src2));
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
        pc =  parseInt(inst.src1) - 1; // ส่งตำแหน่ง (index) ที่ต้องการกระโดดไป
        break;

    case 'je':
        if ( flags.zf == 1 ) {
            pc = parseInt(inst.src1) - 1;
        }
        break;

    case 'jez':
        if ( regs.reg2 == 0 ) {
            pc = parseInt(inst.src1) -1;
        }
        break;

    case 'jgz':
        if ( regs.reg2 > 0 ) {
            pc = parseInt(inst.src1) - 1;
        }
        break;

    case 'jnz':
        if ( regs.reg2 != 0 ) {
            pc = parseInt(inst.src1) - 1;
        }
        break;
    case 'hlt':
        if ( interval ) {
            clearInterval(interval);
        } else {
            throw new Error("Error Cant Stop an Interval Id");
        }
        break;

    default:
        console.error("unsupport instruction: " + opcode);
        break;
}
pc++;
console.log(registers);
}
console.log(codes);
var interval = setInterval(execute,125);
