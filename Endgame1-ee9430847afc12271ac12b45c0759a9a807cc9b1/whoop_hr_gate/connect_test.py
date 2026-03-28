import asyncio
from bleak import BleakScanner, BleakClient

async def main():
    devices = await BleakScanner.discover(timeout=8)

    for d in devices:
        if d.name and "WHOOP" in d.name.upper():
            print("Found:", d.address, d.name)
            addr = d.address

            try:
                async with BleakClient(addr, timeout=30.0) as client:
                    print("Connected:", client.is_connected)

                    services = client.services  # Bleak populates this after connecting
                    if services is None:
                        print("Services not available (client.services is None).")
                        return

                    services_list = list(services)
                    print("Service count:", len(services_list))
                    for s in services_list:
                        print("Service:", s.uuid)

            except Exception as e:
                print("Connect failed:", e)

            return  # stop after first WHOOP device found

    print("No WHOOP device found. Make sure Heart Rate Broadcast is enabled in the WHOOP app.")

if __name__ == "__main__":
    asyncio.run(main())
