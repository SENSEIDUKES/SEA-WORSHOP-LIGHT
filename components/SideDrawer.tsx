/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface SideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children?: React.ReactNode;
    isWide?: boolean;
}

const SideDrawer = ({ isOpen, onClose, title, children, isWide = false }: SideDrawerProps) => {
    if (!isOpen) return null;

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div 
                className="drawer-content" 
                onClick={(e) => e.stopPropagation()}
                style={isWide ? { maxWidth: '850px', width: '90vw' } : undefined}
            >
                <div className="drawer-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="drawer-body" style={isWide ? { padding: '16px' } : undefined}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default SideDrawer;