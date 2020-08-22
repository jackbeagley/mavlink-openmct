import mavlinkMessagesJSON from './telemetry-messages.json'

export default function () {
    return function install(openmct) {
        openmct.objects.addRoot({
            namespace: 'mavlink_craft',
            key: 'craft_telemetry'
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