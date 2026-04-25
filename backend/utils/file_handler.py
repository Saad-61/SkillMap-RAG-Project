import os
from pathlib import Path
from uuid import uuid4


def save_file(file, upload_dir: str = "uploads") -> str:
    base_dir = Path(__file__).resolve().parents[1]
    target_dir = base_dir / upload_dir
    target_dir.mkdir(parents=True, exist_ok=True)

    original_name = Path(file.filename or "upload.bin").name
    target_name = f"{uuid4().hex}_{original_name}"
    target_path = target_dir / target_name

    with open(target_path, "wb") as destination:
        destination.write(file.file.read())

    return str(target_path)


def save_upload_file(file, upload_dir: str):
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    # Placeholder logic
    return os.path.join(upload_dir, file.filename)
