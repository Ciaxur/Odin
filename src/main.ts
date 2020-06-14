/**
 * Mjölnir Central Processing
 *  - Takes care of all Requests from Nodes
 *      and outside requests to send TO the Nodes
 */
import * as express from 'express';
import * as cors from 'cors';
import * as rateLimit from 'express-rate-limit';
import * as morgan from 'morgan';
import * as path from 'path';
import * as fs from 'fs';
import { createSocket } from 'dgram';
import { Control } from 'magic-home';
import MagicLight from './Library/MagicLight';
import Discovery from './Discovery';
import { DataStorage, BulbInfo } from './Library/DataStorage';
import { BulbRequest, validateBulbRequest } from './Components/Bulb';
import { BatteryRequest, NodeCollection } from './Components/Node';
require('dotenv').config();

// Setup Application
const app = express();
app.use(express.json());
app.use(cors());
app.use(rateLimit({
    windowMs: 1000,         // 1 Second
    max: 5                  // limit each IP to 100 requests per windowMs
}));  // Setup Request Limiter

// Setup Middleware Logger
const fileStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('tiny', { stream: fileStream }));


// Default Response Interface
interface Response {
    message: any,
    code: number
};

interface ConfigRequest {
    configure: 'name',          // What to Configure
    address: string,            // Address of Bulb to Configure
    value: string,              // Value to Configure
};

// HashMap of Stored Bulbs based on IP
//  - Load Stored Data in
const storedBulbInfo = [];
DataStorage.loadBulbData(storedBulbInfo);

// Node Related Data
const nodes: NodeCollection = {};




app.get('/', (request, response) => {   // Redirect to Athens Central Node
    response.redirect('http://192.168.0.96:8080');
});


app.post('/config', (req, res) => {     // Configure Bulb Information
    const request: ConfigRequest = req.body;

    // Check Configuration Request
    if (request.configure === 'name') { // Request to Modify the Name of a Bulb
        // Validation & Update Bulb Alias Name
        if ((request.address && typeof request.address === 'string') &&
            (request.value   && typeof request.value === 'string')) {
                storedBulbInfo[request.address] = {
                    address: request.address,
                    name: request.value,
                } as BulbInfo;
            }
        

        // Handle Unknown Address or Value
        else {
            res.json({
                code: 400,
                message: `Unknown 'address': '${request.address}'[string] or 'value': '${request.value}'[string]`
            } as Response);
            return;
        }
            
    }


    // Handle Unknown Configure Request
    else {
        res.json({
            code: 400,  // Bad Request
            message: `Unknown Configuration Request: '${request.configure}'`
        } as Response);
        return;
    }
    

    // Update File Storage
    DataStorage.updateBulbData(storedBulbInfo);

    // Respond [Code 200]
    res.json({
        message: "Successfuly Configured!",
        code: 200
    } as Response);
});

app.get('/config', (_, res) => {        // Returns the Stored Configuration
    // Compile Stored Config into Readable Array
    const config = [];
    for(const key of Object.keys(storedBulbInfo))
        config.push(storedBulbInfo[key]);

    // Respond with Configuration Info
    res.json({
        message: config,
        code: 200
    } as Response);
});


app.post('/lights', (req, res) => {     // Perform Action on Light Bulb
    if(validateBulbRequest(req.body)) {
        const objReq: BulbRequest = req.body;

        // Link to Light Bulb
        const light = new MagicLight(objReq.bulbAddr);
        
        // Check Action
        if (objReq.action === 'setPower') {
            objReq.actionValue ? light.turnOn() : light.turnOff();
        } 
        else if (objReq.action === 'blink') {
            objReq.actionValue ? light.turnOff() : light.turnOn();
            setTimeout(() => {
            objReq.actionValue ? light.turnOn() : light.turnOff();
            }, objReq.delay | 500);
        }
        else if(objReq.action === 'rgb') {
            light.setRGB(objReq.rgb);
        }
        else if(objReq.action === 'setWarm') {
            light.setWarm(objReq.actionValue as number);
        }
        else if(objReq.action === 'setCold') {
            light.setCold(objReq.actionValue as number);
        }

        // Handle Unknown Action
        else {
            res.send({
                code: 400,
                message: `Unknown Action '${objReq.action}'`
            } as Response);
            return;
        }

        // Successful Action
        res.json({
            code: 200,
            message: "Request Success!"
        } as Response);
    }


    // Invalid Request Body
    else {
        res.send({
            code: 400,
            message: "Invalid Request Body: Expected 'action'[string], 'bulbAddr'[string], " +
                     "and 'actionValue'[boolean/number]."
        } as Response);
    }
});

app.get('/lights', (_, response) => {   // Get Available Light Bulbs
    try {
        Discovery.scan(255).then(res => {
            // Query up Promises for each Address Found
            const devData = [];
            const queries = [];
            for (const dev of res) {
                devData.push({ address: dev.address });
                queries.push(new Control(dev.address).queryState());
            }

            // Compile all Results into a single Object Array
            Promise.all(queries).then(res => {
                for (const i in res) {
                    devData[i] = {
                        name: storedBulbInfo[devData[i].address] 
                            ? storedBulbInfo[devData[i].address].name : undefined,
                        address: devData[i].address,
                        power: res[i].on,
                        color: res[i].color,
                        warm_white: res[i].warm_white,
                        cold_white: res[i].cold_white
                    };
                }

                // Respond back
                response.send(devData);
            });
        });
    }
    catch(e) {
        console.log("Discovery Failed: ", e);

        // Internal Error
        response.json({
            code: 500,  // Internal Server Error
            message: `Internal Server Error: ${e}`
        } as Response);
    }
});


app.post('/node', (req, res) => {       // Handles Node Requests
    const obj: BatteryRequest = req.body;

    // No Body or no Data
    if(!obj || !obj.info || !obj.type || obj.value === null) {
        res.json({
            code: 400,
            message: `Invalid Body! ${obj ? "Expected info, type, and value" : "No Given Body"}.`
        } as Response);
        return;
    }

    // Handle Request
    else {
        // Store new Node
        if(!nodes[req.hostname]) {
            nodes[req.hostname] = {
                name: obj.name,
                address: req.hostname,
                battery: null,
            }
        }
        
        
        // Check for Request Type
        if(obj.type === 'battery' && obj.info === 'status') {   // Store Battery Value
            nodes[req.hostname].battery = obj.value;
        }
    }
    
    res.json({
        code: 200,
        message: "Success!"
    } as Response);
});

app.get('/node', (_, res) => {          // Returns Current Node Listing
    // Trigger Stored Nodes to update Battery info
    const client = createSocket('udp4');
    for(const key of Object.keys(nodes)) {
        // Construct Message
        const msg = {
            action: "battery"
        };

        // Send UDP
        client.send(
            JSON.stringify(msg),
            1117,
            nodes[key].address
        );
    }
    
    // Compile Stored Nodes into Readable Array
    const nodeData = [];
    for(const key of Object.keys(nodes))
        nodeData.push(nodes[key]);

    // Respond with Configuration Info
    res.json({
        message: nodeData,
        code: 200
    } as Response);
});


app.all("*", (_, res) => {              // Hanlde Not Found Requests
    res.json({
        code: 404,
        message: "Not Found!"
    } as Response);
})

// Start!
console.log(`Listening to localhost:3000`);
app.listen(3000);