const fs = require('fs');
const { execSync } = require("child_process");
const prompt = require('prompt-sync')({sigint: true});

let pythonPath = __dirname + '/pymavlink';

process.env.PYTHONPATH = pythonPath

let options = {
    stdio: [null, process.stdout, process.stderr],
    env: process.env
};

let mavlinkXML = prompt('Please enter the xml you wish to use for MAVLink: ')

while (!fs.existsSync(mavlinkXML)) {
    mavlinkXML =prompt('Sorry, the file entered couldn\'t be found, please try again: ')
}


if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
}

execSync("echo %%PYTHONPATH%%", options);

//console.log(output)

execSync("py -m pymavlink.tools.mavgen -o ./assets --lang TypeScript --wire-protocol 2.0 " + mavlinkXML, options)

execSync("npx tsc -p assets")

execSync("node json-generator.js")

//let output = exec("set PYTHONPATH=%cd%\pymavlink && echo PYTHONPATH for pymavlink set to: %PYTHONPATH% && mkdir assets & py -m pymavlink.tools.mavgen -o ./assets --lang TypeScript --wire-protocol 2.0 telemetry.xml && node ./node_modules/typescript/bin/tsc -p assets && node json-generator.js")

//console.log(output)
