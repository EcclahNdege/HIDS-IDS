import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isFirstTimeSetup: boolean;
  loading: boolean;
  createInitialAdmin: (userData: Omit<User, 'id' | 'createdAt' | 'isActive'>) => Promise<boolean>;
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'isActive'> & { password: string }) => Promise<boolean>;
  updateUserRole: (userId: string, role: 'admin' | 'user') => void;
  toggleUserStatus: (userId: string) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if setup is needed
        const setupStatus = await apiService.checkSetup();
        setIsFirstTimeSetup(setupStatus.needs_setup);

        // If token exists, try to get current user
        const token = localStorage.getItem('authToken');
        if (token && !setupStatus.needs_setup) {
          try {
            const currentUser = await apiService.getCurrentUser();
            setUser(currentUser);
            
            // Load users if admin
            if (currentUser.role === 'admin') {
              const usersData = await apiService.getUsers();
              setUsers(usersData);
            }
          } catch (error) {
            console.error('Failed to get current user:', error);
            apiService.clearToken();
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      await apiService.login(username, password);
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
      
      // Load users if admin
      if (currentUser.role === 'admin') {
        const usersData = await apiService.getUsers();
        setUsers(usersData);
      }
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    apiService.clearToken();
    setUser(null);
    setUsers([]);
  };

  const createInitialAdmin = async (userData: Omit<User, 'id' | 'createdAt' | 'isActive'> & { password: string }): Promise<boolean> => {
    try {
      const newUser = await apiService.createInitialAdmin(userData);
      setUser(newUser);
      setUsers([newUser]);
      setIsFirstTimeSetup(false);
      return true;
    } catch (error) {
      console.error('Failed to create initial admin:', error);
      return false;
    }
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt' | 'isActive'> & { password: string }): Promise<boolean> => {
    try {
      const newUser = await apiService.createUser(userData);
      setUsers([...users, newUser]);
      return true;
    } catch (error) {
      console.error('Failed to create user:', error);
      return false;
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      await apiService.updateUserRole(userId, role);
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      await apiService.toggleUserStatus(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      users,
      login,
      logout,
      isFirstTimeSetup,
      loading,
      createInitialAdmin,
      addUser,
      updateUserRole,
      toggleUserStatus,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};