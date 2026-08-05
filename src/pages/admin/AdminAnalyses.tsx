import { useEffect, useRef, useState } from 'react'
import { FileText, Plus, Image as ImageIcon, Trash2, Edit3, EyeOff, Eye, Building2 } from 'lucide-react'
import { adminApi, uploadImageReal, linkAnalysisStock } from '../../lib/adminApi'
import { supabase, type DbAnalysis } from '../../lib/supabase'
import { formatGMTDate, formatPrice } from '../../lib/theme'
import { CompanySearchInput } from '../../components/admin/CompanySearchInput'
import { ScreenHeader, EmptyState, ModalSheet, FieldLabel, TextInput, TextArea, Toggle, UploadBox } from '../../components/admin/AdminUI'

interface FormState {
  id?: string
  title: string
  content: string
  image_url: string | null
  is_published: boolean
  ticker: string
  sector: string
  current_price: number | null
}
const EMPTY: FormState = { title: '', content: '', image_url: null, is_published: false, ticker: '', sector: '', current_price: null }

export default function AdminAnalyses() {
  const [items, setItems] = useState<DbAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [companyQuery, setCompanyQuery] = useState('')
  const loadedOnce = useRef(false)

  async function load(silent = false) {
    if (!loadedOnce.current && !silent) setLoading(true)
    try {
      setItems(await adminApi.get<DbAnalysis[]>('/analyses'))
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

  async function openEdit(a: DbAnalysis) {
    let currentPrice: number | null = null
    if (a.ticker) {
      const { data } = await supabase.from('brvm_cours').select('cours').eq('ticker', a.ticker).maybeSingle()
      currentPrice = data?.cours ?? null
    }
    setForm({
      id: a.id,
      title: a.title,
      content: a.content ?? '',
      image_url: a.image_url,
      is_published: a.is_published,
      ticker: a.ticker ?? '',
      sector: a.sector ?? '',
      current_price: currentPrice,
    })
  }

  async function handleImage(file: File) {
    if (!form) return
    setUploading(true)
    try {
      const { url } = await uploadImageReal(file, 'analyses')
      setForm({ ...form, image_url: url })
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de l'upload")
    }
    setUploading(false)
  }

  async function save() {
    if (!form || !form.title.trim()) return
    setSaving(true)
    const body = {
      title: form.title.trim(),
      content: form.content || undefined,
      image_url: form.image_url,
      is_published: form.is_published,
      stock_name: form.ticker ? form.title.trim() : undefined,
    }
    try {
      let analysisId = form.id
      if (analysisId) {
        await adminApi.patch(`/analyses/${analysisId}`, body)
      } else {
        const created = await adminApi.post<{ id: string }>('/analyses', body)
        analysisId = created?.id
      }
      const fresh = await adminApi.get<DbAnalysis[]>('/analyses')
      setItems(fresh)
      if (!analysisId) {
        analysisId = fresh
          .filter((a) => a.title === body.title)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.id
      }
      if (analysisId) await linkAnalysisStock(analysisId, { ticker: form.ticker || null, sector: form.sector || null })
      setForm(null)
      load(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  async function togglePublished(a: DbAnalysis) {
    setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_published: !x.is_published } : x)))
    try {
      await adminApi.patch(`/analyses/${a.id}`, { is_published: !a.is_published })
      load(true)
    } catch (err) {
      load(true)
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette analyse ?')) return
    const previous = items
    setItems((prev) => prev.filter((x) => x.id !== id))
    try {
      await adminApi.delete(`/analyses/${id}`)
      load(true)
    } catch (err) {
      setItems(previous)
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  return (
    <div>
      <ScreenHeader
        icon={<FileText size={20} color="#F5C842" />}
        title="Analyses"
        action={
          <button
            onClick={() => {
              setCompanyQuery('')
              setForm({ ...EMPTY })
            }}
            className="flex items-center justify-center rounded-full"
            style={{ width: 38, height: 38, backgroundColor: '#F5C842' }}
          >
            <Plus size={18} color="#0A0A0F" />
          </button>
        }
      />

      {loading && <p className="text-textSub text-sm">Chargement…</p>}
      {error && !loading && <p className="text-sell text-sm">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <EmptyState icon={<FileText size={30} color="#4A4A5A" />} title="Aucune analyse" />
      )}

      {!loading &&
        !error &&
        items.map((a) => (
          <div key={a.id} className="rounded-2xl p-3.5 mb-2.5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A', opacity: a.is_published ? 1 : 0.55 }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-white font-bold text-sm">{a.title}</p>
              <span className="text-textMuted text-xs">{formatGMTDate(new Date(a.created_at))}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <ActionBtn icon={Edit3} label="Modifier" color="#F5C842" onClick={() => openEdit(a)} />
              <ActionBtn icon={a.is_published ? EyeOff : Eye} label={a.is_published ? 'Dépublier' : 'Publier'} color="#8A8A9A" onClick={() => togglePublished(a)} />
              <ActionBtn icon={Trash2} label="Supprimer" color="#EF4444" onClick={() => remove(a.id)} />
            </div>
          </div>
        ))}

      {form && (
        <ModalSheet title="Note d'Analyse BRVM" onClose={() => setForm(null)}>
          <UploadBox
            icon={<ImageIcon size={22} color="#F5C842" />}
            label={uploading ? 'Envoi en cours…' : 'Ajouter une image'}
            sublabel="Depuis la galerie"
            accept="image/*"
            onFile={handleImage}
            previewUrl={form.image_url}
          />

          <div>
            <FieldLabel required>Titre</FieldLabel>
            <TextInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Titre de l'analyse" />
          </div>

          <div>
            <FieldLabel>Entreprise</FieldLabel>
            <CompanySearchInput
              value={companyQuery}
              onChange={setCompanyQuery}
              onSelect={(c) => {
                setCompanyQuery(c.short_name || c.full_name)
                setForm({
                  ...form,
                  ticker: c.ticker,
                  sector: c.sector ?? '',
                  current_price: c.cours,
                })
              }}
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
            <FieldLabel>Contenu</FieldLabel>
            <TextArea value={form.content} onChange={(v) => setForm({ ...form, content: v })} placeholder="Contenu de l'analyse..." />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Publié</span>
            <Toggle checked={form.is_published} onChange={(v) => setForm({ ...form, is_published: v })} />
          </div>

          <button
            onClick={save}
            disabled={saving || !form.title.trim()}
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
