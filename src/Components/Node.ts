import MagicLight from "../Library/MagicLight";
import { handleLightAction } from "../Library/LightHandler";

/**
 * Node Interfaces and Methods for Connected
 *  Nodes
 */
interface RGB {
    r: number,
    g: number,
    b: number
}

export interface NodeRequest {
    name:   string,                         // Name of Node
    type:   'battery' | 'node' | 'led',     // Type of Request
    info:   'status' | CollectionConfig     // What about the type?
    value:  number | RGB,                   // Value about info
    addr?:  string                          // (Optional) Address of Node
}


// Configure Existing Node Collection
export interface CollectionConfig {
    config: 'add' | 'remove' | 'modify',    // Configuration Type
    address: 'string',                      // Node's IP Address
    data: Node | null                       // Configure to this Data
}

export interface Node {
    name: string,                   // Node's Name
    address: string,                // IP Address of Node
    battery: number | null,         // Node's Battery (Null -> No Battery)
    status: 'online' | 'offline',   // Online Status
}

export interface NodeCollection {
    [ipAddr: string]: Node
}

export interface NodeEvent {
    timeoutID: NodeJS.Timeout,      // Timeout ID Associated with Event
    description: string,            // Description of the Event
    date: Date,                     // Actual Assigned Date of Timeout
}

export interface NodeEventCollection {
    [ipAddr: string]: NodeEvent[],        // Maps Node IP to a Stored Event
}

export interface NodeEventExec {        // Event Execution Object
    action: 'setPower' | 'blink' | 'rgb' | 'setCold' | 'setWarm',
    value: RGB | number | boolean,
}



/**
 * Creates a Function based on the Event to Execute
 *  - Removes Event from Collection after Execution
 * @param eventExec Event Execute Object
 * @param light Light to Execute on
 * @param event Current Event
 * @param eventCollection Collection of Events
 */
export function getEventExec(eventExec: NodeEventExec, lightAddr: string, event: NodeEvent, eventCollection: NodeEventCollection): () => void {
    return () => {
        // Construct Bulb Object
        const light = new MagicLight(lightAddr);
        
        // Handle the Request
        const res = handleLightAction({
            action: eventExec.action,
            actionValue: eventExec.value as string | number | boolean | NodeEventExec,
            rgb: eventExec.value as RGB,
            bulbAddr: lightAddr,
        }, light);

        // CLEANUP: REMOVE EVENT FROM COLLECTION
        if(res)
            eventCollection[lightAddr] = eventCollection[lightAddr].filter(e => e != event);
    };
}