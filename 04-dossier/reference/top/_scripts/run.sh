#!/bin/zsh
cd /Users/nazarakanov/development/dossier/reference/top/_scripts
cat list.txt | xargs -P 4 -L 1 sh -c 'perl -e "alarm 260; exec @ARGV" node cap.mjs "$0" "$1" 6000 7 > logs/$0.log 2>&1; python3 sheet.py ../shots/$0 >> logs/$0.log 2>&1; echo "$0 finished"'
