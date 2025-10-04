// Extended timeout version for complete citation processing
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const fileDropArea = document.getElementById('fileDropArea');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadForm = document.getElementById('uploadForm');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressMessage = document.getElementById('progressMessage');

    // File drop functionality (unchanged)
    fileDropArea.addEventListener('click', () => fileInput.click());

    fileDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropArea.classList.add('dragover');
    });

    fileDropArea.addEventListener('dragleave', () => {
        fileDropArea.classList.remove('dragover');
    });

    fileDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            updateFileDisplay();
        }
    });

    fileInput.addEventListener('change', updateFileDisplay);

    function updateFileDisplay() {
        const file = fileInput.files[0];
        if (file) {
            const content = fileDropArea.querySelector('.file-drop-content');
            content.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
                <h3>Selected: ${file.name}</h3>
                <p>Size: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
            `;
        }
    }

    // Form submission with EXTENDED timeout
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select a file first');
            return;
        }

        if (!file.name.endsWith('.docx')) {
            alert('Please select a Word document (.docx file)');
            return;
        }

        uploadProgress.style.display = 'block';
        uploadBtn.disabled = true;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('citation_format', document.getElementById('citationFormat').value);

        try {
            updateProgress(20, 'Uploading file...');
            
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Upload failed');
            }

            const result = await response.json();
            const jobId = result.job_id;
            sessionStorage.setItem('currentJobId', jobId);

            // EXTENDED polling for complete processing
            await pollJobStatusExtended(jobId);

        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + error.message);
            resetForm();
        }
    });

    async function pollJobStatusExtended(jobId) {
        try {
            updateProgress(50, 'Extracting citations...');
            
            // EXTENDED TIMEOUT - 12 minutes for complete processing
            const maxAttempts = 144; // 12 minutes with 5-second intervals
            let attempts = 0;
            let lastProgress = 0;
            let stuckCount = 0;
            
            while (attempts < maxAttempts) {
                const response = await fetch(`/job/${jobId}`);
                if (!response.ok) {
                    throw new Error('Failed to check job status');
                }
                
                const data = await response.json();
                const job = data.job;
                const stats = data.stats || {};
                
                if (job.status === 'completed') {
                    updateProgress(100, 'Complete! Redirecting...');
                    setTimeout(() => {
                        window.location.href = `/review/${jobId}`;
                    }, 1000);
                    return;
                } else if (job.status === 'error') {
                    throw new Error(job.error || 'Processing failed');
                } else if (job.status === 'processing') {
                    const progress = job.progress || 60;
                    
                    // Show detailed progress with citation counts
                    let currentStep;
                    if (progress < 30) {
                        currentStep = 'Parsing document structure...';
                    } else if (progress < 50) {
                        currentStep = 'Extracting citations...';
                    } else {
                        const totalCitations = stats.total || 0;
                        const processedCitations = (stats.has_doi || 0) + (stats.found || 0) + (stats.not_found || 0);
                        currentStep = `Looking up DOIs... (${processedCitations}/${totalCitations} processed)`;
                    }
                    
                    updateProgress(Math.min(95, 50 + (progress * 0.4)), currentStep);
                    
                    // Check if progress is stuck (no progress for 2 minutes)
                    if (progress === lastProgress) {
                        stuckCount++;
                        if (stuckCount > 24) { // 2 minutes without progress
                            showProgressDialog(jobId, processedCitations, totalCitations);
                            return;
                        }
                    } else {
                        stuckCount = 0;
                        lastProgress = progress;
                    }
                }
                
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            
            // Final timeout - proceed anyway
            showFinalTimeoutDialog(jobId);
            
        } catch (error) {
            console.error('Polling error:', error);
            alert('Processing error: ' + error.message);
            resetForm();
        }
    }

    function showProgressDialog(jobId, processed, total) {
        const message = `DOI lookup in progress...\n\n` +
                       `Processed: ${processed || 0}/${total || 0} citations\n\n` +
                       `Continue waiting for complete results?\n` +
                       `(This may take several more minutes)`;
        
        if (confirm(message)) {
            updateProgress(85, 'Continuing DOI lookup...');
            setTimeout(() => pollJobStatusExtended(jobId), 2000);
        } else {
            updateProgress(100, 'Proceeding to review...');
            setTimeout(() => {
                window.location.href = `/review/${jobId}`;
            }, 1000);
        }
    }

    function showFinalTimeoutDialog(jobId) {
        const userChoice = confirm(
            'Maximum processing time reached.\n\n' +
            'The system has processed as many citations as possible.\n\n' +
            'Proceed to review the results?'
        );
        
        if (userChoice) {
            updateProgress(100, 'Proceeding to review...');
            setTimeout(() => {
                window.location.href = `/review/${jobId}`;
            }, 1000);
        } else {
            resetForm();
        }
    }

    function updateProgress(percent, message) {
        progressFill.style.width = percent + '%';
        progressMessage.textContent = message;
    }

    function resetForm() {
        uploadProgress.style.display = 'none';
        uploadBtn.disabled = false;
        progressFill.style.width = '0%';
        
        const content = fileDropArea.querySelector('.file-drop-content');
        content.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
            </svg>
            <h3>Drop your .docx file here</h3>
            <p>or <strong>click to browse</strong></p>
        `;
    }

    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file && file.size > 50 * 1024 * 1024) {
            alert('File is too large. Maximum size is 50MB.');
            this.value = '';
        }
    });
});
