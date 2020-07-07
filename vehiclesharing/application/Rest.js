/**
  * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This is an example based on fabric-sdk-node, it refers content of:
 * https://fabric-sdk-node.github.io/master/index.html
 * https://github.com/hyperledger/fabric-sdk-node
 * https://fabric-sdk-node.github.io/master/tutorial-network-config.html
 * 
 * This program uses connprofile.json, what is a common connection profile.
 * It will utilze InMemoryWallet and Gateway, what is from fabric-network module.
 */

var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());


'use strict';
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const {Gateway, FileSystemWallet, InMemoryWallet, X509WalletMixin} = require('fabric-network');




var logger = new (winston.Logger)({transports: [new (winston.transports.Console)()]});

/*
let arg = process.argv[2];

switch (arg) {
    case 'query' : queryFindVehicle(process.argv[3]); break;
    case 'add' : invokeAddVehicle(getRandomId(), 'FBC'); break;
    default: logger.error(`Please run command likes: 'node vstest4.js query [id]' or 'node vstest4.js add'`);
}
*/



app.get('/api/querygeodatabyid/:user_id',async function queryGeoData(req, res) {
	
    if (req.params.user_id == undefined) {
	logger.info('Please speficy a user id for search.')
        return;
    }
    console.log(`User-ID: ${req.params.user_id}`);
    const identityLabel = 'alice@sharing.en xample.com';
    const wallet = await initUserWallet(identityLabel);
    const gateway = new Gateway();

    await gateway.connect(path.join(__dirname, './connprofile.json'),
         {
              wallet: wallet,
              identity: identityLabel,
              discovery: {
                      enabled: false,
              }
         });

    logger.info('Gateway connects get succeed.');
    const network = await gateway.getNetwork('vschannel');
    const contract = await network.getContract('vehiclesharing');
    console.log(`User-ID before getting result: ${req.params.user_id}`);
    //let result = await contract.evaluateTransaction('queryGeoData', req.params.user_id);
    let result = await contract.evaluateTransaction('findGeoDatabyRecordID', req.params.user_id);
    //findGeoDatabyRecordID
    gateway.disconnect();
    res.status(200).json({response: result.toString()});
    //result = Buffer.from(result).toString()
    logger.info(result == '' ? req.params.user_id + ' not found' : result)
});



app.get('/api/queryusergeodata/:user_id',async function queryGeoData(req, res) {

	 if (req.params.user_id == undefined) {
	      logger.info('Please speficy a user id for search.')
	      return;
	 }
	 console.log(`User-ID: ${req.params.user_id}`);
	 const identityLabel = 'alice@sharing.en xample.com';
	 const wallet = await initUserWallet(identityLabel);
	 const gateway = new Gateway();

	 await gateway.connect(path.join(__dirname, './connprofile.json'),
	 {
	        wallet: wallet,
	        identity: identityLabel,
	        discovery: {
	                   enabled: false,
	        }
	 });

	logger.info('Gateway connects get succeed.');
	const network = await gateway.getNetwork('vschannel');
	const contract = await network.getContract('vehiclesharing');
	console.log(`User-ID before getting result: ${req.params.user_id}`);
	let result = await contract.evaluateTransaction('queryGeoData', req.params.user_id);
	//let result = await contract.evaluateTransaction('findGeoDatabyRecordID', req.params.user_id);
        //findGeoDatabyRecordID
	gateway.disconnect();
	res.status(200).json({response: result.toString()});
	//result = Buffer.from(result).toString()
	logger.info(result == '' ? req.params.user_id + ' not found' : result)
 });
















//app.post('/api/addusergeodata/', async function invokeAddVehicle(vehicleId, brand) {
app.post('/api/addusergeodata/', async function invokeAddVehicle(req, res) {

    const userid = req.body.userid;
    const geodata = req.body.geodata;
    var now = new Date()
    let timestamp = now.getTime().toString()  //time stamp in millissconds
    console.log(`Time Stamp: ${timestamp}`);

    console.log(`User-ID: ${userid}`);	
    logger.info('Begin to add user geodata [%s-%s]',userid, geodata);
    const identityLabel = 'alice@sharing.example.com';
    const wallet = await initUserWallet(identityLabel);
    const gateway = new Gateway();
    await gateway.connect(path.join(__dirname, './connprofile.json'),
        {
            wallet: wallet,
            identity: identityLabel,
            discovery: {
				enabled: false,
			}
        });

    logger.info('Gateway connects get succeed.');

    try {
        const network = await gateway.getNetwork('vschannel');
        const contract = await network.getContract('vehiclesharing');
        const transaction = contract.createTransaction('createVehicle');
        const transactionId = transaction.getTransactionID().getTransactionID();
    
        logger.info('Create a transaction ID: ', transactionId);
        
        const sharingOrgEventHub = await getFirstEventHubForOrg(network, 'SharingMSP');
        //const vehicleEventHub = await getFirstEventHubForOrg(network, 'VehicleMSP');
        //const onlinePayEventHub = await getFirstEventHubForOrg(network, 'OnlinePayMSP');
    
        let eventFired = 0;
        sharingOrgEventHub.registerTxEvent('all', (txId, code) => {
            logger.info('Event', txId, code);
            if (code === 'VALID' && txId === transactionId) {
                eventFired++;
            }
        }, 
        () => {
            //logger.info('EventHub error.');
        });
	
	//const response = await transaction.submit(req.body.userid, req.body.geodata);
        const response = await contract.submitTransaction('createVehicle', userid, geodata, timestamp);
        //const succ = (eventFired == 1);
        //if (succ) {
            res.send('User Geodata has been submitted. GeoDataID is ' + timestamp);
            logger.info('A new Geodata for userid [%s] was recorded. GeodataID is : %s', req.body.userid, response.toString());
        //}    
        //else {
        //    logger.error('Adding userid got failed.');
        //}
            
    } 
    //catch (err) {
    //		logger.error('Failed to invoke transaction chaincode on channel. ' + err.stack ? err.stack : err);
    //} 
    finally {
		gateway.disconnect();
	    	//process.exit(1);
		logger.info('Gateway disconnected.');
	}

});



app.post('/api/setgeodataprice/', async function setGeoDataPrice(req, res) {

	    const geodataid = req.body.geodataid;
	    const geodataprice = req.body.geodataprice;
	    /*
	    var now = new Date()
	    let timestamp = now.getTime().toString()  //time stamp in millissconds
	    console.log(`Time Stamp: ${timestamp}`);

	    console.log(`User-ID: ${userid}`);
	    logger.info('Begin to add user geodata [%s-%s]',userid, geodata);
	    */
	    const identityLabel = 'alice@sharing.example.com';
	    const wallet = await initUserWallet(identityLabel);
	    const gateway = new Gateway();
	    await gateway.connect(path.join(__dirname, './connprofile.json'),
		 {
		         wallet: wallet,
		         identity: identityLabel,
		         discovery: {
		               enabled: false,
		         }
		 });

	    logger.info('Gateway connects get succeed.');

	    try {
            const network = await gateway.getNetwork('vschannel');
            const contract = await network.getContract('vehiclesharing');
            const transaction = contract.createTransaction('updateGpsDataPrice');
            const transactionId = transaction.getTransactionID().getTransactionID();

            logger.info('Create a transaction ID: ', transactionId);

            const sharingOrgEventHub = await getFirstEventHubForOrg(network, 'SharingMSP');
            let eventFired = 0;
            sharingOrgEventHub.registerTxEvent('all', (txId, code) => {
	         logger.info('Event', txId, code);
	         if (code === 'VALID' && txId === transactionId) {
	               eventFired++;
	         }
	    },
	    () => {
	        //logger.info('EventHub error.');
	    });
            const response = await contract.submitTransaction('updateGpsDataPrice', geodataid, geodataprice);
            res.send('User Geodata price has been updated')
            logger.info('A new Geodata price for geodataid [%s] was recorded. GeodataID is : %s', req.body.geodataid, response.toString());
            }

	    finally {
	                   gateway.disconnect();
	                   //process.exit(1);
                           logger.info('Gateway disconnected.');
            }
});



app.post('/api/setgeodataowner/', async function updateGeoDataOwner(req, res) {

	            const geodataid = req.body.geodataid;
	            const geodataowner = req.body.geodataowner;
	            
		    /*
		    var now = new Date()
	            let timestamp = now.getTime().toString()  //time stamp in millissconds
	            console.log(`Time Stamp: ${timestamp}`);

	            console.log(`User-ID: ${userid}`);
	            logger.info('Begin to add user geodata [%s-%s]',userid, geodata);
	            */
		    const identityLabel = 'alice@sharing.example.com';
	            const wallet = await initUserWallet(identityLabel);
	            const gateway = new Gateway();
	            await gateway.connect(path.join(__dirname, './connprofile.json'),
		                     {
		                              wallet: wallet,
		                              identity: identityLabel,
		                              discovery: {
		                                     enabled: false,
		                               }
		                      });

	            logger.info('Gateway connects get succeed.');

	            try {
			                const network = await gateway.getNetwork('vschannel');
			                const contract = await network.getContract('vehiclesharing');
			                const transaction = contract.createTransaction('updateGpsDataOwner');
			                const transactionId = transaction.getTransactionID().getTransactionID();

			                logger.info('Create a transaction ID: ', transactionId);

			                const sharingOrgEventHub = await getFirstEventHubForOrg(network, 'SharingMSP');
			                let eventFired = 0;
			                sharingOrgEventHub.registerTxEvent('all', (txId, code) => {
					         logger.info('Event', txId, code);
					         if (code === 'VALID' && txId === transactionId) {
					               eventFired++;
				        	 }
				        },
				        () => {
				                    //logger.info('EventHub error.');
				        });
				        const response = await contract.submitTransaction('updateGpsDataOwner', geodataid, geodataowner);
					res.send('User Geodata owner list has been updated')
					logger.info('The Geodata owner for geodataid [%s] was updated. GeodataID is : %s', req.body.geodataid, response.toString());
		        }
								    
                     finally {
                                        gateway.disconnect();
                                        //process.exit(1);
                                        logger.info('Gateway disconnected.');
                        }
});
















async function getFirstEventHubForOrg(network, orgMSP) {
    const channel = network.getChannel();
    const orgPeer = channel.getPeersForOrg(orgMSP)[0];
	return channel.getChannelEventHub(orgPeer.getName());
}

function getRandomId() {
    return Math.random().toString().substring(2).substring(0,8);
}

async function initUserWallet(identityLabel) {
    // Hardcode crypto materials of user alice@sharing.example.com.
    const keyPath = path.join(__dirname, "../deployed/client/mymsp/localmsp/alice@sharing.example.com/msp/keystore/alice@sharing.example.com.key");
    const keyPEM = Buffer.from(fs.readFileSync(keyPath)).toString();
    const certPath = path.join(__dirname, "../deployed/client/mymsp/localmsp/alice@sharing.example.com/msp/signcerts/alice@sharing.example.com.pem");
    const certPEM = Buffer.from(fs.readFileSync(certPath)).toString();

    const mspId = 'SharingMSP';
    const identity = X509WalletMixin.createIdentity(mspId, certPEM, keyPEM)

    //const wallet = new FileSystemWallet('/tmp/wallet/alice.sharing');
    const wallet = new InMemoryWallet();
    await wallet.import(identityLabel, identity);

    if (await wallet.exists(identityLabel)) {
        logger.info('Identity %s exists.', identityLabel);
    }
    else {
        logger.error('Identity %s does not exist.', identityLabel);
    }
    return wallet;
}

app.listen(10000);
