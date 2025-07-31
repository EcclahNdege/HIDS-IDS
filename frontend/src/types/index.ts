export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface Alert {
  id: string;
  type: 'intrusion' | 'file' | 'network';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  source: string;
  status: 'active' | 'resolved' | 'acknowledged';
  assignedTo?: string;
}

export interface SystemStatus {
  cpu: number;
  memory: number;
  disk: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  uptime: string;
  activeConnections: number;
  blockedThreats: number;
  quarantinedFiles: number;
}

export interface ProtectedFile {
  id: string;
  path: string;
  type?: 'file' | 'directory';
  status: 'protected' | 'locked' | 'authorized';
  lastAccessed?: string;
  accessAttempts: number;
  lockReason?: string;
  settings?: {
    alertOnRead?: boolean;
    alertOnWrite?: boolean;
    alertOnDelete?: boolean;
    autoLock?: boolean;
  };
}

export interface NetworkRule {
  id: string;
  protocol: 'TCP' | 'UDP' | 'ICMP';
  port: string;
  action: 'allow' | 'deny' | 'quarantine';
  source?: string;
  description: string;
  isActive: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  category: 'system' | 'security' | 'user' | 'network';
  message: string;
  details?: string;
  user?: string;
  comments: LogComment[];
}

export interface LogComment {
  id: string;
  userId: string;
  username: string;
  comment: string;
  timestamp: string;
}

export interface NotificationSettings {
  dashboard: boolean;
  email: boolean;
  emailAddress?: string;
  alertTypes: {
    intrusion: boolean;
    fileAccess: boolean;
    networkThreats: boolean;
    systemAlerts: boolean;
  };
}