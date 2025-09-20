// src/lib/constants.ts
export const ApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export const RecordsPerPage = 10;


export const superAdmin = "superadmin"; // <-- lower-case

export const defaultRoles = {
  superAdmin: "superadmin", // <-- match DB
};

