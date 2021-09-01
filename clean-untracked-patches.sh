#!/bin/bash

set -e
shopt -s nullglob

SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

patches_cur=(*.patch)
if (( ${#patches_cur[@]} )); then
	git clean -f -X *.patch
else
	echo "No patch files in current directory. Exiting."
fi
