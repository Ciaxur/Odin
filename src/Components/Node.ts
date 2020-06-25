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
