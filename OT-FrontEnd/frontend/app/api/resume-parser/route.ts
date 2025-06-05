import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { PDFDocument } from 'pdf-lib';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'resumes');
const DEBUG_DIR = path.join(process.cwd(), 'debug');

// Make sure directories exist
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
  }
} catch (err) {
  console.error('Error creating directories:', err);
}

export async function POST(request: Request) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log(`Processing ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // Create a unique filename to avoid collisions
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name).toLowerCase();
    const uniqueFilename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);

    // Convert the file to Buffer for Node.js APIs
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Save the original file
    await fsPromises.writeFile(filePath, fileBuffer);
    console.log(`File saved to ${filePath}`);
    
    // Process the file based on its type
    let extractedText = '';
    const fileType = file.type;

    if (fileType === 'application/pdf') {
      extractedText = await extractTextFromPDF(fileBuffer);
    } else if (fileType.startsWith('image/')) {
      // For image files, we'll rely on a simpler extraction method since 
      // server-side OCR would require additional setup with Tesseract.js
      extractedText = `Image file processed: ${file.name}`;
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               fileType === 'application/msword') {
      // For Word documents, we'll extract simple text
      extractedText = `DOCX file processed: ${file.name}`;
    } else {
      // For other file types, treat as plain text
      extractedText = fileBuffer.toString('utf-8');
    }

    // Save the extracted text for debugging
    const debugFilePath = path.join(DEBUG_DIR, `${timestamp}-extracted.txt`);
    await fsPromises.writeFile(debugFilePath, extractedText);
    
    // Parse the text to extract structured data
    const parsedData = parseResumeText(extractedText);
    
    // Return the parsed data
    return NextResponse.json({
      success: true, 
      parsedData,
      filePath: `/resumes/${uniqueFilename}`
    });
    
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'File processing failed: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // Use PDF.js for extraction (simplified approach)
    // In a production environment, you might want to use a more robust solution
    // or set up a Python microservice for this
    
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const numPages = pdfDoc.getPageCount();
    
    // For simplicity, we'll return some basic info about the PDF
    // In a real implementation, you'd use a proper PDF text extraction library
    return `PDF with ${numPages} pages processed. Please install a PDF extraction library for full functionality.`;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  }
}

function parseResumeText(text: string): any {
  // This is a more robust implementation of the text parsing function
  const parsedData: any = {};
  
  // Make the text lowercase for easier matching
  const lowerText = text.toLowerCase();
  
  // Extract email using regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    parsedData.email = emails[0];
  }
  
  // Extract phone number using a more comprehensive pattern
  const phoneRegex = /(?:(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}|\d{10})/g;
  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    parsedData.phone = phones[0];
  }
  
  // Extract name (assume it's near the top of the resume)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    // Try to find a line that looks like a name
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      // A name typically doesn't contain email, phone numbers, or too many words
      if (!line.match(emailRegex) && !line.match(/\d{3}/) && 
          line.split(' ').length <= 4 && line.length > 2 && 
          !line.match(/resume|curriculum|vitae|cv|profile/i)) {
        parsedData.name = line;
        break;
      }
    }
  }
  
  // Extract skills - look for sections with keywords like "skills", "technologies", etc.
  const skillSectionRegex = /(?:skill|technical skill|core competenc|technolog)[^]*?(?=\n\s*[A-Z][A-Za-z\s]{2,20}:|\n\s*[A-Z][A-Za-z\s]{2,20}\n|$)/i;
  const skillSection = text.match(skillSectionRegex);
  if (skillSection && skillSection[0]) {
    // Extract individual skills by splitting on common delimiters
    const skillText = skillSection[0].replace(/(?:skill|technical skill|core competenc|technolog)[^:]*:?/i, '').trim();
    const skillsList = skillText
      .split(/[,;•|\n]/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 2 && skill.length < 30);
    
    if (skillsList.length > 0) {
      parsedData.skills = skillsList;
    }
  }
  
  // Extract education information
  const educationRegex = /(?:education|academic|qualification)[^]*?(?=\n\s*[A-Z][A-Za-z\s]{2,20}:|\n\s*[A-Z][A-Za-z\s]{2,20}\n|$)/i;
  const educationSection = text.match(educationRegex);
  if (educationSection && educationSection[0]) {
    const eduText = educationSection[0].replace(/(?:education|academic|qualification)[^:]*:?/i, '').trim();
    parsedData.education = eduText
      .split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 3)
      .join(' - ');
  }
  
  // Extract years of experience
  const expRegex = /(\d+)[\s+]*(years|year|yr|yrs)[\s+]*(of)?[\s+]*(experience|exp)/i;
  const expMatch = text.match(expRegex);
  if (expMatch && expMatch[1]) {
    parsedData.experience = parseInt(expMatch[1], 10);
  }
  
  // Extract location (city, state)
  const locationRegex = /([A-Z][a-z]+[\s,]+[A-Z]{2}|[A-Z][a-z]+,\s*[A-Z][a-z]+)/;
  const locationSection = text.match(locationRegex);
  if (locationSection) {
    parsedData.location = locationSection[0];
  }
  
  // Extract about/summary section
  const summaryRegex = /(?:summary|objective|profile|about)[^]*?(?=\n\s*[A-Z][A-Za-z\s]{2,20}:|\n\s*[A-Z][A-Za-z\s]{2,20}\n|$)/i;
  const summarySection = text.match(summaryRegex);
  if (summarySection && summarySection[0]) {
    const summaryText = summarySection[0].replace(/(?:summary|objective|profile|about)[^:]*:?/i, '').trim();
    parsedData.about = summaryText.split('\n')[0].slice(0, 150);
  }
  
  return parsedData;
}