import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Play, Clock, X } from 'lucide-react'
import { FORMATION_LEVELS } from '../lib/formationLevels'
import { getAllVideos, type DbVideo } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { ProLock } from '../components/ProLock'

export default function Formations() {
  const navigate = useNavigate()
  const { isPro } = useAuth()
  const [videos, setVideos] = useState<DbVideo[]>([])
  const [activeVideo, setActiveVideo] = useState<DbVideo | null>(null)
  const channelId = useRef(`videos_rt_${Math.random().toString(36).slice(2)}`)

  async function load() {
    if (!isPro) return
    try {
      setVideos(await getAllVideos())
    } catch {
      setVideos([])
    }
  }

  useEffect(() => {
    load()
    if (!isPro) return
    // Temps réel : une vidéo ajoutée/publiée par l'admin apparaît instantanément.
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro])

  if (!isPro) return <ProLock />

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

        <p className="text-textMuted text-xs text-center mt-2">
          Votre plan Pro inclut l'accès à toutes les formations.
        </p>
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
