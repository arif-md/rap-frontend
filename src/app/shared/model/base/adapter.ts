//TODO this should be renamed to "convertToServerModel"
export interface Form2Rest<T> {
    formToRest(item: any): T;
}

//TODO this should be renamed to "convertToClientModel" 
export interface Rest2Form<T> {
    restToForm(item: any): T;
}

export const CLIENT = true;
export const SERVER = false;

