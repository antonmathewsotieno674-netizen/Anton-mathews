
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
  const fileName = file.name.toLowerCase();
  
  try {
    // PDF Handling
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
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
    // Mammoth only supports .docx, not .doc
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileName.endsWith('.docx')
    ) {
      const arrayBuffer = await file.arrayBuffer();
      // Handle mammoth import similarly to pdfjs
      const mammothLib = (mammoth as any).default || mammoth;
      const result = await mammothLib.extractRawText({ arrayBuffer });
      return result.value;
    }
    
    // Fallback: Attempt to read ANY other file as text
    // This supports .txt, .md, .js, .json, .csv, .log, .xml, .rtf (raw), code files, etc.
    else {
      // Basic safeguard for very large files which might freeze the browser if read as text
      if (file.size > 15 * 1024 * 1024) { // 15MB limit
         throw new Error('File is too large to read as text. Please upload a smaller file.');
      }
      
      try {
        const text = await file.text();
        // If the file is binary (like an executable or weird format), extracting text might result in garbage.
        // We return it anyway, letting the AI try to make sense of it or the user to see it.
        if (text.length === 0) {
          throw new Error('File appears to be empty.');
        }
        return text;
      } catch (err) {
        console.error("Text read error:", err);
        throw new Error("Could not read this file format. It might be a binary file or corrupted.");
      }
    }
  } catch (error: any) {
    console.error("Error parsing file:", error);
    throw new Error(error.message || "Failed to read file content.");
  }
};
