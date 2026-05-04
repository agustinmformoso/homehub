import { useState, useEffect } from 'react'
import api from '../lib/api'
import styles from './Agenda.module.scss'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function currentTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function groupByDate(entries) {
  return entries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = []
    acc[entry.date].push(entry)
    return acc
  }, {})
}

export default function Agenda() {
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({ date: todayISO(), time: currentTime(), title: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/agenda').then(res => setEntries(res.data)).catch(() => {})
  }, [])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.date || !form.time || !form.title.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/agenda', form)
      setEntries(prev => [...prev, res.data].sort((a, b) =>
        a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time)
      ))
      setForm(prev => ({ ...prev, title: '' }))
    } catch {
      setError('No se pudo guardar el evento')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/agenda/${id}`)
      setEntries(prev => prev.filter(e => e._id !== id))
    } catch {
      setError('No se pudo eliminar')
    }
  }

  const grouped = groupByDate(entries)
  const sortedDates = Object.keys(grouped).sort()

  return (
    <div className={styles.page}>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.dateTimeRow}>
          <input
            type="date"
            name="date"
            className={styles.input}
            value={form.date}
            onChange={handleChange}
            required
          />
          <input
            type="time"
            name="time"
            className={styles.inputTime}
            value={form.time}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.titleRow}>
          <input
            type="text"
            name="title"
            className={styles.input}
            placeholder="¿Qué es? ej: Nutricionista"
            value={form.title}
            onChange={handleChange}
            required
          />
          <button type="submit" className={styles.addBtn} disabled={loading || !form.title.trim()}>
            +
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      <div className={styles.list}>
        {sortedDates.length === 0 && (
          <p className={styles.empty}>No hay eventos cargados.</p>
        )}
        {sortedDates.map(date => (
          <div key={date} className={styles.dateGroup}>
            <h3 className={styles.dateLabel}>{formatDate(date)}</h3>
            {grouped[date].map(entry => (
              <div key={entry._id} className={styles.entry}>
                <span className={styles.timeChip}>{entry.time}</span>
                <span className={styles.entryTitle}>{entry.title}</span>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(entry._id)}
                  aria-label="Eliminar"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  )
}
