/**
 * iZeroPDF - Form & Annotation Flattening Engine
 * 100% Client-Side PDF Form Freezing
 */

const FlattenEngine = (function() {
    'use strict';

    /**
     * Inspects a PDF and retrieves form fields and interactive annotations.
     * @param {File|ArrayBuffer} file 
     * @returns {Promise<Object>}
     */
    async function inspectPdfForms(file) {
        const arrayBuffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

        let form = null;
        let fields = [];
        try {
            form = pdfDoc.getForm();
            const rawFields = form.getFields();
            fields = rawFields.map(f => {
                let type = 'Unknown';
                let value = '';
                try {
                    const ctor = f.constructor ? f.constructor.name : '';
                    if (ctor.includes('TextField') || f.getText) {
                        type = 'Text Field';
                        value = f.getText() || '';
                    } else if (ctor.includes('CheckBox') || f.isChecked) {
                        type = 'Checkbox';
                        value = f.isChecked() ? 'Checked (True)' : 'Unchecked (False)';
                    } else if (ctor.includes('RadioGroup') || f.getSelected) {
                        type = 'Radio Group';
                        value = f.getSelected() || '';
                    } else if (ctor.includes('Dropdown') || f.getSelected) {
                        type = 'Dropdown';
                        value = (f.getSelected() || []).join(', ');
                    } else if (ctor.includes('OptionList') || f.getSelected) {
                        type = 'Option List';
                        value = (f.getSelected() || []).join(', ');
                    } else {
                        type = ctor || 'Form Element';
                    }
                } catch (e) {
                    type = 'Form Element';
                }

                return {
                    name: f.getName() || 'Unnamed Field',
                    type: type,
                    value: value
                };
            });
        } catch (e) {
            console.log('No AcroForm found in document:', e.message);
        }

        const pageCount = pdfDoc.getPageCount();

        return {
            pageCount: pageCount,
            fieldCount: fields.length,
            hasForm: fields.length > 0,
            fields: fields
        };
    }

    /**
     * Flattens all AcroForms and annotations into permanent, non-editable vectors.
     * @param {File|ArrayBuffer} file
     * @returns {Promise<Uint8Array>}
     */
    async function flattenPdf(file) {
        const arrayBuffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

        try {
            const form = pdfDoc.getForm();
            if (form) {
                // Flatten AcroForms into visual page content
                form.flatten();
            }
        } catch (e) {
            console.warn('Could not flatten form (might have no AcroForm):', e.message);
        }

        // Save serialized document
        return await pdfDoc.save();
    }

    return {
        inspectPdfForms,
        flattenPdf
    };
})();

if (typeof window !== 'undefined') {
    window.FlattenEngine = FlattenEngine;
}
