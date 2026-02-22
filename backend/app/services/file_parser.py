"""File parsing service for uploaded meeting notes/transcripts.

Supports .txt, .pdf, and .docx files. Validates extension, size, and
magic bytes before extracting plain text for the LLM pipeline.
"""

from pathlib import PurePosixPath

ALLOWED_EXTENSIONS = {".txt", ".pdf", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# Magic byte signatures for binary formats
_MAGIC_BYTES = {
    ".pdf": b"%PDF",
    ".docx": b"PK",  # DOCX is a ZIP archive
}


class FileValidationError(Exception):
    """Raised when an uploaded file fails validation."""


def validate_file(filename: str, size: int, content: bytes | None = None) -> None:
    """Check file extension, size, and magic bytes.

    Args:
        filename: Original filename from the upload.
        size: File size in bytes.
        content: Raw file bytes (optional, used for magic byte check).

    Raises:
        FileValidationError: If the file type is unsupported or too large.
    """
    ext = PurePosixPath(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise FileValidationError(
            f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    if size == 0:
        raise FileValidationError("File is empty")
    if size > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE // (1024 * 1024)
        raise FileValidationError(f"File exceeds {max_mb}MB limit")

    # Verify magic bytes match claimed extension for binary formats
    if content and ext in _MAGIC_BYTES:
        expected = _MAGIC_BYTES[ext]
        if not content[:len(expected)].startswith(expected):
            raise FileValidationError(
                f"File content doesn't match '{ext}' format. "
                "The file may be corrupted or have an incorrect extension."
            )


def extract_text(filename: str, content: bytes) -> str:
    """Extract plain text from an uploaded file.

    Args:
        filename: Original filename (used to determine format).
        content: Raw file bytes.

    Returns:
        Extracted plain text string.

    Raises:
        FileValidationError: If text extraction fails.
    """
    ext = PurePosixPath(filename).suffix.lower()

    if ext == ".txt":
        return _extract_txt(content)
    elif ext == ".pdf":
        return _extract_pdf(content)
    elif ext == ".docx":
        return _extract_docx(content)
    else:
        raise FileValidationError(f"Unsupported file type: {ext}")


def _extract_txt(content: bytes) -> str:
    """Decode text file with UTF-8, falling back to latin-1."""
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        return content.decode("latin-1")


def _extract_pdf(content: bytes) -> str:
    """Extract text from all pages of a PDF."""
    import io

    from pypdf import PdfReader

    try:
        reader = PdfReader(io.BytesIO(content))
        pages = [page.extract_text() or "" for page in reader.pages]
        text = "\n\n".join(pages).strip()
    except Exception as exc:
        raise FileValidationError(f"Failed to read PDF: {exc}") from exc

    if not text:
        raise FileValidationError("PDF contains no extractable text")
    return text


def _extract_docx(content: bytes) -> str:
    """Extract text from all paragraphs of a DOCX file."""
    import io

    from docx import Document

    try:
        doc = Document(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        text = "\n\n".join(paragraphs).strip()
    except Exception as exc:
        raise FileValidationError(f"Failed to read DOCX: {exc}") from exc

    if not text:
        raise FileValidationError("DOCX contains no extractable text")
    return text
