import CandidateNav from "@/components/candidate/CandidateNav";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            <CandidateNav />
            <main className="pt-16 px-4 md:px-6">
                <div className="max-w-[1200px] mx-auto py-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
