import { useState, useEffect } from 'react';

// Global cache to prevent re-generating screenshots for the same html
export const thumbnailCache = new Map<string, string>();

export const getThumbnailId = (html: string) => {
    if (!html) return '';
    return `${html.length}-${html.substring(Math.floor(html.length/2), Math.floor(html.length/2) + 50)}`;
};

export function useThumbnail(html: string, status: string) {
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!html) {
            setThumbnail(null);
            return;
        }
        
        const id = getThumbnailId(html);
        if (thumbnailCache.has(id)) {
            setThumbnail(thumbnailCache.get(id)!);
        } else {
            setThumbnail(null);
        }
    }, [html]);

    useEffect(() => {
        if (!html) return;
        const id = getThumbnailId(html);

        const handleThumbnailGenerated = (e: Event) => {
            const customEvent = e as CustomEvent<{ id: string; dataUrl: string }>;
            if (customEvent.detail && customEvent.detail.id === id) {
                setThumbnail(customEvent.detail.dataUrl);
            }
        };

        window.addEventListener('thumbnail_generated', handleThumbnailGenerated);
        return () => {
            window.removeEventListener('thumbnail_generated', handleThumbnailGenerated);
        };
    }, [html]);
    
    return { thumbnail, isGenerating };
}
