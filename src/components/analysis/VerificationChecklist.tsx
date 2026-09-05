import { useState } from 'react';
import { CheckSquare, Square, ShieldAlert, FileCheck2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { cn } from '../lib/utils';
import type { AnalysisResult } from '../../types/analysis';

interface VerificationChecklistProps {
  result: AnalysisResult;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'source' | 'visual' | 'metadata' | 'editorial';
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  {
    id: 'reverse-search',
    title: 'Perform Reverse Media Search',
    description: 'Query Google Images, TinEye, or Yandex to locate the earliest known publication of this visual.',
    category: 'source',
  },
  {
    id: 'source-provenance',
    title: 'Identify Primary Origin',
    description: 'Distinguish user-provided claims from independently verified institutional origins.',
    category: 'source',
  },
  {
    id: 'visual-coherence',
    title: 'Inspect Visual Artifacts & Lighting',
    description: 'Check background continuity, shadows, hair boundaries, and hand/ear geometry for diffusion anomalies.',
    category: 'visual',
  },
  {
    id: 'metadata-check',
    title: 'Examine Technical Metadata & Provenance',
    description: 'Verify EXIF timestamps, camera hardware profiles, or C2PA manifest signatures if present.',
    category: 'metadata',
  },
  {
    id: 'editorial-judgment',
    title: 'Editorial & Context Verification',
    description: 'Corroborate date, weather, geopolitical context, and speaker statements against independent wire reports.',
    category: 'editorial',
  },
];

export function VerificationChecklist({ result }: VerificationChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalCount = DEFAULT_ITEMS.length;
  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
            <FileCheck2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Forensic Verification Checklist</h3>
            <p className="text-xs text-slate-500">
              Interactive workflow for journalists & intelligence analysts
            </p>
          </div>
        </div>

        <Badge
          variant={completedCount === totalCount ? 'green' : completedCount > 0 ? 'cyan' : 'ghost'}
          size="md"
        >
          {completedCount} / {totalCount} completed ({progressPercent}%)
        </Badge>
      </div>

      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        Automated AI detection provides probabilistic assessments only. Complete these recommended journalistic due diligence steps before trusting or disseminating media.
      </p>

      {/* Checklist items */}
      <div className="space-y-2.5" role="list">
        {DEFAULT_ITEMS.map((item) => {
          const isChecked = Boolean(checkedItems[item.id]);

          return (
            <div
              key={item.id}
              role="listitem"
              onClick={() => toggleItem(item.id)}
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200',
                isChecked
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-white/8 bg-white/3 hover:bg-white/6'
              )}
            >
              <button
                type="button"
                aria-label={`Toggle ${item.title}`}
                className="mt-0.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
              >
                {isChecked ? (
                  <CheckSquare className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Square className="h-4 w-4 text-slate-500" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-semibold transition-colors',
                      isChecked ? 'text-slate-300 line-through' : 'text-white'
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic advice based on verdict */}
      {result.verdictLevel === 'high' && (
        <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-300">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>
            <strong>High Risk Alert:</strong> Strong synthetic detection signals observed. Do not republish without primary-source confirmation or forensic provenance verification.
          </span>
        </div>
      )}
    </GlassCard>
  );
}
