#!/bin/bash
# back-up-uacas.sh
# Local Database Backup Script for On-Premise Installations

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
CONTAINER_NAME="uacas-db-1"

mkdir -p $BACKUP_DIR

echo "--- UACAS Enterprise Backup Started ($TIMESTAMP) ---"

# If running with Docker
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    docker exec $CONTAINER_NAME pg_dumpall -U uacas > $BACKUP_DIR/uacas_full_backup_$TIMESTAMP.sql
    echo "Backup saved to $BACKUP_DIR/uacas_full_backup_$TIMESTAMP.sql"
else
    echo "Error: Database container not found. Ensure Docker is running."
    exit 1
fi

echo "--- Backup Complete ---"
