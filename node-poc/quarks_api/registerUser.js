/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const {FileSystemWallet, Gateway, X509WalletMixin} = require('fabric-network');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, 'env.json');
const envJSON = fs.readFileSync(envPath, 'utf8');
const env = JSON.parse(envJSON);

async function main(org) {
    var username = "mirza@tkd.codes"
    try {

        const ccpPath = path.resolve(__dirname, env[org].connectionFile);
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        const ccp = JSON.parse(ccpJSON);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), env[org].walletPath);
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        
        const userExists = await wallet.exists(username);
        if (userExists) {
            console.log(`An identity for the user "${username}" already exists in the wallet`);
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists(env[org].adminUserName);
        if (!adminExists) {
            console.log(`An identity for the admin user "${env[org].adminUserName}" does not exist in the wallet`);
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: env[org].adminUserName,
            discovery: {enabled: false}
        });

        // Get the CA client object from the gateway for interacting with the CA.
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
            affiliation: env[org].departmentName,
            enrollmentID: username,
            role: 'client'
        }, adminIdentity);
        const enrollment = await ca.enroll({enrollmentID: username, enrollmentSecret: secret});
        const userIdentity = X509WalletMixin.createIdentity(env[org].mspId, enrollment.certificate, enrollment.key.toBytes());
        wallet.import(username, userIdentity);
        console.log(`Successfully registered and enrolled admin user "${username}" and imported it into the wallet`);

    } catch (error) {
        console.error(`Failed to register user "${username}": ${error}`);
        process.exit(1);
    }
}

main("nbr");
