import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isFirstTimeSetup: boolean;
  createInitialAdmin: (userData: Omit<User, 'id' | 'createdAt' | 'isActive'>) => Promise<boolean>;
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'isActive'>) => Promise<boolean>;
  updateUserRole: (userId: string, role: 'admin' | 'user') => void;
  toggleUserStatus: (userId: string) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data for demonstration
const mockUsers: User[] = [];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(true);

  useEffect(() => {
    // Check if there are any users in the system
    const hasUsers = users.length > 0;
    setIsFirstTimeSetup(!hasUsers);

    // Check for stored session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser && hasUsers) {
      const parsedUser = JSON.parse(storedUser);
      const existingUser = users.find(u => u.id === parsedUser.id);
      if (existingUser && existingUser.isActive) {
        setUser(existingUser);
      }
    }
  }, [users]);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Mock authentication - in real app, this would call an API
    const foundUser = users.find(u => u.username === username && u.isActive);
    if (foundUser) {
      const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
      setUser(updatedUser);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const createInitialAdmin = async (userData: Omit<User, 'id' | 'createdAt' | 'isActive'>): Promise<boolean> => {
    if (!isFirstTimeSetup) return false;

    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isActive: true,
      role: 'admin'
    };

    setUsers([newUser]);
    setUser(newUser);
    setIsFirstTimeSetup(false);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    return true;
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt' | 'isActive'>): Promise<boolean> => {
    if (!user || user.role !== 'admin') return false;

    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isActive: true
    };

    setUsers([...users, newUser]);
    return true;
  };

  const updateUserRole = (userId: string, role: 'admin' | 'user') => {
    if (!user || user.role !== 'admin') return;
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
  };

  const toggleUserStatus = (userId: string) => {
    if (!user || user.role !== 'admin') return;
    setUsers(users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
  };

  return (
    <AuthContext.Provider value={{
      user,
      users,
      login,
      logout,
      isFirstTimeSetup,
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