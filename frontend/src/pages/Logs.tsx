import React, { useState, useEffect } from 'react';
import { 
  ScrollText, 
  Search, 
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  AlertCircle,
  Shield,
  User,
  Network,
  Settings,
  X,
  MessageSquare,
  Send,
  Calendar,
  Tag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  category: 'system' | 'security' | 'user' | 'network';
  message: string;
  details: string;
  user?: string;
  comments: LogComment[];
}

interface LogComment {
  id: string;
  userId: string;
  username: string;
  comment: string;
  timestamp: string;
}

const Logs: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [newComment, setNewComment] = useState('');
  const logsPerPage = 10;

  // Mock log data
  useEffect(() => {
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        level: 'critical',
        category: 'security',
        message: 'Multiple failed login attempts detected',
        details: 'User attempted to login 15 times with incorrect credentials from IP 192.168.1.100. Account has been temporarily locked for security.',
        user: 'system',
        comments: [
          {
            id: 'c1',
            userId: 'admin1',
            username: 'admin',
            comment: 'Investigating this incident. IP appears to be from internal network.',
            timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString()
          }
        ]
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        level: 'warning',
        category: 'system',
        message: 'High CPU usage detected',
        details: 'System CPU usage has exceeded 90% for more than 5 minutes. This may indicate a performance issue or potential security threat.',
        user: 'system',
        comments: []
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        level: 'info',
        category: 'user',
        message: 'User login successful',
        details: 'User "john_doe" successfully logged in from IP 192.168.1.50 using valid credentials.',
        user: 'john_doe',
        comments: []
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        level: 'error',
        category: 'network',
        message: 'Firewall rule violation',
        details: 'Attempted connection to blocked port 445 from external IP 203.0.113.42. Connection was denied according to firewall rules.',
        user: 'system',
        comments: []
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        level: 'warning',
        category: 'security',
        message: 'Suspicious file access attempt',
        details: 'User attempted to access protected file /etc/passwd without proper authorization. Access was denied and incident logged.',
        user: 'unknown_user',
        comments: []
      },
      // Add more mock logs...
      ...Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 6}`,
        timestamp: new Date(Date.now() - 1000 * 60 * (60 + i * 30)).toISOString(),
        level: ['info', 'warning', 'error', 'critical'][Math.floor(Math.random() * 4)] as LogEntry['level'],
        category: ['system', 'security', 'user', 'network'][Math.floor(Math.random() * 4)] as LogEntry['category'],
        message: `System event ${i + 6}`,
        details: `Detailed information about system event ${i + 6}. This is a longer description that provides more context about what happened.`,
        user: ['system', 'admin', 'user1', 'user2'][Math.floor(Math.random() * 4)],
        comments: []
      }))
    ];

    setLogs(mockLogs);
  }, []);

  // Filter logs
  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user && log.user.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [logs, searchTerm]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      case 'network': return <Network className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <ScrollText className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'bg-red-50 text-red-700';
      case 'user': return 'bg-blue-50 text-blue-700';
      case 'network': return 'bg-purple-50 text-purple-700';
      case 'system': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const handleAddComment = () => {
    if (!selectedLog || !newComment.trim() || !user) return;

    const comment: LogComment = {
      id: crypto.randomUUID(),
      userId: user.id,
      username: user.username,
      comment: newComment.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedLogs = logs.map(log =>
      log.id === selectedLog.id
        ? { ...log, comments: [...log.comments, comment] }
        : log
    );

    setLogs(updatedLogs);
    setSelectedLog({ ...selectedLog, comments: [...selectedLog.comments, comment] });
    setNewComment('');
  };

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
        <p className="text-gray-600 mt-1">Monitor system events and security incidents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => log.level === 'critical').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => log.level === 'warning').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => log.level === 'error').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Info</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => log.level === 'info').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs by message, details, category, level, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {currentLogs.length > 0 ? currentLogs.map((log) => (
            <div 
              key={log.id} 
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 pt-1">
                  {getLevelIcon(log.level)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{log.message}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getCategoryColor(log.category)}`}>
                      {getCategoryIcon(log.category)}
                      <span className="ml-1">{log.category}</span>
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">{log.details}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    {log.user && (
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {log.user}
                      </span>
                    )}
                    {log.comments.length > 0 && (
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {log.comments.length} comment{log.comments.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12">
              <ScrollText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
              <p className="text-gray-500">
                {searchTerm
                  ? 'Try adjusting your search terms to see more results.'
                  : 'No system logs are available at this time.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredLogs.length)}</span> of{' '}
                  <span className="font-medium">{filteredLogs.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Log Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Log Header */}
                <div className="flex items-center space-x-4">
                  {getLevelIcon(selectedLog.level)}
                  <h4 className="text-lg font-medium text-gray-900">{selectedLog.message}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getLevelColor(selectedLog.level)}`}>
                    {selectedLog.level}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getCategoryColor(selectedLog.category)}`}>
                    {getCategoryIcon(selectedLog.category)}
                    <span className="ml-1">{selectedLog.category}</span>
                  </span>
                </div>

                {/* Log Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timestamp</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {selectedLog.user && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedLog.user}
                      </p>
                    </div>
                  )}
                </div>

                {/* Log Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                    {selectedLog.details}
                  </p>
                </div>

                {/* Comments Section */}
                <div>
                  <h5 className="text-lg font-medium text-gray-900 mb-4">Comments</h5>
                  
                  {/* Existing Comments */}
                  <div className="space-y-4 mb-6">
                    {selectedLog.comments.length > 0 ? selectedLog.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{comment.username}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    )) : (
                      <p className="text-gray-500 text-center py-4">No comments yet</p>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Comment</label>
                    <div className="flex space-x-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add your comment..."
                        rows={3}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;