import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasks as api } from "../api";
import type { Task, TaskCreate, TaskUpdate } from "../types";

export function useTasks(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => api.list(filters),
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => api.get(id),
    staleTime: 60 * 1000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskCreate) => api.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskUpdate }) => api.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["tasks", id] });
      const prev = qc.getQueryData<Task>(["tasks", id]);
      if (prev) {
        qc.setQueryData(["tasks", id], { ...prev, ...data });
      }
      return { prev };
    },
    onError: (_err, { id }, context) => {
      if (context?.prev) qc.setQueryData(["tasks", id], context.prev);
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", id] });
    },
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task: Task) =>
      task.is_completed ? api.reopen(task.id) : api.complete(task.id),
    onMutate: async (task) => {
      await qc.cancelQueries({ queryKey: ["tasks", task.id] });
      const prev = qc.getQueryData<Task>(["tasks", task.id]);
      qc.setQueryData(["tasks", task.id], {
        ...task,
        is_completed: !task.is_completed,
      });
      qc.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) =>
        old?.map((t) =>
          t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
        )
      );
      return { prev };
    },
    onError: (_err, task, context) => {
      if (context?.prev) qc.setQueryData(["tasks", task.id], context.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
