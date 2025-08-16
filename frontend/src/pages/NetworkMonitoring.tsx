import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Globe,
  Server,
  Mail,
  Terminal,
  Shield,
  Activity,
  Clock,
  ArrowUpDown
} from 'lucide-react';

interface NetworkPacket {
  id: string;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  port: number;
  size: number;
  status: 'allowed' | 'denied' | 'quarantined';
  type: 'HTTP' | 'HTTPS' | 'FTP' | 'SSH' | 'SMTP' | 'DNS' | 'TCP' | 'UDP' | 'ICMP';
}

const NetworkMonitoring: React.FC = () => {
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [filteredPackets, setFilteredPackets] = useState<NetworkPacket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'HTTP' | 'HTTPS' | 'FTP' | 'SSH' | 'SMTP' | 'DNS' | 'TCP' | 'UDP' | 'ICMP'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'allowed' | 'denied' | 'quarantined'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLive, setIsLive] = useState(true);
  const packetsPerPage = 10;

  // Mock data generator
  const generateMockPacket = (): NetworkPacket => {
    const types = ['HTTP', 'HTTPS', 'FTP', 'SSH', 'SMTP', 'DNS', 'TCP', 'UDP', 'ICMP'];
    const statuses = ['allowed', 'denied', 'quarantined'];
    const type = types[Math.floor(Math.random() * types.length)] as NetworkPacket['type'];
    const status = statuses[Math.floor(Math.random() * statuses.length)] as NetworkPacket['status'];
    
    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      source: `192.168.1.${Math.floor(Math.random() * 255)}`,
      destination: `10.0.0.${Math.floor(Math.random() * 255)}`,
      protocol: type,
      port: Math.floor(Math.random() * 65535),
      size: Math.floor(Math.random() * 1500) + 64,
      status,
      type
    };
  };

  // Initialize with mock data
  useEffect(() => {
    const initialPackets = Array.from({ length: 50 }, generateMockPacket);
    setPackets(initialPackets);
  }, []);

  // Live packet simulation
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newPacket = generateMockPacket();
      setPackets(prev => [newPacket, ...prev.slice(0, 199)]); // Keep last 200 packets
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Filter packets
  useEffect(() => {
    let filtered = packets;

    if (searchTerm) {
      filtered = filtered.filter(packet =>
        packet.source.includes(searchTerm) ||
        packet.destination.includes(searchTerm) ||
        packet.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        packet.port.toString().includes(searchTerm)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(packet => packet.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(packet => packet.status === statusFilter);
    }

    setFilteredPackets(filtered);
    setCurrentPage(1);
  }, [packets, searchTerm, typeFilter, statusFilter]);

  const getProtocolIcon = (protocol: string) => {
    switch (protocol.toLowerCase()) {
      case 'http':
      case 'https': return <Globe className="h-4 w-4" />;
      case 'ftp': return <Server className="h-4 w-4" />;
      case 'smtp': return <Mail className="h-4 w-4" />;
      case 'ssh': return <Terminal className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'allowed': return 'bg-green-100 text-green-800 border-green-200';
      case 'denied': return 'bg-red-100 text-red-800 border-red-200';
      case 'quarantined': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredPackets.length / packetsPerPage);
  const startIndex = (currentPage - 1) * packetsPerPage;
  const endIndex = startIndex + packetsPerPage;
  const currentPackets = filteredPackets.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Network Monitoring</h1>
          <p className="text-gray-600 mt-1">Real-time network packet monitoring and analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700">
              {isLive ? 'Live' : 'Paused'}
            </span>
          </div>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isLive 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isLive ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Packets</p>
              <p className="text-2xl font-bold text-gray-900">{packets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Allowed</p>
              <p className="text-2xl font-bold text-gray-900">
                {packets.filter(p => p.status === 'allowed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Denied</p>
              <p className="text-2xl font-bold text-gray-900">
                {packets.filter(p => p.status === 'denied').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quarantined</p>
              <p className="text-2xl font-bold text-gray-900">
                {packets.filter(p => p.status === 'quarantined').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protocol Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="HTTP">HTTP</option>
                <option value="HTTPS">HTTPS</option>
                <option value="FTP">FTP</option>
                <option value="SSH">SSH</option>
                <option value="SMTP">SMTP</option>
                <option value="DNS">DNS</option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="allowed">Allowed</option>
                <option value="denied">Denied</option>
                <option value="quarantined">Quarantined</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search packets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      {/* Packets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>Timestamp</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Protocol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Port
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPackets.map((packet) => (
                <tr key={packet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(packet.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getProtocolIcon(packet.protocol)}
                      <span className="text-sm font-medium text-gray-900">{packet.protocol}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {packet.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {packet.destination}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {packet.port}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {packet.size} bytes
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(packet.status)}`}>
                      {packet.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
                <span className="font-medium">{Math.min(endIndex, filteredPackets.length)}</span> of{' '}
                <span className="font-medium">{filteredPackets.length}</span> results
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
      </div>
    </div>
  );
};

export default NetworkMonitoring;