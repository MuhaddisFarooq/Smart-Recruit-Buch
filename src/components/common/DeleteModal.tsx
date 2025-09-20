import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogTrigger
  } from "@/components/ui/dialog"
import { Button } from '../ui/button'
import { Loader2 } from 'lucide-react'

export default function DeleteModal({
  isModalOpen,
  setIsModalOpen,
  pageToDelete,
  deleteMutation,
  handleDeletePage,
  type,
  action
}: any) {
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete {type}</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        Are you sure you want to delete the {type} "{action ||pageToDelete?.name}"? This action cannot be undone.
      </div>
      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={() => setIsModalOpen(false)}
        >
          Cancel
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleDeletePage}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            "Delete"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  )
}
