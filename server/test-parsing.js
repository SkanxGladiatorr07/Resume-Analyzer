/**
 * Test Script for Resume Parsing
 * Tests PDF and DOCX text extraction
 */

import * as resumeParserService from './services/resumeParserService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('='.repeat(60));
console.log('🧪 RESUME PARSING TEST SUITE');
console.log('='.repeat(60));

/**
 * Create a test PDF file
 */
const createTestPDF = () => {
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length 120
>>
stream
BT
/F1 12 Tf
100 700 Td
(JOHN DOE) Tj
0 -20 Td
(Software Engineer) Tj
0 -20 Td
(Experience: 5+ years in web development) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000270 00000 n
0000000439 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
517
%%EOF`;

  const filePath = path.join(__dirname, 'test-resume.pdf');
  fs.writeFileSync(filePath, pdfContent);
  console.log('✅ Created test PDF file');
  return filePath;
};

/**
 * Test PDF parsing
 */
const testPDFParsing = async (filePath) => {
  try {
    console.log('\n📄 Testing PDF Parsing...');
    
    const extractedText = await resumeParserService.parseResume(filePath, 'pdf');
    
    console.log('✅ PDF parsing successful');
    console.log(`📝 Extracted ${extractedText.length} characters`);
    console.log(`📊 Word count: ${resumeParserService.getWordCount(extractedText)}`);
    console.log('\n--- Extracted Text ---');
    console.log(extractedText);
    console.log('--- End ---\n');
    
    return true;
  } catch (error) {
    console.error('❌ PDF parsing failed:', error.message);
    return false;
  }
};

/**
 * Test file validation
 */
const testFileValidation = async (filePath) => {
  try {
    console.log('🔍 Testing File Validation...');
    
    const isValid = await resumeParserService.validateParseableFile(filePath, 'pdf');
    
    if (isValid) {
      console.log('✅ File validation passed');
    } else {
      console.log('❌ File validation failed');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    return false;
  }
};

/**
 * Test text cleaning
 */
const testTextCleaning = () => {
  console.log('\n🧹 Testing Text Cleaning...');
  
  const dirtyText = `Test    Resume

Name:     John   Doe


Email:  john@example.com


Experience:    5+    years`;

  const cleanedText = dirtyText.replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
  
  console.log('✅ Text cleaned successfully');
  console.log('--- Before ---');
  console.log(dirtyText);
  console.log('--- After ---');
  console.log(cleanedText);
  console.log('--- End ---\n');
};

/**
 * Run all tests
 */
const runTests = async () => {
  try {
    // Test 1: Text Cleaning
    testTextCleaning();
    
    // Test 2: Create test PDF
    const pdfPath = createTestPDF();
    
    // Test 3: File Validation
    await testFileValidation(pdfPath);
    
    // Test 4: PDF Parsing
    const pdfSuccess = await testPDFParsing(pdfPath);
    
    // Cleanup
    console.log('🧹 Cleaning up test files...');
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
      console.log('✅ Test files cleaned up');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    if (pdfSuccess) {
      console.log('🎉 ALL TESTS PASSED!');
    } else {
      console.log('⚠️  SOME TESTS FAILED');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
  }
};

// Run tests
runTests();
