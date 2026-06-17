import React, { useState, useEffect } from 'react';
import SideDrawer from './SideDrawer';
import { SavedComponent, getAllSavedComponents, deleteComponent, toggleFavorite } from '../services/dbService';
import { TrashIcon, HeartIcon } from './Icons';

interface LibraryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectComponent: (component: SavedComponent) => void;
}

export default function LibraryDrawer({ isOpen, onClose, onSelectComponent }: LibraryDrawerProps) {
    const [components, setComponents] = useState<SavedComponent[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadComponents();
        }
    }, [isOpen]);

    const loadComponents = async () => {
        const data = await getAllSavedComponents();
        // Sort by favorite first, then timestamp descending
        data.sort((a, b) => {
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;
            return b.timestamp - a.timestamp;
        });
        setComponents(data);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteComponent(id);
        loadComponents();
    };

    const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await toggleFavorite(id);
        loadComponents();
    };

    return (
        <SideDrawer isOpen={isOpen} onClose={onClose} title="Library">
            <div className="library-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', padding: '16px 0' }}>
                {components.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No saved components yet.</p>
                ) : (
                    components.map(comp => (
                        <div key={comp.id} className="library-card" onClick={() => onSelectComponent(comp)} style={{ cursor: 'pointer', background: 'var(--surface-color)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                            <div className="library-card-thumbnail" style={{ height: '140px', background: 'var(--background-color)', position: 'relative' }}>
                                {comp.thumbnail ? (
                                    <img src={comp.thumbnail} alt={comp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>No Preview</div>
                                )}
                                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                                    <button onClick={(e) => handleToggleFavorite(e, comp.id)} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '4px', padding: '4px', color: comp.favorite ? '#ef4444' : 'white', cursor: 'pointer' }}>
                                        <HeartIcon filled={comp.favorite} />
                                    </button>
                                    <button onClick={(e) => handleDelete(e, comp.id)} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '4px', padding: '4px', color: 'white', cursor: 'pointer' }}>
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            <div className="library-card-info" style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{comp.name}</h4>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{comp.prompt}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </SideDrawer>
    );
}
