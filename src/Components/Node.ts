/**
 * Node Interfaces and Methods for Connected
 *  Nodes
 */
export interface BatteryRequest {
    name:   string,          // Name of Node
    type:   'battery',       // Type of Request
    info:   'status',        // What about the type?
    value:  number           // Value about info
}

export interface Node {
    name: string,            // Node's Name
    address: string,         // IP Address of Node
    battery: number | null   // Node's Battery (Null -> No Battery)
}

export interface NodeCollection {
    [ipAddr: string]: Node
}

