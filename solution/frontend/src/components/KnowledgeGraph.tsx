import { useCallback, useMemo, useRef, useState } from "react"
import { InteractiveNvlWrapper } from "@neo4j-nvl/react"
import type NVL from "@neo4j-nvl/base"
import { Clock } from "lucide-react"
import ClauseTimeline from "./ClauseTimeline"

export interface GraphData {
  nodes: Array<{
    id: string
    type: string
    label: string
    [key: string]: unknown
  }>
  edges: Array<{
    source: string
    target: string
    type: string
  }>
}

interface Props {
  data: GraphData
  onNodeClick?: (nodeId: string, nodeData: Record<string, unknown>) => void
}

const NODE_COLORS: Record<string, string> = {
  Domain: "#7c3aed",
  Document: "#192B4B",
  Clause: "#C8102E",
}

export default function KnowledgeGraph({ data, onNodeClick }: Props) {
  const nvlRef = useRef<NVL | null>(null)

  const nodes = useMemo(
    () =>
      data.nodes.map((node, i) => ({
        id: node.id,
        caption: node.label || node.id,
        color: NODE_COLORS[node.type] || "#6b7280",
        size: node.type === "Clause" ? 20 : node.type === "Document" ? 30 : 35,
        x: 400 + Math.cos((2 * Math.PI * i) / Math.max(data.nodes.length, 1)) * (150 * data.nodes.length),
        y: 300 + Math.sin((2 * Math.PI * i) / Math.max(data.nodes.length, 1)) * (150 * data.nodes.length),
      })),
    [data.nodes],
  )

  const rels = useMemo(
    () =>
      data.edges.map((edge, index) => ({
        id: `rel-${index}`,
        from: edge.source,
        to: edge.target,
        caption: edge.type,
        color: "#94a3b8",
        thickness: 1.5,
      })),
    [data.edges],
  )

  const handleClick = useCallback(
    (node: { id: string }, _hitElements: unknown, _event: MouseEvent) => {
      if (node?.id && onNodeClick) {
        const nodeData = data.nodes.find((n) => n.id === node.id)
        onNodeClick(node.id, (nodeData || {}) as Record<string, unknown>)
      }
    },
    [data.nodes, onNodeClick],
  )

  const nvlCallbacks = useMemo(
    () => ({
      onLayoutDone: () => {
        const allIds = data.nodes.map((n) => n.id)
        nvlRef.current?.fit(allIds)
      },
    }),
    [data.nodes],
  )

  const mouseEventCallbacks = useMemo(
    () => ({ onNodeClick: handleClick, onPan: true, onZoomAndPan: true }),
    [handleClick],
  )

  return (
    <div className="w-full h-full relative">
      <InteractiveNvlWrapper
        ref={nvlRef}
        nodes={nodes}
        rels={rels}
        layout="forceDirected"
        layoutOptions={{ enableCytoscape: false }}
        nvlOptions={{
          initialZoom: 0.8,
          allowDynamicMinZoom: true,
          minZoom: 0.1,
          maxZoom: 5,
          renderer: "canvas",
        }}
        nvlCallbacks={nvlCallbacks}
        mouseEventCallbacks={mouseEventCallbacks}
        style={{ height: "100%", width: "100%" }}
      />
      <div className="absolute bottom-3 left-3 bg-white/90 border rounded p-2 text-[10px] text-gray-500">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-[#7c3aed]" /> Domain
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-sm bg-[#192B4B]" /> Document
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#C8102E]" /> Clause
        </div>
      </div>
    </div>
  )
}

const NODE_COLORS_MAP = NODE_COLORS

export function NodeDetailPanel({
  node,
  onClose,
}: {
  node: Record<string, unknown> | null
  onClose: () => void
}) {
  const [showTimeline, setShowTimeline] = useState(false)

  if (!node) {
    return (
      <p className="text-xs text-gray-500 mt-4">Click on a node to see details.</p>
    )
  }

  const nodeType = String(node.type || "")
  const props = (node.properties as Record<string, unknown>) || {}
  const entries = Object.entries(props).filter(([, v]) => v != null && v !== "")
  const isClause = nodeType === "Clause"

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase text-gray-400 font-semibold">
          Node Details
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs">
          ✕
        </button>
      </div>
      <h3 className="font-semibold mt-3">{String(node.label || node.id)}</h3>
      <span
        className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium text-white"
        style={{ backgroundColor: NODE_COLORS_MAP[nodeType] || "#6b7280" }}
      >
        {nodeType}
      </span>
      <dl className="mt-3 text-xs space-y-2">
        <div>
          <dt className="text-gray-400">Node ID</dt>
          <dd className="font-mono">{String(node.id)}</dd>
        </div>
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-gray-400">{key.replace(/_/g, " ")}</dt>
            <dd className="text-gray-700 break-words whitespace-pre-wrap leading-relaxed">
              {String(value)}
            </dd>
          </div>
        ))}
      </dl>

      {isClause && (
        <div className="mt-4 border-t pt-3">
          {!showTimeline ? (
            <button
              onClick={() => setShowTimeline(true)}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#C8102E] hover:text-[#a00d24] bg-red-50 hover:bg-red-100 rounded-lg py-2 transition-colors"
            >
              <Clock size={13} />
              Xem dòng thời gian
            </button>
          ) : (
            <ClauseTimeline
              clauseId={String(node.id)}
              onClose={() => setShowTimeline(false)}
            />
          )}
        </div>
      )}
    </>
  )
}
