set PYTHONPATH=%cd%\pymavlink
echo PYTHONPATH for pymavlink set to: %PYTHONPATH%
mkdir assets

py -m pymavlink.tools.mavgen -o ./assets --lang TypeScript --wire-protocol 2.0 telemetry.xml

node ./node_modules/typescript/bin/tsc -p assets

node json-generator.js