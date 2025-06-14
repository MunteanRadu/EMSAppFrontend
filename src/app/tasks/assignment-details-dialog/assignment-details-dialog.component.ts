// src/app/tasks/task-details-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Assignment } from '../../shared/models/assignment.model';
import { AssignmentFeedbackComponent } from '../assignment-feedback/assignment-feedback.component';
import { CommonModule } from '@angular/common';
import { AssignmentService } from '../../shared/services/assignment.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-details-dialog',
  standalone: true,
  imports: [CommonModule, AssignmentFeedbackComponent, FormsModule],
  styleUrls: ['./assignment-details-dialog.component.scss'],
  templateUrl: './assignment-details-dialog.component.html',
})
export class TaskDetailsDialogComponent implements OnInit {
  isManager = false;

  editingAssignment = false;
  editedTitle = '';
  editedDescription = '';
  editedDueDate = '';
  editedStatus = '';

  deletingAssignment = false;


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Assignment,
    private dialogRef: MatDialogRef<TaskDetailsDialogComponent>,
    private taskSvc: AssignmentService
  ) { }

  ngOnInit(): void {
    this.decodeRole();
  }

  private decodeRole(): void {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const payload: any = JSON.parse(atob(token.split('.')[1]));
    const roleRaw = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role;
    this.isManager = ['manager', 'admin'].includes(roleRaw.toLowerCase());
  }

  close(): void {
    this.dialogRef.close();
  }

  startEditTask(): void {
    this.editingAssignment = true;
    this.editedTitle = this.data.title;
    this.editedDescription = this.data.description;
    this.editedDueDate = this.data.dueDate ? new Date(this.data.dueDate).toISOString().split('T')[0] : '';
  }

  saveEditTask(): void {
    const req: any = {};

    if (this.editedTitle.trim() && this.editedTitle.trim() !== this.data.title) {
      req.title = this.editedTitle.trim();
    }

    if (this.editedDescription.trim() && this.editedDescription.trim() !== this.data.description) {
      req.description = this.editedDescription.trim();
    }

    if (this.editedDueDate && this.editedDueDate !== new Date(this.data.dueDate).toISOString().split('T')[0]) {
      req.dueDate = new Date(this.editedDueDate).toISOString();
    }

    // We are not editing assignedToId or status here → could add if needed

    if (Object.keys(req).length > 0) {
      this.taskSvc.update(this.data.id, req).subscribe(() => {
        if (req.title) {
          this.data.title = req.title;
        }
        if (req.description) {
          this.data.description = req.description;
        }
        if (req.dueDate) {
          this.data.dueDate = req.dueDate;
        }
        this.editingAssignment = false;
      });
    } else {
      // nothing changed
      this.editingAssignment = false;
    }
  }

    cancelEditTask(): void {
    this.editingAssignment = false;
  }

  startDeleteTask(): void {
    this.deletingAssignment = true;
  }

  confirmDeleteTask(): void {
    this.taskSvc.delete(this.data.id).subscribe(() => {
      alert('Task deleted.');
      this.dialogRef.close();
    });
  }

  cancelDeleteTask(): void {
    this.deletingAssignment = false;
  }
}
