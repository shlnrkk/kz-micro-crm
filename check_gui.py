import sys
import os

# Add the project directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Checking GUI availability...")
    
    # Import the common module to check GUI detection
    from parser_2gis.common import GUI_ENABLED
    print(f"GUI_ENABLED: {GUI_ENABLED}")
    
    if GUI_ENABLED:
        print("GUI is available, testing PySimpleGUI...")
        import PySimpleGUI as sg
        print(f"PySimpleGUI imported successfully, version: {getattr(sg, 'version', 'unknown')}")
        
        # Try to create a simple window
        layout = [[sg.Text("GUI Test - If you see this window, GUI works!")], 
                 [sg.Button("OK")]]
        window = sg.Window("GUI Test", layout, finalize=True)
        print("Window created, waiting for user interaction...")
        event, values = window.read(timeout=5000)  # 5 second timeout
        window.close()
        print(f"Window closed with event: {event}")
    else:
        print("GUI is not available - checking why...")
        try:
            import tkinter as tk
            print("tkinter is available")
        except ImportError as e:
            print(f"tkinter import error: {e}")
            
        try:
            import PySimpleGUI as sg
            print(f"PySimpleGUI imported but GUI_ENABLED is False")
        except ImportError as e:
            print(f"PySimpleGUI import error: {e}")
            
except Exception as e:
    print(f"Error during GUI check: {e}")
    import traceback
    traceback.print_exc()