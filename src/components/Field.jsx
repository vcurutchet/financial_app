import { cloneElement } from 'react'

const inputStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 'var(--radius)',
  padding: '0.45rem 0.6rem',
  width: '100%',
  font: 'inherit',
}

export default function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{label}</span>
      {cloneElement(children, { style: inputStyle })}
    </label>
  )
}
