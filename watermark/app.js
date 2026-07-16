// EraserFlow AI - Advanced Application Engine
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
        
        // Active selections
        boxes: [], // Elements: { id, x, y, w, h, label, selected, startTime, endTime, isBrushMask, points, cloneOffset }
        activeBoxId: null,
        
        // Tool configurations
        toolMode: 'box', // 'box', 'brush', 'clone'
        brushSize: 25,
        isBrushing: false,
        removalMode: 'diffusion', // 'diffusion', 'clone'
        
        // Drawing & interaction
        isDrawing: false,
        drawStart: { x: 0, y: 0 },
        isDraggingBox: false,
        draggedBoxId: null,
        activeResizer: null,
        resizeOffset: { x: 0, y: 0 },
        isDraggingCloneSource: false,
        
        // Settings
        feather: 5,
        sensitivity: 2,
        
        // Video specific
        videoDuration: 0,
        averageFrameData: null, // Average frame canvas
        varianceFrameData: null, // Standard deviation variance canvas
        isHeatmapActive: false,
        isPlaying: false,
        
        // Exporting
        processing: false,
        recordedChunks: [],
        mediaRecorder: null,
        restoredBlob: null
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
        toastMsg: document.getElementById('toast-msg'),

        // New Advanced Elements
        toolBox: document.getElementById('tool-box'),
        toolBrush: document.getElementById('tool-brush'),
        toolClone: document.getElementById('tool-clone'),
        brushSizeControl: document.getElementById('brush-size-control'),
        brushSizeSlider: document.getElementById('brush-size-slider'),
        brushSizeVal: document.getElementById('brush-size-val'),
        heatmapToggleBtn: document.getElementById('heatmap-toggle-btn'),
        brushMaskCanvas: document.getElementById('brush-mask-canvas'),
        heatmapCanvas: document.getElementById('heatmap-canvas'),
        videoTimelineContainer: document.getElementById('video-timeline-container'),
        playPauseBtn: document.getElementById('play-pause-btn'),
        playIcon: document.getElementById('play-icon'),
        pauseIcon: document.getElementById('pause-icon'),
        timelineCurrentTime: document.getElementById('timeline-current-time'),
        timelineSlider: document.getElementById('timeline-slider'),
        timelinePlayheadFill: document.getElementById('timeline-playhead-fill'),
        timelineDuration: document.getElementById('timeline-duration'),
        modeDiffusion: document.getElementById('mode-diffusion'),
        modeClone: document.getElementById('mode-clone'),
        cloneStampSettings: document.getElementById('clone-stamp-settings'),
        cloneOffsetX: document.getElementById('clone-offset-x'),
        cloneOffsetY: document.getElementById('clone-offset-y')
    };

    // Helper: Show Toast Notification
    function showToast(message, type = 'success') {
        elements.toastMsg.textContent = message;
        elements.toast.className = `toast show toast-${type}`;
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 4500); // 4.5 seconds so users can read compatibility tips
    }

    // Helper: Format bytes
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Helper: Format timeline time
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Logo click "Go Home" reset handler
    const logoLink = document.querySelector('.logo-container');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            elements.resetBtn.click(); // Reset state
        });
    }

    // ----------------------------------------------------
    // INITIALIZATION & UPLOAD ACTIONS
    // ----------------------------------------------------
    elements.browseBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);

    // Drag and Drop
    elements.uploadView.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadView.classList.add('dragover');
    });
    elements.uploadView.addEventListener('dragleave', () => elements.uploadView.classList.remove('dragover'));
    elements.uploadView.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadView.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            elements.fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    // Reset All States
    elements.resetBtn.addEventListener('click', () => {
        if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
        state.file = null;
        state.fileType = null;
        state.objectUrl = null;
        state.boxes = [];
        state.activeBoxId = null;
        state.averageFrameData = null;
        state.varianceFrameData = null;
        state.recordedChunks = [];
        state.isPlaying = false;
        state.isHeatmapActive = false;

        elements.previewImage.src = '';
        elements.previewVideo.src = '';
        elements.cleanImageBg.src = '';
        elements.originalImageFg.src = '';

        elements.previewImage.classList.add('hidden');
        elements.previewVideo.classList.add('hidden');
        elements.brushMaskCanvas.classList.add('hidden');
        elements.heatmapCanvas.classList.add('hidden');
        elements.videoTimelineContainer.classList.add('hidden');
        elements.comparisonView.classList.add('hidden');
        elements.mediaWrapper.classList.remove('hidden');
        elements.downloadBtn.classList.add('hidden');
        elements.processBtn.classList.remove('hidden');
        elements.processBtn.disabled = true;
        elements.clearMasksBtn.style.display = 'none';

        elements.editorView.classList.add('hidden');
        elements.uploadView.classList.remove('hidden');

        // Clear dynamic elements
        const brushCtx = elements.brushMaskCanvas.getContext('2d');
        brushCtx.clearRect(0, 0, elements.brushMaskCanvas.width, elements.brushMaskCanvas.height);
        
        elements.detectionsList.innerHTML = `<div class="detections-placeholder">Analyzing media...</div>`;
        setToolMode('box');
    });

    // File Selector handler
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
            elements.videoTimelineContainer.classList.add('hidden');
            
            elements.previewImage.onload = () => {
                state.originalWidth = elements.previewImage.naturalWidth;
                state.originalHeight = elements.previewImage.naturalHeight;
                elements.metaResolution.textContent = `${state.originalWidth} × ${state.originalHeight}`;
                
                // Set sizes of overlays
                elements.brushMaskCanvas.width = state.originalWidth;
                elements.brushMaskCanvas.height = state.originalHeight;
                
                recalculateScaling();
                detectWatermarks();
            };
        } else if (file.type.startsWith('video/')) {
            state.fileType = 'video';
            elements.previewVideo.src = state.objectUrl;
            elements.previewVideo.classList.remove('hidden');
            elements.previewImage.classList.add('hidden');
            elements.videoTimelineContainer.classList.remove('hidden');
            elements.previewVideo.muted = true;
            elements.previewVideo.loop = true;

            elements.previewVideo.onloadedmetadata = () => {
                state.originalWidth = elements.previewVideo.videoWidth;
                state.originalHeight = elements.previewVideo.videoHeight;
                state.videoDuration = elements.previewVideo.duration;
                elements.metaResolution.textContent = `${state.originalWidth} × ${state.originalHeight}`;
                elements.timelineDuration.textContent = formatTime(state.videoDuration);
                elements.timelineSlider.max = Math.floor(state.videoDuration * 100);

                elements.brushMaskCanvas.width = state.originalWidth;
                elements.brushMaskCanvas.height = state.originalHeight;

                recalculateScaling();
                runVideoTimelineAnalysis();
            };
        }
    }

    // Layout Scale Sync
    function recalculateScaling() {
        const wrapperRect = elements.mediaWrapper.getBoundingClientRect();
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

        elements.interactiveOverlay.style.width = displayedWidth + 'px';
        elements.interactiveOverlay.style.height = displayedHeight + 'px';

        elements.brushMaskCanvas.style.width = displayedWidth + 'px';
        elements.brushMaskCanvas.style.height = displayedHeight + 'px';
        elements.heatmapCanvas.style.width = displayedWidth + 'px';
        elements.heatmapCanvas.style.height = displayedHeight + 'px';

        state.scaleX = state.originalWidth / displayedWidth;
        state.scaleY = state.originalHeight / displayedHeight;

        renderBoxes();
        renderBrushMaskCanvas();
    }

    window.addEventListener('resize', () => {
        if (state.file) recalculateScaling();
    });

    // ----------------------------------------------------
    // TIMELINE PLAYBACK & CONTROLS
    // ----------------------------------------------------
    elements.playPauseBtn.addEventListener('click', togglePlay);
    elements.timelineSlider.addEventListener('input', handleTimelineSliderInput);
    elements.timelineSlider.addEventListener('mousedown', () => state.timelineScrubbing = true);
    window.addEventListener('mouseup', () => {
        if (state.timelineScrubbing) {
            state.timelineScrubbing = false;
            if (state.isPlaying) elements.previewVideo.play();
        }
    });

    function togglePlay() {
        if (state.fileType !== 'video') return;
        state.isPlaying = !state.isPlaying;
        if (state.isPlaying) {
            elements.previewVideo.play();
            elements.playIcon.classList.add('hidden');
            elements.pauseIcon.classList.remove('hidden');
            updatePlaybackProgress();
        } else {
            elements.previewVideo.pause();
            elements.playIcon.classList.remove('hidden');
            elements.pauseIcon.classList.add('hidden');
        }
    }

    function handleTimelineSliderInput(e) {
        if (state.fileType !== 'video') return;
        const time = parseFloat(e.target.value) / 100;
        elements.previewVideo.currentTime = time;
        elements.timelineCurrentTime.textContent = formatTime(time);
        elements.timelinePlayheadFill.style.width = (time / state.videoDuration * 100) + '%';
        renderBoxes(); // Refresh box visibility
    }

    function updatePlaybackProgress() {
        if (!state.isPlaying || state.timelineScrubbing || state.fileType !== 'video') return;
        const time = elements.previewVideo.currentTime;
        elements.timelineSlider.value = Math.floor(time * 100);
        elements.timelineCurrentTime.textContent = formatTime(time);
        elements.timelinePlayheadFill.style.width = (time / state.videoDuration * 100) + '%';
        renderBoxes(); // Sync temporal range boxes on overlay
        requestAnimationFrame(updatePlaybackProgress);
    }

    // ----------------------------------------------------
    // TOOL SWITCHING & SETTINGS
    // ----------------------------------------------------
    elements.toolBox.addEventListener('click', () => setToolMode('box'));
    elements.toolBrush.addEventListener('click', () => setToolMode('brush'));
    elements.toolClone.addEventListener('click', () => setToolMode('clone'));

    elements.brushSizeSlider.addEventListener('input', (e) => {
        state.brushSize = parseInt(e.target.value);
        elements.brushSizeVal.textContent = state.brushSize + 'px';
        updateBrushCursor();
    });

    elements.modeDiffusion.addEventListener('click', () => setRemovalMode('diffusion'));
    elements.modeClone.addEventListener('click', () => setRemovalMode('clone'));

    elements.featherSlider.addEventListener('input', (e) => {
        state.feather = parseInt(e.target.value);
        elements.featherVal.textContent = state.feather + 'px';
    });

    elements.sensitivitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        state.sensitivity = val;
        const labels = ['Low', 'Medium', 'High'];
        elements.sensitivityVal.textContent = labels[val - 1];
        if (state.fileType) detectWatermarks();
    });

    function setToolMode(mode) {
        state.toolMode = mode;
        elements.toolBox.classList.toggle('active', mode === 'box');
        elements.toolBrush.classList.toggle('active', mode === 'brush');
        elements.toolClone.classList.toggle('active', mode === 'clone');

        elements.brushSizeControl.classList.toggle('hidden', mode === 'box');
        
        // Update overlay cursor
        if (mode === 'box') {
            elements.interactiveOverlay.style.cursor = 'crosshair';
            elements.brushMaskCanvas.style.pointerEvents = 'none';
            showToast("Box Mode: Draw bounding box targets");
        } else if (mode === 'brush') {
            elements.interactiveOverlay.style.cursor = 'none';
            elements.brushMaskCanvas.style.pointerEvents = 'all';
            showToast("Brush Mode: Draw custom mask paths directly");
        } else if (mode === 'clone') {
            elements.interactiveOverlay.style.cursor = 'crosshair';
            elements.brushMaskCanvas.style.pointerEvents = 'none';
            showToast("Clone Mode: Place clone stamp box");
        }
        
        updateBrushCursor();
        renderBoxes();
    }

    function setRemovalMode(mode) {
        state.removalMode = mode;
        elements.modeDiffusion.classList.toggle('active', mode === 'diffusion');
        elements.modeClone.classList.toggle('active', mode === 'clone');
        elements.cloneStampSettings.classList.toggle('hidden', mode === 'diffusion');
        renderBoxes();
    }

    // Custom Brush Pointer
    const brushPointer = document.createElement('div');
    brushPointer.className = 'brush-cursor-indicator';
    elements.mediaWrapper.appendChild(brushPointer);

    elements.interactiveOverlay.addEventListener('mousemove', (e) => {
        if (state.toolMode === 'brush') {
            const rect = elements.interactiveOverlay.getBoundingClientRect();
            brushPointer.style.display = 'block';
            brushPointer.style.left = (e.clientX - rect.left) + 'px';
            brushPointer.style.top = (e.clientY - rect.top) + 'px';
        } else {
            brushPointer.style.display = 'none';
        }
    });

    elements.interactiveOverlay.addEventListener('mouseleave', () => {
        brushPointer.style.display = 'none';
    });

    function updateBrushCursor() {
        if (state.toolMode === 'brush') {
            const displaySize = Math.round(state.brushSize / (state.scaleX || 1));
            brushPointer.style.width = displaySize + 'px';
            brushPointer.style.height = displaySize + 'px';
        }
    }

    // ----------------------------------------------------
    // STATIC HEATMAP SCANNER
    // ----------------------------------------------------
    async function runVideoTimelineAnalysis() {
        elements.statusTitle.textContent = "Advanced Scrutiny";
        elements.statusDesc.textContent = "Scanning temporal pixel variances to map static watermark heat zones...";
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
        const wScan = 400;
        const hScan = Math.round(wScan * (state.originalHeight / state.originalWidth));
        
        const canvas = document.createElement('canvas');
        canvas.width = wScan;
        canvas.height = hScan;
        const ctx = canvas.getContext('2d');

        const previewCanvasCtx = elements.renderPreviewCanvas.getContext('2d');
        elements.renderPreviewCanvas.width = wScan;
        elements.renderPreviewCanvas.height = hScan;

        // Frames buffer
        const frames = [];

        for (let i = 0; i < samplePoints; i++) {
            const time = (state.videoDuration * (i + 0.5)) / samplePoints;
            video.currentTime = time;
            await new Promise(resolve => video.onseeked = resolve);

            ctx.drawImage(video, 0, 0, wScan, hScan);
            previewCanvasCtx.drawImage(canvas, 0, 0);

            const imgData = ctx.getImageData(0, 0, wScan, hScan);
            frames.push(imgData.data);

            const percent = Math.round(((i + 1) / samplePoints) * 100);
            elements.progressPercent.textContent = percent + "%";
            elements.progressBarFill.style.width = percent + "%";
        }

        // Calculate Mean and Standard Deviation per pixel
        const avgCanvas = document.createElement('canvas');
        avgCanvas.width = wScan;
        avgCanvas.height = hScan;
        const avgCtx = avgCanvas.getContext('2d');
        const avgImgData = avgCtx.createImageData(wScan, hScan);
        const avgData = avgImgData.data;

        // Variance Map
        const varCanvas = document.createElement('canvas');
        varCanvas.width = wScan;
        varCanvas.height = hScan;
        const varCtx = varCanvas.getContext('2d');
        const varImgData = varCtx.createImageData(wScan, hScan);
        const varData = varImgData.data;

        const N = samplePoints;

        for (let p = 0; p < wScan * hScan; p++) {
            const offset = p * 4;
            let sumR = 0, sumG = 0, sumB = 0;
            
            for (let f = 0; f < N; f++) {
                sumR += frames[f][offset];
                sumG += frames[f][offset + 1];
                sumB += frames[f][offset + 2];
            }
            
            const meanR = sumR / N;
            const meanG = sumG / N;
            const meanB = sumB / N;

            avgData[offset] = Math.round(meanR);
            avgData[offset + 1] = Math.round(meanG);
            avgData[offset + 2] = Math.round(meanB);
            avgData[offset + 3] = 255;

            // Variance: sum((x - mean)^2) / N
            let sqSumR = 0, sqSumG = 0, sqSumB = 0;
            for (let f = 0; f < N; f++) {
                sqSumR += Math.pow(frames[f][offset] - meanR, 2);
                sqSumG += Math.pow(frames[f][offset + 1] - meanG, 2);
                sqSumB += Math.pow(frames[f][offset + 2] - meanB, 2);
            }

            const stdDev = Math.sqrt((sqSumR + sqSumG + sqSumB) / (3 * N));
            const staticWeight = Math.max(0, 255 - stdDev * 4);
            varData[offset] = Math.round(staticWeight); // Red path
            varData[offset + 1] = 0;
            varData[offset + 2] = Math.round(staticWeight * 0.8); // Purple hues
            varData[offset + 3] = 255;
        }

        avgCtx.putImageData(avgImgData, 0, 0);
        varCtx.putImageData(varImgData, 0, 0);

        state.averageFrameData = avgCanvas;
        state.varianceFrameData = varCanvas;
        
        generateHeatmapOverlay(wScan, hScan);

        elements.processingModal.classList.remove('show');
        showToast('Timeline analysis complete. Suggesting static targets...');
        detectWatermarks();
    }

    function generateHeatmapOverlay(wScan, hScan) {
        const canvas = elements.heatmapCanvas;
        const ctx = canvas.getContext('2d');
        
        canvas.width = state.originalWidth;
        canvas.height = state.originalHeight;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = wScan;
        tempCanvas.height = hScan;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(state.varianceFrameData, 0, 0);

        ctx.filter = "blur(8px)"; 
        ctx.drawImage(tempCanvas, 0, 0, state.originalWidth, state.originalHeight);
        ctx.filter = "none";
    }

    elements.heatmapToggleBtn.addEventListener('click', () => {
        if (!state.varianceFrameData) {
            showToast("Heatmap scan is not compiled for this file.", "error");
            return;
        }
        state.isHeatmapActive = !state.isHeatmapActive;
        elements.heatmapToggleBtn.classList.toggle('active', state.isHeatmapActive);
        elements.heatmapCanvas.classList.toggle('hidden', !state.isHeatmapActive);
        showToast(state.isHeatmapActive ? "Heatmap view active: stationary zones glow purple" : "Heatmap disabled");
    });

    // Detect watermarks
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

        const imgData = ctx.getImageData(0, 0, dWidth, dHeight);
        const data = imgData.data;
        const edges = new Uint8Array(dWidth * dHeight);

        const Gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        const Gy = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

        const thresholds = [52, 35, 18];
        const edgeThreshold = thresholds[state.sensitivity - 1];

        let varCtx = null;
        if (state.fileType === 'video' && state.varianceFrameData) {
            const varTemp = document.createElement('canvas');
            varTemp.width = dWidth;
            varTemp.height = dHeight;
            varCtx = varTemp.getContext('2d');
            varCtx.drawImage(state.varianceFrameData, 0, 0, dWidth, dHeight);
        }

        for (let y = 1; y < dHeight - 1; y++) {
            for (let x = 1; x < dWidth - 1; x++) {
                let valX = 0, valY = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelIdx = ((y + ky) * dWidth + (x + kx)) * 4;
                        const gray = 0.299 * data[pixelIdx] + 0.587 * data[pixelIdx + 1] + 0.114 * data[pixelIdx + 2];
                        valX += gray * Gx[ky + 1][kx + 1];
                        valY += gray * Gy[ky + 1][kx + 1];
                    }
                }

                const magnitude = Math.sqrt(valX * valX + valY * valY);
                let pass = magnitude > edgeThreshold;

                if (pass && varCtx) {
                    const varVal = varCtx.getImageData(x, y, 1, 1).data[0]; 
                    pass = varVal > 80; // must be static
                }

                edges[y * dWidth + x] = pass ? 255 : 0;
            }
        }

        const testZones = [
            { id: 'top-left', name: 'Top Left Logo', rx: 0.02, ry: 0.02, rw: 0.25, rh: 0.15 },
            { id: 'top-right', name: 'Top Right Logo', rx: 0.73, ry: 0.02, rw: 0.25, rh: 0.15 },
            { id: 'bottom-left', name: 'Bottom Left Logo', rx: 0.02, ry: 0.83, rw: 0.25, rh: 0.15 },
            { id: 'bottom-right', name: 'Bottom Right Logo', rx: 0.73, ry: 0.83, rw: 0.25, rh: 0.15 }
        ];

        state.boxes = [];

        testZones.forEach(zone => {
            const startX = Math.round(zone.rx * dWidth);
            const startY = Math.round(zone.ry * dHeight);
            const endX = Math.round((zone.rx + zone.rw) * dWidth);
            const endY = Math.round((zone.ry + zone.rh) * dHeight);

            let edgeCount = 0;
            const totalZonePixels = (endX - startX) * (endY - startY);

            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    if (edges[y * dWidth + x] === 255) edgeCount++;
                }
            }

            const density = edgeCount / totalZonePixels;
            if (density > 0.015) {
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

                const pad = 12;
                minX = Math.max(0, minX - pad);
                maxX = Math.min(dWidth, maxX + pad);
                minY = Math.max(0, minY - pad);
                maxY = Math.min(dHeight, maxY + pad);

                state.boxes.push({
                    id: 'auto-' + zone.id,
                    x: Math.round((minX / dWidth) * state.originalWidth),
                    y: Math.round((minY / dHeight) * state.originalHeight),
                    w: Math.round(((maxX - minX) / dWidth) * state.originalWidth),
                    h: Math.round(((maxY - minY) / dHeight) * state.originalHeight),
                    label: zone.name,
                    selected: true,
                    startTime: 0,
                    endTime: state.videoDuration || 0,
                    isBrushMask: false,
                    cloneOffset: { x: 80, y: 0 }
                });
            }
        });

        if (state.boxes.length === 0) {
            state.boxes.push({
                id: 'suggest-br',
                x: Math.round(state.originalWidth * 0.74),
                y: Math.round(state.originalHeight * 0.84),
                w: Math.round(state.originalWidth * 0.22),
                h: Math.round(state.originalHeight * 0.12),
                label: 'Suggest Target',
                selected: false,
                startTime: 0,
                endTime: state.videoDuration || 0,
                isBrushMask: false,
                cloneOffset: { x: -120, y: 0 }
            });
        }

        renderBoxes();
        updateDetectionsList();
        updateProcessButtonState();
    }

    // ----------------------------------------------------
    // MOUSE BRUSH & CLONE EVENT HANDLING
    // ----------------------------------------------------
    elements.brushMaskCanvas.addEventListener('mousedown', handleBrushStart);
    elements.brushMaskCanvas.addEventListener('mousemove', handleBrushMove);
    window.addEventListener('mouseup', handleBrushEnd);

    elements.interactiveOverlay.addEventListener('mousedown', handleDrawStart);
    window.addEventListener('mousemove', handleDrawMove);
    window.addEventListener('mouseup', handleDrawEnd);

    // FREEHAND MASK BRUSH DRAWING
    function handleBrushStart(e) {
        if (state.toolMode !== 'brush') return;
        state.isBrushing = true;
        
        let brushBox = state.boxes.find(b => b.isBrushMask);
        if (!brushBox) {
            brushBox = {
                id: 'brush-mask-total',
                x: 0, y: 0, w: state.originalWidth, h: state.originalHeight,
                label: 'Freehand Mask',
                selected: true,
                startTime: 0,
                endTime: state.videoDuration || 0,
                isBrushMask: true,
                paintedBounds: { minX: state.originalWidth, minY: state.originalHeight, maxX: 0, maxY: 0 }
            };
            state.boxes.push(brushBox);
        }
        
        paintBrushStroke(e);
    }

    function handleBrushMove(e) {
        if (!state.isBrushing || state.toolMode !== 'brush') return;
        paintBrushStroke(e);
    }

    function handleBrushEnd() {
        if (state.isBrushing) {
            state.isBrushing = false;
            updateDetectionsList();
            updateProcessButtonState();
        }
    }

    function paintBrushStroke(e) {
        const canvas = elements.brushMaskCanvas;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        const dX = e.clientX - rect.left;
        const dY = e.clientY - rect.top;

        const origX = dX * state.scaleX;
        const origY = dY * state.scaleY;

        ctx.fillStyle = '#ec4899'; 
        ctx.beginPath();
        ctx.arc(origX, origY, state.brushSize / 2, 0, Math.PI * 2);
        ctx.fill();

        const brushBox = state.boxes.find(b => b.isBrushMask);
        if (brushBox && brushBox.paintedBounds) {
            const rad = state.brushSize / 2;
            const left = Math.max(0, origX - rad);
            const right = Math.min(state.originalWidth, origX + rad);
            const top = Math.max(0, origY - rad);
            const bottom = Math.min(state.originalHeight, origY + rad);

            if (left < brushBox.paintedBounds.minX) brushBox.paintedBounds.minX = Math.round(left);
            if (right > brushBox.paintedBounds.maxX) brushBox.paintedBounds.maxX = Math.round(right);
            if (top < brushBox.paintedBounds.minY) brushBox.paintedBounds.minY = Math.round(top);
            if (bottom > brushBox.paintedBounds.maxY) brushBox.paintedBounds.maxY = Math.round(bottom);

            brushBox.x = brushBox.paintedBounds.minX;
            brushBox.y = brushBox.paintedBounds.minY;
            brushBox.w = brushBox.paintedBounds.maxX - brushBox.paintedBounds.minX;
            brushBox.h = brushBox.paintedBounds.maxY - brushBox.paintedBounds.minY;
        }
    }

    function renderBrushMaskCanvas() {
        const canvas = elements.brushMaskCanvas;
        const ctx = canvas.getContext('2d');
        const hasBrush = state.boxes.some(b => b.isBrushMask);
        if (!hasBrush) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // BOX AND CLONE DRAGGING
    function handleDrawStart(e) {
        if (state.activeResizer) return;

        const clickedSourceNode = e.target.closest('.clone-source-indicator');
        if (clickedSourceNode) {
            e.stopPropagation();
            state.isDraggingCloneSource = true;
            state.draggedBoxId = clickedSourceNode.dataset.id;
            return;
        }

        const clickedBox = e.target.closest('.bounding-box');
        if (clickedBox) {
            const boxId = clickedBox.dataset.id;
            selectBox(boxId);

            const box = state.boxes.find(b => b.id === boxId);
            if (box.isBrushMask) return; 

            state.isDraggingBox = true;
            state.draggedBoxId = boxId;

            const rect = elements.interactiveOverlay.getBoundingClientRect();
            state.dragStart = {
                x: e.clientX - rect.left - (box.x / state.scaleX),
                y: e.clientY - rect.top - (box.y / state.scaleY)
            };
            return;
        }

        if (state.toolMode === 'box' || state.toolMode === 'clone') {
            const rect = elements.interactiveOverlay.getBoundingClientRect();
            state.isDrawing = true;
            state.drawStart = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            const temp = document.createElement('div');
            temp.id = 'drawing-box-temp';
            temp.style.position = 'absolute';
            temp.style.border = state.toolMode === 'clone' ? '2.5px dotted var(--secondary)' : '2px dashed var(--primary)';
            temp.style.background = state.toolMode === 'clone' ? 'rgba(236, 72, 153, 0.08)' : 'rgba(139, 92, 246, 0.1)';
            temp.style.left = state.drawStart.x + 'px';
            temp.style.top = state.drawStart.y + 'px';
            elements.interactiveOverlay.appendChild(temp);
        }
    }

    function handleDrawMove(e) {
        if (state.activeResizer) {
            handleResize(e);
            return;
        }

        const rect = elements.interactiveOverlay.getBoundingClientRect();

        if (state.isDraggingCloneSource) {
            const box = state.boxes.find(b => b.id === state.draggedBoxId);
            if (!box) return;

            const curXDisplay = e.clientX - rect.left;
            const curYDisplay = e.clientY - rect.top;

            const targetCenterX = (box.x + box.w / 2) / state.scaleX;
            const targetCenterY = (box.y + box.h / 2) / state.scaleY;

            box.cloneOffset.x = Math.round((curXDisplay - targetCenterX) * state.scaleX);
            box.cloneOffset.y = Math.round((curYDisplay - targetCenterY) * state.scaleY);

            elements.cloneOffsetX.textContent = (box.cloneOffset.x >= 0 ? '+' : '') + box.cloneOffset.x + 'px';
            elements.cloneOffsetY.textContent = (box.cloneOffset.y >= 0 ? '+' : '') + box.cloneOffset.y + 'px';

            renderBoxes();
            return;
        }

        if (state.isDrawing) {
            const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
            const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

            const left = Math.min(state.drawStart.x, curX);
            const top = Math.min(state.drawStart.y, curY);
            const w = Math.abs(state.drawStart.x - curX);
            const h = Math.abs(state.drawStart.y - curY);

            const temp = document.getElementById('drawing-box-temp');
            if (temp) {
                temp.style.left = left + 'px';
                temp.style.top = top + 'px';
                temp.style.width = w + 'px';
                temp.style.height = h + 'px';
            }
        } else if (state.isDraggingBox) {
            const box = state.boxes.find(b => b.id === state.draggedBoxId);
            if (!box) return;

            const curX = e.clientX - rect.left - state.dragStart.x;
            const curY = e.clientY - rect.top - state.dragStart.y;

            const dW = box.w / state.scaleX;
            const dH = box.h / state.scaleY;

            const cX = Math.max(0, Math.min(rect.width - dW, curX));
            const cY = Math.max(0, Math.min(rect.height - dH, curY));

            box.x = Math.round(cX * state.scaleX);
            box.y = Math.round(cY * state.scaleY);

            renderBoxes();
            updateDetectionsList();
        }
    }

    function handleDrawEnd(e) {
        if (state.activeResizer) {
            state.activeResizer = null;
            return;
        }

        if (state.isDraggingCloneSource) {
            state.isDraggingCloneSource = false;
            state.draggedBoxId = null;
            return;
        }

        if (state.isDrawing) {
            state.isDrawing = false;
            const temp = document.getElementById('drawing-box-temp');
            if (temp) {
                const rect = elements.interactiveOverlay.getBoundingClientRect();
                const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

                const left = Math.min(state.drawStart.x, curX);
                const top = Math.min(state.drawStart.y, curY);
                const w = Math.abs(state.drawStart.x - curX);
                const h = Math.abs(state.drawStart.y - curY);
                temp.remove();

                if (w > 12 && h > 12) {
                    const newId = 'box-' + Date.now();
                    const isCloneTool = state.toolMode === 'clone';
                    
                    state.boxes.push({
                        id: newId,
                        x: Math.round(left * state.scaleX),
                        y: Math.round(top * state.scaleY),
                        w: Math.round(w * state.scaleX),
                        h: Math.round(h * state.scaleY),
                        label: isCloneTool ? 'Clone Patch' : 'Custom Mask',
                        selected: true,
                        startTime: 0,
                        endTime: state.videoDuration || 0,
                        isBrushMask: false,
                        cloneOffset: { x: isCloneTool ? 80 : 0, y: 0 }
                    });

                    renderBoxes();
                    selectBox(newId);
                    updateDetectionsList();
                    updateProcessButtonState();

                    if (isCloneTool) {
                        setRemovalMode('clone');
                    }
                }
            }
        }

        if (state.isDraggingBox) {
            state.isDraggingBox = false;
            state.draggedBoxId = null;
        }
    }

    // Handles resizing
    function setupResizer(handle, boxId, direction) {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            state.activeResizer = { boxId, direction };
        });
    }

    function handleResize(e) {
        if (!state.activeResizer) return;
        const { boxId, direction } = state.activeResizer;
        const box = state.boxes.find(b => b.id === boxId);
        if (!box) return;

        const rect = elements.interactiveOverlay.getBoundingClientRect();
        const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

        let left = box.x / state.scaleX;
        let top = box.y / state.scaleY;
        let right = (box.x + box.w) / state.scaleX;
        let bottom = (box.y + box.h) / state.scaleY;

        const minSize = 15;

        if (direction.includes('e')) right = Math.max(left + minSize, curX);
        if (direction.includes('w')) left = Math.min(right - minSize, curX);
        if (direction.includes('s')) bottom = Math.max(top + minSize, curY);
        if (direction.includes('n')) top = Math.min(bottom - minSize, curY);

        box.x = Math.round(left * state.scaleX);
        box.y = Math.round(top * state.scaleY);
        box.w = Math.round((right - left) * state.scaleX);
        box.h = Math.round((bottom - top) * state.scaleY);

        renderBoxes();
        updateDetectionsList();
    }

    // Box Focus highlights
    function selectBox(id) {
        state.activeBoxId = id;
        document.querySelectorAll('.bounding-box').forEach(el => {
            el.classList.toggle('active', el.dataset.id === id);
        });
        document.querySelectorAll('.detection-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === id);
        });
        
        const box = state.boxes.find(b => b.id === id);
        if (box) {
            elements.cloneOffsetX.textContent = (box.cloneOffset.x >= 0 ? '+' : '') + box.cloneOffset.x + 'px';
            elements.cloneOffsetY.textContent = (box.cloneOffset.y >= 0 ? '+' : '') + box.cloneOffset.y + 'px';
            if (box.label.includes('Clone') || state.removalMode === 'clone') {
                setRemovalMode('clone');
            }
        }
        renderBoxes();
    }

    function removeBox(id) {
        state.boxes = state.boxes.filter(b => b.id !== id);
        if (state.activeBoxId === id) state.activeBoxId = null;
        
        if (id === 'brush-mask-total') {
            const ctx = elements.brushMaskCanvas.getContext('2d');
            ctx.clearRect(0, 0, elements.brushMaskCanvas.width, elements.brushMaskCanvas.height);
        }
        
        renderBoxes();
        updateDetectionsList();
        updateProcessButtonState();
    }

    function toggleBoxSelection(id) {
        const box = state.boxes.find(b => b.id === id);
        if (box) {
            box.selected = !box.selected;
            renderBoxes();
            updateDetectionsList();
            updateProcessButtonState();
        }
    }

    // Render Bounding Boxes & Clone Stamp pointers on screen
    function renderBoxes() {
        const oldBoxes = elements.interactiveOverlay.querySelectorAll('.bounding-box, .clone-source-indicator, .clone-connector-line');
        oldBoxes.forEach(b => b.remove());

        const currentVideoTime = state.fileType === 'video' ? elements.previewVideo.currentTime : 0;

        state.boxes.forEach(box => {
            if (state.fileType === 'video') {
                if (currentVideoTime < box.startTime || currentVideoTime > box.endTime) {
                    return; 
                }
            }

            if (box.isBrushMask) return;

            const el = document.createElement('div');
            el.className = `bounding-box ${state.activeBoxId === box.id ? 'active' : ''}`;
            el.dataset.id = box.id;
            
            const bX = box.x / state.scaleX;
            const bY = box.y / state.scaleY;
            const bW = box.w / state.scaleX;
            const bH = box.h / state.scaleY;

            el.style.left = bX + 'px';
            el.style.top = bY + 'px';
            el.style.width = bW + 'px';
            el.style.height = bH + 'px';
            
            const isClone = state.removalMode === 'clone' && (state.activeBoxId === box.id || box.label.includes('Clone'));
            el.style.background = isClone ? 'rgba(236, 72, 153, 0.08)' : (box.selected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)');
            
            if (isClone) {
                el.style.border = '2px dotted var(--secondary)';
            } else if (!box.selected) {
                el.style.borderStyle = 'dashed';
                el.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                el.style.boxShadow = 'none';
            }

            // Badge
            const badge = document.createElement('div');
            badge.className = 'bounding-box-badge';
            badge.style.background = isClone ? 'var(--secondary)' : 'var(--primary)';
            badge.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                ${box.label}
            `;
            el.appendChild(badge);

            // Delete
            const close = document.createElement('div');
            close.className = 'bounding-box-close';
            close.innerHTML = '&times;';
            close.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                removeBox(box.id);
            });
            el.appendChild(close);

            // Handles (Active focus)
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

            if (isClone) {
                const sX = bX + (bW / 2) + (box.cloneOffset.x / state.scaleX);
                const sY = bY + (bH / 2) + (box.cloneOffset.y / state.scaleY);

                // Connector line
                const line = document.createElement('div');
                line.className = 'clone-connector-line';
                
                const startX = bX + (bW / 2);
                const startY = bY + (bH / 2);
                
                const dist = Math.sqrt(Math.pow(sX - startX, 2) + Math.pow(sY - startY, 2));
                const angle = Math.atan2(sY - startY, sX - startX) * 180 / Math.PI;

                line.style.width = dist + 'px';
                line.style.left = startX + 'px';
                line.style.top = startY + 'px';
                line.style.transform = `rotate(${angle}deg)`;
                elements.interactiveOverlay.appendChild(line);

                // Source Node circle
                const sourceNode = document.createElement('div');
                sourceNode.className = 'clone-source-indicator';
                sourceNode.dataset.id = box.id;
                sourceNode.style.width = bW + 'px';
                sourceNode.style.height = bH + 'px';
                sourceNode.style.left = sX + 'px';
                sourceNode.style.top = sY + 'px';
                elements.interactiveOverlay.appendChild(sourceNode);
            }
        });
        
        elements.clearMasksBtn.style.display = state.boxes.length > 0 ? 'inline-block' : 'none';
    }

    // Sync sidebar listings
    function updateDetectionsList() {
        if (state.boxes.length === 0) {
            elements.detectionsList.innerHTML = `<div class="detections-placeholder">No watermarks selected. Click and drag to create targets.</div>`;
            return;
        }

        elements.detectionsList.innerHTML = '';
        state.boxes.forEach(box => {
            const item = document.createElement('div');
            item.className = `detection-item ${box.selected ? 'selected' : ''} ${state.activeBoxId === box.id ? 'active' : ''}`;
            item.dataset.id = box.id;

            const isVideo = state.fileType === 'video';

            let timelineRangeHtml = '';
            if (isVideo) {
                timelineRangeHtml = `
                    <div class="item-range-container">
                        <div class="item-range-label">
                            <span>Active timeline:</span>
                            <span id="range-text-${box.id}">${formatTime(box.startTime)} - ${formatTime(box.endTime)}</span>
                        </div>
                        <div class="item-range-inputs">
                            <input type="range" min="0" max="${Math.floor(state.videoDuration)}" value="${Math.floor(box.startTime)}" class="custom-range item-range-slider" id="start-time-${box.id}" step="1">
                            <input type="range" min="0" max="${Math.floor(state.videoDuration)}" value="${Math.floor(box.endTime)}" class="custom-range item-range-slider" id="end-time-${box.id}" step="1">
                        </div>
                    </div>
                `;
            }

            item.innerHTML = `
                <div class="detection-left" style="width: 85%;">
                    <div class="detection-checkbox">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div class="detection-info" style="width: 100%;">
                        <span class="detection-name">${box.label}</span>
                        <span class="detection-coords">${box.isBrushMask ? 'Painted shapes' : box.w + 'x' + box.h + ' px at [' + box.x + ', ' + box.y + ']'}</span>
                        ${timelineRangeHtml}
                    </div>
                </div>
                <button class="delete-detection-btn" title="Delete watermark target">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            `;

            if (isVideo) {
                setTimeout(() => {
                    const startSld = document.getElementById(`start-time-${box.id}`);
                    const endSld = document.getElementById(`end-time-${box.id}`);
                    const rangeTxt = document.getElementById(`range-text-${box.id}`);

                    if (startSld && endSld) {
                        startSld.addEventListener('input', (e) => {
                            let startVal = parseFloat(e.target.value);
                            if (startVal >= box.endTime) {
                                startVal = box.endTime - 0.2;
                                startSld.value = startVal;
                            }
                            box.startTime = startVal;
                            rangeTxt.textContent = `${formatTime(box.startTime)} - ${formatTime(box.endTime)}`;
                            renderBoxes();
                        });

                        endSld.addEventListener('input', (e) => {
                            let endVal = parseFloat(e.target.value);
                            if (endVal <= box.startTime) {
                                endVal = box.startTime + 0.2;
                                endSld.value = endVal;
                            }
                            box.endTime = endVal;
                            rangeTxt.textContent = `${formatTime(box.startTime)} - ${formatTime(box.endTime)}`;
                            renderBoxes();
                        });
                    }
                }, 0);
            }

            item.addEventListener('click', (e) => {
                if (e.target.closest('.delete-detection-btn')) {
                    removeBox(box.id);
                } else if (e.target.closest('.detection-checkbox') || e.target.classList.contains('detection-checkbox')) {
                    toggleBoxSelection(box.id);
                } else if (e.target.closest('.item-range-container')) {
                    // range clicks
                } else {
                    selectBox(box.id);
                }
            });

            elements.detectionsList.appendChild(item);
        });
    }

    function updateProcessButtonState() {
        const hasSelected = state.boxes.some(b => b.selected && (b.isBrushMask || (b.w > 2 && b.h > 2)));
        elements.processBtn.disabled = !hasSelected;
    }

    // ----------------------------------------------------
    // RESTORATION & CLONE STAMP ENGINES
    // ----------------------------------------------------
    function runInpaint(ctx, box) {
        if (state.removalMode === 'clone' || box.label.includes('Clone')) {
            runSmartClone(ctx, box);
        } else {
            runOnionDiffusion(ctx, box);
        }
    }

    // Fixed Onion Diffusion: No coordinate shifting
    function runOnionDiffusion(ctx, box) {
        const margin = 10;
        
        const x1 = box.x;
        const y1 = box.y;
        const x2 = box.x + box.w;
        const y2 = box.y + box.h;

        // Expanded boundaries clamped to canvas bounds
        const ex1 = Math.max(0, x1 - margin);
        const ey1 = Math.max(0, y1 - margin);
        const ex2 = Math.min(state.originalWidth, x2 + margin);
        const ey2 = Math.min(state.originalHeight, y2 + margin);

        const srcX = ex1;
        const srcY = ey1;
        const srcW = ex2 - ex1;
        const srcH = ey2 - ey1;

        if (srcW <= 0 || srcH <= 0) return;

        const imgData = ctx.getImageData(srcX, srcY, srcW, srcH);
        const pixels = imgData.data;

        // Mask mapping: 1 means we need to inpaint this pixel
        const mask = new Uint8Array(srcW * srcH);

        if (box.isBrushMask) {
            // Retrieve custom painted mask strokes
            const maskTempCanvas = document.createElement('canvas');
            maskTempCanvas.width = state.originalWidth;
            maskTempCanvas.height = state.originalHeight;
            const maskTempCtx = maskTempCanvas.getContext('2d');
            maskTempCtx.drawImage(elements.brushMaskCanvas, 0, 0);

            const brushMaskData = maskTempCtx.getImageData(srcX, srcY, srcW, srcH).data;
            for (let y = 0; y < srcH; y++) {
                for (let x = 0; x < srcW; x++) {
                    const idx = y * srcW + x;
                    mask[idx] = (brushMaskData[idx * 4 + 3] > 80 || brushMaskData[idx * 4] > 80) ? 1 : 0;
                }
            }
        } else {
            // Bounding box fill mask: relative to expanded (ex1, ey1)
            const maskLeft = x1 - ex1;
            const maskTop = y1 - ey1;
            const maskRight = x2 - ex1;
            const maskBottom = y2 - ey1;

            for (let y = maskTop; y < maskBottom; y++) {
                for (let x = maskLeft; x < maskRight; x++) {
                    if (x >= 0 && x < srcW && y >= 0 && y < srcH) {
                        mask[y * srcW + x] = 1;
                    }
                }
            }
        }

        // Initialize outer boundary coordinates queue
        let queue = [];
        for (let y = 0; y < srcH; y++) {
            for (let x = 0; x < srcW; x++) {
                const idx = y * srcW + x;
                if (mask[idx] === 1) {
                    const isLeftBg = x === 0 || mask[idx - 1] === 0;
                    const isRightBg = x === srcW - 1 || mask[idx + 1] === 0;
                    const isTopBg = y === 0 || mask[idx - srcW] === 0;
                    const isBottomBg = y === srcH - 1 || mask[idx + srcW] === 0;

                    if (isLeftBg || isRightBg || isTopBg || isBottomBg) {
                        queue.push(idx);
                    }
                }
            }
        }

        // Propagate background colors inwards
        while (queue.length > 0) {
            const nextQueue = [];
            for (let i = 0; i < queue.length; i++) {
                const idx = queue[i];
                if (mask[idx] === 0) continue;

                let rSum = 0, gSum = 0, bSum = 0, count = 0;
                
                const y = Math.floor(idx / srcW);
                const x = idx % srcW;

                const dirs = [];
                if (x > 0) dirs.push(idx - 1);
                if (x < srcW - 1) dirs.push(idx + 1);
                if (y > 0) dirs.push(idx - srcW);
                if (y < srcH - 1) dirs.push(idx + srcW);

                dirs.forEach(n => {
                    if (mask[n] === 0) {
                        const offset = n * 4;
                        rSum += pixels[offset];
                        gSum += pixels[offset + 1];
                        bSum += pixels[offset + 2];
                        count++;
                    }
                });

                if (count > 0) {
                    const offset = idx * 4;
                    pixels[offset] = Math.round(rSum / count);
                    pixels[offset + 1] = Math.round(gSum / count);
                    pixels[offset + 2] = Math.round(bSum / count);
                    mask[idx] = 0; // Solved

                    dirs.forEach(n => {
                        if (mask[n] === 1) {
                            nextQueue.push(n);
                        }
                    });
                }
            }
            queue = nextQueue;
        }

        // Blending edge seams
        if (state.feather > 0 && !box.isBrushMask) {
            const maskLeft = x1 - ex1;
            const maskTop = y1 - ey1;
            const maskRight = x2 - ex1;
            const maskBottom = y2 - ey1;

            for (let y = 0; y < srcH; y++) {
                for (let x = 0; x < srcW; x++) {
                    const distToLeft = Math.abs(x - maskLeft);
                    const distToRight = Math.abs(x - maskRight);
                    const distToTop = Math.abs(y - maskTop);
                    const distToBottom = Math.abs(y - maskBottom);

                    const isNearX = distToLeft <= 2 || distToRight <= 2;
                    const isNearY = distToTop <= 2 || distToBottom <= 2;

                    if (isNearX || isNearY) {
                        const center = (y * srcW + x) * 4;
                        let r = 0, g = 0, b = 0, cCount = 0;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const ny = y + dy;
                                const nx = x + dx;
                                if (nx >= 0 && nx < srcW && ny >= 0 && ny < srcH) {
                                    const sample = (ny * srcW + nx) * 4;
                                    r += pixels[sample];
                                    g += pixels[sample + 1];
                                    b += pixels[sample + 2];
                                    cCount++;
                                }
                            }
                        }
                        pixels[center] = Math.round(r / cCount);
                        pixels[center + 1] = Math.round(g / cCount);
                        pixels[center + 2] = Math.round(b / cCount);
                    }
                }
            }
        }

        ctx.putImageData(imgData, srcX, srcY);
    }

    // Smart Clone Stamp: Clones from current frame buffer (avoids self-feedback artifacts)
    function runSmartClone(ctx, box) {
        const xVal = Math.max(0, box.x);
        const yVal = Math.max(0, box.y);
        const wVal = Math.min(state.originalWidth - xVal, box.w);
        const hVal = Math.min(state.originalHeight - yVal, box.h);

        if (wVal <= 0 || hVal <= 0) return;

        const dx = box.cloneOffset.x;
        const dy = box.cloneOffset.y;

        const canvasWidth = state.originalWidth;
        const canvasHeight = state.originalHeight;

        // Fetch current canvas frame context
        const currentImgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        const currentPixels = currentImgData.data;

        // Duplicate pixel buffer to read uncorrupted textures
        const tempPixels = new Uint8ClampedArray(currentPixels);

        // Clone target mask
        for (let y = yVal; y < yVal + hVal; y++) {
            for (let x = xVal; x < xVal + wVal; x++) {
                const srcX = Math.max(0, Math.min(canvasWidth - 1, x + dx));
                const srcY = Math.max(0, Math.min(canvasHeight - 1, y + dy));

                const targetOffset = (y * canvasWidth + x) * 4;
                const sourceOffset = (srcY * canvasWidth + srcX) * 4;

                const marginX = Math.min(x - xVal, (xVal + wVal) - x);
                const marginY = Math.min(y - yVal, (yVal + hVal) - y);
                const borderDist = Math.min(marginX, marginY);
                
                const featherWidth = state.feather + 1;
                let blendWeight = 1.0;
                if (borderDist < featherWidth) {
                    blendWeight = borderDist / featherWidth;
                }

                currentPixels[targetOffset] = Math.round(tempPixels[sourceOffset] * blendWeight + currentPixels[targetOffset] * (1 - blendWeight));
                currentPixels[targetOffset + 1] = Math.round(tempPixels[sourceOffset + 1] * blendWeight + currentPixels[targetOffset + 1] * (1 - blendWeight));
                currentPixels[targetOffset + 2] = Math.round(tempPixels[sourceOffset + 2] * blendWeight + currentPixels[targetOffset + 2] * (1 - blendWeight));
            }
        }

        ctx.putImageData(currentImgData, 0, 0);
    }

    // ----------------------------------------------------
    // PROCESS AND EXPORTS
    // ----------------------------------------------------
    // Photo Export
    function processImage() {
        elements.statusTitle.textContent = "Processing Image";
        elements.statusDesc.textContent = "Removing watermarks, signatures, and stamps...";
        elements.progressPercent.textContent = "15%";
        elements.progressBarFill.style.width = "15%";
        elements.renderPreviewWrapper.style.display = "none";
        elements.processingModal.classList.add('show');

        const canvas = document.createElement('canvas');
        canvas.width = state.originalWidth;
        canvas.height = state.originalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(elements.previewImage, 0, 0);

        setTimeout(() => {
            elements.progressPercent.textContent = "50%";
            elements.progressBarFill.style.width = "50%";

            state.boxes.forEach(box => {
                if (box.selected) {
                    runInpaint(ctx, box);
                }
            });

            elements.progressPercent.textContent = "90%";
            elements.progressBarFill.style.width = "90%";

            const restoredUrl = canvas.toDataURL(state.file.type);
            elements.cleanImageBg.src = restoredUrl;
            elements.originalImageFg.src = state.objectUrl;

            // Trigger slider widgets
            elements.compSlider.value = 50;
            elements.originalImageFg.style.clipPath = `polygon(0 0, 50% 0, 50% 100%, 0 100%)`;
            elements.compDivider.style.left = `50%`;
            elements.compHandle.style.left = `50%`;

            canvas.toBlob(blob => {
                state.restoredBlob = blob;
            }, state.file.type);

            setTimeout(() => {
                elements.processingModal.classList.remove('show');
                elements.mediaWrapper.classList.add('hidden');
                elements.comparisonView.classList.remove('hidden');
                
                elements.processBtn.classList.add('hidden');
                elements.downloadBtn.classList.remove('hidden');
                showToast("Watermark removed successfully. Compare Before & After!");
            }, 600);

        }, 400);
    }

    // Video Export (Fixed playability)
    async function processVideo() {
        state.processing = true;
        elements.statusTitle.textContent = "Processing Video";
        elements.statusDesc.textContent = "Compiling keyframes, diffusing texture, and restoring audio...";
        elements.progressPercent.textContent = "0%";
        elements.progressBarFill.style.width = "0%";
        elements.renderPreviewWrapper.style.display = "block";
        elements.processingModal.classList.add('show');

        const renderVideo = document.createElement('video');
        renderVideo.src = state.objectUrl;
        renderVideo.muted = true;
        renderVideo.playsInline = true;
        await new Promise(r => renderVideo.onloadedmetadata = r);

        const canvas = document.createElement('canvas');
        canvas.width = state.originalWidth;
        canvas.height = state.originalHeight;
        const ctx = canvas.getContext('2d');

        const previewCtx = elements.renderPreviewCanvas.getContext('2d');
        elements.renderPreviewCanvas.width = 320;
        elements.renderPreviewCanvas.height = Math.round(320 * (state.originalHeight / state.originalWidth));

        // Audio stream tracking: extract from render video during playback
        let audioTrack = null;
        try {
            const renderStream = renderVideo.captureStream ? renderVideo.captureStream() : renderVideo.mozCaptureStream();
            if (renderStream && renderStream.getAudioTracks().length > 0) {
                audioTrack = renderStream.getAudioTracks()[0].clone();
            }
        } catch (e) {
            console.warn("Muted or non-existent audio track: ", e);
        }

        const fps = 30;
        const canvasStream = canvas.captureStream(fps);
        if (audioTrack) {
            canvasStream.addTrack(audioTrack);
        }

        state.recordedChunks = [];
        
        // Optimizing codec selection for maximum playability (Priority H.264/AAC > VP9 > VP8)
        let options = { mimeType: 'video/webm;codecs=h264,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'video/webm;codecs=h264' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'video/mp4;codecs=h264,aac' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'video/mp4;codecs=h264' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'video/webm;codecs=vp9,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'video/webm;codecs=vp8,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'video/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) options = {};

        try {
            state.mediaRecorder = new MediaRecorder(canvasStream, options);
        } catch (e) {
            state.mediaRecorder = new MediaRecorder(canvasStream);
        }

        state.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) state.recordedChunks.push(e.data);
        };

        state.mediaRecorder.onstop = () => {
            const blob = new Blob(state.recordedChunks, { type: state.mediaRecorder.mimeType || 'video/webm' });
            state.restoredBlob = blob;
            state.processing = false;
            
            elements.processingModal.classList.remove('show');
            elements.processBtn.classList.add('hidden');
            elements.downloadBtn.classList.remove('hidden');
            showToast("Video fully processed! Ready to save.");
        };

        state.mediaRecorder.start();
        renderVideo.play();

        function processLoop() {
            if (!state.processing) {
                try {
                    renderVideo.pause();
                    state.mediaRecorder.stop();
                } catch(e) {}
                return;
            }

            if (renderVideo.paused || renderVideo.ended) {
                if (renderVideo.ended) state.mediaRecorder.stop();
                return;
            }

            ctx.drawImage(renderVideo, 0, 0, canvas.width, canvas.height);

            const curTime = renderVideo.currentTime;

            // Inpaint matching masks (Only active ones for current timestamp)
            state.boxes.forEach(box => {
                if (box.selected && curTime >= box.startTime && curTime <= box.endTime) {
                    runInpaint(ctx, box);
                }
            });

            previewCtx.drawImage(canvas, 0, 0, elements.renderPreviewCanvas.width, elements.renderPreviewCanvas.height);

            const percent = Math.min(100, Math.round((curTime / renderVideo.duration) * 100));
            elements.progressPercent.textContent = percent + "%";
            elements.progressBarFill.style.width = percent + "%";

            if (renderVideo.requestVideoFrameCallback) {
                renderVideo.requestVideoFrameCallback(processLoop);
            } else {
                setTimeout(processLoop, 1000 / fps);
            }
        }

        if (renderVideo.requestVideoFrameCallback) {
            renderVideo.requestVideoFrameCallback(processLoop);
        } else {
            setTimeout(processLoop, 1000 / fps);
        }
    }

    elements.cancelProcessBtn.addEventListener('click', () => {
        if (state.processing) {
            state.processing = false;
            if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
                state.mediaRecorder.stop();
            }
            showToast('Processing cancelled', 'error');
            elements.processingModal.classList.remove('show');
        }
    });

    elements.downloadBtn.addEventListener('click', () => {
        if (!state.restoredBlob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(state.restoredBlob);
        
        let ext = state.fileType === 'image' ? 'png' : 'webm';
        if (state.fileType === 'video' && state.mediaRecorder.mimeType && state.mediaRecorder.mimeType.includes('mp4')) {
            ext = 'mp4';
        }

        const origName = state.file.name.substring(0, state.file.name.lastIndexOf('.')) || state.file.name;
        link.download = `${origName}_clear.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Tell user how to play WebM files if it downloads as WebM
        if (ext === 'webm') {
            showToast("File downloaded! Tip: Open WebM files in Google Chrome or VLC Media Player.", "success");
        } else {
            showToast("File saved to downloads directory!");
        }
    });

    // Comparison slider logic
    elements.compSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        elements.originalImageFg.style.clipPath = `polygon(0 0, ${val}% 0, ${val}% 100%, 0 100%)`;
        elements.compDivider.style.left = `${val}%`;
        elements.compHandle.style.left = `${val}%`;
    });
});
