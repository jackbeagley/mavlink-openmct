export default function () {
    return function install(openmct) {
        var provider = {
            supportsSubscribe: function (domainObject) {
                return domainObject.type === "mavlink.telemetry";
            },
            subscribe: function (domainObject, callback) {
                
            }
        }
    };
}