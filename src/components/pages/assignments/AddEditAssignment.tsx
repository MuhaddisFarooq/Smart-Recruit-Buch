"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getAssignedSubjects,
  getPrograms,
  getSections,
  getSessions,
  getSubjectsByProgramId,
} from "@/lib/api/ApiFunctions";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { useClassStore } from "@/store/useClassStore";
import { useAssignedClass } from "@/store/useSelectedClass";
import { getAssignedClass } from "@/lib/utils";

export default function AddEditAssignment({
  isDialogOpen,
  setIsDialogOpen,
  handleSubmit,
  initialData,
}: any) {
  const { programId, sessionId, sectionId, semester, setClassData } =
    useClassStore();
  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setAssignment({
        title: initialData.title || "",
        description: initialData.description || "",
        points: initialData.points || 0,
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split("T")[0]
          : "",
        subjectId: initialData.subjectId?.toString() || "",
      });
    } else if (!isDialogOpen) {
      // Reset form when dialog closes
      setAssignment({
        title: "",
        description: "",
        points: 0,
        dueDate: "",
        subjectId: "",
      });
    }
  }, [initialData, isDialogOpen]);

  const [assignment, setAssignment] = useState<any>(() => {
    if (initialData) {
      getAssignedClass({
        programId: initialData.programId,
        sessionId: initialData.sessionId,
        sectionId: initialData.sectionId,
        semester: initialData.semester,
      }).then(({ matchedClass }) => {
        setClassData({
          programId: initialData.programId,
          sessionId: initialData.sessionId,
          sectionId: initialData.sectionId,
          semester: initialData.semester,
          selectedClassName: matchedClass?.className,
          type: matchedClass?.type,
        });
      });

      return {
        title: initialData.title || "",
        description: initialData.description || "",
        points: initialData.points || 0,
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split("T")[0]
          : "",
        subjectId: initialData.subjectId?.toString() || "",
      };
    } else {
      return {
        title: "",
        description: "",
        points: 0,
        dueDate: "",
        subjectId: "",
      };
    }
  });

  const { data: session }: any = useSession();

  // const { data: programs }: any = useQuery({
  //   queryKey: ["programs"],
  //   queryFn: () => getPrograms(null, ""),
  // });

  // const { data: sessions }: any = useQuery({
  //   queryKey: ["sessions"],
  //   queryFn: () => getSessions(null, ""),
  // });

  // const { data: sections }: any = useQuery({
  //   queryKey: ["sections"],
  //   queryFn: () => getSections(null, "", null),
  // });

  const { data: subjects }: any = useQuery({
    queryKey: ["assignedSubjects", programId],
    queryFn: () => getSubjectsByProgramId(programId as any),
    enabled: !!session && !!(programId),
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = () => {
    // Validate required fields
    if (
      !assignment.title ||
      !assignment.description ||
      !assignment.dueDate ||
      !assignment.subjectId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Prepare payload for submission
    const payload = {
      title: assignment.title,
      description: assignment.description,
      points: parseInt(assignment.points) || 0,
      dueDate: assignment.dueDate,
      programId: programId,
      sessionId: sessionId,
      semester: semester,
      sectionId: sectionId,
      subjectId: parseInt(assignment.subjectId),
      file: selectedFile, // Pass single file to parent for upload handling
    };

    handleSubmit(payload);
    setIsDialogOpen(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {initialData ? "Edit Assignment" : "Create New Assignment"}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4 p-5 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter assignment title"
                value={assignment.title}
                onChange={(e) =>
                  setAssignment({ ...assignment, title: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter assignment description"
                value={assignment.description}
                onChange={(e) =>
                  setAssignment({ ...assignment, description: e.target.value })
                }
                required
              />
            </div>

            {/* Subject Select */}
            <div className="flex flex-col space-y-1">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={assignment.subjectId?.toString() || ""}
                onValueChange={(value) =>
                  setAssignment((prev: any) => ({
                    ...prev,
                    subjectId: value,
                  }))
                }
                // disabled={!assignment.semester}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((subject: any) => (
                    <SelectItem
                      key={subject?.id}
                      value={subject?.id?.toString()}
                    >
                      {subject?.code} - {subject?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={assignment.points}
                  onChange={(e) =>
                    setAssignment({
                      ...assignment,
                      points: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={assignment.dueDate}
                onChange={(e) =>
                  setAssignment({ ...assignment, dueDate: e.target.value })
                }
                required
              />
            </div>

            {/* File Attachment */}
            <div className="space-y-3">
              <Label>Attachment (Optional)</Label>

              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      Click to upload file
                    </span>
                    <span className="text-sm text-gray-500">
                      {" "}
                      or drag and drop
                    </span>
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, TXT, images (max 10MB)
                  </p>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </form>
          <DialogFooter>
            <Button onClick={handleAction} className="w-full">
              {initialData ? "Update Assignment" : "Create Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
