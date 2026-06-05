import { Trash2 } from 'lucide-react'

const fmt = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const fmtDate = (date) =>
  new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function TransactionCard({ tx, onDelete }) {
  const isIn = tx.direction === 'in'

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.1rem' }}>
      <div
        style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: isIn ? '#14532d' : '#450a0a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem',
        }}
      >
        {isIn ? '↑' : '↓'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 500, marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tx.label}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {tx.category && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              padding: '0.15rem 0.5rem', borderRadius: '9999px',
              fontSize: '0.7rem', fontWeight: 600,
              background: tx.category.color + '22', color: tx.category.color,
            }}>
              {tx.category.name}
            </span>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{fmtDate(tx.date)}</span>
        </div>
      </div>
      <span style={{ fontWeight: 700, color: isIn ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
        {isIn ? '+' : '−'}{fmt(tx.amount)}
      </span>
      <button
        className="btn btn-ghost"
        onClick={onDelete}
        style={{ padding: '0.35rem', color: 'var(--text-muted)', flexShrink: 0 }}
        title="Supprimer"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
