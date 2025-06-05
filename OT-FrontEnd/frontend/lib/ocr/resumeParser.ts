'use client';

/**
 * Resume Parser Utility
 * This module handles uploading resume files (PDF, DOC, DOCX, TXT, etc.) to the server
 * and populates form fields with the extracted information.
 */

// Import our PDF.js parser functions
import { extractTextFromPDF, extractResumeData } from './pdfParser';

// Define the output format for parsed resume data
export interface ParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  experience?: number;
  education?: string;
  about?: string;
}

/**
 * Extracts text content from a file
 */
async function extractText(file: File): Promise<string> {
  try {
    console.log("[Resume Parser] Extracting text from file:", file.name, file.type, file.size);
    
    // Use our PDF parser for PDF files
    if (file.type === "application/pdf") {
      return await extractTextFromPDF(file);
    }
    
    // For other file types, use the built-in text() method
    const text = await file.text();
    console.log("[Resume Parser] Extracted text length:", text.length);
    console.log("[Resume Parser] Text preview:", text.substring(0, 100) + "...");
    
    return text;
  } catch (error) {
    console.error("[Resume Parser] Error extracting text from file:", error);
    throw error;
  }
}

/**
 * Parse a resume file and extract structured information
 */
export async function parseResumeFile(file: File): Promise<ParsedResumeData> {
  console.log("[Resume Parser] Starting resume parsing for file:", file.name);
  try {
    // Extract text from the file
    const text = await extractText(file);
    if (!text) {
      console.error("[Resume Parser] Could not extract text from file");
      throw new Error("Could not extract text from file");
    }

    console.log("[Resume Parser] Successfully extracted text, beginning parsing");
    
    // Use our data extraction function to parse the resume text
    const extractedData = extractResumeData(text);
    
    // Convert to our interface format
    const result: ParsedResumeData = {
      name: extractedData.name,
      email: extractedData.email,
      phone: extractedData.phone,
      location: extractedData.location,
      skills: extractedData.skills || [],
      experience: extractedData.experience,
      education: extractedData.education,
      about: extractedData.about
    };
    
    // If we couldn't extract experience, estimate based on content length as fallback
    if (result.experience === undefined) {
      result.experience = Math.min(5, Math.max(1, Math.floor(text.length / 2000)));
      console.log("[Resume Parser] Estimated experience based on content length:", result.experience);
    }
    
    // Set default education if none found
    if (!result.education) {
      result.education = "Bachelor's Degree";
      console.log("[Resume Parser] No education found, using default:", result.education);
    }
    
    console.log("[Resume Parser] Completed parsing. Final result:", result);
    return result;
  } catch (error) {
    console.error("[Resume Parser] Error parsing resume:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}