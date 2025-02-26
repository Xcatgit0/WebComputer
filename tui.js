const bless = require("blessed");

const screen = bless.screen({
    smartCSR: true,
    title: "VM Monitor"
});
const stat = bless.box({
    top: '0%',
    left: '0%',
    width: '50%',
    height: '50%',
    label: 'VM Stats',
    content: 'loading...',
    border: { type: 'line'},
    style: { border: {fg: 'white'}}
});
const register = bless.box({
    top: '0%',
    left: '50%',
    width: '50%',
    height: '50%',
    label: 'Registers',
    content: 'loading...',
    border: { type: 'line'},
    style: { border: {fg: 'white'}}
});
const VM = bless.box({
    top: '50%',
    left: '0%',
    width: '50%',
    height: '50%',
    label: 'VM',
    content: '',
    border: { type: 'line'},
    style: { border: {fg: 'white'}}
});
register.content = '';
function update(pc,flags,registers,memorys,labels,cmd,called) {
    register.content = '';
    stat.content = 'PC: '+pc+'\n'+'flags: { zf: '+flags.zf+' }\n'+'run: '+cmd+'\n';
    for (let i=0;i<registers.length;i++) {
        register.content += 'r'+i+': '+registers[i]+ ' ';
    }
    VM.content= '';
    VM.content += 'Labels: '+JSON.stringify(labels);
    VM.content += '\nCalled: '+JSON.stringify(called);
    screen.render();
}
screen.key(['escape','^[0A','^[0B'], function(ch,key) {
    return;
});
screen.append(stat);
screen.append(register);
screen.append(VM);
screen.render();
module.exports = { update };
