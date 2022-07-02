#!/bin/bash
sudo apt-get -y update
sudo apt-get -y upgrade

cd ~/
wget https://golang.org/dl/go1.16.3.linux-amd64.tar.gz
sudo tar -xvf go1.16.3.linux-amd64.tar.gz
rm -rf go1.16.3.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo mv go /usr/local

echo export GOROOT=/usr/local/go | tee -a ~/.profile
echo export GOPATH=\$HOME/go | tee -a ~/.profile
echo export PATH=\$GOPATH/bin:\$GOROOT/bin:\$PATH | tee -a ~/.profile

## Add this in .bashrc
# export GOROOT=/usr/local/go
# export GOPATH=$HOME/go
# export PATH=$GOPATH/bin:$GOROOT/bin:$PATH