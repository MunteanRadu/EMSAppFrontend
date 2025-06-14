// src/app/shared/services/assignment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Assignment } from '../models/assignment.model';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private base = `${environment.apiUrl}/assignments`;

  constructor(private http: HttpClient) {}

  // For employees:
  listByAssignee(userId: string): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(
      `${this.base}/listBySomething?asignee=${userId}`
    );
  }

  getPendingTasks(userId: string): Observable<Assignment[]> {
    return this.listByAssignee(userId).pipe(
      map(tasks => tasks.filter(t => t.status === 'Pending'))
    );
  }

  getOngoingTasks(userId: string): Observable<Assignment[]> {
    return this.listByAssignee(userId).pipe(
      map(tasks => tasks.filter(t => t.status === 'InProgress'))
    );
  }

  /** Fetch all assignments with a given status */
  getByStatus(status: Assignment['status']): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(
      `${this.base}/listBySomething?status=${status}`
    );
  }

  // For managers (or admins):
  listAll(): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(this.base);
  }

  create(req: {
    title: string;
    description: string;
    dueDate: string;
    departmentId: string;
    managerId: string;
  }): Observable<Assignment> {
    return this.http.post<Assignment>(this.base, req);
  }

  start(id: string, assigneeId: string): Observable<Assignment> {
    return this.http.patch<Assignment>(
      `${this.base}/${id}/start?asignee=${assigneeId}`, {}
    );
  }

  complete(id: string): Observable<Assignment> {
    return this.http.patch<Assignment>(`${this.base}/${id}/complete`, {});
  }

  approve(id: string): Observable<Assignment> {
    return this.http.patch<Assignment>(`${this.base}/${id}/approve`, {});
  }

  reject(id: string) {
    return this.http.patch<Assignment>(`${this.base}/${id}/reject`, {});
  }

  update(id: string, 
    payload: {
      title?: string;
      description?: string;
      dueDate?: string;
      assignedToId?: string;
      status?: string;
    }
  ): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, payload);
  }

  /** ADMIN: delete an assignment */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

