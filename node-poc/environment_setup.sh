#!/bin/bash

rm -rf crypto-config
rm -rf network-config
mkdir network-config

# add bin directory to PATH
export PATH=${PWD}/bin:${PWD}:$PATH

# define fabric config directory 
export FABRIC_CFG_PATH=${PWD}/fabric-config

# generates certificates and keys on crypto-config directory
cryptogen generate --config=./fabric-config/crypto-config.yaml

# generate orderer.block on config directory
configtxgen -profile OrdererGenesis -outputBlock ./network-config/orderer.block

export CHANNEL123_NAME=channel-123
export CHANNEL123_PROFILE=Channel-123

export CHANNEL23_NAME=channel-23
export CHANNEL23_PROFILE=Channel-23

export CHANNEL1_NAME=channel-1
export CHANNEL1_PROFILE=Channel-1


# generate channel config transaction on config/channel.tx
configtxgen -profile ${CHANNEL123_PROFILE} -outputCreateChannelTx ./network-config/${CHANNEL123_NAME}.tx -channelID ${CHANNEL123_NAME}
configtxgen -profile ${CHANNEL23_PROFILE} -outputCreateChannelTx ./network-config/${CHANNEL23_NAME}.tx -channelID ${CHANNEL23_NAME}
configtxgen -profile ${CHANNEL1_PROFILE} -outputCreateChannelTx ./network-config/${CHANNEL1_NAME}.tx -channelID ${CHANNEL1_NAME}

# generate anchor peer transaction on config/Org1MSPanchors.tx
configtxgen -profile ${CHANNEL123_PROFILE} -outputAnchorPeersUpdate ./network-config/Org1MSPanchors_${CHANNEL123_NAME}.tx -channelID ${CHANNEL123_NAME} -asOrg Org1MSP
configtxgen -profile ${CHANNEL123_PROFILE} -outputAnchorPeersUpdate ./network-config/Org2MSPanchors_${CHANNEL123_NAME}.tx -channelID ${CHANNEL123_NAME} -asOrg Org2MSP
configtxgen -profile ${CHANNEL123_PROFILE} -outputAnchorPeersUpdate ./network-config/Org3MSPanchors_${CHANNEL123_NAME}.tx -channelID ${CHANNEL123_NAME} -asOrg Org3MSP

configtxgen -profile ${CHANNEL23_PROFILE} -outputAnchorPeersUpdate ./network-config/Org2MSPanchors_${CHANNEL23_NAME}.tx -channelID ${CHANNEL23_NAME} -asOrg Org2MSP
configtxgen -profile ${CHANNEL23_PROFILE} -outputAnchorPeersUpdate ./network-config/Org3MSPanchors_${CHANNEL23_NAME}.tx -channelID ${CHANNEL23_NAME} -asOrg Org3MSP

configtxgen -profile ${CHANNEL1_PROFILE} -outputAnchorPeersUpdate ./network-config/Org1MSPanchors_${CHANNEL1_NAME}.tx -channelID ${CHANNEL1_NAME} -asOrg Org1MSP
