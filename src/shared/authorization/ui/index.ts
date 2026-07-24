// src/shared/authorization/ui/index.ts

// ✅ اکسپورت صریح توابع کمکی فقط از helpers.ts (منبع واحد و معتبر)
export {
  getAllElements,
  getAllDependenciesChain,
  checkDependenciesChain,
  getAllChildren,
  getAllChildrenChain,
} from "./helpers";

// ✅ اکسپورت آبجکت‌های استاتیک المان‌ها (برای استفاده در جاهای دیگر اگر نیاز بود)
export * from "./elements";

// ✅ اکسپورت فایل‌های کمکی دیگر
export { getLinkedGroup, getLinkedSlaves } from "./linkedElements";
