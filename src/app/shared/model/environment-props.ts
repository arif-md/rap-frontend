import { Injectable } from '@angular/core';
import { Form2Rest, Rest2Form } from '@app/shared/model/base';

export class EnvironmentProps {
    appEnv?: string;
    appEnvName?: string;
    tcsAppId?: string;
    reportsUrl?: string;
    buildVersion?: string;
    //gisAppUrl? : string;
    dirty?: boolean;
    sciMapApiKey: string;
    palMapApiKey: string;
    recMapApiKey: string;
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
        result.dirty = item.dirty;
        result.recMapApiKey = item.recMapApiKey;
        result.sciMapApiKey = item.sciMapApiKey;
        result.palMapApiKey = item.palMapApiKey;
        return result;
    }
}
