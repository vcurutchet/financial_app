import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import { Plus, Wallet, TrendingUp, TrendingDown, PiggyBank, ChevronRight, ChevronDown } from 'lucide-react'
import { useProfiles } from '../hooks/useProfiles'
import { useAccounts } from '../hooks/useAccounts'
import { useTransactions, useAddTransaction, useDeleteTransaction } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useAssets } from '../hooks/useAssets'
import TransactionCard from '../components/TransactionCard'
import Field from '../components/Field'

// ─── Helpers ────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n ?? 0)

const fmtFull = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0)

function last6Months() {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    months.push(d.toISOString().slice(0, 7))
  }
  return months
}

const ASSET_META = {
  immo:    { label: 'Immobilier',  color: '#6366f1' },
  stocks:  { label: 'Actions/ETF', color: '#22c55e' },
  savings: { label: 'Livrets',     color: '#f59e0b' },
  crypto:  { label: 'Crypto',      color: '#ec4899' },
  other:   { label: 'Autre',       color: '#94a3b8' },
}

const TX_TYPES_PERSO = [
  { value: 'expense', label: 'Dépense' },
  { value: 'other',   label: 'Revenu / autre' },
  { value: 'transfer', label: 'Virement' },
]

const EMPTY_FORM = {
  direction: 'out',
  type: 'expense',
  amount: '',
  label: '',
  date: new Date().toISOString().slice(0, 10),
  category_id: '',
  notes: '',
}

// ─── Sous-composants ────────────────────────────────────────
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

function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${Math.round(percent * 100)}%`}
    </text>
  )
}

function AssetGroup({ meta, value, total, items }) {
  const [open, setOpen] = useState(false)
  const share = total > 0 ? (value / total) * 100 : 0
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen((s) => !s)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.9rem 0', background: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>{meta.label}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginRight: '0.5rem' }}>
          {share.toFixed(1)}%
        </span>
        <span style={{ fontWeight: 700, minWidth: 90, textAlign: 'right' }}>{fmt(value)}</span>
        {open ? <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />}
      </button>
      {open && (
        <div style={{ paddingBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {items.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0 0.3rem 1.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{a.name}</span>
              <span>{fmtFull(a.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page principale ─────────────────────────────────────────
export default function Perso() {
  const [showForm, setShowForm] = useState(false)
  const [showAllTx, setShowAllTx] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: profiles = [] } = useProfiles()
  const persoProfile = profiles.find((p) => p.type === 'perso')

  const { data: accounts = [] } = useAccounts(persoProfile?.id)
  const { data: persoCategories = [] } = useCategories({ scope: 'perso' })
  const { data: assets = [] } = useAssets(persoProfile?.id)

  // Transactions des 6 derniers mois pour les graphes
  const sixMonthsAgo = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 5)
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  }, [])

  const { data: transactions = [], isLoading } = useTransactions({
    profileId: persoProfile?.id,
    since: sixMonthsAgo,
  })

  const addTx = useAddTransaction()
  const deleteTx = useDeleteTransaction()

  // ── Stats globales ──
  const solde = useMemo(() => accounts.reduce((s, a) => s + (a.balance ?? 0), 0), [accounts])

  const currentMonth = new Date().toISOString().slice(0, 7)

  const monthStats = useMemo(() => {
    const txThisMonth = transactions.filter((t) => t.date?.slice(0, 7) === currentMonth)
    const entrees = txThisMonth.filter((t) => t.direction === 'in').reduce((s, t) => s + t.amount, 0)
    const sorties = txThisMonth.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0)
    return { entrees, sorties, solde: entrees - sorties }
  }, [transactions, currentMonth])

  // ── Données graphe barres (6 mois) ──
  const barData = useMemo(() => {
    const months = last6Months()
    const map = Object.fromEntries(months.map((m) => [m, { month: m, entrees: 0, sorties: 0 }]))
    transactions.forEach((tx) => {
      const m = tx.date?.slice(0, 7)
      if (!map[m]) return
      if (tx.direction === 'in') map[m].entrees += tx.amount
      else map[m].sorties += tx.amount
    })
    return months.map((m) => ({
      ...map[m],
      month: new Date(m + '-15').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
    }))
  }, [transactions])

  // ── Données camembert (dépenses mois en cours par catégorie) ──
  const pieData = useMemo(() => {
    const byCat = {}
    transactions
      .filter((t) => t.direction === 'out' && t.date?.slice(0, 7) === currentMonth)
      .forEach((t) => {
        const name = t.category?.name ?? 'Non catégorisé'
        const color = t.category?.color ?? '#94a3b8'
        if (!byCat[name]) byCat[name] = { name, value: 0, color }
        byCat[name].value += t.amount
      })
    return Object.values(byCat).sort((a, b) => b.value - a.value)
  }, [transactions, currentMonth])

  // ── Patrimoine ──
  const patrimoine = useMemo(() => {
    const total = assets.reduce((s, a) => s + a.value, 0)
    const grouped = {}
    assets.forEach((a) => {
      if (!grouped[a.category]) grouped[a.category] = { value: 0, items: [] }
      grouped[a.category].value += a.value
      grouped[a.category].items.push(a)
    })
    return { total, grouped }
  }, [assets])

  // ── Formulaire ──
  function handleField(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!persoProfile) return
    addTx.mutate(
      {
        ...form,
        amount: parseFloat(form.amount),
        profile_id: persoProfile.id,
        category_id: form.category_id || null,
      },
      { onSuccess: () => { setShowForm(false); setForm(EMPTY_FORM) } },
    )
  }

  const recentTx = showAllTx ? transactions : transactions.slice(0, 8)

  // ─── Rendu ────────────────────────────────────────────────
  if (!persoProfile) {
    return (
      <div className="page">
        <h1 className="page-title">Budget Perso</h1>
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Aucun profil perso trouvé.</p>
          <p style={{ fontSize: '0.85rem' }}>
            <code style={{ color: 'var(--primary)' }}>
              insert into profiles (user_id, type, name) values (auth.uid(), 'perso', 'Perso');
            </code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Budget Perso</h1>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
        <StatCard label="Solde comptes" value={fmt(solde)} icon={Wallet}
          sub={accounts.length > 0 ? `${accounts.length} compte${accounts.length > 1 ? 's' : ''}` : 'Aucun compte'}
          color={solde >= 0 ? 'positive' : 'negative'} />
        <StatCard label="Entrées ce mois" value={fmt(monthStats.entrees)} icon={TrendingUp} color="positive" />
        <StatCard label="Sorties ce mois" value={fmt(monthStats.sorties)} icon={TrendingDown} color="negative" />
        <StatCard label="Solde du mois" value={fmt(monthStats.solde)} icon={PiggyBank}
          color={monthStats.solde >= 0 ? 'positive' : 'negative'} />
      </div>

      {/* Graphes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Barres : entrées vs sorties 6 mois */}
        <div className="card">
          <p style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9rem' }}>
            Entrées vs Sorties — 6 mois
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={12}>
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={55}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                formatter={(v) => fmtFull(v)}
              />
              <Legend />
              <Bar dataKey="entrees" name="Entrées" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sorties" name="Sorties" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Camembert : dépenses par catégorie ce mois */}
        <div className="card">
          <p style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9rem' }}>
            Dépenses par catégorie — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
          {pieData.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Aucune dépense ce mois
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  labelLine={false}
                  label={CustomPieLabel}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                  formatter={(v) => fmtFull(v)}
                />
                <Legend
                  formatter={(value) => <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Patrimoine */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Patrimoine</p>
          <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>{fmt(patrimoine.total)}</p>
        </div>
        {/* Barre de répartition */}
        {patrimoine.total > 0 && (
          <div style={{ display: 'flex', height: 8, borderRadius: 9999, overflow: 'hidden', marginBottom: '1rem', gap: 2 }}>
            {Object.entries(patrimoine.grouped).map(([cat, { value }]) => (
              <div
                key={cat}
                title={`${ASSET_META[cat]?.label} : ${fmt(value)}`}
                style={{
                  width: `${(value / patrimoine.total) * 100}%`,
                  background: ASSET_META[cat]?.color ?? '#94a3b8',
                  minWidth: value > 0 ? 4 : 0,
                  transition: 'width 0.4s',
                }}
              />
            ))}
          </div>
        )}
        {assets.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>
            Aucun actif enregistré. Ajouter via Supabase ou prochainement via l'interface.
          </p>
        ) : (
          <div>
            {Object.entries(patrimoine.grouped).map(([cat, { value, items }]) => (
              <AssetGroup
                key={cat}
                meta={ASSET_META[cat] ?? { label: cat, color: '#94a3b8' }}
                value={value}
                total={patrimoine.total}
                items={items}
              />
            ))}
          </div>
        )}
      </div>

      {/* Formulaire */}
      {showForm && (
        <form className="card" onSubmit={handleSubmit} style={{ marginBottom: '1.5rem', display: 'grid', gap: '0.9rem' }}>
          <p style={{ fontWeight: 600 }}>Nouvelle transaction</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Sens">
              <select value={form.direction} onChange={(e) => handleField('direction', e.target.value)}>
                <option value="out">Sortie (dépense)</option>
                <option value="in">Entrée (revenu)</option>
              </select>
            </Field>
            <Field label="Type">
              <select value={form.type} onChange={(e) => handleField('type', e.target.value)}>
                {TX_TYPES_PERSO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
              placeholder="Ex : Courses Carrefour" />
          </Field>
          {persoCategories.length > 0 && (
            <Field label="Catégorie (optionnel)">
              <select value={form.category_id} onChange={(e) => handleField('category_id', e.target.value)}>
                <option value="">— Aucune —</option>
                {persoCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={addTx.isPending}>
              {addTx.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {/* Transactions récentes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <p style={{ fontWeight: 600 }}>Transactions récentes</p>
        {transactions.length > 8 && (
          <button className="btn btn-ghost" style={{ fontSize: '0.8rem', gap: '0.25rem' }} onClick={() => setShowAllTx((s) => !s)}>
            {showAllTx ? 'Voir moins' : `Voir les ${transactions.length}`} <ChevronRight size={14} />
          </button>
        )}
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
      ) : recentTx.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
          Aucune transaction sur les 6 derniers mois.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {recentTx.map((tx) => (
            <TransactionCard key={tx.id} tx={tx} onDelete={() => deleteTx.mutate(tx.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
