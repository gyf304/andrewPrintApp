#!/usr/bin/env python

import asyncio
import websockets

async def hello(websocket, path):
    while True:
        name = await websocket.recv()
        print("< {}".format(name))

        greeting = r"\0"
        await websocket.send(greeting)
        print("> {}".format(greeting))

start_server = websockets.serve(hello, 'localhost', 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
