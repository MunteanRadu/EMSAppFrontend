export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  departmentId: string;
  assignedToId?: string;
  status: 'Pending' | 'InProgress' | 'Done' | 'Approved' | 'Rejected';
}