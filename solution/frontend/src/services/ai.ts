import type { RAGResponse } from '../domain'

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://0.0.0.0:8001'

export interface TimelineEntry {
  clause_id: string
  document_id: string
  document_title: string
  text: string
  effective_date: string | null
  expiry_date: string | null
  status: string
  position: number
  is_first: boolean
  is_current: boolean
}

export interface TimelineResponse {
  clause_id: string
  timeline: TimelineEntry[]
}

export const aiService = {
  async rag(query: string): Promise<RAGResponse> {
    const response = await fetch(`${AI_SERVICE_URL}/rag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    if (!response.ok) {
      throw new Error(`AI Service error: ${response.status}`)
    }
    return response.json()
  },

  async clauseTimeline(clauseId: string): Promise<TimelineResponse> {
    const response = await fetch(`${AI_SERVICE_URL}/clause-timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clause_id: clauseId }),
    })
    if (!response.ok) {
      throw new Error(`AI Service error: ${response.status}`)
    }
    return response.json()
  },
}
