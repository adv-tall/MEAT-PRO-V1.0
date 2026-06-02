import React from 'react';
import * as Icons from 'lucide-react';

interface KpiCardProps {
    title?: string;
    label?: string; // Alias for backward compatibility
    value: string | number | React.ReactNode;
    color?: string;
    colorAccent?: string; // Overrides color
    colorValue?: string;
    icon: any; // Can be string or component
    description?: string;
    subLabel?: string; // Alias for backward compatibility
    desc?: string; // Alias for backward compatibility
}

const kebabToPascal = (str: string) => str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');

const IconWrapper = ({ name, size = 16, className = "", color, style, strokeWidth = 2.5 }: any) => {
    if (!name) return null;
    if (typeof name !== 'string') {
        const IconComponent = name;
        return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={strokeWidth} />;
    }
    const pascalName = kebabToPascal(name);
    const IconComponent = (Icons as any)[pascalName] || Icons.CircleHelp;
    if (!IconComponent) return null;
    return <IconComponent size={size} className={className} style={{...style, color: color}} strokeWidth={strokeWidth} />;
};

const KpiCard: React.FC<KpiCardProps> = ({ 
    title, 
    label, 
    value, 
    color, 
    colorAccent,
    colorValue,
    icon, 
    description, 
    subLabel,
    desc
}) => {
    const displayLabel = title || label || '';
    const displayDesc = description || subLabel || desc || '';
    const accent = colorAccent || color || '#b7a159'; // Default gold accent
    const valColor = colorValue || '#212c46';

    const getAlphaColor = (hex: string, alpha: string) => {
        if (!hex) return 'transparent';
        if (hex.startsWith('#')) {
            return `${hex}${alpha}`;
        }
        return hex;
    };

    return (
        <div className="bg-white/90 px-6 py-6 rounded-2xl border border-[#eaeaec] shadow-sm flex-1 min-w-[200px] relative overflow-hidden group hover:border-[#b7a159] transition-all min-h-[120px] flex flex-col justify-between animate-fadeIn">
            <div className="absolute -right-4 -bottom-6 opacity-[0.05] transform group-hover:scale-110 transition-transform duration-700 pointer-events-none z-0">
                <IconWrapper name={icon} size={110} color={accent} />
            </div>
            
            <div className="relative z-10 flex justify-between items-start w-full">
                <p className="text-[11px] font-bold text-[#7a8b95] uppercase tracking-[0.1em] drop-shadow-sm">{displayLabel}</p>
                <div 
                    className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:rotate-6" 
                    style={{backgroundColor: getAlphaColor(accent, '15'), borderColor: getAlphaColor(accent, '25'), color: accent}}
                >
                    <IconWrapper name={icon} size={20} />
                </div>
            </div>
            
            <div className="relative z-10 mt-2 flex items-end justify-between">
                <div className="text-[28px] font-black leading-none text-[#212c46]" style={{color: valColor}}>
                    {value}
                </div>
                {displayDesc && (
                    <span className="text-[11px] font-bold text-[#4d87a8] uppercase tracking-widest flex items-center gap-1 max-w-[50%] truncate text-right justify-end whitespace-nowrap">
                        <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-current animate-pulse"></span> {displayDesc}
                    </span>
                )}
            </div>
        </div>
    );
};

export default KpiCard;

