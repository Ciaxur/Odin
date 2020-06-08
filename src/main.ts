import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as rateLimit from 'express-rate-limit';
import { Control, Discovery } from 'magic-home';
import { BulbRequest, validateBulbRequest } from './Components/Bulb';

// Setup Application
const app = express();
app.use(bodyParser.json({
    type: 'application/json'
}))
app.use(cors());
app.use(rateLimit({
    windowMs: 1000,         // 1 Second
    max: 5                  // limit each IP to 100 requests per windowMs
}));  // Setup Request Limiter

// Default Response Interface
interface Response {
    message: string,
    code: number
};



app.get('/', (request, response) => {   // DEBUG: Debug Request Body
    console.log(request.body);
    
    response.send({
        "message": "Accepted",
        "code": 200
    });
});


app.post('/lights', (req, res) => {     // Perform Action on Light Bulb
    if(validateBulbRequest(req.body)) {
        const objReq: BulbRequest = req.body;

        // Link to Light Bulb
        const light = new Control(objReq.bulbAddr);
        
        // Check Action
        if (objReq.action === 'setPower') {
            light.setPower(objReq.actionValue);
        } 
        else if (objReq.action === 'blink') {
            light.setPower(objReq.actionValue);
            setTimeout(() => light.setPower(!objReq.actionValue), objReq.delay | 500);
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

app.get('/lights', (_, response) => {      // Get Available Light Bulbs
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
        console.log("Disocvery Failed: ", e);
    }
});


// Start!
console.log(`Listening to localhost:3000`);
app.listen(3000);
