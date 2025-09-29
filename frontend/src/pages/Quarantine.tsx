import React, { useEffect, useState } from 'react';
import { 
  Eye, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Network,
  CheckCircle,
  Trash2,
  X,
  Calendar,
  MapPin,
  Globe,
  HardDrive,
  AlertTriangle
} from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';
import { apiService } from '../services/api';

interface QuarantinedFile {
  id: string;
  name: string;
  originalPath: string;
  quarantinePath: string;
  timestamp: string;
  reason: string;
  size: number;
  type: 'file';
  threat: string;
}

interface QuarantinedPacket {
  id: string;
  source: string;
  destination: string;
  protocol: string;
  port: number;
  timestamp: string;
  reason: string;
  size: number;
  type: 'packet';
  sourceIP: string;
}

type QuarantinedItem = QuarantinedFile | QuarantinedPacket;

const Quarantine: React.FC = () => {
  const { quarantinedPackets } = useSecurity();
  const [quarantinedPacketsState, setQuarantinedPackets] = useState(quarantinedPackets);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'files' | 'packets'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<QuarantinedItem | null>(null);
  const itemsPerPage = 10;

  // Update local state when context changes
  useEffect(() => {
    setQuarantinedPackets(quarantinedPackets);
  }, [quarantinedPackets]);

  // Mock quarantined files
  const quarantinedFiles: QuarantinedFile[] = [
    {
      id: '1',
      name: 'suspicious.exe',
      originalPath: '/home/user/downloads/suspicious.exe',
      quarantinePath: '/var/quarantine/files/suspicious_20241201_001.exe',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      reason: 'Malware detected - Trojan.Win32.Generic',
      size: 2048576,
      type: 'file',
      threat: 'High Risk Malware'
    },
    {
      id: '2',
      name: 'config.dll',
      originalPath: '/windows/system32/config.dll',
      quarantinePath: '/var/quarantine/files/config_20241201_002.dll',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      reason: 'Unauthorized system file modification',
      size: 524288,
      type: 'file',
      threat: 'System Integrity Violation'
    }
  ];

  // Convert quarantined packets to the expected format
  const convertedPackets: QuarantinedPacket[] = quarantinedPacketsState.map(packet => ({
    ...packet,
    type: 'packet' as const,
    sourceIP: packet.source
  }));

  // Combine all quarantined items
  const allItems: QuarantinedItem[] = [...quarantinedFiles, ...convertedPackets];

  // Filter items
  const filteredItems = allItems.filter(item => {
    const matchesSearch = 
      (item.type === 'file' && (item as QuarantinedFile).name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.type === 'packet' && (
        (item as QuarantinedPacket).source.includes(searchTerm) ||
        (item as QuarantinedPacket).protocol.toLowerCase().includes(searchTerm.toLowerCase())
      )) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = 
      typeFilter === 'all' ||
      (typeFilter === 'files' && item.type === 'file') ||
      (typeFilter === 'packets' && item.type === 'packet');

    return matchesSearch && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const handleRelease = (itemId: string) => {
    if (quarantinedPackets.find(p => p.id === itemId)) {
      // Release quarantined packet
      apiService.releaseQuarantinedPacket(itemId).then(() => {
        setQuarantinedPackets(prev => prev.filter(p => p.id !== itemId));
      }).catch(console.error);
    }
  };

  const handleDelete = (itemId: string) => {
    if (quarantinedPackets.find(p => p.id === itemId)) {
      // Delete quarantined packet
      apiService.deleteQuarantinedPacket(itemId).then(() => {
        setQuarantinedPackets(prev => prev.filter(p => p.id !== itemId));
      }).catch(console.error);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quarantine Management</h1>
        <p className="text-gray-600 mt-1">Manage quarantined files and network packets</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Eye className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quarantined</p>
              <p className="text-2xl font-bold text-gray-900">{allItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quarantined Files</p>
              <p className="text-2xl font-bold text-gray-900">{quarantinedFiles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Network className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quarantined Packets</p>
              <p className="text-2xl font-bold text-gray-900">{convertedPackets.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Items</option>
              <option value="files">Files Only</option>
              <option value="packets">Network Packets Only</option>
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search quarantined items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {currentItems.length > 0 ? currentItems.map((item) => (
            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 pt-1">
                    {item.type === 'file' ? (
                      <FileText className="h-6 w-6 text-red-500" />
                    ) : (
                      <Network className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {item.type === 'file' 
                          ? (item as QuarantinedFile).name 
                          : `${(item as QuarantinedPacket).protocol} Packet`
                        }
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'file' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.type === 'file' ? 'File' : 'Network Packet'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{item.reason}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span>Size: {formatFileSize(item.size)}</span>
                      <span>Quarantined: {new Date(item.timestamp).toLocaleString()}</span>
                      {item.type === 'packet' && (
                        <span>Source: {(item as QuarantinedPacket).source}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </button>
                  <button
                    onClick={() => handleRelease(item.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:ring-2 focus:ring-green-500"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Release
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:ring-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quarantined items</h3>
              <p className="text-gray-500">
                {searchTerm || typeFilter !== 'all'
                  ? 'No items match your current filters.'
                  : 'No items are currently quarantined.'}
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
                  <span className="font-medium">{Math.min(endIndex, filteredItems.length)}</span> of{' '}
                  <span className="font-medium">{filteredItems.length}</span> results
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

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedItem.type === 'file' ? 'Quarantined File Details' : 'Quarantined Packet Details'}
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {selectedItem.type === 'file' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">File Name</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                          {(selectedItem as QuarantinedFile).name}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Threat Level</label>
                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md font-medium">
                          {(selectedItem as QuarantinedFile).threat}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Original Directory
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md font-mono">
                        {(selectedItem as QuarantinedFile).originalPath}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <HardDrive className="h-4 w-4 inline mr-1" />
                        Quarantine Directory
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md font-mono">
                        {(selectedItem as QuarantinedFile).quarantinePath}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Protocol</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                          {(selectedItem as QuarantinedPacket).protocol}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                          {(selectedItem as QuarantinedPacket).port}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Globe className="h-4 w-4 inline mr-1" />
                        Source IP Address
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md font-mono">
                        {(selectedItem as QuarantinedPacket).sourceIP}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Globe className="h-4 w-4 inline mr-1" />
                        Destination
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md font-mono">
                        {(selectedItem as QuarantinedPacket).destination}
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Quarantine Reason
                  </label>
                  <p className="text-sm text-gray-900 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                    {selectedItem.reason}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Quarantined At
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {new Date(selectedItem.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {formatFileSize(selectedItem.size)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleRelease(selectedItem.id);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Release Item
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedItem.id);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quarantine;