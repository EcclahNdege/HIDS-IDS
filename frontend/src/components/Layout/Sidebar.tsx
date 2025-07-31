import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Home, AlertTriangle, FileText, Network, Settings, Users, ScrollText, Eye, Siren as Firewall } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
    { to: '/monitoring/files', icon: FileText, label: 'File Monitoring' },
    { to: '/monitoring/network', icon: Network, label: 'Network Monitoring' },
    { to: '/prevention/firewall', icon: Firewall, label: 'Firewall' },
    { to: '/prevention/quarantined', icon: Eye, label: 'Quarantined' },
    { to: '/logs', icon: ScrollText, label: 'Logs' },
    ...(isAdmin ? [
      { to: '/users', icon: Users, label: 'User Management' },
      { to: '/settings', icon: Settings, label: 'Settings' }
    ] : [])
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-center h-16 bg-gray-800 border-b border-gray-700">
          <Shield className="h-8 w-8 text-blue-400 mr-2" />
          <h1 className="text-xl font-bold text-white">SecureWatch</h1>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-gray-500 text-center">
            SecureWatch v2.1.0
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;