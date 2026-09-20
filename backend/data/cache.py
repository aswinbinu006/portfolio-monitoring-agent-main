"""
Simple file-based cache with TTL support.
Caches API responses to minimize external calls and respect rate limits.
"""
import json
import pickle
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
from typing import Any, Optional, Callable
import functools


class Cache:
    """
    File-based cache with TTL (time-to-live) support.
    
    Uses pickle for Python objects, JSON for simple data.
    """
    
    def __init__(self, cache_dir: str = ".cache", default_ttl: int = 900):
        """
        Initialize cache.
        
        Args:
            cache_dir: Directory to store cache files
            default_ttl: Default TTL in seconds (900 = 15 minutes)
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.default_ttl = default_ttl
    
    def _get_cache_key(self, key: str) -> str:
        """Generate cache filename from key."""
        # Hash the key to create a valid filename
        key_hash = hashlib.md5(key.encode()).hexdigest()
        return f"{key_hash}.cache"
    
    def _get_cache_path(self, key: str) -> Path:
        """Get full path to cache file."""
        return self.cache_dir / self._get_cache_key(key)
    
    def _is_expired(self, cache_path: Path, ttl: int) -> bool:
        """Check if cache file is expired."""
        if not cache_path.exists():
            return True
        
        # Check file modification time
        mtime = datetime.fromtimestamp(cache_path.stat().st_mtime)
        age = datetime.now() - mtime
        
        return age.total_seconds() > ttl
    
    def get(self, key: str, ttl: Optional[int] = None) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            ttl: Time-to-live in seconds (None = use default)
        
        Returns:
            Cached value or None if not found/expired
        """
        if ttl is None:
            ttl = self.default_ttl
        
        cache_path = self._get_cache_path(key)
        
        # Check if expired
        if self._is_expired(cache_path, ttl):
            return None
        
        try:
            with open(cache_path, 'rb') as f:
                data = pickle.load(f)
            return data
        except Exception:
            # If any error, treat as cache miss
            return None
    
    def set(self, key: str, value: Any):
        """
        Store value in cache.
        
        Args:
            key: Cache key
            value: Value to cache (must be pickleable)
        """
        cache_path = self._get_cache_path(key)
        
        try:
            with open(cache_path, 'wb') as f:
                pickle.dump(value, f)
        except Exception as e:
            # Log but don't fail if caching fails
            print(f"Warning: Failed to cache {key}: {e}")
    
    def delete(self, key: str):
        """Delete a cache entry."""
        cache_path = self._get_cache_path(key)
        if cache_path.exists():
            cache_path.unlink()
    
    def clear(self):
        """Clear all cache entries."""
        for cache_file in self.cache_dir.glob("*.cache"):
            cache_file.unlink()
    
    def get_stats(self) -> dict:
        """Get cache statistics."""
        cache_files = list(self.cache_dir.glob("*.cache"))
        
        total_size = sum(f.stat().st_size for f in cache_files)
        
        return {
            "entries": len(cache_files),
            "total_size_bytes": total_size,
            "total_size_mb": total_size / (1024 * 1024),
            "cache_dir": str(self.cache_dir)
        }


def cached(ttl: int = 900, cache_instance: Optional[Cache] = None):
    """
    Decorator to cache function results.
    
    Args:
        ttl: Time-to-live in seconds
        cache_instance: Cache instance to use (creates default if None)
    
    Example:
        @cached(ttl=3600)
        def expensive_api_call(param):
            return fetch_data(param)
    """
    if cache_instance is None:
        cache_instance = Cache()
    
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_parts = [func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
            cache_key = ":".join(key_parts)
            
            # Try to get from cache
            cached_value = cache_instance.get(cache_key, ttl=ttl)
            if cached_value is not None:
                return cached_value
            
            # Call function and cache result
            result = func(*args, **kwargs)
            cache_instance.set(cache_key, result)
            
            return result
        
        return wrapper
    
    return decorator


# Global cache instances for different data types
_price_cache = Cache(cache_dir=".cache/prices", default_ttl=900)  # 15 min
_fundamental_cache = Cache(cache_dir=".cache/fundamentals", default_ttl=86400)  # 24 hours
_news_cache = Cache(cache_dir=".cache/news", default_ttl=3600)  # 1 hour


def get_price_cache() -> Cache:
    """Get global price cache instance."""
    return _price_cache


def get_fundamental_cache() -> Cache:
    """Get global fundamental cache instance."""
    return _fundamental_cache


def get_news_cache() -> Cache:
    """Get global news cache instance."""
    return _news_cache


def clear_all_caches():
    """Clear all cache instances."""
    _price_cache.clear()
    _fundamental_cache.clear()
    _news_cache.clear()


def get_all_cache_stats() -> dict:
    """Get statistics for all caches."""
    return {
        "prices": _price_cache.get_stats(),
        "fundamentals": _fundamental_cache.get_stats(),
        "news": _news_cache.get_stats()
    }


if __name__ == "__main__":
    # Demo usage
    cache = Cache()
    
    # Set and get
    cache.set("test_key", {"data": "test_value", "number": 42})
    print("Cached:", cache.get("test_key"))
    
    # Test expiry
    import time
    cache.set("short_lived", "expires soon")
    print("Before expiry:", cache.get("short_lived", ttl=2))
    time.sleep(3)
    print("After expiry:", cache.get("short_lived", ttl=2))
    
    # Stats
    print("Cache stats:", cache.get_stats())
