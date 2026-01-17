// App initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('App ready');
    
    const templateSelect = document.getElementById('template-select');
    const jsonDisplay = document.getElementById('json-display');
    const copyBtn = document.getElementById('copy-json');
    
    // Handle template selection
    templateSelect.addEventListener('change', async (e) => {
        const templateKey = e.target.value;
        if (!templateKey) return;
        
        try {
            const response = await fetch(`assets/${templateKey}.json`);
            const data = await response.json();
            jsonDisplay.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error loading template:', error);
            jsonDisplay.textContent = `// Error loading template: ${error.message}`;
        }
    });
    
    // Handle copy button
    copyBtn.addEventListener('click', () => {
        const text = jsonDisplay.textContent;
        if (text.startsWith('//')) return;
        
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    });
});
