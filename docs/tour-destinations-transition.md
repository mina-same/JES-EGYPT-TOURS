# تقرير الانتقال إلى Places Visited — 2026-09-28

**حالة التنفيذ: انتقال الكود مكتمل محليًا؛ أعمال قاعدة البيانات متوقفة بسبب فشل مصادقة MongoDB. لم يحدث deploy أو publish، ولم تتغير بيانات أي رحلة أو وجهة.**

## نتائج المتطلبات

1. حُذف Location الحر من Tour Details، ومن تهيئة النموذج وأنواع بيانات الواجهة. استعادة المسودات القديمة تقبل حقول النموذج الحالية فقط، لمنع عودة الحقل المحذوف إلى طلبات الحفظ.
2. `Tour.destinations` هو المصدر الوحيد لعرض الأماكن في الكود. لم تُستنتج أو تُعيّن أي وجهة من نصوص الرحلات أو بياناتها القديمة.
3. أُزيل `tourLocation` من schema وواجهة ITour بعد نجاح الاختبارات والبناء الأولي. اختبارات Mongoose تثبت تجاهله في إنشاء البيانات وفي تحديثها.
4. حُذف من projections والبحث والترتيب. استجابات عرض الرحلات تحصل على Destination records ببيانات `_id / name / shortName` بواسطة batch populate، والمدونة تستخدم nested populate. **الحذف الفعلي من الوثائق لم ينفذ؛ لذلك قد يظل المفتاح القديم موجودًا في استجابة قراءة وثيقة كاملة حتى تنفيذ التنظيف. لا يستخدمه أي consumer في الكود المعدل.**
5. أنواع استجابة Tour تسمح بوجهات populated؛ TourFormData يحتفظ بـ`string[]`. تهيئة Edit تحوّل الكائنات إلى IDs عبر `tourDestinationIds`.
6. حُذف Location A-Z من parser والكاش ومفاتيح ترجمة الترتيب. خيارات الزائر الحالية هي Recommended، واتجاها السعر، واتجاها المدة. لم يُضف ترتيب بالوجهة.
7. البحث يجد الوجهات عبر `name.<locale>` و`shortName.<locale>`، ثم يضيف IDs داخل شرط البحث. تظل بقية حقول البحث النصية الموجودة متاحة؛ لذلك قد تظهر رحلة دون وجهات إذا طابق عنوانها البحث. فلاتر المجموعات الأخرى تبقى AND.
8. `client/src/lib/tours/destinations.ts` يوفّر formatter مركزيًا: shortName باللغة المطلوبة أولًا، ثم name المحلي مع fallback الموجود، ثم `Intl.ListFormat`. IDs غير المحمّلة والقوائم الفارغة لا تنتج نصًا. لا توجد قيمة Egypt افتراضية.
9. JSON-LD يبني TouristDestination من أسماء سجلات الوجهات، ويحذف الخاصية بالكامل عند غياب الوجهات.
10. كاش Blog by slug أصبح يحمل tag `tours`؛ تعديل Destination يبطل أصلًا `destinations` و`tours`. اختُبرت الجهتان، بما فيها تشغيل middleware الحقيقي لتعديل وجهة مع اعتراض طلب إبطال الكاش محليًا.
11. عدد الوثائق التي تحتوي المفتاح قبل التنظيف: **غير متحقق حاليًا**؛ الاتصال أعاد `bad auth : authentication failed`. آخر قراءة في التشخيص السابق كانت 12، وهي ليست قراءة جديدة.
12. العدد بعد التنظيف: **لم يُنفذ التنظيف، فلا يمكن ادعاء أنه صفر**.
13. القائمة الحالية للرحلات ذات الوجهات الفارغة لم يمكن تحديثها. آخر تشخيص سابق أظهر رحلة واحدة: `6ab69bff81f928e3f6581af2` — **Luxor West Bank Tour: Valley of the Kings, Hatshepsut & Colossi of Memnon**. يجب إعادة استخراج القائمة بعد استعادة الاتصال. الأدمن يعرض `Places Visited needs review` عندما تكون القائمة فارغة، ويسمح بحفظها فارغة.
14. لم تُضف سجلات جديدة إلى قاعدة البيانات. سكربت الإنهاء جاهز لإضافة Abu Simbel وEdfu وKom Ombo فقط عند غيابها، بأسماء وslugs للغات الأربع، دون محتوى SEO مختلق، ومع `noIndex: true` حتى إعداد محتواها. اختُبرت صلاحية هذه السجلات على نموذج Destination محليًا.

## الاختبارات والفحوص

- Frontend: **112 اختبارًا ناجحًا، صفر فشل** (`npm test` داخل client).
- Backend: **82 اختبارًا ناجحًا، صفر فشل، اختبار تكامل MongoDB واحد skipped** (`npm test` داخل server). اختبارات الحفظ وقراءات API هنا تستخدم الكود وmiddleware الفعليين مع محاكاة طبقة قاعدة البيانات؛ ليست جلسة حفظ end-to-end على قاعدة البيانات الحية.
- TypeScript: نجاح `client npm run typecheck` و`server npm run build`.
- Production build: نجاح `client npm run build`، بما فيه توليد 38 صفحة ثابتة.
- فحص متصفح محلي لمكونات التصنيف الحالية: نجح على عروض 1280 و768 و390، بما فيه البحث واختيار وإزالة الوجهات ولوحة المفاتيح وعدم تجاوز العرض. مصدر الوجهات في هذا الفحص تجريبي، وليس قاعدة البيانات الحية.
- اختبارات الوجهات الجديدة تشمل: وجهة واحدة، عدة وجهات، الفراغ، اللغات الأربع، shortName وfallback، عدم إظهار IDs، كروت العرض وشريط معلومات الرحلة، JSON-LD، تحويل بيانات Edit إلى IDs، المسودات القديمة، حفظ IDs وإعادة تحميلها، رفض كائنات العرض وIDs غير الصحيحة، البحث، جميع مسارات قراءة الرحلات، والكاش.
- اختبارات التحديث تتحقق من بقاء `pricingPlans[].accommodations[].location` دون تغيير. لم تتغير علاقة Tour Type أو tourKind بهذا العمل.
- lint للملفات المعدلة والجديدة: **صفر أخطاء**؛ 8 تحذيرات في client و118 في server.
- lint للمشروع كاملًا: لا يمر بسبب مشاكل موجودة خارج هذا التعديل: client يحتوي 240 خطأ و75 تحذيرًا؛ server يحتوي 209 أخطاء و570 تحذيرًا. لم يُنفذ refactor لمعالجتها.
- `git diff --check`: نجح.

## فحص بقايا الاسم القديم

البحث الشامل، بما فيه الملفات المخفية والمتجاهلة، مع استثناء dependencies ومخرجات build وGit والسجلات، لم يجد استعمالات تشغيلية لقراءة أو حفظ الحقل في التطبيق. البقايا المقصودة:

- `server/src/scripts/finalizeTourDestinations.ts`: تنظيف لمرة واحدة، لعدّ المفتاح وحذفه والتحقق من اختفائه، وليس مصدرًا للقراءة أو العرض.
- `server/tests/tour-destinations.test.ts`: اختبارات سلبية تمنع عودة الحقل إلى schema والحفظ والبحث والترتيب.
- `client/tests/tour-destinations.test.ts`: اختبار مسودة قديمة والتحقق من حذف المفتاح منها.
- `server/tour-filter-migration-reviewed-1790327001769.json`: تقرير محلي قديم متجاهل بواسطة Git؛ ليس runtime dependency ولم يُعدّل.
- هذا التقرير: توثيق حالة الانتقال.

حُذف `client/update_use_tour_data.py` لأنه يعيد الاعتماد القديم، وحُذفت قيم الحقل من seeds وseedTestTour.

## الخطوة المتبقية عند إصلاح الاتصال

تحديث `MONGODB_URI` في `server/.env` ببيانات اتصال صالحة؛ لا حاجة لإرسال الأسرار في المحادثة. ثم، من مجلد server:

```powershell
npx ts-node src/scripts/finalizeTourDestinations.ts
npx ts-node src/scripts/finalizeTourDestinations.ts --apply
```

الأول dry-run فقط. الثاني يعيد dry-run، ويضيف الوجهات الناقصة، وينفذ `$unset` للمفتاح العلوي المحدد فقط، ثم يتحقق من العدد صفر ويقارن بصمة بقية بيانات الرحلات، ويطبع قائمة الرحلات المحتاجة للمراجعة. لا يغيّر destinations لأي رحلة ولا يمس مواقع أماكن الإقامة. تنفيذ هذه الخطوة مصرح به بالفعل من المستخدم، لكنه تعذر لرفض المصادقة، وليس لانتظار إدخال Places Visited يدويًا.

## الملفات المعدلة والجديدة

- `client/src/app/(admin)/admin/tour/tour/[id]/edit/page.tsx`
- `client/src/app/(admin)/admin/tour/tour/[id]/view/page.tsx`
- `client/src/app/(admin)/admin/tour/tour/page.tsx`
- `client/src/app/(visitor)/[locale]/(home)/[slug]/_views/CategoryView.tsx`
- `client/src/app/(visitor)/[locale]/(home)/[slug]/_views/SubcategoryView.tsx`
- `client/src/app/(visitor)/[locale]/(home)/special-offers/_views/SpecialOffersView.tsx`
- `client/src/app/(visitor)/[locale]/(home)/special-offers/cardFields.ts`
- `client/src/app/(visitor)/[locale]/(home)/wishlist/page.tsx`
- `client/src/components/admin/tour/OverviewTab.tsx`
- `client/src/components/admin/tour/TourFilterFields.tsx`
- `client/src/components/sections/DynamicBlogDetails/DynamicBlogDetails.tsx`
- `client/src/components/sections/FeatureTwo/FeaturedToursSection.tsx`
- `client/src/components/sections/SearchResultsPage/SearchResultsPage.tsx`
- `client/src/components/sections/TourListingDetailsOne/useTourData.ts`
- `client/src/hooks/useTourForm.ts`
- `client/src/i18n/locales/de/tours.json`
- `client/src/i18n/locales/en/tours.json`
- `client/src/i18n/locales/es/tours.json`
- `client/src/i18n/locales/it/tours.json`
- `client/src/lib/api/blog.ts`
- `client/src/lib/api/tour.server.ts`
- `client/src/lib/seo/tourJsonLd.ts`
- `client/src/lib/tours/cardViewModel.ts`
- `client/src/lib/tours/destinations.ts`
- `client/src/types/tour.ts`
- `client/tests/blog-cache-policy.test.ts`
- `client/tests/tour-destinations.test.ts`
- `client/update_use_tour_data.py`
- `docs/tour-destinations-transition.md`
- `server/src/controllers/blogController.ts`
- `server/src/controllers/tourController.ts`
- `server/src/models/Tour.ts`
- `server/src/scripts/finalizeTourDestinations.ts`
- `server/src/scripts/seedTestTour.ts`
- `server/src/seeds/comprehensiveTourSeeder.ts`
- `server/src/seeds/detailedTourSeeder.ts`
- `server/src/seeds/tourSeeds.ts`
- `server/src/utils/tourQuery.ts`
- `server/tests/tour-destinations.test.ts`
