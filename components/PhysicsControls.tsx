import React from 'react';
import { Settings2, RotateCcw } from 'lucide-react';

export interface PhysicsConfig {
    REPULSION: number;
    SPRING_LENGTH: number;
    STIFFNESS: number;
    DAMPING: number;
    CENTER_GRAVITY: number;
}

interface PhysicsControlsProps {
    config: PhysicsConfig;
    onChange: (newConfig: PhysicsConfig) => void;
    onReset: () => void;
}

export const PhysicsControls: React.FC<PhysicsControlsProps> = ({ config, onChange, onReset }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleChange = (key: keyof PhysicsConfig, value: number) => {
        onChange({ ...config, [key]: value });
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="p-3 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full border border-white/10 transition-colors shadow-lg group"
                title="Physics Engine Settings"
            >
                <Settings2 className="w-5 h-5 text-white/50 group-hover:text-teal-200" />
            </button>
        );
    }

    return (
        <div className="bg-[#0a1014]/90 backdrop-blur-xl border border-teal-500/30 p-5 rounded-2xl w-72 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-2">
                    <Settings2 size={12} /> Physics Engine
                </h3>
                <div className="flex gap-2">
                    <button onClick={onReset} className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors" title="Reset Defaults">
                        <RotateCcw size={12} />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white text-lg leading-none">&times;</button>
                </div>
            </div>

            <div className="space-y-4">
                {/* Repulsion */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/60">
                        <span>Repulsion (Push)</span>
                        <span>{config.REPULSION}</span>
                    </div>
                    <input 
                        type="range" min="100" max="3000" step="50"
                        value={config.REPULSION}
                        onChange={(e) => handleChange('REPULSION', Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-teal-500/30 accent-teal-400"
                    />
                </div>

                {/* Spring Length */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/60">
                        <span>Spring Length (Target Dist)</span>
                        <span>{config.SPRING_LENGTH}px</span>
                    </div>
                    <input 
                        type="range" min="0" max="200" step="5"
                        value={config.SPRING_LENGTH}
                        onChange={(e) => handleChange('SPRING_LENGTH', Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-teal-500/30 accent-teal-400"
                    />
                </div>

                {/* Stiffness */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/60">
                        <span>Stiffness (Bond Strength)</span>
                        <span>{config.STIFFNESS.toFixed(3)}</span>
                    </div>
                    <input 
                        type="range" min="0.001" max="0.2" step="0.001"
                        value={config.STIFFNESS}
                        onChange={(e) => handleChange('STIFFNESS', Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-teal-500/30 accent-teal-400"
                    />
                </div>

                {/* Center Gravity */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/60">
                        <span>Center Gravity (Anchor)</span>
                        <span>{config.CENTER_GRAVITY.toFixed(5)}</span>
                    </div>
                    <input 
                        type="range" min="0" max="0.005" step="0.0001"
                        value={config.CENTER_GRAVITY}
                        onChange={(e) => handleChange('CENTER_GRAVITY', Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-teal-500/30 accent-teal-400"
                    />
                </div>
                 
                 {/* Damping */}
                 <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/60">
                        <span>Damping (Friction)</span>
                        <span>{config.DAMPING.toFixed(2)}</span>
                    </div>
                    <input 
                        type="range" min="0.1" max="0.99" step="0.01"
                        value={config.DAMPING}
                        onChange={(e) => handleChange('DAMPING', Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-teal-500/30 accent-teal-400"
                    />
                </div>
            </div>
        </div>
    );
};