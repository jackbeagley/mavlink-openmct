import mavlinkMessagesDict from './telemetry-messages.json'

var groupCompositionProvider = {
    appliesTo: function (domainObject) {
        return domainObject.identifier.namespace === 'mavlink.taxonomy' &&
            domainObject.type === 'folder' && domainObject.location !== "ROOT";
    },
    load: function (domainObject) {
        const identifierKeyComponents = domainObject.identifier.key.split('.');

        const identifierMessage = mavlinkMessagesDict.telemetryGroups.filter((group) => {return group.key === identifierKeyComponents[0]})[0];

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

        if (identifier.key === 'craft') {
            object = {
                identifier: identifier,
                name: mavlinkMessagesDict.name,
                type: 'folder',
                location: 'ROOT'
            };
        } else {
            const identifierKeyComponents = identifier.key.split('.');

            const identifierMessage = mavlinkMessagesDict.telemetryGroups.filter((group) => {return group.key === identifierKeyComponents[0]})[0];

            if (identifierKeyComponents.length == 1) {
                object = {
                    identifier: identifier,
                    name: identifierMessage.name,
                    type: 'folder',
                    location: 'mavlink.taxonomy:craft'
                };
            } else {
                const identifierMessageField = identifierMessage.measurements.filter((message) => {return message.key === identifier.key})[0];

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

        console.log(object)

        return Promise.resolve(object)
    }
};

export default function () {
    return function install(openmct) {
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

        var provider = {
            supportsSubscribe: function (domainObject) {
                return domainObject.type === "mavlink.telemetry";
            },
            subscribe: function (domainObject, callback) {

            }
        }
    };
}