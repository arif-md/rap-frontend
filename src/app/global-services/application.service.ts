import { Injectable, inject } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  private moduleSource = new BehaviorSubject('');
  currentModule = this.moduleSource.asObservable();

  updateModule(module: string) {
        this.moduleSource.next(module);
  }
  

}
