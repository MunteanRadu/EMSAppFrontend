// src/app/core/interceptors/error.interceptor.ts

import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errMsg = 'Unknown server error';
        if (error.error && typeof error.error === 'string') {
          errMsg = error.error;
        } else if (error.error && error.error.message) {
          errMsg = error.error.message;
        } else if (error.statusText) {
          errMsg = error.statusText;
        }
        return throwError(() => errMsg);
      })
    );
  }
}
