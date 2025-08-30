import { Injectable } from '@angular/core';
import { Rest2Form } from '@app/shared/model/base';

export class ApiValidationError {
    field: string;
    message: string;
    object: string;
    rejectedValue: string;
}

@Injectable({
    providedIn: 'root'
})
export class ApiValidationErrorAdapter implements Rest2Form<ApiValidationError> {
    restToForm(item: any): ApiValidationError {
        let result = new ApiValidationError();
        result.field = item.field;
        result.message = item.message;
        result.object = item.object;
        result.rejectedValue = item.rejectedValue;
        return result;
    }
}
