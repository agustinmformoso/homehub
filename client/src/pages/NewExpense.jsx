import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/api'
import styles from './NewExpense.module.scss'

function toDateISO(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayISO() {
  return toDateISO(new Date())
}

export default function NewExpense() {
  const navigate = useNavigate()
  const location = useLocation()
  const existing = location.state?.expense ?? null
  const isEditing = !!existing

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    amount: '',
    category_id: '',
    description: '',
    date: todayISO(),
    type: 'compartido',
  })
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/categories').then((res) => {
      setCategories(res.data)

      if (isEditing) {
        setForm({
          amount: existing.amount,
          category_id: existing.category_id?._id ?? existing.category_id,
          description: existing.description ?? '',
          date: toDateISO(existing.date),
          type: existing.type,
        })
      } else if (res.data.length > 0) {
        setForm((prev) => ({ ...prev, category_id: res.data[0]._id }))
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleCategoryChange = (e) => {
    if (e.target.value === '__new__') {
      setShowNewCategory(true)
    } else {
      setShowNewCategory(false)
      setForm((prev) => ({ ...prev, category_id: e.target.value }))
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const res = await api.post('/api/categories', { name: newCategoryName.trim() })
      setCategories((prev) => [...prev, res.data])
      setForm((prev) => ({ ...prev, category_id: res.data._id }))
      setNewCategoryName('')
      setShowNewCategory(false)
    } catch {
      setError('No se pudo crear la categoría')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.category_id || !form.date) return

    setLoading(true)
    setError('')

    try {
      if (isEditing) {
        await api.put(`/api/expenses/${existing._id}`, {
          ...form,
          amount: parseFloat(form.amount),
        })
      } else {
        await api.post('/api/expenses', {
          ...form,
          amount: parseFloat(form.amount),
        })
      }
      navigate('/compartido')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el gasto')
      setLoading(false)
    }
  }

  const predefined = categories.filter((c) => c.type === 'predefined')
  const custom = categories.filter((c) => c.type === 'custom')

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>{isEditing ? 'Editar gasto' : 'Nuevo gasto'}</h2>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>

        <div className={styles.amountWrapper}>
          <span className={styles.currencySymbol}>$</span>
          <input
            name="amount"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="0"
            value={form.amount}
            onChange={handleChange}
            className={styles.amountInput}
            autoFocus={!isEditing}
          />
        </div>

        <div className={styles.typeToggle}>
          <button
            type="button"
            className={`${styles.typeBtn} ${form.type === 'compartido' ? styles.typeActive : ''}`}
            onClick={() => setForm((prev) => ({ ...prev, type: 'compartido' }))}
          >
            Compartido
          </button>
          <button
            type="button"
            className={`${styles.typeBtn} ${form.type === 'personal' ? styles.typeActive : ''}`}
            onClick={() => setForm((prev) => ({ ...prev, type: 'personal' }))}
          >
            Personal
          </button>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Categoría</label>
          <select
            className={styles.select}
            value={showNewCategory ? '__new__' : form.category_id}
            onChange={handleCategoryChange}
          >
            {predefined.length > 0 && (
              <optgroup label="Predefinidas">
                {predefined.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </optgroup>
            )}
            {custom.length > 0 && (
              <optgroup label="Mis categorías">
                {custom.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </optgroup>
            )}
            <option value="__new__">+ Nueva categoría...</option>
          </select>

          {showNewCategory && (
            <div className={styles.newCategoryRow}>
              <input
                type="text"
                className={styles.input}
                placeholder="Nombre de la categoría"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                autoFocus
              />
              <button
                type="button"
                className={styles.addCategoryBtn}
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
              >
                Agregar
              </button>
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Descripción <span className={styles.optional}>(opcional)</span></label>
          <input
            name="description"
            type="text"
            className={styles.input}
            placeholder="ej: Coto, Netflix, etc."
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Fecha</label>
          <input
            name="date"
            type="date"
            className={styles.input}
            value={form.date}
            onChange={handleChange}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !form.amount || !form.category_id}
          >
            {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar gasto'}
          </button>
        </div>

      </form>
    </div>
  )
}
