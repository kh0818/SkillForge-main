import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SKILLS, JOBS } from '../data/mockData';
import SkillNode from '../components/SkillNode';
import JobNode from '../components/JobNode';
import Legend from '../components/Legend';

const nodeTypes = {
  skillNode: SkillNode,
  jobNode: JobNode,
};

// ──────────────────────────────────────────────
// Layout constants
// ──────────────────────────────────────────────
const COL_X: Record<string, number> = {
  Tech: 120,
  Business: 560,
  Communication: 1000,
};
const LEVEL_Y: Record<number, number> = { 1: 80, 2: 280, 3: 480 };
const JOB_Y = 720;
const JOB_POSITIONS = [220, 560, 900];

// ──────────────────────────────────────────────
// Edge styling helpers
// ──────────────────────────────────────────────
const acquiredStatuses = new Set(['self-declared', 'evidenced', 'verified']);

function buildEdges(): Edge[] {
  const edges: Edge[] = [];

  // Skill -> skill within same category (level 1 -> 2 -> 3)
  const byCategory: Record<string, typeof SKILLS> = {};
  for (const s of SKILLS) {
    (byCategory[s.category] ??= []).push(s);
  }
  for (const [, catSkills] of Object.entries(byCategory)) {
    const sorted = [...catSkills].sort((a, b) => a.level - b.level);
    for (let i = 0; i < sorted.length - 1; i++) {
      const src = sorted[i];
      const tgt = sorted[i + 1];
      const active = acquiredStatuses.has(src.status);
      edges.push({
        id: `e-${src.id}-${tgt.id}`,
        source: src.id,
        target: tgt.id,
        animated: active,
        style: {
          stroke: active ? '#22c55e' : '#374151',
          strokeWidth: active ? 2 : 1,
          opacity: active ? 0.8 : 0.4,
        },
      });
    }
  }

  // Skill -> job edges
  JOBS.forEach(job => {
    job.requiredSkillIds.forEach(skillId => {
      const skill = SKILLS.find(s => s.id === skillId);
      const active = skill ? acquiredStatuses.has(skill.status) : false;
      edges.push({
        id: `e-${skillId}-${job.id}`,
        source: skillId,
        target: job.id,
        animated: active,
        style: {
          stroke: active ? '#22d3ee' : '#374151',
          strokeWidth: active ? 1.5 : 1,
          strokeDasharray: active ? undefined : '4 4',
          opacity: active ? 0.7 : 0.3,
        },
      });
    });
  });

  return edges;
}

export default function SkillTree() {
  const nodes = useMemo<Node[]>(() => {
    const skillNodes: Node[] = SKILLS.map(skill => ({
      id: skill.id,
      type: 'skillNode',
      position: {
        x: COL_X[skill.category],
        y: LEVEL_Y[skill.level],
      },
      data: { skill },
      draggable: true,
    }));

    const jobNodes: Node[] = JOBS.map((job, i) => ({
      id: job.id,
      type: 'jobNode',
      position: { x: JOB_POSITIONS[i], y: JOB_Y },
      data: { job, skills: SKILLS },
      draggable: true,
    }));

    return [...skillNodes, ...jobNodes];
  }, []);

  const edges = useMemo(() => buildEdges(), []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    // Future: open skill detail / dungeon quiz
    console.log('Node clicked:', node.id);
  }, []);

  return (
    <div className="w-full h-screen bg-gray-950 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-8 pt-6 pb-4 bg-gradient-to-b from-gray-950 via-gray-950/90 to-transparent pointer-events-none">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              </div>
              <span className="text-cyan-400 font-bold text-lg tracking-tight">SkillForge</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Your Skill Tree</h1>
            <p className="text-sm text-gray-500 mt-0.5">Build skills. Unlock roles. Level up your career.</p>
          </div>

          <div className="flex gap-4 pointer-events-auto">
            {[
              { label: 'Skills Acquired', value: SKILLS.filter(s => s.status !== 'locked').length, total: SKILLS.length, color: 'text-green-400' },
              { label: 'Verified', value: SKILLS.filter(s => s.status === 'verified').length, total: SKILLS.length, color: 'text-yellow-400' },
              { label: 'Jobs Unlocked', value: JOBS.filter(j => j.requiredSkillIds.every(id => SKILLS.find(s => s.id === id)?.status !== 'locked')).length, total: JOBS.length, color: 'text-cyan-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-2.5 backdrop-blur-sm text-center">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}<span className="text-gray-600 text-sm">/{stat.total}</span></p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category labels */}
      <div className="absolute top-32 left-0 right-0 z-10 flex pointer-events-none px-6">
        {[
          { label: 'Tech', x: COL_X.Tech + 68, color: '#3b82f6' },
          { label: 'Business', x: COL_X.Business + 68, color: '#f59e0b' },
          { label: 'Communication', x: COL_X.Communication + 68, color: '#10b981' },
        ].map(cat => (
          <div
            key={cat.label}
            className="absolute"
            style={{ left: cat.x, transform: 'translateX(-50%)' }}
          >
            <div
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border"
              style={{
                color: cat.color,
                borderColor: `${cat.color}44`,
                background: `${cat.color}11`,
                boxShadow: `0 0 12px ${cat.color}22`,
              }}
            >
              {cat.label}
            </div>
          </div>
        ))}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.8}
        defaultViewport={{ x: 0, y: 80, zoom: 0.75 }}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1f2937"
        />
        <Controls
          style={{
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: 12,
          }}
        />
        <MiniMap
          style={{
            background: '#0f172a',
            border: '1px solid #374151',
            borderRadius: 12,
          }}
          nodeColor={(node) => {
            if (node.type === 'jobNode') return '#22d3ee33';
            const skill = SKILLS.find(s => s.id === node.id);
            if (!skill || skill.status === 'locked') return '#374151';
            if (skill.status === 'verified') return '#facc15';
            return '#22c55e';
          }}
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>

      <Legend />
    </div>
  );
}
