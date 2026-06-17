import html2canvas from 'html2canvas';

export const generateThumbnail = async (html: string, width = 800, height = 600): Promise<string> => {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.zIndex = '-9999';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        iframe.style.width = width + 'px';
        iframe.style.height = height + 'px';
        iframe.sandbox = 'allow-scripts allow-same-origin';
        
        document.body.appendChild(iframe);
        
        iframe.onload = async () => {
            try {
                // Wait for any framework/fonts inside the iframe to render
                await new Promise(r => setTimeout(r, 800));
                
                const frameDocument = iframe.contentDocument || iframe.contentWindow?.document;
                if (!frameDocument) {
                    throw new Error('No frame document available');
                }
                
                const canvas = await html2canvas(frameDocument.body, {
                    width: width,
                    height: height,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff'
                });
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataUrl);
            } catch (err) {
                console.error('Screenshot generation failed:', err);
                resolve('');
            } finally {
                document.body.removeChild(iframe);
            }
        };
        
        iframe.srcdoc = html;
    });
};
