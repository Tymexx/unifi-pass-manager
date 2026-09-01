#!/bin/bash

# Navigate to the project directory
cd "$(dirname "$0")"

# Fetch latest changes from GitHub
git fetch

# Check if there are new updates available
HEADHASH=$(git rev-parse HEAD)
UPSTREAMHASH=$(git rev-parse @{u})

if [ "$HEADHASH" != "$UPSTREAMHASH" ]; then
    echo "New updates found! Pulling from GitHub..."
    
    # Pull the latest code
    git pull
    
    # Install any new backend dependencies
    cd server
    npm install
    
    # Restart the application
    pm2 restart unifi-pass-manager
    
    echo "Update complete and server restarted!"
else
    echo "Already up to date."
fi
