import { useState } from "react"
import type { RAGGraph } from "../domain"
import { Modal } from "./shared"
import KnowledgeGraph, { NodeDetailPanel } from "./KnowledgeGraph"

export default function GraphModal({
  open,
  onClose,
  graphData,
}: {
  open: boolean
  onClose: () => void
  graphData?: RAGGraph | null
}) {
  const [selectedNode, setSelectedNode] = useState<Record<string, unknown> | null>(null)

  return (
    <Modal open={open} onClose={onClose} title="Knowledge Graph" size="lg">
      <div className="-m-5 h-[68vh] flex bg-[#F8FAFC]">
        {graphData && graphData.nodes.length > 0 ? (
          <>
            <div className="flex-1 min-w-0">
              <KnowledgeGraph
                data={graphData}
                onNodeClick={(_nodeId, nodeData) => setSelectedNode(nodeData)}
              />
            </div>
            <aside className="w-72 border-l bg-white p-4 overflow-y-auto">
              <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
            </aside>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-500">Không có dữ liệu đồ thị cho câu trả lời này.</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
