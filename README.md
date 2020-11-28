# Mavlink - Openmct
This package is a plugin for [OpenMCT](https://nasa.github.io/openmct/) to allow for Mavlink telemetry to be viewed in multiple instances in browser using NASA's OpenMCT mission control dashboard.

mavlink-openmct was originally developed to assist with real time debugging and visualisation of data for the [Green Envy](https://greenenvyracing.com/) project. This project, run by Bill Dube and Eva Håkansson seeks to take the overall land speed record for motorcycles (currently at 605km/h) using a 100% electric motorcycle!

## Installation
Before you install the package you will need to place the mavlink schema xml somewhere in your project (this will be used by the package to generate a .json that can be read more easily by the mavlink-openmct plugin.)

Once the xml has been placed in the project you can run the command:

`npm i mavlink-openmct --save`

You will be prompted to input the name of your xml file (including the extension). After you have done this, the plugin should be installed.

Once this is done it can be added to OpenMCT.

In your `app.js` file add the following line:

`const mavlinkServer = require('mavlink-openmct/server/mavlink-server.js');`

Immediately before the HTTP server is opened (the line beginning with `app.listen(options...` add the line:

`mavlinkServer.install(app);`

At this point it has been added to the server but not the browser. To add it to the browser we need to add `mavlink-openmct` to the `webpack.config.js` as well as `index.html`.

In the webpack config, navigate to the section describing the entry points (including `openmct: './openmct.js',` and add `mavlinkTelemetry: './node_modules/mavlink-openmct/mavlink-telemetry.js',`.

The telemetry script can then be added into `index.html`:

`<script src="dist/mavlinkTelemetry.js"></script>`

Finally it can then be installed into the browser side with:

`openmct.install(mavlinkTelemetry.default());`
