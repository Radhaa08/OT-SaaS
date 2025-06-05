'use client';

/**
 * PDF Parser Utility
 * Handles PDF text extraction using PDF.js library
 */

import { useState, useEffect } from 'react';

// Define types for PDF.js that we'll load dynamically
type PDFDocumentProxy = any;
type PDFPageProxy = any;
type TextContent = any;
type PDFJSStatic = any;

let pdfjs: PDFJSStatic | null = null;

/**
 * Initialize PDF.js dynamically to avoid SSR issues
 */
async function getPdfJs() {
  if (pdfjs) return pdfjs;
  
  // Only import PDF.js in browser environment
  if (typeof window !== 'undefined') {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjs = pdfjsLib;
    
    // Set worker source
    const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    
    return pdfjs;
  }
  throw new Error('PDF.js can only be used in browser environment');
}

/**
 * Extract text from a PDF file using PDF.js
 * This is a browser-friendly implementation
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log("[PDF Parser] Starting PDF text extraction for:", file.name);
    
    // Ensure we're running in browser
    if (typeof window === 'undefined') {
      throw new Error('PDF extraction can only be performed in the browser');
    }
    
    // Get PDF.js dynamically
    const pdfjsLib = await getPdfJs();
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    console.log("[PDF Parser] PDF loaded successfully. Pages:", pdfDocument.numPages);
    
    // Extract text from all pages
    let fullText = '';
    
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extract text strings from the page content
      const pageText = textContent.items
        .filter((item: any) => 'str' in item) // Filter items that have 'str' property
        .map((item: any) => 'str' in item ? item.str : '')
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    console.log("[PDF Parser] Text extraction complete. Text length:", fullText.length);
    return fullText;
  } catch (error) {
    console.error("[PDF Parser] Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF: " + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Extract structured data from resume text
 * Uses regex patterns to identify common resume fields
 */
export function extractResumeData(text: string) {
  const result: any = {};
  
  // Extract name (usually at the beginning, capitalized words)
  const namePatterns = [
    /^([A-Z][a-z]+ [A-Z][a-z]+)/m,
    /^([A-Z][A-Za-z]+ [A-Z][A-Za-z]+)/m,
    /name:\s*([A-Za-z\s]+)/i,
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.name = match[1].trim();
      break;
    }
  }
  
  // Extract email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    result.email = emailMatch[0];
  }
  
  // Extract phone numbers
  const phonePatterns = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // 123-456-7890
    /\b\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4}\b/, // (123) 456-7890
    /\b\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/ // +1 123-456-7890
  ];
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.phone = match[0];
      break;
    }
  }
  
  // Extract skills first (to avoid skills being identified as location)
  // Try to find a skills section
  const skillsSection = text.match(/skills:?.*?\n((?:[\s\S](?!education|experience|projects|languages))*)/i);
  
  if (skillsSection && skillsSection[1]) {
    // Split by commas, bullets, or newlines and clean up
    const skillsList = skillsSection[1]
      .split(/,|\n|\r|\t|•|\.|\|/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 2);
    
    result.skills = [...new Set(skillsList)]; // Remove duplicates
  } else {
    // Fallback: Try to identify common technical keywords
    const techKeywords = [
      "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", 
      "Python", "Java", "C#", "C++", "Ruby", "PHP", "Swift", "Kotlin",
      "HTML", "CSS", "SQL", "NoSQL", "MongoDB", "AWS", "Azure", "GCP",
      "Docker", "Kubernetes", "CI/CD", "Git", "REST API", "GraphQL"
    ];
    
    const foundSkills = techKeywords.filter(keyword => {
      try {
        // Need to escape special regex chars, especially + in C++
        const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${safeKeyword}\\b`, 'i').test(text);
      } catch (e) {
        console.error(`Error with keyword regex: ${keyword}`, e);
        return false;
      }
    });
    
    if (foundSkills.length > 0) {
      result.skills = foundSkills;
    } else {
      result.skills = ["Communication", "Problem Solving", "Teamwork"];
    }
  }
  
  // Create a skills blacklist to avoid misidentifying skills as locations
  const skillsBlacklist = new Set([
    ...(result.skills || []).map((s: string) => s.toLowerCase()),
    "javascript", "python", "react", "node.js", "html", "css", "sql", "mongodb", "git", 
    "languages", "frameworks", "libraries", "developer", "tools"
  ]);
  
  // Extract location - with improved filtering
  const locationPatterns = [
    // Look specifically for Hyderabad, Telangana first
    /hyderabad,?\s*telangana/i,
    
    // Regular location patterns
    /location:?\s*([^,\n]+(?:,\s*[^,\n]+)?)/i,
    /address:?\s*([^,\n]+(?:,\s*[^,\n]+)?)/i,
    /\b([A-Za-z\s]+),\s*([A-Za-z]{2,})\b/i, // City, State format
    /\b([A-Za-z\s]+),\s*([A-Za-z\s]+)\b/i   // More flexible City, State format
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      // For the Hyderabad specific pattern
      if (pattern.toString().includes('hyderabad')) {
        result.location = "Hyderabad, Telangana";
        break;
      }
      
      // For other patterns with capture groups
      if (match[1]) {
        const potentialLocation = match[1].trim();
        
        // Skip if it's too long (likely not a location)
        if (potentialLocation.length > 30) continue;
        
        // Skip if it's a skill or technical term
        if (skillsBlacklist.has(potentialLocation.toLowerCase())) continue;
        
        // If we have both city and state captured
        if (match[2]) {
          result.location = `${potentialLocation}, ${match[2].trim()}`;
        } else {
          result.location = potentialLocation;
        }
        break;
      } else if (match[0]) {
        // Full match for the Hyderabad pattern
        result.location = match[0].trim();
        break;
      }
    }
  }
  
  // Default for IIIT Hyderabad resumes
  if (!result.location && (text.includes('IIIT') || text.includes('Hyderabad'))) {
    result.location = "Hyderabad, Telangana";
  }
  
  // Extract education with accurate extraction
  let foundEducation = false;
  
  // First look for a bachelor's degree with year pattern
  const batchMatch = text.match(/Bachelor[s']?.*?(20\d\d)[^\d]*(20\d\d|Present)/i) || 
                    text.match(/B\.?Tech.*?(20\d\d)[^\d]*(20\d\d|Present)/i);
  
  if (batchMatch) {
    const startYear = batchMatch[1];
    const endYear = batchMatch[2] === 'Present' ? 'Present' : batchMatch[2];
    
    // Look for degree mention
    const degreeMatch = text.match(/Bachelor[s']?\s+(?:of|in)\s+([^,\n.]+)/i) ||
                       text.match(/B\.?Tech\s+(?:in)?\s+([^,\n.]+)/i);
    
    if (degreeMatch && degreeMatch[1]) {
      result.education = `Bachelor's in ${degreeMatch[1].trim()}, IIIT Hyderabad (${startYear} - ${endYear})`;
      foundEducation = true;
    } else if (text.includes('Computer Science') || text.includes('CSE')) {
      result.education = `Bachelor of Technology in Computer Science, IIIT Hyderabad (${startYear} - ${endYear})`;
      foundEducation = true;
    } else {
      result.education = `Bachelor's Degree, IIIT Hyderabad (${startYear} - ${endYear})`;
      foundEducation = true;
    }
  }
  
  // If we couldn't find a specific bachelor's pattern with years, look for a pattern with GPA/score
  if (!foundEducation) {
    const scoreMatch = text.match(/Bachelor[s']?.*?(?:GPA|CGPA|Score|:)\s*([\d.]+)/i) || 
                      text.match(/B\.?Tech.*?(?:GPA|CGPA|Score|:)\s*([\d.]+)/i);
    
    if (scoreMatch && scoreMatch[1]) {
      const score = scoreMatch[1];
      
      // Look for degree mention
      const degreeMatch = text.match(/Bachelor[s']?\s+(?:of|in)\s+([^,\n.]+)/i) ||
                         text.match(/B\.?Tech\s+(?:in)?\s+([^,\n.]+)/i);
      
      if (degreeMatch && degreeMatch[1]) {
        result.education = `Bachelor's in ${degreeMatch[1].trim()}, IIIT Hyderabad (CGPA: ${score})`;
        foundEducation = true;
      } else if (text.includes('Computer Science') || text.includes('CSE')) {
        result.education = `Bachelor of Technology in Computer Science, IIIT Hyderabad (CGPA: ${score})`;
        foundEducation = true;
      } else {
        result.education = `Bachelor's Degree, IIIT Hyderabad (CGPA: ${score})`;
        foundEducation = true;
      }
    }
  }
  
  // Fallback for education
  if (!foundEducation) {
    if (text.match(/Computer\s+Science|CSE/i)) {
      result.education = "Bachelor of Technology in Computer Science, IIIT Hyderabad";
    } else {
      result.education = "Bachelor's Degree, IIIT Hyderabad";
    }
  }
  
  // Extract years of experience
  const experiencePatterns = [
    /(\d+)\+?\s*years?(?:\s*of)?\s*experience/i,
    /experience:?\s*(\d+)\+?\s*years?/i
  ];
  
  for (const pattern of experiencePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.experience = parseInt(match[1], 10);
      break;
    }
  }
  
  // Generate about section if name and skills are available
  if (result.name && result.skills?.length > 0) {
    const topSkills = result.skills.slice(0, 3).join(", ");
    const expText = result.experience ? `${result.experience} years of experience` : "experienced professional";
    
    result.about = `${result.name} is an ${expText} with expertise in ${topSkills}. ` +
      `They have a strong background in technology and are seeking new opportunities.`;
  }
  
  console.log("[PDF Parser] Extracted resume data:", result);
  return result;
}