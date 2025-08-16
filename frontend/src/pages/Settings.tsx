import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Mail, 
  Lock, 
  Save,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  // Profile settings
  const [email, setEmail] = useState(user?.email || '');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  
  // Password settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Check if user has no password set (new user)
  const hasNoPassword = !user?.lastLogin; // Assuming new users haven't logged in yet

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    if (!email.trim()) {
      setEmailError('Email address is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      // Implementation for updating email would go here
      console.log('Updating email to:', email);
      setEmailSuccess('Email address updated successfully');
      setTimeout(() => setEmailSuccess(''), 3000);
    } catch (error) {
      setEmailError('Failed to update email address');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation for existing users
    if (!hasNoPassword && !currentPassword.trim()) {
      setPasswordError('Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError('New password is required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (!hasNoPassword && currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    try {
      // Implementation for updating password would go here
      console.log('Updating password');
      setPasswordSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error) {
      setPasswordError('Failed to update password');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Urgent Password Warning for New Users */}
      {hasNoPassword && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Password Required</h3>
              <p className="text-sm text-red-700 mt-1">
                You must set a password for your account immediately for security purposes.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Lock className="h-4 w-4 inline mr-2" />
              Security
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                
                {/* Username (Read-only) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={user?.username || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                </div>

                {/* Email Update Form */}
                <form onSubmit={handleEmailUpdate}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  {emailError && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      <p className="text-red-600 text-sm">{emailError}</p>
                    </div>
                  )}

                  {emailSuccess && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p className="text-green-600 text-sm">{emailSuccess}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Update Email
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {hasNoPassword ? 'Set Password' : 'Change Password'}
                </h3>
                
                <form onSubmit={handlePasswordUpdate}>
                  {/* Current Password (only for existing users) */}
                  {!hasNoPassword && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* New Password */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {hasNoPassword ? 'Password' : 'New Password'}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          hasNoPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder={hasNoPassword ? 'Set your password' : 'Enter new password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {hasNoPassword && (
                      <p className="text-red-600 text-sm mt-1 font-medium">
                        ⚠️ You must set a password for security
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm {hasNoPassword ? 'Password' : 'New Password'}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          hasNoPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder={hasNoPassword ? 'Confirm your password' : 'Confirm new password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className={`flex items-center ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                        <CheckCircle className={`h-3 w-3 mr-2 ${newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'}`} />
                        At least 8 characters long
                      </li>
                      <li className={`flex items-center ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                        <CheckCircle className={`h-3 w-3 mr-2 ${/[A-Z]/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                        Contains uppercase letter (recommended)
                      </li>
                      <li className={`flex items-center ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                        <CheckCircle className={`h-3 w-3 mr-2 ${/[0-9]/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                        Contains number (recommended)
                      </li>
                    </ul>
                  </div>

                  {passwordError && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      <p className="text-red-600 text-sm">{passwordError}</p>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <p className="text-green-600 text-sm">{passwordSuccess}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`inline-flex items-center px-4 py-2 rounded-lg focus:ring-2 focus:ring-offset-2 transition-colors ${
                      hasNoPassword
                        ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {hasNoPassword ? 'Set Password Now' : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* Account Security Info */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Account Security</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Account Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Account Created</span>
                    <span className="text-sm text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                  {user?.lastLogin && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Login</span>
                      <span className="text-sm text-gray-900">
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;