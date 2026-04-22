import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'
import ExpenseCard from '../components/ExpenseCard'
import styles from './DashboardPersonal.module.scss'

const USER_COLOR = { agustin: 'celeste', clara: 'rosa' }

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

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

export default function DashboardPersonal() {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const [data, setData] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingAlerts, setLoadingAlerts] = useState(true)

  const color = USER_COLOR[user?.username] ?? 'celeste'
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear()

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  const nextMonth = () => {
    if (isCurrentMonth) return
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  useEffect(() => {
    setLoadingData(true)
    api.get(`/api/dashboard/personal?month=${month}&year=${year}`)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoadingData(false))
  }, [month, year])

  const fetchAlerts = useCallback(() => {
    setLoadingAlerts(true)
    api.get(`/api/alerts/status?month=${month}&year=${year}&scope=personal`)
      .then((res) => setAlerts(res.data))
      .catch(console.error)
      .finally(() => setLoadingAlerts(false))
  }, [month, year])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const toggleAlert = async (alertId, isPaid) => {
    const endpoint = isPaid ? 'unpay' : 'pay'
    await api.post(`/api/alerts/status/${alertId}/${endpoint}?month=${month}&year=${year}`)
    fetchAlerts()
  }

  const pendingAlerts = alerts.filter((a) => !a.paid_at)
  const paidAlerts = alerts.filter((a) => a.paid_at)

  return (
    <div className={styles.page}>

      {/* Selector de mes */}
      <div className={styles.monthNav}>
        <button onClick={prevMonth} className={styles.navBtn}>‹</button>
        <span className={styles.monthLabel}>{MONTH_NAMES[month - 1]} {year}</span>
        <button onClick={nextMonth} className={styles.navBtn} disabled={isCurrentMonth}>›</button>
      </div>

      {/* Total del mes */}
      <div className={`${styles.totalCard} ${styles[color]}`}>
        <span className={styles.totalLabel}>Tu gasto en {MONTH_NAMES[month - 1]}</span>
        <span className={styles.totalAmount}>
          {loadingData ? '—' : formatARS(data?.total ?? 0)}
        </span>
      </div>

      {/* Alertas mensuales */}
      {alerts.length > 0 && (
        <div className={styles.alertsWidget}>
          <h3 className={styles.sectionTitle}>Pagos del mes</h3>

          {loadingAlerts ? (
            <p className={styles.empty}>Cargando...</p>
          ) : (
            <ul className={styles.alertList}>
              {pendingAlerts.map((a) => (
                <li key={a._id} className={`${styles.alertItem} ${styles.pending}`}>
                  <div className={styles.alertInfo}>
                    <span className={styles.alertName}>{a.alert_id?.name}</span>
                    {a.alert_id?.category_id && (
                      <span className={styles.alertCategory}>{a.alert_id.category_id.name}</span>
                    )}
                  </div>
                  <button
                    className={styles.alertBtn}
                    onClick={() => toggleAlert(a.alert_id._id, false)}
                  >
                    Marcar pagado
                  </button>
                </li>
              ))}
              {paidAlerts.map((a) => (
                <li key={a._id} className={`${styles.alertItem} ${styles.paid}`}>
                  <div className={styles.alertInfo}>
                    <span className={styles.alertName}>{a.alert_id?.name}</span>
                    {a.alert_id?.category_id && (
                      <span className={styles.alertCategory}>{a.alert_id.category_id.name}</span>
                    )}
                  </div>
                  <button
                    className={`${styles.alertBtn} ${styles.alertBtnPaid}`}
                    onClick={() => toggleAlert(a.alert_id._id, true)}
                  >
                    ✓ Pagado
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Breakdown por categoría */}
      {!loadingData && data?.byCategory.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Por categoría</h3>
          <div className={styles.categoryList}>
            {data.byCategory.map(({ category, total, percentage }) => (
              <div key={category._id} className={styles.categoryRow}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryName}>{category.name}</span>
                  <span className={styles.categoryAmount}>{formatARS(total)}</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${styles[color]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className={styles.categoryPct}>{percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de gastos */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Gastos</h3>

        {loadingData && <p className={styles.empty}>Cargando...</p>}

        {!loadingData && data?.expenses.length === 0 && (
          <p className={styles.empty}>Sin gastos este mes.</p>
        )}

        <div className={styles.expenseList}>
          {!loadingData && data?.expenses.map((expense) => (
            <ExpenseCard
              key={expense._id}
              expense={expense}
              colorBy="user"
              onDeleted={(id) =>
                setData((prev) => ({
                  ...prev,
                  expenses: prev.expenses.filter((e) => e._id !== id),
                  total: prev.total - expense.amount,
                  byCategory: prev.byCategory
                    .map((c) =>
                      c.category._id === expense.category_id?._id
                        ? { ...c, total: c.total - expense.amount }
                        : c
                    )
                    .filter((c) => c.total > 0),
                }))
              }
            />
          ))}
        </div>
      </div>

    </div>
  )
}
