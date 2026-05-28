import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTasks, createTask } from '../api/tasks'
import { ApiError } from '../api/client'
import { TaskItem } from '../components/TaskItem'
import { TaskForm } from '../components/TaskForm'
import type { Task, TaskState } from '../types'

const FILTERS: { label: string; value: TaskState | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'InProgress' },
  { label: 'Done', value: 'Done' },
]

export function TasksPage() {
  const { user, signOut } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<TaskState | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getTasks(filter)
      setTasks(data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        signOut() // Token expired — redirect to login
        return
      }
      setLoadError(err instanceof Error ? err.message : 'Failed to load tasks.')
    } finally {
      setLoading(false)
    }
  }, [filter, signOut])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  async function handleCreate(data: {
    title: string
    description: string | null
    status: TaskState
    dueDate: string | null
  }) {
    const created = await createTask(data)
    // Prepend to list — no page refresh needed
    setTasks(prev => [created, ...prev])
    setShowCreateForm(false)
  }

  function handleUpdated(updated: Task) {
    setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)))
  }

  function handleDeleted(id: number) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>My Tasks</h1>
        <div className="header-right">
          <span className="user-email">{user?.email}</span>
          <button onClick={signOut} className="btn-secondary">Sign out</button>
        </div>
      </header>

      <div className="toolbar">
        <div className="filters">
          {FILTERS.map(f => (
            <button
              key={f.label}
              className={`filter-btn ${filter === f.value ? 'active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowCreateForm(v => !v)}
        >
          {showCreateForm ? 'Cancel' : '+ New task'}
        </button>
      </div>

      {showCreateForm && (
        <TaskForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {loadError && (
        <p className="page-error" role="alert">
          {loadError}{' '}
          <button onClick={loadTasks} className="btn-link">Retry</button>
        </p>
      )}

      {loading && <p className="loading">Loading tasks…</p>}

      {!loading && !loadError && tasks.length === 0 && (
        <p className="empty-state">
          No tasks yet.{' '}
          {!showCreateForm && (
            <button
              className="btn-link"
              onClick={() => setShowCreateForm(true)}
            >
              Create one.
            </button>
          )}
        </p>
      )}

      {!loading && tasks.length > 0 && (
        <ul className="task-list">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
