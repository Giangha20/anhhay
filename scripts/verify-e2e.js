/**
 * PhotoWeb - Script kiểm thử toàn diện thực tế End-to-End (E2E) qua HTTP
 */
const sharp = require('sharp');

const BASE_URL = 'http://localhost:3000';

async function runE2ETests() {
  console.log('\n======================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ THỰC TẾ E2E TOÀN BỘ CHỨC NĂNG     ');
  console.log('======================================================\n');

  let sessionCookie = '';
  let createdCategoryId = '';
  let uploadedImageId = '';
  let uploadedFilename = '';

  // 1. Kiểm tra trang chủ công khai
  console.log('1. Kiểm tra trang chủ công khai (Public Homepage)...');
  const homeRes = await fetch(`${BASE_URL}/`);
  if (homeRes.status !== 200) throw new Error(`Trang chủ trả về mã lỗi: ${homeRes.status}`);
  console.log('  ✔ [PASS] Trang chủ phản hồi 200 OK');

  // 2. Kiểm tra API Public Gallery
  console.log('2. Kiểm tra API danh sách ảnh công khai (/api/public/gallery)...');
  const galleryRes = await fetch(`${BASE_URL}/api/public/gallery`);
  const galleryData = await galleryRes.json();
  if (!galleryData.images || !Array.isArray(galleryData.images)) {
    throw new Error('API Gallery không trả về mảng ảnh');
  }
  console.log(`  ✔ [PASS] API Gallery hoạt động tốt (Hiện có ${galleryData.images.length} ảnh)`);

  // 3. Đăng nhập Admin
  console.log('3. Đăng nhập Admin (/api/auth/login)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'giangtptq',
      password: 'Giangha@2k5',
    }),
  });

  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.success) {
    throw new Error(`Đăng nhập thất bại: ${loginData.error || loginRes.status}`);
  }

  // Trích xuất cookie
  const setCookieHeader = loginRes.headers.get('set-cookie');
  if (!setCookieHeader) throw new Error('Không nhận được cookie đăng nhập');
  sessionCookie = setCookieHeader.split(';')[0];
  console.log(`  ✔ [PASS] Đăng nhập thành công với tài khoản 'giangtptq' (Cookie set)`);

  // 4. Kiểm tra xác thực phiên (/api/auth/me)
  console.log('4. Kiểm tra phiên đăng nhập (/api/auth/me)...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: sessionCookie },
  });
  const meData = await meRes.json();
  if (!meData.authenticated || meData.admin.username !== 'giangtptq') {
    throw new Error('Xác thực phiên qua cookie không hợp lệ');
  }
  console.log('  ✔ [PASS] Phiên đăng nhập hợp lệ và xác thực quyền admin thành công');

  // 5. Thống kê hệ thống (/api/admin/stats)
  console.log('5. Kiểm tra thống kê hệ thống (/api/admin/stats)...');
  const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Cookie: sessionCookie },
  });
  const statsData = await statsRes.json();
  if (!statsData.stats || typeof statsData.stats.photosCount !== 'number') {
    throw new Error('API thống kê không hợp lệ: ' + JSON.stringify(statsData));
  }
  console.log(`  ✔ [PASS] Thống kê hệ thống: ${statsData.stats.photosCount} ảnh, ${statsData.stats.categoriesCount} danh mục`);

  // 6. Tạo danh mục mới (/api/admin/categories)
  console.log('6. Tạo danh mục thử nghiệm (/api/admin/categories)...');
  const testCatSlug = `cat-test-e2e-${Date.now()}`;
  const catCreateRes = await fetch(`${BASE_URL}/api/admin/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      name: 'Danh Mục Thử Nghiệm E2E',
      slug: testCatSlug,
      description: 'Danh mục được tạo tự động bởi quy trình kiểm thử',
      displayOrder: 99,
      isVisible: true,
    }),
  });
  const catCreateData = await catCreateRes.json();
  if (!catCreateRes.ok || !catCreateData.category) {
    throw new Error(`Tạo danh mục thất bại: ${JSON.stringify(catCreateData)}`);
  }
  createdCategoryId = catCreateData.category.id;
  console.log(`  ✔ [PASS] Tạo danh mục thành công (ID: ${createdCategoryId})`);

  // 7. Tạo ảnh mẫu bằng Sharp và tải lên (Upload)
  console.log('7. Tạo ảnh thực tế và tải lên máy chủ (/api/admin/images)...');
  const sampleImageBuffer = await sharp({
    create: {
      width: 1000,
      height: 700,
      channels: 3,
      background: { r: 16, g: 185, b: 129 },
    },
  })
    .png()
    .toBuffer();

  const formData = new FormData();
  const fileBlob = new Blob([sampleImageBuffer], { type: 'image/png' });
  formData.append('files', fileBlob, 'e2e_test_artwork.png');
  formData.append('title', 'Tác Phẩm Kiểm Thử E2E');
  formData.append('description', 'Ảnh tải lên tự động để kiểm tra toàn bộ chu trình upload & sharp');
  formData.append('categoryId', createdCategoryId);

  const uploadRes = await fetch(`${BASE_URL}/api/admin/images`, {
    method: 'POST',
    headers: { Cookie: sessionCookie },
    body: formData,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.success || !uploadData.images || uploadData.images.length === 0) {
    throw new Error(`Tải ảnh thất bại: ${JSON.stringify(uploadData)}`);
  }

  const uploadedRecord = uploadData.images[0];
  uploadedImageId = uploadedRecord.id;
  uploadedFilename = uploadedRecord.filename;
  console.log(`  ✔ [PASS] Tải ảnh lên thành công!`);
  console.log(`    - ID ảnh: ${uploadedImageId}`);
  console.log(`    - Tên tệp đã lưu: ${uploadedFilename}`);
  console.log(`    - Kích thước: ${uploadedRecord.width}x${uploadedRecord.height} (${uploadedRecord.format})`);

  // 8. Kiểm tra phục vụ ảnh gốc (/api/images/[filename])
  console.log('8. Kiểm tra phục vụ tệp ảnh gốc (/api/images/[filename])...');
  const imgFetchRes = await fetch(`${BASE_URL}/api/images/${uploadedFilename}`);
  if (imgFetchRes.status !== 200) {
    throw new Error(`Phục vụ ảnh gốc thất bại: mã ${imgFetchRes.status}`);
  }
  const imgContentType = imgFetchRes.headers.get('content-type');
  console.log(`  ✔ [PASS] Ảnh gốc phản hồi 200 OK (Content-Type: ${imgContentType})`);

  // 9. Kiểm tra phục vụ thumbnail (/api/images/[filename]?thumb=1)
  console.log('9. Kiểm tra phục vụ ảnh thu nhỏ WebP (/api/images/[filename]?thumb=1)...');
  const thumbFetchRes = await fetch(`${BASE_URL}/api/images/${uploadedFilename}?thumb=1`);
  if (thumbFetchRes.status !== 200) {
    throw new Error(`Phục vụ ảnh thumbnail thất bại: mã ${thumbFetchRes.status}`);
  }
  const thumbContentType = thumbFetchRes.headers.get('content-type');
  console.log(`  ✔ [PASS] Ảnh thumbnail phản hồi 200 OK (Content-Type: ${thumbContentType})`);

  // 10. Kiểm tra xuất hiện trên thư viện công khai (Public Gallery)
  console.log('10. Kiểm tra ảnh mới xuất hiện trên Public Gallery...');
  const publicCheckRes = await fetch(`${BASE_URL}/api/public/gallery?search=Tác Phẩm Kiểm Thử`);
  const publicCheckData = await publicCheckRes.json();
  const foundInPublic = publicCheckData.images.some((img) => img.id === uploadedImageId);
  if (!foundInPublic) {
    throw new Error('Ảnh vừa tải lên không tìm thấy trong thư viện công khai!');
  }
  console.log('  ✔ [PASS] Ảnh xuất hiện chuẩn xác trên Thư viện ảnh công khai cho người xem');

  // 11. Chỉnh sửa thông tin ảnh (/api/admin/images/[id])
  console.log('11. Cập nhật thông tin ảnh (/api/admin/images/[id])...');
  const updateRes = await fetch(`${BASE_URL}/api/admin/images/${uploadedImageId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      title: 'Tác Phẩm Kiểm Thử E2E (Đã chỉnh sửa)',
      description: 'Mô tả mới đã được cập nhật thành công',
      categoryId: createdCategoryId,
    }),
  });
  const updateData = await updateRes.json();
  if (!updateRes.ok || updateData.image?.title !== 'Tác Phẩm Kiểm Thử E2E (Đã chỉnh sửa)') {
    throw new Error(`Cập nhật ảnh thất bại: ${JSON.stringify(updateData)}`);
  }
  console.log('  ✔ [PASS] Cập nhật tiêu đề và mô tả ảnh thành công');

  // 12. Kiểm tra Cài đặt Website (/api/admin/settings)
  const currentSettingsRes = await fetch(`${BASE_URL}/api/public/settings`);
  const currentSettingsData = await currentSettingsRes.json();
  const currentSettings = currentSettingsData.settings;

  const settingsUpdateRes = await fetch(`${BASE_URL}/api/admin/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      ...currentSettings,
      siteName: 'Ảnh Hay - Thư Viện Nghệ Thuật',
    }),
  });
  if (!settingsUpdateRes.ok) {
    const errData = await settingsUpdateRes.json();
    throw new Error(`Cập nhật cài đặt website thất bại: ${JSON.stringify(errData)}`);
  }
  console.log('  ✔ [PASS] Cập nhật Cài đặt Website thành công');

  // 13. Xóa ảnh thử nghiệm (/api/admin/images/[id])
  console.log('13. Xóa ảnh và dọn dẹp tệp (/api/admin/images/[id])...');
  const deleteRes = await fetch(`${BASE_URL}/api/admin/images/${uploadedImageId}`, {
    method: 'DELETE',
    headers: { Cookie: sessionCookie },
  });
  if (!deleteRes.ok) {
    throw new Error('Xóa ảnh thất bại');
  }
  // Kiểm tra lại tệp đã bị xóa khỏi API
  const reCheckImg = await fetch(`${BASE_URL}/api/images/${uploadedFilename}`);
  if (reCheckImg.status !== 404) {
    throw new Error('Tệp ảnh vẫn còn tồn tại sau lệnh xóa!');
  }
  console.log('  ✔ [PASS] Xóa bản ghi và dọn dẹp sạch tệp ảnh khỏi ổ lưu trữ thành công (404 verified)');

  // 14. Xóa danh mục thử nghiệm (/api/admin/categories/[id])
  console.log('14. Xóa danh mục thử nghiệm (/api/admin/categories/[id])...');
  const deleteCatRes = await fetch(`${BASE_URL}/api/admin/categories/${createdCategoryId}`, {
    method: 'DELETE',
    headers: { Cookie: sessionCookie },
  });
  if (!deleteCatRes.ok) {
    throw new Error('Xóa danh mục thất bại');
  }
  console.log('  ✔ [PASS] Xóa danh mục thử nghiệm thành công');

  // 15. Đăng xuất (/api/auth/logout)
  console.log('15. Đăng xuất Admin (/api/auth/logout)...');
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: sessionCookie },
  });
  if (!logoutRes.ok) throw new Error('Đăng xuất thất bại');
  console.log('  ✔ [PASS] Đăng xuất thành công, phiên bị thu hồi');

  console.log('\n======================================================');
  console.log('   TẤT CẢ 15/15 CHỨC NĂNG E2E HOẠT ĐỘNG HOÀN HẢO!     ');
  console.log('======================================================\n');
}

runE2ETests().catch((err) => {
  console.error('\n❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ E2E:', err);
  process.exit(1);
});
