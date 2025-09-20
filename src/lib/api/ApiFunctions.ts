import axios from "axios";
import { getSession } from "next-auth/react";
import { ApiUrl, RecordsPerPage } from "../constants";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { number } from "yup";

const api = axios.create({
  baseURL: ApiUrl,
});

// Add request interceptor for authentication
api.interceptors.request.use(async (config) => {
  const session: any = await getSession();
  if (session?.user?.accessToken) {
    config.headers.Authorization = `Bearer ${session?.user?.accessToken}`;
  }
  return config;
});

// Global error handler
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const message =
//       error?.response?.data?.message ||
//       error?.message ||
//       'An unexpected error occurred';
//      toast.error("Error", {
//            description: error?.message || "An unexpected error occurred",
//          });
//     // return Promise.reject(error); // re-throw to allow caller to handle if needed
//   }
// );

// ================================
// FILE UPLOAD UTILITIES
// ================================

export const uploadFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/file/upload", formData);
    return response.data.data.fileUrl;
  } catch (error) {
    // throw error;
  }
};

// ================================
// KEY METRICS
// ================================

export const useKeyMetrics = () => {
  return useQuery({
    queryKey: ["keyMetrics"],
    queryFn: async () => {
      const { data } = await axios.get("/api/key-metrics");
      return data;
    },
    refetchInterval: 60 * 60 * 1000, // 1 hour
  });
};

// ================================
// AUTHENTICATION & USER MANAGEMENT
// ================================

// Get Users
export const getUsers = async (
  page?: number | null,
  search?: string,
  department?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (page) params.append("limit", RecordsPerPage.toString());
  if (department) params.append("department", department.toString());

  if (search) params.append("search", search);

  const response = await api.get(`/auth/get-users?${params.toString()}`);
  return response?.data?.data;
};

export const getTeachers = async () => {
  const response = await api.get(`/auth/teachers`);
  return response.data?.data;
};

// Add User
export const addUser = async (data: any) => {
  // Check if profilePicture exists and is a File object
  if (data.profilePicture instanceof File) {
    // Upload file and get URL
    const fileUrl = await uploadFile(data.profilePicture);
    // Replace the profilePicture field with the URL
    data.profilePicture = fileUrl;
  }

  const response = await api.post(`/auth/register`, data);
  return response?.data?.data;
};

// Update User
export const updateUser = async (id: any, data: any) => {
  // Check if profilePicture exists and is a File object
  if (data.profilePicture instanceof File) {
    // Upload file and get URL
    const fileUrl = await uploadFile(data.profilePicture);
    // Replace the profilePicture field with the URL
    data.profilePicture = fileUrl;
  }
  const response = await api.post(`/auth/update-user/${id}`, data);
  return response?.data?.data;
};

// Delete User
export const deleteUser = async (id: string) => {
  const response = await api.delete(`/auth/user/${id}`);
  return response?.data?.data;
};

// User Status Management
export const updateStatus = async (userId: any) => {
  const response = await api.post(`/auth/toggle-status`, { userId });
  return response.data;
};

export const updateTeacherStatus = async (userId: any) => {
  const response = await api.post(`/auth/add-teacher`, { userId });
  return response.data;
};

// Password Management
export const forgotPassword = async (data: { email: string }) => {
  const response = await api.post(`/auth/forgot-password`, data);
  return response.data;
};

export const resetPassword = async (data: {
  email: string;
  otp: string;
  newPassword: string;
}) => {
  const response = await api.post(`/auth/reset-password`, data);
  return response.data;
};

export const verifyOtp = async (data: { email: string; otp: string }) => {
  const response = await api.post(`/auth/verify-otp`, data);
  return response.data;
};

export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  const response = await api.post(`/auth/change-password`, data);
  return response?.data;
};

// ================================
// ADMISSIONS MANAGEMENT
// ================================

// Get Admissions
export const getAdmissions = async (
  page: number = 1,
  status?: string,
  search?: string,
  dateFrom?: string | null,
  dateTo?: string | null
) => {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("limit", RecordsPerPage.toString());

  if (status) params.append("status", status);
  if (search) params.append("search", search);
  if (dateFrom) params.append("dateFrom", dateFrom);
  if (dateTo) params.append("dateTo", dateTo);

  const response = await api.get(`/admissions?${params.toString()}`);
  return response.data;
};

export const getAdmission = async (id: string) => {
  const response = await api.get(`/admissions/${id}`);
  return response.data.data;
};

export const getAdmittedStudents = async (
  page: number = 1,
  status?: string,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("limit", RecordsPerPage.toString());

  if (status) params.append("status", status);
  if (search) params.append("search", search);

  const response = await api.get(
    `/admissions/admitted-students?${params.toString()}`
  );
  return response?.data;
};

// Update Admission Status
export const changeAdmissionStatus = async (
  id: string,
  status: string,
  remarks?: string
) => {
  const response = await api.put(`/admissions/${id}/status`, {
    status,
    remarks,
  });
  return response.data;
};

export const updateFeeStatus = async (
  id: string,
  data: {
    feePaid: number;
    discount: number;
    feeStatus: string;
    remarks: string;
  }
) => {
  const response = await api.put(`/admissions/${id}/fee-status`, data);
  return response?.data?.data;
};

// ================================
// PAGES MANAGEMENT
// ================================

// Get Pages
export const getPages = async (
  page?: number,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (page) params.append("limit", RecordsPerPage.toString());
  if (search) params.append("search", search);

  const response = await api.get(`/page${page ? `?${params.toString()}` : ""}`);
  return response?.data?.data;
};

export const getPageById = async (id: string) => {
  const response = await api.get(`/page/${id}`);
  return response.data.data;
};

// Add Page
export const addPage = async (data: any) => {
  const response = await api.post(`/page`, data);
  return response.data.data;
};

// Update Page
export const updatePage = async (id: string, data: any) => {
  const response = await api.put(`/page/${id}`, data);
  return response.data.data;
};

// Delete Page
export const deletePage = async (id: string) => {
  const response = await api.delete(`/page/${id}`);
  return response.data.data;
};

// ================================
// ACTIONS MANAGEMENT
// ================================

// Get Actions
export const getActions = async (
  page?: number,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (page) params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(
    `/action${page ? `?${params.toString()}` : ""}`
  );
  return response?.data?.data;
};

export const getActionById = async (id: string) => {
  const response = await api.get(`/action/${id}`);
  return response.data.data;
};

// Add Action
export const addAction = async (data: any) => {
  const response = await api.post(`/action`, data);
  return response.data.data;
};

// Update Action
export const updateAction = async (id: string, data: any) => {
  const response = await api.put(`/action/${id}`, data);
  return response.data.data;
};

// Delete Action
export const deleteAction = async (id: string) => {
  const response = await api.delete(`/action/${id}`);
  return response.data.data;
};

// ================================
// PERMISSIONS MANAGEMENT
// ================================

// Get Permissions
export const getPermissions = async (
  page: number = 1,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(`/permission?${params.toString()}`);
  return response?.data?.data;
};

export const getPermissionByPages = async () => {
  const response = await api.get(`/permission/page`);
  return response.data.data;
};

export const getPermissionById = async (id: string) => {
  const response = await api.get(`/permission/${id}`);
  return response.data.data;
};

// Add Permission
export const addPermission = async (data: any) => {
  const response = await api.post(`/permission`, data);
  return response.data.data;
};

export const bulkPermissions = async (data: any) => {
  const response = await api.post(`/permission/bulk`, data);
  return response.data.data;
};

// Update Permission
export const updatePermission = async (id: string, data: any) => {
  const response = await api.put(`/permission/${id}`, data);
  return response.data.data;
};

// Delete Permission
export const deletePermission = async (id: string) => {
  const response = await api.delete(`/permission/${id}`);
  return response.data.data;
};

// Assign Permissions
export const assignPermission = async (data: any) => {
  const response = await api.post(`/assign-permission`, data);
  return response.data.data;
};

// ================================
// ROLES MANAGEMENT
// ================================

// Get Roles
export const getRoles = async (
  page?: number,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (page) params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(`/roles?${params.toString()}`);
  return response?.data?.data;
};

export const getRoleById = async (id: string) => {
  const response = await api.get(`/roles/${id}`);
  return response.data.data;
};

export const getPermissionsByRole = async (id: any) => {
  const response = await api.get(`/role-permission/role/${id}`);
  return response.data.data;
};

// Add Role
export const addRole = async (data: any) => {
  const response = await api.post(`/roles`, data);
  return response.data.data;
};

// Update Role
export const updateRole = async (id: string, data: any) => {
  const response = await api.put(`/roles/${id}`, data);
  return response.data.data;
};

// Delete Role
export const deleteRole = async (id: string) => {
  const response = await api.delete(`/roles/${id}`);
  return response.data.data;
};

// Assign Role
export const assignRole = async (data: any) => {
  const response = await api.post(`/role-permission/bulk`, data);
  return response.data.data;
};

// ================================
// PROGRAMS MANAGEMENT
// ================================

// Get Programs
export const getPrograms = async (
  page?: number | null,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (page) params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(`/programs?${params.toString()}`);
  return response?.data?.data;
};

export const getProgramById = async (id: string) => {
  const response = await api.get(`/programs/${id}`);
  return response.data.data;
};

export const getProgramByTypeId = async (id: string) => {
  const response = await api.get(`/programs/type/${id}`);
  return response.data.data;
};

// Add Program
export const addProgram = async (data: any) => {
  const response = await api.post(`/programs`, data);
  return response.data.data;
};

// Update Program
export const updateProgram = async (id: string, data: any) => {
  const response = await api.put(`/programs/${id}`, data);
  return response.data.data;
};

// Delete Program
export const deleteProgram = async (id: string) => {
  const response = await api.delete(`/programs/${id}`);
  return response.data.data;
};

// ================================
// PROGRAM TYPES MANAGEMENT
// ================================

// Get Program Types
export const getProgramTypes = async (
  page?: number,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (page) params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(`/program-types?${params.toString()}`);
  return response?.data?.data;
};

// ================================
// DEPARTMENTS MANAGEMENT
// ================================

// Get Departments
export const getDepartments = async (
  page?: number | null,
  search?: string,
  status?: boolean
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (status) params.append("status", status.toString());
  if (page) params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(`/department?${params.toString()}`);
  return response?.data?.data;
};

// Add Department
export const addDepartment = async (data: any) => {
  const response = await api.post(`/department`, data);
  return response.data.data;
};

// Update Department
export const updateDepartment = async (id: string, data: any) => {
  const response = await api.put(`/department/${id}`, data);
  return response.data.data;
};

export const updateDepartmentStatus = async (id: any) => {
  const response = await api.post(`/department/toggle-status`, { id });
  return response.data;
};

// Delete Department
export const deleteDepartment = async (id: string) => {
  const response = await api.delete(`/department/${id}`);
  return response.data.data;
};

// ================================
// SESSIONS MANAGEMENT
// ================================

// Get Sessions
export const getSessions = async (
  page?: number | null,
  search?: string,
  status?: boolean
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (status) params.append("status", status.toString());
  if (page) params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(
    `/session${page ? `?${params.toString()}` : ""}`
  );
  return response?.data?.data;
};

// Add Session
export const addSession = async (data: any) => {
  const response = await api.post(`/session`, data);
  return response.data.data;
};

// Update Session
export const updateSession = async (id: string, data: any) => {
  const response = await api.put(`/session/${id}`, data);
  return response.data.data;
};

// Delete Session
export const deleteSession = async (id: string) => {
  const response = await api.delete(`/session/${id}`);
  return response.data.data;
};

// ================================
// SEMESTERS MANAGEMENT
// ================================

// Get Semesters
export const getSemester = async (
  page?: number | null,
  search?: string,
  status?: boolean
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (status) params.append("status", status.toString());
  if (page) params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(`/semester?${params.toString()}`);
  return response?.data?.data;
};

export const getGroupedSemester = async (
  page?: number | null,
  search?: string,
  status?: boolean
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (status) params.append("status", status.toString());
  if (page) params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(`/semester/grouped?${params.toString()}`);
  return response?.data?.data;
};

export const getSemesterByProgramAndSession = async (
  programId: string,
  sessionId: string
) => {
  const params = new URLSearchParams();
  params.append("programId", programId);
  params.append("sessionId", sessionId);
  const response = await api.get(`/semester?${params.toString()}`);
  return response.data.data;
};

// Add Semester
export const addSemester = async (data: any) => {
  const response = await api.post(`/semester`, data);
  return response.data.data;
};

export const addBulkSemester = async (data: any) => {
  const response = await api.post(`/semester/bulk`, data);
  return response.data.data;
};

// Update Semester
export const updateSemester = async (id: string, data: any) => {
  const response = await api.put(`/semester/${id}`, data);
  return response.data.data;
};

// Delete Semester
export const deleteSemester = async (id: string) => {
  const response = await api.delete(`/semester/${id}`);
  return response.data.data;
};

// ================================
// SUBJECTS MANAGEMENT
// ================================

// Get Subjects
export const getSubject = async (
  page?: number | null,
  search?: string,
  status?: boolean
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (status) params.append("status", status.toString());
  if (page) params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(`/subject?${params.toString()}`);
  return response?.data?.data;
};

export const getSubjectsByProgramId = async (programId: string) => {
  const response = await api.get(`/subject/program/${programId}`);
  return response.data.data;
};

// Add Subject
export const addSubject = async (data: any) => {
  const response = await api.post(`/subject`, data);
  return response.data.data;
};

// Update Subject
export const updatesubject = async (id: string, data: any) => {
  const response = await api.put(`/subject/${id}`, data);
  return response.data.data;
};

// Delete Subject
export const deleteSubject = async (id: string) => {
  const response = await api.delete(`/subject/${id}`);
  return response.data.data;
};

// Assign Subjects
export const assignSubjects = async (data: any) => {
  const response = await api.post(`class-subjects`, data);
  return response.data;
};

export const getAssignedSubjects = async (
  programId: any,
  sessionId: any,
  semester: any
) => {
  const response = await api.get(
    `class-subjects?programId=${programId}&sessionId=${sessionId}&semester=${semester}`
  );
  return response?.data?.data;
};

// ================================
// SECTIONS MANAGEMENT
// ================================

// Get Sections
export const getSections = async (
  page?: number | null,
  search?: string,
  status?: boolean | null
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (status) params.append("status", status.toString());
  if (page) params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(`/section?${params.toString()}`);
  return response?.data?.data;
};

export const getSectionsBySemesterId = async (semesterId: any) => {
  const response = await api.get(`section/semester/${semesterId}`);
  return response?.data?.data;
};

// Add Section
export const addSections = async (data: any) => {
  const response = await api.post(`/section`, data);
  return response.data.data;
};

// Update Section
export const updateSections = async (id: string, data: any) => {
  const response = await api.put(`/section/${id}`, data);
  return response.data.data;
};

// Delete Section
export const deleteSections = async (id: string) => {
  const response = await api.delete(`/section/${id}`);
  return response.data.data;
};

// ================================
// DESIGNATIONS MANAGEMENT
// ================================

// Get Designations
export const getDesignations = async (
  page?: number | null,
  search?: string,
  status?: boolean
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (status) params.append("status", status.toString());
  if (page) params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(`/designation?${params.toString()}`);
  return response?.data?.data;
};

// Add Designation
export const addDesignation = async (data: any) => {
  const response = await api.post(`/designation`, data);
  return response.data.data;
};

// Update Designation
export const updateDesignation = async (id: string, data: any) => {
  const response = await api.put(`/designation/${id}`, data);
  return response.data.data;
};

export const updateDesignationStatus = async (id: any) => {
  const response = await api.post(`/designation/toggle-status`, { id });
  return response.data;
};

// Delete Designation
export const deleteDesignation = async (id: string) => {
  const response = await api.delete(`/designation/${id}`);
  return response.data.data;
};

// ================================
// STUDENTS MANAGEMENT
// ================================

// Get Students
export const getStudents = async (
  page?: number | null,
  search?: string | null,
  department?: string | null,
  studentClass?: {
    programId: number;
    sessionId: number;
    sectionId: number;
    semester: number;
  }
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (page) params.append("limit", RecordsPerPage.toString());
  if (department) params.append("department", department.toString());
  if (studentClass) {
    params.append("programId", studentClass.programId.toString());
    params.append("sessionId", studentClass.sessionId.toString());
    params.append("sectionId", studentClass.sectionId.toString());
    params.append("semester", studentClass.semester.toString());
  }

  if (search) params.append("search", search);

  const response = await api.get(`/student?${params.toString()}`);
  return response?.data?.data;
};

// Add Student
export const addStudent = async (data: any) => {
  const response = await api.post(`/student`, data);
  return response.data.data;
};

// Update Student
export const updateStudent = async (id: string, data: any) => {
  const response = await api.put(`/student/${id}`, data);
  return response.data.data;
};

// Bulk Operations
export const bulkAssignClass = async (data: any) => {
  const response = await api.post(`/student/assign-session`, data);
  return response.data.data;
};

export const promoteStudents = async (data: any) => {
  const response = await api.post(`/student/promote`, data);
  return response.data.data;
};

export const getStudentByClass = async (data: any) => {
  const response = await api.get(`/student/class`, { params: data });
  return response.data.data;
};

// ================================
// LEAVE MANAGEMENT
// ================================

// Get Leaves
export const getUserLeaves = async () => {
  const response = await api.get(`/user-leave`);
  return response?.data;
};

export const getAppliedLeaves = async (
  page?: number | null,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (page) params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(`/leave/user-leave?${params.toString()}`);
  return response?.data?.data;
};

export const getAssignedLeaves = async (
  page?: number | null,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  if (page) params.append("page", page.toString());
  if (page) params.append("limit", RecordsPerPage.toString());

  if (search) params.append("search", search);

  const response = await api.get(`/leave/assigned?${params.toString()}`);
  return response?.data?.data;
};

// Apply Leave
export const applyLeave = async (data: any) => {
  const response = await api.post("/leave/apply", data);
  return response.data;
};

// Leave Action
export const leaveAction = async (id: number, data: any) => {
  const response = await api.post(`/leave/update-leave/${id}`, data);
  return response.data;
};

// ================================
// FEE MANAGEMENT
// ================================

// Get Fee Records
export const getFeeRecords = async (
  page: number = 1,
  status?: string,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("limit", RecordsPerPage.toString());

  if (status) params.append("status", status);
  if (search) params.append("search", search);

  const response = await api.get(`/fee-record?${params.toString()}`);
  return response?.data;
};

export const getFeeRecordById = async (feeId: any) => {
  const response = await api.get(`/fee-record/${feeId}`);
  return response.data.data;
};

// Update Fee Record
export const updateFeeRecord = async (feeId: any, data: any) => {
  const response = await api.put(`/fee-record/${feeId}`, data);
  return response.data.data;
};

// Update Fee Record class
export const updateFeeRecordClass = async (feeId: any, data: any) => {
  const response = await api.put(`/fee-record/class/${feeId}`, data);
  return response.data.data;
};

export const skipDiscount = async (feeId: any) => {
  const response = await api.put(`/fee-record/skip/${feeId}`, {});
  return response.data.data;
};

// ================================
// DISCOUNT REQUESTS MANAGEMENT
// ================================

// Get Discount Requests
export const getDiscountRequests = async (
  page: number = 1,
  status?: string,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("limit", RecordsPerPage.toString());

  if (status) params.append("status", status);
  if (search) params.append("search", search);

  const response = await api.get(`/discount-request?${params.toString()}`);
  return response?.data;
};

export const checkDiscountRequest = async (feeId: any) => {
  const response = await api.get(`/discount-request/check/${feeId}`);
  return response.data.data;
};

// Create Discount Request
export const createDiscountRequest = async (data: any) => {
  const response = await api.post(`/discount-request/`, data);
  return response.data.data;
};

// Approve/Reject Discount
export const approveDiscount = async (data: any) => {
  const response = await api.patch(`/discount-request/approve`, data);
  return response.data.data;
};

export const rejectDiscount = async (data: any) => {
  const response = await api.patch(`/discount-request/reject`, data);
  return response.data.data;
};

// ================================
// INSTALLMENT REQUESTS MANAGEMENT
// ================================

// Get Installment Requests
export const getInstallmentRequests = async (
  page: number = 1,
  status?: string,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("limit", RecordsPerPage.toString());

  if (status) params.append("status", status);
  if (search) params.append("search", search);

  const response = await api.get(`/installment-request?${params.toString()}`);
  return response?.data;
};

export const getInstallmentRequestById = async (id: any) => {
  const response = await api.get(`/installment-request/${id}`);
  return response.data.data;
};

export const getAllInstallmentAgainstFeeId = async (id: any) => {
  const response = await api.get(`/installment/fee/${id}`);
  return response.data.data;
};

// Create Installment Request
export const createInstallmentRequest = async (data: any) => {
  const response = await api.post(`/installment-request/`, data);
  return response.data.data;
};

// Approve/Reject Installments
export const approveInstallments = async (data: any) => {
  const response = await api.post(`/installment`, data);
  return response.data.data;
};

export const rejectInstallments = async (data: any) => {
  const response = await api.patch(`/installment-request/reject`, data);
  return response.data.data;
};

export const updateFeeInstallmentStatus = async (data: any) => {
  const response = await api.post(`/installment/mark-as-paid`, data);
  return response.data.data;
};

// ================================
// ANNOUNCEMENTS MANAGEMENT
// ================================

export type Announcement = {
  id: number | string;
  title: string;
  content: string;
  priority: "high" | "medium" | "low";
  createdBy?: string;
  author?: string;
  createdAt?: string;
  date?: string;
  programId?: number | null;
  sessionId?: number | null;
  sectionId?: number | null;
  semester?: number | null;
  creator?: {
    id: string;
    name: string;
    email?: string;
  };
};

// Get Announcements
export const getAllAnnouncements = async (
  page: number = 1
): Promise<Announcement[]> => {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("limit", RecordsPerPage.toString());

  const response = await api.get(`/announcement?${params.toString()}`);

  const announcements = response?.data?.data?.announcements;

  return Array.isArray(announcements) ? announcements : [];
};

// Post Announcement
export const postAllAnnouncements = async (data: any) => {
  const response = await api.post(`/announcement`, data);
  return response.data.data;
};

export const deleteAnnouncement = async (id: string) => {
  const response = await api.delete(`/announcement/${id}`);
  return response.data.data;
};

export const updateAnnouncement = async (id: string, data: any) => {
  const response = await api.put(`/announcement/${id}`, data);
  return response.data.data;
};

// ================================
// QUIZ MANAGEMENT
// ================================

// Get Quizzes
export const getAllQuizzes = async (
  page: number = 1,
  status?: string,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("limit", RecordsPerPage.toString());

  if (status) params.append("status", status);
  if (search) params.append("search", search);

  const response = await api.get(`/quiz?${params.toString()}`);
  return response?.data?.data;
};

export const getQuizById = async (quizId: any) => {
  const response = await api.get(`/quiz/${quizId}`);
  return response.data.data;
};

// Create Quiz
export const createQuiz = async (data: any) => {
  const response = await api.post(`/quiz`, data);
  return response.data.data;
};

// Update Quiz
export const updateQuiz = async (quizId: any, data: any) => {
  const response = await api.put(`/quiz/${quizId}`, data);
  return response.data.data;
};

// Submit Quiz
export const submitQuiz = async (data: any) => {
  const response = await api.post(`/quiz-submission/submit`, data);
  return response.data.data;
};

export const getQuizSubmissionByTeacher = async () => {
  const response = await api.get(`/quiz-submission/teacher/submissions`);
  return response.data.data;
};

export const gradeQuiz = async (submissionId: any, data: any) => {
  const response = await api.patch(`/quiz-submission/grade/${submissionId}`, {
    score: data.score,
    feedback: data.feedback,
    answers: data.answers, // Include detailed answers with individual scores
  });
  return response.data.data;
};

// ================================
// ASSIGNMENTS MANAGEMENT
// ================================

// Get Assignments
export const getAllAssignments = async (
  page: number = 1,
  status?: string,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("limit", RecordsPerPage.toString());

  if (status) params.append("status", status);
  if (search) params.append("search", search);

  const response = await api.get(`/assignment?${params.toString()}`);
  return response?.data?.data;
};

export const getAssignmentById = async (assignmentId: any) => {
  const response = await api.get(`/assignment/${assignmentId}`);
  return response.data.data;
};

// Create Assignment
export const createAssignment = async (data: any) => {
  const response = await api.post(`/assignment`, data);
  return response.data.data;
};

// Update Assignment
export const updateAssignment = async (assignmentId: any, data: any) => {
  const response = await api.put(`/assignment/${assignmentId}`, data);
  return response.data.data;
};

// Submit Assignment
export const submitAssignment = async (data: any) => {
  const response = await api.post(`/assignment-submission/submit`, data);
  return response.data.data;
};
export const getAssignmentSubmissionByTeacher = async () => {
  const response = await api.get(`/assignment-submission/teacher/submissions`);
  return response.data.data;
};

export const gradeAssignment = async (submissionId: any, data: any) => {
  const response = await api.patch(
    `/assignment-submission/grade/${submissionId}`,
    data
  );
  return response.data.data;
};

// ================================
// STUDY MATERIALS MANAGEMENT
// ================================

// Get Study Materials
export const getAllStudyMaterials = async (
  page: number = 1,
  status?: string,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("limit", RecordsPerPage.toString());

  if (status) params.append("status", status);
  if (search) params.append("search", search);

  const response = await api.get(`/study-material?${params.toString()}`);
  return response?.data?.data;
};

export const getStudyMaterialById = async (studyMaterialId: any) => {
  const response = await api.get(`/study-material/${studyMaterialId}`);
  return response.data.data;
};

// Create Study Material
export const createStudyMaterial = async (data: any) => {
  const response = await api.post(`/study-material`, data);
  return response.data.data;
};

// Update Study Material
export const updateStudyMaterial = async (studyMaterialId: any, data: any) => {
  const response = await api.put(`/study-material/${studyMaterialId}`, data);
  return response.data.data;
};

// Delete Study Material
export const deleteStudyMaterial = async (studyMaterialId: any) => {
  const response = await api.delete(`/study-material/${studyMaterialId}`);
  return response.data.data;
};

// ================================
// TIMETABLE MANAGEMENT
// ================================

// Get Timetable
export const getTimetableByClass = async (
  programId: number,
  sessionId: number,
  sectionId: number,
  semester: number
) => {
  const response = await api.get(
    `/time-table/class?programId=${programId}&sessionId=${sessionId}&sectionId=${sectionId}&semester=${semester}`
  );
  return response.data.data;
};

export const getTimetableByStudent = async () => {
  const response = await api.get(`/time-table/student`);
  return response.data.data;
};

export const assignedClasses = async () => {
  const response = await api.get(`/time-table/assigned`);
  return response.data.data;
};

export const classesbyTeacher = async () => {
  const response = await api.get(`/time-table/classes/teacher`);
  return response.data.data;
};

// Create Timetable Entry
export const createTimetableEntry = async (data: any) => {
  const response = await api.post(`/time-table`, data);
  return response.data.data;
};

// Update Timetable Entry
export const updateTimetableEntry = async (timetableId: any, data: any) => {
  const response = await api.put(`/time-table/${timetableId}`, data);
  return response.data.data;
};

// Delete Timetable Entry
export const deleteTimetableEntry = async (timetableId: any) => {
  const response = await api.delete(`/time-table/${timetableId}`);
  return response.data.data;
};

// ================================
// ATTENDANCE MANAGEMENT
// ================================

// Get Attendance
export const getAttendance = async (data: any) => {
  const response = await api.get(`/student-attendance`, { params: data });
  return response.data.data;
};

// Submit Attendance
export const submitAttendance = async (data: any) => {
  const response = await api.post(`/student-attendance`, data);
  return response.data.data;
};

// Update Attendance
export const updateAttendance = async (id: any, data: any) => {
  const response = await api.put(`/student-attendance/${id}`, data);
  return response.data.data;
};

// ================================
// Scholarship Request
// ================================

// Get Scholarship Requests
export const getScholarshipRequests = async (
  page: number = 1,
  status?: string,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams();

  params.append("page", page.toString());
  params.append("limit", RecordsPerPage.toString());

  if (status) params.append("status", status);
  if (search) params.append("search", search);

  const response = await api.get(`/scholarship-request?${params.toString()}`);
  return response?.data?.data;
};

export const createScholarshipRequest = async (data: any) => {
  const response = await api.post(`/scholarship-request`, data);
  return response.data.data;
};

export const getScholarshipRequestById = async (id: any) => {
  const response = await api.get(`/scholarship-request/check/${id}`);
  return response.data.data;
};

// Approve/Reject scholarship
export const approveScholarship = async (data: any) => {
  const response = await api.patch(`/scholarship-request/approve`, data);
  return response.data.data;
};

export const rejectScholarship = async (data: any) => {
  const response = await api.patch(`/scholarship-request/reject`, data);
  return response.data.data;
};

// ================================
// DASHBOARD
// ================================

export const getDashboardStats = async () => {
  const response = await api.get(`/dashboard`);
  return response?.data?.data;
};

export const getApplicationTrends = async (): Promise<any[]> => {
  const response = await api.get(`/dashboard/application-trends`);
  return response?.data?.data;
};

export const getEnrollmentTrends = async (): Promise<any[]> => {
  const response = await api.get(`/dashboard/enrollment-trends-per-program`);
  return response?.data?.data;
};

export const getProgramDistribution = async (): Promise<any[]> => {
  const response = await api.get(`/dashboard/program-distribution`);
  return response?.data?.data;
};

export const getRevenueTrends = async (): Promise<any[]> => {
  const response = await api.get(`/dashboard/yearly-revenue-trends`);
  return response?.data?.data;
};

// ================================
// CONTACTS
// ================================

export const getContacts = async () => {
  const response = await api.get(`/contact`);
  return response?.data?.data;
};

export const checkCnic = async (cnic: string) => {
  const response = await api.get(`/user/cnic/${cnic}`);
  return response?.data?.data?.exists;
};
