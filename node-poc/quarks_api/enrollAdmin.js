/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const {FileSystemWallet, X509WalletMixin} = require('fabric-network');
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

        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities[env[org].caUrl].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), env[org].walletPath);
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists(env[org].adminUserName);
        if (adminExists) {
            console.log(`An identity for the admin user ${env[org].adminUserName} already exists in the wallet`);
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({
            enrollmentID: env[org].adminUserName,
            enrollmentSecret: env[org].adminSecret
        });
        const identity = X509WalletMixin.createIdentity(
            env[org].mspId,
            enrollment.certificate,
            enrollment.key.toBytes()
        );
        wallet.import(env[org].adminUserName, identity);
        console.log(`Successfully enrolled admin user "${env[org].adminUserName}" and imported it into the wallet`);

    } catch (error) {
        console.error(`Failed to enroll admin user "${env[org].adminUserName}": ${error}`);
        process.exit(1);
    }
}


main("nbr");

//test("nbr");