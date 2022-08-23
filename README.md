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


Open tunnels to CERN and tracker API

```
#In a new terminal
ssh -l 'your CERN username' lxplus.cern.ch -L 2080:vocms0184.cern.ch:80
#In a new terminal
ssh -l 'your CERN username' lxplus.cern.ch -L 9091:dbloader-tracker:8113 

```

To run OMS locally
```
cd 'project folder'
cp src/components/providers/Resthub_local.js  src/components/providers/Resthub.js
npm start
```

The app is configured to run on Chromium browser. To change this do:
```
#In package.json
#Modify the line BROWSER='chromium-browser' in

"scripts": {
    "analyze": "source-map-explorer 'build/static/js/*.js'",
    "start": "BROWSER='chromium-browser' react-scripts start",
    ...
  },
```

To build the project, you first have to modify the src/components/providers/Resthub.js file, and run the build script as follow:
```
#Set the right Restub configuration
cp src/components/providers/Resthub_usual.js  src/components/providers/Resthub.js

#Build the project
./build.sh
./package.sh
```

To deploy the app on vocms0167, do:
```
#The .rpm used to deploy the project is found in your machine in:
# rpmbuild/RPMS/x86_64

#Copy the .rpm to cern via scp or cernbox

#connect to vocms0167
ssh vocms0167

#Deploy the project
#First remove the old version
sudo rpm -e -all oms-portal-gui
#Install the app as:
sudo rpm -i 'your app.rpm'
```

