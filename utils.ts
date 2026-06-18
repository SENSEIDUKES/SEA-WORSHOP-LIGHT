/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import JSZip from 'jszip';

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const exportToZip = async (sourceHtml: string, name: string) => {
    let styles = '';
    let scripts = '';
    
    // Extract styles
    let htmlContent = sourceHtml.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, p1) => {
        styles += p1 + '\n';
        return '';
    });

    // Extract inline scripts
    htmlContent = htmlContent.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, content) => {
        if (/src\s*=/i.test(attrs)) {
            return match; // keep external scripts
        }
        scripts += content + '\n';
        return '';
    });

    // Inject links
    if (!/<html/i.test(htmlContent)) {
        htmlContent = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${name}</title>\n<link rel="stylesheet" href="styles.css">\n</head>\n<body>\n${htmlContent}\n<script src="script.js"></script>\n</body>\n</html>`;
    } else {
        htmlContent = htmlContent.replace(/<\/head>/i, '  <link rel="stylesheet" href="styles.css">\n</head>');
        htmlContent = htmlContent.replace(/<\/body>/i, '  <script src="script.js"></script>\n</body>');
    }

    const zip = new JSZip();
    zip.file('index.html', htmlContent);
    zip.file('styles.css', styles.trim());
    zip.file('script.js', scripts.trim());

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.zip`;
    a.click();
    URL.revokeObjectURL(url);
};

export const extractHtmlFromMarkdown = (text: string): string => {
    if (!text) return '';
    let cleanText = text.trim();
    const htmlMatch = cleanText.match(/```(?:html|xml)?\n([\s\S]*?)```/);
    if (htmlMatch) {
         return htmlMatch[1].trim();
    }
    // Fallback manual checks
    if (cleanText.startsWith('```html')) cleanText = cleanText.substring(7).trimStart();
    if (cleanText.startsWith('```')) cleanText = cleanText.substring(3).trimStart();
    if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3).trimEnd();
    return cleanText.trim();
};
