#!/usr/bin/env python3

print("Testing Parser2GIS...")

try:
    from parser_2gis import main
    print("Import successful!")
    
    # Try to run the main function
    print("Running main function...")
    main()
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()