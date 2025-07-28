import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, Observable, tap, throwError } from "rxjs";
import { Auth } from "../services/auth";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    private auth = inject(Auth);
    intercept(req: HttpRequest<any>, handler: HttpHandler): Observable<HttpEvent<any>> {
        return handler.handle(req).pipe(
            catchError((error) => {
                console.error('Error occurred:', error);
                if (error.error.message === "Invalid token.") {
                    this.auth.logout();
                }
                return throwError(error);
            })
        );
    }
}