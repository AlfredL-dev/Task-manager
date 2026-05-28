import { api } from './client'
import type { Task, TaskState } from '../types'

export async function getTasks(status?: TaskState): Promise<Task[]> {
  const qs = status ? `?status=${status}` : ''
  return api.get<Task[]>(`/api/tasks${qs}`)
}

export async function createTask(data: {
  title: string
  description?: string | null
  dueDate?: string | null
}): Promise<Task> {
  return api.post<Task>('/api/tasks', data)
}

export async function updateTask(
  id: number,
  data: {
    title: string
    description?: string | null
    status: TaskState
    dueDate?: string | null
  },
): Promise<Task> {
  return api.put<Task>(`/api/tasks/${id}`, data)
}

export async function deleteTask(id: number): Promise<void> {
  return api.delete<void>(`/api/tasks/${id}`)
}
