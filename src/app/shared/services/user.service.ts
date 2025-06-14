// src/app/shared/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment }  from '../../../environments/environment';
import { Observable }   from 'rxjs';
import { User } from '../models/user.model';
import { UserProfile } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = `${environment.apiUrl}/users`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.base);
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  getByDepartment(departmentId: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/byDepartment`, { params: { departmentId } });
  }

  getProfile(userId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/${userId}/profile`);
  }

  updateProfile(userId: string, profile: Partial<UserProfile>): Observable<void> {
    return this.http.put<void>(`${this.base}/${userId}/profile`, profile);
  }

  createEmployee(req: {
    username: string;
    email: string;
    passwordHash: string;
    departmentId: string;
  }): Observable<User> {
    return this.http.post<User>(`${this.base}`, req);
  }

  update(id: string, req: {
    email?: string;
    username?: string;
    passwordHash?: string;
    departmentId?: string;
    role?: string;
    salary?: number;
    jobTitle?: string;
  }): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, req);
  }

  
  updateSalary(userId: string, Salary: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/${userId}/salary`, { Salary });
  }

  updateJobTitle(userId: string, JobTitle: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${userId}/jobtitle`, { JobTitle });
  }

  updateDepartment(userId: string, departmentId: string|null): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/${userId}/department`,
      { departmentId }
    );
  }

  listManagers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/listByRole?role=Manager`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
