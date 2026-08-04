import asyncio
import websockets
import json

# Store file paths globally
file_paths = {
    "usd_file_path": "",
    "glb_file_path": ""
}

# Set of connected WebSocket clients
connected_clients = set()

async def handle_connection(websocket):
    """Handles WebSocket client connections."""
    print(f"Client connected: {websocket.remote_address}")
    connected_clients.add(websocket)

    try:
        # Send initial file paths to the newly connected client
        await websocket.send(json.dumps(file_paths))

        async for message in websocket:
            data = json.loads(message)

            # If the client sends an update request
            if "usd_file_path" in data or "glb_file_path" in data:
                file_paths["usd_file_path"] = data.get("usd_file_path", "")
                file_paths["glb_file_path"] = data.get("glb_file_path", "")

                # Broadcast updated file paths to all clients
                await broadcast(json.dumps(file_paths))

    except websockets.exceptions.ConnectionClosed:
        print(f"Client disconnected: {websocket.remote_address}")
    except Exception as e:
        print(f"Error handling connection: {e}")
    finally:
        connected_clients.remove(websocket)

async def broadcast(message):
    """Send a message to all connected clients."""
    if connected_clients:
        tasks = [asyncio.create_task(client.send(message)) for client in connected_clients]
        await asyncio.gather(*tasks)

async def start_server():
    """Start the WebSocket server."""
    try:
        server = await websockets.serve(handle_connection, "0.0.0.0", 5000)
        print("WebSocket server started at ws://localhost:5000")
        await server.wait_closed()
    except Exception as e:
        print(f"Error starting the WebSocket server: {e}")

if __name__ == "__main__":
    asyncio.run(start_server())
