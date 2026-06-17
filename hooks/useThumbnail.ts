import { useState, useEffect } from 'react';
import { generateThumbnail } from '../services/screenshotService';

// Global cache to prevent re-generating screenshots for the same html
const thumbnailCache = new Map<string, string>();

export function useThumbnail(html: string, status: string) {
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (status !== 'complete' || !html) return;
        
        let isActive = true;
        // Simple hash-like identifier for caching
        // Use a subset of HTML length + a snippet to uniquely identify it without heavy hashing
        const id = `${html.length}-${html.substring(Math.floor(html.length/2), Math.floor(html.length/2) + 50)}`; 
        
        if (thumbnailCache.has(id)) {
            setThumbnail(thumbnailCache.get(id)!);
            return;
        }

        setIsGenerating(true);
        // Delay generation slightly to avoid blocking UI immediately after render
        const timer = setTimeout(() => {
            generateThumbnail(html, 800, 600).then(dataUrl => {
                if (dataUrl) {
                    thumbnailCache.set(id, dataUrl);
                    if (isActive) {
                        setThumbnail(dataUrl);
                        setIsGenerating(false);
                    }
                } else if (isActive) {
                    setIsGenerating(false);
                }
            });
        }, 1200);
        
        return () => {
            isActive = false;
            clearTimeout(timer);
        };
    }, [html, status]);
    
    return { thumbnail, isGenerating };
}
