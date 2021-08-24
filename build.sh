#!/bin/bash

#exit if any command fails
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

VER=`git describe --tags | sed 's/^v//' | awk '{split($0,a,"-"); print a[1]}'`
REL=`git rev-list HEAD | wc -l | tr -d ' '`
TIM="`date -u +\"%F %T %Z\"`"
#PCR="`logname`"

echo "REACT_APP_VERSION=$VER" >.env
echo "REACT_APP_RELEASE=$REL" >>.env
echo "REACT_APP_TIME=$TIM" >>.env

echo "Running yarn install --frozen-lockfile. If this fails, run 'yarn install' and commit updated yarn.lock"
yarn install --frozen-lockfile
npm run build

./package/release_notes.sh >build/release-notes.txt
