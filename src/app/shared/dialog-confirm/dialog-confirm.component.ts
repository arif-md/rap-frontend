import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
    CONFIRM_DEFAULT_CANCEL_TEXT,
    CONFIRM_DEFAULT_CONFIRM_TEXT,
    CONFIRM_DEFAULT_ICON,
    CONFIRM_DEFAULT_TEXT,
    CONFIRM_DEFAULT_TITLE,
    CONFIRM_PARENT_ORG_IMG,
    CONFIRM_ERROR_ICON,
    CONFIRM_QUESTION_ICON,
    CONFIRM_SUCCESS_ICON
} from '@app/shared/model';

export interface ConfirmDialogData {
    title?: string,
    subtitle?: string,
    text?: string,
    icon?: string,
    confirmButtonText?: string,
    cancelButtonText?: string,
    hideCancelButton?: boolean,
    showReason?: boolean,
    requireReason?: boolean
}

export interface ConfirmResult {
    confirmed: boolean;
    reasonText: string;
}

@Component({
    selector: 'app-dialog-confirm',
    templateUrl: './dialog-confirm.component.html',
    styleUrls: ['./dialog-confirm.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule
    ]
})
export class DialogConfirmComponent implements OnInit {

    constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {}


    reasonText: string;

    ngOnInit() {
        this.setTemplateData();
    }

    private setTemplateData(): void {
        if (!this.data) {
            this.data = {};
        }
        if (!this.data.title) {
            this.data.title = CONFIRM_DEFAULT_TITLE;
        }
        if (!this.data.text) {
            this.data.text = CONFIRM_DEFAULT_TEXT;
        }
        if (!this.data.icon) {
            this.data.icon = CONFIRM_DEFAULT_ICON;
        }
        if (!this.data.confirmButtonText) {
            this.data.confirmButtonText = CONFIRM_DEFAULT_CONFIRM_TEXT;
        }
        if (!this.data.cancelButtonText) {
            this.data.cancelButtonText = CONFIRM_DEFAULT_CANCEL_TEXT;
        }
        if (!this.data.hideCancelButton) {
            this.data.hideCancelButton = false;
        }
        if (!this.data.requireReason) {
            this.data.requireReason = false;
        }
    }

    protected readonly CONFIRM_QUESTION_ICON = CONFIRM_QUESTION_ICON;
    protected readonly CONFIRM_DEFAULT_ICON = CONFIRM_DEFAULT_ICON;
    protected readonly CONFIRM_ERROR_ICON = CONFIRM_ERROR_ICON;
    protected readonly CONFIRM_SUCCESS_ICON = CONFIRM_SUCCESS_ICON;
    protected readonly CONFIRM_PARENT_ORG_IMG = CONFIRM_PARENT_ORG_IMG;
}
