#!/bin/bash -x

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUILD_DIR="${DIR}/rpmbuild"
cd $DIR

VER=`git describe --tags | sed 's/^v//' | awk '{split($0,a,"-"); print a[1]}'`
REL=`git rev-list HEAD | wc -l | tr -d ' '`
TIM="`date -u +\"%F %T %Z\"`"
PCR="`logname`"

echo "Version $VER, release $REL"

rm -fR ${BUILD_DIR}/SOURCES
mkdir -p ${BUILD_DIR}/SOURCES

#add highcharts exporting libraries
rm -rf -p ${DIR}/build/node_modules/highcharts
mkdir -p ${DIR}/build/node_modules/highcharts
cp -R ${DIR}/node_modules/highcharts/lib ${DIR}/build/node_modules/highcharts/

#copy logout file for OpenID authentication
rm -rf build/logout.html
cp -R package/logout.html build/

cp -R ${DIR}/build ${BUILD_DIR}/SOURCES
mv ${BUILD_DIR}/SOURCES/build ${BUILD_DIR}/SOURCES/html
tar cf ${BUILD_DIR}/SOURCES/oms-portal-gui.tar -C ${BUILD_DIR}/SOURCES html
rm -fR ${BUILD_DIR}/SOURCES/html

RPM_OPTS=(--define "_topdir $BUILD_DIR" --define "_version $VER" --define "_release $REL" --define "_packager $PCR")
rpmbuild "${RPM_OPTS[@]}" -bb package/package.spec

