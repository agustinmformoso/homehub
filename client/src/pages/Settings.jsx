import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'
import styles from './Settings.module.scss'

export default function Settings() {
  const { user, logout } = useAuth()

  const [alerts, setAlerts] = useState([])
  const [categories, setCategories] = useState([])

  const [newAlertName, setNewAlertName] = useState('')
  const [newAlertCategory, setNewAlertCategory] = useState('')
  const [newAlertScope, setNewAlertScope] = useState('personal')
  const [addingAlert, setAddingAlert] = useState(false)

  useEffect(() => {
    api.get('/api/alerts').then((res) => setAlerts(res.data))
    api.get('/api/categories').then((res) => setCategories(res.data))
  }, [])

  const predefined = categories.filter((c) => c.type === 'predefined')
  const custom = categories.filter((c) => c.type === 'custom')

  // ── Alertas ────────────────────────────────────────────────

  const handleAddAlert = async () => {
    if (!newAlertName.trim()) return
    const res = await api.post('/api/alerts', {
      name: newAlertName.trim(),
      category_id: newAlertCategory || null,
      scope: newAlertScope,
    })
    setAlerts((prev) => [...prev, res.data])
    setNewAlertName('')
    setNewAlertCategory('')
    setNewAlertScope('personal')
    setAddingAlert(false)
  }

  const handleToggleAlert = async (alert) => {
    const res = await api.put(`/api/alerts/${alert._id}`, { is_active: !alert.is_active })
    setAlerts((prev) => prev.map((a) => (a._id === alert._id ? res.data : a)))
  }

  const handleDeleteAlert = async (id) => {
    await api.delete(`/api/alerts/${id}`)
    setAlerts((prev) => prev.filter((a) => a._id !== id))
  }

  // ── Categorías ─────────────────────────────────────────────

  const handleDeleteCategory = async (id) => {
    await api.delete(`/api/categories/${id}`)
    setCategories((prev) => prev.filter((c) => c._id !== id))
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>Configuración</h2>

      {/* ── Alertas mensuales ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Alertas mensuales</h3>
            <p className={styles.sectionDesc}>Pagos que querés recordar cada mes.</p>
          </div>
          <button className={styles.addBtn} onClick={() => setAddingAlert(true)}>
            + Agregar
          </button>
        </div>

        {addingAlert && (
          <div className={styles.addForm}>
            <input
              type="text"
              className={styles.input}
              placeholder="Nombre (ej: Expensas, Psicóloga)"
              value={newAlertName}
              onChange={(e) => setNewAlertName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAlert()}
              autoFocus
            />
            <select
              className={styles.select}
              value={newAlertCategory}
              onChange={(e) => setNewAlertCategory(e.target.value)}
            >
              <option value="">Sin categoría</option>
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
            </select>
            <div className={styles.scopeToggle}>
              <button
                type="button"
                className={`${styles.scopeBtn} ${newAlertScope === 'personal' ? styles.scopeActive : ''}`}
                onClick={() => setNewAlertScope('personal')}
              >
                Personal
              </button>
              <button
                type="button"
                className={`${styles.scopeBtn} ${newAlertScope === 'compartido' ? styles.scopeActive : ''}`}
                onClick={() => setNewAlertScope('compartido')}
              >
                Compartido
              </button>
            </div>
            <div className={styles.addFormActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => { setAddingAlert(false); setNewAlertName(''); setNewAlertCategory(''); setNewAlertScope('personal') }}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleAddAlert}
                disabled={!newAlertName.trim()}
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        {alerts.length === 0 && !addingAlert && (
          <p className={styles.empty}>No tenés alertas configuradas.</p>
        )}

        <ul className={styles.itemList}>
          {alerts.map((alert) => (
            <li key={alert._id} className={`${styles.item} ${!alert.is_active ? styles.inactive : ''}`}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{alert.name}</span>
                <span className={styles.itemSub}>
                  {alert.scope === 'compartido' ? 'Compartido' : 'Personal'}
                  {alert.category_id && ` · ${alert.category_id.name}`}
                </span>
              </div>
              <div className={styles.itemActions}>
                <button
                  className={`${styles.toggleBtn} ${alert.is_active ? styles.toggleActive : ''}`}
                  onClick={() => handleToggleAlert(alert)}
                  title={alert.is_active ? 'Desactivar' : 'Activar'}
                >
                  {alert.is_active ? 'Activa' : 'Inactiva'}
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteAlert(alert._id)}
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Categorías personalizadas ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Mis categorías</h3>
            <p className={styles.sectionDesc}>Categorías que creaste vos.</p>
          </div>
        </div>

        {custom.length === 0 && (
          <p className={styles.empty}>No creaste categorías personalizadas.</p>
        )}

        <ul className={styles.itemList}>
          {custom.map((cat) => (
            <li key={cat._id} className={styles.item}>
              <span className={styles.itemName}>{cat.name}</span>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDeleteCategory(cat._id)}
                title="Eliminar"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Cuenta ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Cuenta</h3>
        <div className={styles.accountRow}>
          <div>
            <p className={styles.itemName}>{user?.display_name}</p>
            <p className={styles.itemSub}>@{user?.username}</p>
          </div>
          <button className={styles.logoutBtn} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </section>

    </div>
  )
}
