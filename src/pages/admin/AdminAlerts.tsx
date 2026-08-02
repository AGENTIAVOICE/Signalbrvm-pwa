import { useEffect, useRef, useState } from 'react'
import { Bell, Plus, Trash2, Edit3, EyeOff, Eye } from 'lucide-react'
import { adminApi } from '../../lib/adminApi'
import type { DbAlert } from '../../lib/supabase'
import { formatRelativeTime } from '../../lib/theme'
import { ScreenHeader, EmptyState, ModalSheet, FieldLabel, TextInput, TextArea, Toggle, PillGroup } from '../../components/admin/AdminUI'

interface FormState {
  id?: string
  stock_name: string
  type: 'achat' | 'vente'
  price_min: string
  price_max: string
  horizon: 'court' | 'long'
  gain_potential: string
  content: string
  is_active: boolean
}
const EMPTY: FormState = { stock_name: '', type: 'achat', price_min: '', price_max: '', horizon: 'court', gain_potential: '', content: '', is_active: true }

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<DbAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const loadedOnce = useRef(false)

  async function load(silent = false) {
    if (!loadedOnce.current && !silent) setLoading(true)
    try {
      setAlerts(await adminApi.get<DbAlert[]>('/alerts'))
      setError('')
    } catch (err) {
      if (!loadedOnce.current) setError(err instanceof Error ? err.message : 'Erreur de chargement')
    }
    loadedOnce.current = true
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function openEdit(a: DbAlert) {
    let message = ''
    let priceMax = ''
    let gain = ''
    if (a.content) {
      try {
        const p = JSON.parse(a.content)
        message = p.message ?? ''
        priceMax = p.price_max != null ? String(p.price_max) : ''
        gain = p.gain_potential ?? ''
      } catch {
        message = a.content
      }
    }
    setForm({
      id: a.id,
      stock_name: a.stock_name,
      type: a.type,
      price_min: a.price_target != null ? String(a.price_target) : '',
      price_max: priceMax,
      horizon: a.horizon ?? 'court',
      gain_potential: gain,
      content: message,
      is_active: a.is_active,
    })
  }

  async function save() {
    if (!form || !form.stock_name.trim()) return
    setSaving(true)
    const body = {
      stock_name: form.stock_name.trim(),
      type: form.type,
      price_min: form.price_min ? Number(form.price_min) : null,
      price_max: form.price_max ? Number(form.price_max) : null,
      horizon: form.horizon,
      gain_potential: form.gain_potential || null,
      content: form.content || null,
      is_active: form.is_active,
    }
    try {
      if (form.id) await adminApi.patch(`/alerts/${form.id}`, body)
      else await adminApi.post('/alerts', body)
      setForm(null)
      load(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  async function toggleActive(a: DbAlert) {
    setAlerts((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_active: !x.is_active } : x)))
    try {
      await adminApi.patch(`/alerts/${a.id}`, { is_active: !a.is_active })
      load(true)
    } catch (err) {
      load(true)
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette alerte ?')) return
    const previous = alerts
    setAlerts((prev) => prev.filter((x) => x.id !== id))
    try {
      await adminApi.delete(`/alerts/${id}`)
      load(true)
    } catch (err) {
      setAlerts(previous)
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  return (
    <div>
      <ScreenHeader
        icon={<Bell size={20} color="#F5C842" />}
        title="Alertes Opportunité"
        action={
          <button
            onClick={() => setForm({ ...EMPTY })}
            className="flex items-center justify-center rounded-full"
            style={{ width: 38, height: 38, backgroundColor: '#F5C842' }}
          >
            <Plus size={18} color="#0A0A0F" />
          </button>
        }
      />

      {loading && <p className="text-textSub text-sm">Chargement…</p>}
      {error && !loading && <p className="text-sell text-sm">{error}</p>}
      {!loading && !error && alerts.length === 0 && <EmptyState icon={<Bell size={30} color="#4A4A5A" />} title="Aucune alerte" />}

      {!loading &&
        !error &&
        alerts.map((a) => (
          <div key={a.id} className="rounded-2xl p-3.5 mb-2.5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A', opacity: a.is_active ? 1 : 0.55 }}>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-2">
                <span
                  className="rounded-md px-2 py-0.5 text-[9px] font-extrabold"
                  style={{ backgroundColor: a.type === 'achat' ? '#052E16' : '#200A0A', color: a.type === 'achat' ? '#22C55E' : '#EF4444' }}
                >
                  {a.type === 'achat' ? 'ACHAT' : 'VENTE'}
                </span>
                <span className="text-white font-bold text-sm">{a.stock_name}</span>
              </span>
              <span className="text-textMuted text-xs">{formatRelativeTime(new Date(a.created_at))}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <ActionBtn icon={Edit3} label="Modifier" color="#F5C842" onClick={() => openEdit(a)} />
              <ActionBtn icon={a.is_active ? EyeOff : Eye} label={a.is_active ? 'Désactiver' : 'Activer'} color="#8A8A9A" onClick={() => toggleActive(a)} />
              <ActionBtn icon={Trash2} label="Supprimer" color="#EF4444" onClick={() => remove(a.id)} />
            </div>
          </div>
        ))}

      {form && (
        <ModalSheet title={form.id ? 'Modifier alerte' : 'Nouvelle alerte'} onClose={() => setForm(null)}>
          <div>
            <FieldLabel required>Action</FieldLabel>
            <TextInput value={form.stock_name} onChange={(v) => setForm({ ...form, stock_name: v })} placeholder="ex: BOA CI" />
          </div>

          <div>
            <FieldLabel>Type</FieldLabel>
            <PillGroup
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
              options={[
                { value: 'achat', label: 'ACHAT' },
                { value: 'vente', label: 'VENTE' },
              ]}
              colors={{ achat: '#22C55E', vente: '#EF4444' }}
            />
          </div>

          <div>
            <FieldLabel>Cours limit</FieldLabel>
            <p className="text-textMuted text-xs mb-2 -mt-1">le prix-cible</p>
            <div className="flex items-center gap-3">
              <TextInput type="number" value={form.price_min} onChange={(v) => setForm({ ...form, price_min: v })} placeholder="Min (ex: 1500)" />
              <span className="text-textMuted text-sm">à</span>
              <TextInput type="number" value={form.price_max} onChange={(v) => setForm({ ...form, price_max: v })} placeholder="Max (ex: 2000)" />
            </div>
          </div>

          <div>
            <FieldLabel>Horizon</FieldLabel>
            <PillGroup
              value={form.horizon}
              onChange={(v) => setForm({ ...form, horizon: v })}
              options={[
                { value: 'court', label: 'COURT TERME' },
                { value: 'long', label: 'LONG TERME' },
              ]}
              colors={{ court: '#F97316', long: '#8A8A9A' }}
            />
          </div>

          <div>
            <FieldLabel>Potentiel de gain recherché</FieldLabel>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <TextInput type="number" value={form.gain_potential} onChange={(v) => setForm({ ...form, gain_potential: v })} placeholder="ex: 15" />
              </div>
              <div className="flex items-center justify-center rounded-xl px-4 py-3.5 text-primary font-bold" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
                %
              </div>
            </div>
          </div>

          <div>
            <FieldLabel>Contenu</FieldLabel>
            <TextArea value={form.content} onChange={(v) => setForm({ ...form, content: v })} placeholder="Message de l'alerte..." />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Active</span>
            <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          </div>

          <button
            onClick={save}
            disabled={saving || !form.stock_name.trim()}
            className="w-full py-3.5 rounded-xl font-extrabold text-sm disabled:opacity-40"
            style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </ModalSheet>
      )}
    </div>
  )
}

function ActionBtn({ icon: Icon, label, color, onClick }: { icon: typeof Edit3; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: '#1A1A24', color }}>
      <Icon size={12} /> {label}
    </button>
  )
}
