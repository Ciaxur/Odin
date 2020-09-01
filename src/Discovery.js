/**
 * Modified Discovery Library to change the
 *  Bound IP
 *
 */
import { Discovery } from 'magic-home';
const dgram = require('dgram');
const os = require('os');

const DISCOVERY_PORT = 48899;
const BROADCAST_ADDR = '255.255.255.255';

Discovery.prototype.scan = function (timeout = 500, callback = undefined) {
  let promise = new Promise((resolve, reject) => {
    let socket = dgram.createSocket('udp4');

    let addresses = [];

    if (os.platform() == 'win32') {
      let ifaces = os.networkInterfaces();

      for (let i in ifaces) {
        let iface_addresses = ifaces[i]
          .filter((iface) => iface.family == 'IPv4' && !iface.internal)
          .map((iface) => iface.address);

        // create broadcast address from interface adress
        iface_addresses = iface_addresses.map((addr) => {
          let blocks = addr.split('.');
          blocks[3] = '255';
          return blocks.join('.');
        });

        addresses.push(...iface_addresses);
      }
    } else {
      addresses = [BROADCAST_ADDR];
    }

    socket.on('error', (err) => {
      socket.close();
      reject(err);
    });

    socket.on('message', (msg, rinfo) => {
      let tmpInfos = msg.toString().split(',');

      if (tmpInfos.length == 3) {
        this._clients.push({
          address: tmpInfos[0],
          id: tmpInfos[1],
          model: tmpInfos[2],
        });
      }
    });

    socket.on('listening', () => {
      socket.setBroadcast(true);

      addresses.forEach((addr) =>
        socket.send('HF-A11ASSISTHREAD', DISCOVERY_PORT, addr)
      );
    });

    socket.bind(DISCOVERY_PORT, process.env.LOCAL_IP);

    setTimeout(() => {
      try {
        socket.close();

        this._scanned = true;
        resolve(this._clients);
      } catch (e) {
        console.error(`Timeout Error: ${e}`);
      }
    }, timeout);
  });

  if (callback && typeof callback == 'function') {
    promise.then(callback.bind(null, null), callback);
  }

  return promise;
};

export default Discovery;
