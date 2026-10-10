awk '/console.log\(`Skipping one-off event \$\{id\}, date is in the past.`\);/ {
  print;
  print "             // Auto-clean up stuck past events on boot";
  print "             const updatedEvents = getEvents().filter(e => e.id !== id);";
  print "             saveEvents(updatedEvents);";
  print "             console.log(`Automatically cleaned up expired one-off event ${id}`);";
  next
}1' server/scheduler.js > server/scheduler.js.tmp && mv server/scheduler.js.tmp server/scheduler.js
