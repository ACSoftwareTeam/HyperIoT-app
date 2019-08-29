import { NgModule, Injectable } from '@angular/core';
import { Routes, RouterModule, CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationComponent } from '../pages/authentication/authentication.component';
import { PasswordResetComponent } from '../pages/authentication/password-reset/password-reset.component';
import { UserActivationComponent } from '../pages/authentication/user-activation/user-activation.component';
import { Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { DashboardViewComponent } from '../pages/dashboard/dashboard-view/dashboard-view.component';
import { AddWidgetDialogComponent } from '../pages/dashboard/add-widget-dialog/add-widget-dialog.component';
import { WidgetSettingsDialogComponent } from '../pages/dashboard/widget-settings-dialog/widget-settings-dialog.component';
import { NotFoundComponent } from '../pages/not-found/not-found.component';
import { LoginComponent } from '../pages/authentication/login/login.component';
import { RegistrationComponent } from '../pages/authentication/registration/registration.component';
import { PasswordRecoveryComponent } from '../pages/authentication/password-recovery/password-recovery.component';
import { DashboardsListComponent } from '../pages/dashboard/dashboards-list/dashboards-list.component';

@Injectable()
export class LoggedInGuard implements CanActivate {

  constructor(private router: Router, private cookieService: CookieService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    Observable<boolean> | Promise<boolean> | boolean {
    if (this.cookieService.check('HIT-AUTH')) {
      return true;
    }
    this.router.navigate(['/auth/login'], { state: { returnUrl: state.url } });
    return false;
  }

}

const hyperiotRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboards/',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    component: AuthenticationComponent,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'registration',
        component: RegistrationComponent
      },
      {
        path: 'password-recovery',
        component: PasswordRecoveryComponent
      },
      {
        path: 'password-reset/:email/:code',
        component: PasswordResetComponent,
        data: {
          showToolBar: false,
        }
      },
      {
        path: 'activation/:email/:code',
        component: UserActivationComponent,
        data: {
          showToolBar: false,
        }
      }
    ]
  },
  {
    path: 'project-wizard',
    component: ProjectWizardComponent,
    canActivate: [LoggedInGuard],
    data: {
      showToolBar: true,
    }
  },
  {
    path: 'dashboards',
    component: DashboardsListComponent,
    canActivate: [LoggedInGuard],
    data: {
      showToolBar: true,
    }
  },
  {
    path: 'dashboards/:dashboardId',
    component: DashboardViewComponent,
    canActivate: [LoggedInGuard],
    children: [
      {
        path: 'widgets',
        component: AddWidgetDialogComponent,
        outlet: 'modal'
      },
      {
        path: 'settings/:widgetId',
        component: WidgetSettingsDialogComponent,
        outlet: 'modal'
      }
    ],
    data: {
      showToolBar: true,
    }
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(hyperiotRoutes)],
  exports: [RouterModule],
  providers: [LoggedInGuard]
})
export class HytRoutingModule { }
