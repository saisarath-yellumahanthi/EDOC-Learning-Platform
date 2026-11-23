import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Search,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Code2,
  Copy,
  Check,
  Terminal as TerminalIcon,
  ArrowRight,
  Compass,
  Layers,
} from 'lucide-react';
import {
  DSA_CONCEPT_MODULES,
  ConceptModuleId,
  CodeTemplateLang,
  TreeVisualConfig,
  TreeNodeVisual,
  BinarySearchVisualConfig,
  getConceptModuleById,
} from '../utils/dsaConceptsData';
import type { TerminalCodePayload } from './WorkspaceViews';

interface DsaConceptGuidesProps {
  onOpenInTerminal?: (payload: TerminalCodePayload) => void;
  onPracticeCategory?: (category: string) => void;
}

// ============================================================================
// HELPER: Render code lines with subtle inline comment highlighting
// ============================================================================
const AnnotatedCodeBlock: React.FC<{
  code: string;
  lang: CodeTemplateLang;
}> = ({ code, lang }) => {
  const lines = code.split('\n');
  const commentToken = lang === 'python' ? '#' : '//';

  return (
    <div className="overflow-x-auto bg-[#060911] font-mono text-xs sm:text-[13px] leading-6">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, idx) => {
            const commentIdx = line.indexOf(commentToken);
            const hasComment = commentIdx !== -1;
            const codePart = hasComment ? line.slice(0, commentIdx) : line;
            const commentPart = hasComment ? line.slice(commentIdx) : '';

            return (
              <tr
                key={idx}
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="select-none text-right pr-4 pl-4 py-0.5 text-slate-600 w-10 align-top border-r border-slate-800/70 tabular-nums">
                  {idx + 1}
                </td>
                <td className="pl-4 pr-5 py-0.5 whitespace-pre text-slate-100">
                  <span>{codePart}</span>
                  {hasComment && (
                    <span className="text-cyan-400/85 italic">
                      {commentPart}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// HELPER: Single Tree SVG Renderer
// ============================================================================
const renderTreeSvgGraph = (
  nodes: TreeNodeVisual[],
  activeNodeId: string | undefined,
  visitedSet: Set<string>,
  prunedSet: Set<string>,
  highlightEdgeSet: Set<string>,
  viewBoxWidth: number,
  viewBoxHeight: number
) => {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build edges
  const edges: { from: TreeNodeVisual; to: TreeNodeVisual; key: string }[] = [];
  for (const node of nodes) {
    if (node.leftId && nodeMap.has(node.leftId)) {
      edges.push({
        from: node,
        to: nodeMap.get(node.leftId)!,
        key: `${node.id}-${node.leftId}`,
      });
    }
    if (node.rightId && nodeMap.has(node.rightId)) {
      edges.push({
        from: node,
        to: nodeMap.get(node.rightId)!,
        key: `${node.id}-${node.rightId}`,
      });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className="w-full h-auto max-h-[250px]"
      role="img"
      aria-label="Interactive Tree Traversal Diagram"
    >
      {/* Edges */}
      {edges.map(({ from, to, key }) => {
        const isHighlighted = highlightEdgeSet.has(key);
        const isPruned = prunedSet.has(from.id) || prunedSet.has(to.id);
        return (
          <line
            key={key}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={
              isHighlighted
                ? '#22d3ee'
                : isPruned
                ? '#1e293b'
                : '#334155'
            }
            strokeWidth={isHighlighted ? 3 : 2}
            strokeDasharray={isPruned ? '4 4' : undefined}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const isActive = node.id === activeNodeId;
        const isVisited = visitedSet.has(node.id);
        const isPruned = prunedSet.has(node.id);

        let fill = '#0b101d';
        let stroke = '#475569';
        let textFill = '#e2e8f0';

        if (isActive) {
          fill = '#f59e0b';
          stroke = '#fde68a';
          textFill = '#060911';
        } else if (isVisited) {
          fill = '#083344';
          stroke = '#22d3ee';
          textFill = '#67e8f9';
        } else if (isPruned) {
          fill = '#070b14';
          stroke = '#1e293b';
          textFill = '#475569';
        }

        return (
          <g key={node.id}>
            {isActive && (
              <circle
                cx={node.x}
                cy={node.y}
                r={26}
                fill="none"
                stroke="#f59e0b"
                strokeOpacity={0.35}
                strokeWidth={4}
              />
            )}
            <circle
              cx={node.x}
              cy={node.y}
              r={20}
              fill={fill}
              stroke={stroke}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <text
              x={node.x}
              y={node.y + 4}
              textAnchor="middle"
              fill={textFill}
              fontSize="13"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              {node.label}
            </text>
            {node.meta && (
              <text
                x={node.x}
                y={node.y + 33}
                textAnchor="middle"
                fill={isActive ? '#fbbf24' : '#64748b'}
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                {node.meta}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ============================================================================
// INTERACTIVE TREE SVG VISUALIZER
// ============================================================================
const TreeSvgVisualizer: React.FC<{
  visual: TreeVisualConfig;
  stepIdx: number;
}> = ({ visual, stepIdx }) => {
  const safeIdx = Math.min(stepIdx, visual.steps.length - 1);
  const step = visual.steps[safeIdx] || visual.steps[0];
  const visitedSet = new Set(step.visitedNodeIds);
  const prunedSet = new Set(step.prunedNodeIds || []);
  const highlightEdgeSet = new Set(step.highlightEdgeIds || []);

  return (
    <div className="space-y-4">
      {visual.mode === 'comparison' && visual.comparisonNodes ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-[#060911] border border-cyan-500/25 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-300 font-semibold">
                {visual.comparisonTitleLeft}
              </span>
              <span className="text-emerald-400">OPTIMAL</span>
            </div>
            {renderTreeSvgGraph(
              visual.nodes,
              step.activeNodeId,
              visitedSet,
              prunedSet,
              highlightEdgeSet,
              260,
              225
            )}
            <p className="text-[11px] font-mono text-slate-400 text-center">
              {visual.comparisonMetaLeft}
            </p>
          </div>

          <div className="rounded-xl bg-[#060911] border border-amber-500/25 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-300 font-semibold">
                {visual.comparisonTitleRight}
              </span>
              <span className="text-rose-400">WORST CASE</span>
            </div>
            {renderTreeSvgGraph(
              visual.comparisonNodes,
              step.activeNodeId,
              visitedSet,
              prunedSet,
              highlightEdgeSet,
              300,
              225
            )}
            <p className="text-[11px] font-mono text-slate-400 text-center">
              {visual.comparisonMetaRight}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-[#060911] border border-slate-800/90 p-4">
          {renderTreeSvgGraph(
            visual.nodes,
            step.activeNodeId,
            visitedSet,
            prunedSet,
            highlightEdgeSet,
            520,
            240
          )}
        </div>
      )}

      {/* Legend & Live Trace Strip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
        <div className="md:col-span-7 rounded-xl bg-[#060911] border border-slate-800/90 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-display font-bold text-amber-300">
              {step.title}
            </span>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums shrink-0">
              Step {safeIdx + 1} / {visual.steps.length}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {step.description}
          </p>
        </div>

        <div className="md:col-span-5 rounded-xl bg-[#060911] border border-slate-800/90 p-3.5 flex flex-col justify-between gap-2 font-mono text-xs">
          {step.structureLabel && step.structureItems && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                {step.structureLabel}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {step.structureItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {step.outputSequence && step.outputSequence.length > 0 && (
            <div className="pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                Trace:
              </span>
              <span className="text-emerald-300 text-[11px]">
                {step.outputSequence.join(' → ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Node Color Key */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 px-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          Active Node
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          Visited Path
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-500" />
          Unvisited
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#070b14] border border-slate-800" />
          Pruned Subtree
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// INTERACTIVE BINARY SEARCH POINTER SVG VISUALIZER
// ============================================================================
const BinarySearchSvgVisualizer: React.FC<{
  visual: BinarySearchVisualConfig;
  stepIdx: number;
}> = ({ visual, stepIdx }) => {
  const safeIdx = Math.min(stepIdx, visual.steps.length - 1);
  const step = visual.steps[safeIdx] || visual.steps[0];
  const eliminatedSet = new Set(step.eliminatedIndices);

  const count = visual.arrayValues.length;
  const cellW = 58;
  const gap = 10;
  const padX = 24;
  const totalW = padX * 2 + count * cellW + (count - 1) * gap;
  const cellY = 64;
  const cellH = 48;
  const svgH = 178;

  const getCellX = (idx: number) => padX + idx * (cellW + gap);
  const getCellCenterX = (idx: number) => getCellX(idx) + cellW / 2;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[#060911] border border-slate-800/90 p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span className="text-cyan-300 font-semibold">
            {visual.targetLabel}
          </span>
          <span className="text-slate-400">{visual.axisCaption}</span>
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${totalW} ${svgH}`}
            className="w-full min-w-[520px] h-auto max-h-[210px]"
            role="img"
            aria-label="Interactive Binary Search Pointer Diagram"
          >
            {/* Active Search Window Bracket Background */}
            {step.low <= step.high && step.high < count && (
              <rect
                x={getCellX(step.low) - 5}
                y={cellY - 6}
                width={
                  getCellX(step.high) - getCellX(step.low) + cellW + 10
                }
                height={cellH + 12}
                rx={12}
                fill="rgba(34, 211, 238, 0.06)"
                stroke="rgba(34, 211, 238, 0.3)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            )}

            {/* Sorted Half Highlight (for Rotated Sorted Array) */}
            {step.sortedHalfRange && (
              <g>
                <line
                  x1={getCellX(step.sortedHalfRange[0])}
                  y1={cellY - 14}
                  x2={getCellX(step.sortedHalfRange[1]) + cellW}
                  y2={cellY - 14}
                  stroke="#34d399"
                  strokeWidth={2.5}
                />
                <text
                  x={
                    (getCellX(step.sortedHalfRange[0]) +
                      getCellX(step.sortedHalfRange[1]) +
                      cellW) /
                    2
                  }
                  y={cellY - 20}
                  textAnchor="middle"
                  fill="#34d399"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  SORTED HALF
                </text>
              </g>
            )}

            {/* Top Pointer: MID (Amber/Orange) */}
            {step.mid >= 0 && step.mid < count && (
              <g>
                <rect
                  x={getCellCenterX(step.mid) - 24}
                  y={8}
                  width={48}
                  height={20}
                  rx={6}
                  fill="#f59e0b"
                />
                <text
                  x={getCellCenterX(step.mid)}
                  y={22}
                  textAnchor="middle"
                  fill="#060911"
                  fontSize="11"
                  fontWeight="800"
                  fontFamily="JetBrains Mono, monospace"
                >
                  mid={step.mid}
                </text>
                <line
                  x1={getCellCenterX(step.mid)}
                  y1={28}
                  x2={getCellCenterX(step.mid)}
                  y2={cellY - 6}
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </g>
            )}

            {/* Array / Answer Space Cells */}
            {visual.arrayValues.map((val, idx) => {
              const x = getCellX(idx);
              const isMid = idx === step.mid;
              const isFound = idx === step.foundIndex;
              const isEliminated = eliminatedSet.has(idx) && !isFound;
              const pred = step.predicateStatus?.[idx];

              let fill = '#0b101d';
              let stroke = '#334155';
              let textFill = '#f8fafc';

              if (isFound) {
                fill = '#064e3b';
                stroke = '#34d399';
                textFill = '#6ee7b7';
              } else if (isMid) {
                fill = '#451a03';
                stroke = '#f59e0b';
                textFill = '#fde68a';
              } else if (isEliminated) {
                fill = '#070a12';
                stroke = '#1e293b';
                textFill = '#475569';
              }

              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y={cellY}
                    width={cellW}
                    height={cellH}
                    rx={10}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isFound || isMid ? 2.2 : 1.5}
                  />
                  <text
                    x={x + cellW / 2}
                    y={cellY + 23}
                    textAnchor="middle"
                    fill={textFill}
                    fontSize="14"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {val}
                  </text>
                  <text
                    x={x + cellW / 2}
                    y={cellY + 40}
                    textAnchor="middle"
                    fill={isEliminated ? '#334155' : '#64748b'}
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {visual.isAnswerSpace ? `k=${val}` : `[${idx}]`}
                  </text>

                  {/* Predicate Badge (F/T) for Answer Space */}
                  {pred && pred !== '?' && (
                    <g>
                      <rect
                        x={x + cellW - 18}
                        y={cellY - 8}
                        width={18}
                        height={16}
                        rx={4}
                        fill={pred === 'T' ? '#10b981' : '#f43f5e'}
                      />
                      <text
                        x={x + cellW - 9}
                        y={cellY + 3}
                        textAnchor="middle"
                        fill="#060911"
                        fontSize="10"
                        fontWeight="800"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {pred}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Bottom Pointers: LOW (Cyan) & HIGH (Indigo/Cyan) */}
            {step.low === step.high && step.low < count ? (
              <g>
                <line
                  x1={getCellCenterX(step.low)}
                  y1={cellY + cellH + 4}
                  x2={getCellCenterX(step.low)}
                  y2={140}
                  stroke="#22d3ee"
                  strokeWidth={2}
                />
                <rect
                  x={getCellCenterX(step.low) - 38}
                  y={140}
                  width={76}
                  height={22}
                  rx={6}
                  fill="#083344"
                  stroke="#22d3ee"
                />
                <text
                  x={getCellCenterX(step.low)}
                  y={155}
                  textAnchor="middle"
                  fill="#67e8f9"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  low=high={step.low}
                </text>
              </g>
            ) : (
              <>
                {step.low >= 0 && step.low < count && (
                  <g>
                    <line
                      x1={getCellCenterX(step.low)}
                      y1={cellY + cellH + 4}
                      x2={getCellCenterX(step.low)}
                      y2={140}
                      stroke="#22d3ee"
                      strokeWidth={2}
                    />
                    <rect
                      x={getCellCenterX(step.low) - 26}
                      y={140}
                      width={52}
                      height={22}
                      rx={6}
                      fill="#083344"
                      stroke="#22d3ee"
                    />
                    <text
                      x={getCellCenterX(step.low)}
                      y={155}
                      textAnchor="middle"
                      fill="#67e8f9"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      low={step.low}
                    </text>
                  </g>
                )}

                {step.high >= 0 && step.high < count && (
                  <g>
                    <line
                      x1={getCellCenterX(step.high)}
                      y1={cellY + cellH + 4}
                      x2={getCellCenterX(step.high)}
                      y2={140}
                      stroke="#fb923c"
                      strokeWidth={2}
                    />
                    <rect
                      x={getCellCenterX(step.high) - 28}
                      y={140}
                      width={56}
                      height={22}
                      rx={6}
                      fill="#431407"
                      stroke="#fb923c"
                    />
                    <text
                      x={getCellCenterX(step.high)}
                      y={155}
                      textAnchor="middle"
                      fill="#fdba74"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      high={step.high}
                    </text>
                  </g>
                )}
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Step Explanation + Formula Strip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
        <div className="md:col-span-7 rounded-xl bg-[#060911] border border-slate-800/90 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-display font-bold text-amber-300">
              {step.title}
            </span>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums shrink-0">
              Step {safeIdx + 1} / {visual.steps.length}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {step.description}
          </p>
        </div>

        <div className="md:col-span-5 rounded-xl bg-[#060911] border border-cyan-500/25 p-3.5 flex flex-col justify-center space-y-1 font-mono text-xs">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            Pointer State &amp; Invariant Check
          </span>
          <span className="text-cyan-300 leading-relaxed">
            {step.formulaNote}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN CONCEPT GUIDES COMPONENT
// ============================================================================
export const DsaConceptGuides: React.FC<DsaConceptGuidesProps> = ({
  onOpenInTerminal,
  onPracticeCategory,
}) => {
  const [activeModuleId, setActiveModuleId] =
    useState<ConceptModuleId>('trees');
  const activeModule = getConceptModuleById(activeModuleId);

  const [activeTopicId, setActiveTopicId] = useState<string>(
    DSA_CONCEPT_MODULES[0].topics[0].id
  );
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [codeLang, setCodeLang] = useState<CodeTemplateLang>('python');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeTopic =
    activeModule.topics.find((t) => t.id === activeTopicId) ||
    activeModule.topics[0];

  const totalSteps = activeTopic.visual.steps.length;

  // Auto-play timer for interactive SVG step-by-step diagram
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= totalSteps - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);
    return () => window.clearInterval(timer);
  }, [isAutoPlaying, totalSteps]);

  const handleSelectModule = (moduleId: ConceptModuleId) => {
    const mod = getConceptModuleById(moduleId);
    setActiveModuleId(moduleId);
    setActiveTopicId(mod.topics[0].id);
    setStepIdx(0);
    setIsAutoPlaying(false);
  };

  const handleSelectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    setStepIdx(0);
    setIsAutoPlaying(false);
  };

  const handleCopyCode = () => {
    const code = activeTopic.codeTemplates[codeLang];
    navigator.clipboard?.writeText(code).catch(() => {});
    const key = `${activeTopic.id}-${codeLang}`;
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleSendToTerminal = () => {
    if (!onOpenInTerminal) return;
    const langLabel =
      codeLang === 'python' ? 'Python' : codeLang === 'cpp' ? 'C++' : 'C';
    const ext = codeLang === 'python' ? 'py' : codeLang === 'cpp' ? 'cpp' : 'c';
    const slug = activeTopic.id.replace(/[^a-z0-9]+/gi, '_');
    const filename = `${slug}.${ext}`;
    const command =
      codeLang === 'python'
        ? `python3 ${filename}`
        : codeLang === 'cpp'
        ? `g++ -std=c++17 ${filename} -o main && ./main`
        : `gcc ${filename} -o main && ./main`;

    onOpenInTerminal({
      filename,
      language: langLabel,
      chapterTitle: `DSA Concept: ${activeTopic.title}`,
      code: activeTopic.codeTemplates[codeLang],
      command,
      output: [
        `Loaded ${activeTopic.title} (${langLabel}) template into Terminal.`,
        'Add a main() driver or call the function with sample test data and click Run Code.',
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* ====================================================================
          TOP MODULE SELECTOR: 1. TREES  |  2. BINARY SEARCH STRATEGIES
         ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DSA_CONCEPT_MODULES.map((mod, idx) => {
          const isSelected = mod.id === activeModule.id;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => handleSelectModule(mod.id)}
              className={`text-left rounded-2xl p-5 border transition-all cursor-pointer space-y-2 ${
                isSelected
                  ? 'bg-[#0c1426] border-cyan-400/70 shadow-[0_0_28px_rgba(34,211,238,0.16)]'
                  : 'bg-[#0b101d] border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-[11px] font-mono font-semibold text-cyan-400">
                  {mod.id === 'trees' ? (
                    <GitBranch className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Search className="w-4 h-4 text-amber-400" />
                  )}
                  <span>{mod.badge}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}
                >
                  {mod.topics.length} Topics
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-display font-bold text-white">
                {idx + 1}. {mod.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {mod.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          SUB-TOPIC NAVIGATION TABS (Beginner → Advanced)
         ==================================================================== */}
      <div className="rounded-2xl bg-[#0b101d] border border-slate-800/90 p-3 flex flex-wrap items-center gap-2">
        {activeModule.topics.map((topic, idx) => {
          const isActive = topic.id === activeTopic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => handleSelectTopic(topic.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
                isActive
                  ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.12)]'
                  : 'bg-[#060911] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span className="font-mono text-[10px] opacity-75">
                0{idx + 1}
              </span>
              <span>{topic.shortTitle}</span>
              <span
                className={`px-1.5 py-0.5 rounded font-mono text-[9px] uppercase ${
                  topic.level === 'Beginner'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : topic.level === 'Intermediate'
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'bg-orange-500/20 text-orange-300'
                }`}
              >
                {topic.level}
              </span>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          ACTIVE TOPIC HEADER + SUMMARY
         ==================================================================== */}
      <div className="rounded-2xl bg-[#0b101d] border border-cyan-500/30 p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold">
              {activeModule.id === 'trees' ? 'TREES' : 'BINARY SEARCH'}
            </span>
            <span className="px-2.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
              {activeTopic.level.toUpperCase()}
            </span>
          </div>

          {onPracticeCategory && (
            <button
              type="button"
              onClick={() =>
                onPracticeCategory(activeTopic.practiceFilterCategory)
              }
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Practice {activeTopic.practiceFilterCategory} Problems</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <h3 className="text-xl sm:text-2xl font-display font-bold text-white">
          {activeTopic.title}
        </h3>
        <p className="text-xs sm:text-sm text-cyan-300/90 font-medium">
          {activeTopic.subtitle}
        </p>
        <p className="text-sm text-slate-300 leading-relaxed pt-1">
          {activeTopic.summary}
        </p>
      </div>

      {/* ====================================================================
          SECTION 1: VISUAL INTUITION (Interactive SVG Step-by-Step Diagram)
         ==================================================================== */}
      <section
        aria-label="Visual Intuition Diagram"
        className="rounded-2xl bg-[#0b101d] border border-slate-800/90 p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-display font-bold text-white">
                Visual Intuition · Step-by-Step Execution
              </h4>
              <p className="text-xs text-slate-400">
                Step through how{' '}
                {activeTopic.visual.kind === 'tree'
                  ? 'tree nodes and subtrees are visited or pruned'
                  : 'low, mid, and high pointers shrink the search space'}
              </p>
            </div>
          </div>

          {/* Interactive Stepper Controls */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                setIsAutoPlaying(false);
                setStepIdx((prev) => Math.max(0, prev - 1));
              }}
              disabled={stepIdx === 0}
              aria-label="Previous visual step"
              className="px-2.5 py-1.5 rounded-lg bg-[#060911] hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (stepIdx >= totalSteps - 1) {
                  setStepIdx(0);
                  setIsAutoPlaying(true);
                } else {
                  setIsAutoPlaying((prev) => !prev);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Animate</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAutoPlaying(false);
                setStepIdx((prev) => Math.min(totalSteps - 1, prev + 1));
              }}
              disabled={stepIdx >= totalSteps - 1}
              aria-label="Next visual step"
              className="px-2.5 py-1.5 rounded-lg bg-[#060911] hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAutoPlaying(false);
                setStepIdx(0);
              }}
              aria-label="Reset visual steps"
              className="p-1.5 rounded-lg bg-[#060911] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Reset diagram"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Indicator Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {activeTopic.visual.steps.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setIsAutoPlaying(false);
                setStepIdx(idx);
              }}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors cursor-pointer ${
                idx === stepIdx
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-[#060911] border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Step {idx + 1}
            </button>
          ))}
        </div>

        {/* SVG Canvas */}
        {activeTopic.visual.kind === 'tree' ? (
          <TreeSvgVisualizer visual={activeTopic.visual} stepIdx={stepIdx} />
        ) : (
          <BinarySearchSvgVisualizer
            visual={activeTopic.visual}
            stepIdx={stepIdx}
          />
        )}
      </section>

      {/* ====================================================================
          SECTION 2: CORE STRATEGY & PATTERN RECOGNITION
         ==================================================================== */}
      <section
        aria-label="Core Strategy and Pattern Recognition"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* When to Use This Pattern */}
        <div className="rounded-2xl bg-[#0b101d] border border-cyan-500/25 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
            <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
            <h4 className="text-sm sm:text-base font-display font-bold text-white">
              When to Use This Pattern
            </h4>
          </div>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {activeTopic.whenToUse.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Common Pitfalls & Edge Cases */}
        <div className="rounded-2xl bg-[#0b101d] border border-amber-500/25 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <h4 className="text-sm sm:text-base font-display font-bold text-white">
              Common Pitfalls &amp; Edge Cases
            </h4>
          </div>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {activeTopic.commonPitfalls.map((pitfall, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  !
                </span>
                <span>{pitfall}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ====================================================================
          SECTION 3: COMPLEXITY TABLE (Best, Average, Worst + Space)
         ==================================================================== */}
      <section
        aria-label="Time and Space Complexity Table"
        className="rounded-2xl bg-[#0b101d] border border-slate-800/90 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm sm:text-base font-display font-bold text-white">
              Complexity Analysis (Best · Average · Worst)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            h = tree height · w = max width · R = answer range
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#070b14] border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Operation / Variant</th>
                <th className="py-3 px-4">Time (Best)</th>
                <th className="py-3 px-4">Time (Average)</th>
                <th className="py-3 px-4">Time (Worst)</th>
                <th className="py-3 px-4">Space</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {activeTopic.complexityTable.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/25">
                  <td className="py-3 px-4 font-sans font-semibold text-white">
                    {row.operation}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 whitespace-nowrap">
                    {row.timeBest}
                  </td>
                  <td className="py-3 px-4 text-cyan-300 whitespace-nowrap">
                    {row.timeAverage}
                  </td>
                  <td
                    className={`py-3 px-4 whitespace-nowrap ${
                      row.timeWorst.includes('²') || row.timeWorst === 'O(n)'
                        ? 'text-amber-300'
                        : 'text-cyan-300'
                    }`}
                  >
                    {row.timeWorst}
                  </td>
                  <td className="py-3 px-4 text-slate-200 whitespace-nowrap">
                    {row.space}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-400">
                    {row.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ====================================================================
          SECTION 4: ANNOTATED CODE TEMPLATES (Switchable Python / C++ / C)
         ==================================================================== */}
      <section
        aria-label="Annotated Code Templates"
        className="rounded-2xl bg-[#0b101d] border border-slate-800/90 overflow-hidden"
      >
        <div className="px-5 py-3.5 bg-[#070b14] border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm sm:text-base font-display font-bold text-white">
              Annotated Code Template
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Switchable Language Selector: Python, C++, C */}
            <div
              role="tablist"
              aria-label="Code template language"
              className="inline-flex items-center gap-1 rounded-xl bg-[#060911] border border-slate-800 p-1 font-mono text-xs"
            >
              {(
                [
                  { id: 'python', label: 'Python' },
                  { id: 'cpp', label: 'C++' },
                  { id: 'c', label: 'C' },
                ] as { id: CodeTemplateLang; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={codeLang === item.id}
                  onClick={() => setCodeLang(item.id)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    codeLang === item.id
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg bg-[#0b101d] hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey === `${activeTopic.id}-${codeLang}` ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Open in Terminal */}
            {onOpenInTerminal && (
              <button
                type="button"
                onClick={handleSendToTerminal}
                className="px-3 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-xs font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <TerminalIcon className="w-3.5 h-3.5" />
                <span>Open in Terminal</span>
              </button>
            )}
          </div>
        </div>

        <AnnotatedCodeBlock
          code={activeTopic.codeTemplates[codeLang]}
          lang={codeLang}
        />
      </section>
    </div>
  );
};
