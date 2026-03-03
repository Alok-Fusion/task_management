import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TaskType } from "@/types/api.type";
import EditTaskForm from "./edit-task-form";

const EditTaskDialog = (props: { task: TaskType, isOpen: boolean, setIsOpen: (open: boolean) => void }) => {
    const { task, isOpen, setIsOpen } = props;

    const onClose = () => {
        setIsOpen(false);
    };

    return (
        <div>
            <Dialog modal={true} open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-lg max-h-auto my-5 border-[1px] border-border">
                    <EditTaskForm task={task} onClose={onClose} />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EditTaskDialog;
