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
import * as util from 'util';
import { Control } from 'magic-home';
import MagicLight from './Library/MagicLight';
import Discovery from './Discovery';
import { DataStorage } from './Library/DataStorage';
import { BulbRequest, validateBulbRequest } from './Components/Bulb';
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
    message: string,
    code: number
};

// HashMap of Stored Bulbs based on IP
//  - Load Stored Data in
const storedBulbInfo = [];
DataStorage.loadBulbData(storedBulbInfo);


app.get('/', (request, response) => {   // DEBUG: Debug Request Body
    console.log(request.body);
    
    response.send({
        "message": util.inspect(storedBulbInfo),
        "code": 200
    });
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
            objReq.actionValue ? light.turnOn() : light.turnOff();
            light.setRGB(objReq.rgb);
        }
        else if(objReq.action === 'setWarm') {
            light.setWarm(objReq.actionValue as number);
        }
        else if(objReq.action === 'setCold') {
            light.setCold(objReq.actionValue as number);
        }
        else {
            res.send({
                code: 400,
                message: `Unknown Action '${objReq.action}'`
            } as Response);
        }

        res.send({
            code: 200,
            message: "Request Success!"
        } as Response);
    }

    else {
        res.send({
            code: 400,
            message: "Invalid Request Body"
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
    }
});

// Start!
console.log(`Listening to localhost:3000`);
app.listen(3000);