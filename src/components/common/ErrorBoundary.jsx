// ErrorBoundary — bắt lỗi runtime, hiển thị fallback thay vì white-screen crash
import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                    <div className="text-center max-w-md">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">
                            Đã xảy ra lỗi
                        </h1>
                        <p className="text-gray-500 text-sm mb-6">
                            Ứng dụng gặp sự cố không mong muốn. Hãy thử tải lại trang.
                        </p>
                        {import.meta.env.DEV && this.state.error && (
                            <pre className="text-left bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4 overflow-auto max-h-40">
                                {this.state.error.toString()}
                            </pre>
                        )}
                        <button
                            onClick={this.handleReload}
                            className="btn btn-primary"
                        >
                            Tải lại trang
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
