**قانون توسعه پروژه**

از این لحظه به بعد، تمام توسعه‌های این پروژه باید با دید یک **ERP سازمانی (Enterprise ERP)** انجام شوند، نه یک پروژه React معمولی.

همیشه قبل از اضافه کردن قابلیت جدید، معماری را در اولویت قرار بده.

قوانین اصلی:

* هیچ Business Logic داخل Page یا Component نوشته نشود.
* هیچ Feature مستقیماً به دیتابیس یا Supabase متصل نشود؛ همه دسترسی‌ها فقط از طریق Repository و Application Layer انجام شود.
* هیچ Feature نباید Feature دیگری را Import کند؛ ارتباط بین ماژول‌ها فقط از طریق EventBus یا Application Layer باشد.
* معماری باید کاملاً ماژولار، کم‌وابستگی (Low Coupling) و با انسجام بالا (High Cohesion) باقی بماند.
* از ایجاد God Object، Circular Dependency و وابستگی مستقیم بین لایه‌ها جلوگیری کن.
* همیشه Domain Modelهای واقعی را به Primitiveها ترجیح بده.
* هر قابلیت جدید باید قابل توسعه، قابل تست و قابل جایگزینی باشد.
* ساختار پروژه باید مطابق معماری Enterprise (app / application / domain / entities / features / widgets / shared / repositories / infrastructure) حفظ شود.
* هر تغییری باید کیفیت معماری را حفظ یا بهبود دهد و هرگز به خاطر سرعت توسعه، اصول معماری نقض نشوند.
* همیشه قبل از اعمال تغییرات، بهترین الگوی معماری و Design Pattern مناسب را انتخاب کن، حتی اگر پیاده‌سازی کمی پیچیده‌تر شود.

**هدف نهایی:** ساخت یک ERP در سطح Enterprise که در آینده بتوان بدون بازنویسی سیستم، دیتابیس، زیرساخت، سرویس‌ها یا ماژول‌ها را تغییر یا گسترش داد.

با این تفاسیر برو سراغ inspection

وضعیت فعلی 

PS D:\App\Backup\New folder\Prototype Inspection\src\features\inspection-management> tree /f
Folder PATH listing
Volume serial number is 12FC-6D24
D:.
│   constants.ts
│   elements.ts
│
├───hooks
├───services
│       CertificateService.ts
│       ChecklistService.ts
│       DocumentReviewService.ts
│       InspectionRequestService.ts
│       InspectionService.ts
│       NCRService.ts
│       ReportService.ts
│       VendorService.ts
│
├───ui
│   │   ChecklistEditor.tsx
│   │   DocumentReviewModal.tsx
│   │   InspectionDetailsModal.tsx
│   │   InspectionExecutionForm.tsx
│   │   InspectionList.tsx
│   │   InspectionRequestForm.tsx
│   │   InspectorAssignmentModal.tsx
│   │   NCRForm.tsx
│   │   ProjectSelector.tsx
│   │   ReportGenerator.tsx
│   │   VendorAutocomplete.tsx
│   │
│   └───details
│           ChecklistSection.tsx
│           DocumentReviewSection.tsx
│           InspectorAssignmentSection.tsx
│           NCRSection.tsx
│           ReportSection.tsx
│
└───utils
        checklistTemplates.ts
        reportGenerator.ts