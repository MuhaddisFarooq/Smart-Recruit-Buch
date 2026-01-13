
// Simple heuristic scoring engine "AI"
// In a real app, this would call an LLM (OpenAI/Gemini)

export function calculateScore(
    job: { title: string; description: string; qualifications: string; experience_level?: string },
    candidate: { title: string; experience: any[]; education: any[]; resume_text?: string }
): number {
    let score = 0;
    const maxScore = 10;

    // Normalize text
    const jobText = (job.title + " " + job.description + " " + job.qualifications).toLowerCase();
    const candidateText = (
        candidate.title + " " +
        candidate.experience.map(e => e.title + " " + e.description).join(" ") + " " +
        candidate.education.map(e => e.degree + " " + e.major).join(" ") + " " +
        (candidate.resume_text || "")
    ).toLowerCase();

    // 1. Title Relevance (30%)
    // Check if job title words appear in candidate title or experience titles
    const jobTitleWords = job.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    let titleMatch = 0;
    if (jobTitleWords.length > 0) {
        const matches = jobTitleWords.filter(w => candidateText.includes(w));
        titleMatch = (matches.length / jobTitleWords.length) * 3; // Max 3 points
    }
    score += titleMatch;

    // 2. Keyword/Skills Matching (50%)
    // Dynamic Keyword Extraction
    // We extract significant words from the Job Description to create a dynamic dictionary.

    const stopWords = new Set([
        "with", "that", "this", "from", "have", "will", "your", "their", "what", "about", "when", "make", "time", "work", "team", "also", "into", "just", "year", "years", "good", "need", "like", "over", "than", "should", "only", "most", "some", "very", "after", "been",
        "required", "preferred", "qualifications", "experience", "skills", "ability", "knowledge", "using", "perform", "strong", "excellent", "working", "degree", "field", "related", "manager", "senior", "junior", "lead"
    ]);

    // Tokenize Job Text - Clean non-alphanumeric but allow hyphens/pluses (e.g. C++)
    const tokens = jobText.replace(/[^a-zA-Z0-9\+\-]/g, " ").split(/\s+/).filter(w => w.length > 3);
    const wordFreq: Record<string, number> = {};

    tokens.forEach(w => {
        if (!stopWords.has(w) && !/^\d+$/.test(w)) { // Skip purely numeric tokens unless likely version? Nah skip numbers to be safe/dynamic
            wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
    });

    // Select Top Keywords by frequency
    // Dynamic cap: Take top 30% of unique words or max 30 words, whichever is reasonable
    const uniqueWords = Object.keys(wordFreq);
    const sortedKeywords = uniqueWords
        .sort((a, b) => wordFreq[b] - wordFreq[a])
        .slice(0, 30); // Top 30 frequent words

    // Calculate Match
    if (sortedKeywords.length > 0) {
        // We give partial credit for partial matches (e.g. "management" matches "manage")
        let hitCount = 0;
        sortedKeywords.forEach(k => {
            // Simple check: does candidate text contain this keyword?
            if (candidateText.includes(k)) {
                hitCount++;
            } else {
                // Try simple suffix removal (singularization)
                if (k.endsWith('s') && candidateText.includes(k.slice(0, -1))) hitCount++;
                else if (k.endsWith('ing') && candidateText.includes(k.slice(0, -3))) hitCount++;
            }
        });

        // Score: % of job keywords found in candidate
        // Dynamic denominator: We expect a good candidate to match at least 60% of top keywords, not 100%
        // So we divide by (Total * 0.6) to allow 10/10 score even with some misses
        const targetMatchCount = Math.max(Math.ceil(sortedKeywords.length * 0.6), 5); // At least 5 matches or 60%

        let rawKeywordScore = (hitCount / targetMatchCount) * 5; // Max 5 points
        score += Math.min(rawKeywordScore, 5); // Cap at 5
    } else {
        score += 2.5; // fallback
    }

    // 3. Experience Level (20%)
    // Crude check for "Senior", "Junior", "Manager" alignment
    // or checks years if parsed (omitted for now)
    const levels = ["intern", "junior", "mid", "senior", "lead", "manager", "director", "vp", "c-level"];
    const jobLevelIndex = levels.findIndex(l => job.experience_level?.toLowerCase().includes(l) || job.title.toLowerCase().includes(l));
    const candLevelIndex = levels.findIndex(l => candidate.title.toLowerCase().includes(l));

    if (jobLevelIndex >= 0 && candLevelIndex >= 0) {
        // If candidate is at or above level: full points
        if (candLevelIndex >= jobLevelIndex) score += 2;
        else if (candLevelIndex === jobLevelIndex - 1) score += 1;
        // else 0
    } else {
        score += 1; // Neutral
    }

    // Cap at 10, Min at 0
    return Math.min(Math.max(Math.round(score * 10) / 10, 0), 10);
}
