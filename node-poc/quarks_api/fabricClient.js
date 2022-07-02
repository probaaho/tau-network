async function enrollAdmin(FabricCAServices, FileSystemWallet, X509WalletMixin, path, caUrl, walletPathStr, adminUserName, adminSecret, mspId) {
    try {

        // Create a new CA client for interacting with the CA.
        let ca = new FabricCAServices(caUrl);

        let wallet = await getWallet(FileSystemWallet, path, walletPathStr)

        // Check to see if we've already enrolled the admin user.
        let adminExists = await wallet.exists(adminUserName);
        if (adminExists) {
            console.log(`An identity for the admin user ${adminUserName} already exists in the wallet`);
            return false;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        let enrollment = await ca.enroll({
            enrollmentID: adminUserName,
            enrollmentSecret: adminSecret
        });
        let identity = X509WalletMixin.createIdentity(
            mspId,
            enrollment.certificate,
            enrollment.key.toBytes()
        );

        await wallet.import(adminUserName, identity);
        console.log(`Successfully enrolled admin user "${adminUserName}" and imported it into the wallet`);
        return true;

    } catch (error) {
        console.error(`Failed to enroll admin user "${adminUserName}": ${error}`);
        return false;
    }
}

async function registerUser(FileSystemWallet, X509WalletMixin, path, Gateway, orgConnection, caUrl, walletPathStr, adminUserName, mspId, userName, departmentName) {
    try {
        let wallet = await getWallet(FileSystemWallet, path, walletPathStr)

        // Check to see if we've already enrolled the user.
        let userExists = await wallet.exists(userName);
        if (userExists) {
            console.log(`An identity for the user "${userName}" already exists in the wallet`);
            return;
        }

        // Check to see if we've already enrolled the admin user.
        let adminExists = await wallet.exists(adminUserName);
        if (!adminExists) {
            console.log(`An identity for the admin user "${adminUserName}" does not exist in the wallet`);
            return;
        }

        // Create a new gateway for connecting to our peer node.
        let gateway = new Gateway();
        await gateway.connect(orgConnection, {
            wallet, identity: adminUserName,
            discovery: {enabled: false}
        });

        // Get the CA client object from the gateway for interacting with the CA.
        let ca = gateway.getClient().getCertificateAuthority();
        let adminIdentity = gateway.getCurrentIdentity();

        // Register the user, enroll the user, and import the new identity into the wallet.
        let secret = await ca.register({
            affiliation: departmentName,
            enrollmentID: userName,
            role: 'client'
        }, adminIdentity);

        let enrollment = await ca.enroll({enrollmentID: userName, enrollmentSecret: secret});
        let userIdentity = X509WalletMixin.createIdentity(mspId, enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(userName, userIdentity);
        console.log(`Successfully registered and enrolled admin user "${userName}" and imported it into the wallet`);

        return true;

    } catch (error) {
        console.error(`Failed to register user "${userName}": ${error}`);
        return false;
    }
}

async function addAffiliationCA(FileSystemWallet, Gateway, path, orgConnection, walletPathStr, adminUserName, adminSecret, orgName, departmentName) {

    try {
        let affiliation = orgName + "." + departmentName

        let wallet = await getWallet(FileSystemWallet, path, walletPathStr)

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists(adminUserName);
        if (!adminExists) {
            console.log(`An identity for the admin user "${adminUserName}" does not exist in the wallet`);
            return;
        }

        // Create a new gateway for connecting to our peer node.
        let gateway = new Gateway();
        await gateway.connect(orgConnection, {wallet, identity: adminUserName, discovery: {enabled: false}});

        let client = gateway.getClient();
        let adminUserObj = await client.setUserContext({
            username: adminUserName,
            password: adminSecret
        });

        let caClient = client.getCertificateAuthority();
        let affiliationService = caClient.newAffiliationService();

        let registeredAffiliations = await affiliationService.getAll(adminUserObj);
        if (!registeredAffiliations.result.affiliations.some(
            x => x.name === orgName.toLowerCase())) {
            await affiliationService.create({
                name: affiliation,
                force: true
            }, adminUserObj);
        }

        console.log(`Successfully affiliated "${orgName}" "${departmentName}" in CA`);

        return true;

    } catch (error) {
        console.error(`Failed to add affiliation "${orgName}" "${departmentName}": ${error}`);
        return false;
    }

}

async function sendMessageChannel(FileSystemWallet, Gateway, path, orgConnection, walletPathStr, userName, orgName, channelName, contractName, textContent) {

    try {
        let contract = await getContract(FileSystemWallet,
            Gateway,
            path,
            orgConnection,
            walletPathStr,
            userName,
            orgName,
            channelName,
            contractName)

        let result = await contract.submitTransaction('addMessage', textContent);
        return JSON.parse(result.toString())

    } catch (error) {
        let msg = `Failed to create contract: ${error}`
        console.error(msg);
        return Error(msg);
    }
}

async function readMessageChannel(FileSystemWallet, Gateway, path, orgConnection, walletPathStr, userName, orgName, channelName, contractName, fromTimestamp) {

    try {
        let contract = await getContract(FileSystemWallet,
            Gateway,
            path,
            orgConnection,
            walletPathStr,
            userName,
            orgName,
            channelName,
            contractName)

        let result = await contract.evaluateTransaction('queryMessages', fromTimestamp);
        return JSON.parse(result.toString())

    } catch (error) {
        let msg = `Failed to create contract: ${error}`
        console.error(msg);
        return Error(msg);
    }
}

async function getContract(FileSystemWallet, Gateway, path, orgConnection, walletPathStr, userName, orgName, channelName, contractName) {
    let wallet = await getWallet(FileSystemWallet, path, walletPathStr)

    // Check to see if we've already enrolled the user.
    let userExists = await wallet.exists(userName);
    if (!userExists) {
        let msg = `An identity for the user "${userName}" does not exist in the wallet`
        console.log(msg);
        throw Error(msg)
    }

    // Create a new gateway for connecting to our peer node.
    let gateway = new Gateway();
    await gateway.connect(orgConnection, {
        wallet, identity: userName,
        discovery: {enabled: false}
    });

    // Get the network (channel) our contract is deployed to.
    let network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    return network.getContract(contractName);
}

async function getWallet(FileSystemWallet, path, walletPathStr) {
    // Create a new file system based wallet for managing identities.
    let walletPath = path.join(process.cwd(), walletPathStr);
    return new FileSystemWallet(walletPath)
}


module.exports = {
    enrollAdmin,
    registerUser,
    addAffiliationCA,
    sendMessageChannel,
    readMessageChannel
}

