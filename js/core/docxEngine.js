/**
 * iZeroPDF - Client-Side PDF to Word (.docx) Engine
 * 100% In-Browser Document Reconstruction via JSZip & OpenXML
 */

const DocxEngine = (function() {
    'use strict';

    function escapeXml(unsafe) {
        if (!unsafe) return '';
        return unsafe.replace(/[<>&'"]/g, function(c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    /**
     * Extracts structured text from a PDF file using PDF.js.
     * Groups text items into paragraphs based on spatial coordinate lines.
     */
    async function extractPdfTextStructure(arrayBuffer, onProgress) {
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        const pagesData = [];

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            if (onProgress) {
                onProgress(pageNum, totalPages, `Extracting text from page ${pageNum} of ${totalPages}...`);
            }

            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const items = textContent.items;

            // Sort items top-to-bottom (Y desc) then left-to-right (X asc)
            // PDF coordinate: transform[4] is X, transform[5] is Y
            const sortedItems = items.slice().sort((a, b) => {
                const yDiff = b.transform[5] - a.transform[5];
                if (Math.abs(yDiff) > 4) { // on different lines
                    return yDiff;
                }
                return a.transform[4] - b.transform[4];
            });

            // Group into lines/paragraphs
            const paragraphs = [];
            let currentLine = [];
            let lastY = null;

            for (const item of sortedItems) {
                const str = item.str;
                if (!str) continue;

                const y = item.transform[5];
                if (lastY === null) {
                    currentLine.push(item);
                    lastY = y;
                } else if (Math.abs(lastY - y) > 6) { // new line threshold
                    paragraphs.push(currentLine);
                    currentLine = [item];
                    lastY = y;
                } else {
                    currentLine.push(item);
                }
            }
            if (currentLine.length > 0) {
                paragraphs.push(currentLine);
            }

            pagesData.push({
                pageNumber: pageNum,
                paragraphs: paragraphs
            });
        }

        return pagesData;
    }

    /**
     * Builds a standard Office OpenXML .docx file using JSZip.
     */
    async function convertPdfToDocx(file, options = {}) {
        const onProgress = options.onProgress || function() {};
        const arrayBuffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();

        onProgress(0, 100, 'Parsing PDF document structure...');
        const pagesData = await extractPdfTextStructure(arrayBuffer, onProgress);

        onProgress(85, 100, 'Generating Word (.docx) OpenXML package...');

        // Build document.xml body
        let docXmlBody = '';

        for (let i = 0; i < pagesData.length; i++) {
            const page = pagesData[i];
            
            // Add page header / break if not first page
            if (i > 0) {
                docXmlBody += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
            }

            for (const para of page.paragraphs) {
                // Combine text items on this line
                let lineText = '';
                let isHeading = false;

                for (const item of para) {
                    lineText += item.str + ' ';
                    // Heuristic: check if font height > 16pt for heading
                    if (item.transform[0] > 15 || item.height > 15) {
                        isHeading = true;
                    }
                }
                lineText = lineText.trim();
                if (!lineText) continue;

                const safeText = escapeXml(lineText);
                const styleXml = isHeading 
                    ? `<w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t xml:space="preserve">${safeText}</w:t></w:r>`
                    : `<w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">${safeText}</w:t></w:r>`;

                docXmlBody += `<w:p>${styleXml}</w:p>`;
            }
        }

        if (!docXmlBody) {
            docXmlBody = `<w:p><w:r><w:t>(No extractable text found in PDF)</w:t></w:r></w:p>`;
        }

        const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <w:body>
        ${docXmlBody}
        <w:sectPr>
            <w:pgSz w:w="12240" w:h="15840"/>
            <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
        </w:sectPr>
    </w:body>
</w:document>`;

        const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

        const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

        const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

        // Package everything with JSZip
        const zip = new JSZip();
        zip.file('[Content_Types].xml', contentTypesXml);
        zip.folder('_rels').file('.rels', rootRelsXml);
        const wordFolder = zip.folder('word');
        wordFolder.file('document.xml', documentXml);
        wordFolder.folder('_rels').file('document.xml.rels', wordRelsXml);

        onProgress(95, 100, 'Compressing .docx package...');
        const docxBlob = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        onProgress(100, 100, 'Ready for download!');
        return docxBlob;
    }

    return {
        convertPdfToDocx,
        extractPdfTextStructure
    };
})();

if (typeof window !== 'undefined') {
    window.DocxEngine = DocxEngine;
}
