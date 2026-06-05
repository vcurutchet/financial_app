import { useState, useMemo, cloneElement } from 'react'
import { Plus, Wallet, TrendingUp, TrendingDown, Target, ChevronRight } from 'lucide-react'
import { useProfiles } from '../hooks/useProfiles'
import { useAccounts } from '../hooks/useAccounts'
import { useCurrentFiscalYear } from '../hooks/useFiscalYears'
import { useTransactions, useAddTransaction, useDeleteTransaction } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import TransactionCard from '../components/TransactionCard'

const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n ?? 0)

const pct = (value, total) => (total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0)

function ProgressBar({ value, total, colorOk = '#6366f1', colorWarn = '#ef4444', warnThreshold = 90 }) {
  const p = pct(value, total)
  const color = p >= warnThreshold ? colorWarn : colorOk
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{fmt(value)} / {fmt(total)}</span>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color }}>{p}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{ width: `${p}%`, height: '100%', background: color, borderRadius: 9999, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, sub, color }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <p className="stat-label">{label}</p>
        <Icon size={18} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className={`stat-value ${color ?? ''}`} style={{ fontSize: '1.5rem' }}>{value}</p>
      {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{sub}</p>}
    </div>
  )
}

const TX_TYPES = [
  { value: 'invoice', label: 'Facture client' },
  { value: 'expense', label: 'Dépense' },
  { value: 'salary', label: 'Salaire' },
  { value: 'tax', label: 'Charges / impôts' },
  { value: 'transfer', label: 'Virement' },
  { value: 'other', label: 'Autre' },
]

const EMPTY_FORM = {
  direction: 'in',
  type: 'invoice',
  amount: '',
  label: '',
  date: new Date().toISOString().slice(0, 10),
  category_id: '',
  notes: '',
}

export default function Pro() {
  const [showForm, setShowForm] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  // Data
  const { data: profiles = [] } = useProfiles()
  const proProfile = profiles.find((p) => p.type === 'pro')

  const { data: accounts = [] } = useAccounts(proProfile?.id)
  const { data: fiscalYear } = useCurrentFiscalYear()
  const { data: proCategories = [] } = useCategories({ scope: 'pro' })

  const { data: transactions = [], isLoading } = useTransactions({
    profileId: proProfile?.id,
    fiscalYearId: fiscalYear?.id,
  })

  const addTx = useAddTransaction()
  const deleteTx = useDeleteTransaction()

  // Stats calculées
  const stats = useMemo(() => {
    const tresorerie = accounts.reduce((s, a) => s + (a.balance ?? 0), 0)
    const ca = transactions
      .filter((t) => t.direction === 'in' && t.type === 'invoice')
      .reduce((s, t) => s + t.amount, 0)
    const charges = transactions
      .filter((t) => t.direction === 'out' && ['expense', 'tax'].includes(t.type))
      .reduce((s, t) => s + t.amount, 0)
    const salaires = transactions
      .filter((t) => t.type === 'salary')
      .reduce((s, t) => s + t.amount, 0)
    return { tresorerie, ca, charges, salaires }
  }, [accounts, transactions])

  const displayed = showAll ? transactions : transactions.slice(0, 8)

  function handleField(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!proProfile) return
    addTx.mutate(
      {
        ...form,
        amount: parseFloat(form.amount),
        profile_id: proProfile.id,
        fiscal_year_id: fiscalYear?.id ?? null,
        category_id: form.category_id || null,
      },
      {
        onSuccess: () => {
          setShowForm(false)
          setForm(EMPTY_FORM)
        },
      },
    )
  }

  // ——— Rendu ———

  if (!proProfile) {
    return (
      <div className="page">
        <h1 className="page-title">Budget Pro (EURL)</h1>
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Aucun profil pro trouvé.</p>
          <p style={{ fontSize: '0.85rem' }}>
            Crée un profil dans Supabase :<br />
            <code style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
              insert into profiles (user_id, type, name) values (auth.uid(), 'pro', 'Mon EURL');
            </code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.2rem' }}>Budget Pro (EURL)</h1>
          {fiscalYear && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Exercice {fiscalYear.year} · {new Date(fiscalYear.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} → {new Date(fiscalYear.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard label="Trésorerie" value={fmt(stats.tresorerie)} icon={Wallet}
          sub={accounts.length > 0 ? `${accounts.length} compte${accounts.length > 1 ? 's' : ''}` : 'Aucun compte'}
          color={stats.tresorerie >= 0 ? 'positive' : 'negative'} />
        <StatCard label="CA exercice" value={fmt(stats.ca)} icon={TrendingUp}
          sub={fiscalYear ? `Objectif ${fmt(fiscalYear.revenue_target)}` : 'Pas d\'exercice'}
          color="positive" />
        <StatCard label="Charges" value={fmt(stats.charges)} icon={TrendingDown}
          sub={fiscalYear ? `Budget ${fmt(fiscalYear.expense_budget)}` : undefined}
          color="negative" />
        <StatCard label="Salaires versés" value={fmt(stats.salaires)} icon={Target}
          sub={fiscalYear ? `Budget ${fmt(fiscalYear.salary_budget)}` : undefined} />
      </div>

      {/* Barres de progression */}
      {fiscalYear && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'grid', gap: '1.25rem' }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={15} style={{ color: 'var(--success)' }} /> CA vs Objectif
            </p>
            <ProgressBar value={stats.ca} total={fiscalYear.revenue_target} colorOk="#22c55e" warnThreshold={101} />
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingDown size={15} style={{ color: 'var(--danger)' }} /> Charges vs Budget
            </p>
            <ProgressBar value={stats.charges} total={fiscalYear.expense_budget} colorOk="#6366f1" colorWarn="#ef4444" warnThreshold={85} />
          </div>
          {fiscalYear.salary_budget > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Target size={15} style={{ color: 'var(--warning)' }} /> Salaires vs Budget
              </p>
              <ProgressBar value={stats.salaires} total={fiscalYear.salary_budget} colorOk="#f59e0b" colorWarn="#ef4444" warnThreshold={90} />
            </div>
          )}
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <form className="card" onSubmit={handleSubmit} style={{ marginBottom: '1.5rem', display: 'grid', gap: '0.9rem' }}>
          <p style={{ fontWeight: 600 }}>Nouvelle transaction</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Sens">
              <select value={form.direction} onChange={(e) => handleField('direction', e.target.value)}>
                <option value="in">Entrée (recette)</option>
                <option value="out">Sortie (dépense)</option>
              </select>
            </Field>
            <Field label="Type">
              <select value={form.type} onChange={(e) => handleField('type', e.target.value)}>
                {TX_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Montant (€)">
              <input type="number" step="0.01" min="0" required value={form.amount}
                onChange={(e) => handleField('amount', e.target.value)} />
            </Field>
            <Field label="Date">
              <input type="date" required value={form.date}
                onChange={(e) => handleField('date', e.target.value)} />
            </Field>
          </div>

          <Field label="Libellé">
            <input type="text" required value={form.label}
              onChange={(e) => handleField('label', e.target.value)}
              placeholder="Ex : Facture Acme Q2 2026" />
          </Field>

          {proCategories.length > 0 && (
            <Field label="Catégorie (optionnel)">
              <select value={form.category_id} onChange={(e) => handleField('category_id', e.target.value)}>
                <option value="">— Aucune —</option>
                {proCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}

          <Field label="Notes (optionnel)">
            <input type="text" value={form.notes} onChange={(e) => handleField('notes', e.target.value)} />
          </Field>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={addTx.isPending}>
              {addTx.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {/* Liste transactions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <p style={{ fontWeight: 600 }}>Dernières transactions</p>
        {transactions.length > 8 && (
          <button className="btn btn-ghost" style={{ fontSize: '0.8rem', gap: '0.25rem' }} onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Voir moins' : `Voir les ${transactions.length}`} <ChevronRight size={14} />
          </button>
        )}
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
      ) : displayed.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
          Aucune transaction pour cet exercice.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {displayed.map((tx) => (
            <TransactionCard key={tx.id} tx={tx} onDelete={() => deleteTx.mutate(tx.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  const inputStyle = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 'var(--radius)',
    padding: '0.45rem 0.6rem',
    width: '100%',
    font: 'inherit',
  }
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{label}</span>
      {cloneElement(children, { style: inputStyle })}
    </label>
  )
}
