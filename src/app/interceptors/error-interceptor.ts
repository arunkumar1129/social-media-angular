import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, Observable, tap, throwError } from "rxjs";
import { MessageService } from "primeng/api";
import { Auth } from "../services/auth";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    private auth = inject(Auth);
    private messageService = inject(MessageService);
    
    intercept(req: HttpRequest<any>, handler: HttpHandler): Observable<HttpEvent<any>> {
        return handler.handle(req).pipe(
            catchError((error) => {
                console.error('Error occurred:', error);
                
                let errorMessage = 'An unexpected error occurred';
                
                if (error.error?.message) {
                    errorMessage = error.error.message;
                } else if (error.message) {
                    errorMessage = error.message;
                } else if (error.status) {
                    switch (error.status) {
                        case 400:
                            errorMessage = 'Bad request - please check your input';
                            break;
                        case 401:
                            errorMessage = 'Unauthorized - please login again';
                            break;
                        case 403:
                            errorMessage = 'Access denied';
                            break;
                        case 404:
                            errorMessage = 'Resource not found';
                            break;
                        case 500:
                            errorMessage = 'Server error - please try again later';
                            break;
                        default:
                            errorMessage = `Error ${error.status}: ${error.statusText || 'Unknown error'}`;
                    }
                }
                
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMessage,
                    life: 5000
                });
                
                if (error.error?.message === "Invalid token." || error.status === 401) {
                    this.auth.clearSession();
                }
                
                return throwError(() => error);
            })
        );
    }
}