import { NavLink, Outlet, useLocation } from 'react-router-dom'
import styles from './Layout.module.scss'

const PAGE_TITLES = {
  '/compartido': 'Compartido',
  '/personal': 'Personal',
  '/nuevo-gasto': 'Nuevo gasto',
  '/configuracion': 'Configuración',
}

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

export default function Layout() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Gastos del Hogar'

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span className={styles.appName}>🏠</span>
        <h1 className={styles.pageTitle}>{title}</h1>
        <div className={styles.headerRight} />
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.nav}>
        <NavLink to="/compartido" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <IconHome />
          <span>Compartido</span>
        </NavLink>

        <NavLink to="/personal" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <IconUser />
          <span>Personal</span>
        </NavLink>

        <NavLink to="/nuevo-gasto" className={({ isActive }) => `${styles.navItem} ${styles.fabItem} ${isActive ? styles.fabActive : ''}`}>
          <div className={styles.fab}>
            <IconPlus />
          </div>
        </NavLink>

        <NavLink to="/configuracion" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <IconSettings />
          <span>Config</span>
        </NavLink>
      </nav>
    </div>
  )
}
