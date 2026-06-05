import { Trash2 } from 'lucide-react'

const fmt = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const fmtDate = (date) =>
  new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function TransactionCard({ tx, onDelete }) {
  const isIncome = tx.direction === 'income'

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.1rem' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 500, marginBottom: '0.2rem' }}>{tx.description || tx.category}</p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className={`badge ${isIncome ? 'badge-income' : 'badge-expense'}`}>
            {isIncome ? '+' : '−'} {fmt(tx.amount)}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{tx.category}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{fmtDate(tx.date)}</span>
        </div>
      </div>
      <button
        className="btn btn-ghost"
        onClick={onDelete}
        style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
        title="Supprimer"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
