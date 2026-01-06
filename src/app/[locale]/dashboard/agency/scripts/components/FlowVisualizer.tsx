"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  Clock,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Script {
  id: string;
  name: string;
  intent: string | null;
  content: string;
  nextScriptOnSuccess: string | null;
  nextScriptOnReject: string | null;
  followUpScriptId: string | null;
  followUpDelay: number | null;
}

interface FlowNode {
  id: string;
  script: Script;
  x: number;
  y: number;
  type: "root" | "success" | "reject" | "followup";
  depth: number;
}

interface FlowEdge {
  from: string;
  to: string;
  type: "success" | "reject" | "followup";
  label?: string;
}

interface FlowVisualizerProps {
  rootScriptId: string;
  allScripts: Script[];
  onScriptClick?: (scriptId: string) => void;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const HORIZONTAL_GAP = 280;
const VERTICAL_GAP = 120;

const INTENT_COLORS: Record<string, string> = {
  GREETING: "from-blue-500 to-blue-600",
  PPV_PITCH: "from-emerald-500 to-emerald-600",
  PPV_FOLLOWUP: "from-yellow-500 to-yellow-600",
  OBJECTION_PRICE: "from-red-500 to-red-600",
  OBJECTION_TIME: "from-orange-500 to-orange-600",
  OBJECTION_TRUST: "from-purple-500 to-purple-600",
  CLOSING: "from-green-500 to-green-600",
  REENGAGEMENT: "from-cyan-500 to-cyan-600",
  UPSELL: "from-amber-500 to-amber-600",
  THANK_YOU: "from-pink-500 to-pink-600",
  CUSTOM: "from-gray-500 to-gray-600",
};

const EDGE_COLORS = {
  success: "#22c55e",
  reject: "#ef4444",
  followup: "#8b5cf6",
};

export default function FlowVisualizer({
  rootScriptId,
  allScripts,
  onScriptClick,
}: FlowVisualizerProps) {
  const params = useParams();
  const locale = params.locale as string;
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Build the flow graph
  const buildFlowGraph = useCallback(() => {
    const scriptMap = new Map(allScripts.map(s => [s.id, s]));
    const rootScript = scriptMap.get(rootScriptId);

    if (!rootScript) return;

    const newNodes: FlowNode[] = [];
    const newEdges: FlowEdge[] = [];
    const visited = new Set<string>();

    // BFS to build the graph
    const queue: { scriptId: string; depth: number; yOffset: number; type: FlowNode["type"] }[] = [
      { scriptId: rootScriptId, depth: 0, yOffset: 0, type: "root" }
    ];

    while (queue.length > 0) {
      const { scriptId, depth, yOffset, type } = queue.shift()!;

      if (visited.has(scriptId)) continue;
      visited.add(scriptId);

      const script = scriptMap.get(scriptId);
      if (!script) continue;

      // Calculate position
      const x = 50 + depth * HORIZONTAL_GAP;
      const y = 200 + yOffset * VERTICAL_GAP;

      newNodes.push({
        id: scriptId,
        script,
        x,
        y,
        type,
        depth,
      });

      // Add connected scripts
      let childYOffset = yOffset - 1;

      if (script.nextScriptOnSuccess && !visited.has(script.nextScriptOnSuccess)) {
        newEdges.push({
          from: scriptId,
          to: script.nextScriptOnSuccess,
          type: "success",
          label: "Success",
        });
        queue.push({
          scriptId: script.nextScriptOnSuccess,
          depth: depth + 1,
          yOffset: childYOffset,
          type: "success",
        });
        childYOffset++;
      }

      if (script.nextScriptOnReject && !visited.has(script.nextScriptOnReject)) {
        newEdges.push({
          from: scriptId,
          to: script.nextScriptOnReject,
          type: "reject",
          label: "Reject",
        });
        queue.push({
          scriptId: script.nextScriptOnReject,
          depth: depth + 1,
          yOffset: childYOffset,
          type: "reject",
        });
        childYOffset++;
      }

      if (script.followUpScriptId && !visited.has(script.followUpScriptId)) {
        const delayLabel = script.followUpDelay
          ? script.followUpDelay >= 60
            ? `${Math.round(script.followUpDelay / 60)}h`
            : `${script.followUpDelay}m`
          : "";
        newEdges.push({
          from: scriptId,
          to: script.followUpScriptId,
          type: "followup",
          label: `Follow-up ${delayLabel}`,
        });
        queue.push({
          scriptId: script.followUpScriptId,
          depth: depth + 1,
          yOffset: childYOffset,
          type: "followup",
        });
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [rootScriptId, allScripts]);

  useEffect(() => {
    buildFlowGraph();
  }, [buildFlowGraph]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.4));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Get node position for edge drawing
  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return {
      x: node.x + NODE_WIDTH / 2,
      y: node.y + NODE_HEIGHT / 2,
    };
  };

  // Draw edge path
  const getEdgePath = (edge: FlowEdge) => {
    const from = getNodeCenter(edge.from);
    const to = getNodeCenter(edge.to);

    const fromX = from.x + NODE_WIDTH / 2 - 10;
    const toX = to.x - NODE_WIDTH / 2 + 10;

    const midX = (fromX + toX) / 2;

    return `M ${fromX} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${toX} ${to.y}`;
  };

  // Get edge label position
  const getEdgeLabelPosition = (edge: FlowEdge) => {
    const from = getNodeCenter(edge.from);
    const to = getNodeCenter(edge.to);
    return {
      x: (from.x + to.x) / 2 + NODE_WIDTH / 4,
      y: (from.y + to.y) / 2 - 10,
    };
  };

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading flow...
      </div>
    );
  }

  const minX = Math.min(...nodes.map(n => n.x)) - 50;
  const maxX = Math.max(...nodes.map(n => n.x)) + NODE_WIDTH + 50;
  const minY = Math.min(...nodes.map(n => n.y)) - 50;
  const maxY = Math.max(...nodes.map(n => n.y)) + NODE_HEIGHT + 50;
  const svgWidth = maxX - minX;
  const svgHeight = maxY - minY;

  return (
    <div className="relative w-full h-[500px] bg-black/20 rounded-2xl overflow-hidden border border-white/10">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-sm text-gray-400 w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-400">Success</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-400">Reject</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-gray-400">Follow-up</span>
        </div>
      </div>

      {/* Drag hint */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 text-xs text-gray-500">
        <Move className="w-4 h-4" />
        Drag to pan
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={cn(
          "w-full h-full cursor-grab",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: svgWidth,
            height: svgHeight,
          }}
          className="relative"
        >
          {/* SVG for edges */}
          <svg
            ref={svgRef}
            width={svgWidth}
            height={svgHeight}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ overflow: "visible" }}
          >
            <defs>
              {/* Arrow markers */}
              <marker
                id="arrow-success"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill={EDGE_COLORS.success} />
              </marker>
              <marker
                id="arrow-reject"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill={EDGE_COLORS.reject} />
              </marker>
              <marker
                id="arrow-followup"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill={EDGE_COLORS.followup} />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((edge, i) => (
              <g key={`${edge.from}-${edge.to}-${i}`}>
                <path
                  d={getEdgePath(edge)}
                  fill="none"
                  stroke={EDGE_COLORS[edge.type]}
                  strokeWidth="2"
                  strokeDasharray={edge.type === "followup" ? "5,5" : undefined}
                  markerEnd={`url(#arrow-${edge.type})`}
                  className="transition-all"
                />
                {edge.label && (
                  <text
                    x={getEdgeLabelPosition(edge).x}
                    y={getEdgeLabelPosition(edge).y}
                    fill={EDGE_COLORS[edge.type]}
                    fontSize="11"
                    fontWeight="500"
                    className="select-none"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const intentColor = INTENT_COLORS[node.script.intent || "CUSTOM"] || INTENT_COLORS.CUSTOM;
            const isRoot = node.type === "root";
            const isSelected = selectedNode === node.id;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: node.depth * 0.1 }}
                className={cn(
                  "absolute rounded-xl overflow-hidden cursor-pointer transition-all",
                  isRoot && "ring-2 ring-purple-500 ring-offset-2 ring-offset-black/50",
                  isSelected && "ring-2 ring-white"
                )}
                style={{
                  left: node.x,
                  top: node.y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node.id);
                  onScriptClick?.(node.id);
                }}
              >
                {/* Node background */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-20",
                  intentColor
                )} />

                {/* Node content */}
                <div className="relative h-full p-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl">
                  {/* Type indicator */}
                  <div className="absolute -top-1 -left-1">
                    {node.type === "success" && (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {node.type === "reject" && (
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {node.type === "followup" && (
                      <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Script name */}
                  <h4 className="font-medium text-white text-sm truncate pr-4">
                    {node.script.name}
                  </h4>

                  {/* Intent badge */}
                  {node.script.intent && (
                    <span className={cn(
                      "inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-gradient-to-r text-white",
                      intentColor
                    )}>
                      {node.script.intent.replace(/_/g, " ")}
                    </span>
                  )}

                  {/* Content preview */}
                  <p className="mt-1 text-[10px] text-gray-400 line-clamp-1">
                    {node.script.content.substring(0, 50)}...
                  </p>

                  {/* Edit link */}
                  <Link
                    href={`/${locale}/dashboard/agency/scripts/${node.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-2 right-2 text-[10px] text-purple-400 hover:text-purple-300"
                  >
                    Edit
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* No flow message */}
      {nodes.length === 1 && edges.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No flow connections</p>
            <p className="text-sm text-gray-500">
              Add success, reject, or follow-up scripts to create a flow
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
