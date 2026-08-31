import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

# Always load the .env file located next to this file
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")

if not MONGODB_URI:
    raise ValueError("MONGODB_URI is not set in .env")

if not MONGODB_DB_NAME:
    raise ValueError("MONGODB_DB_NAME is not set in .env")

client = MongoClient(MONGODB_URI)

client.admin.command("ping")

db = client[MONGODB_DB_NAME]

print(f"Connected to MongoDB database: {MONGODB_DB_NAME}")