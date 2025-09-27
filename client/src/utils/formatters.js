// Currency and number formatting utilities
/**
 * Format currency values using proper Intl.NumberFormat
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Properly formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};
/**
 * Format percentage values
 * @param value - The percentage value (e.g., 0.2595 for 25.95%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
};
/**
 * Format number with thousands separators
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 */
export const formatNumber = (value, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
};
/**
 * Parse currency string back to number
 * @param currencyString - Currency string like "$1,234.56"
 * @returns Numeric value
 */
export const parseCurrency = (currencyString) => {
    // Remove currency symbols, spaces, and commas, then parse as float
    const cleanString = currencyString.replace(/[^0-9.-]/g, '');
    return parseFloat(cleanString) || 0;
};
