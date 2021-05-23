/**
 * This script provides OpenMCT with the Mavlink message hierachy as well as the functions to subscribe and
 * receive messages from the Websocket server.
 * Given a Mavlink schema with two messages MESSAGE1 and MESSAGE2 the object tree will be populated as:
 *
 *            ROOT
 *            ├--MESSAGE1
 *            |  ├--FIELD1
 *            |  └─-FIELD2
 *            └--MESSAGE2
 *               ├--FIELD1
 *               └─-FIELD2
 *
 * There is a composition provider for both the messages and the fields
 */

// Read in the Mavlink dictionary
import mavlinkMessagesDict from './telemetry-messages.json'

// Socket protocol depends on whether the webpage is loaded as HTTP or HTTPS
const socketProtocol = (window.location.protocol === 'https:' ? 'wss:' : 'ws:')
const echoSocketUrl = socketProtocol + '//' + window.location.hostname + ':8080/mavlink-ws'

// Provide the messages that are within the root object
var messageCompositionProvider = {
    appliesTo: function (domainObject) {
        return (
          domainObject.identifier.namespace === "mavlink.taxonomy" &&
          domainObject.type === "folder" &&
          domainObject.location === "ROOT"
        );
      },
      load: function (domainObject) {
        return Promise.resolve(
          mavlinkMessagesDict.telemetryGroups.map((group) => {
            return {
              namespace: "mavlink.taxonomy",
              key: group.key,
            };
          })
        );
      },
    };

// Provide the fields within each message
var fieldCompositionProvider = {
    // Check whether a particular OpenMCT domain object is a Mavlink telemetry object
    appliesTo: function (domainObject) {
      return (
        domainObject.identifier.namespace === "mavlink.taxonomy" &&
        domainObject.type === "folder" &&
        domainObject.location !== "ROOT"
      );
    },
    // Get an array of domain object identifiers from a domain object (ie, the sub-objects)
    load: function (domainObject) {
      const identifierKeyComponents = domainObject.identifier.key.split(".");
  
      // Get the mavlink message dictionary entry with the metadata about the
      // mavlink message in question
      const identifierMessage = mavlinkMessagesDict.telemetryGroups.filter(
        (group) => {
          return group.key === identifierKeyComponents[0];
        }
      )[0];
  
      // OpenMCT is expecting a Promise so the output map is wrapped in a Promise.resolve()
      return Promise.resolve(
        // Return an array of objects with the field keys
        identifierMessage.measurements.map((field) => {
          return {
            namespace: "mavlink.taxonomy",
            key: field.key,
          };
        })
      );
    },
  };
  
  var objectProvider = {
    get: function (identifier) {
      let object;
  
      if (identifier.key === "craft") {
        object = {
          identifier: identifier,
          name: mavlinkMessagesDict.name,
          type: "folder",
          location: "ROOT",
        };
      } else {
        const identifierKeyComponents = identifier.key.split(".");
  
        if (identifierKeyComponents.length == 1) {
          const identifierMessage = mavlinkMessagesDict.telemetryGroups.filter(
            (group) => {
              return group.key === identifierKeyComponents[0];
            }
          )[0];
  
          object = {
            identifier: identifier,
            name: identifierMessage.name,
            type: "folder",
            location: "mavlink.taxonomy:craft",
          };
        } else if (identifierKeyComponents[0] === "craft") {
          const identifierMessage = mavlinkMessagesDict.telemetryGroups.filter(
            (group) => {
              return group.key === identifierKeyComponents[1];
            }
          )[0];
  
          object = {
            identifier: identifier,
            name: identifierMessage.name,
            type: "folder",
            location: "mavlink.taxonomy:craft",
          };
        } else {
          const identifierMessage = mavlinkMessagesDict.telemetryGroups.filter(
            (group) => {
              return group.key === identifierKeyComponents[0];
            }
          )[0];
  
          const identifierMessageField = identifierMessage.measurements.filter(
            (message) => {
              return message.key === identifier.key;
            }
          )[0];
  
          object = {
            identifier: identifier,
            name: identifierMessageField.name,
            type: "mavlink.telemetry",
            telemetry: {
              values: identifierMessageField.values,
            },
            location: "mavlink.taxonomy:craft." + identifierKeyComponents[0],
          };
        }
      }
  
      return Promise.resolve(object);
    },
  };
  
  function install(openmct) {
    openmct.objects.addRoot({
      namespace: "mavlink.taxonomy",
      key: "craft",
    });
  
    openmct.objects.addProvider("mavlink.taxonomy", objectProvider);
  
    openmct.composition.addProvider(messageCompositionProvider);
    openmct.composition.addProvider(fieldCompositionProvider);
  
    openmct.types.addType("mavlink.telemetry", {
      name: "Mavlink Telemetry Point",
      description: "Telemetry coming from a Mavlink source.",
      cssClass: "icon-telemetry",
    });
  
    const socket = new WebSocket(echoSocketUrl);
  
    var subscriberCallbacks = {};
    var subscribeQueue = [];
  
    socket.onopen = () => {
      subscribeQueue.forEach((subscribeObject) => {
        socket.send(subscribeObject);
      });
    };
  
    socket.onmessage = function (event) {
      let telemetryMessage = JSON.parse(event.data);
  
      if (subscriberCallbacks[telemetryMessage.key]) {
        subscriberCallbacks[telemetryMessage.key](telemetryMessage);
      }
    };
  
    var provider = {
      supportsSubscribe: function (domainObject) {
        return domainObject.type === "mavlink.telemetry";
      },
      subscribe: function (domainObject, callback) {
        subscriberCallbacks[domainObject.identifier.key] = callback;
  
        let subscribeRequest = {
          action: "subscribe",
          message: domainObject.identifier.key,
        };
  
        let unsubscribeRequest = {
          action: "unsubscribe",
          message: domainObject.identifier.key,
        };
  
        let subscribeObject = JSON.stringify(subscribeRequest);
  
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(subscribeObject);
        } else {
          subscribeQueue.push(subscribeObject);
        }
  
        return function unsubscribe() {
          socket.send(JSON.stringify(unsubscribeRequest));
        };
      },
    };
  
    openmct.telemetry.addProvider(provider);
  }
  
  export { install, mavlinkMessagesDict as messages };
  