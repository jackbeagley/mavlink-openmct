import mavlinkMessagesDict from './telemetry-messages.json'

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
        }

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

        var provider = {
            supportsSubscribe: function (domainObject) {
                return domainObject.type === "mavlink.telemetry";
            },
            subscribe: function (domainObject, callback) {
                
            }
        }
    };
}