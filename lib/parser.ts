import Papa from 'papaparse';
import type { Transaction } from '@/types';

// pdfjs is imported dynamically in parsePDF to avoid SSR errors
// as it depends on browser-only globals like DOMMatrix

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
            dateKey = dateKey || headers.find(h => h.includes('date'));
            descKey = descKey || headers.find(h => h.includes('desc') || h.includes('name'));
            amountKey = amountKey || headers.find(h => h.includes('amount') || h.includes('debit'));
        }

        if (!dateKey || !descKey || !amountKey) {
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
          
          const amount = parseFloat(amountMatch[0]);
          if (isNaN(amount) || amount <= 0) continue;

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
  try {
    // Dynamic import to avoid SSR issues with DOMMatrix
    const pdfjs = await import('pdfjs-dist');
    
    // Set up PDF.js worker using a CDN for simplicity in static deployments
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    const lines = fullText.split('\n');
    const transactions: Transaction[] = [];
    
    // Regex for: MM/DD/YYYY Description Amount
    // Matches common formats like "04/15/2024 NETFLIX 15.99"
    const rowRegex = /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([\d.,]+)/g;

    let match;
    while ((match = rowRegex.exec(fullText)) !== null) {
      let dateStr = match[1];
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split('T')[0];
        }
      } catch (e) {}

      const amountStr = match[3].replace(/,/g, '');
      const amount = parseFloat(amountStr);

      if (!isNaN(amount) && amount > 0) {
        transactions.push({
          date: dateStr,
          description: match[2].trim(),
          amount: amount,
          raw: match[0]
        });
      }
    }
    
    return transactions;
  } catch (error) {
    console.error("PDF Parsing error:", error);
    return [];
  }
}
