'use client'
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, MapPin, User, BookOpen } from 'lucide-react';
import { getTimetableByStudent } from '@/lib/api/ApiFunctions';

interface Subject {
  id: number;
  name: string;
  code: string;
  creditHours: number;
  programId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface Teacher {
  id: string;
  name: string;
  // Add other teacher properties as needed
}

interface TimetableEntry {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  subjectId: number;
  teacherId: string;
  programId: number;
  sessionId: number;
  sectionId: number;
  semester: number;
  type: 'lecture' | 'lab' | 'tutorial';
  room: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  subject: Subject;
  teacher?: Teacher;
}

interface TimetableResponse {
  data: TimetableEntry[];
  message: string;
}

const TimeTableStudentView: React.FC = () => {

  const { data, isLoading, error } = useQuery({
    queryKey: ['studentTimetable'],
    queryFn: () => getTimetableByStudent(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lab':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'tutorial':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const groupByDay = (entries: TimetableEntry[]) => {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.day]) {
        acc[entry.day] = [];
      }
      acc[entry.day].push(entry);
      return acc;
    }, {} as Record<string, TimetableEntry[]>);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {days.map((day) => (
            <Card key={day} className="w-full">
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load timetable. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const timetableByDay = groupByDay(data || []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Timetable</h1>
        <Badge variant="outline" className="text-sm">
          Current Week
        </Badge>
      </div>

      <div className="grid gap-4">
        {days.map((day) => (
          <Card key={day} className="w-full shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-800">
                {day}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timetableByDay[day]?.length > 0 ? (
                <div className="space-y-3">
                  {timetableByDay[day]
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {entry.subject.name} ({entry.subject.code})
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>Room {entry.room}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{entry.teacher?.name || 'TBA'}</span>
                              </div>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${getTypeColor(entry.type)} capitalize`}
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            {entry.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No classes scheduled for {day}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TimeTableStudentView;
