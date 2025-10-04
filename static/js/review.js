// static/js/review.js

document.addEventListener('DOMContentLoaded', () => {
const applyBtn = document.getElementById('applyBtn');
const applyModeEl = document.getElementById('applyMode');
const citationStyleEl = document.getElementById('citationStyle');
const downloadLink = document.getElementById('downloadLink');
const exportBtn = document.getElementById('exportCsv');
const messages = document.getElementById('messages');
const jobId = typeof JOB_ID !== 'undefined' ? JOB_ID : null;

const selectAll = document.getElementById('selectAll');
selectAll && selectAll.addEventListener('change', (e) => {
    document.querySelectorAll('input.select').forEach(cb => cb.checked = e.target.checked);
});

function showMessage(txt, isError=false) {
    messages.textContent = txt;
    messages.style.color = isError ? 'crimson' : 'inherit';
}

applyBtn.addEventListener('click', async () => {
    if (!jobId) return alert('Missing job id');
    
    applyBtn.disabled = true;
    showMessage('Applying selected DOIs to document...');
    
    try {
        // Collect selected citations and DOI edits
        const selectedCitations = [];
        const citationUpdates = {};
        
        document.querySelectorAll('tr[data-id]').forEach(row => {
            const id = row.dataset.id;
            const checkbox = row.querySelector('input.select');
            const doiInput = row.querySelector('input.doi-input');
            
            if (checkbox && checkbox.checked) {
                selectedCitations.push(id);
            }
            
            if (doiInput && doiInput.value.trim()) {
                citationUpdates[id] = doiInput.value.trim();
            }
        });
        
        if (selectedCitations.length === 0) {
            throw new Error('Please select at least one citation to apply');
        }
        
        const payload = {
            apply_mode: applyModeEl.value,
            citation_style: citationStyleEl.value,
            selected_citations: selectedCitations,
            citation_updates: citationUpdates
        };
        
        const response = await fetch(`/apply/${jobId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to apply DOIs');
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showMessage('DOIs applied successfully!');
            downloadLink.href = result.download_url;
            downloadLink.classList.remove('hidden');
        } else {
            throw new Error('Application failed');
        }
        
    } catch (error) {
        console.error('Apply error:', error);
        showMessage('Error: ' + error.message, true);
    } finally {
        applyBtn.disabled = false;
    }
});

// Export CSV functionality
exportBtn.addEventListener('click', async () => {
    if (!jobId) return alert('Missing job id');
    
    try {
        showMessage('Preparing CSV export...');
        
        const response = await fetch(`/export/${jobId}`);
        if (!response.ok) {
            throw new Error('Export failed');
        }
        
        // Create download link for CSV
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `citations_${jobId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showMessage('CSV exported successfully!');
        
    } catch (error) {
        console.error('Export error:', error);
        showMessage('Export failed: ' + error.message, true);
    }
});

// DOI validation
document.querySelectorAll('input.doi-input').forEach(input => {
    input.addEventListener('blur', function() {
        const value = this.value.trim();
        if (value && !value.match(/^10\.\d{4,}\/.+/)) {
            this.style.borderColor = '#f56565';
            this.title = 'Invalid DOI format. Should start with 10.xxxx/';
        } else {
            this.style.borderColor = '#e2e8f0';
            this.title = '';
        }
    });
});

// Auto-save DOI edits (optional enhancement)
let saveTimeout;
document.querySelectorAll('input.doi-input').forEach(input => {
    input.addEventListener('input', function() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            // Could implement auto-save here
            console.log('DOI updated for citation', this.closest('tr').dataset.id, ':', this.value);
        }, 1000);
    });
});

// Status color coding
document.querySelectorAll('.status').forEach(statusCell => {
    const status = statusCell.textContent.toLowerCase().trim();
    switch(status) {
        case 'found':
        case 'has_doi':
            statusCell.style.color = '#48bb78';
            break;
        case 'not_found':
            statusCell.style.color = '#f56565';
            break;
        case 'pending':
            statusCell.style.color = '#ed8936';
            break;
    }
});

// Confidence color coding
document.querySelectorAll('.confidence').forEach(confidenceCell => {
    const text = confidenceCell.textContent.trim();
    if (text !== '—' && text !== '') {
        const confidence = parseInt(text);
        if (confidence >= 90) {
            confidenceCell.style.color = '#48bb78';
            confidenceCell.style.fontWeight = 'bold';
        } else if (confidence >= 70) {
            confidenceCell.style.color = '#ed8936';
        } else if (confidence > 0) {
            confidenceCell.style.color = '#f56565';
        }
    }
});

// Table row highlighting
document.querySelectorAll('tbody tr').forEach(row => {
    const checkbox = row.querySelector('input.select');
    if (checkbox) {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                row.style.backgroundColor = '#f0f4ff';
                row.style.borderLeft = '3px solid #667eea';
            } else {
                row.style.backgroundColor = '';
                row.style.borderLeft = '';
            }
        });
        
        // Initial state
        if (checkbox.checked) {
            row.style.backgroundColor = '#f0f4ff';
            row.style.borderLeft = '3px solid #667eea';
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + A to select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (selectAll) {
            selectAll.checked = true;
            selectAll.dispatchEvent(new Event('change'));
        }
    }
    
    // Ctrl/Cmd + Enter to apply
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        applyBtn.click();
    }
});

// Loading states
function setLoadingState(element, loading) {
    if (loading) {
        element.disabled = true;
        element.innerHTML = element.innerHTML.replace(/^/, '<span class="spinner"></span> ');
    } else {
        element.disabled = false;
        element.innerHTML = element.innerHTML.replace('<span class="spinner"></span> ', '');
    }
}

// Add CSS for spinner (could be in CSS file instead)
const style = document.createElement('style');
style.textContent = `
.spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 5px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);

});
