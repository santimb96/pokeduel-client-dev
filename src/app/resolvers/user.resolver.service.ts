import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs";
import { AuthService } from "../services/auth.service";

@Injectable({ providedIn: 'root' })
export class UserResolverService implements Resolve<any>{

    constructor(private _authService: AuthService) { }
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        return this._authService.getOneUser(route.paramMap.get('id'));
    }
}

