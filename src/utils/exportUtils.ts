import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { VideoSummary, HighlightedSegment } from '../types';

export const exportToTxt = async (
  videoData: VideoSummary,
  highlightedSegments: HighlightedSegment[] = [],
  filename: string
) => {
  const content = generateTextContent(videoData, highlightedSegments);
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToPdf = async (
  videoData: VideoSummary,
  highlightedSegments: HighlightedSegment[] = [],
  filename: string
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add text with word wrapping
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    if (isBold) {
      pdf.setFont(undefined, 'bold');
    } else {
      pdf.setFont(undefined, 'normal');
    }
    
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    // Check if we need a new page
    if (yPosition + (lines.length * fontSize * 0.5) > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    
    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * fontSize * 0.5 + 5;
  };

  // Title
  addText(videoData.title, 18, true);
  addText(`Channel: ${videoData.channelName}`, 12);
  addText(`Duration: ${videoData.duration}`, 12);
  yPosition += 10;

  // Summary
  addText('SUMMARY', 14, true);
  addText(videoData.summary, 12);
  yPosition += 10;

  // Bullet Points
  addText('KEY LEARNING POINTS', 14, true);
  videoData.bulletPoints.forEach(point => {
    addText(`• ${point}`, 12);
  });
  yPosition += 10;

  // Key Quote
  addText('MEMORABLE QUOTE', 14, true);
  addText(`"${videoData.keyQuote}"`, 12);
  yPosition += 10;

  // Highlighted Segments
  if (highlightedSegments.length > 0) {
    addText('HIGHLIGHTED SEGMENTS', 14, true);
    highlightedSegments.forEach(segment => {
      addText(`[${segment.timestamp}] ${segment.text}`, 10);
      addText(`Reason: ${segment.reason}`, 9);
      yPosition += 5;
    });
  }

  pdf.save(`${filename}.pdf`);
};

export const exportToDocx = async (
  videoData: VideoSummary,
  highlightedSegments: HighlightedSegment[] = [],
  filename: string
) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: videoData.title,
          heading: HeadingLevel.TITLE,
        }),
        
        // Video Info
        new Paragraph({
          children: [
            new TextRun({ text: 'Channel: ', bold: true }),
            new TextRun(videoData.channelName),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Duration: ', bold: true }),
            new TextRun(videoData.duration),
          ],
        }),
        new Paragraph({ text: '' }), // Empty line

        // Summary
        new Paragraph({
          text: 'SUMMARY',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: videoData.summary,
        }),
        new Paragraph({ text: '' }),

        // Bullet Points
        new Paragraph({
          text: 'KEY LEARNING POINTS',
          heading: HeadingLevel.HEADING_1,
        }),
        ...videoData.bulletPoints.map(point => 
          new Paragraph({
            text: `• ${point}`,
          })
        ),
        new Paragraph({ text: '' }),

        // Key Quote
        new Paragraph({
          text: 'MEMORABLE QUOTE',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `"${videoData.keyQuote}"`, italics: true }),
          ],
        }),
        new Paragraph({ text: '' }),

        // Highlighted Segments
        ...(highlightedSegments.length > 0 ? [
          new Paragraph({
            text: 'HIGHLIGHTED SEGMENTS',
            heading: HeadingLevel.HEADING_1,
          }),
          ...highlightedSegments.flatMap(segment => [
            new Paragraph({
              children: [
                new TextRun({ text: `[${segment.timestamp}] `, bold: true }),
                new TextRun(segment.text),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Reason: ', bold: true, size: 20 }),
                new TextRun({ text: segment.reason, size: 20 }),
              ],
            }),
            new Paragraph({ text: '' }),
          ])
        ] : []),

        // Full Transcript
        new Paragraph({
          text: 'FULL TRANSCRIPT',
          heading: HeadingLevel.HEADING_1,
        }),
        ...videoData.transcript.map(segment =>
          new Paragraph({
            children: [
              new TextRun({ text: `[${segment.timestamp}] `, bold: true, size: 20 }),
              new TextRun({ text: segment.text, size: 20 }),
            ],
          })
        ),
      ],
    }],
  });

  const buffer = await Packer.toBlob(doc);
  const url = URL.createObjectURL(buffer);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const generateTextContent = (
  videoData: VideoSummary,
  highlightedSegments: HighlightedSegment[] = []
): string => {
  let content = `${videoData.title}\n`;
  content += `${'='.repeat(videoData.title.length)}\n\n`;
  content += `Channel: ${videoData.channelName}\n`;
  content += `Duration: ${videoData.duration}\n`;
  content += `Generated: ${new Date().toLocaleDateString()}\n\n`;

  content += `SUMMARY\n`;
  content += `-------\n`;
  content += `${videoData.summary}\n\n`;

  content += `KEY LEARNING POINTS\n`;
  content += `------------------\n`;
  videoData.bulletPoints.forEach(point => {
    content += `• ${point}\n`;
  });
  content += `\n`;

  content += `MEMORABLE QUOTE\n`;
  content += `--------------\n`;
  content += `"${videoData.keyQuote}"\n\n`;

  if (highlightedSegments.length > 0) {
    content += `HIGHLIGHTED SEGMENTS\n`;
    content += `-------------------\n`;
    highlightedSegments.forEach(segment => {
      content += `[${segment.timestamp}] ${segment.text}\n`;
      content += `Reason: ${segment.reason}\n\n`;
    });
  }

  content += `FULL TRANSCRIPT\n`;
  content += `--------------\n`;
  videoData.transcript.forEach(segment => {
    content += `[${segment.timestamp}] ${segment.text}\n\n`;
  });

  return content;
};