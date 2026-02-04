import PySimpleGUI as sg

# Simple test to verify PySimpleGUI is working
layout = [
    [sg.Text('Parser 2GIS Test Window')],
    [sg.Button('OK')]
]

window = sg.Window('Test', layout)
event, values = window.read()
window.close()
print(f'Event: {event}')