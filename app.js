// Config & State Management
const canvas = document.getElementById('twibbon-canvas');
const ctx = canvas.getContext('2d');

// Element Selector
const uploadInput = document.getElementById('upload-foto');
const zoomSlider = document.getElementById('zoom-slider');
const zoomValueLabel = document.getElementById('zoom-value');
const btnRotate = document.getElementById('btn-rotate');
const btnReset = document.getElementById('btn-reset');
const btnDownload = document.getElementById('btn-download');
const btnRemovePhoto = document.getElementById('btn-remove-photo');
const fileNameContainer = document.getElementById('file-name-container');
const fileNameLabel = document.getElementById('file-name');
const canvasOverlay = document.getElementById('canvas-overlay');
const statusBadge = document.getElementById('status-badge');

// Target Canvas Size (Gunakan resolusi tinggi standar twibbon agar jernih saat diunduh)
const CANVAS_SIZE = 1024;
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

// Objek penampung Gambar
let twibbonImg = new Image();
let userImg = new Image();

// State transformasi gambar user
let state = {
    hasUserImg: false,
    x: CANVAS_SIZE / 2,
    y: CANVAS_SIZE / 2,
    scale: 1.0,
    rotation: 0, // dalam derajat (0, 90, 180, 270)
    isDragging: false,
    startX: 0,
    startY: 0
};

// --- PATH ASSET TWIBBON ---
// Ganti string di bawah ini menjadi path file twibbon asli milik Anda, contoh: 'img/twibbon-template.png'
const TWIBBON_SRC = 'template.png'; 

// Load Awal: Inisialisasi Template Twibbon
twibbonImg.crossOrigin = 'anonymous';
twibbonImg.src = TWIBBON_SRC;

// Backup Handler jika file gambar 'img/twibbon-template.png' belum dimasukkan oleh user
twibbonImg.onerror = function() {
    console.warn("Aset 'img/twibbon-template.png' belum ditemukan. Membuat template mockup otomatis...");
    createMockupTwibbon();
};

twibbonImg.onload = function() {
    drawAll();
};

// Fungsi pembantu jika file twibbon fisik belum ditaruh di folder img (Membuat bingkai transparan estetik otomatis)
function createMockupTwibbon() {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = CANVAS_SIZE;
    mockCanvas.height = CANVAS_SIZE;
    const mCtx = mockCanvas.getContext('2d');

    // Membuat desain lingkaran transparan di tengah (Template Mockup standar)
    mCtx.fillStyle = 'rgba(79, 70, 229, 0.9)'; // Indigo Solid
    mCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Melubangi bagian tengah untuk foto
    mCtx.globalCompositeOperation = 'destination-out';
    mCtx.beginPath();
    mCtx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.38, 0, Math.PI * 2);
    mCtx.fill();
    
    // Menambahkan aksen bingkai kosmetik di sekeliling lubang
    mCtx.globalCompositeOperation = 'source-over';
    mCtx.strokeStyle = '#ffffff';
    mCtx.lineWidth = 15;
    mCtx.beginPath();
    mCtx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE * 0.38, 0, Math.PI * 2);
    mCtx.stroke();

    // Menambahkan teks placeholder ke dalam template mockup
    mCtx.fillStyle = '#ffffff';
    mCtx.font = 'bold 36px sans-serif';
    mCtx.textAlign = 'center';
    mCtx.fillText('TEMPATKAN FOTOMU DI SINI', CANVAS_SIZE / 2, CANVAS_SIZE * 0.12);
    mCtx.font = '30px sans-serif';
    mCtx.fillText('Ganti dengan file: img/twibbon-template.png', CANVAS_SIZE / 2, CANVAS_SIZE * 0.92);

    twibbonImg.src = mockCanvas.toDataURL();
}

// --- CORE DRAW ENGINE ---
function drawAll() {
    // 1. Bersihkan Canvas total
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Gambar Foto Pengguna (Di Lapisan Bawah)
    if (state.hasUserImg) {
        ctx.save();
        // Pindahkan koordinat matrix ke titik pusat posisi foto yang digeser
        ctx.translate(state.x, state.y);
        // Jalankan rotasi
        ctx.rotate((state.rotation * Math.PI) / 180);
        // Jalankan kalkulasi skala zoom
        const drawWidth = userImg.width * state.scale;
        const drawHeight = userImg.height * state.scale;
        
        // Gambar dengan poros tengah koordinat (mengurangi setengah lebar/tinggi)
        ctx.drawImage(userImg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();
    }

    // 3. Gambar Template Twibbon (Di Lapisan Atas / Foreground)
    ctx.drawImage(twibbonImg, 0, 0, canvas.width, canvas.height);
}

// --- EVENT HANDLERS & LOGIC ---

// Event Unggah Foto
uploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    fileNameLabel.textContent = file.name;
    fileNameContainer.classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = function(event) {
        userImg = new Image();
        userImg.onload = function() {
            state.hasUserImg = true;
            
            // Set Auto-Scale Optimal Biar pas saat awal masuk (Covering Aspect)
            const minRatio = CANVAS_SIZE / Math.min(userImg.width, userImg.height);
            state.scale = minRatio;
            
            // Set slider awal menyesuaikan skala default dasar
            zoomSlider.value = Math.round(minRatio * 100);
            zoomValueLabel.textContent = zoomSlider.value + '%';
            
            // Atur batas min-max zoom dinamis bersandar pada rasio gambar masuk
            zoomSlider.min = Math.round(minRatio * 0.3 * 100);
            zoomSlider.max = Math.round(minRatio * 3 * 100);

            // Reset posisi koordinat ke tengah canvas
            state.x = CANVAS_SIZE / 2;
            state.y = CANVAS_SIZE / 2;
            state.rotation = 0;

            // UI State updates
            toggleControls(true);
            canvasOverlay.classList.add('opacity-0', 'pointer-events-none');
            statusBadge.textContent = "Siap Diatur";
            statusBadge.className = "text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-medium";
            
            drawAll();
        };
        userImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Event Slider Zoom
zoomSlider.addEventListener('input', function(e) {
    if (!state.hasUserImg) return;
    state.scale = parseFloat(e.target.value) / 100;
    zoomValueLabel.textContent = e.target.value + '%';
    drawAll();
});

// Event Tombol Rotasi
btnRotate.addEventListener('click', function() {
    if (!state.hasUserImg) return;
    state.rotation = (state.rotation + 90) % 360;
    drawAll();
});

// Event Tombol Reset Posisi
btnReset.addEventListener('click', function() {
    if (!state.hasUserImg) return;
    const minRatio = CANVAS_SIZE / Math.min(userImg.width, userImg.height);
    state.scale = minRatio;
    state.x = CANVAS_SIZE / 2;
    state.y = CANVAS_SIZE / 2;
    state.rotation = 0;
    
    zoomSlider.value = Math.round(minRatio * 100);
    zoomValueLabel.textContent = zoomSlider.value + '%';
    
    drawAll();
});

// Event Hapus Foto
btnRemovePhoto.addEventListener('click', function() {
    uploadInput.value = '';
    state.hasUserImg = false;
    fileNameContainer.classList.add('hidden');
    toggleControls(false);
    canvasOverlay.classList.remove('opacity-0', 'pointer-events-none');
    statusBadge.textContent = "Menunggu Foto";
    statusBadge.className = "text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium";
    
    drawAll();
});

// Pembantu Enable / Disable Tombol Kontrol
function toggleControls(enable) {
    const elements = [zoomSlider, btnRotate, btnReset, btnDownload];
    elements.forEach(el => {
        if (enable) {
            el.removeAttribute('disabled');
        } else {
            el.setAttribute('disabled', 'true');
        }
    });
}

// --- INTERAKSI MOUSE & TOUCH DRAG (CANVAS POSITIONING) ---

// Mengonversi koordinat layar (Mouse/Touch) ke koordinat internal Canvas skala 1024x1024
function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    // Hitung posisi relatif di dalam elemen bounding box HTML (0 s/d 1)
    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;

    // Kalikan dengan skala dimensi internal canvas
    return {
        x: relativeX * canvas.width,
        y: relativeY * canvas.height
    };
}

function startDrag(e) {
    if (!state.hasUserImg) return;
    state.isDragging = true;
    const coords = getCanvasCoords(e);
    state.startX = coords.x - state.x;
    state.startY = coords.y - state.y;
}

function doDrag(e) {
    if (!state.isDragging || !state.hasUserImg) return;
    // Cegah scroll bawaan browser aktif saat sedang menyentuh/menggeser area canvas di mobile
    if (e.cancelable) e.preventDefault(); 
    
    const coords = getCanvasCoords(e);
    state.x = coords.x - state.startX;
    state.y = coords.y - state.startY;
    drawAll();
}

function stopDrag() {
    state.isDragging = false;
}

// Mouse Listeners
canvas.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', doDrag);
window.addEventListener('mouseup', stopDrag);

// Touch Listeners (Mobile Responsiveness)
canvas.addEventListener('touchstart', startDrag, { passive: false });
window.addEventListener('touchmove', doDrag, { passive: false });
window.addEventListener('touchend', stopDrag);


// --- DOWNLOAD ACTION ---
btnDownload.addEventListener('click', function() {
    if (!state.hasUserImg) return;
    
    // Generate data URL dari canvas dengan kualitas optimal (PNG)
    const dataURL = canvas.toDataURL('image/png');
    
    // Buat jangkar tautan unduhan buatan secara dinamis
    const link = document.createElement('a');
    link.download = 'twibbon_result_' + Date.now() + '.png';
    link.href = dataURL;
    
    // Picu perintah klik unduh sistem
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

