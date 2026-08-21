"use client"

import type React from "react"

import { useRef } from "react"
import { Loader2, Paperclip, Send, X } from "lucide-react"
import type { SelectedAttachment } from "@/lib/support/chat-message"

interface SupportComposerProps {
  inputText: string
  onInputTextChange: (value: string) => void
  onSend: () => void
  selectedAttachment: SelectedAttachment | null
  onClearAttachment: () => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  isUploading: boolean
  isTyping: boolean
  /** Changes the placeholder and footer label when a human is connected. */
  isLiveConversation: boolean
}

const BYTES_PER_MB = 1024 * 1024

/**
 * Footer input bar: staged-attachment preview, file picker, text field and send.
 *
 * Split out of components/support/floating-support-widget.tsx. The file input is
 * hidden and driven by the paperclip button, which is the only way to style a
 * file picker consistently across browsers.
 */
export function SupportComposer({
  inputText,
  onInputTextChange,
  onSend,
  selectedAttachment,
  onClearAttachment,
  onFileSelect,
  isUploading,
  isTyping,
  isLiveConversation,
}: SupportComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const placeholder = isLiveConversation
    ? "Type message to support agent..."
    : selectedAttachment
      ? "Add a comment (optional)..."
      : "Type message or upload PDF/Picture"

  return (
    <div className="p-2.5 bg-white border-t border-slate-200 flex flex-col items-center">
      {selectedAttachment && (
        <div className="w-full mb-2 p-2 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {selectedAttachment.isPdf ? (
              <div className="h-8 w-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                PDF
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedAttachment.previewUrl}
                alt="Preview"
                className="h-8 w-8 rounded-lg object-cover border border-slate-300 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800 truncate text-xs">{selectedAttachment.name}</p>
              <p className="text-[10px] text-slate-500">
                {(selectedAttachment.size / BYTES_PER_MB).toFixed(2)} MB · {selectedAttachment.isPdf ? "PDF Document" : "Picture"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearAttachment}
            className="h-6 w-6 rounded-full bg-slate-200 hover:bg-red-500 hover:text-white flex items-center justify-center text-slate-600 transition-colors"
            aria-label="Remove attachment"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="w-full flex items-center bg-slate-100 border border-slate-300 rounded-full px-2 py-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
        <input type="file" ref={fileInputRef} onChange={onFileSelect} accept="image/*,application/pdf" className="hidden" />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isTyping}
          className="h-8 w-8 rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
          title="Upload Picture or PDF"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => onInputTextChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder={placeholder}
          aria-label="Support message"
          className="flex-1 bg-transparent text-sm text-slate-900 border-none outline-none px-2 py-1.5"
        />

        <button
          type="button"
          onClick={onSend}
          disabled={(!inputText.trim() && !selectedAttachment) || isUploading}
          aria-label="Send message"
          className="h-8 w-8 rounded-full bg-blue-600 disabled:bg-slate-400 disabled:opacity-40 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shrink-0"
        >
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 ml-0.5" />}
        </button>
      </div>

      <span className="text-[10px] text-slate-400 mt-1 font-medium">{isLiveConversation ? "Live Support · TOLA" : "TOLA AI Agent"}</span>
    </div>
  )
}
