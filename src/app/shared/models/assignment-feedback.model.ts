export interface AssignmentFeedback {
    id: string;
    assignmentId: string;
    userId: string;
    text: string;
    timeStamp: string;
    type: 'employee' | 'manager';
}
