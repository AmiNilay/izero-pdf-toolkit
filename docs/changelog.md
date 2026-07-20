# Changelog

All notable changes to the Offline PDF Toolkit will be documented in this file.

## [1.0.0] - 2024-01-15

### Added
- Initial release of Offline PDF Toolkit
- PDF to Images conversion with DPI options
- Images to PDF conversion with page size options
- Interactive crop tool with grid and aspect lock
- Image resize tool with maintain aspect ratio
- PDF merge with page numbering
- PDF split with multiple methods
- PDF rotation with individual page control
- Image extraction from PDFs
- Full offline support via Service Worker
- PWA manifest for installability
- Dark mode toggle
- Drag and drop support for all tools
- ZIP file downloads for multiple files
- Toast notifications for user feedback
- Progress indicators for long operations

### Technical
- Built with vanilla JavaScript
- PDF.js for PDF rendering
- jsPDF for PDF generation
- pdf-lib for PDF manipulation
- FileSaver.js for file downloads
- JSZip for ZIP file creation

### Performance
- Optimized image processing with canvas
- Memory cleanup after operations
- Lazy loading of tools
- Service Worker caching strategy

## [0.9.0] - 2024-01-01

### Added
- Beta release of core tools
- Basic PDF to Images conversion
- Basic Images to PDF conversion
- Simple crop tool
- Simple resize tool

### Known Issues
- Memory leaks on large file processing
- Some PDFs fail to load
- Mobile UI issues

## Future Plans

### [1.1.0] - Planned
- PDF to Word conversion
- OCR text extraction
- Batch processing improvements
- More image filters

### [1.2.0] - Planned
- PDF form filling
- Digital signatures
- Collaborative features
- More export formats

### [2.0.0] - Roadmap
- AI-powered features
- Document comparison
- Advanced editing
- Cloud sync (optional)