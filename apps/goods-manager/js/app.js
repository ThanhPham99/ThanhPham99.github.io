/**
 * Goods Manager - Vanilla JavaScript (Tailwind Edition)
 */

// --- Constants & State ---
const STORAGE_KEY = 'goods_manager_data_vanilla';
let products = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let current_view = 'dashboard';
let sort_field = 'created_at';
let sort_order = 'desc';
let editing_product_id = null;
let delete_target_id = null;
let stream = null;
let current_camera_mode = 'environment'; // environment (back) or user (front)
let is_torch_on = false;

// --- DOM Elements ---
const views = {
  dashboard: document.getElementById('dashboard-view'),
  form: document.getElementById('form-view')
};

const product_grid = document.getElementById('product-grid');
const search_input = document.getElementById('search-input');
const product_form = document.getElementById('product-form');
const image_input = document.getElementById('image-input');
const image_preview_container = document.getElementById('image-preview-container');
const image_preview_img = document.getElementById('image-preview-img');
const preview_placeholder = document.getElementById('preview-placeholder');

const video = document.getElementById('video');
const camera_section = document.getElementById('camera-section');
const capture_canvas = document.getElementById('capture-canvas');

const modal = document.getElementById('modal-container');
const modal_message = document.getElementById('modal-message');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  initIcons();
  setupEventListeners();
});

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// --- Navigation ---
function switchView(view_name, editing_id = null) {
  current_view = view_name;
  editing_product_id = editing_id;

  if (view_name === 'dashboard') {
    stopCamera();
  }

  Object.keys(views).forEach(key => {
    const view = views[key];
    if (key === view_name) {
      view.classList.add('active');
      view.classList.remove('hidden', 'opacity-0');
    } else {
      view.classList.remove('active');
      view.classList.add('hidden', 'opacity-0');
    }
  });

  if (view_name === 'form') {
    setupForm(editing_id);
  } else {
    renderProducts();
  }
  initIcons();
}

// --- Camera Logic ---
async function startCamera(mode = current_camera_mode) {
  stopCamera(); // Stop existing stream if any
  current_camera_mode = mode;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: mode,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });
    video.srcObject = stream;
    camera_section.classList.remove('hidden');
    image_preview_container.classList.add('hidden');

    // Check for torch support
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    const torch_btn = document.getElementById('btn-toggle-torch');

    if (capabilities.torch) {
      torch_btn.classList.remove('hidden');
      is_torch_on = false;
      torch_btn.classList.remove('text-yellow-400');
    } else {
      torch_btn.classList.add('hidden');
    }
  } catch (err) {
    console.error("Camera access error detail:", err);
    let error_msg = "Không thể khởi động camera. ";
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      error_msg += "Lưu ý: Camera chỉ hoạt động trên kết nối HTTPS hoặc localhost.";
    } else if (err.name === 'NotAllowedError') {
      error_msg += "Vui lòng cấp quyền truy cập camera trong cài đặt trình duyệt.";
    } else if (err.name === 'NotFoundError') {
      error_msg += "Không tìm thấy thiết bị camera nào.";
    } else {
      error_msg += "Lỗi: " + err.message;
    }
    alert(error_msg);
  }
}

async function switchCamera() {
  is_torch_on = false;
  if (navigator.vibrate) navigator.vibrate(20);
  const new_mode = current_camera_mode === 'environment' ? 'user' : 'environment';
  await startCamera(new_mode);
}

async function toggleTorch() {
  if (!stream) return;
  const track = stream.getVideoTracks()[0];
  try {
    is_torch_on = !is_torch_on;
    await track.applyConstraints({
      advanced: [{ torch: is_torch_on }]
    });
    const torch_btn = document.getElementById('btn-toggle-torch');
    if (is_torch_on) {
      torch_btn.classList.add('text-yellow-400');
    } else {
      torch_btn.classList.remove('text-yellow-400');
    }
  } catch (err) {
    console.error("Torch error:", err);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  is_torch_on = false;
  camera_section.classList.add('hidden');
  image_preview_container.classList.remove('hidden');
}

async function capturePhoto() {
  // Shutter Flash Effect
  const flash = document.getElementById('camera-flash');
  flash.style.opacity = '1';
  setTimeout(() => { flash.style.opacity = '0'; }, 150);

  // Haptic feedback
  if (navigator.vibrate) navigator.vibrate(50);

  const context = capture_canvas.getContext('2d');

  // Square capture logic
  const video_width = video.videoWidth;
  const video_height = video.videoHeight;
  const size = Math.min(video_width, video_height);
  const sx = (video_width - size) / 2;
  const sy = (video_height - size) / 2;

  // Fix size at 320x320 as requested
  capture_canvas.width = 320;
  capture_canvas.height = 320;

  // Flip if front camera
  if (current_camera_mode === 'user') {
    context.translate(320, 0);
    context.scale(-1, 1);
  }

  // Draw ONLY the center square from video to canvas
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);

  const data_url = capture_canvas.toDataURL('image/jpeg', 0.9);
  updatePreview(data_url);
  stopCamera();
}

function updatePreview(base64) {
  image_preview_img.src = base64;
  image_preview_img.classList.remove('hidden');
  preview_placeholder.classList.add('hidden');
  // For Tailwind, we don't strictly need 'has-image' class for style but keeping it for logic if needed
  image_preview_container.classList.add('border-solid', 'bg-white');
}

// --- Image Processing ---
async function resizeImage(base64Str, target_size = 320) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = target_size;
      canvas.height = target_size;
      const ctx = canvas.getContext('2d');

      // Square cropping logic
      const min_dim = Math.min(img.width, img.height);
      const sx = (img.width - min_dim) / 2;
      const sy = (img.height - min_dim) / 2;

      // Better quality drawing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw centered square and resize
      ctx.drawImage(img, sx, sy, min_dim, min_dim, 0, 0, target_size, target_size);
      resolve(canvas.toDataURL('image/jpeg', 0.8)); // Balanced quality and size
    };
  });
}

// --- Utils ---
function removeDiacritics(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function openImageModal(src) {
  const modal = document.getElementById('image-modal');
  const modal_img = document.getElementById('modal-full-image');
  modal_img.src = src;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

window.closeImageModal = () => {
  const modal = document.getElementById('image-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function renderProducts() {
  const query = removeDiacritics(search_input.value);
  const filtered = products.filter(p =>
    removeDiacritics(p.name).includes(query)
  );

  // Sorting logic
  filtered.sort((a, b) => {
    let val_a = a[sort_field];
    let val_b = b[sort_field];

    // Handle string comparison for names
    if (sort_field === 'name') {
      val_a = removeDiacritics(val_a || '');
      val_b = removeDiacritics(val_b || '');
      return sort_order === 'asc' ? val_a.localeCompare(val_b) : val_b.localeCompare(val_a);
    }

    // Default numeric/date comparison
    val_a = parseFloat(val_a) || 0;
    val_b = parseFloat(val_b) || 0;
    return sort_order === 'asc' ? val_a - val_b : val_b - val_a;
  });

  if (filtered.length === 0) {
    product_grid.innerHTML = `
            <div class="col-span-full py-20 text-center animate-fade-in-up">
                <div class="inline-flex items-center justify-center w-24 h-24 bg-slate-100 rounded-full mb-6">
                    <i data-lucide="package-search" class="w-12 h-12 text-slate-400"></i>
                </div>
                <h3 class="text-2xl font-bold text-slate-900 mb-2">Không có sản phẩm nào</h3>
                <p class="text-slate-500 font-medium">Bắt đầu bằng cách thêm sản phẩm mới vào kho hàng của bạn.</p>
            </div>
        `;
  } else {
    // Changed to flex-col with gap for List View
    product_grid.className = "flex flex-col gap-6";
    product_grid.innerHTML = filtered.map(product => `
            <article class="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/60 overflow-hidden flex flex-col sm:flex-row group hover:shadow-2xl hover:shadow-brand-500/10 hover:-translate-x-1 sm:hover:-translate-x-2 transition-all duration-300">
                <div class="w-full max-w-[320px] mx-auto sm:max-w-none sm:w-48 md:w-64 aspect-square bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden border-b sm:border-b-0 sm:border-r border-slate-100 p-2 cursor-pointer relative" onclick="openImageModal('${product.image_base64}')">
                    <img src="${product.image_base64}" alt="${product.name}" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500">
                    <div class="absolute inset-0 bg-brand-600/0 group-hover:bg-brand-600/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <i data-lucide="zoom-in" class="w-8 h-8 text-white"></i>
                    </div>
                </div>
                <div class="p-6 sm:p-8 flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div class="flex-grow space-y-2">
                        <div class="flex flex-wrap items-baseline gap-x-4">
                            <h3 class="text-2xl font-extrabold text-slate-900 line-clamp-1">${product.name}</h3>
                            <p class="text-brand-600 font-black text-xl">${formatCurrency(product.price || 0)}</p>
                        </div>
                        <p class="text-slate-500 font-medium line-clamp-2 max-w-2xl">${product.notes || 'Không có mô tả chi tiết.'}</p>
                    </div>
                    <div class="flex gap-3 sm:flex-shrink-0">
                        <button class="flex-grow sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-600 font-bold rounded-xl transition-colors border border-slate-100" onclick="editProduct('${product.id}')">
                            <i data-lucide="edit-3" class="w-4 h-4"></i> Sửa
                        </button>
                        <button class="w-12 h-12 flex items-center justify-center bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all" onclick="confirmDelete('${product.id}', '${product.name.replace(/'/g, "\\'")}')">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
            </article>
        `).join('');
  }
  initIcons();
}

function setupForm(id) {
  const title_el = document.getElementById('form-title');
  const submit_text_el = document.getElementById('submit-btn-text');

  product_form.reset();
  image_preview_img.src = '';
  image_preview_img.classList.add('hidden');
  preview_placeholder.classList.remove('hidden');
  image_preview_container.classList.remove('border-solid', 'bg-white');

  if (id) {
    const product = products.find(p => p.id === id);
    if (product) {
      title_el.textContent = 'Cập nhật hàng hóa';
      submit_text_el.textContent = 'Cập nhật ngay';
      document.getElementById('product-id').value = product.id;
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-price').value = product.price || '';
      document.getElementById('product-notes').value = product.notes;
      updatePreview(product.image_base64);
    }
  } else {
    title_el.textContent = 'Thêm hàng hóa mới';
    submit_text_el.textContent = 'Lưu vào kho';
    document.getElementById('product-id').value = '';
  }
}

// --- Event Handlers ---
function setupEventListeners() {
  document.getElementById('btn-add-product').addEventListener('click', () => switchView('form'));
  search_input.addEventListener('input', renderProducts);

  // Sort Chips Logic
  document.querySelectorAll('.sort-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const field = chip.getAttribute('data-sort-field');
      sort_field = field;

      // UI Update
      document.querySelectorAll('.sort-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      renderProducts();
    });
  });

  // Toggle Order Logic
  document.getElementById('btn-toggle-order').addEventListener('click', () => {
    sort_order = sort_order === 'asc' ? 'desc' : 'asc';

    // Icon Update
    const icon = document.getElementById('sort-order-icon');
    if (sort_order === 'asc') {
      icon.setAttribute('data-lucide', 'arrow-up-narrow-wide');
    } else {
      icon.setAttribute('data-lucide', 'arrow-down-narrow-wide');
    }

    initIcons();
    renderProducts();
  });

  document.getElementById('btn-back').addEventListener('click', () => switchView('dashboard'));
  document.getElementById('btn-cancel').addEventListener('click', () => switchView('dashboard'));

  document.getElementById('btn-start-camera').addEventListener('click', () => startCamera('environment'));
  document.getElementById('btn-switch-camera').addEventListener('click', switchCamera);
  document.getElementById('btn-toggle-torch').addEventListener('click', toggleTorch);
  document.getElementById('btn-stop-camera').addEventListener('click', stopCamera);
  document.getElementById('btn-capture').addEventListener('click', capturePhoto);
  document.getElementById('btn-file-trigger').addEventListener('click', () => image_input.click());

  // Double tap to switch camera
  let last_tap = 0;
  video.addEventListener('touchstart', (e) => {
    const now = Date.now();
    if (now - last_tap < 300) {
      switchCamera();
    }
    last_tap = now;
  });

  image_preview_container.addEventListener('click', () => {
    if (image_preview_img.classList.contains('hidden')) {
      startCamera();
    } else {
      image_input.click();
    }
  });

  image_input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const resized = await resizeImage(reader.result, 320);
        updatePreview(resized);
      };
      reader.readAsDataURL(file);
    }
  });

  product_form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value.trim();
    const price = parseInt(document.getElementById('product-price').value) || 0;
    const notes = document.getElementById('product-notes').value.trim();
    const image_base64 = image_preview_img.src;

    if (!name || !image_base64 || image_preview_img.classList.contains('hidden')) {
      alert('Vui lòng hoàn thiện tên và ảnh sản phẩm.');
      return;
    }

    if (id) {
      const index = products.findIndex(p => p.id === id);
      if (index !== -1) {
        products[index] = { ...products[index], name, price, notes, image_base64 };
      }
    } else {
      const new_product = {
        id: Date.now().toString(),
        name,
        price,
        notes,
        image_base64,
        created_at: Date.now()
      };
      products.push(new_product);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    switchView('dashboard');
  });

  // Export Data
  document.getElementById('btn-export').addEventListener('click', () => {
    if (products.length === 0) {
      alert('Không có dữ liệu để xuất.');
      return;
    }
    const data = JSON.stringify(products, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goods-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Import Data
  const import_input = document.getElementById('import-input');
  document.getElementById('btn-import-trigger').addEventListener('click', () => import_input.click());

  import_input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported_data = JSON.parse(event.target.result);
        if (Array.isArray(imported_data)) {
          if (confirm(`Bạn có chắc muốn nhập ${imported_data.length} sản phẩm? Dữ liệu hiện tại sẽ bị thay thế.`)) {
            products = imported_data;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
            renderProducts();
            alert('Nhập dữ liệu thành công!');
          }
        } else {
          alert('Định dạng file không hợp lệ.');
        }
      } catch (err) {
        alert('Lỗi khi đọc file JSON.');
        console.error(err);
      }
      import_input.value = ''; // Reset input
    };
    reader.readAsText(file);
  });

  // Confirm Delete Modal
  document.getElementById('btn-modal-cancel').addEventListener('click', () => {
    modal.classList.add('hidden');
    delete_target_id = null;
  });

  // Image Preview Modal
  document.getElementById('image-modal-bg').addEventListener('click', window.closeImageModal);
  document.getElementById('btn-close-image-modal').addEventListener('click', window.closeImageModal);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeImageModal();
      modal.classList.add('hidden'); // Also close the delete modal if open
    }
  });

  document.getElementById('btn-modal-confirm').addEventListener('click', () => {
    if (delete_target_id) {
      products = products.filter(p => p.id !== delete_target_id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      renderProducts();
      modal.classList.add('hidden');
      delete_target_id = null;
    }
  });
}

window.editProduct = (id) => switchView('form', id);
window.confirmDelete = (id, name) => {
  delete_target_id = id;
  modal_message.textContent = `Bạn có chắc chắn muốn xóa sản phẩm "${name}"? Hành động này không thể hoàn tác.`;
  modal.classList.remove('hidden');
};
