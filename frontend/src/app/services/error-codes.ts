export enum FEErrorCode {
    MISSING_EMAIL = 'FE001',
    INVALID_PASSWORD = 'FE002',
    UNKNOWN = 'FE999',
}

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorService {
    public getMessage(code: FEErrorCode): string {
        switch (code) {
            case FEErrorCode.MISSING_EMAIL:
                return 'Fehler: Es ist kein Benutzer hinterlegt. Bitte melden Sie sich erneut an.';

            case FEErrorCode.INVALID_PASSWORD:
                return 'Fehler: Das Passwort ist ungültig.';

            default:
                return 'Ein unbekannter Fehler ist aufgetreten.';
        }
    }

    public parseErrorCode(param: string | null): FEErrorCode | null {
        if (!param) return null;
        return Object.values(FEErrorCode).includes(param as FEErrorCode)
            ? (param as FEErrorCode)
            : null;
    }
}
