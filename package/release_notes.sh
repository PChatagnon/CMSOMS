#!/bin/bash

t2=HEAD
tp=`git describe --tags --abbrev=0`

t=0
for t1 in `git tag | tac`; do 

  c=`git --no-pager log ${t1}..${t2} --pretty=format:"%h %s" | wc -c`

  if [[ $t -ne 0 || "$t2" == "$tp" ]]; then
    if [[ $c -gt 0 ]]; then

      echo
      echo "$t2"
      echo
      git --no-pager log ${t1}..${t2} --pretty=format:"%h %s"
      echo

    fi
    t=1
  fi

  t2="${t1}"

done
