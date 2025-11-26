import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

// Fix for pdfjs-dist import structure in ESM environments
// The library might be exported as 'default' depending on the CDN/Build
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Initialize PDF.js worker
if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

export const parseFileContent = async (file: File): Promise<string> => {
  const fileType = file.type;
  
  try {
    // PDF Handling
    if (fileType === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      // Use the resolved pdfjs object
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }
      return fullText;
    } 
    
    // Word (.docx) Handling
    else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const arrayBuffer = await file.arrayBuffer();
      // Handle mammoth import similarly to pdfjs
      const mammothLib = (mammoth as any).default || mammoth;
      const result = await mammothLib.extractRawText({ arrayBuffer });
      return result.value;
    }
    
    // Plain Text Handling
    else if (fileType.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.js') || file.name.endsWith('.json')) {
      return await file.text();
    }
    
    throw new Error('Unsupported file type for text extraction');
  } catch (error) {
    console.error("Error parsing file:", error);
    throw new Error("Failed to read file content. Please ensure the file is not corrupted.");
  }
};