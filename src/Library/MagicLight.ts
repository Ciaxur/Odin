import { exec } from 'child_process';

interface ScanResult {
    found: number,      // Number of Bulbs Found
    bulbs: {
        id: string,     // Bulb's ID
        addr: string    // Bulb's IP Address
    }[]
};

interface BulbInfo {
    power: boolean,
    rgb: {
        r: number,
        g: number,
        b: number
    },
    warmWhite: number,
    brightness: number,
};

class MagicLight {
    // Private Variables
    private bulbIP: string;
    private bulbInfo: BulbInfo;
    

    constructor(bulbIP: string) {
        this.bulbIP = bulbIP;
    }

    /**
     * @return Basic Information about Stored Bulb
     */
    public getInfo(): Promise<BulbInfo> {
        return new Promise<BulbInfo>((res, rej) => {
            if (this.bulbInfo) res(this.bulbInfo);  // Check if Cached Info
            
            
            exec(`flux_led -i ${this.bulbIP}`, (error, stdout, stderr) => {
                if(error || stderr) rej(error ? error : stderr);
                else {
                    let temp = stdout.substr(stdout.indexOf(']')+1, stdout.length).split(' ')
                        .filter((str, i, arr) => str !== '')

                    const obj: BulbInfo = {
                        power: temp[0] === 'OFF' ? false : true,
                        rgb: {
                            r: temp[2] === 'White:' ? 0 : parseInt(temp[2].replace(/[(|)]/g, '')),
                            g: temp[2] === 'White:' ? 0 : parseInt(temp[3]),
                            b: temp[2] === 'White:' ? 0 : parseInt(temp[4].replace(/[(|)]/g, ''))
                        },
                        warmWhite: temp[2] === 'White:' ? parseInt(temp[3].replace('%', '')) : 0,
                        brightness: parseInt(temp[6])
                    }
                    console.log(temp);

                    this.bulbInfo = obj;
                    res(obj);
                }
            });
        });
    }

    /**
     * Turns Light Bulb On
     */
    public turnOn(): Promise<Boolean> {
        return new Promise<boolean>((res, rej) => {
            exec(`flux_led --on ${this.bulbIP}`, (error, stdout, stderr) => {
                if(error || stderr) rej(error ? error : stderr);
                res(true);
            });
        });
    }

    /**
     * Turns Light Bulb Off
     */
    public turnOff(): Promise<boolean> {
        return new Promise<boolean>((res, rej) => {
            exec(`flux_led --off ${this.bulbIP}`, (error, stdout, stderr) => {
                if(error || stderr) rej(error ? error : stderr);
                res(true);
            });
        });
    }


    /**
     * Sets the Bulb's RGB Values
     * @param rgb - RGB Object of Red, Green Blue
     */
    public setRGB(rgb: {r: number, g: number, b: number}): Promise<Boolean> {
        return new Promise<Boolean>((res, rej) => {
            exec(`flux_led ${this.bulbIP} -c ${rgb.r},${rgb.g},${rgb.b}`, (error, stdout, stderr) => {
                if(error || stderr) rej(error ? error : stderr);
                res(true);
            });
        });
    }


    /**
     * Set the Warm Value of Bulb
     * @param val - 0-100% Value
     */
    public setWarm(val: number): Promise<Boolean> {
        return new Promise<Boolean>((res, rej) => {
            exec(`flux_led ${this.bulbIP} -w ${val}`, (error, stdout, stderr) => {
                if(error || stderr) rej(error ? error : stderr);
                res(true);
            });
        });
    }

    /**
     * Set the Cold Value of Bulb
     * @param val - 0-100% Value
     */
    public setCold(val: number): Promise<Boolean> {
        return new Promise<Boolean>((res, rej) => {
            exec(`flux_led ${this.bulbIP} --coldwhite ${val}`, (error, stdout, stderr) => {
                if(error || stderr) rej(error ? error : stderr);
                res(true);
            });
        });
    }
    

    /**
     * Scans for Devices on the Local Network
     * @returns Promise of type ScanResult
     */
    static scan(): Promise<ScanResult> {
        return new Promise((res, rej) => {
            exec('flux_led -s', (error, stdout, stderr) => {
                if(error || stderr) rej(error ? error : stderr);
                else {
                    // Split up String Result
                    const buffArr = stdout.split('\n');
                    const obj: ScanResult = {
                        found: parseInt(buffArr[0][0]),
                        bulbs: []
                    };

                    // Add on the Bulbs'  Address and ID
                    for (const dev of buffArr.slice(1, buffArr.length-1)) {
                        const devs = dev.trim().split(' ');
                        obj.bulbs.push({id: devs[0], addr: devs[1]});
                    }
                    
                    // Return the Object
                    res(obj);
                }
            })
        });
    }
};

export default MagicLight;