#!/bin/sh
# Volume Dockera nadpisuje /app/uploads i często jest własnością roota.
# Katalog musi być zapisywalny dla użytkownika spring zanim wstanie JVM.
set -eu
mkdir -p /app/uploads
if [ "$(id -u)" = "0" ]; then
  chown spring:spring /app/uploads
  exec gosu spring sh -c 'exec java $JAVA_OPTS -jar /app/app.jar'
fi
exec java $JAVA_OPTS -jar /app/app.jar
