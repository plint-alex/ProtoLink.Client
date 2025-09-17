import React from 'react'

type ErrorBoundaryState = {
    hasError: boolean
    message?: string
    stack?: string
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
    constructor(props: React.PropsWithChildren) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
        const err = error as Error
        return { hasError: true, message: err?.message, stack: (err as Error)?.stack }
    }

    componentDidCatch(error: unknown, errorInfo: unknown) {
        const w = window as unknown as { __debugMessages?: string[] }
        w.__debugMessages = w.__debugMessages || []
        w.__debugMessages.push(`[ErrorBoundary] ${String((error as Error)?.message)} | ${JSON.stringify(errorInfo)}`)
        // eslint-disable-next-line no-console
        console.error('[ErrorBoundary]', error, errorInfo)
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 16 }}>
                    <h2>Client Error</h2>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.message}</pre>
                    {this.state.stack && (
                        <details style={{ whiteSpace: 'pre-wrap' }}>
                            <summary>Stack</summary>
                            {this.state.stack}
                        </details>
                    )}
                </div>
            )
        }
        return this.props.children
    }
}

export default ErrorBoundary


