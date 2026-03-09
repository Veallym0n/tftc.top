import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // 统一的错误上报入口
        console.error('🗺️ TFTC Map Render Error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center w-full h-full p-6 bg-[#FFFDF5] text-slate-800 border-4 border-slate-800 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] rounded-2xl">
                    <h3 className="text-2xl font-black mb-2 text-[#FF90E8]">Oops! Map Crashed</h3>
                    <p className="font-mono text-sm bg-slate-100 p-4 rounded-xl border-2 border-slate-800">
                        {this.state.error?.message}
                    </p>
                </div>
            );
        }
        return this.props.children;
    }
}
