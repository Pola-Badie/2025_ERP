import React, { Component } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.handleReset = () => {
            this.setState({ hasError: false, error: null, errorInfo: null });
            window.location.reload();
        };
        this.state = { hasError: false, error: null, errorInfo: null, errorCount: 0 };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error, errorInfo: null, errorCount: 0 };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }
    render() {
        if (this.state.hasError) {
            return (<div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-500 mr-3"/>
              <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (<details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>)}

            <Button onClick={this.handleReset} className="w-full flex items-center justify-center">
              <RefreshCw className="h-4 w-4 mr-2"/>
              Refresh Page
            </Button>
          </div>
        </div>);
        }
        return this.props.children;
    }
}
