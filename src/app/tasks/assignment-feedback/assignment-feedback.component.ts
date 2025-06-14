// src/app/shared/components/assignment-feedback.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { AssignmentFeedbackService } from '../../shared/services/assignment-feedback.service'; 
import { AssignmentFeedback } from '../../shared/models/assignment-feedback.model';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../shared/services/user.service';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';

@Component({
  selector: 'app-assignment-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assignment-feedback.component.html',
  styleUrls: ['./assignment-feedback.component.scss']
})
export class AssignmentFeedbackComponent implements OnInit {

  @Input() assignmentId!: string;

  feedbackList: AssignmentFeedback[] = [];
  newFeedbackText: string = '';

  userId!: string;
  userRole!: string;

  editingFeedbackId?: string;
  editedText: string = '';

  deletingFeedbackId?: string;

  userMap: Record<string,string> = {};

  constructor(
    private feedbackService: AssignmentFeedbackService,
    private auth: AuthService,
    private userSvc: UserService
  ) {}

  ngOnInit(): void {
    this.decodeToken();
    this.loadFeedback();
  }

  private decodeToken(): void {
    const token = this.auth.token!;
    const payload: any = JSON.parse(atob(token.split('.')[1]));

    this.userId = payload.sub;
    const roleRaw = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role;
    this.userRole = roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1).toLowerCase();
  }

  loadFeedback(): void {
    this.feedbackService.listByAssignment(this.assignmentId).subscribe(fb => {
      this.feedbackList = fb.sort((a, b) => new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime());
      this.loadUserMap(this.feedbackList);
    });
  }

  addFeedback(): void {
    if (!this.newFeedbackText.trim()) return;

    this.feedbackService.addFeedback({
      assignmentId: this.assignmentId,
      text: this.newFeedbackText.trim(),
      type: this.userRole === 'Manager' ? 'manager' : 'employee',
      userId: this.userId
    }).subscribe(() => {
      this.newFeedbackText = '';
      this.loadFeedback();
    });
  }

  canEdit(fb: AssignmentFeedback): boolean {
    return fb.userId === this.userId || this.userRole === 'admin' || this.userRole === 'manager';
  }

  startEditFeedback(fb: AssignmentFeedback): void {
    this.editingFeedbackId = fb.id;
    this.editedText = fb.text;
  }

  saveEditFeedback(fb: AssignmentFeedback): void {
    if (this.editedText.trim()) {
      this.feedbackService.editFeedback(fb.id, this.editedText.trim()).subscribe(() => {
        this.editingFeedbackId = undefined;
        this.editedText = '';
        this.loadFeedback();
      });
    }
  }

  cancelEditFeedback(): void {
    this.editingFeedbackId = undefined;
    this.editedText = '';
  }

  startDeleteFeedback(fb: AssignmentFeedback): void {
    this.deletingFeedbackId = fb.id;
  }

  confirmDeleteFeedback(fb: AssignmentFeedback): void {
    this.feedbackService.deleteFeedback(fb.id).subscribe(() => {
      this.deletingFeedbackId = undefined;
      this.loadFeedback();
    });
  }

  cancelDeleteFeedback(): void {
    this.deletingFeedbackId = undefined;
  }

  loadUserMap(feedbacks: AssignmentFeedback[]): void {
    const ids = Array.from(new Set(
      feedbacks.map(fb => fb.userId)
    ));

    if (!ids.length) return;

    const calls = ids.map(id => this.userSvc.getById(id));
    forkJoin(calls).subscribe(users => {
      users.forEach(u => this.userMap[u.id] = u.username);
    });
  }
}

