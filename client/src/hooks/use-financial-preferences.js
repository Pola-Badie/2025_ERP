import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
const DEFAULT_FINANCIAL_PREFERENCES = {
    baseCurrency: 'EGP',
    vatRate: 14,
    taxRate: 14,
    fiscalYearStart: '01-01',
    invoicePrefix: 'INV',
    quotationPrefix: 'QUO',
    autoNumbering: true,
    multiCurrency: false,
    paymentTerms: '30',
    creditLimit: '10000',
    discountCalculation: 'line',
};
export const useFinancialPreferences = () => {
    const { data: preferences, isLoading, error, refetch } = useQuery({
        queryKey: ['/api/system-preferences/category/financial'],
        queryFn: async () => await apiRequest('GET', '/api/system-preferences/category/financial'),
        refetchInterval: 300000, // Refetch every 5 minutes
    });
    // Transform preferences array into a structured object
    const financialPreferences = React.useMemo(() => {
        if (!preferences || preferences.length === 0) {
            return DEFAULT_FINANCIAL_PREFERENCES;
        }
        const result = { ...DEFAULT_FINANCIAL_PREFERENCES };
        preferences.forEach((pref) => {
            const key = pref.key.replace('financial_', '');
            // Handle type conversion based on data type and key name
            if (key === 'baseCurrency' || key === 'fiscalYearStart' || key === 'invoicePrefix' ||
                key === 'quotationPrefix' || key === 'paymentTerms' || key === 'creditLimit' ||
                key === 'discountCalculation') {
                result[key] = pref.value || result[key];
            }
            else if (key === 'vatRate' || key === 'taxRate') {
                result[key] = parseFloat(pref.value) || result[key];
            }
            else if (key === 'autoNumbering' || key === 'multiCurrency') {
                result[key] = Boolean(pref.value);
            }
        });
        return result;
    }, [preferences]);
    return {
        preferences: financialPreferences,
        isLoading,
        error,
        refetch,
        // Helper functions for common use cases
        getCurrency: () => financialPreferences.baseCurrency,
        getVatRate: () => financialPreferences.vatRate,
        getTaxRate: () => financialPreferences.taxRate,
        getCurrencySymbol: () => {
            switch (financialPreferences.baseCurrency) {
                case 'EGP': return 'EGP';
                case 'USD': return '$';
                case 'EUR': return '€';
                case 'GBP': return '£';
                case 'SAR': return 'SAR';
                case 'AED': return 'AED';
                default: return financialPreferences.baseCurrency;
            }
        },
        formatCurrency: (amount) => {
            const currency = financialPreferences.baseCurrency;
            const symbol = currency === 'EGP' ? 'EGP' : currency;
            if (currency === 'EGP') {
                return `${symbol} ${amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;
            }
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
            }).format(amount);
        },
    };
};
