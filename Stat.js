// stat.js
const stat = {};

function startTimer(opcode) {
    const start = performance.now();
    return () => {
        const delta = performance.now() - start;
        if (!stat[opcode]) {
            stat[opcode] = { count: 0, total: 0, max: 0 };
        }
        stat[opcode].count++;
        stat[opcode].total += delta;
        if (delta > stat[opcode].max) stat[opcode].max = delta;
    };
}

function printStats() {
    console.log("=== Instruction Timing ===");
    let timeAll = 0;
    for (const [opcode, data] of Object.entries(stat)) {
        const avg = data.total / data.count;
        console.log(`${opcode.padEnd(27)} | avg: ${avg.toFixed(7)} ms | max: ${data.max.toFixed(7)} ms | count: ${data.count}`);
        if (opcode !== "hlt") timeAll += data.max;
    }
    console.log('All Time: ' + timeAll);
    console.log("==========================");
}

function resetStats() {
    for (const key in stat) delete stat[key];
}

module.exports = {
    startTimer,
    printStats,
    resetStats
};
