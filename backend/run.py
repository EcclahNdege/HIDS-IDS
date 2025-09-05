#!/usr/bin/env python3
"""
SecureWatch Backend Runner
This script starts the SecureWatch backend server
"""

import os
import sys
import subprocess
import asyncio
from pathlib import Path

def check_dependencies():
    """Check if all required dependencies are installed"""
    try:
        import fastapi
        import uvicorn
        import psycopg2
        import sqlalchemy
        import psutil
        print("✓ All Python dependencies are installed")
        return True
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def check_database():
    """Check if PostgreSQL is running and database exists"""
    try:
        import psycopg2
        from dotenv import load_dotenv
        
        load_dotenv()
        
        # Try to connect to database
        conn = psycopg2.connect(
            host=os.getenv("DATABASE_HOST", "localhost"),
            port=os.getenv("DATABASE_PORT", "5432"),
            database=os.getenv("DATABASE_NAME", "securewatch"),
            user=os.getenv("DATABASE_USER", "securewatch"),
            password=os.getenv("DATABASE_PASSWORD", "password")
        )
        conn.close()
        print("✓ Database connection successful")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        print("Please run: ./scripts/setup_database.sh")
        return False

def setup_directories():
    """Create necessary directories"""
    directories = [
        "files",
        "files/quarantine",
        "files/logs"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✓ Created directory: {directory}")

def check_system_tools():
    """Check if required system tools are available"""
    tools = ["netstat", "ps", "df", "free"]
    missing_tools = []
    
    for tool in tools:
        if subprocess.run(["which", tool], capture_output=True).returncode != 0:
            missing_tools.append(tool)
    
    if missing_tools:
        print(f"✗ Missing system tools: {', '.join(missing_tools)}")
        print("Please install the missing tools using your package manager")
        return False
    else:
        print("✓ All required system tools are available")
        return True

def main():
    """Main function to start the backend"""
    print("SecureWatch Backend Startup")
    print("=" * 40)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check system tools
    if not check_system_tools():
        sys.exit(1)
    
    # Setup directories
    setup_directories()
    
    # Check database (optional - will work without it initially)
    database_ok = check_database()
    if not database_ok:
        print("⚠ Database not available - some features may not work")
        print("Run ./scripts/setup_database.sh to set up the database")
    
    print("\n" + "=" * 40)
    print("Starting SecureWatch Backend...")
    print("=" * 40)
    
    # Start the server
    try:
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--host", os.getenv("HOST", "0.0.0.0"),
            "--port", os.getenv("PORT", "8000"),
            "--reload" if os.getenv("DEBUG", "False").lower() == "true" else "--no-reload"
        ])
    except KeyboardInterrupt:
        print("\nShutting down SecureWatch Backend...")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()