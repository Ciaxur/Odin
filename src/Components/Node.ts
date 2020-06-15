/**
 * Node Interfaces and Methods for Connected
 *  Nodes
 */
export interface NodeRequest {
    name:   string,                         // Name of Node
    type:   'battery' | 'node',             // Type of Request
    info:   'status' | CollectionConfig     // What about the type?
    value:  number                          // Value about info
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
