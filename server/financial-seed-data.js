import fs from 'fs';
import path from 'path';
let financialData = null;
export function loadFinancialData() {
    if (financialData) {
        return financialData;
    }
    try {
        const dataPath = path.join(process.cwd(), 'data.json');
        const fileContent = fs.readFileSync(dataPath, 'utf8');
        financialData = JSON.parse(fileContent);
        return financialData;
    }
    catch (error) {
        console.error('Error loading financial data:', error);
        // Return empty data structure if file not found
        return {
            accounts: [],
            expenses: [],
            purchases: [],
            dueInvoices: []
        };
    }
}
