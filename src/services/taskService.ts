import { supabase } from '../supabase';
import { Task, SubTask } from '../utils/helpers';

export const subscribeToTasks = (callback: (tasks: Task[]) => void, onError?: (error: any) => void) => {
  supabase
    .from('tasks')
    .select('*')
    .then(({ data, error }) => {
      if (error) {
        if (onError) onError(error);
        return;
      }
      if (data) {
        const tasks = data.map(d => ({
          id: d.id,
          title: d.title,
          notes: d.notes,
          type: d.timer_type || d.type, // Map timer_type to type
          difficulty: d.difficulty,
          urgency: d.urgency,
          isDone: d.is_done,
          isHidden: d.is_hidden,
          assigneeId: d.assignee_id,
          priority: d.priority === 2 ? 'high' : d.priority === 1 ? 'medium' : 'low',
          createdAt: d.created_at,
          completedAt: d.completed_at,
          status: d.status,
          deadline: d.deadline,
          createdBy: d.created_by,
          assigneeName: d.assignee_name,
          assigneePhoto: d.assignee_photo,
          limitTime: d.limit_time,
          totalTrackedTime: d.total_tracked_time,
          lastStartTime: d.last_start_time,
          lastHeartbeat: d.last_heartbeat,
          isAutomated: d.is_automated,
          subTasks: d.sub_tasks,
          autoPauseReason: d.auto_pause_reason,
          currentWorker: d.current_worker,
          currentWorkerName: d.current_worker_name,
          autoPausedAt: d.auto_paused_at,
          endTime: d.end_time,
          scheduledStartTime: d.scheduled_start_time,
          scheduledEndTime: d.scheduled_end_time,
          calendarEventId: d.calendar_event_id
        } as Task));
        callback(tasks);
      }
    });

  const channel = supabase.channel('public:tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
      // Re-fetch all tasks on any change
      supabase
        .from('tasks')
        .select('*')
        .then(({ data, error }) => {
          if (!error && data) {
            const tasks = data.map(d => ({
              id: d.id,
              title: d.title,
              notes: d.notes,
              type: d.timer_type || d.type,
              difficulty: d.difficulty,
              urgency: d.urgency,
              isDone: d.is_done,
              isHidden: d.is_hidden,
              assigneeId: d.assignee_id,
              priority: d.priority === 2 ? 'high' : d.priority === 1 ? 'medium' : 'low',
              createdAt: d.created_at,
              completedAt: d.completed_at,
              status: d.status,
              deadline: d.deadline,
              createdBy: d.created_by,
              assigneeName: d.assignee_name,
              assigneePhoto: d.assignee_photo,
              limitTime: d.limit_time,
              totalTrackedTime: d.total_tracked_time,
              lastStartTime: d.last_start_time,
              lastHeartbeat: d.last_heartbeat,
              isAutomated: d.is_automated,
              subTasks: d.sub_tasks,
              autoPauseReason: d.auto_pause_reason,
              currentWorker: d.current_worker,
              currentWorkerName: d.current_worker_name,
              autoPausedAt: d.auto_paused_at,
              endTime: d.end_time,
              scheduledStartTime: d.scheduled_start_time,
              scheduledEndTime: d.scheduled_end_time,
              calendarEventId: d.calendar_event_id
            } as Task));
            callback(tasks);
          }
        });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const addTask = async (taskData: Omit<Task, 'id'>): Promise<{ id: string }> => {
  const id = crypto.randomUUID();
  const { error } = await supabase.from('tasks').insert({
    id,
    title: taskData.title,
    notes: (taskData as any).notes || '',
    type: 'oneoff', // Default fallback
    timer_type: taskData.type,
    difficulty: (taskData as any).difficulty || 'medium',
    urgency: (taskData as any).urgency || 'normal',
    is_done: (taskData as any).isDone || taskData.status === 'completed',
    is_hidden: (taskData as any).isHidden || false,
    assignee_id: taskData.assigneeId || null,
    priority: taskData.priority === 'high' ? 2 : taskData.priority === 'medium' ? 1 : 0,
    created_at: taskData.createdAt || Date.now(),
    completed_at: (taskData as any).completedAt || (taskData.status === 'completed' ? taskData.endTime : null),
    status: taskData.status || 'idle',
    deadline: taskData.deadline || null,
    created_by: taskData.createdBy || null,
    assignee_name: taskData.assigneeName || null,
    assignee_photo: taskData.assigneePhoto || null,
    limit_time: taskData.limitTime || null,
    total_tracked_time: taskData.totalTrackedTime || 0,
    last_start_time: taskData.lastStartTime || null,
    last_heartbeat: taskData.lastHeartbeat || null,
    is_automated: taskData.isAutomated || false,
    sub_tasks: taskData.subTasks || [],
    auto_pause_reason: taskData.autoPauseReason || null,
    current_worker: taskData.currentWorker || null,
    current_worker_name: taskData.currentWorkerName || null,
    auto_paused_at: taskData.autoPausedAt || null,
    end_time: taskData.endTime || null,
    scheduled_start_time: taskData.scheduledStartTime || null,
    scheduled_end_time: taskData.scheduledEndTime || null,
    calendar_event_id: taskData.calendarEventId || null
  });

  if (error) {
    console.error("Error adding task:", error);
    throw error;
  }
  return { id };
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  const dbUpdates: any = {};
  
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if ((updates as any).notes !== undefined) dbUpdates.notes = (updates as any).notes;
  if (updates.type !== undefined) dbUpdates.timer_type = updates.type;
  if ((updates as any).difficulty !== undefined) dbUpdates.difficulty = (updates as any).difficulty;
  if ((updates as any).urgency !== undefined) dbUpdates.urgency = (updates as any).urgency;
  if ((updates as any).isDone !== undefined) dbUpdates.is_done = (updates as any).isDone;
  if ((updates as any).isHidden !== undefined) dbUpdates.is_hidden = (updates as any).isHidden;
  if (updates.assigneeId !== undefined) dbUpdates.assignee_id = updates.assigneeId;
  if (updates.priority !== undefined) dbUpdates.priority = typeof updates.priority === 'number' ? updates.priority : 0;
  if (updates.createdAt !== undefined) dbUpdates.created_at = updates.createdAt;
  if ((updates as any).completedAt !== undefined) dbUpdates.completed_at = (updates as any).completedAt;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
  if (updates.createdBy !== undefined) dbUpdates.created_by = updates.createdBy;
  if (updates.assigneeName !== undefined) dbUpdates.assignee_name = updates.assigneeName;
  if (updates.assigneePhoto !== undefined) dbUpdates.assignee_photo = updates.assigneePhoto;
  if (updates.limitTime !== undefined) dbUpdates.limit_time = updates.limitTime;
  if (updates.totalTrackedTime !== undefined) dbUpdates.total_tracked_time = updates.totalTrackedTime;
  if (updates.lastStartTime !== undefined) dbUpdates.last_start_time = updates.lastStartTime;
  if (updates.lastHeartbeat !== undefined) dbUpdates.last_heartbeat = updates.lastHeartbeat;
  if (updates.isAutomated !== undefined) dbUpdates.is_automated = updates.isAutomated;
  if (updates.subTasks !== undefined) dbUpdates.sub_tasks = updates.subTasks;
  if (updates.autoPauseReason !== undefined) dbUpdates.auto_pause_reason = updates.autoPauseReason;
  if (updates.currentWorker !== undefined) dbUpdates.current_worker = updates.currentWorker;
  if (updates.currentWorkerName !== undefined) dbUpdates.current_worker_name = updates.currentWorkerName;
  if (updates.autoPausedAt !== undefined) dbUpdates.auto_paused_at = updates.autoPausedAt;
  if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
  if (updates.scheduledStartTime !== undefined) dbUpdates.scheduled_start_time = updates.scheduledStartTime;
  if (updates.scheduledEndTime !== undefined) dbUpdates.scheduled_end_time = updates.scheduledEndTime;
  if (updates.calendarEventId !== undefined) dbUpdates.calendar_event_id = updates.calendarEventId;

  if (Object.keys(dbUpdates).length === 0) return;

  const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
  if (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

export const updateSubTasks = async (taskId: string, subTasks: SubTask[]): Promise<void> => {
  return await updateTask(taskId, { subTasks });
};
