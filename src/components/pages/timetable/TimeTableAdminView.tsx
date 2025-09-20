"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  createTimetableEntry,
  getTimetableByClass,
  updateTimetableEntry,
  deleteTimetableEntry,
  getTeachers,
  getSubjectsByProgramId,
  getProgramTypes,
  getProgramById,
  getProgramByTypeId,
} from "@/lib/api/ApiFunctions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, LayoutGrid, Table2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPrograms, getSections, getSessions } from "@/lib/api/ApiFunctions";
import { toast } from "sonner";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { permissionsDef, programTypes } from "@/lib/constants";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_SLOTS = Array.from({ length: ((20 - 8) * 60) / 15 }, (_, i) => {
  const totalMins = 8 * 60 + i * 15;
  const hours = Math.floor(totalMins / 60)
    .toString()
    .padStart(2, "0");
  const mins = (totalMins % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
});

const TYPE_COLORS = {
  lecture: "bg-blue-100 text-blue-800 border-blue-200",
  lab: "bg-green-100 text-green-800 border-green-200",
  tutorial: "bg-purple-100 text-purple-800 border-purple-200",
  exam: "bg-red-100 text-red-800 border-red-200",
};

interface TimetableEntry {
  id: string;
  subjectId: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  teacherId: number;
  programId: number;
  sessionId: number;
  sectionId: number;
  semester: number;
  type: "lecture" | "lab" | "tutorial" | "exam";
}

const mockTeachers = [
  { id: 1, name: "Dr. Smith" },
  { id: 2, name: "Prof. Johnson" },
];

export default function TimeTableAdminView() {
  const queryClient = useQueryClient();
    const permissions = usePagePermissions("/timetable");
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [formData, setFormData] = useState<Partial<TimetableEntry>>({
    type: "lecture",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [editData, setEditData] = useState<Partial<TimetableEntry> | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [classData, setClassData] = useState<any>({
    programTypeId: null,
    programId: null,
    sessionId: null,
    sectionId: null,
    semester: null,
  });

  
  // Utility to normalize time to "HH:mm"
  function normalizeTime(t: string) {
    if (!t) return "";
    const [h, m] = t.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  }

  // create class mutation
  const createTimetableMutation = useMutation({
    mutationFn: createTimetableEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "timetableData",
          classData.programId,
          classData.sessionId,
          classData.sectionId,
          classData.semester,
        ],
      });
      toast.success("Timetable entry created successfully");
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create timetable entry");
    },
  });

  // EDIT mutation
  const updateTimetableMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimetableEntry> }) =>
      updateTimetableEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "timetableData",
          classData.programId,
          classData.sessionId,
          classData.sectionId,
          classData.semester,
        ],
      });
      toast.success("Timetable entry updated successfully");
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update timetable entry");
    },
  });

  // DELETE mutation
  const deleteTimetableMutation = useMutation({
    mutationFn: (id: string) => deleteTimetableEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "timetableData",
          classData.programId,
          classData.sessionId,
          classData.sectionId,
          classData.semester,
        ],
      });
      toast.success("Timetable entry deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete timetable entry");
    },
  });

    // Fetch programs
  const { data: programType }: any = useQuery({
    queryKey: ["program-types"],
    queryFn: () => getProgramTypes(),
  });

  // Fetch programs
  const { data: programs }: any = useQuery({
    queryKey: ["programs-timetable", classData?.programTypeId],
    queryFn: () => getProgramByTypeId(classData?.programTypeId),
    enabled: !!classData?.programTypeId,
  });


  // Fetch Subjects by programs
  const { data: subjects }: any = useQuery({
    queryKey: ["subjects", classData.programId],
    queryFn: () => getSubjectsByProgramId(classData.programId),
    enabled: !!classData.programId,
  });

  // Fetch sessions
  const { data: sessions }: any = useQuery({
    queryKey: ["sessions"],
    queryFn: () => getSessions(null, ""),
  });

  // Fetch sections
  const { data: sections }: any = useQuery({
    queryKey: ["sections"],
    queryFn: () => getSections(null, "", null),
  });

  // Fetch teachers
  const { data: teachers }: any = useQuery({
    queryKey: ["teachers"],
    queryFn: () => getTeachers(),
  });


  const { data: timetableData }: any = useQuery({
    queryKey: [
      "timetableData",
      classData.programId,
      classData.sessionId,
      classData.sectionId,
      classData.semester,
    ],
    queryFn: () =>
      getTimetableByClass(
        classData.programId,
        classData.sessionId,
        classData.sectionId,
        classData.semester
      ),
    enabled: programType?.find((p: any) => p.id == classData?.programTypeId)?.name === programTypes.Program ?
     (!!classData.programId &&
      !!classData.sessionId &&
      !!classData.sectionId &&
      !!classData.semester) : !!classData.programId
  });


    useEffect(() => {
    if (timetableData) {
      setEntries(
        timetableData.map((entry: any) => ({
          id: entry.id,
          subjectId: entry.subjectId,
          day: entry.day,
          startTime: normalizeTime(entry.startTime),
          endTime: normalizeTime(entry.endTime),
          room: entry.room,
          teacherId: entry.teacherId,
          programId: entry.programId,
          sessionId: entry.sessionId,
          sectionId: entry.sectionId,
          semester: entry.semester,
          type: entry.type,
        }))
      );
    }
  }, [timetableData]);


  const handleSubmit = () => {
    const { subjectId, day, startTime, endTime, room, teacherId, type } =
      formData;

    if (!subjectId || !day || !startTime || !endTime || !teacherId) {
      alert("Please fill in required fields.");
      return;
    }

    const newEntry: TimetableEntry = {
      id: Date.now().toString(),
      subjectId,
      day,
      startTime,
      endTime,
      room: room || "",
      teacherId,
      programId: classData.programId!,
      sessionId: classData.sessionId!,
      sectionId: classData.sectionId!,
      semester: classData.semester!,
      type: type as any,
    };

    const payload = {
      subjectId: newEntry.subjectId,
      day: newEntry.day,
      startTime: newEntry.startTime,
      endTime: newEntry.endTime,
      room: newEntry.room,
      teacherId: newEntry.teacherId,
      programId: classData.programId,
      sessionId: classData.sessionId,
      sectionId: classData.sectionId,
      semester: classData.semester,
      type: newEntry.type,
    };

    createTimetableMutation.mutate(payload);

    setEntries([...entries, newEntry]);
    setFormData({ type: "lecture" });
    setIsDialogOpen(false);
  };

  const getEntryAtTime = (day: string, time: string) =>
    entries.find(
      (e) =>
        e.day === day &&
        normalizeTime(time) >= normalizeTime(e.startTime) &&
        normalizeTime(time) < normalizeTime(e.endTime)
    );

  useEffect(() => {
    console.log("enteries", entries);
  }, [entries]);

  // Helper for Card View: group entries by day
  const entriesByDay = DAYS.map((day) => ({
    day,
    entries: entries
      .filter((e) => e.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  const handleEdit = (entry: TimetableEntry) => {
    setEditData(entry);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editData) return;
    // Call mutation for backend update
    updateTimetableMutation.mutate({
      id: editData.id as string,
      data: {
        subjectId: editData.subjectId,
        day: editData.day,
        startTime: editData.startTime,
        endTime: editData.endTime,
        room: editData.room,
        teacherId: editData.teacherId,
        type: editData.type,
      },
    });
    // Optionally update local state for instant UI feedback
    setEntries((prev) =>
      prev.map((e) => (e.id === editData.id ? { ...e, ...editData } : e))
    );
    setIsEditDialogOpen(false);
    setEditData(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this entry?")) {
      deleteTimetableMutation.mutate(id);
      // Optionally update local state for instant UI feedback
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  if(!permissions?.includes(permissionsDef.get)){
    return <div>You do not have permission to view Timetable</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Timetable Management</h2>
          <p className="text-muted-foreground">Create and view your schedule</p>
        </div>
        <div className="flex gap-2">
          {/* Class Selection Dialog */}
          {permissions?.includes(permissionsDef.add) && (
            <>
          <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Select Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Class</DialogTitle>
                <DialogDescription>
                  Choose the class details below
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">

                   <Label>Type</Label>
                <Select
                  value={classData.programTypeId?.toString()}
                  onValueChange={(v) =>
                    setClassData((p: any) => ({ ...p, programTypeId: parseInt(v) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {programType?.map((program: any) => (
                      <SelectItem
                        key={program.id}
                        value={program.id.toString()}
                      >
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Program */}
                <Label>Program</Label>
                <Select
                  value={classData.programId?.toString()}
                  onValueChange={(v) =>
                    setClassData((p: any) => ({ ...p, programId: parseInt(v) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs?.map((program: any) => (
                      <SelectItem
                        key={program.id}
                        value={program.id.toString()}
                      >
                        {program.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              {classData?.programTypeId && programType?.find((p: any) => p.id == classData?.programTypeId)?.name === programTypes.Program && (
                <>
                  {/* Session */}
                  <Label>Session</Label>
                  <Select
                    value={classData.sessionId?.toString()}
                    onValueChange={(v) =>
                    setClassData((p: any) => ({ ...p, sessionId: parseInt(v) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions?.map((session: any) => (
                      <SelectItem
                        key={session.id}
                        value={session.id.toString()}
                      >
                        {session.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Section */}
                <Label>Section</Label>
                <Select
                  value={classData.sectionId?.toString()}
                  onValueChange={(v) =>
                    setClassData((p: any) => ({ ...p, sectionId: parseInt(v) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections?.map((section: any) => (
                      <SelectItem
                        key={section.id}
                        value={section.id.toString()}
                      >
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Semester */}
                <Label>Semester</Label>
                <Select
                  value={classData.semester?.toString()}
                  onValueChange={(v) =>
                    setClassData((p: any) => ({ ...p, semester: parseInt(v) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {new Array(
                        programs?.find(
                          (p: any) => p.id == formData.programId
                        )?.totalSemesters
                      )
                        .fill(null)
                        ?.map((semester: any, index) => (
                          <SelectItem
                            key={index}
                            value={(index + 1).toString()}
                          >
                            {index + 1}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                </>)}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Timetable Entry</DialogTitle>
                <DialogDescription>Fill in the details below</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 max-h-96 overflow-y-auto p-2">
                {/* Subject */}
                <Label>Subject</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, subjectId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label>Room</Label>
                <Input
                  placeholder="Room"
                  value={formData.room || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, room: e.target.value }))
                  }
                />

                <Label>Day</Label>
                <Select
                  value={formData.day}
                  onValueChange={(v) => setFormData((p) => ({ ...p, day: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={formData.startTime}
                    onValueChange={(v) =>
                      setFormData((p) => ({ ...p, startTime: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Start Time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.endTime}
                    onValueChange={(v) =>
                      setFormData((p) => ({ ...p, endTime: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="End Time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Teacher */}
                <Label>Teacher</Label>
                <Select
                  value={formData.teacherId?.toString()}
                  onValueChange={(v) =>
                    setFormData((p: any) => ({ ...p, teacherId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers?.map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Type */}
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, type: v as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lecture">Lecture</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>

                <Button className="w-full" onClick={handleSubmit}>
                  Add Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </>
          )}
        </div>
      </div>

      {/* Toggle Table/Card View */}
      <div className="flex justify-end mb-2">
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">View:</span>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
            aria-label="Table View"
          >
            <Table2 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("card")}
            aria-label="Card View"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead>
                  <tr>
                    <th className="p-2 border">Time</th>
                    {DAYS.map((d) => (
                      <th key={d} className="p-2 border text-center">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* FIX: Move renderedCells outside the row mapping */}
                  {(() => {
                    const renderedCells = new Set();
                    return TIME_SLOTS.map((time) => (
                      <tr key={time}>
                        <td className="p-2 border font-medium bg-muted/50">
                          {time}
                        </td>
                        {DAYS.map((day) => {
                          const key = `${day}-${time}`;
                          if (renderedCells.has(key)) return null;
                          const entry = getEntryAtTime(day, time);
                          if (entry && entry.startTime === time) {
                            const startMinutes =
                              parseInt(entry.startTime.split(":")[0]) * 60 +
                              parseInt(entry.startTime.split(":")[1]);
                            const endMinutes =
                              parseInt(entry.endTime.split(":")[0]) * 60 +
                              parseInt(entry.endTime.split(":")[1]);
                            const rowSpan = (endMinutes - startMinutes) / 15;
                            for (let i = 1; i < rowSpan; i++) {
                              const mins = startMinutes + i * 15;
                              const h = Math.floor(mins / 60)
                                .toString()
                                .padStart(2, "0");
                              const m = (mins % 60).toString().padStart(2, "0");
                              renderedCells.add(`${day}-${h}:${m}`);
                            }
                            return (
                              <td
                                key={key}
                                rowSpan={rowSpan}
                                className={`p-2 align-top ${
                                  TYPE_COLORS[entry.type]
                                } border rounded relative`}
                              >
                                <div className="font-semibold">
                                  {
                                    subjects?.find(
                                      (s: any) => s.id === entry.subjectId
                                    )?.name
                                  }
                                </div>
                                <div className="text-xs opacity-80">
                                  Room: {entry.room}
                                </div>
                                <div className="text-xs opacity-60">
                                  Teacher:{" "}
                                  {
                                    teachers?.find(
                                      (t: any) => t.id === entry.teacherId
                                    )?.name
                                  }
                                </div>
                                <div className="text-xs opacity-70 mt-1">
                                  Slot: {entry.startTime} - {entry.endTime}
                                </div>
                                {[permissionsDef.edit, permissionsDef.delete].some((perm) => permissions.includes(perm)) && (
                                <div className="absolute top-1 right-1 flex gap-1">
                                  {permissions?.includes(permissionsDef.edit) && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => handleEdit(entry)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  )}
                                  {permissions?.includes(permissionsDef.delete) && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => handleDelete(entry.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  )}
                                </div>
                                )}
                              </td>
                            );
                          }
                          // Empty cell
                          return <td key={key} className="p-1 border h-6" />;
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card View */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entriesByDay.map(({ day, entries }) => (
            <Card key={day} className="flex flex-col">
              <CardHeader>
                <CardTitle>{day}</CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <div className="text-muted-foreground text-sm">
                    No classes
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`rounded-lg border p-3 shadow-xs flex flex-col gap-1 relative ${
                          TYPE_COLORS[entry.type]
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-semibold">
                            {
                              subjects?.find(
                                (s: any) => s.id === entry.subjectId
                              )?.name
                            }
                          </div>
                          <span className="text-xs font-medium capitalize mt-4">
                            {entry.type}
                          </span>
                        </div>
                        <div className="text-xs opacity-80">
                          Room: {entry.room}
                        </div>
                        <div className="text-xs opacity-60">
                          Teacher:{" "}
                          {
                            teachers?.find((t: any) => t.id === entry.teacherId)
                              ?.name
                          }
                        </div>

                        <div className="text-xs opacity-70">
                          {entry.startTime} - {entry.endTime}
                        </div>
                        <div className="text-xs opacity-60">
                          Semester: {entry.semester}
                        </div>
                         {[permissionsDef.edit, permissionsDef.delete].some((perm) => permissions.includes(perm)) && (
                        <div className="absolute top-1 right-2 flex gap-1">
                          {permissions.includes(permissionsDef.edit) && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleEdit(entry)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.includes(permissionsDef.delete) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          )}
                        </div>
                         )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Timetable Entry</DialogTitle>
            <DialogDescription>Update the details below</DialogDescription>
          </DialogHeader>
          {editData && (
            <div className="space-y-4 max-h-96 overflow-y-auto p-2">

              {/* Subject */}
              <Label>Subject</Label>
              <Select
                value={editData.subjectId?.toString()}
                onValueChange={(v) =>
                  setEditData((p: any) => ({ ...p!, subjectId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Room */}
              <Label>Room</Label>
              <Input
                placeholder="Room"
                value={editData.room || ""}
                onChange={(e) =>
                  setEditData((p) => ({ ...p!, room: e.target.value }))
                }
              />

              {/* Day */}
              <Label>Day</Label>
              <Select
                value={editData.day}
                onValueChange={(v) => setEditData((p) => ({ ...p!, day: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className='space-y-4'>
                  <Label>Start Time</Label>
                  <Select
                    value={editData.startTime}
                    onValueChange={(v) =>
                      setEditData((p) => ({ ...p!, startTime: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Start Time"/>
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-4'>
                  <Label>End Time</Label>
                  <Select
                    value={editData.endTime}
                    onValueChange={(v) =>
                      setEditData((p) => ({ ...p!, endTime: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="End Time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Teacher */}
              <Label>Teacher</Label>
              <Select
                value={editData.teacherId?.toString()}
                onValueChange={(v) =>
                  setEditData((p: any) => ({ ...p!, teacherId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers?.map((t: any) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Type */}
              <Label>Type</Label>
              <Select
                value={editData.type}
                onValueChange={(v) =>
                  setEditData((p) => ({ ...p!, type: v as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture">Lecture</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="tutorial">Tutorial</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                </SelectContent>
              </Select>

              <Button className="w-full" onClick={handleEditSubmit}>
                Update Entry
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
