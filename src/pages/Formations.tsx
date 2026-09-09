import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Play, Clock, X, Lock, Check } from 'lucide-react'
import { FORMATION_LEVELS } from '../lib/formationLevels'
import { getAllVideos, type DbVideo } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// Lien de paiement Chariow pour l'accès complet aux formations — à
// remplacer par le vrai lien une fois le produit créé sur Chariow.
const CHARIOW_LINK = 'https://xfhlbaph.mychariow.shop/prd_b514zwtf'
const FORMATION_BUNDLE_PRICE = 50000

export default function Formations() {
  const navigate = useNavigate()
  const { hasFormationAccess } = useAuth()
  const [videos, setVideos] = useState<DbVideo[]>([])
  const [activeVideo, setActiveVideo] = useState<DbVideo | null>(null)
  const channelId = useRef(`videos_rt_${Math.random().toString(36).slice(2)}`)
  const [searchParams, setSearchParams] = useSearchParams()

  // Ouvre directement la vidéo visée quand on arrive depuis une notification
  // (/formations?open=<id>) — plutôt que la simple liste.
  useEffect(() => {
    const openId = searchParams.get('open')
    if (!openId || videos.length === 0) return
    const target = videos.find((v) => v.id === openId)
    if (target) setActiveVideo(target)
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, videos])

  async function load() {
    if (!hasFormationAccess) return
    try {
      setVideos(await getAllVideos())
    } catch {
      setVideos([])
    }
  }

  useEffect(() => {
    load()
    if (!hasFormationAccess) return
    // Temps réel : une vidéo ajoutée/publiée par l'admin apparaît instantanément.
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFormationAccess])

  if (!hasFormationAccess) {
    const totalHours = FORMATION_LEVELS.length * 4
    const listPrice = FORMATION_LEVELS.reduce((s, l) => s + l.price, 0)
    return (
      <div className="min-h-screen pb-10" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #2A2A3A' }}>
          <button onClick={() => navigate(-1)} className="text-textSub">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-white font-bold text-lg">Formations</h1>
        </div>

        <div className="px-5 py-6 flex flex-col gap-5">
          <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: '#1F1A0A', border: '1px solid #F5C842' }}>
            <div className="flex items-center justify-center rounded-full mx-auto mb-3" style={{ width: 48, height: 48, backgroundColor: '#0A0A0F' }}>
              <Lock size={22} color="#F5C842" />
            </div>
            <p className="text-white font-extrabold text-base mb-1">Formations vendues séparément</p>
            <p className="text-textSub text-xs leading-relaxed mb-4">
              Que vous soyez au plan Gratuit ou Pro, l'accès aux formations n'est pas inclus dans l'abonnement — c'est un
              produit à part, payé une seule fois.
            </p>
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <span className="text-white font-extrabold text-3xl">{FORMATION_BUNDLE_PRICE.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <p className="text-textMuted text-[11px] mb-4">
              au lieu de {listPrice.toLocaleString('fr-FR')} FCFA à l'unité · accès à vie
            </p>
            <a
              href={CHARIOW_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3.5 rounded-xl font-extrabold text-sm"
              style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
            >
              Payer et débloquer les formations
            </a>
          </div>

          <p className="text-textMuted text-[11px] font-bold uppercase tracking-wide px-1">
            Ce que contient le pack ({totalHours}h au total)
          </p>

          {FORMATION_LEVELS.map((lvl) => (
            <div key={lvl.level} className="rounded-2xl p-4" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
              <span className="text-[10px] font-extrabold tracking-widest" style={{ color: lvl.color }}>
                {lvl.tag}
              </span>
              <h3 className="text-white font-bold text-base mt-1 mb-1">{lvl.title}</h3>
              <p className="text-textMuted text-xs flex items-center gap-1 mb-3">
                <Clock size={12} /> {lvl.meta}
              </p>
              <ul className="flex flex-col gap-1.5">
                {lvl.bullets.map((b) => (
                  <li key={b} className="text-textSub text-xs flex items-start gap-2">
                    <Check size={13} color={lvl.color} className="mt-0.5 shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #2A2A3A' }}>
        <button onClick={() => navigate(-1)} className="text-textSub">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-white font-bold text-lg">Formations</h1>
      </div>

      <div className="px-5 py-6 flex flex-col gap-4">
        {FORMATION_LEVELS.map((lvl) => {
          const levelVideos = videos.filter((v) => v.level === lvl.level)
          return (
            <div
              key={lvl.level}
              className="rounded-2xl p-4"
              style={{ backgroundColor: '#111118', border: lvl.highlighted ? `1.5px solid ${lvl.color}` : '1px solid #2A2A3A' }}
            >
              <span className="text-[10px] font-extrabold tracking-widest" style={{ color: lvl.color }}>
                {lvl.tag}
              </span>
              <h3 className="text-white font-bold text-base mt-1 mb-1">{lvl.title}</h3>
              <p className="text-textMuted text-xs flex items-center gap-1 mb-3">
                <Clock size={12} /> {lvl.meta}
              </p>
              <ul className="flex flex-col gap-1.5 mb-4">
                {lvl.bullets.map((b) => (
                  <li key={b} className="text-textSub text-xs flex items-start gap-2">
                    <span style={{ color: lvl.color }} className="mt-0.5">•</span> {b}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-2">
                {levelVideos.length === 0 ? (
                  <p className="text-textMuted text-xs">Aucune vidéo disponible pour le moment.</p>
                ) : (
                  levelVideos.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setActiveVideo(v)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-left tappable"
                      style={{ backgroundColor: '#1A1A24' }}
                    >
                      <Play size={14} color="#F5C842" />
                      <span className="text-white text-xs font-semibold truncate flex-1">{v.title}</span>
                      <ChevronRight size={13} color="#4A4A5A" className="shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )
        })}

        <p className="text-textMuted text-xs text-center mt-2">Accès aux formations débloqué — merci pour votre achat !</p>
      </div>

      {activeVideo && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#000' }}>
          <video src={activeVideo.video_url} controls autoPlay className="w-full" style={{ maxHeight: '40vh' }} />
          <div className="flex-1 overflow-y-auto p-5" style={{ backgroundColor: '#0A0A0F' }}>
            <h3 className="text-white font-bold text-base mb-2">{activeVideo.title}</h3>
            {activeVideo.description && <p className="text-textSub text-sm leading-6">{activeVideo.description}</p>}
          </div>
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-4 right-4 rounded-full p-2"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <X size={18} color="#fff" />
          </button>
        </div>
      )}
    </div>
  )
}
