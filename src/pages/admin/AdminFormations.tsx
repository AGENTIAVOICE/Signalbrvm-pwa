import { useEffect, useRef, useState } from 'react'
import { Video, Plus, Upload, Image as ImageIcon, Trash2, Edit3, EyeOff, Eye, Play } from 'lucide-react'
import { adminApi, uploadImage, uploadVideo, type AdminVideo } from '../../lib/adminApi'
import { ScreenHeader, EmptyState, ModalSheet, FieldLabel, TextInput, TextArea, Toggle, PillGroup, UploadBox } from '../../components/admin/AdminUI'

interface FormState {
  id?: string
  video_url: string
  thumbnail_url: string | null
  title: string
  description: string
  level: 1 | 2 | 3
  is_published: boolean
}
const EMPTY: FormState = { video_url: '', thumbnail_url: null, title: '', description: '', level: 1, is_published: false }

export default function AdminFormations() {
  const [videos, setVideos] = useState<AdminVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const loadedOnce = useRef(false)

  async function load(silent = false) {
    if (!loadedOnce.current && !silent) setLoading(true)
    try {
      setVideos(await adminApi.get<AdminVideo[]>('/videos'))
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

  function openEdit(v: AdminVideo) {
    setForm({
      id: v.id,
      video_url: v.video_url,
      thumbnail_url: v.thumbnail_url,
      title: v.title,
      description: v.description ?? '',
      level: (v.level as 1 | 2 | 3) ?? 1,
      is_published: v.is_published,
    })
  }

  async function handleVideoFile(file: File) {
    if (!form) return
    setUploadingVideo(true)
    try {
      const { url } = await uploadVideo(file)
      setForm({ ...form, video_url: url })
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de l'upload vidéo")
    }
    setUploadingVideo(false)
  }

  async function handleImageFile(file: File) {
    if (!form) return
    setUploadingImage(true)
    try {
      const { url } = await uploadImage(file)
      setForm({ ...form, thumbnail_url: url })
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de l'upload image")
    }
    setUploadingImage(false)
  }

  async function save() {
    if (!form || !form.title.trim() || !form.video_url) return
    setSaving(true)
    const body = {
      title: form.title.trim(),
      description: form.description || undefined,
      video_url: form.video_url,
      thumbnail_url: form.thumbnail_url ?? undefined,
      level: form.level,
      is_published: form.is_published,
    }
    try {
      if (form.id) await adminApi.patch(`/videos/${form.id}`, body)
      else await adminApi.post('/videos', body)
      setForm(null)
      load(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  async function togglePublished(v: AdminVideo) {
    setVideos((prev) => prev.map((x) => (x.id === v.id ? { ...x, is_published: !x.is_published } : x)))
    try {
      await adminApi.patch(`/videos/${v.id}`, { is_published: !v.is_published })
      load(true)
    } catch (err) {
      load(true)
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette vidéo ?')) return
    const previous = videos
    setVideos((prev) => prev.filter((x) => x.id !== id))
    try {
      await adminApi.delete(`/videos/${id}`)
      load(true)
    } catch (err) {
      setVideos(previous)
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  return (
    <div>
      <ScreenHeader
        icon={<Video size={20} color="#F5C842" />}
        title="Formations"
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

      {!loading && !error && videos.length === 0 && (
        <EmptyState
          icon={<Video size={28} color="#4A4A5A" />}
          title="Aucune vidéo de formation"
          subtitle="Appuyez sur + pour ajouter votre première vidéo."
        />
      )}

      {!loading &&
        !error &&
        videos.map((v) => (
          <div key={v.id} className="rounded-2xl p-3.5 mb-2.5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A', opacity: v.is_published ? 1 : 0.55 }}>
            <div className="flex items-center gap-3 mb-2">
              {v.thumbnail_url ? (
                <img src={v.thumbnail_url} alt="" className="rounded-lg object-cover flex-shrink-0" style={{ width: 56, height: 56 }} />
              ) : (
                <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 56, height: 56, backgroundColor: '#1A1A24' }}>
                  <Play size={18} color="#4A4A5A" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="rounded-md px-2 py-0.5 text-[9px] font-extrabold" style={{ backgroundColor: '#1A1400', color: '#F5C842' }}>
                  NIVEAU {v.level}
                </span>
                <p className="text-white font-bold text-sm truncate mt-0.5">{v.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <ActionBtn icon={Edit3} label="Modifier" color="#F5C842" onClick={() => openEdit(v)} />
              <ActionBtn icon={v.is_published ? EyeOff : Eye} label={v.is_published ? 'Dépublier' : 'Publier'} color="#8A8A9A" onClick={() => togglePublished(v)} />
              <ActionBtn icon={Trash2} label="Supprimer" color="#EF4444" onClick={() => remove(v.id)} />
            </div>
          </div>
        ))}

      {form && (
        <ModalSheet title="Ajouter une vidéo" onClose={() => setForm(null)}>
          <UploadBox
            icon={<Upload size={22} color="#F5C842" />}
            label={uploadingVideo ? 'Envoi en cours…' : form.video_url ? 'Vidéo sélectionnée ✓' : 'Choisir une vidéo'}
            sublabel="MP4, MOV, AVI — depuis la galerie"
            accept="video/*"
            onFile={handleVideoFile}
          />

          <div>
            <FieldLabel>Image de couverture</FieldLabel>
            <UploadBox
              icon={<ImageIcon size={22} color="#F5C842" />}
              label={uploadingImage ? 'Envoi en cours…' : 'Ajouter une image de couverture'}
              sublabel="Depuis la galerie"
              accept="image/*"
              onFile={handleImageFile}
              previewUrl={form.thumbnail_url}
            />
          </div>

          <div>
            <FieldLabel required>Titre</FieldLabel>
            <TextInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Titre de la formation" />
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <TextArea value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Décrivez le contenu de cette formation..." />
          </div>

          <div>
            <FieldLabel required>Niveau de la formation</FieldLabel>
            <PillGroup
              value={form.level}
              onChange={(v) => setForm({ ...form, level: v })}
              options={[
                { value: 1, label: '1\nDébutant' },
                { value: 2, label: '2\nIntermédiaire' },
                { value: 3, label: '3\nAvancé' },
              ]}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl px-4 py-3.5" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
            <div>
              <p className="text-white font-semibold text-sm">Publié</p>
              <p className="text-textMuted text-xs mt-0.5">Visible par les abonnés</p>
            </div>
            <Toggle checked={form.is_published} onChange={(v) => setForm({ ...form, is_published: v })} />
          </div>

          <button
            onClick={save}
            disabled={saving || !form.title.trim() || !form.video_url}
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
