import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from 'lucide-react'
import { Button } from '../ui/button'

export default function Modal({
  isModalOpen,
  setIsModalOpen,
  mutation,
  handleSubmit,
  title,
  children,
  width,
  action
}: any) {
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className={`sm:max-w-md ${width}`}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
         {children}
         {action && (
          <DialogFooter>
            <Button 
              onClick={handleSubmit} 
              disabled={mutation?.isPending}
            >
              {mutation?.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                action
              )}
            </Button>
          </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
  )
}
