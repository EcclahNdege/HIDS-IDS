import React, { useState } from 'react';
import { 
  Shield, 
  Globe, 
  Server, 
  Mail, 
  Terminal,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Ban,
  Settings,
  Activity,
  Filter,
  Search
} from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';

const Firewall: React.FC = () => {
  const { 
    firewallRules, 
    quarantinedPackets,
    networkAlerts,
    updateFirewallRule,
    setFirewallPolicy,
    updateSuspiciousPacketAction,
    suspiciousPacketAction,
    firewallPolicy
  } = useSecurity();

  const [searchTerm, setSearchTerm] = useState('');
  const [alertFilter, setAlertFilter] = useState<'all' | 'allowed' | 'denied'>('all');

  // Filter network alerts
  const filteredAlerts = networkAlerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = alertFilter === 'all' || 
                         (alertFilter === 'allowed' && alert.description.includes('allowed')) ||
                         (alertFilter === 'denied' && alert.description.includes('denied'));
    return matchesSearch && matchesFilter;
  });

  const getProtocolIcon = (protocol: string) => {
    switch (protocol.toLowerCase()) {
      case 'http':
      case 'https': return <Globe className="h-5 w-5" />;
      case 'ftp': return <Server className="h-5 w-5" />;
      case 'smtp': return <Mail className="h-5 w-5" />;
      case 'ssh': return <Terminal className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'allow': return 'text-green-600 bg-green-50 border-green-200';
      case 'deny': return 'text-red-600 bg-red-50 border-red-200';
      case 'quarantine': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'acknowledged': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const handlePolicyChange = (policy: 'allow_all' | 'deny_all' | 'custom') => {
    setFirewallPolicy(policy);
  };

  const handleRuleToggle = (protocol: string) => {
    const rule = firewallRules.find(r => r.protocol.toLowerCase() === protocol.toLowerCase());
    if (rule) {
      updateFirewallRule(rule.id, { 
        action: rule.action === 'allow' ? 'deny' : 'allow' 
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Firewall Management</h1>
        <p className="text-gray-600 mt-1">Configure network access rules and monitor traffic</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Rules</p>
              <p className="text-2xl font-bold text-gray-900">
                {firewallRules.filter(r => r.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Eye className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quarantined</p>
              <p className="text-2xl font-bold text-gray-900">{quarantinedPackets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Allowed Today</p>
              <p className="text-2xl font-bold text-gray-900">2,847</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Ban className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Blocked Today</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Firewall Rules */}
        <div className="xl:col-span-2 space-y-6">
          {/* Global Policy */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Global Firewall Policy</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="policy"
                    value="allow_all"
                    checked={firewallPolicy === 'allow_all'}
                    onChange={() => handlePolicyChange('allow_all')}
                    className="mr-2 text-green-600"
                  />
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Allow All Traffic
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="policy"
                    value="deny_all"
                    checked={firewallPolicy === 'deny_all'}
                    onChange={() => handlePolicyChange('deny_all')}
                    className="mr-2 text-red-600"
                  />
                  <Ban className="h-4 w-4 text-red-600 mr-2" />
                  Deny All Traffic
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="policy"
                    value="custom"
                    checked={firewallPolicy === 'custom'}
                    onChange={() => handlePolicyChange('custom')}
                    className="mr-2 text-blue-600"
                  />
                  <Settings className="h-4 w-4 text-blue-600 mr-2" />
                  Custom Rules
                </label>
              </div>
              
              {firewallPolicy !== 'custom' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm">
                    Individual protocol rules are disabled when using global policy.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Protocol Rules */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Protocol Rules</h2>
            <div className="space-y-4">
              {firewallRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white rounded-lg border">
                      {getProtocolIcon(rule.protocol)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {rule.protocol.toUpperCase()}
                        {rule.port && ` (Port ${rule.port})`}
                      </h3>
                      <p className="text-sm text-gray-600">{rule.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getActionColor(rule.action)}`}>
                      {rule.action === 'allow' ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                      {rule.action}
                    </span>
                    
                    <button
                      onClick={() => handleRuleToggle(rule.protocol)}
                      disabled={firewallPolicy !== 'custom'}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        firewallPolicy !== 'custom'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : rule.action === 'allow'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {rule.action === 'allow' ? 'Deny' : 'Allow'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suspicious Packet Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Suspicious Packet Actions</h2>
            <p className="text-gray-600 mb-4">Configure how the system handles suspicious network packets</p>
            
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="suspiciousAction"
                  value="allow_notify"
                  checked={suspiciousPacketAction === 'allow_notify'}
                  onChange={(e) => updateSuspiciousPacketAction(e.target.value as any)}
                  className="mr-3 text-blue-600"
                />
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">Allow but Notify</div>
                    <div className="text-sm text-gray-600">Allow packet through but create an alert</div>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="suspiciousAction"
                  value="quarantine"
                  checked={suspiciousPacketAction === 'quarantine'}
                  onChange={(e) => updateSuspiciousPacketAction(e.target.value as any)}
                  className="mr-3 text-yellow-600"
                />
                <div className="flex items-center">
                  <Eye className="h-4 w-4 text-yellow-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">Quarantine</div>
                    <div className="text-sm text-gray-600">Hold packet for admin review</div>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="suspiciousAction"
                  value="reject"
                  checked={suspiciousPacketAction === 'reject'}
                  onChange={(e) => updateSuspiciousPacketAction(e.target.value as any)}
                  className="mr-3 text-red-600"
                />
                <div className="flex items-center">
                  <Ban className="h-4 w-4 text-red-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">Reject</div>
                    <div className="text-sm text-gray-600">Block packet immediately</div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Network Alerts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Network Alerts</h3>
                <select
                  value={alertFilter}
                  onChange={(e) => setAlertFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Alerts</option>
                  <option value="allowed">Allowed</option>
                  <option value="denied">Denied</option>
                </select>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredAlerts.length > 0 ? filteredAlerts.slice(0, 10).map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 pt-0.5">
                      {getAlertIcon(alert.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No network alerts found</p>
                </div>
              )}
            </div>
          </div>

          {/* Quarantined Packets */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quarantined Packets</h3>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {quarantinedPackets.length > 0 ? quarantinedPackets.map((packet) => (
                <div key={packet.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{packet.source}</p>
                      <p className="text-sm text-gray-600">{packet.protocol} • {packet.reason}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(packet.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button className="p-1.5 text-green-600 hover:text-green-700 rounded-md hover:bg-green-50">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-red-600 hover:text-red-700 rounded-md hover:bg-red-50">
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No quarantined packets</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Firewall;