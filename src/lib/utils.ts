import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { classesbyTeacher } from "./api/ApiFunctions"
import Cookies from "js-cookie";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageFileUrl(url: string) {
  if (url?.startsWith("http")) {
    return url
  }
  if(url==null)  return null
   
  return `${process.env.NEXT_PUBLIC_IMAGE_URL}/${url}`
}



export const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      "pending": "bg-yellow-500/20 text-yellow-600",
      "approved": "bg-green-500/20 text-green-600",
      "rejected": "bg-red-500/20 text-red-600",
      "under-review": "bg-blue-500/20 text-blue-600",
       "confirmed": "bg-green-500/20 text-green-600",
    }
    return variants[status] || "bg-gray-500/20 text-gray-600"
  }


    export function getFirstLetters(str: string) {
  if (!str || !str.trim()) return "LU";

  const words = str.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0][0] + "U";
  }

  return words[0][0] + words[1][0];
}




  export const getAssignedClass = async ({
  programId,
  sessionId,
  sectionId,
  semester,
}: any) => {
  try {
    // fetch all assigned classes
    const assignedClasses = await classesbyTeacher();

    // find matching record
    const matchedClass = assignedClasses?.find(
      (item: any) =>
        item.data.programId === programId &&
        item.data.sessionId === sessionId &&
        item.data.sectionId === sectionId &&
        item.data.semester === semester
    );

    return { matchedClass, assignedClasses, success: true };
  } catch (error) {
    console.error("Error fetching assigned classes:", error);
    return { matchedClass: null, assignedClasses: [], success: false, error };
  }
};


export const clearCookies = () => {
  Cookies.remove("programId");
    Cookies.remove("sessionId");
    Cookies.remove("sectionId");
    Cookies.remove("semester");
    Cookies.remove("selectedClassName");
    Cookies.remove("type");
}


