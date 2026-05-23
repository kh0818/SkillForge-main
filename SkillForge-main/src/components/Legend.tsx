import { CheckCircle, Link, BookOpen, Lock } from 'lucide-react';

export default function Legend() {
  const items = [
    { icon: <Lock size={12} className="text-gray-500" />, label: 'Locked', color: 'text-gray-500' },
    { icon: <BookOpen size={12} className="text-green-400" />, label: 'Self-declared', color: 'text-green-400' },
    { icon: <Link size={12} className="text-green-300" />, label: 'Evidenced', color: 'text-green-300' },
    { icon: <CheckCircle size={12} className="text-yellow-400" />, label: 'Verified', color: 'text-yellow-400' },
  ];

  const categories = [
    { name: 'Tech', color: '#3b82f6' },
    { name: 'Business', color: '#f59e0b' },
    { name: 'Communication', color: '#10b981' },
  ];

  return (
    <div className="absolute bottom-6 left-6 z-10 bg-gray-900/90 border border-gray-700 rounded-2xl p-4 backdrop-blur-sm">
      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 font-semibold">Legend</p>

      <div className="space-y-1.5 mb-4">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            {item.icon}
            <span className={`text-xs ${item.color}`}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-700 pt-3 space-y-1.5">
        {categories.map(cat => (
          <div key={cat.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color, boxShadow: `0 0 6px ${cat.color}` }} />
            <span className="text-xs text-gray-400">{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
