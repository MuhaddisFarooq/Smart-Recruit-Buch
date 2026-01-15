
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

        // Helper to build Where Clause
        const buildWhere = (useSearch: boolean, useLocs: boolean, useStats: boolean) => {
            let clause = `WHERE 1=1`;
            const p: any[] = [];

            if (useSearch && search) {
                clause += ` AND (u.name LIKE ? OR u.email LIKE ? OR j.job_title LIKE ?)`;
                p.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            if (useLocs && locations.length > 0) {
                clause += ` AND u.city IN (${locations.map(() => '?').join(',')})`;
                p.push(...locations);
            }
            if (useStats && statuses.length > 0) {
                clause += ` AND ja.status IN (${statuses.map(() => '?').join(',')})`;
                p.push(...statuses);
            }
            return { clause, params: p };
        };

        // 1. Data Query (All Filters)
        const { clause: dataWhere, params: dataWhereParams } = buildWhere(true, true, true);

        // Sorting Logic
        let orderByClause = "ORDER BY ja.applied_at DESC";
        if (sort === "last_name") {
            orderByClause = "ORDER BY SUBSTRING_INDEX(u.name, ' ', -1) ASC";
        } else if (sort === "modified") {
            orderByClause = "ORDER BY ja.applied_at DESC";
        }

        // --- Execute Main Data Query ---
        const dataSql = `
            SELECT 
                ja.id as application_id,
                ja.user_id,
                ja.status,
                ja.applied_at,
                u.avatar_url,
                COALESCE(ja.resume_path, ja.resume_url, u.resume_url) as resume_url,
                u.name,
                u.email,
                u.phone,
                u.city,
                u.country,
                u.designation,
                j.id as job_id,
                j.job_title,
                (SELECT title FROM candidate_experience WHERE user_id = u.id ORDER BY is_current DESC, start_date DESC LIMIT 1) as current_title,
                (SELECT company FROM candidate_experience WHERE user_id = u.id ORDER BY is_current DESC, start_date DESC LIMIT 1) as current_company
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            JOIN jobs j ON ja.job_id = j.id
            ${dataWhere}
            ${orderByClause}
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...dataWhereParams, limit, offset];
        const data = await query(dataSql, dataParams);

        // 2. Facets Logic (Dependent Facets)

        // Locations Facet: Filter by Search + Status (ignore Location filter itself)
        const { clause: locFacetWhere, params: locFacetParams } = buildWhere(true, false, true);

        // Status Facet: Filter by Search + Location (ignore Status filter itself)
        const { clause: statusFacetWhere, params: statusFacetParams } = buildWhere(true, true, false);

        const facetSql = `
            SELECT 'location' as type, u.city as value, COUNT(*) as count
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            JOIN jobs j ON ja.job_id = j.id
            ${locFacetWhere}
            AND u.city IS NOT NULL AND u.city != ''
            GROUP BY u.city
            
            UNION ALL

            SELECT 'status' as type, ja.status as value, COUNT(*) as count
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            JOIN jobs j ON ja.job_id = j.id
            ${statusFacetWhere}
            GROUP BY ja.status
        `;

        const facetsRaw = await query(facetSql, [...locFacetParams, ...statusFacetParams]);

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
            ${dataWhere}
        `;
        const countRes = await query(countSql, dataWhereParams);
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
