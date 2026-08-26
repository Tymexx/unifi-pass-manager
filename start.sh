#!/bin/bash
echo "Starting Unifi Password Manager Backend..."
cd server && npm start &
BACKEND_PID=$!

echo "Starting Unifi Password Manager Frontend..."
cd client && npm run dev &
FRONTEND_PID=$!

echo "Both services are starting..."
echo "Backend: http://localhost:3050"
echo "Frontend: http://localhost:5180"
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
