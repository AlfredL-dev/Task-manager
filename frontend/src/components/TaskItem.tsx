import { useState } from 'react'
import type { Task, TaskState } from '../types'
import { TaskForm } from './TaskForm'
import { updateTask, deleteTask } from '../api/tasks'

interface Props {
  task: Task
  onUpdated: (task: Task) => void
  onDeleted: (id: number) => void
}


export function TaskItem({ task, onUpdated, onDeleted }: Props) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleEdit(data: {
    title: string
    description: string | null
    status: TaskState
    dueDate: string | null
  }) {
    const updated = await updateTask(task.id, data)
    onUpdated(updated)
    setEditing(false)
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteTask(task.id)
      onDeleted(task.id)
    } catch (err) {
      // Task stays in list; error shown inline
      setDeleteError(err instanceof Error ? err.message : 'Delete failed.')
      setDeleting(false)
    }
  }

  async function handleStatusChange(next: TaskState) {
    const updated = await updateTask(task.id, {
      title: task.title,
      description: task.description,
      status: next,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : null,
    })
    onUpdated(updated)
  }

  if (editing) {
    return (
      <li className="task-item">
        <TaskForm
          task={task}
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className={`task-item ${task.status === 'Done' ? 'task-done' : ''}`}>
      <div className="task-main">
        <div className="task-content">
          <span className="task-title">{task.title}</span>
          {task.description && (
            <span className="task-description">{task.description}</span>
          )}
          <div className="task-meta">
            <select
              className={`status-select status-${task.status.toLowerCase()}`}
              value={task.status}
              onChange={e => handleStatusChange(e.target.value as TaskState)}
              aria-label="Task status"
            >
              <option value="Pending">Pending</option>
              <option value="InProgress">In Progress</option>
              <option value="Done">Done</option>
            </select>
            {task.dueDate && (
              <span className="task-due">
                Due: {new Date(task.dueDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="task-actions">
        <button onClick={() => setEditing(true)}>Edit</button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn-danger"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>

      {deleteError && (
        <p className="form-error" role="alert">{deleteError}</p>
      )}
    </li>
  )
}
