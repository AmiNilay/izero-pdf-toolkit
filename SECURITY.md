# Security Policy

iZeroPDF takes user privacy, client-side data isolation, and software security very seriously.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.1.x   | :white_check_mark: Supported (Current - Swiss Minimalist) |
| 2.0.x   | :white_check_mark: Supported |
| < 2.0   | :x: Unsupported |

---

## Core Security & Privacy Guarantees

1. **100% Client-Side Processing**: All PDF, image, and data manipulation occurs strictly within your browser's local sandbox memory using client-side JavaScript (`pdf-lib-with-encrypt`, `pdf.js`, `jspdf`, `JSZip`, Canvas API).
2. **Zero Uploads & Network Isolation**: Your files never leave your device. No document, image, or intermediate buffer is ever transmitted over the network or saved to any remote server.
3. **No Tracking or Third-Party Analytics**: iZeroPDF contains zero analytics trackers, telemetry libraries, advertising beacons, or third-party cookies.
4. **Input Sanitization**: User file names and metadata are strictly sanitized and HTML-entity escaped (`FileHelpers.escapeHtml()`) prior to DOM insertion, mitigating client-side DOM XSS.
5. **Secure Local Caching**: Offline storage and conversion history are opt-in and controlled via explicit user consent. No sensitive file contents are stored in permanent cache.

---

## Reporting a Vulnerability

If you discover a security vulnerability or privacy bug, please help us resolve it quickly and responsibly:

1. **DO NOT** disclose the vulnerability publicly in an open GitHub issue.
2. Submit a report via GitHub Private Security Advisories:
   - [Report Security Advisory](https://github.com/AmiNilay/izero-pdf-toolkit/security/advisories/new)
3. Or contact the maintainer directly:
   - **GitHub**: [@AmiNilay](https://github.com/AmiNilay)
   - **LinkedIn**: [Nilay Naha](https://www.linkedin.com/in/nilay-naha/)
4. Please provide:
   - Clear description of the vulnerability.
   - Minimal reproducible proof-of-concept steps.
   - Affected browser(s) and operating system.
5. You will receive an initial response within 48 hours.

---

## Responsible Disclosure

We appreciate responsible security research. Please allow a reasonable timeline for patch verification and deployment prior to any public disclosure.
