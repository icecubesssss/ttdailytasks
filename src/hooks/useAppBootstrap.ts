import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';
import * as taskService from '../services/taskService';
import * as userService from '../services/userService';
import { Task, AppUser } from '../utils/helpers';

export type { AppUser };

interface UseAppBootstrapProps {
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
}

interface UseAppBootstrapReturn {
  user: AppUser | null;
  authError: string | null;
  isLoading: boolean;
  isTasksLoaded: boolean;
}

const mapSupabaseUser = (u: any): AppUser | null => {
  if (!u) return null;
  return {
    uid: u.id,
    email: u.email || null,
    displayName: u.user_metadata?.displayName || u.user_metadata?.full_name || null,
    photoURL: u.user_metadata?.photoURL || u.user_metadata?.avatar_url || null,
    isAnonymous: false
  };
};

export const useAppBootstrap = ({ setTasks }: UseAppBootstrapProps): UseAppBootstrapReturn => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTasksLoaded, setIsTasksLoaded] = useState(false);
  const isTasksLoadedRef = useRef(false);

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setAuthError(error.message);
      } else if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setIsLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const appUser = mapSupabaseUser(session.user);
        setUser(appUser);
        setAuthError(null);
        if (appUser) {
          try {
            await userService.registerTeamMember(appUser.uid, {
              uid: appUser.uid,
              displayName: appUser.displayName || undefined,
              photoURL: appUser.photoURL || undefined,
              email: appUser.email || undefined,
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = taskService.subscribeToTasks((tasks) => {
      setTasks(tasks);
      if (!isTasksLoadedRef.current) {
        isTasksLoadedRef.current = true;
        setIsTasksLoaded(true);
      }
    }, (error) => {
      setAuthError("Supabase Read Error: " + error.message);
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user, setTasks]);

  return {
    user,
    authError,
    isLoading,
    isTasksLoaded
  };
};
