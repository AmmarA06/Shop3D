"""
Utility to update job status in backend
"""
import os
import httpx
from typing import Optional, Dict

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")


def update_job_status(
    job_id: str,
    status: str,
    model_url: Optional[str] = None,
    error_message: Optional[str] = None,
    metadata: Optional[Dict] = None,
    progress: Optional[int] = None
) -> bool:
    """
    Update job status via backend webhook
    
    Args:
        job_id: Job identifier
        status: Job status (pending, processing, completed, failed)
        model_url: URL of the generated 3D model (for completed jobs)
        error_message: Error description (for failed jobs)
        metadata: Additional metadata
        progress: Progress percentage (0-100)
    
    Returns:
        True if update was successful, False otherwise
    """
    try:
        payload = {
            "jobId": job_id,
            "status": status,
        }

        if model_url:
            payload["modelUrl"] = model_url

        if error_message:
            payload["errorMessage"] = error_message

        if metadata:
            payload["metadata"] = metadata
            
        if progress is not None:
            payload["progress"] = progress

        response = httpx.post(
            f"{BACKEND_URL}/api/models/webhook/update",
            json=payload,
            timeout=10.0
        )

        response.raise_for_status()
        print(f"✅ Updated job {job_id} to status: {status}")
        return True

    except httpx.HTTPError as e:
        print(f"❌ HTTP error updating job {job_id}: {e}")
        return False
    except Exception as e:
        print(f"❌ Failed to update job {job_id}: {e}")
        return False

