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
    
    // Detect Safari browser
    function isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }
    
    // Create Safari warning overlay
    function createSafariWarning() {
        const warning = document.createElement('div');
        warning.className = 'safari-warning-overlay';
        warning.innerHTML = `
            <div class="safari-warning-content">
                <h3>Safari Required</h3>
                <p>This animation uses .mov files with transparency and only works in Safari.</p>
            </div>
        `;
        return warning;
    }
    
    // Create Safari loading info message (shown only on Safari for mov templates)
    function createSafariLoadingInfo() {
        const info = document.createElement('div');
        info.className = 'safari-loading-info';
        info.innerHTML = `
            <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Preview may take a moment to load – .mov files with transparency are large</span>
        `;
        return info;
    }
    
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
    function renderVideo(element, container, objectRect, noLoop = false) {
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
            video.loop = !noLoop;
            video.playsInline = true;
            video.crossOrigin = 'anonymous';
            video.style.display = 'none';
            
            wrapper.appendChild(canvas);
            wrapper.appendChild(video);
            container.appendChild(wrapper);
            
            const ctx = canvas.getContext('2d');
            
            // Start drawing as soon as we can play
            video.addEventListener('canplay', () => {
                video.play();
            });
            
            // Draw frames continuously
            function drawFrame() {
                if (video.readyState >= 2) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                }
                if (!video.ended || video.loop) {
                    const animId = requestAnimationFrame(drawFrame);
                    activeAnimations.push(animId);
                }
            }
            drawFrame();
            
            video.preload = 'auto';
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
    function renderTemplate(data, noLoop = false) {
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
                                        renderVideo(el, overlayContainer, null, noLoop);
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
                                        renderVideo(el, overlayContainer, objectRect, noLoop);
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
        
        // Remove any existing Safari loading info
        const existingInfo = document.querySelector('.safari-loading-info');
        if (existingInfo) existingInfo.remove();
        
        // Check for Safari-only templates
        const safariOnlyTemplates = ['left_side_animation', 'right_side_animation'];
        const needsSafari = safariOnlyTemplates.includes(templateKey);
        
        // These templates should not loop
        const noLoopTemplates = ['left_side_animation', 'right_side_animation'];
        const shouldNotLoop = noLoopTemplates.includes(templateKey);
        
        try {
            const response = await fetch(`assets/${templateKey}.json`);
            const data = await response.json();
            jsonDisplay.textContent = JSON.stringify(data, null, 2);
            
            // Show Safari warning for specific templates on non-Safari browsers
            if (needsSafari && !isSafari()) {
                clearOverlays();
                overlayContainer.appendChild(createSafariWarning());
                return;
            }
            
            // Render the template overlay
            renderTemplate(data, shouldNotLoop);
            
            // Show loading info on Safari for mov templates (after render so it's not cleared)
            if (needsSafari && isSafari()) {
                const previewArea = document.querySelector('.preview-area');
                previewArea.appendChild(createSafariLoadingInfo());
            }
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
        
        // Remove Safari loading info if present
        const loadingInfo = document.querySelector('.safari-loading-info');
        if (loadingInfo) loadingInfo.remove();
        
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
