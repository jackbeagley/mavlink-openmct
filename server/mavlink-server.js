var expressWS = require('express-ws');

var SerialPort = require('serialport');  
var messageRegistry = require('../assets/message-registry');  
var mavlink = require('node-mavlink');

function install(app) {
    // console.log(messageRegistry);
    var mavlinkParser = new mavlink.MAVLinkModule(messageRegistry.messageRegistry);

    /**
     * Setup serial port
     */
    var serialPort = new SerialPort('COM6', {  
        baudRate: 115200  
    });  
    
    expressWS(app);

    // mavlinkWSS = wsInstance.getWss('/mavlink-ws/');

    let mavlinkDataClients = [];

    console.log('Setting up MAVLINK websocket server')

    serialPort.on('data', function (data) {  
        mavlinkParser.parse(data);  
    });  

    mavlinkParser.on('error', function (e) {  
        console.log(e);  
    }); 

    mavlinkParser.on('message', function (message) {  
        // event listener for all messages  
    //   console.log(message);  
    });  

    /**
     * Setup the Websocket subscription service
     */
    app.ws('/mavlink-ws', function (ws, req) {

        mavlinkDataClients.push(ws);

        console.log(ws);        

        ws.on('message', function (msg) {
            let clientIndex = mavlinkDataClients.indexOf(ws);

            console.log(msg)

            console.log('Received ' + JSON.stringify(msg) + ' from CLIENT ' + clientIndex);            

            ws.send(msg);
        });
    });
};

module.exports = {install};