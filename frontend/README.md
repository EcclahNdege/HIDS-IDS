# SecureWatch Frontend

A modern React-based frontend for the SecureWatch Network Intrusion Detection and Prevention System.

## Features

- **Real-time Dashboard**: Live system monitoring with WebSocket updates
- **Alert Management**: Comprehensive security alert handling and tracking
- **File Protection**: Monitor and protect critical files and directories
- **Network Security**: Firewall management and network packet monitoring
- **User Management**: Role-based access control with admin capabilities
- **Audit Logging**: Complete system event logging with commenting
- **Responsive Design**: Modern UI that works on all devices

## Technology Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **WebSocket** for real-time updates
- **Vite** for development and building

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API server running on port 8000

### Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API and WebSocket URLs
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## Environment Variables

Create a `.env` file in the frontend directory:

```bash
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

## API Integration

The frontend integrates with the backend through:

- **REST API**: All CRUD operations and data fetching
- **WebSocket**: Real-time updates for system status, alerts, and events
- **Authentication**: JWT-based authentication with automatic token management

### API Service

The `apiService` handles all backend communication:

```typescript
import { apiService } from './services/api';

// Authentication
await apiService.login(username, password);
await apiService.getCurrentUser();

// System data
await apiService.getSystemStatus();
await apiService.getAlerts();
await apiService.getProtectedFiles();
```

### WebSocket Service

Real-time updates are handled through WebSocket:

```typescript
import { webSocketService } from './services/websocket';

// Listen for events
webSocketService.on('system_status', handleSystemUpdate);
webSocketService.on('new_alert', handleNewAlert);
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Layout/         # Layout components (Header, Sidebar)
│   └── UI/             # Generic UI components
├── contexts/           # React contexts for state management
│   ├── AuthContext.tsx # Authentication state
│   └── SecurityContext.tsx # Security data state
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Alerts.tsx      # Alert management
│   ├── FileMonitoring.tsx # File protection
│   ├── NetworkMonitoring.tsx # Network monitoring
│   ├── Firewall.tsx    # Firewall management
│   ├── Quarantine.tsx  # Quarantined items
│   ├── Logs.tsx        # System logs
│   ├── UserManagement.tsx # User administration
│   └── Settings.tsx    # User settings
├── services/           # API and WebSocket services
│   ├── api.ts          # REST API service
│   └── websocket.ts    # WebSocket service
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
```

## Features Overview

### Authentication & Authorization

- **Initial Setup**: First-time admin account creation
- **Login System**: Secure JWT-based authentication
- **Role-based Access**: Admin and user roles with different permissions
- **Protected Routes**: Automatic redirection based on auth status

### Real-time Dashboard

- **System Metrics**: Live CPU, memory, and disk usage
- **Threat Level**: Current security status indicator
- **Recent Alerts**: Latest security incidents
- **Quick Stats**: Protection status and activity summary

### Alert Management

- **Alert Types**: Intrusion, file access, and network alerts
- **Severity Levels**: Critical, warning, and info classifications
- **Status Tracking**: Active, acknowledged, and resolved states
- **Filtering & Search**: Advanced filtering and search capabilities

### File Protection

- **File Monitoring**: Real-time file and directory monitoring
- **Protection Settings**: Configurable alert and auto-lock settings
- **File Status**: Protected, locked, and authorized states
- **Access Tracking**: Monitor access attempts and patterns

### Network Security

- **Firewall Rules**: Protocol-based access control
- **Packet Monitoring**: Real-time network packet analysis
- **Quarantine System**: Suspicious packet isolation
- **Traffic Analysis**: Network activity monitoring and reporting

### System Logging

- **Event Logging**: Comprehensive system event tracking
- **Log Categories**: System, security, user, and network events
- **Commenting**: Collaborative incident investigation
- **Search & Filter**: Advanced log analysis capabilities

### User Management (Admin Only)

- **User Creation**: Add new system users
- **Role Management**: Assign admin or user roles
- **Status Control**: Activate/deactivate user accounts
- **User Statistics**: Track user activity and status

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting (recommended)

### State Management

- **React Context** for global state management
- **Local State** for component-specific state
- **Real-time Updates** via WebSocket integration

## Building for Production

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Preview the build**:
   ```bash
   npm run preview
   ```

3. **Deploy**: The `dist` folder contains the production build

## WebSocket Events

The frontend listens for these WebSocket events:

- `system_status` - System metrics updates
- `new_alert` - New security alerts
- `file_event` - File system changes
- `network_event` - Network activity
- `new_log` - New log entries

## Error Handling

- **API Errors**: Graceful error handling with user feedback
- **Network Issues**: Automatic WebSocket reconnection
- **Authentication**: Automatic token refresh and logout
- **Loading States**: User-friendly loading indicators

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: Route-level access control
- **CORS Handling**: Proper cross-origin request handling
- **Input Validation**: Client-side input validation
- **XSS Protection**: Safe HTML rendering

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.