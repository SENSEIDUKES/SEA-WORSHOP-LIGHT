import React from 'react';
import SideDrawer from './SideDrawer';
import { SparklesIcon } from './Icons';
import { useLanguage } from '../localization';

interface InfoDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InfoDrawer({ isOpen, onClose }: InfoDrawerProps) {
    const { t } = useLanguage();

    return (
        <SideDrawer isOpen={isOpen} onClose={onClose} title={t('codex_title')}>
            <div className="space-y-6" style={{ color: 'var(--text-color)', fontFamily: 'Inter, sans-serif', padding: '8px 0' }}>
                {/* Intro Accent */}
                <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '24px'
                }}>
                    <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                        {t('codex_welcome')}
                    </p>
                </div>

                {/* Section 1: Dual Mode */}
                <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '20px' }}>⚡</span>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, letterSpacing: '-0.02em' }}>
                            {t('codex_secret_title')}
                        </h3>
                    </div>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        padding: '16px',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                            {t('codex_secret_desc1')}
                        </p>
                        <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                            {t('codex_secret_desc2')}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>{t('codex_universe_a')}</div>
                                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{t('codex_universe_a_desc')}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '11px', color: '#a78bfa', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>{t('codex_universe_b')}</div>
                                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{t('codex_universe_b_desc')}</div>
                            </div>
                        </div>
                        <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#34d399', fontSize: '12.5px', fontWeight: 600 }}>
                                <SparklesIcon /> {t('codex_fusion_title')}
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                                {t('codex_fusion_desc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Component Presets */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '20px' }}>🧬</span>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, letterSpacing: '-0.02em' }}>
                            {t('codex_presets_title')}
                        </h3>
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                        {t('codex_presets_desc')}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '10px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-color)', display: 'block', marginBottom: '4px' }}>
                                🎨 {t('codex_preset_free')}
                            </strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                {t('codex_preset_free_desc')}
                            </span>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '10px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-color)', display: 'block', marginBottom: '4px' }}>
                                ✨ {t('codex_preset_icon')}
                            </strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                {t('codex_preset_icon_desc')}
                            </span>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '10px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-color)', display: 'block', marginBottom: '4px' }}>
                                🎛️ {t('codex_preset_player')}
                            </strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                {t('codex_preset_player_desc')}
                            </span>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '10px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-color)', display: 'block', marginBottom: '4px' }}>
                                🧱 {t('codex_preset_plugin')}
                            </strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                {t('codex_preset_plugin_desc')}
                            </span>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '10px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-color)', display: 'block', marginBottom: '4px' }}>
                                🧬 {t('codex_preset_deco')}
                            </strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                {t('codex_preset_deco_desc')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer disclaimer */}
                <div style={{ textAlign: 'center', marginTop: '24px', opacity: 0.6 }}>
                    <p style={{ margin: 0, fontSize: '11px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                        {t('codex_footer')}
                    </p>
                </div>
            </div>
        </SideDrawer>
    );
}
