#!/bin/bash
cd /home/kavia/workspace/code-generation/investoptix-112485-da15660f/investoptix_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

