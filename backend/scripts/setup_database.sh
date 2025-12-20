#!/bin/bash

# Database setup script for SecureWatch
set -e

echo "Setting up SecureWatch database..."

# Default values
DB_NAME="securewatch"
DB_USER="securewatch"
DB_PASSWORD="password"
DB_HOST="localhost"
DB_PORT="5432"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Installing..."
    
    # Detect OS and install PostgreSQL
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y postgresql postgresql-contrib
        # CentOS/RHEL/Fedora
        elif command -v yum &> /dev/null; then
            sudo yum install -y postgresql-server postgresql-contrib
            sudo postgresql-setup initdb
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y postgresql-server postgresql-contrib
            sudo postgresql-setup --initdb
        fi
        
        # Start PostgreSQL service
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install postgresql
            brew services start postgresql
        else
            echo "Please install Homebrew first: https://brew.sh/"
            exit 1
        fi
    else
        echo "Unsupported operating system. Please install PostgreSQL manually."
        exit 1
    fi
fi

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null; then
    echo "Starting PostgreSQL service..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo systemctl start postgresql
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql
    fi
fi

# Create database and user
echo "Creating database and user..."

# Switch to postgres user and create database
sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
EOF

echo "Database setup completed!"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo ""
echo "Connection string: postgresql+asyncpg://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "Please update your .env file with these database credentials."