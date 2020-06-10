export interface BulbRequest {
    bulbAddr:           string,
    action:             'setPower' | 'blink' | 'rgb' | 'setCold' | 'setWarm',
    actionValue:        boolean | number,
    rgb: { 
        r: number, g: number, b: number 
    },
    delay?:             number
};

export function validateBulbRequest(obj: BulbRequest) {
    if (obj &&  (obj.bulbAddr               && typeof obj.bulbAddr      === 'string') &&
                (obj.action                 && typeof obj.action        === 'string') &&
                (obj.actionValue !== null   && typeof obj.actionValue   === 'boolean' || 'string')) {
            return true;
        }
    return false;
}