import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { useTransactions } from '../hooks/useTransactions'

function fmt(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="stat-label">{label}</p>
          <p className={`stat-value ${color}`}>{value}</p>
        </div>
        <Icon size={22} style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: allTx = [], isLoading } = useTransactions()

  const stats = useMemo(() => {
    const proIncome = allTx.filter(t => t.type === 'pro' && t.direction === 'income').reduce((s, t) => s + t.amount, 0)
    const proExpense = allTx.filter(t => t.type === 'pro' && t.direction === 'expense').reduce((s, t) => s + t.amount, 0)
    const persoIncome = allTx.filter(t => t.type === 'perso' && t.direction === 'income').reduce((s, t) => s + t.amount, 0)
    const persoExpense = allTx.filter(t => t.type === 'perso' && t.direction === 'expense').reduce((s, t) => s + t.amount, 0)
    return { proIncome, proExpense, persoIncome, persoExpense }
  }, [allTx])

  const chartData = useMemo(() => {
    const byMonth = {}
    allTx.forEach(tx => {
      const month = tx.date?.slice(0, 7) ?? 'N/A'
      if (!byMonth[month]) byMonth[month] = { month, proIncome: 0, proExpense: 0, persoExpense: 0 }
      if (tx.type === 'pro' && tx.direction === 'income') byMonth[month].proIncome += tx.amount
      if (tx.type === 'pro' && tx.direction === 'expense') byMonth[month].proExpense += tx.amount
      if (tx.type === 'perso' && tx.direction === 'expense') byMonth[month].persoExpense += tx.amount
    })
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)
  }, [allTx])

  if (isLoading) return <div className="page"><p>Chargement...</p></div>

  return (
    <div className="page">
      <h1 className="page-title">Vue globale</h1>

      <div className="grid-stats">
        <StatCard label="CA Pro (total)" value={fmt(stats.proIncome)} icon={TrendingUp} color="positive" />
        <StatCard label="Charges Pro" value={fmt(stats.proExpense)} icon={TrendingDown} color="negative" />
        <StatCard label="Résultat Pro" value={fmt(stats.proIncome - stats.proExpense)} icon={Wallet} color={stats.proIncome - stats.proExpense >= 0 ? 'positive' : 'negative'} />
        <StatCard label="Dépenses Perso" value={fmt(stats.persoExpense)} icon={TrendingDown} color="negative" />
      </div>

      <div className="card">
        <p className="stat-label" style={{ marginBottom: '1rem' }}>Évolution 6 derniers mois</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barSize={14}>
            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
              formatter={(v) => fmt(v)}
            />
            <Legend />
            <Bar dataKey="proIncome" name="CA Pro" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="proExpense" name="Charges Pro" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="persoExpense" name="Dépenses Perso" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
