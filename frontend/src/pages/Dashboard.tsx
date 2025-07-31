import React from 'react';
import { 
  Activity, 
  Shield, 
  HardDrive, 
  Cpu, 
  Network, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';
import StatusCard from '../components/UI/StatusCard';
import ProgressBar from '../components/UI/ProgressBar';

const Dashboard: React.FC = () => {
  const { systemStatus, alerts, protectedFiles, networkRules } = useSecurity();

  const recentAlerts = alerts.slice(0, 5);
  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'red';
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'acknowledged': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
        <p className="text-gray-600 mt-1">Real-time system monitoring and threat detection</p>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard
          title="Threat Level"
          value={systemStatus.threatLevel.toUpperCase()}
          icon={Shield}
          color={getThreatLevelColor(systemStatus.threatLevel)}
          subtitle="Current security status"
        />
        <StatusCard
          title="Active Connections"
          value={systemStatus.activeConnections}
          icon={Network}
          color="blue"
          subtitle="Network connections"
        />
        <StatusCard
          title="Blocked Threats"
          value={systemStatus.blockedThreats}
          icon={AlertTriangle}
          color="green"
          subtitle="Threats prevented"
        />
        <StatusCard
          title="System Uptime"
          value={systemStatus.uptime}
          icon={Activity}
          color="gray"
          subtitle="Continuous operation"
        />
      </div>

      {/* System Resources */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">System Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-3">
              <Cpu className="h-5 w-5 text-blue-500 mr-2" />
              <span className="font-medium text-gray-900">CPU Usage</span>
            </div>
            <ProgressBar 
              percentage={systemStatus.cpu} 
              showLabel 
              label="Processing Power"
            />
          </div>
          <div>
            <div className="flex items-center mb-3">
              <Activity className="h-5 w-5 text-green-500 mr-2" />
              <span className="font-medium text-gray-900">Memory Usage</span>
            </div>
            <ProgressBar 
              percentage={systemStatus.memory} 
              showLabel 
              label="RAM"
            />
          </div>
          <div>
            <div className="flex items-center mb-3">
              <HardDrive className="h-5 w-5 text-purple-500 mr-2" />
              <span className="font-medium text-gray-900">Disk Usage</span>
            </div>
            <ProgressBar 
              percentage={systemStatus.disk} 
              showLabel 
              label="Storage"
            />
          </div>
        </div>
      </div>

      {/* Recent Alerts & Quick Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Alerts</h2>
            <div className="flex space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {criticalAlerts.length} Critical
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {activeAlerts.length} Active
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {recentAlerts.length > 0 ? recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className={`flex-shrink-0 p-2 rounded-full ${getAlertColor(alert.severity)}`}>
                  {getStatusIcon(alert.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{alert.title}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="text-xs text-gray-500">Source: {alert.source}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getAlertColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500">No recent alerts - system is secure</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Protection Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Protected Files</span>
                <span className="text-sm font-medium text-gray-900">{protectedFiles.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Firewall Rules</span>
                <span className="text-sm font-medium text-gray-900">{networkRules.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quarantined Items</span>
                <span className="text-sm font-medium text-gray-900">{systemStatus.quarantinedFiles}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Threats Blocked</span>
                <span className="text-sm font-medium text-green-600">+47</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Login Attempts</span>
                <span className="text-sm font-medium text-blue-600">23</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Files Scanned</span>
                <span className="text-sm font-medium text-gray-900">1,247</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;