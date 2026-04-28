import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, isDummyConfig } from '../firebase';
import * as taskService from '../services/taskService';
import * as userService from '../services/userService';
import { Task } from '../utils/helpers';

interface UseAppBootstrapProps {
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
}

interface UseAppBootstrapReturn {
  user: User | null;
  authError: string | null;
  isLoading: boolean;
}

interface LocalUser {
  uid: string;
  isAnonymous: boolean;
  displayName: string;
  email: string;
}

const LOCAL_USER_TEST_UID = 'local-user-test';

const isFirebaseUser = (candidate: User | LocalUser | null): candidate is User => {
  if (!candidate) return false;
  return candidate.uid !== LOCAL_USER_TEST_UID;
};

export const useAppBootstrap = ({ setTasks }: UseAppBootstrapProps): UseAppBootstrapReturn => {
  const [user, setUser] = useState<User | LocalUser | null>(() => (
    isDummyConfig ? { uid: LOCAL_USER_TEST_UID, isAnonymous: true, displayName: 'Guest', email: 'guest@example.com' } : null
  ));
  const [authError, setAuthError] = useState<string | null>(() => (
    isDummyConfig ? "Chỉ chạy cục bộ do lỗi API Key." : null
  ));
  const [isLoading, setIsLoading] = useState(!isDummyConfig);

  useEffect(() => {
    if (isDummyConfig) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthError(null);
        if (!currentUser.isAnonymous) {
          try {
            await userService.registerTeamMember(currentUser.uid, {
              uid: currentUser.uid,
              displayName: currentUser.displayName ?? undefined,
              photoURL: currentUser.photoURL ?? undefined,
              email: currentUser.email ?? undefined,
            });
          } catch (err) {
            console.error("Error registering team member:", err);
          }
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isFirebaseUser(user)) return;
    const unsubscribe = taskService.subscribeToTasks(setTasks, (error) => {
      setAuthError("Firestore Read Error: " + error.message);
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user, setTasks]);

  return {
    user: isFirebaseUser(user) ? user : null,
    authError,
    isLoading
  };
};
