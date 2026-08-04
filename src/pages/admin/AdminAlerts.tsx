import { useEffect, useRef, useState } from 'react'
import { Bell, Plus, Trash2, Edit3, EyeOff, Eye, Building2 } from 'lucide-react'
import { adminApi, linkAlertStock } from '../../lib/adminApi'
import type { DbAlert } from '../../lib/supabase'
import { formatRelativeTime, formatPrice } from '../../lib/theme'
import { CompanySearchInput } from '../../components/admin/CompanySearchInput'
import { ScreenHeader, EmptyState, ModalSheet, FieldLabel, TextInput, TextArea, Toggle, PillGroup } from '../../components/admin/AdminUI'

interface FormState {
  id?: string
  stock_name: string
  ticker: string
  sector: string
  current_price: number | null
  type: 'achat' | 'vente'
  price_min: string
  price_max: string
  horizon: 'court' | 'long'
  gain_potential: string
  objectif_1: string
  objectif_2: string
  stop_loss: string
  content: string
  is_active: boolean
}
const EMPTY: FormState = {
  stock_name: '',
  ticker: '',
  sector: '',
  current_price: null,
  type: 'achat',
  price_min: '',
  price_max: '',
  horizon: 'court',
  gain_potential: '',
  objectif_1: '',
  objectif_2: '',
  stop_loss: '',
  content: '',
  is_active: true,
}

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
      ticker: a.ticker ?? '',
      sector: a.sector ?? '',
      current_price: null,
      type: a.type,
      price_min: a.price_target != null ? String(a.price_target) : '',
      price_max: priceMax,
      horizon: a.horizon ?? 'court',
      gain_potential: gain,
      objectif_1: a.objectif_1 != null ? String(a.objectif_1) : '',
      objectif_2: a.objectif_2 != null ? String(a.objectif_2) : '',
      stop_loss: a.stop_loss != null ? String(a.stop_loss) : '',
      content: message,
      is_active: a.is_active,
    })
  }

  async function save() {
    if (!form || !form.stock_name.trim()) return
    setSaving(true)
    const body = {
      stock_name: form.stock_name.trim(),
      ticker: form.ticker || null,
      sector: form.sector || null,
      type: form.type,
      price_min: form.price_min ? Number(form.price_min) : null,
      price_max: form.price_max ? Number(form.price_max) : null,
      horizon: form.horizon,
      gain_potential: form.gain_potential || null,
      objectif_1: form.objectif_1 ? Number(form.objectif_1) : null,
      objectif_2: form.objectif_2 ? Number(form.objectif_2) : null,
      stop_loss: form.stop_loss ? Number(form.stop_loss) : null,
      content: form.content || null,
      is_active: form.is_active,
    }
    try {
      let alertId = form.id
      const isCreate = !alertId
      if (alertId) {
        await adminApi.patch(`/alerts/${alertId}`, body)
      } else {
        const created = await adminApi.post<{ id: string }>('/alerts', body)
        alertId = created?.id
      }
      const fresh = await adminApi.get<DbAlert[]>('/alerts')
      setAlerts(fresh)
      // Si le backend externe n'a pas renvoyé l'id de la nouvelle alerte, on
      // le retrouve dans la liste fraîchement rechargée (la plus récente
      // avec le même nom d'action).
      if (!alertId && isCreate) {
        alertId = fresh
          .filter((a) => a.stock_name === body.stock_name)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.id
      }
      // Le backend externe ignore ticker/sector/objectif_1/objectif_2/stop_loss —
      // on les persiste nous-mêmes directement dans Supabase.
      if (alertId) {
        await linkAlertStock(alertId, {
          ticker: form.ticker || null,
          sector: form.sector || null,
          objectif_1: form.objectif_1 ? Number(form.objectif_1) : null,
          objectif_2: form.objectif_2 ? Number(form.objectif_2) : null,
          stop_loss: form.stop_loss ? Number(form.stop_loss) : null,
        })
      }
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
            <CompanySearchInput
              value={form.stock_name}
              onChange={(v) => setForm({ ...form, stock_name: v, ticker: '', sector: '', current_price: null })}
              onSelect={(c) =>
                setForm({
                  ...form,
                  stock_name: c.short_name || c.full_name,
                  ticker: c.ticker,
                  sector: c.sector ?? '',
                  current_price: c.cours,
                })
              }
            />
            {form.ticker && (
              <div
                className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}
              >
                <div
                  className="flex items-center justify-center rounded-lg shrink-0"
                  style={{ width: 30, height: 30, backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
                >
                  <Building2 size={14} color="#F5C842" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold">
                    {form.ticker} {form.sector && `· ${form.sector}`}
                  </p>
                </div>
                {form.current_price != null && (
                  <span className="text-primary text-xs font-bold shrink-0">Cours actuel : {formatPrice(form.current_price)}</span>
                )}
              </div>
            )}
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
            <FieldLabel>Objectifs et stop loss</FieldLabel>
            <p className="text-textMuted text-xs mb-2 -mt-1">
              les % associés seront calculés automatiquement par rapport au cours actuel sur la page de détail
            </p>
            <div className="grid grid-cols-3 gap-2">
              <TextInput type="number" value={form.objectif_1} onChange={(v) => setForm({ ...form, objectif_1: v })} placeholder="Objectif 1" />
              <TextInput type="number" value={form.objectif_2} onChange={(v) => setForm({ ...form, objectif_2: v })} placeholder="Objectif 2" />
              <TextInput type="number" value={form.stop_loss} onChange={(v) => setForm({ ...form, stop_loss: v })} placeholder="Stop loss" />
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
