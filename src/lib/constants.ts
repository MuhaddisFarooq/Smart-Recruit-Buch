export const ApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export const RecordsPerPage = 10;
export const permissionsDef = {
    get:"Read",
    add:"Create",
    edit:"Update",
    delete:"Delete",
    approve:"Approve",
    reject:"Reject"
}

export const superAdmin = "superAdmin";
export const defaultRoles = {
    superAdmin: "superAdmin",
    student: "student",
    admin: "admin",
    staff: "staff",
    teacher: "teacher"
}

export const programTypes = {
    Program: "Program",
    Course: "Course"
}