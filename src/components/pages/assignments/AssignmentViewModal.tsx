'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Calendar, Clock, FileText, Users } from 'lucide-react'
import { format } from 'date-fns'

interface AssignmentViewModalProps {
  isOpen: boolean
  onClose: () => void
  assignment: any
}

export default function AssignmentViewModal({
  isOpen,
  onClose,
  assignment
}: AssignmentViewModalProps) {
  if (!assignment) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "graded":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Assignment Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Assignment Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">{assignment.title}</h2>
              <Badge className={getStatusColor(assignment.status || "pending")}>
                {assignment.status || "pending"}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {assignment.subject?.name || "No Subject"}
            </p>
          </div>

          {/* Assignment Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="text-sm font-medium">
                  {assignment.dueDate ? format(new Date(assignment.dueDate), "MMM dd, yyyy") : "No due date"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Points</p>
                <p className="text-sm font-medium">{assignment.points || 0} pts</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Submissions</p>
                <p className="text-sm font-medium">{assignment.submissionCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-medium">Description</h3>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm leading-relaxed">
                {assignment.description || "No description provided"}
              </p>
            </div>
          </div>

          {/* Instructions */}
          {assignment.instructions && (
            <div className="space-y-2">
              <h3 className="font-medium">Instructions</h3>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm leading-relaxed">{assignment.instructions}</p>
              </div>
            </div>
          )}

          {/* Attachment */}
          {assignment.file && (
            <div className="space-y-2">
              <h3 className="font-medium">Attachment</h3>
              <div className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm flex-1">Assignment File</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(assignment.file, '_blank')}
                >
                  Download
                </Button>
              </div>
            </div>
          )}

          {/* Assignment Metadata */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-medium">Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2">
                  {assignment.createdAt ? format(new Date(assignment.createdAt), "MMM dd, yyyy") : "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>
                <span className="ml-2">
                  {assignment.updatedAt ? format(new Date(assignment.updatedAt), "MMM dd, yyyy") : "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Class:</span>
                <span className="ml-2">
                  {assignment.class?.name || assignment.program?.name || "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Section:</span>
                <span className="ml-2">
                  {assignment.section?.name || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="outline">
              View Submissions
            </Button>
            <Button>
              Edit Assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
