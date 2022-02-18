# oms-portal-gui

[![pipeline status](https://gitlab.cern.ch/cmsoms/portal-gui/badges/master/pipeline.svg)](https://gitlab.cern.ch/cmsoms/portal-gui/commits/master)
[![coverage report](https://gitlab.cern.ch/cmsoms/portal-gui/badges/master/coverage.svg)](https://gitlab.cern.ch/cmsoms/portal-gui/commits/master)

WBM upgrade: OMS Portal GUI

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).


Development Environment Setup instructions can be found [here](https://gitlab.cern.ch/cmsoms/portal-gui/wikis/Development-Environment-Setup).

Development instructions - [here](https://gitlab.cern.ch/cmsoms/portal-gui/wikis/GUI-Developer-Guide).


Install dependences
```
yarn install
```

Run application
```
npm start
```

Inspect src/setupProxy.js for routing configuration.


Run unit tests
```
npm test a
```

Run selenium tests
```
npm run nightwatch
```

To deploy
```
./build.sh
./package.sh
```
To install on vocms0167
```
sudo rpm -qa | grep oms
sudo rpm -e -all oms-portal-gui
sudo rpm -i oms-portal-gui-%{_version}-22.x86_64.rpm

```
