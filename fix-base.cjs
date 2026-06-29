// fix-base.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing base issues...\n');

// ═══════════════════════════════════════
// ۱. حذف فاصله‌های اضافی از همه فایل‌ها
// ═══════════════════════════════════════
function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // حذف فاصله داخل کوتیشن‌ها
    content = content.replace(/"([^"]*?)\s+"/g, '"$1"');
    content = content.replace(/'([^']*?)\s+'/g, "'$1'");
    
    // حذف فاصله قبل/بعد از کوتیشن
    content = content.replace(/([^\s])\s+"/g, '$1"');
    content = content.replace(/([^\s])\s+'/g, "$1'");
    content = content.replace(/"\s+([^\s])/g, '"$1');
    content = content.replace(/'\s+([^\s])/g, "'$1");
    
    // اصلاح && های شکسته
    content = content.replace(/&\s+&/g, '&&');
    content = content.replace(/\/\s+>/g, '/>');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Cleaned: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
  } catch (e) {
    console.warn(`⚠️ Skipped: ${path.basename(filePath)}`);
  }
  return false;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir);
  let count = 0;
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('node_modules') && !file.startsWith('.')) {
      count += walk(fullPath);
    } else if (/\.(ts|tsx|json)$/.test(file)) {
      if (cleanFile(fullPath)) count++;
    }
  }
  return count;
}

// ═══════════════════════════════════════
// ۲. اصلاح useClickOutside.ts
// ═══════════════════════════════════════
function fixUseClickOutside() {
  const hookPath = path.join(__dirname, 'src/shared/hooks/useClickOutside.ts');
  if (!fs.existsSync(hookPath)) {
    console.warn('⚠️ useClickOutside.ts not found');
    return;
  }
  
  let content = fs.readFileSync(hookPath, 'utf8');
  content = content.replace(/callback\(\)/g, 'handler()');
  content = content.replace(/\[ref,\s*callback\]/g, '[ref, handler]');
  fs.writeFileSync(hookPath, content, 'utf8');
  console.log('✅ Fixed useClickOutside.ts');
}

// ═══════════════════════════════════════
// ۳. حذف System Test از App.tsx
// ═══════════════════════════════════════
function removeSystemTestFromApp() {
  const appPath = path.join(__dirname, 'src/App.tsx');
  if (!fs.existsSync(appPath)) {
    console.warn('⚠️ App.tsx not found');
    return;
  }
  
  let content = fs.readFileSync(appPath, 'utf8');
  
  // حذف useEffect تست
  content = content.replace(/useEffect\(\(\)\s*=>\s*\{[\s\S]*?publishEvent\(['"]system\.test['"][\s\S]*?\},\s*\[\]\);/g, '');
  content = content.replace(/console\.log\(['"]🧪 Testing Event Bus[\s\S]*?\);/g, '');
  
  // حذف import publishEvent اگر فقط برای تست بود
  if (!content.includes('publishEvent(') && content.includes("import { publishEvent }")) {
    content = content.replace(/import\s*\{\s*publishEvent\s*\}\s*from\s*['"]@infra\/events['"];?\n?/g, '');
  }
  
  fs.writeFileSync(appPath, content, 'utf8');
  console.log('✅ Removed System Test from App.tsx');
}

// ═══════════════════════════════════════
// اجرای عملیات
// ═══════════════════════════════════════
const totalFixed = walk(path.join(__dirname, 'src')) + walk(__dirname);
console.log(`\n📊 Total files cleaned: ${totalFixed}`);

fixUseClickOutside();
removeSystemTestFromApp();

console.log('\n🎉 Base fixes applied!');