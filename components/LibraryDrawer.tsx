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
    const [activeTab, setActiveTab] = useState<'all' | 'pinned'>('all');
    const [searchQuery, setSearchQuery] = useState('');

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

    // Derived counts
    const allCount = components.length;
    const pinnedCount = components.filter(c => c.favorite).length;

    // Filtered components
    const filteredComponents = components.filter(comp => {
        // Tab filter
        if (activeTab === 'pinned' && !comp.favorite) return false;
        
        // Search filter
        if (searchQuery.trim() === '') return true;
        const query = searchQuery.toLowerCase();
        return (
            comp.name.toLowerCase().includes(query) || 
            comp.prompt.toLowerCase().includes(query) ||
            comp.preset.toLowerCase().includes(query)
        );
    });

    return (
        <SideDrawer isOpen={isOpen} onClose={onClose} title="Library">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0', fontFamily: 'Rubik, sans-serif' }}>
                
                {/* Search Bar */}
                <div style={{ position: 'relative', width: '100%' }}>
                    <input 
                        type="text"
                        placeholder="Search by name, prompt or preset..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            background: '#111',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            paddingRight: searchQuery ? '36px' : '14px',
                            color: '#FAFAFA',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                        }}
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.4)',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Navigation Tabs */}
                <div style={{ 
                    display: 'flex', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    gap: '20px',
                    paddingBottom: '2px'
                }}>
                    <button 
                        onClick={() => setActiveTab('all')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: activeTab === 'all' ? '#04ACFF' : 'rgba(255, 255, 255, 0.5)',
                            padding: '8px 4px',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'color 0.2s'
                        }}
                    >
                        <span>All Components</span>
                        <span style={{ 
                            fontSize: '11px', 
                            background: activeTab === 'all' ? '#04ACFF' : 'rgba(255, 255, 255, 0.1)',
                            color: activeTab === 'all' ? '#000000' : 'rgba(255, 255, 255, 0.6)',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontWeight: 600
                        }}>
                            {allCount}
                        </span>
                        {activeTab === 'all' && (
                            <div style={{ position: 'absolute', bottom: '-2px', left: 0, right: 0, height: '2px', background: '#04ACFF' }} />
                        )}
                    </button>

                    <button 
                        onClick={() => setActiveTab('pinned')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: activeTab === 'pinned' ? '#04ACFF' : 'rgba(255, 255, 255, 0.5)',
                            padding: '8px 4px',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'color 0.2s'
                        }}
                    >
                        <span>Pinned UI Kit</span>
                        <span style={{ 
                            fontSize: '11px', 
                            background: activeTab === 'pinned' ? '#04ACFF' : 'rgba(255, 255, 255, 0.1)',
                            color: activeTab === 'pinned' ? '#000000' : 'rgba(255, 255, 255, 0.6)',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontWeight: 600
                        }}>
                            {pinnedCount}
                        </span>
                        {activeTab === 'pinned' && (
                            <div style={{ position: 'absolute', bottom: '-2px', left: 0, right: 0, height: '2px', background: '#04ACFF' }} />
                        )}
                    </button>
                </div>

                {/* Library Components Grid */}
                <div className="library-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {filteredComponents.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', padding: '40px 0', textAlign: 'center' }}>
                            <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '14px', margin: 0 }}>
                                {activeTab === 'pinned' 
                                    ? "No pinned components matching your criteria." 
                                    : "No saved components matching your criteria."}
                            </p>
                        </div>
                    ) : (
                        filteredComponents.map(comp => (
                            <div 
                                key={comp.id} 
                                className="library-card" 
                                onClick={() => onSelectComponent(comp)} 
                                style={{ 
                                    cursor: 'pointer', 
                                    background: 'rgba(255, 255, 255, 0.03)', 
                                    borderRadius: '12px', 
                                    overflow: 'hidden', 
                                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, border-color 0.2s',
                                }}
                            >
                                <div className="library-card-thumbnail" style={{ height: '140px', background: '#000', position: 'relative' }}>
                                    {comp.thumbnail ? (
                                        <img src={comp.thumbnail} alt={comp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                                    ) : (
                                        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255, 255, 255, 0.3)', fontSize: '12px' }}>
                                            No Preview AVAILABLE
                                        </div>
                                    )}
                                    <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                                        <button 
                                            onClick={(e) => handleToggleFavorite(e, comp.id)} 
                                            style={{ 
                                                background: 'rgba(0,0,0,0.7)', 
                                                border: '1px solid rgba(255, 255, 255, 0.1)', 
                                                borderRadius: '6px', 
                                                padding: '5px', 
                                                color: comp.favorite ? '#ef4444' : 'rgba(255,255,255,0.8)', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'color 0.2s, background 0.2s'
                                            }}
                                            title={comp.favorite ? "Unpin component" : "Pin component"}
                                        >
                                            <HeartIcon filled={comp.favorite} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(e, comp.id)} 
                                            style={{ 
                                                background: 'rgba(0,0,0,0.7)', 
                                                border: '1px solid rgba(255, 255, 255, 0.1)', 
                                                borderRadius: '6px', 
                                                padding: '5px', 
                                                color: 'rgba(255,255,255,0.8)', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'color 0.2s, background 0.2s'
                                            }}
                                            title="Delete component"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                    <div style={{ 
                                        position: 'absolute', 
                                        bottom: '8px', 
                                        left: '8px', 
                                        background: 'rgba(0,0,0,0.7)', 
                                        padding: '2px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '10px', 
                                        color: '#04ACFF', 
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {comp.preset}
                                    </div>
                                </div>
                                <div className="library-card-info" style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <h4 style={{ 
                                        margin: '0', 
                                        fontSize: '13px', 
                                        fontWeight: 600, 
                                        color: '#FAFAFA', 
                                        whiteSpace: 'nowrap', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis' 
                                    }}>
                                        {comp.name}
                                    </h4>
                                    <p style={{ 
                                        margin: 0, 
                                        fontSize: '11px', 
                                        color: 'rgba(255, 255, 255, 0.4)', 
                                        display: '-webkit-box', 
                                        WebkitLineClamp: 2, 
                                        WebkitBoxOrient: 'vertical', 
                                        overflow: 'hidden',
                                        lineHeight: '1.4'
                                    }}>
                                        {comp.prompt}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </SideDrawer>
    );
}
