# Bulk DOI Finder

A professional FastAPI-based web application that automatically extracts citations from Word documents and finds their corresponding Digital Object Identifiers (DOIs) using PubMed and CrossRef APIs.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)

## 🚀 Features

- **Automatic Citation Extraction**: Intelligently extracts references from Word (.docx) documents
- **DOI Lookup**: Searches PubMed and CrossRef databases for citation DOIs
- **Multiple Citation Formats**: Supports APA and AMA citation styles
- **Interactive Review Interface**: Web-based interface for reviewing and editing results
- **Bulk Processing**: Handles large documents with multiple citations
- **CSV Export**: Export citation data for analysis
- **Document Generation**: Apply DOIs back to original documents
- **Docker Support**: Containerized deployment
- **Professional UI**: Modern, responsive web interface

## 📋 Requirements

- Python 3.8+
- Docker (optional, for containerized deployment)
- Word documents (.docx format) for processing

## 🛠 Installation

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd doi-finder-2
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```bash
   python main.py
   ```

5. **Open your browser:**
   Navigate to `http://127.0.0.1:8000`



## 📖 Usage

### Web Interface

1. **Upload Document**: Click or drag a Word (.docx) file into the upload area
2. **Select Citation Format**: Choose between APA or AMA style
3. **Process**: Click "Upload & Process" to start citation extraction and DOI lookup
4. **Review Results**: Examine extracted citations and found DOIs
5. **Edit DOIs**: Manually add or correct DOI information if needed
6. **Apply Changes**: Select citations and apply DOIs back to the document
7. **Download**: Download the processed document with embedded DOIs

### API Usage

The application provides a REST API for programmatic access:

#### Upload and Process Document
```bash
curl -X POST "http://localhost:8000/upload" \
     -F "file=@document.docx" \
     -F "citation_format=APA"
```

#### Check Processing Status
```bash
curl "http://localhost:8000/process/{job_id}"
```

#### Get Job Results
```bash
curl "http://localhost:8000/job/{job_id}"
```

#### Apply DOIs to Document
```bash
curl -X POST "http://localhost:8000/apply/{job_id}" \
     -H "Content-Type: application/json" \
     -d '{
       "apply_mode": "append_new_section",
       "citation_style": "APA",
       "selected_citations": [1, 2, 3],
       "citation_updates": {}
     }'
```

#### Export CSV
```bash
curl "http://localhost:8000/export/{job_id}"
```

## 🔌 API Endpoints

### Core Endpoints

- `GET /` - Main upload page
- `POST /upload` - Upload and process document
- `GET /process/{job_id}` - Check processing status
- `GET /job/{job_id}` - Get complete job results
- `GET /review/{job_id}` - Review page for job results
- `POST /apply/{job_id}` - Apply DOIs to document
- `GET /download/{job_id}` - Download processed document
- `GET /export/{job_id}` - Export citation data as CSV

### Utility Endpoints

- `GET /health` - Health check endpoint

### Request/Response Examples

#### Upload Response
```json
{
  "job_id": "abc123-def456-ghi789",
  "status": "uploaded",
  "message": "Extended processing started - this may take up to 10 minutes for complete results"
}
```

#### Job Status Response
```json
{
  "job": {
    "id": "abc123-def456-ghi789",
    "filename": "document.docx",
    "status": "completed",
    "citations": [...],
    "final_stats": {
      "total": 25,
      "processed": 25,
      "dois_found": 20,
      "processing_time": 180
    }
  },
  "stats": {
    "total": 25,
    "has_doi": 5,
    "found": 15,
    "not_found": 5
  }
}
```

## 🏗 Architecture

### Project Structure
```
doi-finder-2/
├── main.py                 # Main FastAPI application
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker configuration
├── README.md              # This file
├── static/                # Static assets
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   ├── js/
│   │   ├── upload2.js     # Upload page JavaScript
│   │   └── review.js      # Review page JavaScript
│   └── images/
│       └── logo.png       # Brand logo
└── templates/             # Jinja2 templates
    ├── upload.html        # Upload page template
    └── review.html        # Review page template
```

### Key Components

- **Citation Extraction**: Parses Word documents to identify and extract reference sections
- **DOI Lookup**: Queries PubMed and CrossRef APIs with intelligent search strategies
- **Document Processing**: Applies formatted citations back to original documents
- **Web Interface**: Responsive frontend for user interaction
- **Job Management**: Asynchronous processing with status tracking

## 🔧 Configuration

### Environment Variables

The application can be configured using environment variables:

- `MAX_UPLOAD_BYTES`: Maximum file size (default: 50MB)
- `CURRENT_YEAR`: Current year for citation validation (auto-detected)

### API Rate Limiting

The application includes built-in rate limiting for external API calls:
- PubMed: 1 request per second
- CrossRef: 1 request per second

## 🚀 Deployment

### Production Deployment

1. **Using Docker Compose:**
   ```yaml
   version: '3.8'
   services:
     doi-finder:
       build: .
       ports:
         - "8000:8000"
       environment:
         - MAX_UPLOAD_BYTES=104857600  # 100MB
   ```

2. **Using Gunicorn:**
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
   ```

3. **Behind Reverse Proxy:**
   Configure Nginx or Apache to proxy requests to the FastAPI application.

### Scaling Considerations

- **Horizontal Scaling**: Deploy multiple instances behind a load balancer
- **Database**: For production, replace in-memory job storage with a database
- **File Storage**: Use cloud storage for uploaded files in production
- **Caching**: Implement Redis for session and result caching

