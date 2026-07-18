import Markdown, { defaultUrlTransform } from "react-markdown"
import remarkGfm from "remark-gfm"

const HYPHEN = "[-‑‐⁃]" 
const CHUNK_ID_RE = new RegExp(`\\b([A-Z]{2,4}${HYPHEN}[A-Z]\\d{2}(?:${HYPHEN}v\\d+)?${HYPHEN}\\d+\\.\\d+)\\b`, "g")

function normalizeChunkId(id: string): string {
  return id.replace(/[^A-Za-z0-9.]/g, (ch) => (ch === "." ? "." : "-"))
}

function preprocessContent(content: string): string {
  return content.replace(CHUNK_ID_RE, (match) => {
    const normalized = normalizeChunkId(match)
    return `[\`${match}\`](source:${normalized})`
  })
}

interface Props {
  content: string
  onSourceClick?: (chunkId: string) => void
}

export default function MarkdownMessage({ content, onSourceClick }: Props) {
  const processed = onSourceClick ? preprocessContent(content) : content

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      urlTransform={(url) => (url.startsWith("source:") ? url : defaultUrlTransform(url))}
      components={{
        h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-6">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-")
          return isBlock ? (
            <code className="block bg-gray-100 rounded p-2 text-xs font-mono overflow-x-auto my-2">{children}</code>
          ) : (
            <code className="bg-gray-100 rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>
          )
        },
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full text-xs border">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
        th: ({ children }) => <th className="border px-2 py-1 text-left font-semibold">{children}</th>,
        td: ({ children }) => <td className="border px-2 py-1">{children}</td>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 my-2">{children}</blockquote>
        ),
        a: ({ href, children }) => {
          if (href?.startsWith("source:") && onSourceClick) {
            const chunkId = href.slice(7)
            return (
              <button
                type="button"
                onClick={() => onSourceClick(chunkId)}
                className="inline-flex items-center gap-0.5 font-mono text-xs text-[#C8102E] bg-red-50 hover:bg-red-100 rounded px-1.5 py-0.5 transition-colors cursor-pointer"
                title={`Xem source: ${chunkId}`}
              >
                {children}
              </button>
            )
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{children}</a>
          )
        },
        hr: () => <hr className="my-3 border-gray-200" />,
      }}
    >
      {processed}
    </Markdown>
  )
}
