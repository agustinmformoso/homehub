import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'
import ExpenseCard from '../components/ExpenseCard'
import styles from './DashboardShared.module.scss'

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

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function DashboardShared() {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    setLoading(true)
    api.get(`/api/dashboard/shared?month=${month}&year=${year}`)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [month, year])

  const fetchAlerts = useCallback(() => {
    api.get(`/api/alerts/status?month=${month}&year=${year}&scope=compartido`)
      .then((res) => setAlerts(res.data))
      .catch(console.error)
  }, [month, year])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const toggleAlert = async (alertId, isPaid) => {
    const endpoint = isPaid ? 'unpay' : 'pay'
    await api.post(`/api/alerts/status/${alertId}/${endpoint}?month=${month}&year=${year}`)
    fetchAlerts()
  }

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  const nextMonth = () => {
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear()
    if (isCurrentMonth) return
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear()

  const getTotalForUser = (username) => {
    if (!data) return 0
    const found = data.totals.byUser.find((u) => u.user.username === username)
    return found?.total ?? 0
  }

  return (
    <div className={styles.page}>

      {/* Selector de mes */}
      <div className={styles.monthNav}>
        <button onClick={prevMonth} className={styles.navBtn}>‹</button>
        <span className={styles.monthLabel}>{MONTH_NAMES[month - 1]} {year}</span>
        <button onClick={nextMonth} className={styles.navBtn} disabled={isCurrentMonth}>›</button>
      </div>

      {/* Cards de totales */}
      <div className={styles.totalsGrid}>
        <div className={`${styles.totalCard} ${styles.rosa}`}>
          <span className={styles.totalName}>Claris</span>
          <span className={styles.totalAmount}>
            {loading ? '—' : formatARS(getTotalForUser('clara'))}
          </span>
        </div>

        <div className={`${styles.totalCard} ${styles.combined}`}>
          <span className={styles.totalName}>Total</span>
          <span className={styles.totalAmount}>
            {loading ? '—' : formatARS(data?.totals.combined ?? 0)}
          </span>
        </div>

        <div className={`${styles.totalCard} ${styles.celeste}`}>
          <span className={styles.totalName}>Agustín</span>
          <span className={styles.totalAmount}>
            {loading ? '—' : formatARS(getTotalForUser('agustin'))}
          </span>
        </div>
      </div>

      {/* Alertas compartidas */}
      {alerts.length > 0 && (
        <div className={styles.alertsWidget}>
          <h3 className={styles.alertsTitle}>Pagos del mes</h3>
          <ul className={styles.alertList}>
            {alerts.filter((a) => !a.paid_at).map((a) => (
              <li key={a._id} className={styles.alertItem}>
                <span className={styles.alertName}>{a.alert_id?.name}</span>
                <button className={styles.alertBtn} onClick={() => toggleAlert(a.alert_id._id, false)}>
                  Marcar pagado
                </button>
              </li>
            ))}
            {alerts.filter((a) => a.paid_at).map((a) => (
              <li key={a._id} className={`${styles.alertItem} ${styles.alertPaid}`}>
                <span className={styles.alertName}>{a.alert_id?.name}</span>
                <button className={`${styles.alertBtn} ${styles.alertBtnPaid}`} onClick={() => toggleAlert(a.alert_id._id, true)}>
                  ✓ Pagado
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lista de gastos */}
      <div className={styles.expenseList}>
        {loading && <p className={styles.empty}>Cargando...</p>}

        {!loading && data?.expenses.length === 0 && (
          <p className={styles.empty}>Sin gastos este mes.</p>
        )}

        {!loading && data?.expenses.map((expense) => (
          <ExpenseCard
            key={expense._id}
            expense={expense}
            colorBy="user"
            onDeleted={(id) =>
              setData((prev) => ({
                ...prev,
                expenses: prev.expenses.filter((e) => e._id !== id),
                totals: {
                  combined: prev.totals.combined - expense.amount,
                  byUser: prev.totals.byUser.map((u) =>
                    u.user.username === expense.user_id?.username
                      ? { ...u, total: u.total - expense.amount }
                      : u
                  ),
                },
              }))
            }
          />
        ))}
      </div>

    </div>
  )
}
