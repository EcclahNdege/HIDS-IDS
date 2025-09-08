import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert, SystemStatus, ProtectedFile, NetworkRule, LogEntry, NotificationSettings, QuarantinedPacket } from '../types';
import { apiService } from '../services/api';
import { webSocketService } from '../services/websocket';

interface SecurityContextType {
  // System Status
  systemStatus: SystemStatus;
  loading: boolean;
  
  // Alerts
  alerts: Alert[];
  networkAlerts: Alert[];
  unreadAlertsCount: number;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => Promise<void>;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  
  // Protected Files
  protectedFiles: ProtectedFile[];
  addProtectedFile: (path: string, type?: 'file' | 'directory') => Promise<void>;
  removeProtectedFile: (fileId: string) => void;
  lockFile: (fileId: string, reason: string) => void;
  authorizeFile: (fileId: string) => void;
  updateFileSettings: (fileId: string, settings: any) => void;
  
  // Network Rules
  networkRules: NetworkRule[];
  firewallRules: NetworkRule[];
  firewallPolicy: 'allow_all' | 'deny_all' | 'custom';
  suspiciousPacketAction: 'allow_notify' | 'quarantine' | 'reject';
  quarantinedPackets: QuarantinedPacket[];
  addNetworkRule: (rule: Omit<NetworkRule, 'id'>) => Promise<void>;
  updateNetworkRule: (ruleId: string, updates: Partial<NetworkRule>) => void;
  updateFirewallRule: (ruleId: string, updates: Partial<NetworkRule>) => void;
  setFirewallPolicy: (policy: 'allow_all' | 'deny_all' | 'custom') => void;
  updateSuspiciousPacketAction: (action: 'allow_notify' | 'quarantine' | 'reject') => void;
  deleteNetworkRule: (ruleId: string) => void;
  
  // Logs
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp' | 'comments'>) => Promise<void>;
  addLogComment: (logId: string, comment: string, userId: string, username: string) => void;
  
  // Notifications
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);


export const SecurityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    cpu: 0,
    memory: 0,
    disk: 0,
    threatLevel: 'low',
    uptime: '0m',
    activeConnections: 0,
    blockedThreats: 0,
    quarantinedFiles: 0
  });
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [networkAlerts, setNetworkAlerts] = useState<Alert[]>([]);
  const [protectedFiles, setProtectedFiles] = useState<ProtectedFile[]>([]);
  const [networkRules, setNetworkRules] = useState<NetworkRule[]>([]);
  const [firewallRules, setFirewallRules] = useState<NetworkRule[]>([]);
  const [firewallPolicy, setFirewallPolicy] = useState<'allow_all' | 'deny_all' | 'custom'>('custom');
  const [suspiciousPacketAction, setSuspiciousPacketAction] = useState<'allow_notify' | 'quarantine' | 'reject'>('quarantine');
  const [quarantinedPackets, setQuarantinedPackets] = useState<QuarantinedPacket[]>([]);
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

  // Initialize data and WebSocket connections
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load initial data
        const [
          systemStatusData,
          alertsData,
          protectedFilesData,
          networkRulesData,
          quarantinedData,
          logsData
        ] = await Promise.all([
          apiService.getSystemStatus(),
          apiService.getAlerts(),
          apiService.getProtectedFiles(),
          apiService.getNetworkRules(),
          apiService.getQuarantinedPackets(),
          apiService.getLogs({ limit: 50 })
        ]);

        setSystemStatus(systemStatusData);
        setAlerts(alertsData);
        setNetworkAlerts(alertsData.filter((alert: Alert) => alert.type === 'network'));
        setProtectedFiles(protectedFilesData);
        setNetworkRules(networkRulesData);
        setFirewallRules(networkRulesData);
        setQuarantinedPackets(quarantinedData);
        setLogs(logsData);
      } catch (error) {
        console.error('Failed to initialize security data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Setup WebSocket event handlers
    const handleSystemStatus = (data: SystemStatus) => {
      setSystemStatus(data);
    };

    const handleNewAlert = (data: Alert) => {
      setAlerts(prev => [data, ...prev]);
      if (data.type === 'network') {
        setNetworkAlerts(prev => [data, ...prev]);
      }
    };

    const handleFileEvent = (data: any) => {
      // Refresh protected files when file events occur
      apiService.getProtectedFiles().then(setProtectedFiles).catch(console.error);
    };

    const handleNetworkEvent = (data: any) => {
      // Handle network events
      console.log('Network event:', data);
    };

    const handleNewLog = (data: LogEntry) => {
      setLogs(prev => [data, ...prev.slice(0, 49)]);
    };

    webSocketService.on('system_status', handleSystemStatus);
    webSocketService.on('new_alert', handleNewAlert);
    webSocketService.on('file_event', handleFileEvent);
    webSocketService.on('network_event', handleNetworkEvent);
    webSocketService.on('new_log', handleNewLog);

    return () => {
      webSocketService.off('system_status', handleSystemStatus);
      webSocketService.off('new_alert', handleNewAlert);
      webSocketService.off('file_event', handleFileEvent);
      webSocketService.off('network_event', handleNetworkEvent);
      webSocketService.off('new_log', handleNewLog);
    };
  }, []);

  const unreadAlertsCount = alerts.filter(alert => alert.status === 'active').length;

  const addAlert = async (alertData: Omit<Alert, 'id' | 'timestamp'>) => {
    try {
      const newAlert = await apiService.createAlert(alertData);
      setAlerts(prev => [newAlert, ...prev]);
      if (newAlert.type === 'network') {
        setNetworkAlerts(prev => [newAlert, ...prev]);
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await apiService.acknowledgeAlert(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
      ));
      setNetworkAlerts(networkAlerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await apiService.resolveAlert(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      ));
      setNetworkAlerts(networkAlerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      ));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const addProtectedFile = async (path: string, type: 'file' | 'directory' = 'file') => {
    try {
      const newFile = await apiService.addProtectedFile({
        path,
        file_type: type,
        alert_on_read: true,
        alert_on_write: true,
        alert_on_delete: true,
        auto_lock: false
      });
      setProtectedFiles(prev => [...prev, newFile]);
    } catch (error) {
      console.error('Failed to add protected file:', error);
    }
  };

  const removeProtectedFile = async (fileId: string) => {
    try {
      await apiService.removeProtectedFile(fileId);
      setProtectedFiles(protectedFiles.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Failed to remove protected file:', error);
    }
  };

  const lockFile = async (fileId: string, reason: string) => {
    try {
      await apiService.lockFile(fileId, reason);
      setProtectedFiles(protectedFiles.map(file =>
        file.id === fileId ? { ...file, status: 'locked', lockReason: reason } : file
      ));
    } catch (error) {
      console.error('Failed to lock file:', error);
    }
  };

  const authorizeFile = async (fileId: string) => {
    try {
      await apiService.unlockFile(fileId);
      setProtectedFiles(protectedFiles.map(file =>
        file.id === fileId ? { ...file, status: 'authorized', lockReason: undefined } : file
      ));
    } catch (error) {
      console.error('Failed to authorize file:', error);
    }
  };

  const updateFileSettings = async (fileId: string, settings: any) => {
    try {
      await apiService.updateProtectedFile(fileId, settings);
      setProtectedFiles(protectedFiles.map(file =>
        file.id === fileId ? { ...file, settings } : file
      ));
    } catch (error) {
      console.error('Failed to update file settings:', error);
    }
  };

  const addNetworkRule = async (ruleData: Omit<NetworkRule, 'id'>) => {
    try {
      const newRule = await apiService.createNetworkRule(ruleData);
      setNetworkRules(prev => [...prev, newRule]);
      setFirewallRules(prev => [...prev, newRule]);
    } catch (error) {
      console.error('Failed to create network rule:', error);
    }
  };

  const updateNetworkRule = async (ruleId: string, updates: Partial<NetworkRule>) => {
    try {
      await apiService.updateNetworkRule(ruleId, updates);
      setNetworkRules(networkRules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ));
    } catch (error) {
      console.error('Failed to update network rule:', error);
    }
  };

  const updateFirewallRule = async (ruleId: string, updates: Partial<NetworkRule>) => {
    try {
      await apiService.updateNetworkRule(ruleId, updates);
      setFirewallRules(firewallRules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ));
    } catch (error) {
      console.error('Failed to update firewall rule:', error);
    }
  };

  const updateSuspiciousPacketAction = (action: 'allow_notify' | 'quarantine' | 'reject') => {
    setSuspiciousPacketAction(action);
  };

  const deleteNetworkRule = async (ruleId: string) => {
    try {
      await apiService.deleteNetworkRule(ruleId);
      setNetworkRules(networkRules.filter(rule => rule.id !== ruleId));
      setFirewallRules(firewallRules.filter(rule => rule.id !== ruleId));
    } catch (error) {
      console.error('Failed to delete network rule:', error);
    }
  };

  const addLog = async (logData: Omit<LogEntry, 'id' | 'timestamp' | 'comments'>) => {
    try {
      const newLog = await apiService.createLog(logData);
      setLogs(prev => [{ ...newLog, comments: [] }, ...prev]);
    } catch (error) {
      console.error('Failed to create log:', error);
    }
  };

  const addLogComment = async (logId: string, comment: string, userId: string, username: string) => {
    try {
      const newComment = await apiService.addLogComment(logId, comment);
      setLogs(logs.map(log =>
        log.id === logId ? { ...log, comments: [...log.comments, newComment] } : log
      ));
    } catch (error) {
      console.error('Failed to add log comment:', error);
    }
  };

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...settings }));
  };

  return (
    <SecurityContext.Provider value={{
      systemStatus,
      loading,
      alerts,
      networkAlerts,
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
      firewallRules,
      firewallPolicy,
      suspiciousPacketAction,
      quarantinedPackets,
      addNetworkRule,
      updateNetworkRule,
      updateFirewallRule,
      setFirewallPolicy,
      updateSuspiciousPacketAction,
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