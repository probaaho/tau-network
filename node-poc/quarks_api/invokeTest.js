/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, 'env.json');
const envJSON = fs.readFileSync(envPath, 'utf8');
const env = JSON.parse(envJSON);


async function main(org) {
    try {

        const ccpPath = path.resolve(__dirname, env[org].connectionFile);
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        const ccp = JSON.parse(ccpJSON);


        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), env[org].walletPath);
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        //var username = env[org].adminUserName;
        var username = "shuhan.mirza@gmail.com";

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(username);
        if (!userExists) {
            console.log(`An identity for the user "${username}" does not exist in the wallet`);
            console.log('Run the registerUser.js application before retrying'); //TODO: Check if this is correct
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: username, discovery: { enabled: false } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork("channel-1");

        // Get the contract from the network.
        const contract = network.getContract(env[org].contractName);

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')

        //await contract.submitTransaction('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom');
        const result = await contract.submitTransaction('initLedger',"");

        console.log('Transaction has been submitted');
        console.log(result.toString());

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        console.log(error.stack)
        process.exit(1);
    }
}

main("org1");
