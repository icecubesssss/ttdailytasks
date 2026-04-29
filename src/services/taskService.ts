import { db, appId } from '../firebase';
import { 
  collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, Unsubscribe, DocumentData, DocumentReference, deleteField
} from 'firebase/firestore';
import { Task, SubTask } from '../utils/helpers';

export const subscribeToTasks = (callback: (tasks: Task[]) => void, onError?: (error: any) => void): Unsubscribe | void => {
  try {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return { ...data, id: docSnap.id } as Task;
      });
      callback(tasks);
    }, (error) => {
      if (onError) onError(error);
    });
  } catch (error) {
    console.error("Error subscribing to tasks:", error);
    if (onError) onError(error);
  }
};

export const addTask = async (taskData: Omit<Task, 'id'>): Promise<DocumentReference> => {
  try {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    return await addDoc(q, taskData);
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  try {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId);
    const normalizedUpdates = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => [key, value === undefined ? deleteField() : value])
    );
    return await updateDoc(docRef, normalizedUpdates as DocumentData);
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId);
    return await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

export const updateSubTasks = async (taskId: string, subTasks: SubTask[]): Promise<void> => {
  return await updateTask(taskId, { subTasks });
};
