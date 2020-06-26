import { NodeEventExec } from "./Node";

export interface BulbRequest {
    bulbAddr:           string,
    action:             'setPower' | 'blink' | 'rgb' | 'setCold' | 'setWarm' | 'event',
    eventTime?:         Date,
    description?:       string,
    actionValue:        boolean | number | string | NodeEventExec,
    rgb: { 
        r: number, g: number, b: number 
    },
    delay?:             number
};

export function validateBulbRequest(obj: BulbRequest) {
    if (obj &&  (obj.bulbAddr               && typeof obj.bulbAddr      === 'string') &&
                (obj.action                 && typeof obj.action        === 'string') &&
                (obj.actionValue !== null   && typeof obj.actionValue   === 'boolean' || 'string' || 'object')) {
            return true;
        }
    return false;
}