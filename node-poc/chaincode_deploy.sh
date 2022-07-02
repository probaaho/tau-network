#!/bin/bash

#./chaincode_deploy name version_integer action
#./chaincode_deploy mycc 0 init
#name version init/upgrade
#docker exec cli1 peer chaincode install -n mycc -p github.com/chaincode -v v0
#docker exec cli1 peer chaincode instantiate -o orderer0.example.com:7050 -C mychannel -n mycc github.com/chaincode -v v0 -c '{\"Args\": [\"a\", \"100\"]}'

quarks_one_ip=10.100.222.178
quarks_two_ip=10.100.222.179
project_path=/home/quarks/quarks-network/node-poc
project_chaincode_path=/home/quarks/quarks-network/node-poc/chaincode
project_docker_path=/home/quarks/quarks-network/node-poc/deployment

ssh_cmd='ssh -o StrictHostKeyChecking=no '
ssh_quarks_one="${ssh_cmd} quarks@${quarks_one_ip}"
ssh_quarks_two="${ssh_cmd} quarks@${quarks_two_ip}"
scp_cmd='scp -o StrictHostKeyChecking=no'

echo
echo "################### Initiating Chaincode Deployment ##################"

if  [ $# -eq 3 ]
then
    cc_name=$1
    cc_version=$2
    cc_action=$3

    ##chaincode install
    echo
    echo "######## Chaincode Install ###########"

    $ssh_quarks_one 'docker exec cli1 rm -rf /opt/gopath/src/github.com/chaincode'
    $ssh_quarks_two 'docker exec cli2 rm -rf /opt/gopath/src/github.com/chaincode'
    $ssh_quarks_two 'docker exec cli3 rm -rf /opt/gopath/src/github.com/chaincode'

    $ssh_quarks_one "cd $project_path && docker cp chaincode cli1:/opt/gopath/src/github.com/chaincode"
    $ssh_quarks_two "cd $project_path && docker cp chaincode cli2:/opt/gopath/src/github.com/chaincode"
    $ssh_quarks_two "cd $project_path && docker cp chaincode cli3:/opt/gopath/src/github.com/chaincode"

    $ssh_quarks_one "docker exec cli1 peer chaincode install -n $cc_name -p github.com/chaincode -v v$cc_version"
    $ssh_quarks_two "docker exec cli2 peer chaincode install -n $cc_name -p github.com/chaincode -v v$cc_version"
    $ssh_quarks_two "docker exec cli3 peer chaincode install -n $cc_name -p github.com/chaincode -v v$cc_version"

    echo
    echo "####### Chaincode Instantiate ########"
    
    if [ $cc_action = init ]
    then
        echo "### INIT ###"
        $ssh_quarks_one "docker exec cli1 peer chaincode instantiate -o orderer0.example.com:7050 -C channel-123 -n $cc_name github.com/chaincode -v v$cc_version -c '{\"Args\": [\"initLedger\"]}'"
        $ssh_quarks_one "docker exec cli1 peer chaincode instantiate -o orderer0.example.com:7050 -C channel-1 -n $cc_name github.com/chaincode -v v$cc_version -c '{\"Args\": [\"initLedger\"]}'"
        $ssh_quarks_two "docker exec cli2 peer chaincode instantiate -o orderer1.example.com:7050 -C channel-23 -n $cc_name github.com/chaincode -v v$cc_version -c '{\"Args\": [\"initLedger\"]}'"

    
    elif [ $cc_action = upgrade ]
    then
        echo "### UPGRADE ###"
        $ssh_quarks_one "docker exec cli1 peer chaincode upgrade -o orderer0.example.com:7050 -C channel-123 -n $cc_name github.com/chaincode -v v$cc_version -c '{\"Args\": [\"updateCC\"]}'"
        $ssh_quarks_one "docker exec cli1 peer chaincode upgrade -o orderer0.example.com:7050 -C channel-1 -n $cc_name github.com/chaincode -v v$cc_version -c '{\"Args\": [\"updateCC\"]}'"
        $ssh_quarks_two "docker exec cli2 peer chaincode upgrade -o orderer1.example.com:7050 -C channel-23 -n $cc_name github.com/chaincode -v v$cc_version -c '{\"Args\": [\"updateCC\"]}'"
    fi
fi