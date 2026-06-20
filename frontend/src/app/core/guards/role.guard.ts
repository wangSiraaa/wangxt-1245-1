import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService, UserRole } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data['roles'] as UserRole[];
  const userRole = auth.role();
  if (!roles || !userRole || !roles.includes(userRole)) {
    return router.createUrlTree([auth.getHomeRoute()]);
  }
  return true;
};
