// --- Load Dynamic Content from URL ---
const urlParams = new URLSearchParams(window.location.search);
const encodedData = urlParams.get('data');

let cardData = {
    title: "Chúc Mừng Sinh Nhật! 🎂",
    message: "Chúc bạn tuổi mới luôn ngập tràn niềm vui, hạnh phúc và thành công.\nHãy luôn mỉm cười rạng rỡ nhé! ❤️",
    signature: "- Từ một người bạn",
    music_url: ""
};

if (encodedData) {
    try {
        const jsonString = decodeURIComponent(atob(encodedData).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const parsed = JSON.parse(jsonString);
        if (parsed.title) cardData.title = parsed.title;
        if (parsed.message) cardData.message = parsed.message;
        if (parsed.signature) cardData.signature = parsed.signature;
        if (parsed.music_url) cardData.music_url = parsed.music_url;
    } catch (e) {
        console.error("Lỗi giải mã nội dung URL:", e);
    }
}

// Khi thiệp đã ra khỏi phong bì, nó được đặt vào khung phẳng #card-stage với kích
// thước pixel cố định; cardBox giữ kích thước đó để canvas vẽ đúng 1:1 với màn hình.
let cardBox = null;

function drawCard() {
    const canvas = document.getElementById('card-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Thiết lập kích thước canvas fit với card-wrapper (90%), hoặc đúng khung phẳng
    const parent = canvas.parentElement;
    const cw = cardBox ? cardBox.w : parent.clientWidth * 0.9;
    const ch = cardBox ? cardBox.h : parent.clientHeight * 0.9;

    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';

    // Ở khung phẳng: canvas hiển thị đúng tỉ lệ 1:1 nên chỉ cần nhân devicePixelRatio,
    // không lấy mẫu dư (lấy mẫu dư rồi thu nhỏ lại còn làm chữ mềm đi).
    // Khi còn trong phong bì: đo bề ngang hiển thị thật để bù phần transform phóng to.
    let dpr;
    if (cardBox) {
        dpr = Math.min(window.devicePixelRatio || 1, 4);
    } else {
        const shown = canvas.getBoundingClientRect().width;
        const visualScale = shown > 0 ? Math.max(1, shown / cw) : 1;
        dpr = Math.min((window.devicePixelRatio || 1) * visualScale * 1.3, 4);
    }
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.scale(dpr, dpr);
    
    // TÍNH TOÁN TỶ LỆ (SCALE) CHUNG CHO TOÀN BỘ THÀNH PHẦN
    // Tấm thiệp gốc (Desktop) có kích thước cw = 540, ch = 360 (Tỷ lệ 3:2)
    const scale = cw / 540; 
    
    // Vẽ nền mờ Radial Gradient - Tone Ivory Parchment ấm áp, sang trọng
    const gradient = ctx.createRadialGradient(cw/2, ch/2, 0, cw/2, ch/2, cw * 0.75);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#fdfaf3');
    gradient.addColorStop(0.85, '#f7f0e1');
    gradient.addColorStop(1, '#f1e6d0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cw, ch);
    
    // Vẽ viền kép
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(15 * scale, 15 * scale, cw - (30 * scale), ch - (30 * scale));
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.strokeRect(20 * scale, 20 * scale, cw - (40 * scale), ch - (40 * scale));
    
    // Vẽ tiêu đề (Fixed top) - Dịch xuống để tạo khoảng đệm an toàn với mép trên
    const titleFontSize = 36 * scale;
    const titleY = 52 * scale; 
    ctx.font = `400 ${titleFontSize}px 'Great Vibes', cursive`;
    ctx.fillStyle = "#9b1c26";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cardData.title, cw/2, titleY);
    
    // Divider - Đi theo tiêu đề
    const divY = titleY + (24 * scale);
    const divW = 90 * scale;
    const divGrad = ctx.createLinearGradient(cw/2 - divW/2, 0, cw/2 + divW/2, 0);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.5, '#d4af37');
    divGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = divGrad;
    ctx.fillRect(cw/2 - divW/2, divY, divW, 1 * scale);
    
    ctx.save();
    ctx.translate(cw/2, divY);
    ctx.rotate(45 * Math.PI / 180);
    ctx.fillStyle = '#fbf8f1';
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1 * scale;
    ctx.fillRect(-3 * scale, -3 * scale, 6 * scale, 6 * scale);
    ctx.strokeRect(-3 * scale, -3 * scale, 6 * scale, 6 * scale);
    ctx.restore();
    
    // Vẽ chữ ký (Fixed bottom) - Kích thước nhỏ gọn, tinh tế
    const sigFontSize = 19 * scale;
    const sigY = ch - (42 * scale);
    ctx.font = `600 ${sigFontSize}px 'Dancing Script', cursive`;
    ctx.fillStyle = "#c59f2e";
    ctx.fillText(cardData.signature, cw/2, sigY);
    
    // THUẬT TOÁN TỰ ĐỘNG THU NHỎ CHỮ (AUTO-FIT) CHO NỘI DUNG
    // Vùng an toàn cho text: Dịch xuống theo tiêu đề và dịch lên theo chữ ký
    const messageStartY = divY + (16 * scale); 
    const messageEndY = sigY - (16 * scale);
    const maxH = messageEndY - messageStartY;
    const maxW = cw - (48 * scale); // Khoảng đệm an toàn 2 bên mép thiệp
    
    // Giới hạn cỡ chữ: Tránh font quá to khi ít text, và tránh font quá nhỏ
    let maxFontSize = 23 * scale;
    let minFontSize = 8.5 * scale;
    let fontSize = maxFontSize; 
    
    let lines = [];
    const paragraphs = cardData.message.split('\n');
    let totalHeight = 0;
    let lineHeight = 0;
    
    const getLines = (ctx, text, maxWidth) => {
        let words = text.split(" ");
        let pLines = [];
        let currentLine = words[0] || "";
        for (let i = 1; i < words.length; i++) {
            let word = words[i];
            let width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                pLines.push(currentLine);
                currentLine = word;
            }
        }
        pLines.push(currentLine);
        return pLines;
    };
    
    while(fontSize > minFontSize) { 
        ctx.font = `500 ${fontSize}px 'Dancing Script', cursive`;
        lineHeight = fontSize * 1.5;
        lines = [];
        totalHeight = 0;
        
        for (let p of paragraphs) {
            if (p.trim() === '') {
                totalHeight += lineHeight * 0.4; // Giảm spacing dòng trống
                lines.push({ text: '', isSpace: true });
                continue;
            }
            let pLines = getLines(ctx, p, maxW);
            pLines.forEach(l => lines.push({ text: l, isSpace: false }));
            totalHeight += pLines.length * lineHeight;
            totalHeight += lineHeight * 0.3; // Giảm spacing giữa các đoạn để tiết kiệm diện tích
        }
        totalHeight -= lineHeight * 0.3; 
        
        // Cố gắng hiển thị trọn vẹn trong vùng maxH
        if (totalHeight <= maxH) break; 
        fontSize -= 0.5; 
    }
    
    // Vẽ văn bản
    ctx.fillStyle = "#4a4a4a";
    // Canh giữa vùng không gian trống (messageStartY -> messageEndY)
    let drawY = messageStartY + (maxH - totalHeight) / 2 + (lineHeight / 2); 
    
    for (let l of lines) {
        if (l.isSpace) {
            drawY += lineHeight * 0.4;
        } else {
            ctx.fillText(l.text, cw/2, drawY);
            drawY += lineHeight;
        }
    }
}

// Chờ trình duyệt tải font xong rồi mới tiến hành vẽ canvas
document.fonts.ready.then(() => {
    drawCard();
});

function getAppSize() {
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isPortrait) {
        // Trong chế độ Portrait, app-root xoay 90deg nên chiều ngang thực tế là innerHeight, chiều dọc là innerWidth
        return { width: window.innerHeight, height: window.innerWidth, isPortrait: true };
    }
    return { width: window.innerWidth, height: window.innerHeight, isPortrait: false };
}

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (cardStage) layoutFlatCard();
        drawCard();
        resizeFx();
    }, 120);
});
// -------------------------------------

// Lấy các elements DOM
const instruction = document.getElementById('instruction');
const envelopeWrapper = document.getElementById('envelope-wrapper');
const envFlapTop = document.getElementById('env-flap-top');
const waxSeal = document.getElementById('wax-seal');
const waxHalo = document.getElementById('wax-halo');
const waxLeft = document.getElementById('wax-left');
const waxRight = document.getElementById('wax-right');
const cardWrapper = document.getElementById('card-wrapper');
const cardFloat = document.getElementById('card-float');
const cardGlow = document.getElementById('card-glow');
const groundShadow = document.getElementById('ground-shadow');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let isOpen = false;

/* =====================================================================
   AUDIO CONTROLLER (Nhạc nền & Điều khiển âm thanh)
===================================================================== */
const music_btn = document.getElementById('music-btn');
const bg_audio = document.getElementById('bg-audio');
const TARGET_AUDIO_VOLUME = 0.7;

let is_audio_initialized = false;
let is_audio_playing = false;

function playMusic() {
    if (!bg_audio || !cardData.music_url) return;

    if (!is_audio_initialized) {
        bg_audio.src = cardData.music_url;
        bg_audio.volume = 0;
        is_audio_initialized = true;
    }

    const play_promise = bg_audio.play();
    if (play_promise !== undefined) {
        play_promise.then(() => {
            is_audio_playing = true;
            if (music_btn) {
                music_btn.classList.remove('is-paused');
                music_btn.classList.add('is-playing');
            }
            gsap.to(bg_audio, {
                volume: TARGET_AUDIO_VOLUME,
                duration: 1.5,
                ease: 'power1.out',
                overwrite: 'auto'
            });
        }).catch(() => {
            // Trình duyệt chặn autoplay khi chưa có tương tác người dùng
            is_audio_playing = false;
            if (music_btn) {
                music_btn.classList.remove('is-playing');
                music_btn.classList.add('is-paused');
            }
            // Lắng nghe tương tác đầu tiên để kích hoạt phát nhạc
            const handleFirstInteraction = () => {
                playMusic();
            };
            window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
            window.addEventListener('keydown', handleFirstInteraction, { once: true });
        });
    }
}

function pauseMusic() {
    if (!bg_audio) return;
    gsap.to(bg_audio, {
        volume: 0,
        duration: 0.4,
        ease: 'power1.in',
        onComplete: () => {
            bg_audio.pause();
        }
    });
    is_audio_playing = false;
    if (music_btn) {
        music_btn.classList.remove('is-playing');
        music_btn.classList.add('is-paused');
    }
}

function toggleMusic() {
    if (is_audio_playing) {
        pauseMusic();
    } else {
        playMusic();
    }
}

function initAudio() {
    if (!cardData.music_url || !bg_audio || !music_btn) return;

    music_btn.classList.remove('hidden');

    music_btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMusic();
    });

    bg_audio.addEventListener('error', (err) => {
        console.warn("Không thể tải file âm thanh:", err);
        music_btn.classList.add('hidden');
    });

    // Thử kích hoạt phát nhạc ngay khi load
    playMusic();
}

initAudio();

/* =====================================================================
   LỚP HẠT LẤP LÁNH (Sparkle / Confetti Layer)
   Một canvas phủ toàn màn hình, chỉ chạy vòng lặp khi thực sự có hạt.
===================================================================== */
const fxCanvas = document.getElementById('fx-canvas');
const fxCtx = fxCanvas.getContext('2d');

function resizeFx() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const size = getAppSize();
    fxCanvas.width = size.width * d;
    fxCanvas.height = size.height * d;
    fxCanvas.style.width = size.width + 'px';
    fxCanvas.style.height = size.height + 'px';
    fxCtx.setTransform(d, 0, 0, d, 0, 0);
}
resizeFx();

const GOLD = ['#ffdf78', '#ffd24a', '#fff6da', '#e8c15a'];
const ROSE = ['#db2777', '#f9a8d4', '#ffb4d2'];
const WAX = ['#a01423', '#7a0a17', '#d4404c'];

let particles = [];
let fxRunning = false;
let ambientGlitter = false;
let ambientAnchor = { x: 0, y: 0, w: 0, h: 0 };
let frame = 0;

function emit(x, y, count, o = {}) {
    if (reduceMotion) return;
    const colors = o.colors || GOLD;
    for (let i = 0; i < count; i++) {
        const angle = o.angle !== undefined
            ? o.angle + (Math.random() - 0.5) * (o.spread || Math.PI * 2)
            : Math.random() * Math.PI * 2;
        const speed = (o.speed || 4) * (0.35 + Math.random() * 0.95);
        particles.push({
            x: x + (Math.random() - 0.5) * (o.jitter || 0),
            y: y + (Math.random() - 0.5) * (o.jitter || 0),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (o.lift || 0),
            gravity: o.gravity !== undefined ? o.gravity : 0.075,
            drag: 0.982,
            size: (o.size || 1) * (1.1 + Math.random() * 2.4),
            life: 0,
            ttl: (o.ttl || 90) * (0.6 + Math.random() * 0.7),
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.3,
            sway: Math.random() * Math.PI * 2,
            swayAmp: 0.15 + Math.random() * 0.5,
            color: colors[(Math.random() * colors.length) | 0],
            shape: Math.random() < (o.ribbon || 0) ? 'ribbon' : 'spark'
        });
    }
    startFx();
}

function startFx() {
    if (fxRunning) return;
    fxRunning = true;
    requestAnimationFrame(fxTick);
}

function drawSpark(p, alpha) {
    fxCtx.globalAlpha = alpha;
    fxCtx.fillStyle = p.color;
    fxCtx.beginPath();
    fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    fxCtx.fill();

    // Tia sáng hình chữ thập tạo cảm giác lấp lánh
    fxCtx.globalAlpha = alpha * 0.5;
    const r = p.size * 4;
    fxCtx.strokeStyle = p.color;
    fxCtx.lineWidth = Math.max(0.6, p.size * 0.35);
    fxCtx.beginPath();
    fxCtx.moveTo(p.x - r, p.y);
    fxCtx.lineTo(p.x + r, p.y);
    fxCtx.moveTo(p.x, p.y - r);
    fxCtx.lineTo(p.x, p.y + r);
    fxCtx.stroke();
}

function drawRibbon(p, alpha) {
    fxCtx.save();
    fxCtx.globalAlpha = alpha;
    fxCtx.translate(p.x, p.y);
    fxCtx.rotate(p.rot);
    // Bóp theo trục X mô phỏng mảnh giấy đang xoay trong không gian
    fxCtx.scale(Math.cos(p.life * 0.14) * 0.85 + 0.15, 1);
    fxCtx.fillStyle = p.color;
    fxCtx.fillRect(-p.size * 1.4, -p.size * 3, p.size * 2.8, p.size * 6);
    fxCtx.restore();
}

function fxTick() {
    frame++;
    const size = getAppSize();
    fxCtx.clearRect(0, 0, size.width, size.height);
    fxCtx.globalCompositeOperation = 'lighter';

    // Bụi vàng lơ lửng quanh thiệp sau khi mở
    if (ambientGlitter && frame % 6 === 0) {
        emit(
            ambientAnchor.x + (Math.random() - 0.5) * ambientAnchor.w,
            ambientAnchor.y + ambientAnchor.h * 0.5,
            1,
            { speed: 0.5, lift: 0.8, gravity: -0.012, ttl: 150, size: 0.55 }
        );
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.sway += 0.08;
        p.vx = p.vx * p.drag + Math.cos(p.sway) * p.swayAmp * 0.12;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        const t = p.life / p.ttl;
        const size = getAppSize();
        if (t >= 1 || p.y > size.height + 60) {
            particles.splice(i, 1);
            continue;
        }

        // Sáng bùng lúc mới sinh rồi tắt dần
        const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
        if (p.shape === 'ribbon') drawRibbon(p, alpha);
        else drawSpark(p, alpha);
    }

    fxCtx.globalAlpha = 1;
    fxCtx.globalCompositeOperation = 'source-over';

    if (particles.length || ambientGlitter) {
        requestAnimationFrame(fxTick);
    } else {
        fxRunning = false;
    }
}

function centerOf(el) {
    const size = getAppSize();
    const r = el.getBoundingClientRect();
    if (!size.isPortrait) {
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    }
    // Khi app-root xoay 90 độ (theo chiều kim đồng hồ):
    // Toạ độ màn hình (screenX, screenY) ánh xạ vào toạ độ cục bộ trong app-root:
    // localX = screenY, localY = window.innerWidth - screenX
    const screenCenterX = r.left + r.width / 2;
    const screenCenterY = r.top + r.height / 2;
    return {
        x: screenCenterY,
        y: window.innerWidth - screenCenterX,
        w: r.height,
        h: r.width
    };
}

/* =====================================================================
   TRẠNG THÁI BAN ĐẦU + NHỊP THỞ + PARALLAX THEO CHUỘT
===================================================================== */
// Không đặt transformPerspective ở đây: .scene đã có perspective, thêm nữa sẽ nhân chồng
// hai lần phối cảnh khiến thiệp phình to hơn tính toán khi tiến về phía trước.
gsap.set(envelopeWrapper, { rotationX: 6, rotationY: 0, y: 0 });
gsap.set(cardWrapper, { y: 0, z: 0, rotationZ: 0 });

// Phong bì trôi bồng bềnh rất nhẹ khi chưa mở
const idleFloat = gsap.to(envelopeWrapper, {
    y: -10,
    duration: 2.6,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    paused: reduceMotion
});

// Nghiêng theo con trỏ: trước khi mở thì nghiêng phong bì, sau khi mở thì nghiêng thiệp
const envRotX = gsap.quickTo(envelopeWrapper, 'rotationX', { duration: 0.8, ease: 'power2.out' });
const envRotY = gsap.quickTo(envelopeWrapper, 'rotationY', { duration: 0.8, ease: 'power2.out' });
const cardRotX = gsap.quickTo(cardFloat, 'rotationX', { duration: 0.8, ease: 'power2.out' });
const cardRotY = gsap.quickTo(cardFloat, 'rotationY', { duration: 0.8, ease: 'power2.out' });

let parallaxEnabled = !reduceMotion;
let parallaxTarget = 'envelope';

window.addEventListener('pointermove', (e) => {
    if (!parallaxEnabled) return;
    const size = getAppSize();
    let nx, ny;
    if (size.isPortrait) {
        // Trong hệ toạ độ xoay 90 độ theo chiều kim đồng hồ:
        // Chiều ngang ảo = e.clientY, Chiều dọc ảo = window.innerWidth - e.clientX
        const localX = e.clientY;
        const localY = window.innerWidth - e.clientX;
        nx = (localX / size.width - 0.5) * 2;
        ny = (localY / size.height - 0.5) * 2;
    } else {
        nx = (e.clientX / size.width - 0.5) * 2;
        ny = (e.clientY / size.height - 0.5) * 2;
    }

    if (parallaxTarget === 'envelope') {
        envRotY(nx * 10);
        envRotX(6 - ny * 8);
    } else if (parallaxTarget === 'card') {
        // Nghiêng 3D sinh động theo vị trí con trỏ chuột
        cardRotY(nx * 9);
        cardRotX(-ny * 7);
    }
    // 'none': đang chạy kịch bản mở, nhường quyền điều khiển cho timeline
}, { passive: true });

// Nhấn/thả tạo cảm giác chạm vào vật thể thật
envelopeWrapper.addEventListener('pointerenter', () => {
    if (isOpen) return;
    gsap.to(envelopeWrapper, { scale: 1.025, duration: 0.5, ease: 'power2.out' });
});
envelopeWrapper.addEventListener('pointerleave', () => {
    if (isOpen) return;
    gsap.to(envelopeWrapper, { scale: 1, duration: 0.5, ease: 'power2.out' });
});

/* =====================================================================
   BÀN GIAO THIỆP SANG KHUNG PHẲNG (để chữ nét tuyệt đối)
   Trong không gian 3D, tấm thiệp được phóng to bằng transform nên trình duyệt
   chỉ kéo giãn ảnh raster đã vẽ sẵn => chữ vỡ và mờ. Khi thiệp đã dừng lại, ta
   gỡ nó khỏi phong bì, đặt vào một khung fixed đúng kích thước pixel đang hiển
   thị và vẽ lại canvas ở đúng số pixel đó. Vì vị trí lấy từ chính bounding box
   hiện tại nên mắt không thấy bước chuyển này.
===================================================================== */
let cardStage = null;

function layoutFlatCard() {
    if (!cardStage) return;
    const aspect = 3 / 2; // tỷ lệ tấm thiệp, giống nhau ở cả mobile lẫn desktop
    const size = getAppSize();
    const wBudget = size.width * 0.85;
    const hBudget = size.height * 0.82;
    const w = Math.round(Math.min(wBudget, hBudget * aspect));
    const h = Math.round(w / aspect);

    cardStage.style.width = w + 'px';
    cardStage.style.height = h + 'px';
    cardStage.style.left = Math.round((size.width - w) / 2) + 'px';
    cardStage.style.top = Math.round((size.height - h) / 2) + 'px';
    cardBox = { w: w, h: h };
}

function settleCardFlat() {
    const size = getAppSize();
    const aspect = 3 / 2;
    const wBudget = size.width * 0.85;
    const hBudget = size.height * 0.82;
    const w = Math.round(Math.min(wBudget, hBudget * aspect));
    const h = Math.round(w / aspect);

    if (!cardStage) {
        cardStage = document.createElement('div');
        cardStage.id = 'card-stage';
        const root = document.getElementById('app-root') || document.body;
        root.appendChild(cardStage);
    }
    
    cardStage.style.width = w + 'px';
    cardStage.style.height = h + 'px';
    cardStage.style.left = Math.round((size.width - w) / 2) + 'px';
    cardStage.style.top = Math.round((size.height - h) / 2) + 'px';

    // Chuyển thiệp sang khung mới, xóa sạch transform 3D còn sót lại
    gsap.set(cardFloat, { clearProps: 'all' });
    cardStage.appendChild(cardFloat);
    cardWrapper.style.display = 'none';

    cardBox = { w: w, h: h };
    drawCard(); // vẽ lại ở đúng độ phân giải màn hình, tỉ lệ 1:1
}

/* =====================================================================
   KỊCH BẢN MỞ THIỆP
===================================================================== */
envelopeWrapper.addEventListener('click', openCard);

function openCard() {
    if (isOpen) return;
    isOpen = true;

    // Kích hoạt phát nhạc khi mở thiệp nếu chưa chạy
    if (cardData.music_url && !is_audio_playing) {
        playMusic();
    }

    envelopeWrapper.style.cursor = 'default';
    idleFloat.kill();
    // Trong lúc diễn hoạt, timeline giữ toàn quyền với rotationX/Y
    parallaxTarget = 'none';
    gsap.killTweensOf(envelopeWrapper); // dừng hẳn tween parallax đang chạy dở

    // Kích thước thật để tính quãng đường rút thiệp và cỡ phóng cuối cùng
    const size = getAppSize();
    const envW = envelopeWrapper.offsetWidth;
    const envH = envelopeWrapper.offsetHeight;
    const cardW = envW * 0.9;
    const cardH = envH * 0.9;

    // Thiệp tiến về phía người xem => perspective tự phóng to thêm, phải trừ vào scale
    const zOut = 90;
    const zGrowth = 1400 / (1400 - zOut);
    const finalScale = Math.min(
        (size.width * 0.85) / (cardW * zGrowth),
        (size.height * 0.82) / (cardH * zGrowth),
        1.5
    );

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    if (reduceMotion) tl.timeScale(3.5);

    // 1. Ẩn dòng chữ hướng dẫn
    tl.to(instruction, {
        opacity: 0,
        y: -24,
        scale: 0.94,
        duration: 0.45,
        ease: 'power2.in'
    }, 0);

    // 2. Phản hồi chạm: lún xuống rồi bật lên, ngửa nhẹ ra sau
    tl.to(envelopeWrapper, { scale: 0.982, duration: 0.13, ease: 'power2.in' }, 0);
    tl.to(envelopeWrapper, {
        scale: 1,
        y: -22,
        rotationX: 11,
        duration: 0.75,
        ease: 'back.out(1.4)'
    }, 0.13);
    tl.to(groundShadow, { scale: 0.86, opacity: 0.65, duration: 0.75 }, 0.13);

    // 3. Dấu sáp nứt đôi rồi rơi xuống, kèm bụi sáp bắn ra
    tl.to(waxHalo, { opacity: 0, scale: 1.8, duration: 0.35, ease: 'power2.in' }, 0.3);
    tl.to([waxLeft, waxRight], { scale: 1.08, duration: 0.16, ease: 'power2.out' }, 0.34);
    tl.add(() => {
        const c = centerOf(waxSeal);
        emit(c.x, c.y, 16, { colors: WAX, speed: 3.4, lift: 1.2, ttl: 55, size: 0.7 });
        emit(c.x, c.y, 10, { colors: GOLD, speed: 2.6, lift: 1.6, ttl: 70, size: 0.6 });
    }, 0.5);
    tl.to(waxLeft, {
        x: -envW * 0.11, y: envH * 0.30, rotation: -78, opacity: 0,
        duration: 0.75, ease: 'power1.in'
    }, 0.5);
    tl.to(waxRight, {
        x: envW * 0.12, y: envH * 0.34, rotation: 86, opacity: 0,
        duration: 0.8, ease: 'power1.in'
    }, 0.52);

    // 4. Nắp phong bì bật mở: nhanh lúc đầu, chậm dần và lắc nhẹ khi chạm giới hạn
    tl.to(envFlapTop, {
        rotationX: 176,
        z: -70, // lùi sâu để nắp lật lên không bao giờ cắt qua tấm thiệp
        duration: 0.95,
        ease: 'power2.inOut'
    }, 0.82);
    tl.to(envFlapTop, {
        rotationX: 169,
        duration: 0.5,
        ease: 'elastic.out(1, 0.55)'
    }, 1.77);

    // 5. Rút thiệp lên: chậm rãi, hơi nghiêng và rung nhẹ như tay người kéo.
    // Quãng rút bị chặn lại theo chiều cao màn hình để mép trên thiệp không bao giờ bị cắt.
    const maxLift = size.height / 2 - cardH / 2 - 18;
    const lift = Math.max(envH * 0.25, Math.min(envH * 0.55, maxLift));
    tl.to(cardWrapper, {
        y: -lift,
        rotationZ: 1.4,
        duration: 1.25,
        ease: 'power2.out'
    }, 1.35);
    tl.to(cardGlow, { opacity: 0.55, duration: 1.0 }, 1.5);
    // Trả phong bì về đúng trục nhìn thẳng, xóa mọi độ nghiêng parallax còn sót lại
    tl.to(envelopeWrapper, { rotationX: 6, rotationY: 0, duration: 1.0 }, 1.5);

    // 6. Thiệp bay tới trước mặt người xem và dừng ở giữa màn hình
    tl.to(cardWrapper, {
        y: -envH * 0.03,
        z: zOut,
        rotationZ: 0,
        scale: finalScale,
        duration: 1.6,
        ease: 'power3.out'
    }, 2.5);
    tl.to(cardGlow, { opacity: 0.85, duration: 1.2 }, 2.5);
    // Ngả phong bì về đúng mặt phẳng màn hình: thiệp lúc dừng là hình chữ nhật phẳng,
    // nhờ vậy bước bàn giao sang khung phẳng bên dưới khớp từng pixel, không bị nhảy.
    tl.to(envelopeWrapper, { rotationX: 0, duration: 1.6, ease: 'power3.out' }, 2.5);

    // 7. Vỏ phong bì lùi lại, chìm xuống và tan biến
    const envParts = document.querySelectorAll('.env-back, .env-front, .env-flap-top');
    tl.to(envParts, {
        y: size.height * 0.55,
        scale: 0.9,
        opacity: 0,
        duration: 1.25,
        ease: 'power2.in',
        onComplete: () => {
            // Gỡ hẳn khỏi render pipeline: tránh lỗi vài trình duyệt vẫn xếp lớp 3D đè lên chữ
            envParts.forEach(el => (el.style.display = 'none'));
        }
    }, 2.5);
    tl.to(groundShadow, { opacity: 0, scale: 0.6, duration: 1.0, ease: 'power2.in' }, 2.5);

    // 8. Pháo giấy bung ra đúng khoảnh khắc thiệp lộ diện
    tl.add(() => {
        const c = centerOf(cardWrapper);
        ambientAnchor = c;
        emit(c.x, c.y + c.h * 0.15, 46, { colors: GOLD, speed: 9, lift: 3, ttl: 110, size: 1.1, ribbon: 0.45, jitter: c.w * 0.5 });
        emit(c.x, c.y + c.h * 0.15, 26, { colors: ROSE, speed: 7.5, lift: 2.4, ttl: 100, size: 1.0, ribbon: 0.6, jitter: c.w * 0.5 });
    }, 2.75);

    // 9. Trạng thái nghỉ: chuyển sang khung phẳng và kích hoạt chế độ nghiêng 3D theo chuột
    tl.add(() => {
        settleCardFlat();
        parallaxTarget = 'card'; // Bật hiệu ứng nghiêng thiệp theo chuột
        cardRotX(0);
        cardRotY(0);
        ambientAnchor = centerOf(cardStage);
        if (!reduceMotion) {
            ambientGlitter = true;
            startFx();
            gsap.to(cardGlow, {
                opacity: 0.6,
                scale: 1.05,
                duration: 3.2,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1
            });
        }
    }, 4.0);
}
