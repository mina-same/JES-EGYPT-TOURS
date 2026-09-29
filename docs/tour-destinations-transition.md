# تقرير الانتقال إلى Places Visited — 2026-09-29

**حالة التنفيذ: اكتمل انتقال الكود وتنظيف قاعدة البيانات. أُضيفت الوجهات الثلاث وحُذف المفتاح القديم من 12 رحلة؛ بقية بيانات الرحلات لم تتغير. لم يحدث deploy أو publish.**

## نتائج المتطلبات

1. حُذف Location الحر من Tour Details، ومن تهيئة النموذج وأنواع بيانات الواجهة. استعادة المسودات القديمة تقبل حقول النموذج الحالية فقط، لمنع عودة الحقل المحذوف إلى طلبات الحفظ.
2. `Tour.destinations` هو المصدر الوحيد لعرض الأماكن في الكود. لم تُستنتج أو تُعيّن أي وجهة من نصوص الرحلات أو بياناتها القديمة.
3. أُزيل `tourLocation` من schema وواجهة ITour بعد نجاح الاختبارات والبناء الأولي. اختبارات Mongoose تثبت تجاهله في إنشاء البيانات وفي تحديثها.
4. حُذف من projections والبحث والترتيب والوثائق الفعلية. استجابات عرض الرحلات تحصل على Destination records ببيانات `_id / name / shortName` بواسطة batch populate، والمدونة تستخدم nested populate. لا يستخدم أي consumer في الكود المعدل الحقل القديم.
5. أنواع استجابة Tour تسمح بوجهات populated؛ TourFormData يحتفظ بـ`string[]`. تهيئة Edit تحوّل الكائنات إلى IDs عبر `tourDestinationIds`.
6. حُذف Location A-Z من parser والكاش ومفاتيح ترجمة الترتيب. خيارات الزائر الحالية هي Recommended، واتجاها السعر، واتجاها المدة. لم يُضف ترتيب بالوجهة.
7. البحث يجد الوجهات عبر `name.<locale>` و`shortName.<locale>`، ثم يضيف IDs داخل شرط البحث. تظل بقية حقول البحث النصية الموجودة متاحة؛ لذلك قد تظهر رحلة دون وجهات إذا طابق عنوانها البحث. فلاتر المجموعات الأخرى تبقى AND.
8. `client/src/lib/tours/destinations.ts` يوفّر formatter مركزيًا: shortName باللغة المطلوبة أولًا، ثم name المحلي مع fallback الموجود، ثم `Intl.ListFormat`. IDs غير المحمّلة والقوائم الفارغة لا تنتج نصًا. لا توجد قيمة Egypt افتراضية.
9. JSON-LD يبني TouristDestination من أسماء سجلات الوجهات، ويحذف الخاصية بالكامل عند غياب الوجهات.
10. كاش Blog by slug أصبح يحمل tag `tours`؛ تعديل Destination يبطل أصلًا `destinations` و`tours`. اختُبرت الجهتان، بما فيها تشغيل middleware الحقيقي لتعديل وجهة مع اعتراض طلب إبطال الكاش محليًا.
11. عدد الوثائق التي تحتوي المفتاح قبل التنظيف: **12**، بقراءة dry-run جديدة بتاريخ 2026-09-29.
12. عدد الوثائق المعدلة: **12**؛ العدد بعد التنظيف: **0**. مقارنة SHA-256 لجميع حقول الرحلات الأخرى قبل العملية وبعدها نجحت (`otherFieldsUnchanged: true`)، بما فيها destinations وحقول الإقامة. فحص dry-run مستقل بعد التنفيذ أكد مجددًا العدد صفر وعدم وجود وجهات ناقصة.
13. القائمة الحالية للرحلات ذات الوجهات الفارغة، المستخرجة بعد التنظيف، تحتوي رحلة واحدة: `6ab69bff81f928e3f6581af2` — **Luxor West Bank Tour: Valley of the Kings, Hatshepsut & Colossi of Memnon**، والـslug الإنجليزي `luxor-west-bank-tour`. تُراجع يدويًا من `/admin/tour/tour/6ab69bff81f928e3f6581af2/edit`. لم تُعيّن لها أي وجهة تلقائيًا. الأدمن يعرض `Places Visited needs review` عندما تكون القائمة فارغة، ويسمح بحفظها فارغة.
14. أُضيفت السجلات التالية بأسماء وslugs للغات الأربع، دون محتوى SEO مختلق، ومع `noIndex: true` حتى إعداد محتواها:
    - Abu Simbel: `6abb7dd4eebd0cc00bb64c9a`، slug: `abu-simbel`.
    - Edfu: `6abb7dd4eebd0cc00bb64c9c`، slug: `edfu`.
    - Kom Ombo: `6abb7dd4eebd0cc00bb64c9e`، slug: `kom-ombo`.

## الاختبارات والفحوص

- Frontend: **112 اختبارًا ناجحًا، صفر فشل** (`npm test` داخل client).
- Backend: **82 اختبارًا ناجحًا** في الجولة السابقة، ثم **نجح اختبار تكامل MongoDB المتبقي** بتاريخ 2026-09-29 مع `RUN_FILTER_DB_TESTS=1`؛ الإجمالي 83 اختبارًا ناجحًا عبر الجولتين. اختبار MongoDB يتحقق من العضوية والمدد والأسعار والترتيب والتقسيم إلى صفحات. اختبارات الحفظ وقراءات API تستخدم الكود وmiddleware الفعليين مع محاكاة طبقة قاعدة البيانات؛ ليست جلسة حفظ end-to-end على قاعدة البيانات الحية.
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

## تنفيذ قاعدة البيانات المكتمل

عاد الاتصال للعمل بتاريخ 2026-09-29. نُفذت الأوامر التالية من مجلد server بعد نجاح اختبار التكامل المتبقي:

```powershell
npx ts-node src/scripts/finalizeTourDestinations.ts
npx ts-node src/scripts/finalizeTourDestinations.ts --apply
npx ts-node src/scripts/finalizeTourDestinations.ts
```

الأول أكد وجود 12 وثيقة والوجهات الثلاث الناقصة. الثاني أضاف الوجهات ونفذ `$unset` للمفتاح العلوي المحدد فقط، ثم تحقق من العدد صفر وتطابق بصمة بقية بيانات الرحلات، وطبع قائمة المراجعة اليدوية. الثالث أكد أن إعادة التشغيل لا تتطلب تنظيفًا أو إضافة وجهات أخرى. لم تتغير destinations لأي رحلة أو مواقع أماكن الإقامة. لا توجد أعمال قاعدة بيانات معلقة لهذا الانتقال؛ المتبقي لصاحب الموقع هو المراجعة اليدوية لاختيارات Places Visited.

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
