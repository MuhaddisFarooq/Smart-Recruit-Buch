
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InterviewPanelManager from "./InterviewPanelManager";

type InterviewPanelDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    applicationId: number | null;
};

export default function InterviewPanelDialog({ isOpen, onClose, applicationId }: InterviewPanelDialogProps) {
    if (!applicationId) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Interview Panel</DialogTitle>
                </DialogHeader>
                <InterviewPanelManager applicationId={applicationId} />
            </DialogContent>
        </Dialog>
    );
}
