import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth.service'; 

@Injectable({ providedIn: 'root' })
export class StaffGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const role = this.auth.currentRole;
    if (role === 'employee' || role === 'manager') {
      return true;
    }
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
