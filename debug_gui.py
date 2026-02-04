import sys
import os

# Add the project directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing GUI components...")
    
    # Test PySimpleGUI import
    import PySimpleGUI as sg
    print(f"PySimpleGUI version: {sg.version}")
    
    # Test basic window creation
    layout = [[sg.Text("Parser 2GIS - GUI Test")], [sg.Button("Close")]]
    window = sg.Window("Test Window", layout, finalize=True)
    print("Window created successfully")
    
    # Read event (this will block until window is closed)
    event, values = window.read()
    print(f"Event received: {event}")
    window.close()
    
    print("GUI test completed successfully!")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()