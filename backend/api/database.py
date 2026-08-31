
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient


# Load the existing .env from my_agent
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / "my_agent" / ".env"

load_dotenv(ENV_FILE)


MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")


if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is not configured")

if not MONGODB_DB_NAME:
    raise RuntimeError("MONGODB_DB_NAME is not configured")


client = MongoClient(MONGODB_URI)

db = client[MONGODB_DB_NAME]

print(f"Connected to MongoDB database: {MONGODB_DB_NAME}")

