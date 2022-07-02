const FabricCAServices = require('fabric-ca-client');
const {FileSystemWallet, Gateway, X509WalletMixin} = require('fabric-network');
const fs = require('fs');
const path = require('path');

var express = require('express');
var bodyParser = require('body-parser');

var appOrg1 = express();
var appOrg2 = express();
var appOrg3 = express();

appOrg1.use(bodyParser.json());
appOrg2.use(bodyParser.json());
appOrg3.use(bodyParser.json());

const envPath = path.resolve(__dirname, 'env.json');
const envJSON = fs.readFileSync(envPath, 'utf8');
const env = JSON.parse(envJSON);

const org1ConnectionPath = path.resolve(__dirname, env['org1']['connectionFile']);
const org1ConnectionJSON = fs.readFileSync(org1ConnectionPath, 'utf8');
const org1Connection = JSON.parse(org1ConnectionJSON);

const org2ConnectionPath = path.resolve(__dirname, env['org2']['connectionFile']);
const org2ConnectionJSON = fs.readFileSync(org2ConnectionPath, 'utf8');
const org2Connection = JSON.parse(org2ConnectionJSON);

const org3ConnectionPath = path.resolve(__dirname, env['org3']['connectionFile']);
const org3ConnectionJSON = fs.readFileSync(org3ConnectionPath, 'utf8');
const org3Connection = JSON.parse(org3ConnectionJSON);


const FabricClient = require('./fabricClient');
const {addAffiliationCA} = require("./fabricClient");

appOrg1.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

appOrg2.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

appOrg3.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
/////// TEST ///////////////////

appOrg1.get('/test', async function (req, res) {
    console.log(req.body)

    res.json(req.body);

    return res;
});

appOrg2.get('/test', async function (req, res) {
    console.log(req.body)

    res.json(req.body);

    return res;
});

appOrg3.get('/test', async function (req, res) {
    console.log(req.body)

    res.json(req.body);

    return res;
});


/////// enroll admin ////

appOrg1.post('/enrollAdmin', async function (req, res) {
    let result = await enrollAdminOrg("org1")
    res.json(result);
    return res;
});

appOrg2.post('/enrollAdmin', async function (req, res) {
    let result = await enrollAdminOrg("org2")
    res.json(result);
    return res;
});

appOrg3.post('/enrollAdmin', async function (req, res) {
    let result = await enrollAdminOrg("org3")
    res.json(result);
    return res;
});

async function enrollAdminOrg(org) {
    let orgConnection = await getOrgConnection(org)

    let caUrl = orgConnection.certificateAuthorities[env[org].caUrl].url
    let walletPathStr = env[org].walletPath
    let adminUserName = env[org].adminUserName
    let adminSecret = env[org].adminSecret
    let mspId = env[org].mspId

    return await FabricClient.enrollAdmin(FabricCAServices,
        FileSystemWallet,
        X509WalletMixin,
        path,
        caUrl,
        walletPathStr,
        adminUserName,
        adminSecret,
        mspId);
}


////// register user //////////
appOrg1.post('/registerUser', async function (req, res) {
    let registerUserReq = req.body;
    let result = false
    if (!isEmpty(registerUserReq["username"])) {
        result = await registerUserOrg("org1", registerUserReq["username"])
    }

    res.json(result);
    return res;
});


appOrg2.post('/registerUser', async function (req, res) {
    let registerUserReq = req.body;
    let result = false
    if (!isEmpty(registerUserReq["username"])) {
        result = await registerUserOrg("org2", registerUserReq["username"])
    }

    res.json(result);
    return res;
});


appOrg3.post('/registerUser', async function (req, res) {
    let registerUserReq = req.body;
    let result = false
    if (!isEmpty(registerUserReq["username"])) {
        result = await registerUserOrg("org3", registerUserReq["username"])
    }

    res.json(result);
    return res;
});


async function registerUserOrg(org, userName) {
    let orgConnection = await getOrgConnection(org)

    let caUrl = orgConnection.certificateAuthorities[env[org].caUrl].url
    let walletPathStr = env[org].walletPath
    let adminUserName = env[org].adminUserName
    let mspId = env[org].mspId
    let departmentName = env[org].departmentName

    return await FabricClient.registerUser(FileSystemWallet,
        X509WalletMixin,
        path,
        Gateway,
        orgConnection,
        caUrl,
        walletPathStr,
        adminUserName,
        mspId,
        userName,
        departmentName);
}


//// add affiliation /////
appOrg1.post('/addAffiliation', async function (req, res) {
    let addAffiliationReq = req.body;
    let result = false
    if (!isEmpty(addAffiliationReq["department"])) {
        result = await addAffiliationOrg("org1", addAffiliationReq["department"])
    }

    res.json(result);
    return res;
});

appOrg2.post('/addAffiliation', async function (req, res) {
    let addAffiliationReq = req.body;
    let result = false
    if (!isEmpty(addAffiliationReq["department"])) {
        result = await addAffiliationOrg("org2", addAffiliationReq["department"])
    }

    res.json(result);
    return res;
});

appOrg3.post('/addAffiliation', async function (req, res) {
    let addAffiliationReq = req.body;
    let result = false
    if (!isEmpty(addAffiliationReq["department"])) {
        result = await addAffiliationOrg("org3", addAffiliationReq["department"])
    }

    res.json(result);
    return res;
});


async function addAffiliationOrg(org, department) {

    let orgConnection = await getOrgConnection(org)

    let walletPathStr = env[org].walletPath
    let adminUserName = env[org].adminUserName
    let adminSecret = env[org].adminSecret


    return await FabricClient.addAffiliationCA(FileSystemWallet,
        Gateway,
        path,
        orgConnection,
        walletPathStr,
        adminUserName,
        adminSecret,
        org,
        department
    );
}


//// send message to a channel ////
appOrg1.post('/sendMessage', async function (req, res) {
    let sendMessageRequest = req.body;
    console.log(sendMessageRequest)

    let sendMessageResponse
    if (!isEmpty(sendMessageRequest["user"]) && !isEmpty(sendMessageRequest["channel"]) && !isEmpty(sendMessageRequest["text"])) {
        sendMessageResponse = await sendMessageToChannel(
            "org1",
            sendMessageRequest["user"],
            sendMessageRequest["channel"],
            sendMessageRequest["text"]
        )
    }
    console.log(sendMessageResponse)
    res.json(sendMessageResponse);
    return res;
});

appOrg2.post('/sendMessage', async function (req, res) {
    let sendMessageRequest = req.body;
    console.log(sendMessageRequest)

    let sendMessageResponse
    if (!isEmpty(sendMessageRequest["user"]) && !isEmpty(sendMessageRequest["channel"]) && !isEmpty(sendMessageRequest["text"])) {
        sendMessageResponse = await sendMessageToChannel(
            "org2",
            sendMessageRequest["user"],
            sendMessageRequest["channel"],
            sendMessageRequest["text"]
        )
    }
    console.log(sendMessageResponse)
    res.json(sendMessageResponse);
    return res;
});

appOrg3.post('/sendMessage', async function (req, res) {
    let sendMessageRequest = req.body;
    console.log(sendMessageRequest)

    let sendMessageResponse
    if (!isEmpty(sendMessageRequest["user"]) && !isEmpty(sendMessageRequest["channel"]) && !isEmpty(sendMessageRequest["text"])) {
        sendMessageResponse = await sendMessageToChannel(
            "org3",
            sendMessageRequest["user"],
            sendMessageRequest["channel"],
            sendMessageRequest["text"]
        )
    }
    console.log(sendMessageResponse)
    res.json(sendMessageResponse);
    return res;
});

async function sendMessageToChannel(org, username, channel, text) {
    let orgConnection = await getOrgConnection(org)
    let walletPathStr = env[org].walletPath
    let contractName = env[org].contractName

    return FabricClient.sendMessageChannel(
        FileSystemWallet,
        Gateway,
        path,
        orgConnection,
        walletPathStr,
        username,
        org,
        channel,
        contractName,
        text)
}


//// read messages from a channel ////
appOrg1.get('/readMessage', async function (req, res) {
    let readMessageRequest = req.body;
    console.log(readMessageRequest)

    let readMessageResponse
    if (!isEmpty(readMessageRequest["user"]) && !isEmpty(readMessageRequest["channel"])) {
        readMessageResponse = await readMessageFromChannel(
            "org1",
            readMessageRequest["user"],
            readMessageRequest["channel"],
            readMessageRequest["from_timestamp"]
        )
    }
    console.log(readMessageResponse)
    res.json(readMessageResponse);
    return res;
});

appOrg2.get('/readMessage', async function (req, res) {
    let readMessageRequest = req.body;
    console.log(readMessageRequest)

    let readMessageResponse
    if (!isEmpty(readMessageRequest["user"]) && !isEmpty(readMessageRequest["channel"])) {
        readMessageResponse = await readMessageFromChannel(
            "org2",
            readMessageRequest["user"],
            readMessageRequest["channel"],
            readMessageRequest["from_timestamp"]
        )
    }
    console.log(readMessageResponse)
    res.json(readMessageResponse);
    return res;
});


appOrg3.get('/readMessage', async function (req, res) {
    let readMessageRequest = req.body;
    console.log(readMessageRequest)

    let readMessageResponse
    if (!isEmpty(readMessageRequest["user"]) && !isEmpty(readMessageRequest["channel"]) && !isEmpty(readMessageRequest["from_timestamp"])) {
        readMessageResponse = await readMessageFromChannel(
            "org3",
            readMessageRequest["user"],
            readMessageRequest["channel"],
            readMessageRequest["from_timestamp"]
        )
    }
    console.log(readMessageResponse)
    res.json(readMessageResponse);
    return res;
});


async function readMessageFromChannel(org, username, channel, fromTimestamp) {
    let orgConnection = await getOrgConnection(org)
    let walletPathStr = env[org].walletPath
    let contractName = env[org].contractName

    return FabricClient.readMessageChannel(
        FileSystemWallet,
        Gateway,
        path,
        orgConnection,
        walletPathStr,
        username,
        org,
        channel,
        contractName,
        fromTimestamp
    )
}


/////// functions
function isEmpty(str) {
    return (!str || str.length === 0);
}

async function getOrgConnection(org) {
    let orgConnectionPath = path.resolve(__dirname, env[org]['connectionFile']);
    let orgConnectionJSON = fs.readFileSync(orgConnectionPath, 'utf8');
    return JSON.parse(orgConnectionJSON)
}


appOrg1.listen(3001, "0.0.0.0");
console.log('quarks api org1 running in port 3001');

appOrg2.listen(3002, "0.0.0.0");
console.log('quarks api org2 running in port 3002');

appOrg3.listen(3003, "0.0.0.0");
console.log('quarks api org3 running in port 3003');

