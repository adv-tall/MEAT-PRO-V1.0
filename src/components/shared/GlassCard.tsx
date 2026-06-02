import React from 'react';
interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = true }) => {
    const glassWhite = 'rgba(255, 255, 255, 0.90)';
    return (
        <div 
            className={`rounded-3xl p-6 backdrop-blur-xl shadow-soft border border-white/80 ${hoverEffect ? 'hover:-translate-y-1 transition-transform duration-300' : ''} ${className}`}
            style={{ backgroundColor: glassWhite }}
        >
            {children}
        </div>
    );
};

export default GlassCard;
