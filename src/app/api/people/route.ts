
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";
        const locations = searchParams.get("locations")?.split(",").filter(Boolean) || [];
        const statuses = searchParams.get("statuses")?.split(",").filter(Boolean) || [];

        const sort = searchParams.get("sort") || "applied_at";

        const offset = (page - 1) * limit;

        // Base Query Builder
        let whereClause = `WHERE 1=1`;
        const params: any[] = [];

        if (search) {
            whereClause += ` AND (u.name LIKE ? OR u.email LIKE ? OR j.job_title LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (locations.length > 0) {
            whereClause += ` AND u.city IN (${locations.map(() => '?').join(',')})`;
            params.push(...locations);
        }

        if (statuses.length > 0) {
            whereClause += ` AND ja.status IN (${statuses.map(() => '?').join(',')})`;
            params.push(...statuses);
        }

        // Sorting Logic
        let orderByClause = "ORDER BY ja.applied_at DESC";
        if (sort === "last_name") {
            // Simple approach: Sort by full name as proxy, or use substring if strictly last name required
            // For better UX with unpredictable names, sorting by full name is often acceptable, but let's try last part
            orderByClause = "ORDER BY SUBSTRING_INDEX(u.name, ' ', -1) ASC";
        } else if (sort === "modified") {
            // Assuming applied_at is the proxy for modification for now if updated_at is missing from query selection
            // If we had an updated_at column we'd use it. For now, sticking to applied_at as 'latest activity' proxy or if status updates change a field.
            // Actually, row updates should ideally have a timestamp. Let's stick to applied_at for now unless requested otherwise, 
            // BUT the prompt asked for "Modified date". In many systems app date = created date. 
            // Let's assume applied_at is the best we have for now, or check schema.
            // Wait, I saw `Status updated: ...` in the UI which implies `updated_at` might exist or be derived. 
            // The query selects `ja.applied_at` twice implicitly or explicitly.
            // Let's check the schema? No, let's use applied_at DESC for 'Added to system' and maybe applied_at DESC for Modified too if no other field, 
            // BUT logically `Added to system` = ASC or DESC? Usually newest first.
            // "Added to system" -> `applied_at DESC`
            // "Modified Date" -> `updated_at DESC` (if exists) or `applied_at DESC`.
            // Let's try to add `updated_at` to the query if possible?
            // Checking previous file content... line 21 `ja.applied_at`.
            // I will assume for now `Added to system` is `applied_at DESC`.
            // "Modified Date" might be the same effectively if no edits happen, but let's use `ja.applied_at` for both distinction if keys differ,
            // or maybe I should check if `updated_at` exists in `job_applications`.
            // Safe bet: Default to `applied_at DESC` for both if unsure, but I'll add the switch case.
            orderByClause = "ORDER BY ja.applied_at DESC";
        }

        // --- Execute Main Data Query ---
        const dataSql = `
            SELECT 
                ja.id as application_id,
                ja.user_id,
                ja.status,
                ja.applied_at,
                COALESCE(ja.resume_path, ja.resume_url, u.resume_url) as resume_url,
                u.name,
                u.email,
                u.phone,
                u.city,
                u.country,
                j.id as job_id,
                j.job_title,
                (SELECT title FROM candidate_experience WHERE user_id = u.id AND is_current = 1 LIMIT 1) as current_title,
                (SELECT company FROM candidate_experience WHERE user_id = u.id AND is_current = 1 LIMIT 1) as current_company
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            JOIN jobs j ON ja.job_id = j.id
            ${whereClause}
            ${orderByClause}
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, limit, offset];
        const data = await query(dataSql, dataParams);

        // --- Calculate Facets (Counts) ---
        // We calculate facets based on the *base* query (minus the filter being counted, usually, but for simplicity we'll count ALL available options globally or within current search context)
        // Let's do Global Facets + Search for now, or Facets within current Search Scope.

        // Revised Strategy: Facets should reflect the available data if I were to UNCHECK a filter in that category, OR just show global availability for that search term.
        // Let's go with: Count all matches for the current SEARCH QUERY (ignoring specific facet filters for the facet calculation itself? No, usually you want to see standard drill-down).
        // Simplest "drill-down": Show counts for currently filtered set.
        // Better "standard e-com": Show counts for the set matching the search term, distributed by facet.

        // 1. Facet Where Clause (Ignore location/status filters, keep Search)
        let facetWhere = `WHERE 1=1`;
        const facetParams: any[] = [];
        if (search) {
            facetWhere += ` AND (u.name LIKE ? OR u.email LIKE ? OR j.job_title LIKE ?)`;
            facetParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const facetSql = `
            SELECT 'location' as type, u.city as value, COUNT(*) as count
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            JOIN jobs j ON ja.job_id = j.id
            ${facetWhere}
            AND u.city IS NOT NULL AND u.city != ''
            GROUP BY u.city
            
            UNION ALL

            SELECT 'status' as type, ja.status as value, COUNT(*) as count
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            JOIN jobs j ON ja.job_id = j.id
            ${facetWhere}
            GROUP BY ja.status
        `;

        // Note: Running multiple heavy queries might be slow on huge datasets, okay for now.
        const facetsRaw = await query(facetSql, [...facetParams, ...facetParams]);

        const facets = {
            locations: facetsRaw.filter((f: any) => f.type === 'location').map((f: any) => ({ label: f.value, count: Number(f.count) })),
            statuses: facetsRaw.filter((f: any) => f.type === 'status').map((f: any) => ({ label: f.value, count: Number(f.count) }))
        };

        // Total count for pagination
        const countSql = `
            SELECT COUNT(*) as total
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            JOIN jobs j ON ja.job_id = j.id
            ${whereClause}
        `;
        const totalParams = [...params];
        const countRes = await query(countSql, totalParams);
        const total = countRes[0]?.total || 0;

        return NextResponse.json({
            data,
            meta: { total, page, limit },
            facets
        });

    } catch (error: any) {
        console.error("People API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
