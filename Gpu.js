const WebSocket = require("ws");

const GpuMap = [
    { addr: 0x1500, name: "x" },
    { addr: 0x1501, name: "y" },
    { addr: 0x1502, name: "width" },
    { addr: 0x1503, name: "height" },
    { addr: 0x1504, name: "rect" },
    { addr: 0x1505, name: "dot" },
    { addr: 0x1506, name: "r" },
    { addr: 0x1507, name: "g" },
    { addr: 0x1508, name: "b" },
    { addr: 0x1509, name: "a" },
    { addr: 0x1510, name: "push" }
]
let clients = [];
var Server = new WebSocket.Server({ port: 8080 });
Server.on("connection", (socket) => {
    console.log("Client Connected");
    socket.on("message",(msg) => {
        let message = msg.toString("utf-8");
        console.log(message);
        if (message=="init") {
            clients.push(socket);
            setTimeout(() => {
            let obj = {x: 0, y: 0, width: 1280, height: 720, rect: 1, dot: 0, r: 255,g: 255, b: 255, a: 255};
            socket.send(JSON.stringify(obj));
            },1000);
        }
        console.log(clients.length);
    });
    socket.on("close",() => {
        console.log("Client Disconnected");
    });
    socket.on("error",(error) => {
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
function Gpu(addr,value) {
    for (let cmd of GpuMap) {
        if ( cmd.addr == addr ) {
            if (!(cmd.name=="push")) {
                cmdBuffer[cmd.name] = value;
            } else {
                if (cmd.name=="push") {
                    clients.forEach((socket) => {
                        socket.send(JSON.stringify(cmdBuffer));
                    });
                    cmdBuffer.rect = 0;
                    cmdBuffer.dot = 0;
                    cmdBuffer.r = 0;
                    cmdBuffer.g = 0;
                    cmdBuffer.b = 0;
                    cmdBuffer.a = 0;
                }
            }
        }
    }
}

module.exports = { Gpu };