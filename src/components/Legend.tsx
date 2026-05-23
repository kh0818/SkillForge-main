import { useState } from 'react';
import { CheckCircle, Link, BookOpen, Lock, ChevronDown, ChevronUp } from 'lucide-react';

export default function Legend() {
  const [collapsed, setCollapsed] = useState(false);

  const items = [
    { icon: <Lock size={10} className="text-gray-500 shrink-0" />, label: 'Locked', color: 'text-gray-500' },
    { icon: <BookOpen size={10} className="text-green-400 shrink-0" />, label: 'Declared', color: 'text-green-400' },
    { icon: <Link size={10} className="text-green-300 shrink-0" />, label: 'Evidenced', color: 'text-green-300' },
    { icon: <CheckCircle size={10} className="text-yellow-400 shrink-0" />, label: 'Verified', color: 'text-yellow-400' },
  ];

  const categories = [
    { name: 'Universal', color: '#22d3ee' },
    { name: 'Engineering and Tech', color: '#3b82f6' },
    { name: 'Business and Finance', color: '#f59e0b' },
    { name: 'Medicine and Health', color: '#22c55e' },
    { name: 'Creative and Design', color: '#a855f7' },
    { name: 'Sciences and Research', color: '#06b6d4' },
    { name: 'Education and Social Sciences', color: '#f97316' },
  ];

  return (
    <div className="bg-gray-900/90 border border-gray-700 rounded-xl p-2 backdrop-blur-sm w-48">
      <div className="flex items-center justify-between gap-1 mb-1">
        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Legend</p>
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="p-0.5 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          aria-label={collapsed ? 'Expand legend' : 'Collapse legend'}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-2 pb-2 border-b border-gray-700/80">
            {items.map(item => (
              <div key={item.label} className="flex items-center gap-1 min-w-0">
                {item.icon}
                <span className={`text-[9px] truncate ${item.color}`}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {categories.map(cat => (
              <div key={cat.name} className="flex items-center gap-1 min-w-0" title={cat.name}>
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: cat.color, boxShadow: `0 0 4px ${cat.color}` }}
                />
                <span className="text-[9px] text-gray-400 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
