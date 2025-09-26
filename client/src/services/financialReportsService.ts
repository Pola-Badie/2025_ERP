// Financial Reports API Service
import { apiRequest } from '@/lib/queryClient';
import type {
  TrialBalanceResponse,
  ProfitLossResponse,
  BalanceSheetResponse,
  CashFlowResponse,
  ChartOfAccountsResponse,
  JournalEntriesResponse,
  GeneralLedgerResponse,
  AccountSummaryResponse,
  AgingAnalysisResponse,
  ReportFilters,
  ExportOptions,
  ApiError
} from '@shared/financial-reports-types';

// Base service configuration
const BASE_URL = '/api/reports';

// Error handling helper
const handleApiError = (error: any): ApiError => {
  if (error.response) {
    return {
      message: error.response.data?.message || 'API request failed',
      status: error.response.status,
      code: error.response.data?.code
    };
  }
  return {
    message: error.message || 'Network error occurred',
    status: 0
  };
};

// Build query parameters helper
const buildQueryParams = (filters: Partial<ReportFilters>): URLSearchParams => {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
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
  async getTrialBalance(filters: Partial<ReportFilters>): Promise<TrialBalanceResponse> {
    try {
      const params = buildQueryParams(filters);
      const response = await fetch(`${BASE_URL}/trial-balance?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get Profit & Loss Statement
   */
  async getProfitLoss(filters: Partial<ReportFilters>): Promise<ProfitLossResponse> {
    try {
      const params = buildQueryParams(filters);
      const response = await fetch(`${BASE_URL}/profit-loss?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get Balance Sheet
   */
  async getBalanceSheet(asOfDate: string): Promise<BalanceSheetResponse> {
    try {
      const params = new URLSearchParams({ asOfDate });
      const response = await fetch(`${BASE_URL}/balance-sheet?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get Cash Flow Statement
   */
  async getCashFlow(filters: Partial<ReportFilters>): Promise<CashFlowResponse> {
    try {
      const params = buildQueryParams(filters);
      const response = await fetch(`${BASE_URL}/cash-flow?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get Chart of Accounts
   */
  async getChartOfAccounts(): Promise<ChartOfAccountsResponse> {
    try {
      const response = await fetch(`${BASE_URL}/chart-of-accounts`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get Journal Entries
   */
  async getJournalEntries(filters: Partial<ReportFilters>): Promise<JournalEntriesResponse> {
    try {
      const params = buildQueryParams(filters);
      const response = await fetch(`${BASE_URL}/journal-entries?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get General Ledger
   */
  async getGeneralLedger(
    accountId?: string, 
    filters?: Partial<ReportFilters>
  ): Promise<GeneralLedgerResponse> {
    try {
      const params = buildQueryParams(filters || {});
      
      if (accountId) {
        params.append('accountId', accountId);
      }
      
      const response = await fetch(`${BASE_URL}/general-ledger?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get Account Summary
   */
  async getAccountSummary(): Promise<AccountSummaryResponse> {
    try {
      const response = await fetch(`${BASE_URL}/account-summary`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get Aging Analysis
   */
  async getAgingAnalysis(type: 'receivables' | 'payables' = 'receivables'): Promise<AgingAnalysisResponse> {
    try {
      const params = new URLSearchParams({ type });
      const response = await fetch(`${BASE_URL}/aging-analysis?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Export Report to PDF
   */
  async exportToPDF(options: ExportOptions): Promise<void> {
    try {
      const params = new URLSearchParams();
      
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.asOfDate) params.append('asOfDate', options.asOfDate);
      if (options.accountFilter && options.accountFilter !== 'all') {
        params.append('accountFilter', options.accountFilter);
      }
      
      const response = await fetch(`${BASE_URL}/${options.reportType}/export/pdf?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Export Report to Excel
   */
  async exportToExcel(options: ExportOptions): Promise<void> {
    try {
      const params = new URLSearchParams();
      
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.asOfDate) params.append('asOfDate', options.asOfDate);
      if (options.accountFilter && options.accountFilter !== 'all') {
        params.append('accountFilter', options.accountFilter);
      }
      
      const response = await fetch(`${BASE_URL}/${options.reportType}/export/excel?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get all available reports metadata
   */
  async getReportsMetadata(): Promise<{ reportTypes: string[]; availableFilters: string[] }> {
    try {
      const response = await fetch(`${BASE_URL}/metadata`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  }
};