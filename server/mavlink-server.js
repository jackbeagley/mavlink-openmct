var path = require('path');
var expressWS = require('express-ws');

var SerialPort = require('serialport');
var dgram = require('dgram');
var messageRegistry = require(path.resolve(__dirname, '../assets/message-registry'));
var mavlink = require('node-mavlink');

function install(app, config = {
    source: {
        type: 'udp',
        address: '0.0.0.0',
        port: 8765
    }
}) {
    // console.log(messageRegistry);
    var mavlinkParser = new mavlink.MAVLinkModule(messageRegistry.messageRegistry);


    if (config.type === "serial") {
        /**
         * Setup serial port
         */
        var serialPort = new SerialPort(config.port, {
            baudRate: config.baud
        });

        serialPort.on('data', function (data) {
            mavlinkParser.parse(data);
        });
    } else if (config.type === "udp") {
        /**
         * Set the UDP socket
         */
        const udpServer = dgram.createSocket('udp4');

        udpServer.on('message', (msg, rinfo) => {
            mavlinkParser.parse(msg);
        })

        udpServer.on('listening', () => {
            const address = udpServer.address();

            console.log('UDP server listening ${address.address}:${address.port}');
        })

        udpServer.bind(config.port);
    }

    expressWS(app);

    // mavlinkWSS = wsInstance.getWss('/mavlink-ws/');

    let mavlinkDataClients = [];
    let mavlinkSubscriptions = [];

    console.log('Setting up MAVLINK websocket server')

    mavlinkParser.on('error', function (e) {
        console.log(e);
    });

    mavlinkParser.on('message', function (message) {
        // event listener for all messages  
        let utcTime = new Date().getTime()

        mavlinkSubscriptions.forEach(
            (clientSubscriptions, clientIndex) => {
                if (mavlinkDataClients[clientIndex].readyState === 1) {

                    clientSubscriptions.forEach((subscribedMessage) => {

                        let messageNameComponents = subscribedMessage.split('.');

                        if (messageNameComponents[0].toUpperCase() === message._message_name) {

                            let messageJSON = {
                                'timestamp': utcTime,
                                'value': message[messageNameComponents[1].toUpperCase()],
                                'key': subscribedMessage
                            }

                            mavlinkDataClients[clientIndex].send(JSON.stringify(messageJSON))
                        }
                    })
                }
            }
        )
    });

    /**
     * Setup the Websocket subscription service
     */
    app.ws('/mavlink-ws', function (ws, req) {

        mavlinkDataClients.push(ws);
        mavlinkSubscriptions.push([])

        console.log(ws);

        ws.on('message', function (msg) {
            let clientIndex = mavlinkDataClients.indexOf(ws);

            console.log('Received ' + msg + ' from CLIENT ' + clientIndex);

            let wsMessageJSON = JSON.parse(msg)

            let messageName = wsMessageJSON.message
            let messageAction = wsMessageJSON.action

            if (messageAction === "subscribe") {
                // console.log('CLIENT ' + clientIndex + ' subscribing to ' + messageAction)

                if (mavlinkSubscriptions[clientIndex].indexOf(messageName) === -1) {
                    mavlinkSubscriptions[clientIndex].push(messageName);

                    console.log(mavlinkSubscriptions)
                }
            } else if (messageAction === "unsubscribe") {
                let messageSubscriptionIndex = mavlinkSubscriptions[clientIndex].indexOf(messageName);

                if (messageSubscriptionIndex !== -1) {
                    mavlinkSubscriptions[clientIndex].splice(messageSubscriptionIndex, 1);

                    console.log(mavlinkSubscriptions)
                }
            }

            ws.send(msg);
        });
    });
};

module.exports = { install };
