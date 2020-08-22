fs = require('fs')

const messageRegistry = require('./assets/message-registry.js')["messageRegistry"];

var telemetryDict = 
{
    name: "Craft",
    key: "craft",
    telemetryGroups: []
}

messageRegistry.forEach(message => 
    {
        let messageObj = message[1]();
        let group_name = messageObj._message_name
        let group_key = group_name.toLowerCase()

        //messageObj._message_fields.forEach(field => {console.log(field[0])})

        telemetryDict.telemetryGroups.push(
            {
                name: group_name,
                key: group_key,
                type: 'group',
                measurements: messageObj._message_fields.map(field => 
                    {
                        let messageName = field[0]
                        let messageKey = group_key + '_' + messageName.toLowerCase();
                        let messageFormat = (field[1] === 'float') ? 'float' : 'integer'

                        return {
                            name: messageName,
                            key: messageKey,
                            type: 'telemetry',
                            values: [
                                {
                                    key: 'value',
                                    name: messageName,
                                    format: messageFormat,
                                    hints: {range: 1}
                                },
                                {
                                    key: 'utc',
                                    source: 'timestamp',
                                    name: 'Timestamp',
                                    format: 'utc',
                                    hints: {domain: 1}
                                }
                            ]
                        }
                    })
            }
        )
    }
)

console.log(JSON.stringify(telemetryDict, null, ' '))

fs.writeFile('telemetry-messages.json', JSON.stringify(telemetryDict), (err) => {
    if (err !== null) {
    console.log(err)
    }
})