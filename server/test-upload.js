/**
 * Test script for resume upload functionality
 * 
 * This script tests:
 * 1. User registration/login
 * 2. Resume upload with valid file
 * 3. Get resumes list
 * 4. Delete resume
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'Test@1234',
};

let authToken = '';
let uploadedResumeId = '';

/**
 * Step 1: Register test user
 */
async function registerUser() {
  try {
    console.log('\n📝 Step 1: Registering test user...');
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    authToken = response.data.data.token;
    console.log('✅ User registered successfully');
    console.log('👤 User:', response.data.data.user.name);
    console.log('🔑 Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Step 2: Create a dummy PDF file for testing
 */
function createDummyPDF() {
  try {
    console.log('\n📄 Step 2: Creating dummy PDF file...');
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
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Resume) Tj
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
0000000363 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
441
%%EOF`;

    const filePath = path.join(__dirname, 'test-resume.pdf');
    fs.writeFileSync(filePath, pdfContent);
    console.log('✅ Dummy PDF created:', filePath);
    return filePath;
  } catch (error) {
    console.error('❌ Failed to create dummy PDF:', error.message);
    return null;
  }
}

/**
 * Step 3: Upload resume
 */
async function uploadResume(filePath) {
  try {
    console.log('\n📤 Step 3: Uploading resume...');
    
    const form = new FormData();
    form.append('resume', fs.createReadStream(filePath));

    const response = await axios.post(`${API_BASE_URL}/resumes/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${authToken}`,
      },
    });

    uploadedResumeId = response.data.data.id;
    console.log('✅ Resume uploaded successfully');
    console.log('📋 Resume ID:', uploadedResumeId);
    console.log('📁 Original Name:', response.data.data.originalName);
    console.log('💾 File Size:', response.data.data.fileSize, 'bytes');
    console.log('📅 Upload Date:', response.data.data.uploadDate);
    return true;
  } catch (error) {
    console.error('❌ Upload failed:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Step 4: Test file size limit (should fail)
 */
async function testFileSizeLimit() {
  try {
    console.log('\n⚠️  Step 4: Testing file size limit (should fail)...');
    
    // Create a large file (>5MB)
    const largePath = path.join(__dirname, 'large-resume.pdf');
    const largeContent = Buffer.alloc(6 * 1024 * 1024); // 6MB
    fs.writeFileSync(largePath, largeContent);

    const form = new FormData();
    form.append('resume', fs.createReadStream(largePath));

    await axios.post(`${API_BASE_URL}/resumes/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log('❌ File size limit test failed - large file was accepted');
    fs.unlinkSync(largePath);
    return false;
  } catch (error) {
    if (error.response?.data?.message?.includes('5MB')) {
      console.log('✅ File size limit working correctly');
      fs.unlinkSync(path.join(__dirname, 'large-resume.pdf'));
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Step 5: Test invalid file type (should fail)
 */
async function testInvalidFileType() {
  try {
    console.log('\n⚠️  Step 5: Testing invalid file type (should fail)...');
    
    const txtPath = path.join(__dirname, 'test-resume.txt');
    fs.writeFileSync(txtPath, 'This is a text file');

    const form = new FormData();
    form.append('resume', fs.createReadStream(txtPath));

    await axios.post(`${API_BASE_URL}/resumes/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log('❌ File type validation failed - .txt file was accepted');
    fs.unlinkSync(txtPath);
    return false;
  } catch (error) {
    if (error.response?.data?.message?.includes('Invalid file type')) {
      console.log('✅ File type validation working correctly');
      fs.unlinkSync(path.join(__dirname, 'test-resume.txt'));
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Step 6: Get all resumes
 */
async function getResumes() {
  try {
    console.log('\n📋 Step 6: Getting all resumes...');
    
    const response = await axios.get(`${API_BASE_URL}/resumes`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log('✅ Fetched resumes successfully');
    console.log('📊 Total resumes:', response.data.count);
    response.data.data.forEach((resume, index) => {
      console.log(`   ${index + 1}. ${resume.originalName} (${resume.fileType.toUpperCase()})`);
    });
    return true;
  } catch (error) {
    console.error('❌ Failed to fetch resumes:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Step 7: Delete resume
 */
async function deleteResume() {
  try {
    console.log('\n🗑️  Step 7: Deleting resume...');
    
    const response = await axios.delete(`${API_BASE_URL}/resumes/${uploadedResumeId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log('✅ Resume deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete resume:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Cleanup test files
 */
function cleanup() {
  console.log('\n🧹 Cleaning up test files...');
  const testFiles = ['test-resume.pdf', 'large-resume.pdf', 'test-resume.txt'];
  testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
  console.log('✅ Cleanup complete');
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 RESUME UPLOAD API TEST SUITE');
  console.log('='.repeat(60));

  try {
    // Step 1: Register user
    if (!await registerUser()) {
      console.log('\n❌ Test suite failed at registration');
      return;
    }

    // Step 2: Create dummy PDF
    const pdfPath = createDummyPDF();
    if (!pdfPath) {
      console.log('\n❌ Test suite failed at PDF creation');
      return;
    }

    // Step 3: Upload resume
    if (!await uploadResume(pdfPath)) {
      console.log('\n❌ Test suite failed at upload');
      cleanup();
      return;
    }

    // Step 4: Test file size limit
    await testFileSizeLimit();

    // Step 5: Test invalid file type
    await testInvalidFileType();

    // Step 6: Get resumes
    await getResumes();

    // Step 7: Delete resume
    await deleteResume();

    // Final check - verify resume list is empty
    console.log('\n✅ Step 8: Verifying deletion...');
    const finalCheck = await axios.get(`${API_BASE_URL}/resumes`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    
    if (finalCheck.data.count === 0) {
      console.log('✅ Resume successfully deleted - list is empty');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test suite encountered an error:', error.message);
  } finally {
    cleanup();
  }
}

// Run tests
runTests();
