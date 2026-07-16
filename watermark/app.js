// EraserFlow AI - Application Engine
document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        file: null,
        fileType: null, // 'image' or 'video'
        objectUrl: null,
        originalWidth: 0,
        originalHeight: 0,
        scaleX: 1,
        scaleY: 1,
        boxes: [], // Bounding boxes: { id, x, y, w, h, label, selected }
        activeBoxId: null,
        isDrawing: false,
        drawStart: { x: 0, y: 0 },
        feather: 5,
        sensitivity: 2,
        processing: false,
        videoDuration: 0,
        audioTracks: [],
        mediaStream: null,
        mediaRecorder: null,
        recordedChunks: [],
        averageFrameData: null, // Cache for averaged video frames
        activeResizer: null,
        resizeOffset: { x: 0, y: 0 }
    };

    // DOM Elements
    const elements = {
        uploadView: document.getElementById('upload-view'),
        fileInput: document.getElementById('file-input'),
        browseBtn: document.getElementById('browse-btn'),
        editorView: document.getElementById('editor-view'),
        mediaWrapper: document.getElementById('media-wrapper'),
        previewImage: document.getElementById('preview-image'),
        previewVideo: document.getElementById('preview-video'),
        interactiveOverlay: document.getElementById('interactive-overlay'),
        comparisonView: document.getElementById('comparison-view'),
        cleanImageBg: document.getElementById('clean-image-bg'),
        originalImageFg: document.getElementById('original-image-fg'),
        compSlider: document.getElementById('comp-slider'),
        compDivider: document.getElementById('comp-divider'),
        compHandle: document.getElementById('comp-handle'),
        metaName: document.getElementById('meta-name'),
        metaType: document.getElementById('meta-type'),
        metaResolution: document.getElementById('meta-resolution'),
        metaSize: document.getElementById('meta-size'),
        detectionsList: document.getElementById('detections-list'),
        clearMasksBtn: document.getElementById('clear-masks-btn'),
        featherSlider: document.getElementById('feather-slider'),
        featherVal: document.getElementById('feather-val'),
        sensitivitySlider: document.getElementById('sensitivity-slider'),
        sensitivityVal: document.getElementById('sensitivity-val'),
        processBtn: document.getElementById('process-btn'),
        downloadBtn: document.getElementById('download-btn'),
        resetBtn: document.getElementById('reset-btn'),
        processingModal: document.getElementById('processing-modal'),
        progressPercent: document.getElementById('progress-percent'),
        statusTitle: document.getElementById('status-title'),
        statusDesc: document.getElementById('status-desc'),
        progressBarFill: document.getElementById('progress-bar-fill'),
        renderPreviewCanvas: document.getElementById('render-preview-canvas'),
        renderPreviewWrapper: document.getElementById('render-preview-wrapper'),
        cancelProcessBtn: document.getElementById('cancel-process-btn'),
        toast: document.getElementById('toast'),
        toastMsg: document.getElementById('toast-msg')
    };

    // Helper: Show Toast Notification
    function showToast(message, type = 'success') {
        elements.toastMsg.textContent = message;
        elements.toast.className = `toast show toast-${type}`;
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3500);
    }

    // Helper: Format bytes
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // File selection event handlers
    elements.browseBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop events
    elements.uploadView.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadView.classList.add('dragover');
    });

    elements.uploadView.addEventListener('dragleave', () => {
        elements.uploadView.classList.remove('dragover');
    });

    elements.uploadView.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadView.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            elements.fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    // Reset application state
    elements.resetBtn.addEventListener('click', () => {
        if (state.objectUrl) {
            URL.revokeObjectURL(state.objectUrl);
        }
        state.file = null;
        state.fileType = null;
        state.objectUrl = null;
        state.boxes = [];
        state.activeBoxId = null;
        state.averageFrameData = null;
        state.recordedChunks = [];
        
        elements.previewImage.src = '';
        elements.previewVideo.src = '';
        elements.cleanImageBg.src = '';
        elements.originalImageFg.src = '';
        
        elements.previewImage.classList.add('hidden');
        elements.previewVideo.classList.add('hidden');
        elements.mediaWrapper.classList.remove('hidden');
        elements.comparisonView.classList.add('hidden');
        elements.downloadBtn.classList.add('hidden');
        elements.processBtn.classList.remove('hidden');
        elements.processBtn.disabled = true;
        elements.clearMasksBtn.style.display = 'none';

        elements.editorView.classList.add('hidden');
        elements.uploadView.classList.remove('hidden');
        
        // Clear list
        elements.detectionsList.innerHTML = `<div class="detections-placeholder">Analyzing media for static watermarks...</div>`;
    });

    // Adjustments Handlers
    elements.featherSlider.addEventListener('input', (e) => {
        state.feather = parseInt(e.target.value);
        elements.featherVal.textContent = state.feather + 'px';
    });

    elements.sensitivitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        state.sensitivity = val;
        const labels = ['Low', 'Medium', 'High'];
        elements.sensitivityVal.textContent = labels[val - 1];
        
        // Re-run watermark detection with new sensitivity
        if (state.fileType) {
            detectWatermarks();
        }
    });

    // Main file loader
    function handleFileSelect() {
        const file = elements.fileInput.files[0];
        if (!file) return;

        state.file = file;
        state.objectUrl = URL.createObjectURL(file);
        
        elements.metaName.textContent = file.name;
        elements.metaType.textContent = file.type || 'Unknown';
        elements.metaSize.textContent = formatBytes(file.size);

        elements.uploadView.classList.add('hidden');
        elements.editorView.classList.remove('hidden');

        if (file.type.startsWith('image/')) {
            state.fileType = 'image';
            elements.previewImage.src = state.objectUrl;
            elements.previewImage.classList.remove('hidden');
            elements.previewVideo.classList.add('hidden');
            
            elements.previewImage.onload = () => {
                state.originalWidth = elements.previewImage.naturalWidth;
                state.originalHeight = elements.previewImage.naturalHeight;
                elements.metaResolution.textContent = `${state.originalWidth} × ${state.originalHeight}`;
                recalculateScaling();
                detectWatermarks();
            };
        } else if (file.type.startsWith('video/')) {
            state.fileType = 'video';
            elements.previewVideo.src = state.objectUrl;
            elements.previewVideo.classList.remove('hidden');
            elements.previewImage.classList.add('hidden');
            elements.previewVideo.muted = true; // Mute video so processing isn't loud
            
            elements.previewVideo.onloadedmetadata = () => {
                state.originalWidth = elements.previewVideo.videoWidth;
                state.originalHeight = elements.previewVideo.videoHeight;
                state.videoDuration = elements.previewVideo.duration;
                elements.metaResolution.textContent = `${state.originalWidth} × ${state.originalHeight}`;
                recalculateScaling();
                
                // For videos, run frame-averaging timeline scanning first
                runVideoTimelineAnalysis();
            };
        } else {
            showToast('Unsupported file format. Please upload an image or video.', 'error');
            elements.resetBtn.click();
        }
    }

    // Scale calculation helper (resolves CSS displayed coordinates vs real media pixels)
    function recalculateScaling() {
        const wrapperRect = elements.mediaWrapper.getBoundingClientRect();
        
        // Find actual display bounds of the media inside the flexbox container
        let displayedWidth, displayedHeight;
        const mediaRatio = state.originalWidth / state.originalHeight;
        const viewportRatio = wrapperRect.width / wrapperRect.height;
        
        if (mediaRatio > viewportRatio) {
            displayedWidth = wrapperRect.width;
            displayedHeight = wrapperRect.width / mediaRatio;
        } else {
            displayedHeight = wrapperRect.height;
            displayedWidth = wrapperRect.height * mediaRatio;
        }
        
        // Match overlay coordinates with actual displayed media elements
        elements.interactiveOverlay.style.width = displayedWidth + 'px';
        elements.interactiveOverlay.style.height = displayedHeight + 'px';
        
        state.scaleX = state.originalWidth / displayedWidth;
        state.scaleY = state.originalHeight / displayedHeight;
        
        renderBoxes();
    }

    window.addEventListener('resize', () => {
        if (state.file) {
            recalculateScaling();
        }
    });

    // ----------------------------------------------------
    // ALGORITHMS: WATERMARK & LOGO DETECTION
    // ----------------------------------------------------

    // Video Timeline Analysis: Average frames to isolate static elements
    async function runVideoTimelineAnalysis() {
        elements.statusTitle.textContent = "Analyzing Video";
        elements.statusDesc = "Extracting video frames across timeline to spot stationary logos...";
        elements.progressPercent.textContent = "0%";
        elements.progressBarFill.style.width = "0%";
        elements.renderPreviewWrapper.style.display = "block";
        elements.processingModal.classList.add('show');

        const video = document.createElement('video');
        video.src = state.objectUrl;
        video.muted = true;
        video.playsInline = true;
        
        await new Promise(r => video.onloadedmetadata = r);

        const samplePoints = 12;
        const canvas = document.createElement('canvas');
        canvas.width = 400; // Smaller resolution is fine for detection (faster!)
        canvas.height = Math.round(400 * (state.originalHeight / state.originalWidth));
        const ctx = canvas.getContext('2d');
        
        const previewCanvasCtx = elements.renderPreviewCanvas.getContext('2d');
        elements.renderPreviewCanvas.width = canvas.width;
        elements.renderPreviewCanvas.height = canvas.height;

        const accumulator = new Float32Array(canvas.width * canvas.height * 3);
        
        for (let i = 0; i < samplePoints; i++) {
            // Seek to interval positions
            const time = (state.videoDuration * (i + 0.5)) / samplePoints;
            video.currentTime = time;
            
            await new Promise(resolve => {
                video.onseeked = resolve;
            });
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Render small preview in the modal
            previewCanvasCtx.drawImage(canvas, 0, 0);
            
            // Add frames together
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            for (let p = 0; p < data.length / 4; p++) {
                accumulator[p * 3] += data[p * 4];
                accumulator[p * 3 + 1] += data[p * 4 + 1];
                accumulator[p * 3 + 2] += data[p * 4 + 2];
            }

            const percent = Math.round(((i + 1) / samplePoints) * 100);
            elements.progressPercent.textContent = percent + "%";
            elements.progressBarFill.style.width = percent + "%";
        }

        // Divide accumulator to get the average frame image
        const avgCanvas = document.createElement('canvas');
        avgCanvas.width = canvas.width;
        avgCanvas.height = canvas.height;
        const avgCtx = avgCanvas.getContext('2d');
        const avgImgData = avgCtx.createImageData(canvas.width, canvas.height);
        const avgData = avgImgData.data;

        for (let p = 0; p < avgData.length / 4; p++) {
            avgData[p * 4] = Math.round(accumulator[p * 3] / samplePoints);
            avgData[p * 4 + 1] = Math.round(accumulator[p * 3 + 1] / samplePoints);
            avgData[p * 4 + 2] = Math.round(accumulator[p * 3 + 2] / samplePoints);
            avgData[p * 4 + 3] = 255;
        }
        avgCtx.putImageData(avgImgData, 0, 0);

        state.averageFrameData = avgCanvas;
        elements.processingModal.classList.remove('show');
        showToast('Timeline analysis complete. Suggesting watermarks...');
        
        detectWatermarks();
    }

    // Edge Detection & Layout clustering to auto-suggest watermark boxes
    function detectWatermarks() {
        let srcCanvas = document.createElement('canvas');
        const dWidth = 400;
        const dHeight = Math.round(dWidth * (state.originalHeight / state.originalWidth));
        srcCanvas.width = dWidth;
        srcCanvas.height = dHeight;
        const ctx = srcCanvas.getContext('2d');

        if (state.fileType === 'image') {
            ctx.drawImage(elements.previewImage, 0, 0, dWidth, dHeight);
        } else if (state.fileType === 'video' && state.averageFrameData) {
            ctx.drawImage(state.averageFrameData, 0, 0, dWidth, dHeight);
        } else {
            return;
        }

        // Apply Sobel edge detection to isolate contrast blobs
        const imgData = ctx.getImageData(0, 0, dWidth, dHeight);
        const data = imgData.data;
        const edges = new Uint8Array(dWidth * dHeight);

        // Simple Sobel filters
        const Gx = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        const Gy = [
            [-1, -2, -1],
            [ 0,  0,  0],
            [ 1,  2,  1]
        ];

        // Sensitivity threshold settings (Lower threshold means higher sensitivity)
        const thresholds = [55, 38, 22];
        const edgeThreshold = thresholds[state.sensitivity - 1];

        for (let y = 1; y < dHeight - 1; y++) {
            for (let x = 1; x < dWidth - 1; x++) {
                let valX = 0;
                let valY = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelIdx = ((y + ky) * dWidth + (x + kx)) * 4;
                        // Grayscale conversion weight
                        const gray = 0.299 * data[pixelIdx] + 0.587 * data[pixelIdx + 1] + 0.114 * data[pixelIdx + 2];
                        valX += gray * Gx[ky + 1][kx + 1];
                        valY += gray * Gy[ky + 1][kx + 1];
                    }
                }

                const magnitude = Math.sqrt(valX * valX + valY * valY);
                edges[y * dWidth + x] = magnitude > edgeThreshold ? 255 : 0;
            }
        }

        // Check for edge clumps in typical watermark positions: 4 corners & bottom center
        // Let's divide these into 5 test boxes (normalized coordinates)
        const testZones = [
            { id: 'top-left', name: 'Top Left Watermark', rx: 0.02, ry: 0.02, rw: 0.28, rh: 0.18 },
            { id: 'top-right', name: 'Top Right Watermark', rx: 0.70, ry: 0.02, rw: 0.28, rh: 0.18 },
            { id: 'bottom-left', name: 'Bottom Left Watermark', rx: 0.02, ry: 0.80, rw: 0.28, rh: 0.18 },
            { id: 'bottom-right', name: 'Bottom Right Watermark', rx: 0.70, ry: 0.80, rw: 0.28, rh: 0.18 },
            { id: 'bottom-center', name: 'Center/Stamp Logo', rx: 0.35, ry: 0.78, rw: 0.30, rh: 0.20 }
        ];

        state.boxes = [];

        testZones.forEach(zone => {
            // Count active edge pixels in this zone
            const startX = Math.round(zone.rx * dWidth);
            const startY = Math.round(zone.ry * dHeight);
            const endX = Math.round((zone.rx + zone.rw) * dWidth);
            const endY = Math.round((zone.ry + zone.rh) * dHeight);

            let edgeCount = 0;
            const totalZonePixels = (endX - startX) * (endY - startY);

            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    if (edges[y * dWidth + x] === 255) {
                        edgeCount++;
                    }
                }
            }

            const density = edgeCount / totalZonePixels;
            // If edge density is substantial, fit a tighter bounding box around the edge pixels
            if (density > 0.02) {
                // Find bounding extents of the edges inside this zone
                let minX = endX, maxX = startX, minY = endY, maxY = startY;
                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        if (edges[y * dWidth + x] === 255) {
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                }

                // Add padding to bounding box
                const pad = 12;
                minX = Math.max(0, minX - pad);
                maxX = Math.min(dWidth, maxX + pad);
                minY = Math.max(0, minY - pad);
                maxY = Math.min(dHeight, maxY + pad);

                // Convert to original media coordinates
                const xOrig = (minX / dWidth) * state.originalWidth;
                const yOrig = (minY / dHeight) * state.originalHeight;
                const wOrig = ((maxX - minX) / dWidth) * state.originalWidth;
                const hOrig = ((maxY - minY) / dHeight) * state.originalHeight;

                state.boxes.push({
                    id: 'auto-' + zone.id,
                    x: Math.round(xOrig),
                    y: Math.round(yOrig),
                    w: Math.round(wOrig),
                    h: Math.round(hOrig),
                    label: zone.name,
                    selected: true
                });
            }
        });

        // If no boxes detected, create one default target in bottom-right corner to guide user
        if (state.boxes.length === 0) {
            const padW = Math.round(state.originalWidth * 0.22);
            const padH = Math.round(state.originalHeight * 0.12);
            state.boxes.push({
                id: 'suggest-br',
                x: Math.round(state.originalWidth * 0.74),
                y: Math.round(state.originalHeight * 0.84),
                w: padW,
                h: padH,
                label: 'Suggested Box',
                selected: false
            });
        }

        renderBoxes();
        updateDetectionsList();
        updateProcessButtonState();
    }

    // ----------------------------------------------------
    // BOX INTERACTION CONTROLLER (OVERLAY DRAWER)
    // ----------------------------------------------------

    // Mouse / Touch drawing on overlay
    elements.interactiveOverlay.addEventListener('mousedown', handleDrawStart);
    window.addEventListener('mousemove', handleDrawMove);
    window.addEventListener('mouseup', handleDrawEnd);

    function handleDrawStart(e) {
        if (state.activeResizer) return; // Let resizing take precedence

        // Check if user clicked an existing box or handle
        const clickedBox = e.target.closest('.bounding-box');
        if (clickedBox) {
            const boxId = clickedBox.dataset.id;
            selectBox(boxId);
            
            // Setup box dragging
            const box = state.boxes.find(b => b.id === boxId);
            state.isDraggingBox = true;
            state.draggedBoxId = boxId;
            
            const overlayRect = elements.interactiveOverlay.getBoundingClientRect();
            state.dragStart = {
                x: e.clientX - overlayRect.left - (box.x / state.scaleX),
                y: e.clientY - overlayRect.top - (box.y / state.scaleY)
            };
            return;
        }

        // Draw new box
        const overlayRect = elements.interactiveOverlay.getBoundingClientRect();
        state.isDrawing = true;
        state.drawStart = {
            x: e.clientX - overlayRect.left,
            y: e.clientY - overlayRect.top
        };

        // Create temporary drawing div
        const tempBox = document.createElement('div');
        tempBox.id = 'drawing-box-temp';
        tempBox.style.position = 'absolute';
        tempBox.style.border = '2px dashed var(--secondary)';
        tempBox.style.background = 'rgba(236, 72, 153, 0.1)';
        tempBox.style.left = state.drawStart.x + 'px';
        tempBox.style.top = state.drawStart.y + 'px';
        elements.interactiveOverlay.appendChild(tempBox);
    }

    function handleDrawMove(e) {
        if (state.activeResizer) {
            handleResize(e);
            return;
        }

        const overlayRect = elements.interactiveOverlay.getBoundingClientRect();

        if (state.isDrawing) {
            const currentX = Math.max(0, Math.min(overlayRect.width, e.clientX - overlayRect.left));
            const currentY = Math.max(0, Math.min(overlayRect.height, e.clientY - overlayRect.top));

            const left = Math.min(state.drawStart.x, currentX);
            const top = Math.min(state.drawStart.y, currentY);
            const width = Math.abs(state.drawStart.x - currentX);
            const height = Math.abs(state.drawStart.y - currentY);

            const tempBox = document.getElementById('drawing-box-temp');
            if (tempBox) {
                tempBox.style.left = left + 'px';
                tempBox.style.top = top + 'px';
                tempBox.style.width = width + 'px';
                tempBox.style.height = height + 'px';
            }
        } else if (state.isDraggingBox) {
            // Drag box inside boundaries
            const box = state.boxes.find(b => b.id === state.draggedBoxId);
            if (!box) return;

            const currentX = e.clientX - overlayRect.left - state.dragStart.x;
            const currentY = e.clientY - overlayRect.top - state.dragStart.y;

            const boxWidthOnOverlay = box.w / state.scaleX;
            const boxHeightOnOverlay = box.h / state.scaleY;

            const clampedX = Math.max(0, Math.min(overlayRect.width - boxWidthOnOverlay, currentX));
            const clampedY = Math.max(0, Math.min(overlayRect.height - boxHeightOnOverlay, currentY));

            box.x = Math.round(clampedX * state.scaleX);
            box.y = Math.round(clampedY * state.scaleY);

            renderBoxes();
            updateDetectionsList();
        }
    }

    function handleDrawEnd(e) {
        if (state.activeResizer) {
            state.activeResizer = null;
            return;
        }

        if (state.isDrawing) {
            state.isDrawing = false;
            const tempBox = document.getElementById('drawing-box-temp');
            if (tempBox) {
                const overlayRect = elements.interactiveOverlay.getBoundingClientRect();
                const currentX = Math.max(0, Math.min(overlayRect.width, e.clientX - overlayRect.left));
                const currentY = Math.max(0, Math.min(overlayRect.height, e.clientY - overlayRect.top));

                const left = Math.min(state.drawStart.x, currentX);
                const top = Math.min(state.drawStart.y, currentY);
                const width = Math.abs(state.drawStart.x - currentX);
                const height = Math.abs(state.drawStart.y - currentY);

                tempBox.remove();

                // Only create box if it's large enough (e.g. 10x10 px)
                if (width > 12 && height > 12) {
                    const newId = 'custom-' + Date.now();
                    state.boxes.push({
                        id: newId,
                        x: Math.round(left * state.scaleX),
                        y: Math.round(top * state.scaleY),
                        w: Math.round(width * state.scaleX),
                        h: Math.round(height * state.scaleY),
                        label: 'Custom Mask',
                        selected: true
                    });
                    
                    renderBoxes();
                    selectBox(newId);
                    updateDetectionsList();
                    updateProcessButtonState();
                }
            }
        }

        if (state.isDraggingBox) {
            state.isDraggingBox = false;
            state.draggedBoxId = null;
        }
    }

    // Setup Resizer handles interaction
    function setupResizer(handle, boxId, direction) {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            state.activeResizer = { boxId, direction };
            
            const overlayRect = elements.interactiveOverlay.getBoundingClientRect();
            state.resizeOffset = {
                x: e.clientX - overlayRect.left,
                y: e.clientY - overlayRect.top
            };
        });
    }

    function handleResize(e) {
        if (!state.activeResizer) return;

        const { boxId, direction } = state.activeResizer;
        const box = state.boxes.find(b => b.id === boxId);
        if (!box) return;

        const overlayRect = elements.interactiveOverlay.getBoundingClientRect();
        const curX = Math.max(0, Math.min(overlayRect.width, e.clientX - overlayRect.left));
        const curY = Math.max(0, Math.min(overlayRect.height, e.clientY - overlayRect.top));

        // Get box coordinates in overlay space for editing
        let left = box.x / state.scaleX;
        let top = box.y / state.scaleY;
        let right = (box.x + box.w) / state.scaleX;
        let bottom = (box.y + box.h) / state.scaleY;

        const minSize = 15; // Minimum size of box on overlay

        // Adjust coordinates depending on handle dragged
        if (direction.includes('e')) {
            right = Math.max(left + minSize, curX);
        }
        if (direction.includes('w')) {
            left = Math.min(right - minSize, curX);
        }
        if (direction.includes('s')) {
            bottom = Math.max(top + minSize, curY);
        }
        if (direction.includes('n')) {
            top = Math.min(bottom - minSize, curY);
        }

        // Map back to original media pixel space
        box.x = Math.round(left * state.scaleX);
        box.y = Math.round(top * state.scaleY);
        box.w = Math.round((right - left) * state.scaleX);
        box.h = Math.round((bottom - top) * state.scaleY);

        renderBoxes();
        updateDetectionsList();
    }

    // Selecting a box highlights it and focuses the list item
    function selectBox(id) {
        state.activeBoxId = id;
        document.querySelectorAll('.bounding-box').forEach(el => {
            el.classList.toggle('active', el.dataset.id === id);
        });
        document.querySelectorAll('.detection-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === id);
        });
    }

    // Remove bounding box
    function removeBox(id) {
        state.boxes = state.boxes.filter(b => b.id !== id);
        if (state.activeBoxId === id) {
            state.activeBoxId = null;
        }
        renderBoxes();
        updateDetectionsList();
        updateProcessButtonState();
    }

    // Toggle box inclusion for inpainting
    function toggleBoxSelection(id) {
        const box = state.boxes.find(b => b.id === id);
        if (box) {
            box.selected = !box.selected;
            renderBoxes();
            updateDetectionsList();
            updateProcessButtonState();
        }
    }

    // Clear all boxes
    elements.clearMasksBtn.addEventListener('click', () => {
        state.boxes = [];
        state.activeBoxId = null;
        renderBoxes();
        updateDetectionsList();
        updateProcessButtonState();
    });

    // Render Box elements onto screen overlay
    function renderBoxes() {
        // Clear old overlays
        const oldBoxes = elements.interactiveOverlay.querySelectorAll('.bounding-box');
        oldBoxes.forEach(b => b.remove());

        state.boxes.forEach(box => {
            const el = document.createElement('div');
            el.className = `bounding-box ${state.activeBoxId === box.id ? 'active' : ''}`;
            el.dataset.id = box.id;
            
            // Position on display overlay
            el.style.left = (box.x / state.scaleX) + 'px';
            el.style.top = (box.y / state.scaleY) + 'px';
            el.style.width = (box.w / state.scaleX) + 'px';
            el.style.height = (box.h / state.scaleY) + 'px';
            
            // Mask opacity visualization depending on selection
            el.style.background = box.selected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)';
            if (!box.selected) {
                el.style.borderStyle = 'dashed';
                el.style.borderColor = 'rgba(255,255,255,0.4)';
                el.style.boxShadow = 'none';
            }

            // Top badge label
            const badge = document.createElement('div');
            badge.className = 'bounding-box-badge';
            badge.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                ${box.label}
            `;
            el.appendChild(badge);

            // Delete button
            const close = document.createElement('div');
            close.className = 'bounding-box-close';
            close.innerHTML = '&times;';
            close.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                removeBox(box.id);
            });
            el.appendChild(close);

            // Add resize handles (Only if the box is highlighted active)
            if (state.activeBoxId === box.id) {
                const directions = ['nw', 'ne', 'se', 'sw', 'n', 's', 'e', 'w'];
                directions.forEach(dir => {
                    const handle = document.createElement('div');
                    handle.className = `resize-handle handle-${dir}`;
                    setupResizer(handle, box.id, dir);
                    el.appendChild(handle);
                });
            }

            elements.interactiveOverlay.appendChild(el);
        });
        
        elements.clearMasksBtn.style.display = state.boxes.length > 0 ? 'inline-block' : 'none';
    }

    // Sync detection sidebar listing cards
    function updateDetectionsList() {
        if (state.boxes.length === 0) {
            elements.detectionsList.innerHTML = `<div class="detections-placeholder">No watermarks selected. Click and drag on the media to select.</div>`;
            return;
        }

        elements.detectionsList.innerHTML = '';
        state.boxes.forEach(box => {
            const item = document.createElement('div');
            item.className = `detection-item ${box.selected ? 'selected' : ''} ${state.activeBoxId === box.id ? 'active' : ''}`;
            item.dataset.id = box.id;

            item.innerHTML = `
                <div class="detection-left">
                    <div class="detection-checkbox">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div class="detection-info">
                        <span class="detection-name">${box.label}</span>
                        <span class="detection-coords">${box.w}x${box.h} px at [${box.x}, ${box.y}]</span>
                    </div>
                </div>
                <button class="delete-detection-btn" title="Delete logo mask">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            `;

            // Card highlight click handler
            item.addEventListener('click', (e) => {
                if (e.target.closest('.delete-detection-btn')) {
                    removeBox(box.id);
                } else if (e.target.closest('.detection-checkbox') || e.target.classList.contains('detection-checkbox')) {
                    toggleBoxSelection(box.id);
                } else {
                    selectBox(box.id);
                }
            });

            elements.detectionsList.appendChild(item);
        });
    }

    function updateProcessButtonState() {
        const hasSelected = state.boxes.some(b => boxSelectedAndValid(b));
        elements.processBtn.disabled = !hasSelected;
    }

    function boxSelectedAndValid(box) {
        return box.selected && box.w > 2 && box.h > 2;
    }

    // ----------------------------------------------------
    // CORE RESTORATION / INPAINTING ENGINE
    // ----------------------------------------------------

    // Inpaint a bounding box region using border diffusion / onion peeling interpolation
    function inpaintRegion(ctx, box) {
        const margin = 10; // Pixels surrounding box to sample background from
        
        // Clamp coordinates within canvas boundaries
        const xVal = Math.max(margin, box.x);
        const yVal = Math.max(margin, box.y);
        const wVal = Math.min(state.originalWidth - xVal - margin, box.w);
        const hVal = Math.min(state.originalHeight - yVal - margin, box.h);

        if (wVal <= 0 || hVal <= 0) return;

        // Fetch sub-image region including margin border
        const srcX = xVal - margin;
        const srcY = yVal - margin;
        const srcW = wVal + 2 * margin;
        const srcH = hVal + 2 * margin;

        const imgData = ctx.getImageData(srcX, srcY, srcW, srcH);
        const pixels = imgData.data;

        // Mask initialization: 1 represents pixels that need restoration
        const mask = new Uint8Array(srcW * srcH);
        
        // Mark box interior as masked
        for (let y = margin; y < margin + hVal; y++) {
            for (let x = margin; x < margin + wVal; x++) {
                mask[y * srcW + x] = 1;
            }
        }

        // Queue holds coordinates of border pixels (adjacent to unmasked background pixels)
        let queue = [];
        
        // Scan for initial boundary pixels
        for (let y = margin; y < margin + hVal; y++) {
            for (let x = margin; x < margin + wVal; x++) {
                const idx = y * srcW + x;
                // Check 4 directions for background neighbors
                if (mask[idx] === 1 && (
                    mask[idx - 1] === 0 || 
                    mask[idx + 1] === 0 || 
                    mask[idx - srcW] === 0 || 
                    mask[idx + srcW] === 0
                )) {
                    queue.push(idx);
                }
            }
        }

        // Diffuse background colors inwards
        while (queue.length > 0) {
            const nextQueue = [];
            
            for (let i = 0; i < queue.length; i++) {
                const idx = queue[i];
                if (mask[idx] === 0) continue; // Already solved

                let sumR = 0, sumG = 0, sumB = 0, count = 0;
                
                const neighbors = [idx - 1, idx + 1, idx - srcW, idx + srcW];
                
                neighbors.forEach(n => {
                    if (n >= 0 && n < mask.length && mask[n] === 0) {
                        const pixelOffset = n * 4;
                        sumR += pixels[pixelOffset];
                        sumG += pixels[pixelOffset + 1];
                        sumB += pixels[pixelOffset + 2];
                        count++;
                    }
                });

                if (count > 0) {
                    const offset = idx * 4;
                    pixels[offset] = Math.round(sumR / count);
                    pixels[offset + 1] = Math.round(sumG / count);
                    pixels[offset + 2] = Math.round(sumB / count);
                    mask[idx] = 0; // Mark solved

                    // Add adjacent unsolved pixels to the next queue pass
                    const adjacents = [idx - 1, idx + 1, idx - srcW, idx + srcW];
                    adjacents.forEach(adj => {
                        if (adj >= 0 && adj < mask.length && mask[adj] === 1) {
                            nextQueue.push(adj);
                        }
                    });
                }
            }
            queue = nextQueue;
        }

        // Apply a gentle blurring pass to blend boundary seams
        const featherPixels = state.feather;
        if (featherPixels > 0) {
            // Apply slight box blur to border boundaries of the box region
            const borderBox = margin;
            for (let y = borderBox - 2; y < borderBox + hVal + 2; y++) {
                for (let x = borderBox - 2; x < borderBox + wVal + 2; x++) {
                    // Check if it lies close to the boundary box border
                    const isNearXBorder = Math.abs(x - borderBox) <= 3 || Math.abs(x - (borderBox + wVal)) <= 3;
                    const isNearYBorder = Math.abs(y - borderBox) <= 3 || Math.abs(y - (borderBox + hVal)) <= 3;
                    
                    if (isNearXBorder || isNearYBorder) {
                        const centerIdx = (y * srcW + x) * 4;
                        let r = 0, g = 0, b = 0, sumCount = 0;
                        
                        // 3x3 local pixel average
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const sampleIdx = ((y + dy) * srcW + (x + dx)) * 4;
                                if (sampleIdx >= 0 && sampleIdx < pixels.length) {
                                    r += pixels[sampleIdx];
                                    g += pixels[sampleIdx + 1];
                                    b += pixels[sampleIdx + 2];
                                    sumCount++;
                                }
                            }
                        }
                        
                        pixels[centerIdx] = Math.round(r / sumCount);
                        pixels[centerIdx + 1] = Math.round(g / sumCount);
                        pixels[centerIdx + 2] = Math.round(b / sumCount);
                    }
                }
            }
        }

        // Draw restored region back to source canvas
        ctx.putImageData(imgData, srcX, srcY);
    }

    // ----------------------------------------------------
    // EXPORT PROCESS: IMAGES & VIDEOS
    // ----------------------------------------------------

    elements.processBtn.addEventListener('click', () => {
        if (state.fileType === 'image') {
            processImage();
        } else if (state.fileType === 'video') {
            processVideo();
        }
    });

    // PHOTO PROCESSING FLOW
    function processImage() {
        elements.statusTitle.textContent = "Processing Image";
        elements.statusDesc.textContent = "Removing watermarks and inpainting pixels...";
        elements.progressPercent.textContent = "20%";
        elements.progressBarFill.style.width = "20%";
        elements.renderPreviewWrapper.style.display = "none";
        elements.processingModal.classList.add('show');

        // Draw image and apply edits to canvas
        const canvas = document.createElement('canvas');
        canvas.width = state.originalWidth;
        canvas.height = state.originalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(elements.previewImage, 0, 0);

        setTimeout(() => {
            elements.progressPercent.textContent = "50%";
            elements.progressBarFill.style.width = "50%";
            
            // Run pixel restoration on selected boxes
            state.boxes.forEach(box => {
                if (boxSelectedAndValid(box)) {
                    inpaintRegion(ctx, box);
                }
            });
            
            elements.progressPercent.textContent = "90%";
            elements.progressBarFill.style.width = "90%";

            const restoredDataUrl = canvas.toDataURL(state.file.type);
            
            elements.cleanImageBg.src = restoredDataUrl;
            elements.originalImageFg.src = state.objectUrl;

            // Initialize slider alignment
            elements.compSlider.value = 50;
            updateSliderClipping(50);
            
            setTimeout(() => {
                elements.processingModal.classList.remove('show');
                elements.mediaWrapper.classList.add('hidden');
                elements.comparisonView.classList.remove('hidden');
                
                elements.processBtn.classList.add('hidden');
                elements.downloadBtn.classList.remove('hidden');
                
                // Cache final blob for downloads
                canvas.toBlob(blob => {
                    state.restoredBlob = blob;
                }, state.file.type);

                showToast("Watermark removed successfully. Drag slider to compare!");
            }, 500);

        }, 400);
    }

    // Image comparison slider listeners
    elements.compSlider.addEventListener('input', (e) => {
        updateSliderClipping(e.target.value);
    });

    function updateSliderClipping(percent) {
        // Clips original (top-layer) photo width dynamically
        elements.originalImageFg.style.clipPath = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`;
        elements.compDivider.style.left = `${percent}%`;
        elements.compHandle.style.left = `${percent}%`;
    }

    // VIDEO EXPORT FLOW: Frame-by-frame rendering and capture
    async function processVideo() {
        state.processing = true;
        elements.statusTitle.textContent = "Processing Video";
        elements.statusDesc.textContent = "Rendering and restoring pixels frame-by-frame. Please wait...";
        elements.progressPercent.textContent = "0%";
        elements.progressBarFill.style.width = "0%";
        elements.renderPreviewWrapper.style.display = "block";
        elements.processingModal.classList.add('show');

        // Setup hidden rendering video player
        const renderVideo = document.createElement('video');
        renderVideo.src = state.objectUrl;
        renderVideo.muted = true;
        renderVideo.playsInline = true;
        
        await new Promise(r => renderVideo.onloadedmetadata = r);

        // Offscreen processing canvas
        const canvas = document.createElement('canvas');
        canvas.width = state.originalWidth;
        canvas.height = state.originalHeight;
        const ctx = canvas.getContext('2d');

        // Stream Preview Canvas
        const previewCanvasCtx = elements.renderPreviewCanvas.getContext('2d');
        elements.renderPreviewCanvas.width = 320;
        elements.renderPreviewCanvas.height = Math.round(320 * (state.originalHeight / state.originalWidth));

        // Attempt to extract original audio tracks
        let audioTrack = null;
        try {
            // Try to capture original audio stream from playback element
            const sourceStream = elements.previewVideo.captureStream ? 
                                 elements.previewVideo.captureStream() : 
                                 elements.previewVideo.mozCaptureStream();
            if (sourceStream && sourceStream.getAudioTracks().length > 0) {
                audioTrack = sourceStream.getAudioTracks()[0].clone();
            }
        } catch (e) {
            console.warn("Could not capture audio stream: ", e);
        }

        // Capture offscreen canvas output stream (e.g. at 30 fps)
        const fps = 30;
        const stream = canvas.captureStream(fps);
        
        if (audioTrack) {
            stream.addTrack(audioTrack);
        }

        // Set up MediaRecorder
        state.recordedChunks = [];
        let options = { mimeType: 'video/webm;codecs=vp9,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm;codecs=vp8,opus' };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/mp4' };
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = {}; // Fallback
        }

        try {
            state.mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            console.error("MediaRecorder setup failed: ", e);
            state.mediaRecorder = new MediaRecorder(stream);
        }

        state.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                state.recordedChunks.push(e.data);
            }
        };

        state.mediaRecorder.onstop = () => {
            const blob = new Blob(state.recordedChunks, { type: state.mediaRecorder.mimeType || 'video/webm' });
            state.restoredBlob = blob;
            
            // Clean up state
            state.processing = false;
            elements.processingModal.classList.remove('show');
            
            // Switch CTA button to download state
            elements.processBtn.classList.add('hidden');
            elements.downloadBtn.classList.remove('hidden');
            
            showToast("Video processing complete! Ready to save.");
        };

        state.mediaRecorder.start();
        renderVideo.play();

        // High frequency processing loop
        function processLoop() {
            if (!state.processing) {
                try {
                    renderVideo.pause();
                    state.mediaRecorder.stop();
                } catch(e) {}
                return;
            }

            if (renderVideo.paused || renderVideo.ended) {
                if (renderVideo.ended) {
                    state.mediaRecorder.stop();
                }
                return;
            }

            // Draw current frame
            ctx.drawImage(renderVideo, 0, 0, canvas.width, canvas.height);

            // Inpaint regions
            state.boxes.forEach(box => {
                if (boxSelectedAndValid(box)) {
                    inpaintRegion(ctx, box);
                }
            });

            // Draw preview panel thumbnail
            previewCanvasCtx.drawImage(canvas, 0, 0, elements.renderPreviewCanvas.width, elements.renderPreviewCanvas.height);

            // Update Progress UI
            const progress = renderVideo.currentTime / renderVideo.duration;
            const percent = Math.min(100, Math.round(progress * 100));
            elements.progressPercent.textContent = percent + "%";
            elements.progressBarFill.style.width = percent + "%";

            // Next frame
            if (renderVideo.requestVideoFrameCallback) {
                renderVideo.requestVideoFrameCallback(processLoop);
            } else {
                setTimeout(processLoop, 1000 / fps);
            }
        }

        // Start processing loop
        if (renderVideo.requestVideoFrameCallback) {
            renderVideo.requestVideoFrameCallback(processLoop);
        } else {
            setTimeout(processLoop, 1000 / fps);
        }
    }

    // Cancel Video Processing
    elements.cancelProcessBtn.addEventListener('click', () => {
        if (state.processing) {
            state.processing = false;
            if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
                state.mediaRecorder.stop();
            }
            showToast('Processing cancelled by user', 'error');
            elements.processingModal.classList.remove('show');
        }
    });

    // Save final restored media blob to computer disk
    elements.downloadBtn.addEventListener('click', () => {
        if (!state.restoredBlob) {
            showToast("No processed file found to download.", "error");
            return;
        }

        // Generate download action
        const link = document.createElement('a');
        link.href = URL.createObjectURL(state.restoredBlob);
        
        // Match extension with file type
        let extension = state.fileType === 'image' ? 'png' : 'webm';
        if (state.fileType === 'video' && state.mediaRecorder.mimeType && state.mediaRecorder.mimeType.includes('mp4')) {
            extension = 'mp4';
        }
        
        const origNameWithoutExt = state.file.name.substring(0, state.file.name.lastIndexOf('.')) || state.file.name;
        link.download = `${origNameWithoutExt}_clear.${extension}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast("File downloaded successfully!");
    });
});
