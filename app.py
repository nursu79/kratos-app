import uvicorn
import os
import sys

# Add backend to path so we can import modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

if __name__ == "__main__":
    print("Starting Kratos Quantale Backend...")
    # Run the main app from the backend directory
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
