#!/usr/bin/env python3
"""
Test script for the 3D model generation worker

This script helps you test the worker by:
1. Checking if Redis is running
2. Checking if required environment variables are set
3. Queuing a test job
4. Monitoring the job status
"""

import redis
import json
import uuid
import os
import sys
import time
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def check_redis():
    """Check if Redis is accessible"""
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        print(f"Checking Redis connection: {redis_url}")
        
        r = redis.from_url(redis_url)
        r.ping()
        print("Redis is accessible")
        return r
    except Exception as e:
        print(f"Redis connection failed: {e}")
        print("\n💡 Make sure Redis is running:")
        print("   - macOS: brew services start redis")
        print("   - Linux: sudo systemctl start redis")
        print("   - Docker: docker run -d -p 6379:6379 redis:7-alpine")
        sys.exit(1)


def check_env_vars():
    """Check if required environment variables are set"""
    print("\nChecking environment variables...")
    
    required_vars = [
        "REDIS_URL",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "BACKEND_URL"
    ]
    
    missing_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            display_value = value[:20] + "..." if len(value) > 20 else value
            if "KEY" in var or "SECRET" in var:
                display_value = "*" * 10
            print(f"   {var}: {display_value}")
        else:
            print(f"   {var}: NOT SET")
            missing_vars.append(var)
    
    if missing_vars:
        print(f"\nWarning: Some environment variables are not set: {', '.join(missing_vars)}")
        print("   The worker may fail during execution.")
        print("   Create a .env file in the worker directory with these variables.")
    else:
        print("\nAll required environment variables are set")


def queue_test_job(redis_client, use_real_image=False):
    """Queue a test job to Redis using proper Celery message format"""
    print("\n📤 Queueing test job...")
    
    job_id = str(uuid.uuid4())
    celery_task_id = str(uuid.uuid4())
    
    # Use a real test image or placeholder
    if use_real_image:
        # Free test image from Unsplash - high quality product photo
        test_image_url = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1024"
        print("   Using real product image from Unsplash (watch)")
    else:
        # Placeholder image
        test_image_url = "https://via.placeholder.com/512"
        print("   Using placeholder image")
    
    # Create proper Celery message format
    task_message = {
        'task': 'generate_3d_model',
        'id': celery_task_id,
        'args': [],
        'kwargs': {
            "job_id": job_id,
            "shop": "test-shop.myshopify.com",
            "product_id": "gid://shopify/Product/123456789",
            "product_handle": "test-product",
            "image_urls": [test_image_url],
            "metadata": {
                "productTitle": "Test Product",
                "variantTitle": "Default"
            },
            "quality": "fast"  # Fast mode (required for 8GB GPU with TripoSR)
        },
        'callbacks': None,
        'errbacks': None,
        'chain': None,
        'chord': None
    }
    
    # Create the proper message envelope with required properties
    # Base64 encode the task message body
    body_json = json.dumps(task_message)
    body_encoded = base64.b64encode(body_json.encode('utf-8')).decode('utf-8')
    
    message = {
        'body': body_encoded,
        'content-encoding': 'utf-8',
        'content-type': 'application/json',
        'headers': {},
        'properties': {
            'correlation_id': celery_task_id,
            'reply_to': str(uuid.uuid4()),
            'delivery_mode': 2,
            'delivery_info': {
                'exchange': '',
                'routing_key': 'celery'
            },
            'priority': 0,
            'body_encoding': 'base64',
            'delivery_tag': str(uuid.uuid4())
        }
    }
    
    # Push to Redis queue with proper format
    redis_client.lpush("celery", json.dumps(message))
    
    print(f"   Job queued!")
    print(f"   Job ID: {job_id}")
    print(f"   Celery Task ID: {celery_task_id}")
    
    return job_id, celery_task_id


def monitor_job(redis_client, celery_task_id, timeout=300):
    """Monitor job status in Redis"""
    print(f"\n👀 Monitoring job status (timeout: {timeout}s)...")
    print("   Check your worker logs in another terminal for detailed progress")
    print("   Press Ctrl+C to stop monitoring\n")
    
    start_time = time.time()
    last_status = None
    
    try:
        while True:
            elapsed = time.time() - start_time
            
            if elapsed > timeout:
                print(f"\n⏱️  Timeout reached ({timeout}s)")
                break
            
            # Check result in Redis
            result_key = f"celery-task-meta-{celery_task_id}"
            result = redis_client.get(result_key)
            
            if result:
                try:
                    result_data = json.loads(result)
                    status = result_data.get("status")
                    
                    if status != last_status:
                        last_status = status
                        print(f"   [{elapsed:.1f}s] Status: {status}")
                        
                        if status == "SUCCESS":
                            print(f"\nJob completed successfully!")
                            print(f"   Result: {json.dumps(result_data.get('result', {}), indent=2)}")
                            return True
                        elif status == "FAILURE":
                            print(f"\nJob failed!")
                            print(f"   Error: {result_data.get('result', 'Unknown error')}")
                            return False
                except json.JSONDecodeError:
                    pass
            
            time.sleep(2)
    
    except KeyboardInterrupt:
        print("\n\n⏹️  Monitoring stopped by user")
        return None
    
    print("\nJob did not complete within timeout period")
    return None


def main():
    """Main test function"""
    print("=" * 60)
    print("3D Model Generation Worker - Test Script")
    print("=" * 60)
    
    # Check Redis
    redis_client = check_redis()
    
    # Check environment variables
    check_env_vars()
    
    # Ask user if they want to proceed
    print("\n" + "=" * 60)
    response = input("\nReady to queue a test job? (y/n): ").strip().lower()
    
    if response != 'y':
        print("Test cancelled")
        sys.exit(0)
    
    # Ask if user wants to use real image
    use_real = input("Use real product image? (y/n, default=n): ").strip().lower() == 'y'
    
    # Queue test job
    job_id, celery_task_id = queue_test_job(redis_client, use_real_image=use_real)
    
    print("\n" + "=" * 60)
    print("IMPORTANT: Make sure your worker is running!")
    print("   Run in another terminal: celery -A app.worker worker --loglevel=info")
    print("=" * 60)
    
    # Ask if user wants to monitor
    monitor = input("\nMonitor job status? (y/n): ").strip().lower()
    
    if monitor == 'y':
        monitor_job(redis_client, celery_task_id)
    else:
        print(f"\n💡 You can check job status manually:")
        print(f"   Redis key: celery-task-meta-{celery_task_id}")
        print(f"   Command: redis-cli GET celery-task-meta-{celery_task_id}")
    
    print("\nTest script completed")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

