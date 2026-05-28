export type TaskState = 'Pending' | 'InProgress' | 'Done'

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskState
  dueDate: string | null   // ISO UTC string from API
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  token: string
  email: string
}

// What we store in context after login
export interface AuthUser {
  email: string
  token: string
}
