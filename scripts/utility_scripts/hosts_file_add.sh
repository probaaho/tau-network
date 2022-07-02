#!/bin/bash
# ./bash_file_name.sh aspgamma.com 103.84.159.230

# PATH TO YOUR HOSTS FILE
ETC_HOSTS=/etc/hosts

# DEFAULT IP FOR HOSTNAME
IP=$2

# Hostname to add/remove.
HOSTNAME=$1

function removehost() {
    isInFile=$(cat /etc/hosts | grep -c "$HOSTNAME")
    if [ $isInFile -eq 0 ]
    then
        echo "$HOSTNAME was not found in your $ETC_HOSTS";
    else
        echo "$HOSTNAME Found in your $ETC_HOSTS, Removing now...";
        sudo sed -i".bak" "/$HOSTNAME/d" $ETC_HOSTS       
    fi
}

function addhost() {
    HOSTS_LINE="$IP $HOSTNAME"
    isInFile=$(cat /etc/hosts | grep -c "$HOSTNAME")
    if [ $isInFile -eq 0 ]
    then
        echo "Adding $HOSTNAME to your $ETC_HOSTS"
        echo $HOSTS_LINE
        sudo -- sh -c -e "echo '$HOSTS_LINE' >> /etc/hosts";
    else
        echo "$HOSTNAME already exists. Updating....."
        removehost
        addhost
    fi
}

addhost