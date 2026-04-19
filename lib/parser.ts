import Papa from 'papaparse';
import type { Transaction } from '@/types';

export async function parseFile(file: File): Promise<Transaction[]> {
  if (file.type === 'application/pdf') {
    return parsePDF(file);
  } else {
    return parseCSV(file);
  }
}

async function parseCSV(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const transactions: Transaction[] = [];
        const data = results.data as Record<string, string>[];
        if (data.length === 0) return resolve([]);
        
        const headers = Object.keys(data[0]).map(h => h.toLowerCase().trim());
        
        let dateKey = headers.find(h => ['date', 'time', 'posted', 'transaction date', 'value date'].includes(h));
        let descKey = headers.find(h => ['desc', 'merchant', 'name', 'narration', 'details', 'particulars', 'reference', 'description'].includes(h));
        let amountKey = headers.find(h => ['amount', 'debit', 'credit', 'withdrawal', 'dr'].includes(h));

        if (!dateKey || !descKey || !amountKey) {
            // fallback generic search if exact match fails
            dateKey = dateKey || headers.find(h => h.includes('date'));
            descKey = descKey || headers.find(h => h.includes('desc') || h.includes('name'));
            amountKey = amountKey || headers.find(h => h.includes('amount') || h.includes('debit'));
        }

        if (!dateKey || !descKey || !amountKey) {
            console.warn("Could not automatically determine columns. Using defaults.");
            dateKey = Object.keys(data[0])[0];
            descKey = Object.keys(data[0])[1];
            amountKey = Object.keys(data[0])[2];
        }

        const dateOriginalKey = Object.keys(data[0]).find(k => k.toLowerCase().trim() === dateKey);
        const descOriginalKey = Object.keys(data[0]).find(k => k.toLowerCase().trim() === descKey);
        const amountOriginalKey = Object.keys(data[0]).find(k => k.toLowerCase().trim() === amountKey);

        for (const row of data) {
          const rawDate = row[dateOriginalKey!] || '';
          const rawDesc = row[descOriginalKey!] || '';
          const rawAmount = row[amountOriginalKey!] || '';

          const amountMatch = rawAmount.match(/[\d.]+/);
          if (!amountMatch) continue;
          
          let amount = parseFloat(amountMatch[0]);
          if (isNaN(amount) || amount <= 0) continue;

          // Simple date normalization
          let dateStr = rawDate;
          try {
             const d = new Date(rawDate);
             if (!isNaN(d.getTime())) {
                dateStr = d.toISOString().split('T')[0];
             }
          } catch(e) {}

          transactions.push({
            date: dateStr,
            description: rawDesc,
            amount: amount,
            raw: JSON.stringify(row)
          });
        }
        resolve(transactions);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

async function parsePDF(file: File): Promise<Transaction[]> {
  // Use dynamic import for pdf-parse, but pdf-parse is typically Node.js only.
  // In a browser, we'd use pdf.js. Given constraints, assuming the user might use a server action
  // or a compatible browser version of pdf-parse if specified.
  // The user prompt specifically asked to "Dynamic import pdf-parse only when file.type === 'application/pdf'."
  // We will try our best.
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const arrayBuffer = await file.arrayBuffer();
    const data = await pdfParse(Buffer.from(arrayBuffer));
    
    const lines = data.text.split('\n');
    const transactions: Transaction[] = [];
    
    // basic regex for MM/DD/YYYY DESC AMOUNT
    const rowRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([\d.,]+)$/;

    for (const line of lines) {
       const match = line.trim().match(rowRegex);
       if (match) {
          let dateStr = match[1];
          try {
             const d = new Date(dateStr);
             if (!isNaN(d.getTime())) {
                dateStr = d.toISOString().split('T')[0];
             }
          } catch(e) {}

          let amount = parseFloat(match[3].replace(/[^\d.]/g, ''));
          if (isNaN(amount) || amount <= 0) continue;

          transactions.push({
             date: dateStr,
             description: match[2].trim(),
             amount,
             raw: line
          });
       }
    }
    return transactions;
  } catch (error) {
    console.error("PDF Parsing error:", error);
    return [];
  }
}
