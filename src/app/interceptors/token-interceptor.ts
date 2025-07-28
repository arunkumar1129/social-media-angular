import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Auth } from '../services/auth';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, handler: HttpHandler): Observable<HttpEvent<any>> {
        const authToken = inject(Auth).token();
        const newReq = req.clone({
            headers: req.headers.append('Authorization', 'Bearer ' + authToken),
        });
        return handler.handle(newReq);
    }
}