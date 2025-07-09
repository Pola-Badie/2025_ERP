#!/bin/bash
# Premier ERP Database Backup Script

# Configuration
BACKUP_DIR="/backups"
DB_NAME="premier_erp"
DB_USER="erp_user"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/premier_erp_backup_$TIMESTAMP.sql"
RETENTION_DAYS=7

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Starting database backup...${NC}"

# Perform backup
if PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h postgres -U $DB_USER -d $DB_NAME > $BACKUP_FILE; then
    # Compress backup
    gzip $BACKUP_FILE
    echo -e "${GREEN}✓ Backup created successfully: ${BACKUP_FILE}.gz${NC}"
    
    # Calculate size
    SIZE=$(du -h ${BACKUP_FILE}.gz | cut -f1)
    echo -e "${GREEN}✓ Backup size: $SIZE${NC}"
    
    # Remove old backups
    echo "Cleaning up old backups..."
    find $BACKUP_DIR -name "premier_erp_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo -e "${GREEN}✓ Old backups removed (older than $RETENTION_DAYS days)${NC}"
    
    # List current backups
    echo -e "\nCurrent backups:"
    ls -lh $BACKUP_DIR/premier_erp_backup_*.sql.gz 2>/dev/null | tail -5
    
    exit 0
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi