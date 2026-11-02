import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="m-5 rounded-lg border border-destructive/25 bg-destructive/8 p-10 text-center text-destructive">
          <AlertTriangle className="mx-auto mb-4 block size-12" />
          <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
          <p className="mb-4">
            We encountered an error while rendering this view.
          </p>
          {this.state.error && (
            <pre className="mb-4 overflow-auto rounded-sm bg-white/50 p-3 text-left text-xs">
              {this.state.error.toString()}
            </pre>
          )}
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
