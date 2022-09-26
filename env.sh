#!/bin/bash
envFile="$PWD/.env"
outputFile="$PWD/env-config.js"
if [ -n "$1" ]; then 
  envFile="$PWD/$1/.env"
  outputFile="$PWD/$1/env-config.js"
fi
# Recreate config file
rm -rf $outputFile
touch $outputFile

# Add assignment 
echo "window._env_ = {" >> $outputFile

# Read each line in .env file
# Each line represents key=value pairs
while read -r line || [[ -n "$line" ]];
do
  # Split env variables by character `=`
  if printf '%s\n' "$line" | grep -q -e '='; then
    varname=$(printf '%s\n' "$line" | sed -e 's/=.*//')
    varvalue=$(printf '%s\n' "$line" | sed -e 's/^[^=]*=//')
  fi

  # Read value of current variable if exists as Environment variable
  value=$(printf '%s\n' "${!varname}")
  # Otherwise use value from .env file
  [[ -z $value ]] && value=${varvalue}
  
  # Append configuration property to JS file
  echo "  $varname: \"$value\"," >> $outputFile
done < $envFile

echo "}" >> $outputFile