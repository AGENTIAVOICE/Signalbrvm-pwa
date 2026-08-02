import { Component, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center px-8 text-center"
          style={{ backgroundColor: '#0A0A0F' }}
        >
          <p className="text-white font-bold text-base mb-2">Une erreur est survenue</p>
          <p className="text-textSub text-sm mb-6 max-w-xs">
            {this.state.error.message || "Quelque chose s'est mal passé lors de l'affichage de cet écran."}
          </p>
          <button
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
            className="flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-sm"
            style={{ backgroundColor: '#F5C842', color: '#0A0A0F' }}
          >
            <RefreshCw size={16} /> Recharger
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
