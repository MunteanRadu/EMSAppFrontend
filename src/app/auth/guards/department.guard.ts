import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Injectable({ providedIn: 'root' })
export class DepartmentGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user = this.auth.currentUser;
    if (user?.departmentId) {
      return true;
    }
    // not assigned → send to “pending assignment” page
    this.router.navigate(['/pending-assignment']);
    return false;
  }
}
