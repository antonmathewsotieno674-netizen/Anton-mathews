
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

// Fix for pdfjs-dist import structure in ESM environments
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Initialize PDF.js worker
if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

export const parseFileContent = async (file: File): Promise<string> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  try {
    // 1. Image, Video, and Audio Handling (Base64)
    if (fileType.startsWith('image/') || fileType.startsWith('video/') || fileType.startsWith('audio/')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result); // Returns Data URL (e.g., "data:image/png;base64,...")
          } else {
            reject(new Error("Failed to convert media file to base64."));
          }
        };
        reader.onerror = () => reject(new Error("Error reading media file."));
        reader.readAsDataURL(file);
      });
    }

    // 2. PDF Handling
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
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
    
    // 3. Word (.docx) Handling
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileName.endsWith('.docx')
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const mammothLib = (mammoth as any).default || mammoth;
      const result = await mammothLib.extractRawText({ arrayBuffer });
      return result.value;
    }
    
    // 4. Fallback: Text Files
    else {
      if (file.size > 15 * 1024 * 1024) { 
         throw new Error('File is too large to read as text. Please upload a smaller file.');
      }
      const text = await file.text();
      if (text.length === 0) throw new Error('File appears to be empty.');
      return text;
    }
  } catch (error: any) {
    console.error("Error parsing file:", error);
    throw new Error(error.message || "Failed to read file content.");
  }
};
