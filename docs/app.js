// App initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('App ready');
    
    const templateSelect = document.getElementById('template-select');
    const jsonDisplay = document.getElementById('json-display');
    const copyBtn = document.getElementById('copy-json');
    const clearBtn = document.getElementById('clear-btn');
    const bgVideo = document.getElementById('background-video');
    const overlayContainer = document.getElementById('overlay-container');
    
    // Track active video animations for cleanup
    let activeAnimations = [];
    
    // Clear all overlays
    function clearOverlays() {
        // Stop any running animation frames
        activeAnimations.forEach(id => cancelAnimationFrame(id));
        activeAnimations = [];
        
        // Remove all overlay elements
        overlayContainer.innerHTML = '';
    }
    
    // Create an overlay element with positioning
    function createOverlayElement(rect) {
        const el = document.createElement('div');
        el.className = 'overlay-item';
        el.style.left = rect.x || '0%';
        el.style.top = rect.y || '0%';
        el.style.width = rect.width || '100%';
        el.style.height = rect.height || '100%';
        return el;
    }
    
    // Render image element
    function renderImage(element, container) {
        const rect = element.rect || { x: '0%', y: '0%', width: '100%', height: '100%' };
        const wrapper = createOverlayElement(rect);
        
        const img = document.createElement('img');
        img.src = element.value;
        img.alt = '';
        
        wrapper.appendChild(img);
        container.appendChild(wrapper);
    }
    
    // Render video element with canvas for transparency (.mov files)
    function renderVideo(element, container, objectRect) {
        const rect = objectRect || element.rect || { x: '0%', y: '0%', width: '100%', height: '100%' };
        const wrapper = createOverlayElement(rect);
        
        const frames = element.frames;
        
        if (frames && frames.enable) {
            // Use canvas for .mov files with transparency
            const canvas = document.createElement('canvas');
            canvas.width = frames.width || 630;
            canvas.height = frames.height || 1056;
            
            const video = document.createElement('video');
            video.src = element.value;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.crossOrigin = 'anonymous';
            video.style.display = 'none';
            
            wrapper.appendChild(canvas);
            wrapper.appendChild(video);
            container.appendChild(wrapper);
            
            const ctx = canvas.getContext('2d');
            
            video.addEventListener('loadeddata', () => {
                video.play();
                
                function drawFrame() {
                    if (!video.paused && !video.ended) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    }
                    const animId = requestAnimationFrame(drawFrame);
                    activeAnimations.push(animId);
                }
                drawFrame();
            });
            
            video.load();
        } else {
            // Regular video without transparency
            const video = document.createElement('video');
            video.src = element.value;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.autoplay = true;
            
            wrapper.appendChild(video);
            container.appendChild(wrapper);
        }
    }
    
    // Render template based on JSON structure
    function renderTemplate(data) {
        clearOverlays();
        
        // Handle "items" structure (ad templates with images)
        if (data.items && Array.isArray(data.items)) {
            data.items.forEach(item => {
                if (item.rows) {
                    item.rows.forEach(row => {
                        if (row.columns) {
                            row.columns.forEach(col => {
                                if (col.element) {
                                    const el = col.element;
                                    if (el.type === 'image') {
                                        renderImage(el, overlayContainer);
                                    } else if (el.type === 'video') {
                                        renderVideo(el, overlayContainer, null);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
        
        // Handle "objects" structure (animation templates with videos)
        if (data.objects && Array.isArray(data.objects)) {
            data.objects.forEach(obj => {
                const objectRect = obj.rect; // Object-level rect for positioning
                
                if (obj.rows) {
                    obj.rows.forEach(row => {
                        if (row.columns) {
                            row.columns.forEach(col => {
                                if (col.element) {
                                    const el = col.element;
                                    if (el.type === 'video') {
                                        renderVideo(el, overlayContainer, objectRect);
                                    } else if (el.type === 'image') {
                                        renderImage(el, overlayContainer);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    }
    
    // Handle template selection
    templateSelect.addEventListener('change', async (e) => {
        const templateKey = e.target.value;
        if (!templateKey) return;
        
        // Pause video when template is selected
        if (bgVideo) {
            bgVideo.pause();
        }
        
        try {
            const response = await fetch(`assets/${templateKey}.json`);
            const data = await response.json();
            jsonDisplay.textContent = JSON.stringify(data, null, 2);
            
            // Render the template overlay
            renderTemplate(data);
        } catch (error) {
            console.error('Error loading template:', error);
            jsonDisplay.textContent = `// Error loading template: ${error.message}`;
            clearOverlays();
        }
    });
    
    // Handle clear button
    clearBtn.addEventListener('click', () => {
        // Clear overlays
        clearOverlays();
        
        // Reset dropdown to default
        templateSelect.selectedIndex = 0;
        
        // Reset JSON display
        jsonDisplay.textContent = '// Select a template to view JSON';
        
        // Resume video playback
        if (bgVideo) {
            bgVideo.play();
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
