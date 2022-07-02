/*
 * SPDX-License-Identifier: Apache-2.0
 */

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const fs = require('fs');
const path = require('path');

var crypto = require('crypto');

const ccpPath = path.resolve(__dirname,'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

ZIMBRAregister = require('./module_bash_zimbraManageUser');

async function main() {
    // Create a new file system based wallet for managing identities.
    try{        
        user = "test_user_0@becbuster.com";

        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        var check_time = 10;
        var userExists = await wallet.exists(user);
        while (userExists != true){
            userExists = await wallet.exists(user);
            
            check_time -= 1;
            if(check_time == 0){
                console.log("could not find "+user);
            }
        }
        const id = await wallet.export(user);
        console.log(id)
        await ZIMBRAregister.addProperty(user,'privateKey',id['privateKey']);

    } catch (error) {
        console.error(`${error}`);
    }
}

main();
