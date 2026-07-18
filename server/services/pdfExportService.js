/**
 * PDF Export Service
 * Generates professional PDF reports for resume analysis
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Colors palette
 */
const COLORS = {
  primary: '#2563eb', // Blue
  secondary: '#64748b', // Slate
  success: '#10b981', // Green
  warning: '#f59e0b', // Amber
  danger: '#ef4444', // Red
  text: '#1e293b', // Dark slate
  lightText: '#64748b', // Light slate
  background: '#f8fafc', // Very light gray
  border: '#e2e8f0', // Light border
};

/**
 * Generate PDF report
 */
export const generatePDFReport = async (data, outputPath) => {
  const {
    resume,
    analysis,
    jobMatches = [],
    user,
    includeJobMatch = true,
  } = data;

  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
        info: {
          Title: 'ResumeAI Analysis Report',
          Author: 'ResumeAI',
          Subject: 'Resume Analysis and ATS Report',
          Keywords: 'resume, ATS, analysis, job matching',
        },
      });

      // Create write stream
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Track current Y position
      let yPos = 50;

      // Header with branding
      yPos = addHeader(doc, yPos);

      // Document info
      yPos = addDocumentInfo(doc, yPos, resume, user);

      // Executive Summary
      yPos = addExecutiveSummary(doc, yPos, analysis);

      // ATS Score section
      yPos = addATSScore(doc, yPos, analysis);

      // Add new page if needed
      if (yPos > 650) {
        doc.addPage();
        yPos = 50;
      }

      // Strengths section
      yPos = addStrengths(doc, yPos, analysis);

      // Weaknesses section
      yPos = addWeaknesses(doc, yPos, analysis);

      // Add new page for missing skills and suggestions
      doc.addPage();
      yPos = 50;

      // Missing Skills section
      yPos = addMissingSkills(doc, yPos, analysis);

      // AI Suggestions section
      yPos = addSuggestions(doc, yPos, analysis);

      // Job Match Results (if included)
      if (includeJobMatch && jobMatches && jobMatches.length > 0) {
        doc.addPage();
        yPos = 50;
        yPos = addJobMatches(doc, yPos, jobMatches);
      }

      // Footer on last page
      addFooter(doc);

      // Finalize PDF
      doc.end();

      // Wait for stream to finish
      stream.on('finish', () => {
        const stats = fs.statSync(outputPath);
        resolve({
          success: true,
          filePath: outputPath,
          fileSize: stats.size,
        });
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Add header with branding
 */
const addHeader = (doc, yPos) => {
  // Logo/Brand name
  doc
    .fontSize(24)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text('ResumeAI', 50, yPos);

  // Tagline
  doc
    .fontSize(10)
    .fillColor(COLORS.lightText)
    .font('Helvetica')
    .text('AI-Powered Resume Analysis & Optimization', 50, yPos + 28);

  // Horizontal line
  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(50, yPos + 45)
    .lineTo(545, yPos + 45)
    .stroke();

  return yPos + 60;
};

/**
 * Add document information
 */
const addDocumentInfo = (doc, yPos, resume, user) => {
  doc
    .fontSize(18)
    .fillColor(COLORS.text)
    .font('Helvetica-Bold')
    .text('Resume Analysis Report', 50, yPos);

  yPos += 30;

  doc
    .fontSize(10)
    .fillColor(COLORS.lightText)
    .font('Helvetica')
    .text(`Resume: ${resume.originalName || resume.fileName}`, 50, yPos)
    .text(`Generated: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`, 50, yPos + 15)
    .text(`Report ID: ${resume._id.toString().slice(-8).toUpperCase()}`, 50, yPos + 30);

  return yPos + 60;
};

/**
 * Add executive summary
 */
const addExecutiveSummary = (doc, yPos, analysis) => {
  doc
    .fontSize(14)
    .fillColor(COLORS.text)
    .font('Helvetica-Bold')
    .text('Executive Summary', 50, yPos);

  yPos += 25;

  const summary = analysis.summary || 'No summary available.';
  
  doc
    .fontSize(10)
    .fillColor(COLORS.text)
    .font('Helvetica')
    .text(summary, 50, yPos, {
      width: 495,
      align: 'justify',
      lineGap: 3,
    });

  // Calculate text height
  const textHeight = doc.heightOfString(summary, {
    width: 495,
    lineGap: 3,
  });

  return yPos + textHeight + 30;
};

/**
 * Add ATS Score with visual indicator
 */
const addATSScore = (doc, yPos, analysis) => {
  doc
    .fontSize(14)
    .fillColor(COLORS.text)
    .font('Helvetica-Bold')
    .text('ATS Score', 50, yPos);

  yPos += 30;

  const score = analysis.atsScore || 0;
  
  // Score color based on value
  let scoreColor = COLORS.danger;
  if (score >= 80) scoreColor = COLORS.success;
  else if (score >= 60) scoreColor = COLORS.warning;

  // Large score display
  doc
    .fontSize(48)
    .fillColor(scoreColor)
    .font('Helvetica-Bold')
    .text(score.toString(), 50, yPos);

  doc
    .fontSize(16)
    .fillColor(COLORS.lightText)
    .font('Helvetica')
    .text('/ 100', 110, yPos + 20);

  // Score interpretation
  let interpretation = 'Needs Improvement';
  if (score >= 80) interpretation = 'Excellent';
  else if (score >= 70) interpretation = 'Good';
  else if (score >= 60) interpretation = 'Fair';

  doc
    .fontSize(12)
    .fillColor(COLORS.lightText)
    .font('Helvetica-Oblique')
    .text(interpretation, 50, yPos + 60);

  // Score bar
  const barWidth = 200;
  const barHeight = 8;
  const scoreWidth = (score / 100) * barWidth;

  // Background bar
  doc
    .rect(50, yPos + 80, barWidth, barHeight)
    .fillColor(COLORS.background)
    .fill();

  // Score bar
  doc
    .rect(50, yPos + 80, scoreWidth, barHeight)
    .fillColor(scoreColor)
    .fill();

  // Score explanation on the right
  doc
    .fontSize(10)
    .fillColor(COLORS.text)
    .font('Helvetica')
    .text('ATS (Applicant Tracking System) compatibility score', 280, yPos + 10, {
      width: 265,
      lineGap: 2,
    })
    .text('measures how well your resume can be parsed and', 280, yPos + 25, {
      width: 265,
    })
    .text('understood by automated screening systems.', 280, yPos + 40, {
      width: 265,
    });

  return yPos + 110;
};

/**
 * Add strengths section
 */
const addStrengths = (doc, yPos, analysis) => {
  if (!analysis.strengths || analysis.strengths.length === 0) {
    return yPos;
  }

  doc
    .fontSize(14)
    .fillColor(COLORS.text)
    .font('Helvetica-Bold')
    .text('Strengths', 50, yPos);

  yPos += 25;

  analysis.strengths.slice(0, 5).forEach((strength, index) => {
    // Bullet point
    doc
      .fontSize(10)
      .fillColor(COLORS.success)
      .text('✓', 50, yPos);

    // Strength text
    doc
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(strength, 70, yPos, {
        width: 475,
        lineGap: 2,
      });

    const textHeight = doc.heightOfString(strength, {
      width: 475,
      lineGap: 2,
    });

    yPos += Math.max(textHeight + 10, 20);
  });

  return yPos + 20;
};

/**
 * Add weaknesses section
 */
const addWeaknesses = (doc, yPos, analysis) => {
  if (!analysis.weaknesses || analysis.weaknesses.length === 0) {
    return yPos;
  }

  doc
    .fontSize(14)
    .fillColor(COLORS.text)
    .font('Helvetica-Bold')
    .text('Areas for Improvement', 50, yPos);

  yPos += 25;

  analysis.weaknesses.slice(0, 5).forEach((weakness, index) => {
    // Bullet point
    doc
      .fontSize(10)
      .fillColor(COLORS.warning)
      .text('⚠', 50, yPos);

    // Weakness text
    doc
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(weakness, 70, yPos, {
        width: 475,
        lineGap: 2,
      });

    const textHeight = doc.heightOfString(weakness, {
      width: 475,
      lineGap: 2,
    });

    yPos += Math.max(textHeight + 10, 20);
  });

  return yPos + 20;
};

/**
 * Add missing skills section
 */
const addMissingSkills = (doc, yPos, analysis) => {
  if (!analysis.missingSkills || analysis.missingSkills.length === 0) {
    return yPos;
  }

  doc
    .fontSize(14)
    .fillColor(COLORS.text)
    .font('Helvetica-Bold')
    .text('Missing Skills', 50, yPos);

  yPos += 25;

  doc
    .fontSize(10)
    .fillColor(COLORS.lightText)
    .font('Helvetica')
    .text('Consider adding these skills to improve your ATS score:', 50, yPos);

  yPos += 20;

  // Display skills in a grid
  let xPos = 50;
  let rowHeight = 0;

  analysis.missingSkills.slice(0, 15).forEach((skill, index) => {
    const skillWidth = doc.widthOfString(skill) + 20;

    // Check if we need to wrap to next line
    if (xPos + skillWidth > 545) {
      xPos = 50;
      yPos += rowHeight + 10;
      rowHeight = 0;
    }

    // Skill badge
    doc
      .roundedRect(xPos, yPos, skillWidth, 20, 3)
      .fillColor(COLORS.background)
      .fill()
      .strokeColor(COLORS.border)
      .stroke();

    doc
      .fontSize(9)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(skill, xPos + 10, yPos + 6);

    xPos += skillWidth + 10;
    rowHeight = Math.max(rowHeight, 20);
  });

  return yPos + rowHeight + 30;
};

/**
 * Add suggestions section
 */
const addSuggestions = (doc, yPos, analysis) => {
  if (!analysis.suggestions || analysis.suggestions.length === 0) {
    return yPos;
  }

  // Check if we need a new page
  if (yPos > 600) {
    doc.addPage();
    yPos = 50;
  }

  doc
    .fontSize(14)
    .fillColor(COLORS.text)
    .font('Helvetica-Bold')
    .text('AI Recommendations', 50, yPos);

  yPos += 25;

  analysis.suggestions.slice(0, 8).forEach((suggestion, index) => {
    // Number badge
    doc
      .circle(58, yPos + 7, 10)
      .fillColor(COLORS.primary)
      .fill();

    doc
      .fontSize(9)
      .fillColor('white')
      .font('Helvetica-Bold')
      .text((index + 1).toString(), 54, yPos + 3);

    // Suggestion text
    doc
      .fontSize(10)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(suggestion, 75, yPos, {
        width: 470,
        lineGap: 2,
      });

    const textHeight = doc.heightOfString(suggestion, {
      width: 470,
      lineGap: 2,
    });

    yPos += Math.max(textHeight + 15, 25);

    // Add new page if needed
    if (yPos > 700 && index < analysis.suggestions.length - 1) {
      doc.addPage();
      yPos = 50;
    }
  });

  return yPos + 20;
};

/**
 * Add job matches section
 */
const addJobMatches = (doc, yPos, jobMatches) => {
  doc
    .fontSize(14)
    .fillColor(COLORS.text)
    .font('Helvetica-Bold')
    .text('Job Match Results', 50, yPos);

  yPos += 25;

  doc
    .fontSize(10)
    .fillColor(COLORS.lightText)
    .font('Helvetica')
    .text(`Found ${jobMatches.length} job matching result(s)`, 50, yPos);

  yPos += 30;

  jobMatches.slice(0, 5).forEach((match, index) => {
    // Match score badge
    const matchScore = match.matchScore || 0;
    let badgeColor = COLORS.danger;
    if (matchScore >= 80) badgeColor = COLORS.success;
    else if (matchScore >= 60) badgeColor = COLORS.warning;

    doc
      .roundedRect(50, yPos, 60, 25, 3)
      .fillColor(badgeColor)
      .fill();

    doc
      .fontSize(14)
      .fillColor('white')
      .font('Helvetica-Bold')
      .text(`${matchScore}%`, 57, yPos + 6);

    // Job title
    doc
      .fontSize(11)
      .fillColor(COLORS.text)
      .font('Helvetica-Bold')
      .text(match.jobTitle || 'Job Position', 120, yPos + 2);

    // Company
    doc
      .fontSize(9)
      .fillColor(COLORS.lightText)
      .font('Helvetica')
      .text(match.company || 'Company Name', 120, yPos + 16);

    yPos += 40;

    // Matching skills (if available)
    if (match.matchingSkills && match.matchingSkills.length > 0) {
      doc
        .fontSize(9)
        .fillColor(COLORS.lightText)
        .font('Helvetica')
        .text('Matching Skills: ', 50, yPos);

      doc
        .fillColor(COLORS.success)
        .text(match.matchingSkills.slice(0, 5).join(', '), 50, yPos + 12, {
          width: 495,
        });

      yPos += 30;
    }

    // Separator line
    if (index < jobMatches.length - 1) {
      doc
        .strokeColor(COLORS.border)
        .lineWidth(0.5)
        .moveTo(50, yPos)
        .lineTo(545, yPos)
        .stroke();

      yPos += 20;
    }

    // Add new page if needed
    if (yPos > 700 && index < jobMatches.length - 1) {
      doc.addPage();
      yPos = 50;
    }
  });

  return yPos + 30;
};

/**
 * Add footer
 */
const addFooter = (doc) => {
  const pages = doc.bufferedPageRange();
  
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    // Footer line
    doc
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .moveTo(50, 770)
      .lineTo(545, 770)
      .stroke();

    // Footer text
    doc
      .fontSize(8)
      .fillColor(COLORS.lightText)
      .font('Helvetica')
      .text('Generated by ResumeAI - AI-Powered Resume Optimization', 50, 780, {
        width: 400,
      });

    // Page number
    doc
      .fontSize(8)
      .fillColor(COLORS.lightText)
      .text(`Page ${i + 1} of ${pages.count}`, 50, 780, {
        width: 495,
        align: 'right',
      });
  }
};

export default {
  generatePDFReport,
};
