import mavlinkMessagesDict from './telemetry-messages.json'

const socketProtocol = (window.location.protocol === 'https:' ? 'wss:' : 'ws:')
const echoSocketUrl = socketProtocol + '//' + window.location.hostname + ':8080/mavlink-ws'

var groupCompositionProvider = {
    appliesTo: function (domainObject) {
        return domainObject.identifier.namespace === 'mavlink.taxonomy' &&
            domainObject.type === 'folder' && domainObject.location !== "ROOT";
    },
    load: function (domainObject) {
        const identifierKeyComponents = domainObject.identifier.key.split('.');

        const identifierMessage = mavlinkMessagesDict.telemetryGroups.filter((group) => { return group.key === identifierKeyComponents[0] })[0];

        return Promise.resolve(identifierMessage.measurements.map((message) => {
            return {
                namespace: 'mavlink.taxonomy',
                key: message.key
            };
        }));
    }
};

var rootCompositionProvider = {
    appliesTo: function (domainObject) {
        return domainObject.identifier.namespace === 'mavlink.taxonomy' &&
            domainObject.type === 'folder' && domainObject.location === "ROOT";
    },
    load: function (domainObject) {
        return Promise.resolve(mavlinkMessagesDict.telemetryGroups.map((group) => {
            return {
                namespace: 'mavlink.taxonomy',
                key: group.key
            };
        }));
    }
};

var objectProvider = {
    get: function (identifier) {
        let object;

        // console.log(identifier.key)

        if (identifier.key === 'craft') {
            object = {
                identifier: identifier,
                name: mavlinkMessagesDict.name,
                type: 'folder',
                location: 'ROOT'
            };
        } else {
            const identifierKeyComponents = identifier.key.split('.');

            if (identifierKeyComponents.length == 1) {
                const identifierMessage = mavlinkMessagesDict.telemetryGroups.filter((group) => { return group.key === identifierKeyComponents[0] })[0];

                object = {
                    identifier: identifier,
                    name: identifierMessage.name,
                    type: 'folder',
                    location: 'mavlink.taxonomy:craft'
                };
            } else if (identifierKeyComponents[0] === "craft") {
                const identifierMessage = mavlinkMessagesDict.telemetryGroups.filter((group) => { return group.key === identifierKeyComponents[1] })[0];

                object = {
                    identifier: identifier,
                    name: identifierMessage.name,
                    type: 'folder',
                    location: 'mavlink.taxonomy:craft'
                };
            } else {
                const identifierMessage = mavlinkMessagesDict.telemetryGroups.filter((group) => { return group.key === identifierKeyComponents[0] })[0];
                // console.log(identifierKeyComponents);
                const identifierMessageField = identifierMessage.measurements.filter((message) => { return message.key === identifier.key })[0];

                object = {
                    identifier: identifier,
                    name: identifierMessageField.name,
                    type: 'mavlink.telemetry',
                    telemetry: {
                        values: identifierMessageField.values
                    },
                    location: 'mavlink.taxonomy:craft.' + identifierKeyComponents[0]
                };
            }
        }

        // console.log(object)

        return Promise.resolve(object)
    }
};

function install(openmct) {
	openmct.objects.addRoot({
		namespace: 'mavlink.taxonomy',
		key: 'craft'
	});

	openmct.objects.addProvider('mavlink.taxonomy', objectProvider);

	openmct.composition.addProvider(groupCompositionProvider);
	openmct.composition.addProvider(rootCompositionProvider);

	openmct.types.addType('mavlink.telemetry', {
		name: 'Mavlink Telemetry Point',
		description: 'Telemetry coming from a Mavlink source.',
		cssClass: 'icon-telemetry'
	});

	const socket = new WebSocket(echoSocketUrl)

	var subscriberCallbacks = {};
	var subscribeQueue = [];

	socket.onopen = () => {
		subscribeQueue.forEach((subscribeObject => {
			socket.send(subscribeObject);
		}))
	}

	socket.onmessage = function (event) {
		let telemetryMessage = JSON.parse(event.data);

		if (subscriberCallbacks[telemetryMessage.key]) {
			subscriberCallbacks[telemetryMessage.key](telemetryMessage)
		}
	}

	var provider = {
		supportsSubscribe: function (domainObject) {
			return domainObject.type === "mavlink.telemetry";
		},
		subscribe: function (domainObject, callback) {
			subscriberCallbacks[domainObject.identifier.key] = callback;

			let subscribeRequest = {
				action: 'subscribe',
				message: domainObject.identifier.key
			}

			let unsubscribeRequest = {
				action: 'unsubscribe',
				message: domainObject.identifier.key
			}

			let subscribeObject = JSON.stringify(subscribeRequest);

			if (socket.readyState === WebSocket.OPEN) {
				socket.send(subscribeObject);
			} else {
				subscribeQueue.push(subscribeObject);
			}

			return function unsubscribe() {
				socket.send(JSON.stringify(unsubscribeRequest));
			}
		}
	}

	openmct.telemetry.addProvider(provider);
};


export { install, mavlinkMessagesDict as messages };