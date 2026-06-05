import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Home } from 'lucide-react'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pro', label: 'Pro', icon: Briefcase },
  { to: '/perso', label: 'Perso', icon: Home },
]

export default function Navbar() {
  return (
    <nav style={{
      width: 220,
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      flexShrink: 0,
    }}>
      <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>
        Budget App
      </p>
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius)',
            color: isActive ? 'var(--text)' : 'var(--text-muted)',
            background: isActive ? 'var(--surface-2)' : 'transparent',
            fontWeight: isActive ? 600 : 400,
            transition: 'background 0.15s, color 0.15s',
          })}
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
