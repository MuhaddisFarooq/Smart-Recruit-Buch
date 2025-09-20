'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Upload, FileText, X } from 'lucide-react'
import { toast } from 'sonner'

interface AssignmentSubmissionProps {
  isOpen: boolean
  onClose: () => void
  assignment: any
  onSubmit: (data: { assignmentId: any; fileUrl: string; comments?: string }) => void
}

export default function AssignmentSubmission({
  isOpen,
  onClose,
  assignment,
  onSubmit
}: AssignmentSubmissionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to submit')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Call the onSubmit function passed from parent with file and assignment data
      await onSubmit({
        assignmentId: assignment.id,
        fileUrl: selectedFile as any, // Pass the file object, parent will handle upload
        comments: comments.trim() || undefined
      })
      
      // Reset form
      setSelectedFile(null)
      setComments('')
      onClose()
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Assignment Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm">{assignment?.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {assignment?.subject?.name || 'No Subject'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Due: {assignment?.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label htmlFor="file-upload">Upload File *</Label>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>
                  <span className="text-sm text-gray-500"> or drag and drop</span>
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX, TXT (max 10MB)
                </p>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
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

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Add any comments about your submission..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !selectedFile}>
              {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
