# SecureWatch Backend

A comprehensive Network Intrusion Detection and Prevention System backend built with Python, FastAPI, and PostgreSQL.

## Features

- **Real-time System Monitoring**: CPU, memory, disk usage monitoring with WebSocket updates
- **File Integrity Monitoring**: Real-time file system monitoring with protection and quarantine
- **Network Security**: Network packet monitoring, firewall management, and intrusion detection
- **User Management**: Role-based access control with admin and user roles
- **Alert System**: Real-time security alerts with severity levels and status tracking
- **Audit Logging**: Comprehensive system and security event logging
- **RESTful API**: Complete REST API for all security operations
- **WebSocket Support**: Real-time updates to frontend clients

## Requirements

- Python 3.8+
- PostgreSQL 12+
- Linux operating system (Ubuntu, CentOS, RHEL, Fedora)
- Root/sudo access for system monitoring

## Quick Start

1. **Clone and setup**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Setup database**:
   ```bash
   chmod +x scripts/setup_database.sh
   ./scripts/setup_database.sh
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start the server**:
   ```bash
   python run.py
   ```

The backend will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## Architecture

### Core Components

- **FastAPI Application**: Main web framework with async support
- **PostgreSQL Database**: Data persistence with SQLAlchemy ORM
- **WebSocket Manager**: Real-time communication with frontend
- **System Monitor**: Continuous system metrics collection
- **File Monitor**: Real-time file system change detection
- **Network Monitor**: Network traffic and intrusion detection

### Database Schema

- **Users**: Authentication and authorization
- **Alerts**: Security alerts and incidents
- **Protected Files**: File integrity monitoring
- **Network Rules**: Firewall and network policies
- **System Logs**: Audit trail and system events
- **Quarantined Packets**: Network threat containment

### Monitoring Services

1. **System Monitor** (`app/services/system_monitor.py`):
   - CPU, memory, disk usage tracking
   - System health alerts
   - Performance metrics collection

2. **File Monitor** (`app/services/file_monitor.py`):
   - Real-time file system monitoring
   - File integrity checking
   - Automatic threat response

3. **Network Monitor** (`app/services/network_monitor.py`):
   - Network packet analysis
   - Intrusion detection
   - Firewall rule enforcement

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/securewatch
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=securewatch
DATABASE_USER=securewatch
DATABASE_PASSWORD=password

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
DEBUG=True
HOST=0.0.0.0
PORT=8000

# File Storage
FILES_DIR=files
QUARANTINE_DIR=files/quarantine
LOGS_DIR=files/logs

# Monitoring
SYSTEM_CHECK_INTERVAL=60
```

### System Scripts

The backend includes bash scripts for system-level operations:

- `scripts/setup_database.sh`: Database setup and configuration
- `scripts/system_monitor.sh`: System metrics collection
- `scripts/network_monitor.sh`: Network monitoring and analysis
- `scripts/file_monitor.sh`: File system monitoring and integrity

## API Endpoints

### Authentication
- `POST /api/auth/token` - Login and get access token
- `POST /api/auth/setup` - Initial admin setup
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/check-setup` - Check if setup is needed

### System Monitoring
- `GET /api/system/status` - Get current system status
- `GET /api/system/info` - Get system information

### Alerts
- `GET /api/alerts/` - List alerts with filtering
- `POST /api/alerts/` - Create new alert
- `GET /api/alerts/{id}` - Get specific alert
- `PATCH /api/alerts/{id}` - Update alert
- `POST /api/alerts/{id}/acknowledge` - Acknowledge alert
- `POST /api/alerts/{id}/resolve` - Resolve alert

### File Protection
- `GET /api/files/protected` - List protected files
- `POST /api/files/protected` - Add file protection
- `GET /api/files/protected/{id}` - Get protected file details
- `PATCH /api/files/protected/{id}` - Update file settings
- `DELETE /api/files/protected/{id}` - Remove protection
- `POST /api/files/protected/{id}/lock` - Lock file
- `POST /api/files/protected/{id}/unlock` - Unlock file

### Network Security
- `GET /api/network/rules` - List network rules
- `POST /api/network/rules` - Create network rule
- `GET /api/network/rules/{id}` - Get network rule
- `PATCH /api/network/rules/{id}` - Update network rule
- `DELETE /api/network/rules/{id}` - Delete network rule
- `GET /api/network/quarantined` - List quarantined packets
- `POST /api/network/quarantined/{id}/release` - Release packet
- `DELETE /api/network/quarantined/{id}` - Delete packet

### Logging
- `GET /api/logs/` - List system logs
- `POST /api/logs/` - Create log entry
- `GET /api/logs/{id}` - Get specific log
- `POST /api/logs/{id}/comments` - Add comment to log

### User Management
- `GET /api/users/` - List users (admin only)
- `POST /api/users/` - Create user (admin only)
- `GET /api/users/{id}` - Get user details
- `PATCH /api/users/{id}/role` - Update user role
- `PATCH /api/users/{id}/status` - Toggle user status

## WebSocket Events

The backend sends real-time updates via WebSocket:

- `system_status` - System metrics updates
- `new_alert` - New security alerts
- `file_event` - File system changes
- `network_event` - Network activity
- `new_log` - New log entries

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (admin/user)
- Secure password hashing with bcrypt

### File Protection
- Real-time file system monitoring
- Automatic file locking on suspicious activity
- File quarantine system
- Integrity baseline creation and checking

### Network Security
- Real-time network packet monitoring
- Configurable firewall rules
- Automatic threat detection and response
- Network packet quarantine

### System Monitoring
- Continuous system health monitoring
- Automatic alert generation for resource issues
- Performance metrics collection
- System uptime tracking

## Development

### Running in Development Mode

```bash
# Set debug mode
export DEBUG=True

# Start with auto-reload
python run.py
```

### Database Migrations

The application automatically creates database tables on startup. For production deployments, consider using Alembic for database migrations.

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## Deployment

### Production Setup

1. **System Requirements**:
   ```bash
   # Install system dependencies
   sudo apt-get update
   sudo apt-get install -y postgresql postgresql-contrib python3-pip python3-venv
   ```

2. **Application Setup**:
   ```bash
   # Create virtual environment
   python3 -m venv venv
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Setup database
   ./scripts/setup_database.sh
   ```

3. **Service Configuration**:
   Create a systemd service file for production deployment:
   ```ini
   [Unit]
   Description=SecureWatch Backend
   After=network.target postgresql.service
   
   [Service]
   Type=simple
   User=securewatch
   WorkingDirectory=/opt/securewatch/backend
   Environment=PATH=/opt/securewatch/backend/venv/bin
   ExecStart=/opt/securewatch/backend/venv/bin/python run.py
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "run.py"]
```

## Monitoring & Logging

The backend provides comprehensive logging and monitoring:

- **Application Logs**: Structured logging with different levels
- **System Metrics**: Real-time system performance monitoring
- **Security Events**: All security-related events are logged
- **Audit Trail**: Complete audit trail of user actions

## Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Run `./scripts/setup_database.sh`

2. **Permission Denied Errors**:
   - Ensure the application has necessary system permissions
   - Some monitoring features require root/sudo access

3. **Missing System Tools**:
   - Install required system tools: `netstat`, `ps`, `df`, `free`
   - On Ubuntu: `sudo apt-get install net-tools procps`

4. **WebSocket Connection Issues**:
   - Check firewall settings
   - Ensure port 8000 is accessible
   - Verify CORS configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.