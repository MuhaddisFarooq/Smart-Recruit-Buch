"use client";

export default function UpcomingInterviewsCard() {
    return (
        <div className="bg-white border border-[#E6E6E6] rounded shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E6E6E6]">
                <h3 className="text-base font-medium text-[#333]">Upcoming Interviews</h3>
            </div>

            {/* Empty State with Illustration */}
            <div className="py-16 px-4 flex flex-col items-center justify-center">
                {/* Robot Illustration - SVG */}
                <svg
                    width="160"
                    height="140"
                    viewBox="0 0 140 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-4"
                >
                    {/* Robot Head */}
                    <ellipse cx="70" cy="50" rx="35" ry="30" fill="#238740" />
                    {/* Eyes */}
                    <ellipse cx="58" cy="45" rx="8" ry="8" fill="white" />
                    <ellipse cx="82" cy="45" rx="8" ry="8" fill="white" />
                    <circle cx="60" cy="45" r="3" fill="#333" />
                    <circle cx="84" cy="45" r="3" fill="#333" />
                    {/* Smile */}
                    <path
                        d="M55 58 Q70 68 85 58"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                    />
                    {/* Antenna */}
                    <line x1="70" y1="20" x2="70" y2="8" stroke="#333" strokeWidth="2" />
                    <circle cx="70" cy="6" r="3" fill="#FFB800" />

                    {/* Papers/Documents */}
                    <rect x="95" y="55" width="25" height="30" rx="2" fill="#FFB800" />
                    <rect x="98" y="60" width="18" height="2" fill="white" opacity="0.6" />
                    <rect x="98" y="65" width="14" height="2" fill="white" opacity="0.6" />
                    <rect x="98" y="70" width="16" height="2" fill="white" opacity="0.6" />

                    {/* Hand */}
                    <ellipse cx="92" cy="70" rx="6" ry="5" fill="#238740" />

                    {/* Coffee Cup */}
                    <rect x="20" y="70" width="20" height="25" rx="3" fill="#E6E6E6" />
                    <ellipse cx="30" cy="70" rx="10" ry="4" fill="#D1D1D1" />
                    <path d="M40 77 Q48 80 40 88" stroke="#D1D1D1" strokeWidth="3" fill="none" />
                    {/* Steam */}
                    <path d="M25 60 Q23 55 27 52" stroke="#D1D1D1" strokeWidth="1.5" fill="none" />
                    <path d="M32 62 Q30 57 34 54" stroke="#D1D1D1" strokeWidth="1.5" fill="none" />
                </svg>

                <p className="text-sm text-[#999] text-center">No upcoming interviews</p>
            </div>
        </div>
    );
}
