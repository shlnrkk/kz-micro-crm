import PySimpleGUI as sg

print(f"PySimpleGUI version: {sg.version}")
print("Creating test window...")

# Simple test layout
layout = [
    [sg.Text("Parser2GIS GUI Test")],
    [sg.Text("If you see this window, GUI is working!")],
    [sg.Button("Close")]
]

# Create window
window = sg.Window("GUI Test", layout, finalize=True)
print("Window created successfully!")

# Read event
event, values = window.read(timeout=3000)  # 3 second timeout
print(f"Event received: {event}")

window.close()
print("Test completed!")