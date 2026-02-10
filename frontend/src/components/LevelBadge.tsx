interface LevelBadgeProps {
    level: number;
    className?: string;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({ level, className = "" }) => {
    const levels = [
        { name: '青铜', color: 'bg-orange-600', icon: '🥉' },
        { name: '白银', color: 'bg-slate-400', icon: '🥈' },
        { name: '黄金', color: 'bg-yellow-500', icon: '🥇' },
        { name: '至尊', color: 'bg-purple-600 animate-pulse', icon: '👑' },
    ];

    const idx = Math.max(0, Math.min(level - 1, levels.length - 1));
    const { name, color, icon } = levels[idx];

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-sm ${color} ${className}`}>
            <span className="mr-1">{icon}</span>
            {name}
        </span>
    );
};

export default LevelBadge;
