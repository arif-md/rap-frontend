import { BaseModel } from '@app/shared/model/base/base-model';
import { Injectable } from '@angular/core';
import { Rest2Form } from '@app/shared/model/base';

export class User extends BaseModel {
    id!: number;
    email!: string;
    password?: string;
    newPassword?: string;
    firstName!: string;
    middleInitial?: string;
    lastName?: string;
    phone!: string;
    orcId!: string;
    isExternalUser!: boolean;
    passwordResetToken?: string;
    rapAdmin!: boolean;
    loginRole!: string;
    loginRoleDesc!: string;
    loginRoleAssocId!: number;
    loginOfficeId?: number;
    loginOfficeName?: string;
    loginOfficeCd?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserAdapter implements Rest2Form<User> {

    restToForm(item: any): User {
        let result = new User();
        result.id = item.id;
        result.email = item.email;
        result.password = item.password;
        result.firstName = item.firstName;
        result.lastName = item.lastName;
        result.middleInitial = item.middleInitial;
        result.phone = item.phone;
        result.orcId = item.orcId;
        result.createdBy = item.createdBy;
        result.createdDate = item.createdDate;
        result.modifiedBy = item.modifiedBy;
        result.modifiedDate = item.modifiedDate;
        result.isExternalUser = item.isExternalUser;
        result.rapAdmin = item.rapAdmin;
        result.loginRole = item.loginRole;
        result.loginRoleDesc = item.loginRoleDesc;
        result.loginRoleAssocId = item.loginRoleAssocId;
        result.loginOfficeId = item.loginOfficeId;
        result.loginOfficeName = item.loginOfficeName;
        result.loginOfficeCd = item.loginOfficeCd;

        result.passwordResetToken = item.passwordResetToken;
        return result;
    }

}
