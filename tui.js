const bless = require("blessed");
const kb = require("./keyboard.js");
const screen = bless.screen({
    smartCSR: true,
    title: "VM Monitor",
    mouse: false
});
const stat = bless.box({
    top: '0%',
    left: '0%',
    width: '40%',
    height: '50%',
    label: 'VM Stats',
    content: 'loading...',
    border: { type: 'line' },
    style: { border: { fg: 'white' } },
    scrollbar: {
        ch: '#',
        track: {
            bg: 'gray'
        },
        style: {
            bg: 'yellow'
        }
    },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    mouse: true
});
const register = bless.box({
    top: '0%',
    left: '40%',
    width: '60%',
    height: '50%',
    label: 'Registers',
    content: 'loading...',
    border: { type: 'line' },
    style: { border: { fg: 'white' } },
    scrollbar: {
        ch: '#',
        track: {
            bg: 'gray'
        },
        style: {
            bg: 'yellow'
        }
    },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    mouse: true
});
const VM = bless.box({
    top: '50%',
    left: '0%',
    width: '60%',
    height: '50%',
    label: 'VM',
    content: '',
    border: { type: 'line' },
    style: { border: { fg: 'white' } },
    scrollbar: {
        ch: '#',
        track: {
            bg: 'gray'
        },
        style: {
            bg: 'yellow'
        }
    },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    mouse: true
});
register.content = '';
let IPS = 0;
let pc = 0;
let flags = {};
let registers = [];
let memorys = [];
let labels = {};
let cmd = "";
let called = {};
let defines = {};
let codes = "";
function update(_pc, _flags, _registers, _memorys, _labels, _cmd, _called, _codes, _defines) {
    pc = _pc; flags = _flags; registers = _registers; memorys = _memorys; labels = _labels; cmd = _cmd; called = _called; codes = _codes; defines = _defines;
    setImmediate(updatescreen);
}
function formatReg(register, perLine = 6) {
    let output = '';
    for (let i = 0; i < register.length; i++) {
        output += `r${i}: ${register[i]}`.padEnd(10);  // เว้นช่องให้เรียงสวย
        if ((i + 1) % perLine === 0) output += '\n';
    }
    return output.trim(); // ลบบรรทัดสุดท้ายถ้าไม่มี \n
}
function updatescreen() {
    register.content = '';
    stat.content = 'PC: ' + pc + '\n' + 'flags: { zf: ' + flags.zf + ' }\n' + 'run: ' + codes[pc] + '\n' + 'IPS: ' + IPS + "\n";
    stat.content += "\n Keyboard: " + JSON.stringify(kb.getBuffer());
    stat.content += "\n Defines: " + JSON.stringify(defines, undefined, 4);
    register.content = formatReg(registers, 4);
    VM.content = '';
    VM.content += '  ' + codes[pc - 2] + '\n';
    VM.content += '--' + codes[pc - 1] + '\n';
    VM.content += '>>' + codes[pc] + '\n';
    VM.content += '--' + codes[pc + 1] + '\n';
    VM.content += '  ' + codes[pc + 2] + '\n';
    VM.content += 'Labels: ' + JSON.stringify(labels, undefined, 2);
    VM.content += '\nStack: ' + JSON.stringify(called);
    screen.render();
}
const TTY = bless.box({
    top: '50%',
    left: '60%',
    width: '40%',
    height: '50%',
    label: 'Terminal',
    content: '',
    border: { type: 'line' },
    style: { border: { fg: 'white' } },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    mouse: true,
    content: "Loading...",
    scrollbar: {
        ch: '#',
        track: {
            bg: 'gray'
        },
        style: {
            bg: 'yellow'
        }
    }
});
////TTY.setScrollPerc(100);
/**
 * 
 * @param {'print'|'clear'|'printASCII'} op 
 * @param {*} v 
 */
function tty(op, v) {
    switch (op) {
        case 'print':
            //TTY.content += v + '\n';
            TTY.content += (v + '\n');
            TTY.setScrollPerc(100);
            break;

        case 'printASCII':
            //TTY.content += String.fromCharCode(v);
            TTY.content += (String.fromCharCode(v));
            TTY.setScrollPerc(100);
            break;

        case 'clear':
            TTY.content = '';
            break;
    }
    screen.render();
}
screen.append(stat);
screen.append(register);
screen.append(VM);
screen.append(TTY);
screen.render();
function stop() {
    screen.destroy();
}
function OIPS(n) {
    IPS = n
}
screen.on('keypress', (ch, key) => {
    if (ch) {
        kb.key(ch);
    }
});
screen.key(['C-c', 'q'], () => { process.exit(0) });
module.exports = { update, stop, OIPS, tty };
