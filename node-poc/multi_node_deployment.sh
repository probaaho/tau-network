#!/bin/bash

quarks_one_ip=10.100.222.178
quarks_two_ip=10.100.222.179
project_path=~/quarks-network/node-poc
project_docker_path=~/quarks-network/node-poc/deployment

ssh_cmd='ssh -o StrictHostKeyChecking=no '
ssh_quarks_one="${ssh_cmd} quarks@${quarks_one_ip}"
ssh_quarks_two="${ssh_cmd} quarks@${quarks_two_ip}"
scp_cmd='scp -o StrictHostKeyChecking=no'


destroy_network () {
  echo '################## Docker kill and rm ##############################################'
  $ssh_quarks_one 'docker rm -f $(docker ps -a -q)'
  $ssh_quarks_two 'docker rm -f $(docker ps -a -q)'

  $ssh_quarks_one 'docker volume rm $(docker volume ls -q)'
  $ssh_quarks_two 'docker volume rm $(docker volume ls -q)'

  $ssh_quarks_one 'docker rmi $(docker images net-peer* -q)'
  $ssh_quarks_two 'docker rmi $(docker images net-peer* -q)'
}

destroy_network

# deploy ca, zookeerper, kafka and orderers
gnome-terminal -- $ssh_quarks_two 'cd ~/quarks-network/node-poc/deployment && docker-compose -f docker-compose-kafka.yml up'

################## Peer Initiation in org1 org2 org3 ####################################'
gnome-terminal -- $ssh_quarks_one 'cd ~/quarks-network/node-poc/deployment && docker-compose -f docker-compose-org1.yml up'
gnome-terminal -- $ssh_quarks_two 'cd ~/quarks-network/node-poc/deployment && docker-compose -f docker-compose-org2.yml up'
gnome-terminal -- $ssh_quarks_two 'cd ~/quarks-network/node-poc/deployment && docker-compose -f docker-compose-org3.yml up'

echo '################## Deployment Initiation in org1 #####################################'
$ssh_quarks_one 'cd ~/quarks-network/node-poc/deployment && docker-compose -f docker-compose-org1cli.yml up -d'

echo
echo '################## Deployment Initiation in org2 #####################################'
$ssh_quarks_two 'cd ~/quarks-network/node-poc/deployment && docker-compose -f docker-compose-org2cli.yml up -d'

echo
echo '################## Deployment Initiation in org3 #####################################'
$ssh_quarks_two 'cd ~/quarks-network/node-poc/deployment && docker-compose -f docker-compose-org3cli.yml up -d'

echo "################# wait for 10 seconds #################################"
sleep 10

echo
echo "################## Channel-123 Creation and Joining #######################################"
# create channel-123 from peer0 on org1
# it connects to orderer0
$ssh_quarks_one 'docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer0.example.com:7050 -c channel-123 -f /var/hyperledger/configs/channel-123.tx'
# join peer0 to channel
$ssh_quarks_one 'docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b channel-123.block'

echo
echo "################## Channel-23 Creation and Joining #######################################"
# create channel-23 from peer0 on org2
# it connects to orderer0
$ssh_quarks_two 'docker exec -e "CORE_PEER_LOCALMSPID=Org2MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel create -o orderer1.example.com:7050 -c channel-23 -f /var/hyperledger/configs/channel-23.tx'
# join peer0 to channel
$ssh_quarks_two 'docker exec -e "CORE_PEER_LOCALMSPID=Org2MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b channel-23.block'

echo
echo "################## Channel-1 Creation and Joining #######################################"
# create channel-1 from peer0 on org1
# it connects to orderer0
$ssh_quarks_one 'docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer0.example.com:7050 -c channel-1 -f /var/hyperledger/configs/channel-1.tx'
# join peer0 to channel
$ssh_quarks_one 'docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b channel-1.block'


echo
echo "################## Channel Block Sharing #############################################"
echo "block copy"
$ssh_quarks_one 'docker cp peer0.org1.example.com:/channel-123.block .'
$ssh_quarks_two 'docker cp peer0.org2.example.com:/channel-23.block .'

echo "block copy to other host"
$ssh_quarks_one "$scp_cmd -r channel-123.block quarks@$quarks_two_ip:~/"


echo "block set to peers"
$ssh_quarks_two 'docker cp channel-123.block peer0.org2.example.com:/channel-123.block'
$ssh_quarks_two 'docker cp channel-123.block peer0.org3.example.com:/channel-123.block'

$ssh_quarks_two 'docker cp channel-23.block peer0.org3.example.com:/channel-23.block'

echo "removing blocks"
$ssh_quarks_one 'rm channel-123.block'

$ssh_quarks_two 'rm channel-123.block'
$ssh_quarks_two 'rm channel-23.block'

echo
echo "#############################channel join of peers####################"
$ssh_quarks_two 'docker exec -e "CORE_PEER_LOCALMSPID=Org2MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org2.example.com/msp" peer0.org2.example.com peer channel join -b channel-123.block'
$ssh_quarks_two 'docker exec -e "CORE_PEER_LOCALMSPID=Org3MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org3.example.com/msp" peer0.org3.example.com peer channel join -b channel-123.block'
$ssh_quarks_two 'docker exec -e "CORE_PEER_LOCALMSPID=Org3MSP" -e "CORE_PEER_MSPCONFIGPATH=/var/hyperledger/users/Admin@org3.example.com/msp" peer0.org3.example.com peer channel join -b channel-23.block'

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

destroy_network