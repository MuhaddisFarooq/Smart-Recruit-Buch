import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Edit, Eye, FileText, ExternalLink } from 'lucide-react'
import React, { useState } from 'react'
import Pagination from '@/components/common/Pagination'
import AssignmentViewModal from './AssignmentViewModal'
import { usePagePermissions } from '@/hooks/usePagePermissions'
import { permissionsDef } from '@/lib/constants'

export default function TeacherView({ 
  assignmentsData, 
  currentPage, 
  setCurrentPage, 
  selectedAssignment, 
  setSelectedAssignment, 
  setIsDialogOpen 
}: any) {
  const permissions = usePagePermissions('/assignments');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [assignmentToView, setAssignmentToView] = useState(null)

  const getStatusColor = (status: Boolean) => {
    switch (status) {
      case false:
        return "bg-red-100 text-red-400"
      case true:
        return "bg-green-100 text-green-400"
      default:
        return "bg-gray-500"
    }
  }

  const handleViewClick = (assignment: any) => {
    setAssignmentToView(assignment)
    setIsViewModalOpen(true)
  }

  const handleEditClick = (assignment: any) => {
    setSelectedAssignment(assignment)
    setIsDialogOpen(true)
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assignmentsData?.assignments?.map((assignment: any) => (
          <div key={assignment.id} className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">{assignment?.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {assignment.subject?.name || assignment.subject || "No Subject"}
                  </p>
                </div>
                <Badge className={`${getStatusColor(assignment.isActive)}`}>{assignment.isActive ? "Active" : "Inactive"}</Badge>
              </div>

              <p className="text-sm leading-relaxed">{assignment?.description}</p>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span><div className='font-semibold inline-flex'>Due: </div> {format(new Date(assignment?.dueDate), "MMM dd, yyyy")}</span>
                </div>
                <span>{assignment?.points} pts</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p><span className="font-semibold">Program:</span> {assignment.program?.title || "N/A"}</p>
                  <p><span className="font-semibold">Session:</span> {assignment.session?.name || "N/A"}</p>
                  <p><span className="font-semibold">Section:</span> {assignment.section?.name || "N/A"}</p>
                </div>
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

              <div className=''></div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-black hover:bg-gray-800 text-white" 
                  size="sm"
                  onClick={() => handleViewClick(assignment)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
                {permissions?.includes(permissionsDef.edit) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditClick(assignment)}
                  >
                  <Edit className="h-4 w-4" />
                </Button> )}
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

      {/* Assignment View Modal */}
      <AssignmentViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        assignment={assignmentToView}
      />
    </>
  )
}
