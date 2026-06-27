import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 1. Tải cấu hình từ .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const githubToken = process.env.GITHUB_ACCESS_TOKEN?.trim();
const githubRepo = "icecubesssss/ttdailytasks";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Lỗi: Thiếu VITE_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong file .env");
  process.exit(1);
}

if (!githubToken) {
  console.error("❌ Lỗi: Thiếu GITHUB_ACCESS_TOKEN trong file .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function release() {
  try {
    console.log("🚀 Bắt đầu quy trình Release Tự động (với GitHub Releases)...");

    // 2. Tăng version trong package.json
    console.log("\n📦 Đang tăng phiên bản (Patch)...");
    execSync('npm version patch --no-git-tag-version', { stdio: 'inherit' });
    
    // Đọc version mới
    const pkgPath = path.resolve(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const newVersion = pkg.version;
    const tagName = `v${newVersion}`;
    console.log(`✅ Đã cập nhật lên phiên bản: ${tagName}`);

    // 3. Build DMG
    console.log(`\n🔨 Đang tiến hành đóng gói (Build) bản ${tagName}...`);
    execSync('npm run make:mac', { stdio: 'inherit' });
    console.log("✅ Đóng gói thành công!");

    // 4. Định vị file DMG
    const dmgFileName = `TT Daily Task-${newVersion}-arm64.dmg`;
    const dmgPath = path.resolve(__dirname, `../dist-desktop/${dmgFileName}`);
    
    if (!fs.existsSync(dmgPath)) {
      throw new Error(`Không tìm thấy file DMG tại: ${dmgPath}`);
    }

    // 5. Tạo GitHub Release
    console.log(`\n🐙 Đang tạo Release ${tagName} trên GitHub...`);
    const createReleaseRes = await fetch(`https://api.github.com/repos/${githubRepo}/releases`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tag_name: tagName,
        name: `Phiên bản ${tagName}`,
        body: `Cập nhật tự động phiên bản ${tagName}`,
        draft: false,
        prerelease: false
      })
    });

    if (!createReleaseRes.ok) {
      const errTxt = await createReleaseRes.text();
      throw new Error(`Tạo GitHub Release thất bại: ${createReleaseRes.status} ${errTxt}`);
    }

    const releaseData = await createReleaseRes.json();
    const releaseId = releaseData.id;
    console.log(`✅ Đã tạo Release thành công (ID: ${releaseId})`);

    // 6. Upload file DMG lên GitHub Release
    console.log(`\n☁️ Đang tải file ${dmgFileName} lên GitHub (khoảng 160MB, vui lòng đợi)...`);
    const fileBuffer = fs.readFileSync(dmgPath);
    
    const uploadRes = await fetch(`https://uploads.github.com/repos/${githubRepo}/releases/${releaseId}/assets?name=${encodeURIComponent(dmgFileName)}`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/x-apple-diskimage'
      },
      body: fileBuffer
    });

    if (!uploadRes.ok) {
      const errTxt = await uploadRes.text();
      throw new Error(`Upload file lên GitHub thất bại: ${uploadRes.status} ${errTxt}`);
    }

    const assetData = await uploadRes.json();
    const downloadUrl = assetData.browser_download_url;
    console.log(`✅ Upload thành công! Link tải: ${downloadUrl}`);

    // 7. Cập nhật Database Supabase
    console.log(`\n📝 Đang cập nhật bảng app_config trên Supabase...`);
    const { error: dbError } = await supabase
      .from('app_config')
      .update({
        version: newVersion,
        download_url: downloadUrl,
        release_notes: `Bản cập nhật tự động ${tagName} đã sẵn sàng!`
      })
      .eq('id', 'desktop_app');

    if (dbError) throw dbError;
    
    console.log("✅ Cập nhật Database thành công!");
    
    console.log(`\n🎉 HOÀN TẤT! Người dùng sẽ nhận được thông báo cập nhật ${tagName} ngay khi họ mở app!`);
  } catch (error) {
    console.error("\n❌ QUÁ TRÌNH RELEASE THẤT BẠI:");
    console.error(error.message || error);
    process.exit(1);
  }
}

release();
