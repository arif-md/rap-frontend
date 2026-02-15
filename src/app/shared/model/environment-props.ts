import { Injectable } from '@angular/core';
import { Form2Rest, Rest2Form } from '@app/shared/model/base';

export class EnvironmentProps {
    appEnv?: string;
    appEnvName?: string;
    tcsAppId?: string;
    reportsUrl?: string;
    buildVersion?: string;
    version?: string;
    gitSha?: string;
    gitRef?: string;
    shortSha?: string;
    buildDate?: string;
    buildTimestamp?: number;
    isDirty?: boolean;
    isCI?: boolean;
    buildType?: string;
    apiBaseUrl?: string;
    //gisAppUrl? : string;
    dirty?: boolean;
    sciMapApiKey: string;
    palMapApiKey: string;
    recMapApiKey: string;
    jwtAccessTokenExpirationMinutes?: number;
    jwtRefreshTokenExpirationDays?: number;
    enableKeycloakInternal?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class EnvironmentPropsAdapter implements Rest2Form<EnvironmentProps> {
    restToForm(item: any): EnvironmentProps {
        let result = new EnvironmentProps();
        result.appEnv = item.appEnv;
        result.appEnvName = item.appEnvName;
        result.tcsAppId = item.tcsAppId;
        result.reportsUrl = item.reportsUrl;
        result.buildVersion = item.buildVersion;
        result.version = item.version;
        result.gitSha = item.gitSha;
        result.gitRef = item.gitRef;
        result.shortSha = item.shortSha;
        result.buildDate = item.buildDate;
        result.buildTimestamp = item.buildTimestamp;
        result.isDirty = item.isDirty;
        result.isCI = item.isCI;
        result.buildType = item.buildType;
        result.apiBaseUrl = item.apiBaseUrl;
        result.dirty = item.dirty || item.isDirty; // Support both for backward compatibility
        result.recMapApiKey = item.recMapApiKey;
        result.sciMapApiKey = item.sciMapApiKey;
        result.palMapApiKey = item.palMapApiKey;
        result.jwtAccessTokenExpirationMinutes = item.jwtAccessTokenExpirationMinutes;
        result.jwtRefreshTokenExpirationDays = item.jwtRefreshTokenExpirationDays;
        result.enableKeycloakInternal = item.enableKeycloakInternal || false;
        return result;
    }
}
