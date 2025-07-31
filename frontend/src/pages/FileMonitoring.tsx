import React, { useState } from 'react';
import { 
  FileText, 
  FolderOpen, 
  Plus, 
  Search, 
  Filter,
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Settings,
  Shield,
  X
} from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';

const FileMonitoring: React.FC = () => {
  const { 
    protectedFiles, 
    alerts,
    addProtectedFile, 
    removeProtectedFile, 
    lockFile, 
    authorizeFile,
    updateFileSettings
  } = useSecurity();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState<string | null>(null);
  const [newFilePath, setNewFilePath] = useState('');
  const [pathType, setPathType] = useState<'file' | 'directory'>('file');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'protected' | 'locked' | 'authorized'>('all');

  // Get file-related alerts
  const fileAlerts = alerts.filter(alert => alert.type === 'file').slice(0, 10);

  // Filter protected files
  const filteredFiles = protectedFiles.filter(file => {
    const matchesSearch = file.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddFile = () => {
    if (newFilePath.trim()) {
      addProtectedFile(newFilePath.trim(), pathType);
      setNewFilePath('');
      setShowAddModal(false);
    }
  };

  const handleLockFile = (fileId: string) => {
    const reason = prompt('Enter reason for locking this file:');
    if (reason) {
      lockFile(fileId, reason);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'protected': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'locked': return <Lock className="h-4 w-4 text-red-500" />;
      case 'authorized': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'protected': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'locked': return 'bg-red-100 text-red-800 border-red-200';
      case 'authorized': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File Monitoring</h1>
          <p className="text-gray-600 mt-1">Monitor and protect critical files and directories</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Protection
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Protected Items</p>
              <p className="text-2xl font-bold text-gray-900">{protectedFiles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Locked Files</p>
              <p className="text-2xl font-bold text-gray-900">
                {protectedFiles.filter(f => f.status === 'locked').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">File Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{fileAlerts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monitoring Active</p>
              <p className="text-2xl font-bold text-green-600">ON</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Protected Files List */}
        <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Protected Files & Directories</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="protected">Protected</option>
                  <option value="locked">Locked</option>
                  <option value="authorized">Authorized</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files and directories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredFiles.length > 0 ? filteredFiles.map((file) => (
              <div key={file.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {file.path.includes('.') ? (
                        <FileText className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FolderOpen className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.path}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(file.status)}`}>
                          {getStatusIcon(file.status)}
                          <span className="ml-1">{file.status}</span>
                        </span>
                        {file.lastAccessed && (
                          <span className="text-xs text-gray-500">
                            Last accessed: {new Date(file.lastAccessed).toLocaleString()}
                          </span>
                        )}
                        {file.accessAttempts > 0 && (
                          <span className="text-xs text-red-600">
                            {file.accessAttempts} access attempts
                          </span>
                        )}
                      </div>
                      {file.lockReason && (
                        <p className="text-xs text-red-600 mt-1">Locked: {file.lockReason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setShowSettingsModal(file.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    
                    {file.status === 'locked' ? (
                      <button
                        onClick={() => authorizeFile(file.id)}
                        className="p-1.5 text-green-600 hover:text-green-700 rounded-md hover:bg-green-50"
                        title="Unlock file"
                      >
                        <Unlock className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLockFile(file.id)}
                        className="p-1.5 text-red-600 hover:text-red-700 rounded-md hover:bg-red-50"
                        title="Lock file"
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => removeProtectedFile(file.id)}
                      className="p-1.5 text-red-600 hover:text-red-700 rounded-md hover:bg-red-50"
                      title="Remove protection"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No protected files</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No files match your current filters.'
                    : 'Add files or directories to start monitoring.'}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Protection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent File Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent File Alerts</h3>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {fileAlerts.length > 0 ? fileAlerts.map((alert) => (
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
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent file alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add File Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add File Protection</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Protection Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="file"
                        checked={pathType === 'file'}
                        onChange={(e) => setPathType(e.target.value as 'file' | 'directory')}
                        className="mr-2"
                      />
                      <FileText className="h-4 w-4 mr-1" />
                      File
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="directory"
                        checked={pathType === 'directory'}
                        onChange={(e) => setPathType(e.target.value as 'file' | 'directory')}
                        className="mr-2"
                      />
                      <FolderOpen className="h-4 w-4 mr-1" />
                      Directory
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {pathType === 'file' ? 'File Path' : 'Directory Path'}
                  </label>
                  <input
                    type="text"
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    placeholder={pathType === 'file' ? '/path/to/file.txt' : '/path/to/directory'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFile}
                  disabled={!newFilePath.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Protection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">File Settings</h3>
                <button
                  onClick={() => setShowSettingsModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    Alert on read attempts
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    Alert on write attempts
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    Alert on delete attempts
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Auto-lock on suspicious activity
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSettingsModal(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSettingsModal(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileMonitoring;