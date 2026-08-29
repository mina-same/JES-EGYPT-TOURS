import assert from 'node:assert/strict';
import test from 'node:test';

// @ts-expect-error Node's built-in type stripping needs the explicit extension.
import { auditInternalLinks, buildAllHtmlLinkSources } from '../src/lib/internalLinkAudit.ts';

const siteUrl = 'https://www.jesegypttours.com';

test('finds same-site links per locale and ignores external links', () => {
  const links = auditInternalLinks([
    {
      label: 'Description',
      value: {
        en: '<p><a href="/en/luxor?from=guide&amp;type=day">Explore <strong>Luxor</strong></a> <a href="https://example.com">External</a></p>',
        de: '<a href="https://www.jesegypttours.com/en/cairo" rel="nofollow">Kairo</a>',
        it: '<a href="/it/rome"><img src="rome.jpg" alt="Rome tour"></a>',
        es: '<a href="#faqs">Preguntas</a>',
      },
    },
  ], siteUrl);

  assert.equal(links.length, 4);

  const english = links.find((link) => link.locale === 'en');
  assert.equal(english?.anchorText, 'Explore Luxor');
  assert.equal(english?.normalizedHref, '/en/luxor?from=guide&type=day');
  assert.deepEqual(english?.issues, []);

  const german = links.find((link) => link.locale === 'de');
  assert.deepEqual(
    german?.issues.map((issue) => issue.code),
    ['absolute_internal_url', 'internal_nofollow', 'language_mismatch']
  );

  const italian = links.find((link) => link.locale === 'it');
  assert.equal(italian?.anchorText, '[Image: Rome tour]');
  assert.deepEqual(italian?.issues, []);

  const spanish = links.find((link) => link.locale === 'es');
  assert.equal(spanish?.samePageReference, true);
  assert.deepEqual(spanish?.issues, []);
});

test('flags missing locale, insecure URLs and legacy content correctly', () => {
  const links = auditInternalLinks([
    { label: 'Legacy overview', value: '<a href="/tours/luxor">Luxor</a>' },
    {
      label: 'Localized overview',
      value: { es: '<a href="http://jesegypttours.com/es/aswan">Asuán</a>' },
    },
  ], siteUrl);

  assert.equal(links.length, 2);
  assert.equal(links[0].locale, 'en');
  assert.deepEqual(links[0].issues.map((issue) => issue.code), ['missing_locale']);
  assert.equal(links[1].locale, 'es');
  assert.deepEqual(
    links[1].issues.map((issue) => issue.code),
    ['insecure_http', 'absolute_internal_url']
  );
});

test('blog and tour source builders recursively cover nested page text', () => {
  const blogLinks = auditInternalLinks(buildAllHtmlLinkSources({
    contentBlocks: [
      { content: { de: '<p><a href="/de/blog">Artikel</a></p>' } },
    ],
    faqs: [
      { answer: { it: '<a href="/it/help">Aiuto</a>' } },
    ],
  }), siteUrl);

  assert.deepEqual(
    blogLinks.map((link) => [link.locale, link.source]),
    [
      ['de', 'Content blocks · Item 1 · Content'],
      ['it', 'FAQs · Item 1 · Answer'],
    ]
  );

  const tourLinks = auditInternalLinks(buildAllHtmlLinkSources({
    itinerary: {
      generalDescription: {
        de: '<a href="/en/alexandria">Alexandria</a>',
      },
      days: [
        {
          day: 2,
          activities: [
            { description: { es: '<a href="/en/temple">Templo</a>' } },
          ],
        },
      ],
    },
  }), siteUrl);

  assert.equal(tourLinks[0].source, 'Itinerary · General description');
  assert.equal(tourLinks[0].issues[0].code, 'language_mismatch');
  assert.equal(tourLinks[1].source, 'Itinerary · Days · Item 1 · Activities · Item 1 · Description');
  assert.equal(tourLinks[1].issues[0].code, 'language_mismatch');
});

test('finds links inside lists, tables, nested markup and malformed anchor HTML', () => {
  const links = auditInternalLinks(buildAllHtmlLinkSources({
    content: {
      en: [
        '<ul><li><a class="first" href="/en/list-item">List <span>item</span></a></li></ul>',
        "<ol><li><a data-id='2' href='/en/ordered'>Ordered</a></li></ol>",
        '<table><tr><td><a href=/en/table>Table</a></td></tr></table>',
        '<p><a href="/en/unclosed">Unclosed link',
      ],
    },
  }), siteUrl);

  assert.equal(links.length, 4);
  assert.deepEqual(
    links.map((link) => [link.anchorText, link.normalizedHref]),
    [
      ['List item', '/en/list-item'],
      ['Ordered', '/en/ordered'],
      ['Table', '/en/table'],
      ['Unclosed link', '/en/unclosed'],
    ]
  );
});

test('automatically covers newly added HTML fields and every admin content type', () => {
  const tourTaxonomyLinks = auditInternalLinks(buildAllHtmlLinkSources({
    toursSectionSubTitle: { es: '<a href="/en/new-field">Nuevo campo</a>' },
    futureNestedSection: {
      bodyHtml: { de: '<a href="/de/future">Zukünftig</a>' },
    },
  }), siteUrl);
  assert.equal(tourTaxonomyLinks.length, 2);
  assert.equal(tourTaxonomyLinks[0].source, 'Tours section sub title');
  assert.equal(tourTaxonomyLinks[0].issues[0].code, 'language_mismatch');
  assert.equal(tourTaxonomyLinks[1].source, 'Future nested section · Body HTML');

  const generalLinks = auditInternalLinks(buildAllHtmlLinkSources({
    content: { it: '<p><a href="/it/contact">Contatti</a></p>' },
  }), siteUrl);
  assert.equal(generalLinks[0].source, 'Content');
  assert.equal(generalLinks[0].locale, 'it');

  const faqLinks = auditInternalLinks(buildAllHtmlLinkSources({
    answer: { de: '<p><a href="/en/contact">Kontakt</a></p>' },
  }), siteUrl);
  assert.equal(faqLinks[0].source, 'Answer');
  assert.equal(faqLinks[0].issues[0].code, 'language_mismatch');
});

test('does not count HTML from populated related documents as page content', () => {
  const links = auditInternalLinks(buildAllHtmlLinkSources({
    description: { en: '<a href="/en/own-page">Own page link</a>' },
    category: {
      description: { en: '<a href="/en/category-link">Category link</a>' },
    },
    relatedPosts: [
      { content: { en: '<a href="/en/related-post">Related post link</a>' } },
    ],
    // Populated in full by the category/subcategory getById endpoints.
    featuredDestinations: [
      { description: { en: '<a href="/de/featured-destination">Featured</a>' } },
    ],
    relatedDestinations: [
      { description: { en: '<a href="/en/related-destination">Related</a>' } },
    ],
  }), siteUrl);

  assert.equal(links.length, 1);
  assert.equal(links[0].normalizedHref, '/en/own-page');
  assert.equal(links[0].source, 'Description');
});

test('flags wrong-language static slugs that only reach the page via a redirect', () => {
  const links = auditInternalLinks([
    {
      label: 'Description',
      value: {
        de: '<a href="/de/contact">Kontakt</a> <a href="/de/kontakt">Kontakt</a>',
        it: '<a href="/it/tailor-made">Su misura</a>',
        en: '<a href="/en/travel-trade">DMC</a> <a href="/en/egypt-dmc">DMC</a>',
      },
    },
  ], siteUrl);

  assert.deepEqual(
    links.map((link) => [link.normalizedHref, link.issues.map((issue) => issue.code)]),
    [
      ['/en/travel-trade', ['localized_slug_mismatch']],
      ['/en/egypt-dmc', []],
      ['/de/contact', ['localized_slug_mismatch']],
      ['/de/kontakt', []],
      ['/it/tailor-made', ['localized_slug_mismatch']],
    ]
  );
  assert.match(links[0].issues[0].message, /\/en\/egypt-dmc/);
});

test('does not mistake database content slugs for static page slugs', () => {
  const links = auditInternalLinks([
    { label: 'Description', value: { de: '<a href="/de/reise-nach-luxor">Luxor</a>' } },
  ], siteUrl);

  assert.deepEqual(links[0].issues, []);
});

test('reports anchor HTML accidentally saved inside metadata', () => {
  const links = auditInternalLinks(buildAllHtmlLinkSources({
    seo: {
      metaDescription: {
        en: '<p>See <a href="/en/luxor">Luxor</a></p>',
      },
    },
  }), siteUrl);

  assert.equal(links.length, 1);
  assert.equal(links[0].source, 'SEO · Meta description');
  assert.deepEqual(links[0].issues.map((issue) => issue.code), ['link_in_metadata']);
});

test('reports anchor HTML in every metadata field, not only the description', () => {
  const links = auditInternalLinks(buildAllHtmlLinkSources({
    metaTitle: { en: '<a href="/en/luxor">Luxor</a>' },
    ogDescription: { en: '<a href="/en/luxor">Luxor</a>' },
    metaKeywords: { en: '<a href="/en/luxor">Luxor</a>' },
    description: { en: '<a href="/en/luxor">Luxor</a>' },
  }), siteUrl);

  assert.deepEqual(
    links.map((link) => [link.source, link.issues.map((issue) => issue.code)]),
    [
      ['Meta title', ['link_in_metadata']],
      ['Og description', ['link_in_metadata']],
      ['Meta keywords', ['link_in_metadata']],
      ['Description', []],
    ]
  );
});
