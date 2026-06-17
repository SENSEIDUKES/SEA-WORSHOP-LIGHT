import { useState, useEffect } from 'react';
import { generateThumbnail } from '../services/screenshotService';

// Global cache to prevent re-generating screenshots for the same html
export const thumbnailCache = new Map<string, string>();

export const getThumbnailId = (html: string) => {
    return `${html.length}-${html.substring(Math.floor(html.length/2), Math.floor(html.length/2) + 50)}`;
};

export function useThumbnail(html: string, status: string) {
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (status !== 'complete' || !html) return;
        
        let isActive = true;
        // Simple hash-like identifier for caching
        const id = getThumbnailId(html); 
        
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
