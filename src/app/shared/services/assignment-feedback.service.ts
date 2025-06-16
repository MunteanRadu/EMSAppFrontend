// src/app/shared/services/assignment-feedback.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AssignmentFeedback } from '../models/assignment-feedback.model';
@Injectable({ providedIn: 'root' })
export class AssignmentFeedbackService {
  private base = `${environment.apiUrl}/assignmentfeedbacks`;

  constructor(private http: HttpClient) {}

  listByAssignment(assignmentId: string): Observable<AssignmentFeedback[]> {
    return this.http.get<AssignmentFeedback[]>(`${this.base}/listByAssignment`, {
      params: { assignmentId }
    });
  }

  addFeedback(req: {
    assignmentId: string;
    userId: string;
    text: string;
    type: 'employee' | 'manager';
  }): Observable<AssignmentFeedback> {
    return this.http.post<AssignmentFeedback>(this.base, req);
  }

  editFeedback(id: string, newText: string): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, { text: newText });
  }

  deleteFeedback(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
