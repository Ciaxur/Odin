export interface BulbRequest {
    bulbAddr:           string,
    action:             'setPower' | 'blink',
    actionValue:        boolean,
    delay?:             number
};

export function validateBulbRequest(obj: BulbRequest) {
    if (obj &&  (obj.bulbAddr               && typeof obj.bulbAddr      === 'string') &&
                (obj.action                 && typeof obj.action        === 'string') &&
                (obj.actionValue !== null   && typeof obj.actionValue   === 'boolean')) {
            return true;
        }
    return false;
}