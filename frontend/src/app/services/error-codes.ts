export enum FEErrorCode {
    MISSING_EMAIL = 'FE001',
    INVALID_PASSWORD = 'FE002',
    INVALID_TOKEN = "FE003",
    SAME_PASSWORD_AS_OLD = "FE004",
    UNKNOWN = 'FE999',
}

const errorMap: Record<string, FEErrorCode> = {
    InvalidPassword: FEErrorCode.INVALID_PASSWORD,
    UserNotFound: FEErrorCode.MISSING_EMAIL,
    InternalServerError: FEErrorCode.UNKNOWN,
    InvalidToken: FEErrorCode.INVALID_TOKEN,
    SamePasswordAsOld: FEErrorCode.SAME_PASSWORD_AS_OLD,
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

            case FEErrorCode.INVALID_TOKEN:
                return 'Fehler: Auth Token ist ungültig.';

            case FEErrorCode.SAME_PASSWORD_AS_OLD:
                return "Fehler: Das neue Passwort ist das gleiche wie das alte."

            default:
                return 'Ein unbekannter Fehler ist aufgetreten.';
        }
    }

    public parseErrorCode(param: string | null): FEErrorCode {
        if (!param) FEErrorCode.UNKNOWN;
        if (!(param! in errorMap))
            return FEErrorCode.UNKNOWN;

        return errorMap[param!];
    }
}
