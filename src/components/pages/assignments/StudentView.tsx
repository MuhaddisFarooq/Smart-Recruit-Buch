import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, FileText, ExternalLink } from 'lucide-react'
import { Eye } from 'lucide-react'
import React, { useState } from 'react'
import { format } from 'date-fns'
import Pagination from '@/components/common/Pagination'
import AssignmentSubmission from './AssignmentSubmission'

export default function StudentView({ 
  assignmentsData, 
  currentPage, 
  setCurrentPage, 
  selectedAssignment, 
  setSelectedAssignment,
  onSubmitAssignment 
}: any) {
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false)
  const [assignmentToSubmit, setAssignmentToSubmit] = useState(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-700 text-white"
      case "submitted":
        return "bg-black text-white"
      case "graded":
        return "bg-gray-200 text-black"
      default:
        return "bg-gray-500"
    }
  }

  const handleSubmitClick = (assignment: any) => {
    setAssignmentToSubmit(assignment)
    setIsSubmissionModalOpen(true)
  }

  const handleSubmissionClose = () => {
    setIsSubmissionModalOpen(false)
    setAssignmentToSubmit(null)
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assignmentsData?.assignments?.map((assignment:any) => (
          <div key={assignment.id} className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">{assignment.title}</h3>
                  <p className="text-sm text-muted-foreground">{assignment.subject?.name || "No Subject"}</p>
                </div>
                <Badge className={`${getStatusColor(assignment.status || "pending")}`}>{assignment.status || "pending"}</Badge>
              </div>

              <p className="text-sm leading-relaxed">{assignment.description}</p>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {format(new Date(assignment.dueDate), "MMM dd, yyyy")}</span>
                </div>
                <span>{assignment.points} pts</span>
              </div>

              {/* Attachment Link */}
              {assignment.file && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                    onClick={() => window.open(assignment.file, '_blank')}
                  >
                    View Attachment
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <div className="pt-2 space-y-2">
                {assignment.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={() => handleSubmitClick(assignment)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Submit Assignment
                    </Button>
                  </div>
                )}
                {assignment.status === "submitted" && (
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" size="sm" disabled>
                      Submitted
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {assignmentsData && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={assignmentsData.currentPage}
            totalPages={assignmentsData.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Assignment Submission Modal */}
      <AssignmentSubmission
        isOpen={isSubmissionModalOpen}
        onClose={handleSubmissionClose}
        assignment={assignmentToSubmit}
        onSubmit={onSubmitAssignment}
      />
    </>
  )
}
