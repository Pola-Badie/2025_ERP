// Base service configuration
const BASE_URL = '/api/reports';
// Error handling helper for fetch API
const handleApiError = async (response) => {
    let message = 'API request failed';
    let code;
    try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            message = errorData.message || errorData.error || message;
            code = errorData.code;
        }
        else {
            const textData = await response.text();
            message = textData || `HTTP ${response.status} ${response.statusText}`;
        }
    }
    catch {
        message = `HTTP ${response.status} ${response.statusText}`;
    }
    return {
        message,
        status: response.status,
        code
    };
};
// Network error handling helper
const handleNetworkError = (error) => {
    return {
        message: error.message || 'Network error occurred',
        status: 0
    };
};
// Build query parameters helper
const buildQueryParams = (filters) => {
    const params = new URLSearchParams();
    if (filters.startDate)
        params.append('startDate', filters.startDate);
    if (filters.endDate)
        params.append('endDate', filters.endDate);
    if (filters.accountFilter && filters.accountFilter !== 'all') {
        params.append('accountFilter', filters.accountFilter);
    }
    if (filters.includeZeroBalance !== undefined) {
        params.append('includeZeroBalance', filters.includeZeroBalance.toString());
    }
    if (filters.showTransactionDetails !== undefined) {
        params.append('showTransactionDetails', filters.showTransactionDetails.toString());
    }
    if (filters.groupByAccountType !== undefined) {
        params.append('groupByAccountType', filters.groupByAccountType.toString());
    }
    return params;
};
export const financialReportsService = {
    /**
     * Get Trial Balance Report
     */
    async getTrialBalance(filters) {
        try {
            const params = buildQueryParams(filters);
            const response = await fetch(`${BASE_URL}/trial-balance?${params}`);
            if (!response.ok) {
                throw await handleApiError(response);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof TypeError || error.name === 'NetworkError') {
                throw handleNetworkError(error);
            }
            throw error;
        }
    },
    /**
     * Get Profit & Loss Statement
     */
    async getProfitLoss(filters) {
        try {
            const params = buildQueryParams(filters);
            const response = await fetch(`${BASE_URL}/profit-loss?${params}`);
            if (!response.ok) {
                throw await handleApiError(response);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof TypeError || error.name === 'NetworkError') {
                throw handleNetworkError(error);
            }
            throw error;
        }
    },
    /**
     * Get Balance Sheet
     */
    async getBalanceSheet(asOfDate) {
        try {
            const params = new URLSearchParams({ asOfDate });
            const response = await fetch(`${BASE_URL}/balance-sheet?${params}`);
            if (!response.ok) {
                throw await handleApiError(response);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof TypeError || error.name === 'NetworkError') {
                throw handleNetworkError(error);
            }
            throw error;
        }
    },
    /**
     * Get Cash Flow Statement
     */
    async getCashFlow(filters) {
        try {
            const params = buildQueryParams(filters);
            const response = await fetch(`${BASE_URL}/cash-flow?${params}`);
            if (!response.ok) {
                throw await handleApiError(response);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof TypeError || error.name === 'NetworkError') {
                throw handleNetworkError(error);
            }
            throw error;
        }
    },
    /**
     * Get Chart of Accounts
     */
    async getChartOfAccounts() {
        try {
            const response = await fetch(`${BASE_URL}/chart-of-accounts`);
            if (!response.ok) {
                throw await handleApiError(response);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof TypeError || error.name === 'NetworkError') {
                throw handleNetworkError(error);
            }
            throw error;
        }
    },
    /**
     * Get Journal Entries
     */
    async getJournalEntries(filters) {
        try {
            const params = buildQueryParams(filters);
            const response = await fetch(`${BASE_URL}/journal-entries?${params}`);
            if (!response.ok) {
                throw await handleApiError(response);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof TypeError || error.name === 'NetworkError') {
                throw handleNetworkError(error);
            }
            throw error;
        }
    },
    /**
     * Get General Ledger
     */
    async getGeneralLedger(accountId, filters) {
        try {
            const params = buildQueryParams(filters || {});
            if (accountId) {
                params.append('accountId', accountId);
            }
            const response = await fetch(`${BASE_URL}/general-ledger?${params}`);
            if (!response.ok) {
                throw await handleApiError(response);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof TypeError || error.name === 'NetworkError') {
                throw handleNetworkError(error);
            }
            throw error;
        }
    },
    /**
     * Get Account Summary
     */
    async getAccountSummary() {
        try {
            const response = await fetch(`${BASE_URL}/account-summary`);
            if (!response.ok) {
                throw await handleApiError(response);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof TypeError || error.name === 'NetworkError') {
                throw handleNetworkError(error);
            }
            throw error;
        }
    },
    /**
     * Get Aging Analysis
     */
    async getAgingAnalysis(type = 'receivables') {
        try {
            const params = new URLSearchParams({ type });
            const response = await fetch(`${BASE_URL}/aging-analysis?${params}`);
            if (!response.ok) {
                throw await handleApiError(response);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof TypeError || error.name === 'NetworkError') {
                throw handleNetworkError(error);
            }
            throw error;
        }
    },
    /**
     * Export Report to PDF
     */
    async exportToPDF(options) {
        try {
            const params = new URLSearchParams();
            if (options.startDate)
                params.append('startDate', options.startDate);
            if (options.endDate)
                params.append('endDate', options.endDate);
            if (options.asOfDate)
                params.append('asOfDate', options.asOfDate);
            if (options.accountFilter && options.accountFilter !== 'all') {
                params.append('accountFilter', options.accountFilter);
            }
            const response = await fetch(`${BASE_URL}/${options.reportType}/export/pdf?${params}`);
            if (!response.ok) {
                throw await handleApiError(response);
            }
            // Download the PDF file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${options.reportType}-${new Date().getTime()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
        catch (error) {
            if (error instanceof TypeError || error.name === 'NetworkError') {
                throw handleNetworkError(error);
            }
            throw error;
        }
    },
    /**
     * Export Report to Excel
     */
    async exportToExcel(options) {
        try {
            const params = new URLSearchParams();
            if (options.startDate)
                params.append('startDate', options.startDate);
            if (options.endDate)
                params.append('endDate', options.endDate);
            if (options.asOfDate)
                params.append('asOfDate', options.asOfDate);
            if (options.accountFilter && options.accountFilter !== 'all') {
                params.append('accountFilter', options.accountFilter);
            }
            const response = await fetch(`${BASE_URL}/${options.reportType}/export/excel?${params}`);
            if (!response.ok) {
                throw await handleApiError(response);
            }
            // Download the Excel file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${options.reportType}-${new Date().getTime()}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
        catch (error) {
            if (error instanceof TypeError || error.name === 'NetworkError') {
                throw handleNetworkError(error);
            }
            throw error;
        }
    },
    /**
     * Get all available reports metadata
     */
    async getReportsMetadata() {
        try {
            const response = await fetch(`${BASE_URL}/metadata`);
            if (!response.ok) {
                throw await handleApiError(response);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof TypeError || error.name === 'NetworkError') {
                throw handleNetworkError(error);
            }
            throw error;
        }
    }
};
