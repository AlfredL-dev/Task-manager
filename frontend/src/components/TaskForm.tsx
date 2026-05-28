import { useState, type FormEvent } from 'react'
import type { Task, TaskState } from '../types'

interface Props {
  // If editing, pass the existing task. If null, we're creating.
  task?: Task
  onSubmit: (data: {
    title: string
    description: string | null
    status: TaskState
    dueDate: string | null
  }) => Promise<void>
  onCancel: () => void
}

export function TaskForm({ task, onSubmit, onCancel }: Props) {
  // Pre-populate with existing values if editing
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<TaskState>(task?.status ?? 'Pending')
  // Convert UTC ISO to local YYYY-MM-DD for the date input
  // Slice the date part directly from the ISO string to avoid timezone shifts.
  // new Date("2026-05-12T00:00:00Z").toISOString() is safe, but constructing
  // a Date just to format it back is where the off-by-one creeps in.
  const [dueDate, setDueDate] = useState<string>(
    task?.dueDate ? task.dueDate.split('T')[0] : '',
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isEditing = Boolean(task)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    // Client-side validation — mirrors the backend rules
    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        status,
        dueDate: dueDate || null,
      })
    } catch (err) {
      // Preserve form values — do not reset on error
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <h2>{isEditing ? 'Edit task' : 'New task'}</h2>

      {error && <p className="form-error" role="alert">{error}</p>}

      <label>
        Title *
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={200}
          autoFocus
          disabled={submitting}
        />
      </label>

      <label>
        Description
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          disabled={submitting}
        />
      </label>

      {isEditing && (
        <label>
          Status
          <select
            value={status}
            onChange={e => setStatus(e.target.value as TaskState)}
            disabled={submitting}
          >
            <option value="Pending">Pending</option>
            <option value="InProgress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </label>
      )}

      <label>
        Due date
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          disabled={submitting}
        />
      </label>

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create task'}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
