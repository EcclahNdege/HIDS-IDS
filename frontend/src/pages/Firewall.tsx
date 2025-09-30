import React, { useState } from 'react';
import { 
  Shield, 
  Power,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  AlertCircle,
  Server,
  Globe,
  Hash,
  Ban
} from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';

type RuleType = 'ip' | 'port' | 'protocol';

const Firewall: React.FC = () => {
  const { 
    firewallStatus,
    firewallRules,
    enableFirewall,
    disableFirewall,
    reloadFirewall,
    allowIp,
    blockIp,
    removeIp,
    allowPort,
    blockPort,
    removePort,
    allowProtocol,
    blockProtocol,
    removeProtocol,
    removeRule
  } = useSecurity();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Add Rule Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [ruleType, setRuleType] = useState<RuleType>('ip');
  const [ruleValue, setRuleValue] = useState('');
  const [ruleAction, setRuleAction] = useState<'allow' | 'block'>('allow');

  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const handleEnableFirewall = async () => {
    setLoading(true);
    setError(null);
    try {
      await enableFirewall();
      setSuccess('Firewall enabled successfully');
      clearMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to enable firewall');
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  const handleDisableFirewall = async () => {
    setLoading(true);
    setError(null);
    try {
      await disableFirewall();
      setSuccess('Firewall disabled successfully');
      clearMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to disable firewall');
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  const handleReloadFirewall = async () => {
    setLoading(true);
    setError(null);
    try {
      await reloadFirewall();
      setSuccess('Firewall reloaded successfully');
      clearMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to reload firewall');
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!ruleValue.trim()) {
      setError('Please enter a value');
      clearMessages();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (ruleType === 'ip') {
        if (ruleAction === 'allow') {
          await allowIp(ruleValue);
        } else {
          await blockIp(ruleValue);
        }
      } else if (ruleType === 'port') {
        if (ruleAction === 'allow') {
          await allowPort(ruleValue);
        } else {
          await blockPort(ruleValue);
        }
      } else if (ruleType === 'protocol') {
        if (ruleAction === 'allow') {
          await allowProtocol(ruleValue);
        } else {
          await blockProtocol(ruleValue);
        }
      }
      setSuccess(`Rule added successfully: ${ruleAction} ${ruleType} ${ruleValue}`);
      setRuleValue('');
      setShowAddForm(false);
      clearMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to add rule');
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRule = async (rule: any) => {
    setLoading(true);
    setError(null);
    try {
      await removeRule(rule.num);
      setSuccess('Rule removed successfully');
      clearMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to remove rule');
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  const getRuleIcon = (rule: any) => {
    if (rule.action == "DENY") return <Ban className="h-5 w-5" />;
    if (rule.action == "ALLOW") return <CheckCircle className="h-5 w-5" />;
    return <Server className="h-5 w-5" />;
  };

  const getRuleLabel = (rule: any) => {
    return `Rule ${rule.num} - ${rule.from} to ${rule.rule}`;
  };

  const isFirewallEnabled = firewallStatus?.enabled ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Firewall Management</h1>
        <p className="text-gray-600 mt-1">Control network access and manage firewall rules</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Success</h3>
            <p className="text-sm text-green-700 mt-1">{success}</p>
          </div>
        </div>
      )}

      {/* Firewall Status Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${isFirewallEnabled ? 'bg-green-100' : 'bg-red-100'}`}>
              <Shield className={`h-8 w-8 ${isFirewallEnabled ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Firewall Status</h2>
              <div className="flex items-center space-x-2 mt-1">
                {isFirewallEnabled ? (
                  <>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      ENABLED
                    </span>
                    <span className="text-sm text-gray-600">
                      {firewallStatus?.status || 'Active and protecting'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <XCircle className="h-4 w-4 mr-1" />
                      DISABLED
                    </span>
                    <span className="text-sm text-gray-600">Network is not protected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-3">
            {isFirewallEnabled ? (
              <button
                onClick={handleDisableFirewall}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Power className="h-4 w-4 mr-2" />
                Disable Firewall
              </button>
            ) : (
              <button
                onClick={handleEnableFirewall}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Power className="h-4 w-4 mr-2" />
                Enable Firewall
              </button>
            )}
            
            <button
              onClick={handleReloadFirewall}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Reload Rules
            </button>
          </div>
        </div>
      </div>

      {/* Rules Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Firewall Rules</h2>
            <p className="text-sm text-gray-600 mt-1">
              {firewallRules.length} {firewallRules.length === 1 ? 'rule' : 'rules'} configured
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </button>
        </div>

        {/* Add Rule Form */}
        {showAddForm && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Add New Rule</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Type
                </label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as RuleType)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ip">IP Address</option>
                  <option value="port">Port</option>
                  <option value="protocol">Protocol</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ruleType === 'ip' ? 'IP Address' : ruleType === 'port' ? 'Port Number' : 'Protocol Name'}
                </label>
                <input
                  type="text"
                  value={ruleValue}
                  onChange={(e) => setRuleValue(e.target.value)}
                  placeholder={
                    ruleType === 'ip' ? '192.168.1.100' : 
                    ruleType === 'port' ? '8080' : 
                    'http, ssh, ftp'
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select
                  value={ruleAction}
                  onChange={(e) => setRuleAction(e.target.value as 'allow' | 'block')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="allow">Allow</option>
                  <option value="block">Block</option>
                </select>
              </div>

              <div className="flex items-end space-x-2">
                <button
                  onClick={handleAddRule}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setRuleValue('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rules List */}
        <div className="divide-y divide-gray-200">
          {firewallRules.length > 0 ? (
            firewallRules.map((rule) => (
              <div key={rule.num} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${
                      rule.direction == "IN" ? 'bg-blue-100' :  
                      'bg-indigo-100'
                    }`}>
                      {getRuleIcon(rule)}
                    </div>

                    {/* Rule Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">
                          {getRuleLabel(rule)}
                        </span>
                        
                        {/* Action Badge */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.action === 'ALLOW' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {rule.action === 'ALLOW' ? (
                            <>
                              <Unlock className="h-3 w-3 mr-1" />
                              ALLOW
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              BLOCK
                            </>
                          )}
                        </span>

                        {/* Direction Badge */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.direction === 'IN'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {rule.direction === 'IN' ? 'INCOMING' : 'OUTGOING'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveRule(rule)}
                    disabled={loading}
                    className="ml-4 inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No Rules Configured</h3>
              <p className="text-sm text-gray-600">
                Add your first firewall rule to start controlling network access
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">About Firewall Rules</h3>
            <div className="text-sm text-blue-800 mt-2 space-y-1">
              <p><strong>IP Rules:</strong> Control access for specific IP addresses</p>
              <p><strong>Port Rules:</strong> Allow or block traffic on specific ports</p>
              <p><strong>Protocol Rules:</strong> Manage traffic by protocol (HTTP, SSH, FTP, etc.)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Firewall;