const WebSocket = require("ws");
const tty = require('./tui.js');
const kb = require("./keyboard.js");
const GpuMap = [
    { addr: 0x400, name: "x" },
    { addr: 0x401, name: "y" },
    { addr: 0x402, name: "width" },
    { addr: 0x403, name: "height" },
    { addr: 0x404, name: "rect" },
    { addr: 0x405, name: "dot" },
    { addr: 0x406, name: "r" },
    { addr: 0x407, name: "g" },
    { addr: 0x408, name: "b" },
    { addr: 0x409, name: "a" },
    { addr: 0x410, name: "push" },
    { addr: 0x411, name: "add" }
]
let clients = [];
var Server = new WebSocket.Server({ port: 8080 });
Server.on("connection", (socket) => {
    socket.on("message", (msg) => {
        let message = msg.toString("utf-8");
        //console.log(message);
        //tty.tty('print', JSON.stringify(message));
        if (message == "init") {
            clients.push(socket);
            setTimeout(() => {
                //let obj = {x: 0, y: 0, width: 1280, height: 720, rect: 1, dot: 0, r: 30, g: 30, b: 30, a: 255};
                //socket.send(JSON.stringify(obj));
            }, 1000);
        } else {
            let _msgs = message.split(' ');
            kb.key(_msgs[1], true);
            //tty.tty('print', JSON.stringify(_msgs));
        }
        clients.forEach((v) => {
            if (v.readyState == socket.CLOSED) {
                clients.filter(c => c !== socket);
            }
        });
    });
    socket.on("close", () => {
        //console.log("Client Disconnected");
    });
    socket.on("error", (error) => {
        console.log(error);
    });
});
let cmdBuffer = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rect: 0,
    dot: 0,
    r: 0,
    g: 0,
    b: 0,
    a: 0
}
let buffers = [];
let ppending = false;
function Add() {
    //clients.forEach((socket) => {
    //    socket.send(JSON.stringify(cmdBuffer));
    //});
    buffers.push({ ...cmdBuffer });
    cmdBuffer.rect = 0;
    cmdBuffer.dot = 0;
    cmdBuffer.r = 0;
    cmdBuffer.g = 0;
    cmdBuffer.b = 0;
    cmdBuffer.a = 0;
}
function Push() {
    clients.forEach((v) => {
        if (v.readyState == v.CLOSED) {
            clients.filter(c => c !== v);
        }
    });
    buffers.forEach((v, i) => {
        clients.forEach((socket) => {
            socket.send(JSON.stringify(v));
        });
    });
    buffers = [];
    ppending = false;
}
function Gpu(addr, value) {
    for (let cmd of GpuMap) {
        if (cmd.addr == addr) {
            if (cmd.name == "add") {
                setImmediate(Add);
            } else if (!(cmd.name == "push")) {
                cmdBuffer[cmd.name] = value;
            } else {
                if (cmd.name == "push") {
                    if (!ppending) {
                        ppending = true;
                        setImmediate(Push);
                    }
                }
            }
        }
    }
}
function stopServer() {
    console.log("Stopping a Server...");
    clients.forEach((socket) => {
        socket.close();
        console.log("Stopping Sockets State: " + socket.readyState);
    });
    Server.close();
}

module.exports = { Gpu, stopServer };