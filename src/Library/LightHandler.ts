import { BulbRequest } from "../Components/Bulb";
import MagicLight from "./MagicLight";

/**
 * Handles Light Request based on Action
 * @param objReq Bulb Request Object
 * @param light The Light Object
 * @return Handle State
 */
export function handleLightAction(objReq: BulbRequest, light: MagicLight): boolean {
    // Handle Action Given    
    if (objReq.action === 'setPower') {
        objReq.actionValue ? light.turnOn() : light.turnOff();
    }
    else if (objReq.action === 'blink') {
        objReq.actionValue ? light.turnOff() : light.turnOn();
        setTimeout(() => {
            objReq.actionValue ? light.turnOn() : light.turnOff();
        }, objReq.delay | 500);
    }
    else if (objReq.action === 'rgb') {
        light.setRGB(objReq.rgb);
    }
    else if (objReq.action === 'setWarm') {
        light.setWarm(objReq.actionValue as number);
    }
    else if (objReq.action === 'setCold') {
        light.setCold(objReq.actionValue as number);
    }

    // Did not Handle
    else
        return false;

    // Handled Successfuly
    return true;
}