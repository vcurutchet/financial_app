import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTransactions, useAddTransaction, useDeleteTransaction } from '../hooks/useTransactions'
import { PRO_CATEGORIES } from '../hooks/useCategories'
import TransactionCard from '../components/TransactionCard'

const CURRENT_MONTH = new Date().toISOString().slice(0, 7)

export default function Pro() {
  const [month, setMonth] = useState(CURRENT_MONTH)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ direction: 'income', amount: '', category: PRO_CATEGORIES[0], description: '', date: new Date().toISOString().slice(0, 10) })

  const { data: transactions = [], isLoading } = useTransactions({ type: 'pro', month })
  const addTx = useAddTransaction()
  const deleteTx = useDeleteTransaction()

  const income = transactions.filter(t => t.direction === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.direction === 'expense').reduce((s, t) => s + t.amount, 0)

  function handleSubmit(e) {
    e.preventDefault()
    addTx.mutate({ ...form, type: 'pro', amount: parseFloat(form.amount) }, {
      onSuccess: () => { setShowForm(false); setForm({ direction: 'income', amount: '', category: PRO_CATEGORIES[0], description: '', date: new Date().toISOString().slice(0, 10) }) }
    })
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Budget Pro (EURL)</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)', padding: '0.4rem 0.75rem' }}
          />
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      <div className="grid-stats">
        <div className="card">
          <p className="stat-label">Recettes</p>
          <p className="stat-value positive">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(income)}
          </p>
        </div>
        <div className="card">
          <p className="stat-label">Charges</p>
          <p className="stat-value negative">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(expense)}
          </p>
        </div>
        <div className="card">
          <p className="stat-label">Résultat</p>
          <p className={`stat-value ${income - expense >= 0 ? 'positive' : 'negative'}`}>
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(income - expense)}
          </p>
        </div>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleSubmit} style={{ marginBottom: '1.5rem', display: 'grid', gap: '0.75rem' }}>
          <p style={{ fontWeight: 600 }}>Nouvelle transaction pro</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Type</span>
              <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)', padding: '0.4rem' }}>
                <option value="income">Recette</option>
                <option value="expense">Charge</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Montant (€)</span>
              <input type="number" step="0.01" min="0" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)', padding: '0.4rem' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Catégorie</span>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)', padding: '0.4rem' }}>
                {PRO_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Date</span>
              <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)', padding: '0.4rem' }} />
            </label>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Description</span>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)', padding: '0.4rem' }} />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={addTx.isPending}>
              {addTx.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p>Chargement...</p>
      ) : transactions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>Aucune transaction pour ce mois.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {transactions.map(tx => (
            <TransactionCard key={tx.id} tx={tx} onDelete={() => deleteTx.mutate(tx.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
