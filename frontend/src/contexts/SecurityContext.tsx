import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert, SystemStatus, ProtectedFile, NetworkRule, LogEntry, NotificationSettings } from '../types';

interface SecurityContextType {
  // System Status
  systemStatus: SystemStatus;
  
  // Alerts
  alerts: Alert[];
  unreadAlertsCount: number;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  
  // Protected Files
  protectedFiles: ProtectedFile[];
  addProtectedFile: (path: string) => void;
  removeProtectedFile: (fileId: string) => void;
  lockFile: (fileId: string, reason: string) => void;
  authorizeFile: (fileId: string) => void;
  
  // Network Rules
  networkRules: NetworkRule[];
  addNetworkRule: (rule: Omit<NetworkRule, 'id'>) => void;
  updateNetworkRule: (ruleId: string, updates: Partial<NetworkRule>) => void;
  deleteNetworkRule: (ruleId: string) => void;
  
  // Logs
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp' | 'comments'>) => void;
  addLogComment: (logId: string, comment: string, userId: string, username: string) => void;
  
  // Notifications
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

// Mock data for demonstration
const mockSystemStatus: SystemStatus = {
  cpu: 45,
  memory: 62,
  disk: 78,
  threatLevel: 'medium',
  uptime: '7d 14h 32m',
  activeConnections: 127,
  blockedThreats: 1543,
  quarantinedFiles: 7
};

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'intrusion',
    severity: 'critical',
    title: 'Multiple Failed Login Attempts',
    description: 'Detected 15 failed login attempts from IP 192.168.1.100',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    source: '192.168.1.100',
    status: 'active'
  },
  {
    id: '2',
    type: 'file',
    severity: 'warning',
    title: 'Unauthorized File Access',
    description: 'Attempt to access protected file /etc/passwd',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    source: 'user_john',
    status: 'acknowledged'
  },
  {
    id: '3',
    type: 'network',
    severity: 'info',
    title: 'Port Scan Detected',
    description: 'Port scanning activity detected from external IP',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    source: '203.0.113.42',
    status: 'resolved'
  },
  {
    id: '4',
    type: 'file',
    severity: 'critical',
    title: 'Protected File Modified',
    description: 'Unauthorized modification detected on /etc/hosts',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    source: 'system',
    status: 'active'
  },
  {
    id: '5',
    type: 'file',
    severity: 'warning',
    title: 'Directory Access Attempt',
    description: 'Unauthorized access attempt to protected directory /var/log',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    source: 'user_admin',
    status: 'resolved'
  }
];

const mockProtectedFiles: ProtectedFile[] = [
  {
    id: '1',
    path: '/etc/passwd',
    type: 'file',
    status: 'protected',
    accessAttempts: 3,
    lastAccessed: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    settings: {
      alertOnRead: true,
      alertOnWrite: true,
      alertOnDelete: true,
      autoLock: false
    }
  },
  {
    id: '2',
    path: '/etc/hosts',
    type: 'file',
    status: 'locked',
    accessAttempts: 7,
    lastAccessed: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    lockReason: 'Suspicious modification attempts detected',
    settings: {
      alertOnRead: true,
      alertOnWrite: true,
      alertOnDelete: true,
      autoLock: true
    }
  },
  {
    id: '3',
    path: '/var/log',
    type: 'directory',
    status: 'protected',
    accessAttempts: 1,
    lastAccessed: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    settings: {
      alertOnRead: false,
      alertOnWrite: true,
      alertOnDelete: true,
      autoLock: false
    }
  },
  {
    id: '4',
    path: '/home/admin/.ssh/authorized_keys',
    type: 'file',
    status: 'authorized',
    accessAttempts: 0,
    settings: {
      alertOnRead: true,
      alertOnWrite: true,
      alertOnDelete: true,
      autoLock: false
    }
  }
];

export const SecurityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(mockSystemStatus);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [protectedFiles, setProtectedFiles] = useState<ProtectedFile[]>(mockProtectedFiles);
  const [networkRules, setNetworkRules] = useState<NetworkRule[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    dashboard: true,
    email: false,
    alertTypes: {
      intrusion: true,
      fileAccess: true,
      networkThreats: true,
      systemAlerts: true
    }
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
        activeConnections: Math.max(0, prev.activeConnections + Math.floor((Math.random() - 0.5) * 20))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const unreadAlertsCount = alerts.filter(alert => alert.status === 'active').length;

  const addAlert = (alertData: Omit<Alert, 'id' | 'timestamp'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
    ));
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ));
  };

  const addProtectedFile = (path: string, type: 'file' | 'directory' = 'file') => {
    const newFile: ProtectedFile = {
      id: crypto.randomUUID(),
      path,
      status: 'protected',
      accessAttempts: 0,
      type
    };
    setProtectedFiles(prev => [...prev, newFile]);
  };

  const removeProtectedFile = (fileId: string) => {
    setProtectedFiles(protectedFiles.filter(file => file.id !== fileId));
  };

  const lockFile = (fileId: string, reason: string) => {
    setProtectedFiles(protectedFiles.map(file =>
      file.id === fileId ? { ...file, status: 'locked', lockReason: reason } : file
    ));
  };

  const authorizeFile = (fileId: string) => {
    setProtectedFiles(protectedFiles.map(file =>
      file.id === fileId ? { ...file, status: 'authorized' } : file
    ));
  };

  const updateFileSettings = (fileId: string, settings: any) => {
    setProtectedFiles(protectedFiles.map(file =>
      file.id === fileId ? { ...file, settings } : file
    ));
  };

  const addNetworkRule = (ruleData: Omit<NetworkRule, 'id'>) => {
    const newRule: NetworkRule = {
      ...ruleData,
      id: crypto.randomUUID()
    };
    setNetworkRules(prev => [...prev, newRule]);
  };

  const updateNetworkRule = (ruleId: string, updates: Partial<NetworkRule>) => {
    setNetworkRules(networkRules.map(rule =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const deleteNetworkRule = (ruleId: string) => {
    setNetworkRules(networkRules.filter(rule => rule.id !== ruleId));
  };

  const addLog = (logData: Omit<LogEntry, 'id' | 'timestamp' | 'comments'>) => {
    const newLog: LogEntry = {
      ...logData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      comments: []
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const addLogComment = (logId: string, comment: string, userId: string, username: string) => {
    const newComment = {
      id: crypto.randomUUID(),
      userId,
      username,
      comment,
      timestamp: new Date().toISOString()
    };
    
    setLogs(logs.map(log =>
      log.id === logId ? { ...log, comments: [...log.comments, newComment] } : log
    ));
  };

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...settings }));
  };

  return (
    <SecurityContext.Provider value={{
      systemStatus,
      alerts,
      unreadAlertsCount,
      addAlert,
      acknowledgeAlert,
      resolveAlert,
      protectedFiles,
      addProtectedFile,
      removeProtectedFile,
      lockFile,
      authorizeFile,
      networkRules,
      addNetworkRule,
      updateNetworkRule,
      deleteNetworkRule,
      logs,
      addLog,
      addLogComment,
      notificationSettings,
      updateNotificationSettings,
      updateFileSettings
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};