import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { QUESTIONS, PART_TITLES, calculateScore, getProfile, type Answers } from '../lib/profilInvestisseurData'
import { saveProfilInvestisseurResult } from '../lib/profilStorage'

const ACCENT = '#e8a33d'

export default function ProfilInvestisseur() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Answers>({})

  function selectAnswer(qIndex: number, optIndex: number) {
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }))
  }

  const answeredCount = QUESTIONS.filter((_, i) => answers[i] !== undefined).length
  const allAnswered = QUESTIONS.every((_, i) => answers[i] !== undefined)

  async function handleSubmit() {
    if (!allAnswered) return
    const score = calculateScore(answers)
    const profile = getProfile(score)
    await saveProfilInvestisseurResult({ score, profileKey: profile.key })
    navigate('/profil')
  }

  let lastPart = 0

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-white font-extrabold text-xl tracking-tight">Quiz Profil Investisseur BRVM</h1>
        <p className="text-textSub text-sm mt-1.5 leading-relaxed">
          12 questions pour déterminer votre profil de risque et vos placements adaptés à la BRVM.
        </p>
      </div>

      <div className="px-4 flex flex-col gap-3">
        {QUESTIONS.map((q, i) => {
          const showPartHeader = q.part !== lastPart
          lastPart = q.part
          return (
            <div key={i}>
              {showPartHeader && (
                <p className="font-extrabold text-[11px] tracking-wide mb-2.5" style={{ color: ACCENT, marginTop: i === 0 ? 4 : 20 }}>
                  {PART_TITLES[q.part]}
                </p>
              )}
              <div className="rounded-xl p-4" style={{ backgroundColor: '#13131A', border: '1px solid #23232E' }}>
                <p className="text-white font-semibold text-sm mb-3">{q.question}</p>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oi) => {
                    const selected = answers[i] === oi
                    return (
                      <button
                        key={opt.label}
                        onClick={() => selectAnswer(i, oi)}
                        className="w-full text-left rounded-lg px-3 py-2.5 flex items-center justify-between gap-2"
                        style={{
                          backgroundColor: selected ? `${ACCENT}1A` : '#1A1A24',
                          border: selected ? `1px solid ${ACCENT}` : '1px solid transparent',
                        }}
                      >
                        <span className="text-sm" style={{ color: selected ? ACCENT : '#C8C8D4' }}>
                          {opt.label}
                        </span>
                        {selected && <Check size={16} color={ACCENT} className="flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 py-4" style={{ backgroundColor: '#0A0A0Fcc', borderTop: '1px solid #2A2A3A', backdropFilter: 'blur(8px)' }}>
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="w-full py-3.5 rounded-xl font-extrabold text-base disabled:opacity-40"
          style={{ backgroundColor: ACCENT, color: '#0A0A0F' }}
        >
          {allAnswered ? 'Voir mon profil' : `${answeredCount}/${QUESTIONS.length} questions répondues`}
        </button>
      </div>
    </div>
  )
}
