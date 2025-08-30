import { Injectable } from '@angular/core';
import { Rest2Form } from '@app/shared/model/base';
import { ApiValidationError, ApiValidationErrorAdapter } from '@app/shared/model';

export class ApiError {
    status: string;
    timestamp: Date;
    message: string;
    debugMessage: string;
    code: number;
    subErrors: ApiValidationError[];
}

@Injectable({
    providedIn: 'root'
})
export class ApiErrorAdapter implements Rest2Form<ApiError> {
    restToForm(item: any): ApiError {
        let result = new ApiError();
        if (item) {
            result.status = item.status;
            result.timestamp = item.timestamp;
            result.message = item.message;
            result.debugMessage = item.debugMessage;
            if (item.code) {
                result.code = item.code;
            }
            if (item.subErrors) {
                let subErrAdapter = new ApiValidationErrorAdapter();
                let _subErrors: ApiValidationError[] = [];
                result.subErrors = _subErrors;
                for (let subError of item.subErrors) {
                    let _subErr: ApiValidationError = subErrAdapter.restToForm(subError);
                    result.subErrors.push(_subErr);
                }
            }
        } else {
            result.message = 'Unknown Error';
        }
        return result;
    }
}

