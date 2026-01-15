
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

const pdfjs = pdfjsLib.default || pdfjsLib;

if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

export const parseFileContent = async (file) => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  try {
    if (fileType.startsWith('image/') || fileType.startsWith('video/') || fileType.startsWith('audio/')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to convert media file to base64."));
          }
        };
        reader.onerror = () => reject(new Error("Error reading media file."));
        reader.readAsDataURL(file);
      });
    }

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }
      return fullText;
    } 
    
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileName.endsWith('.docx')
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const mammothLib = mammoth.default || mammoth;
      const result = await mammothLib.extractRawText({ arrayBuffer });
      return result.value;
    }
    
    else {
      if (file.size > 15 * 1024 * 1024) { 
         throw new Error('File is too large.');
      }
      const text = await file.text();
      return text;
    }
  } catch (error) {
    throw new Error(error.message || "Failed to read file.");
  }
};
