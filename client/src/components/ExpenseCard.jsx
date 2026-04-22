import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'
import styles from './ExpenseCard.module.scss'

function formatARS(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
  })
}

const USER_COLORS = { agustin: 'celeste', clara: 'rosa' }

export default function ExpenseCard({ expense, onDeleted, colorBy = 'user' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const menuRef = useRef(null)

  const ownerUsername = expense.user_id?.username
  const ownerId = expense.user_id?._id ?? expense.user_id
  const isOwner = (ownerUsername && user?.username === ownerUsername)
    || (ownerId && user?._id && ownerId.toString() === user._id.toString())

  // Determinar color del border-left
  const color = colorBy === 'user'
    ? (USER_COLORS[ownerUsername] ?? 'celeste')
    : (expense.type === 'personal' ? 'rosa' : 'celeste')

  // Cerrar menú al tocar fuera
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
        setConfirming(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [menuOpen])

  const handleEdit = () => {
    setMenuOpen(false)
    navigate('/nuevo-gasto', { state: { expense } })
  }

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    await api.delete(`/api/expenses/${expense._id}`)
    setMenuOpen(false)
    onDeleted?.(expense._id)
  }

  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.main}>
        <div className={styles.left}>
          <span className={styles.category}>{expense.category_id?.name}</span>
          {expense.description && (
            <span className={styles.desc}>{expense.description}</span>
          )}
          <span className={styles.meta}>
            {expense.user_id?.display_name} · {formatDate(expense.date)}
            {expense.type === 'personal' && (
              <span className={styles.personalBadge}>personal</span>
            )}
          </span>
        </div>

        <div className={styles.right}>
          <span className={styles.amount}>{formatARS(expense.amount)}</span>

          {isOwner && (
            <div className={styles.menuWrapper} ref={menuRef}>
              <button
                className={styles.menuTrigger}
                onClick={() => { setMenuOpen((o) => !o); setConfirming(false) }}
                aria-label="Opciones"
              >
                ···
              </button>

              {menuOpen && (
                <div className={styles.menu}>
                  <button className={styles.menuItem} onClick={handleEdit}>
                    Editar
                  </button>
                  <button
                    className={`${styles.menuItem} ${styles.danger} ${confirming ? styles.confirming : ''}`}
                    onClick={handleDelete}
                  >
                    {confirming ? '¿Confirmar?' : 'Eliminar'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
