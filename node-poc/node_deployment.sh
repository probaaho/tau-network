#!/bin/bash

# deploy ca, zookeerper, kafka and orderers
# docker-compose -f deployment/docker-compose-kafka.yml up

################## Peer Initiation in org1 org2 org3 ####################################'
#docker-compose -f deployment/docker-compose-org1.yml up
#docker-compose -f deployment/docker-compose-org2.yml up
#docker-compose -f deployment/docker-compose-org3.yml up

echo '################## Deployment Initiation in org1 #####################################'
docker-compose -f deployment/docker-compose-org1cli.yml up -d

echo
echo '################## Deployment Initiation in org2 #####################################'
docker-compose -f deployment/docker-compose-org2cli.yml up -d

echo
echo '################## Deployment Initiation in org3 #####################################'
docker-compose -f deployment/docker-compose-org3cli.yml up -d

echo
echo "################## Channel-123 Creation and Joining #######################################"
# create channel-123 from peer0 on org1
# it connects to orderer0
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer0.example.com:7050 -c channel-123 -f /var/hyperledger/configs/channel-123.tx
# join peer0 to channel
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b channel-123.block

echo
echo "################## Channel-23 Creation and Joining #######################################"
# create channel-23 from peer0 on org2
# it connects to orderer0
docker exec -e "CORE_PEER_LOCALMSPID=Org2MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel create -o orderer1.example.com:7050 -c channel-23 -f /var/hyperledger/configs/channel-23.tx
# join peer0 to channel
docker exec -e "CORE_PEER_LOCALMSPID=Org2MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b channel-23.block

echo
echo "################## Channel-1 Creation and Joining #######################################"
# create channel-1 from peer0 on org1
# it connects to orderer0
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer0.example.com:7050 -c channel-1 -f /var/hyperledger/configs/channel-1.tx
# join peer0 to channel
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b channel-1.block


echo
echo "################## Channel Block Sharing #############################################"
docker cp peer0.org1.example.com:/channel-123.block .
docker cp peer0.org2.example.com:/channel-23.block .
#docker cp peer0.org1.example.com:/channel-1.block .

echo
docker cp channel-123.block peer0.org2.example.com:/channel-123.block
docker cp channel-123.block peer0.org3.example.com:/channel-123.block

docker cp channel-23.block peer0.org3.example.com:/channel-23.block

echo
echo "###################### Block Remove #####################"
#### block remove

rm channel-123.block
rm channel-23.block


echo
echo "#############################channel join of peers####################"
docker exec -e "CORE_PEER_LOCALMSPID=Org2MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b channel-123.block
docker exec -e "CORE_PEER_LOCALMSPID=Org3MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org3.example.com/msp" peer0.org3.example.com peer channel join -b channel-123.block

docker exec -e "CORE_PEER_LOCALMSPID=Org3MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org3.example.com/msp" peer0.org3.example.com peer channel join -b channel-23.block

./chaincode_deploy.sh mycc 0 init
#
#echo
#echo "############################# Ledger Init ###########################"
#curl --location --request POST 'beta.alphaid.com:3000/initLedger/' \
#--data-raw ''

echo
echo "%%%%%%%%% congratulations %%%%%%%%%%%%"
echo "%%%%%%%%% Quarks POC DEPLOYED %%%%%%%%%%%%"
./art_print.sh

echo ">>>>>>>_"
read  -n 1 -p "press enter to tear down the network" mainmenuinput

./down_network.sh