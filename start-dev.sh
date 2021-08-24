#!/bin/bash

if [ -z $1 ]; then
 echo "Please provide name of the server"
 exit 1
fi

read -r -d'\n' DIFF << END
diff -u a/package.json b/package.json
--- a/package.json	2020-05-08 13:08:21.835686654 +0200
+++ b/package.json	2020-05-08 13:09:02.621668251 +0200
@@ -67,5 +67,6 @@
     "not dead",
     "not ie <= 11",
     "not op_mini all"
-  ]
+  ],
+  "proxy":"http://${1}"
 }
END

echo "$DIFF" | patch -p1 

_term() { 
  echo "Caught SIGHUP signal!" 
  #kill -TERM "$child" 2>/dev/null
}

trap _term SIGINT

npm start

child=$! 
wait "$child" >& /dev/null

echo "$DIFF" | patch -R -p1 
rm package.json.orig package.json.rej -rf
