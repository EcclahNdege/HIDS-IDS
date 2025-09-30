import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert, SystemStatus, ProtectedFile, NetworkRule, LogEntry, NotificationSettings, QuarantinedPacket, FirewallRule } from '../types';
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
  
  // Firewall Status and Control
  firewallStatus: { enabled: boolean; status: string } | null;
  enableFirewall: () => Promise<void>;
  disableFirewall: () => Promise<void>;
  reloadFirewall: () => Promise<void>;
  
  // Network Rules
  networkRules: NetworkRule[];
  firewallRules: FirewallRule[];
  firewallPolicy: 'allow_all' | 'deny_all' | 'custom';
  suspiciousPacketAction: 'allow_notify' | 'quarantine' | 'reject';
  quarantinedPackets: QuarantinedPacket[];
  addNetworkRule: (rule: Omit<NetworkRule, 'id'>) => Promise<void>;
  updateNetworkRule: (ruleId: string, updates: Partial<NetworkRule>) => void;
  updateFirewallRule: (ruleId: string, updates: Partial<NetworkRule>) => void;
  setFirewallPolicy: (policy: 'allow_all' | 'deny_all' | 'custom') => void;
  updateSuspiciousPacketAction: (action: 'allow_notify' | 'quarantine' | 'reject') => void;
  deleteNetworkRule: (ruleId: string) => void;
  
  // IP/Port/Protocol Management
  allowIp: (ip: string) => Promise<void>;
  blockIp: (ip: string) => Promise<void>;
  removeIp: (ip: string) => Promise<void>;
  allowPort: (port: string | number) => Promise<void>;
  blockPort: (port: string | number) => Promise<void>;
  removePort: (port: string | number) => Promise<void>;
  allowProtocol: (protocol: string) => Promise<void>;
  blockProtocol: (protocol: string) => Promise<void>;
  removeProtocol: (protocol: string) => Promise<void>;
  removeRule: (number: number) => Promise<void>;
  
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
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([]);
  const [firewallStatus, setFirewallStatus] = useState<{ enabled: boolean; status: string } | null>(null);
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
        const [
          systemStatusData,
          alertsData,
          protectedFilesData,
          networkRulesData,
          firewallStatusData,
          logsData
        ] = await Promise.all([
          apiService.getSystemStatus(),
          apiService.getAlerts(),
          apiService.getProtectedFiles(),
          apiService.getFirewallRules(),
          apiService.getFirewallStatus(),
          apiService.getLogs({ limit: 50 })
        ]);

        setSystemStatus(systemStatusData);
        setAlerts(alertsData);
        setNetworkAlerts(alertsData.filter((alert: Alert) => alert.type === 'network'));
        setProtectedFiles(protectedFilesData);
        setNetworkRules(networkRulesData);
        setFirewallRules(networkRulesData);
        setFirewallStatus(firewallStatusData);
        setLogs(logsData);
      } catch (error) {
        console.error('Failed to initialize security data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

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
      apiService.getProtectedFiles().then(setProtectedFiles).catch(console.error);
    };

    const handleNetworkEvent = (data: any) => {
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

  // Firewall Control Functions
  const enableFirewall = async () => {
    try {
      await apiService.enableFirewall();
      const status = await apiService.getFirewallStatus();
      setFirewallStatus(status);
    } catch (error) {
      console.error('Failed to enable firewall:', error);
      throw error;
    }
  };

  const disableFirewall = async () => {
    try {
      await apiService.disableFirewall();
      const status = await apiService.getFirewallStatus();
      setFirewallStatus(status);
    } catch (error) {
      console.error('Failed to disable firewall:', error);
      throw error;
    }
  };

  const reloadFirewall = async () => {
    try {
      await apiService.reloadFirewall();
      const [status, rules] = await Promise.all([
        apiService.getFirewallStatus(),
        apiService.getFirewallRules()
      ]);
      setFirewallStatus(status);
      setNetworkRules(rules);
      setFirewallRules(rules);
    } catch (error) {
      console.error('Failed to reload firewall:', error);
      throw error;
    }
  };

  // IP Management
  const allowIp = async (ip: string) => {
    try {
      await apiService.allowIp(ip);
      const updatedRules = await apiService.getFirewallRules();
      setNetworkRules(updatedRules);
      setFirewallRules(updatedRules);
    } catch (error) {
      console.error('Failed to allow IP:', error);
      throw error;
    }
  };

  const blockIp = async (ip: string) => {
    try {
      await apiService.blockIp(ip);
      const updatedRules = await apiService.getFirewallRules();
      setNetworkRules(updatedRules);
      setFirewallRules(updatedRules);
    } catch (error) {
      console.error('Failed to block IP:', error);
      throw error;
    }
  };

  const removeIp = async (ip: string) => {
    try {
      await apiService.removeIp(ip);
      const updatedRules = await apiService.getFirewallRules();
      setNetworkRules(updatedRules);
      setFirewallRules(updatedRules);
    } catch (error) {
      console.error('Failed to remove IP:', error);
      throw error;
    }
  };

  // Port Management
  const allowPort = async (port: string | number) => {
    try {
      await apiService.allowPort(port);
      const updatedRules = await apiService.getFirewallRules();
      setNetworkRules(updatedRules);
      setFirewallRules(updatedRules);
    } catch (error) {
      console.error('Failed to allow port:', error);
      throw error;
    }
  };

  const blockPort = async (port: string | number) => {
    try {
      await apiService.blockPort(port);
      const updatedRules = await apiService.getFirewallRules();
      setNetworkRules(updatedRules);
      setFirewallRules(updatedRules);
    } catch (error) {
      console.error('Failed to block port:', error);
      throw error;
    }
  };

  const removePort = async (port: string | number) => {
    try {
      await apiService.removePort(port);
      const updatedRules = await apiService.getFirewallRules();
      setNetworkRules(updatedRules);
      setFirewallRules(updatedRules);
    } catch (error) {
      console.error('Failed to remove port:', error);
      throw error;
    }
  };

  // Protocol Management
  const allowProtocol = async (protocol: string) => {
    try {
      await apiService.allowProtocol(protocol);
      const updatedRules = await apiService.getFirewallRules();
      setNetworkRules(updatedRules);
      setFirewallRules(updatedRules);
    } catch (error) {
      console.error('Failed to allow protocol:', error);
      throw error;
    }
  };

  const blockProtocol = async (protocol: string) => {
    try {
      await apiService.blockProtocol(protocol);
      const updatedRules = await apiService.getFirewallRules();
      setNetworkRules(updatedRules);
      setFirewallRules(updatedRules);
    } catch (error) {
      console.error('Failed to block protocol:', error);
      throw error;
    }
  };

  const removeProtocol = async (protocol: string) => {
    try {
      await apiService.removeProtocol(protocol);
      const updatedRules = await apiService.getFirewallRules();
      setNetworkRules(updatedRules);
      setFirewallRules(updatedRules);
    } catch (error) {
      console.error('Failed to remove protocol:', error);
      throw error;
    }
  };
  const removeRule = async (number: number) => {
    try {
      await apiService.removeRule(number);
      const updatedRules = await apiService.getFirewallRules();
      setNetworkRules(updatedRules);
      setFirewallRules(updatedRules);
    } catch (error) {
      console.error('Failed to remove rule:', error);
      throw error;
    }
  };

  // Alert Functions
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

  // Protected File Functions
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
      if (ruleData.protocol === 'ip' && ruleData.source) {
        if (ruleData.action === 'allow') {
          await apiService.allowIp(ruleData.source);
        } else {
          await apiService.blockIp(ruleData.source);
        }
      } else if (ruleData.port) {
        if (ruleData.action === 'allow') {
          await apiService.allowPort(ruleData.port);
        } else {
          await apiService.blockPort(ruleData.port);
        }
      } else if (ruleData.protocol) {
        if (ruleData.action === 'allow') {
          await apiService.allowProtocol(ruleData.protocol);
        } else {
          await apiService.blockProtocol(ruleData.protocol);
        }
      }
      const updatedRules = await apiService.getFirewallRules();
      setNetworkRules(updatedRules);
      setFirewallRules(updatedRules);
    } catch (error) {
      console.error('Failed to create network rule:', error);
    }
  };

  const updateNetworkRule = async (ruleId: string, updates: Partial<NetworkRule>) => {
    try {
      console.warn('Update network rule not directly supported by API');
      setNetworkRules(networkRules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ));
    } catch (error) {
      console.error('Failed to update network rule:', error);
    }
  };

  const updateFirewallRule = async (ruleId: string, updates: Partial<NetworkRule>) => {
    try {
      console.warn('Update firewall rule not directly supported by API');
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
      const rule = networkRules.find(r => r.id === ruleId);
      if (rule) {
        if (rule.protocol === 'ip' && rule.source) {
          await apiService.removeIp(rule.source);
        } else if (rule.port) {
          await apiService.removePort(rule.port);
        } else if (rule.protocol) {
          await apiService.removeProtocol(rule.protocol);
        }
      }
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
      firewallStatus,
      enableFirewall,
      disableFirewall,
      reloadFirewall,
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
      allowIp,
      blockIp,
      removeIp,
      allowPort,
      blockPort,
      removePort,
      allowProtocol,
      blockProtocol,
      removeProtocol,
      removeRule,
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