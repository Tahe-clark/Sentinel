import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  getCurrentUser,
} from "../services/auth";

import type {
  User,
} from "../services/auth";


interface AuthContextValue {
  user: User | null;

  loading: boolean;

  refreshUser:
    () => Promise<void>;

  clearUser:
    () => void;
}


const AuthContext =
  createContext<AuthContextValue | null>(
    null
  );


interface AuthProviderProps {
  children: ReactNode;
}


export function AuthProvider({
  children,
}: AuthProviderProps) {

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);


  async function refreshUser() {
    try {
      const currentUser =
        await getCurrentUser();

      setUser(
        currentUser
      );
    } finally {
      setLoading(
        false
      );
    }
  }


  function clearUser() {
    setUser(
      null
    );
  }


  useEffect(() => {
    refreshUser();
  }, []);


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        clearUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context =
    useContext(AuthContext);


  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }


  return context;
}