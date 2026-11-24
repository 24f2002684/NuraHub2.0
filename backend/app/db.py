import redis
from pymongo import MongoClient
from app import config

# PyMongo manages an internal connection pool, making a single client safe and efficient
mongo_client = MongoClient(config.MONGODB_URI)
db = mongo_client[config.MONGODB_DB]

# Dedicated collections for auth and user profiles
users_col = db["users"]
profiles_col = db["profiles"]

# Redis client: handles transient session keys only (decode_responses=True returns str instead of bytes)
redis_client = redis.from_url(config.REDIS_URL, decode_responses=True)
