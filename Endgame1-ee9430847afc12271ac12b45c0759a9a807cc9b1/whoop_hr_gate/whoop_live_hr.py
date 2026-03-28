import asyncio
from bleak import BleakClient

# Standard BLE Heart Rate Measurement characteristic UUID
HR_MEASUREMENT_UUID = "00002a37-0000-1000-8000-00805f9b34fb"

def parse_hr(data: bytearray) -> int:
    flags = data[0]
    hr_16bit = flags & 0x01
    if hr_16bit:
        return int(data[1] | (data[2] << 8))
    return int(data[1])

async def main():
    WHOOP_ADDRESS = "CC:06:C6:D6:E4:D0"  # from ble_scan.py

    async with BleakClient(WHOOP_ADDRESS) as client:
        if not client.is_connected:
            raise RuntimeError("Failed to connect to WHOOP over BLE.")

        def on_hr(_, data: bytearray):
            hr = parse_hr(data)
            print("HR:", hr)

        await client.start_notify(HR_MEASUREMENT_UUID, on_hr)
        print("Listening for live HR... Ctrl+C to stop.")
        while True:
            await asyncio.sleep(1)

asyncio.run(main())
