import mavlinkMessagesDict from './telemetry-messages.json'

var objectProvider = {
    get: function (identifier) {
        if (identifier.key === 'craft') {
            return Promise.resolve({
                identifier: identifier,
                name: mavlinkMessagesDict.name,
                type: 'folder',
                location: 'ROOT'
            })
        }
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