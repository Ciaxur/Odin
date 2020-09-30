/**
 * Data Storage System
 *  - Handle how Data is Read and Stored
 *  - This includes Caching Data
 */
import * as fs from 'fs';
import * as path from 'path';

interface BulbInfo {
  address: string;
  name: string;
}

class DataStorage {
  // Default File Path
  private static filePath: string = path.join(__dirname, 'bulbInfo.json');
  
  /**
   * Loads Bulb Data from Pre-Set File
   * @param obj - Object to store data to
   */
  static loadBulbData(obj) {
    fs.readFile(
      this.filePath,
      { encoding: 'utf-8' },
      (err, res) => {
        if (err) {
          // No File
          console.error(`Error Reading File: ${err}`);
          
          // Create File
          return fs.writeFile(
            this.filePath,
            JSON.stringify([{}]),
            { encoding: 'utf-8' }, (err) => {
              if (err) console.log('Error Creating File:', err);
              return 1;
            });
        }

        // Store Parsed Data
        for (const elt of JSON.parse(res)) {
          obj[elt.address] = elt;
        }
      }
    );
  }

  /**
   * Updates Bulb Data to Preset File
   * @param obj - Object to Save to file
   */
  static updateBulbData(obj) {
    const data = [];
    for (const key of Object.keys(obj)) data.push(obj[key]);

    let file = fs.createWriteStream(path.join(__dirname, 'bulbInfo.json'), {
      flags: 'w',
    });
    file.on('error', (e) => console.error('ERROR:', e));
    file.write(JSON.stringify(data));
    file.end();
  }
}

export { DataStorage, BulbInfo };
