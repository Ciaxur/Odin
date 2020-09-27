# Mjölnir Core Process

## Prerequisites 📦
- `Flux LED` - Python Package used to Interacte with Light Bulbs

```bash
pip install flux_led    # Python Install Package
```

## Required Environment Variables
All Environment Variables are set in the [.env](.env) file.

- `LOCAL_IP` - The Gateway IP for where to Scan for Light Bulbs
  > If running on local network, prob 192.168.0.xxx
  > If you are using an Access Point with a different Gateway, then use that

## Access Point (Optional)
Under the `scripts` Directory, there is a script that runs the configuration set in that directory.
Rename the **ap_config.sample** to **ap_config** and change Configuration to your preference

**Main Configuration Changes**
- `SSID`: The SSID used for the LED's Connection
- `PASSPHRASE`: The Password used for the LED's Connection