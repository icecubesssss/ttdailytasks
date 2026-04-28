/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

interface UserContextType {
  userInfo: UserInfo | null;
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo | null>>;
  updateUser: (data: Partial<UserInfo>) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUserContext = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUserContext must be used within UserProvider");
  }
  return ctx;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const updateUser = useCallback((data: Partial<UserInfo>) => {
    setUserInfo((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  const value = { userInfo, setUserInfo, updateUser };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
