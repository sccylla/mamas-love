#!/bin/sh
cd "$(dirname "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo 'Install the free Python 3 macOS installer from https://www.python.org/downloads/macos/ and open this file again.'
  read -r ignored
  exit 1
fi
python3 ./serve_studio.py
