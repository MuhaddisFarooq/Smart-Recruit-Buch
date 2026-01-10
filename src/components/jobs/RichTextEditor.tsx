"use client";

import { Bold, Italic, Underline, List, ListOrdered } from "lucide-react";

type RichTextEditorProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
};

export default function RichTextEditor({ label, value, onChange, placeholder, required }: RichTextEditorProps) {
    return (
        <div className="mb-4">
            <label className="block text-sm text-[#333] mb-1">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="border border-[#D1D1D1] rounded overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#E6E6E6] bg-[#FAFAFA]">
                    <button type="button" className="p-1.5 rounded hover:bg-[#E6E6E6] text-[#666]">
                        <Bold className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-1.5 rounded hover:bg-[#E6E6E6] text-[#666]">
                        <Italic className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-1.5 rounded hover:bg-[#E6E6E6] text-[#666]">
                        <Underline className="w-4 h-4" />
                    </button>
                    <div className="w-px h-5 bg-[#E6E6E6] mx-1" />
                    <button type="button" className="p-1.5 rounded hover:bg-[#E6E6E6] text-[#666]">
                        <List className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-1.5 rounded hover:bg-[#E6E6E6] text-[#666]">
                        <ListOrdered className="w-4 h-4" />
                    </button>
                </div>
                {/* Editor Area */}
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={4}
                    className="w-full p-3 text-sm text-[#333] resize-none focus:outline-none placeholder:text-[#999]"
                />
            </div>
        </div>
    );
}
