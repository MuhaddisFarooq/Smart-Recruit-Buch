"use client";

import { Loader2 } from "lucide-react";

type LoadMoreButtonProps = {
    onClick: () => void;
    loading?: boolean;
};

export default function LoadMoreButton({ onClick, loading = false }: LoadMoreButtonProps) {
    return (
        <div className="flex justify-center py-5 border-t border-[#F0F0F0]">
            <button
                onClick={onClick}
                disabled={loading}
                className="px-8 py-2.5 border-2 border-[#238740] text-[#238740] text-sm font-semibold rounded-md hover:bg-[#238740]/5 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Load more
            </button>
        </div>
    );
}
