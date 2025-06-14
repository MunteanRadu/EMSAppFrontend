// src/app/auth/auth.guard.ts
import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanMatch, Route, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService }            from '../auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const token = this.auth.token;
    if (!token) {
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    let payload: any;
    try {
      payload = JSON.parse(atob(token.split('.')[1]));
    } catch {
      this.auth.logout();
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // expiration check...
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      this.auth.logout();
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // --- improved role check ---
    const rawRole =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      payload['role'] ||
      '';
    const userRole = (Array.isArray(rawRole) ? rawRole[0] : rawRole).toLowerCase();

    const allowedRoles = (route.data['roles'] as string[] | undefined)
      ?.map(r => r.toLowerCase());

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return this.router.createUrlTree(['/unauthorized']);
    }

    return true;
  }
}
// This AuthGuard checks if the user is logged in before allowing access to certain routes.
// If not logged in, it redirects to the login page.