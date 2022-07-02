#!/bin/bash
export PATH=$PATH:/usr/local/bin
export NODE_PATH=/usr/local/share/node
export USER=ubuntu
export HOME=/home/ubuntu
source $HOME/.nvm/nvm.sh

echo "###### Invoke  initLedger ######"
/usr/bin/env node invoke_initLedger.js

echo "###### Query queryAllUsers ######"
/usr/bin/env node query_queryAllUsers.js

echo "##### Starting API #####"
/usr/bin/env node app.js
