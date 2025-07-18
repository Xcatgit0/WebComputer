const bless = require("blessed");

const screen = bless.screen({
    smartCSR: true,
    title: "VM Monitor",
    mouse: false
});
const stat = bless.box({
    top: '0%',
    left: '0%',
    width: '50%',
    height: '50%',
    label: 'VM Stats',
    content: 'loading...',
    border: { type: 'line' },
    style: { border: { fg: 'white' } }
});
const register = bless.box({
    top: '0%',
    left: '50%',
    width: '50%',
    height: '50%',
    label: 'Registers',
    content: 'loading...',
    border: { type: 'line' },
    style: { border: { fg: 'white' } }
});
const VM = bless.box({
    top: '50%',
    left: '0%',
    width: '50%',
    height: '50%',
    label: 'VM',
    content: '',
    border: { type: 'line' },
    style: { border: { fg: 'white' } }
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
let codes = "";
function update(_pc, _flags, _registers, _memorys, _labels, _cmd, _called, _codes) {
    pc = _pc; flags = _flags; registers = _registers; memorys = _memorys; labels = _labels; cmd = _cmd; called = _called; codes = _codes;
    setImmediate(updatescreen);
}
function updatescreen() {
    register.content = '';
    stat.content = 'PC: ' + pc + '\n' + 'flags: { zf: ' + flags.zf + ' }\n' + 'run: ' + codes[pc] + '\n' + 'IPS: ' + IPS + "\n";
    for (let i = 0; i < registers.length; i++) {
        register.content += 'r' + i + ': ' + registers[i] + ' ';
    }
    VM.content = '';
    VM.content += 'Labels: ' + JSON.stringify(labels);
    VM.content += '\nStack: ' + JSON.stringify(called);
    VM.content += "\nCode: \n";
    VM.content += '  ' + codes[pc - 2] + '\n';
    VM.content += '  ' + codes[pc - 1] + '\n';
    VM.content += '>>' + codes[pc] + '\n';
    VM.content += '  ' + codes[pc + 1] + '\n';
    VM.content += '  ' + codes[pc + 2] + '\n';
    screen.render();
}
screen.append(stat);
screen.append(register);
screen.append(VM);
screen.render();
function stop() {
    screen.destroy();
}
function OIPS(n) {
    IPS = n
}
module.exports = { update, stop, OIPS };
