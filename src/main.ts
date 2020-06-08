import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Control, Discovery } from 'magic-home';
import { BulbRequest, validateBulbRequest } from './Components/Bulb';

// Setup Application
const app = express();
app.use(bodyParser.json({
    type: 'application/json'
}))


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

app.get('/lights', (req, res) => {      // Get Available Light Bulbs
    Discovery.scan(500)
        .then(dev => res.send(dev));
});


// Start!
console.log(`Listening to localhost:3000`);
app.listen(3000);
