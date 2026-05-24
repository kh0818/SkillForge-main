import { FIELD_CATEGORIES, FIELD_THEMES, GALAXY_CENTER, getFieldSystemCenter, getSkillOrbitRadius } from '../utils/galaxyLayout';

export default function GalaxyBackgroundNode() {
  return (
    <div className="pointer-events-none select-none" style={{ transform: 'translate(-50%, -50%)' }}>
      <svg width="5600" height="4600" viewBox="0 0 5600 4600" className="overflow-visible">
        <defs>
          <radialGradient id="galaxy-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
            <stop offset="42%" stopColor="#1e1b4b" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
          <filter id="soft-star-glow">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <rect width="5600" height="4600" fill="url(#galaxy-core-glow)" opacity="0.8" />
        <circle cx={GALAXY_CENTER.x} cy={GALAXY_CENTER.y} r={360} fill="none" stroke="#38bdf8" strokeWidth="1.2" opacity="0.2" />
        <circle cx={GALAXY_CENTER.x} cy={GALAXY_CENTER.y} r={520} fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 16" opacity="0.16" />
        <circle cx={GALAXY_CENTER.x} cy={GALAXY_CENTER.y} r={2460} fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="6 18" opacity="0.12" />
        <circle cx={GALAXY_CENTER.x} cy={GALAXY_CENTER.y} r={2840} fill="none" stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="8 20" opacity="0.08" />

        {[...Array(56)].map((_, index) => {
          const x = (index * 97) % 5400 + 80;
          const y = (index * 211) % 4300 + 110;
          const opacity = 0.14 + ((index % 5) * 0.03);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={index % 8 === 0 ? 2.2 : 1}
              fill="#e0f2fe"
              opacity={opacity}
              filter={index % 8 === 0 ? 'url(#soft-star-glow)' : undefined}
            />
          );
        })}

        {FIELD_CATEGORIES.map((category) => {
          const center = getFieldSystemCenter(category);
          const theme = FIELD_THEMES[category];
          return (
            <g key={category}>
              {[1, 2, 3].map((level) => {
                const radius = getSkillOrbitRadius(level as 1 | 2 | 3);
                return (
                  <circle
                    key={level}
                    cx={center.x}
                    cy={center.y}
                    r={radius}
                    fill="none"
                    stroke={theme.color}
                    strokeWidth={level === 1 ? 1.1 : 0.9}
                    strokeDasharray={level === 1 ? '5 9' : '2 10'}
                    opacity={category === 'Universal' ? 0.22 : 0.14}
                    className="galaxy-orbit-ring"
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
