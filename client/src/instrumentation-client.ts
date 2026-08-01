/**
 * Runs once per page load, before React hydrates (Next calls
 * `require-instrumentation-client` ahead of `hydrate()` in both the dev and
 * production client entries).
 *
 * Security browser extensions — Bitdefender and Kaspersky in particular — inject
 * attributes such as `bis_skin_checked` into the server-rendered DOM before
 * hydration, which React then reports as a hydration mismatch. This strips them
 * first, then keeps stripping them as the extension re-adds them.
 *
 * This used to be a `<Script strategy="beforeInteractive">` inside the visitor
 * root layout. Because the locale is a segment of that root layout, switching
 * languages remounted it, React re-created the `<script>` element on the client
 * and logged "Encountered a script tag while rendering React component" every
 * time — and the observer would have been installed twice had it executed.
 * Living outside the React tree fixes both.
 */

const INJECTED_ATTRIBUTE_PREFIXES = ['bis_', '__processed_'];

const isInjectedAttribute = (name: string) =>
  INJECTED_ATTRIBUTE_PREFIXES.some((prefix) => name.startsWith(prefix));

const stripFrom = (element: Element) => {
  const { attributes } = element;
  for (let i = attributes.length - 1; i >= 0; i -= 1) {
    const { name } = attributes[i];
    if (isInjectedAttribute(name)) element.removeAttribute(name);
  }
};

const stripTree = (root: Element) => {
  stripFrom(root);
  const descendants = root.getElementsByTagName('*');
  for (let i = 0; i < descendants.length; i += 1) stripFrom(descendants[i]);
};

try {
  stripTree(document.documentElement);
  if (document.body) stripTree(document.body);

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName &&
        isInjectedAttribute(mutation.attributeName)
      ) {
        (mutation.target as Element).removeAttribute?.(mutation.attributeName);
      }

      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) stripTree(node as Element);
        });
      }
    }
  }).observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
  });
} catch {
  // An extension-compatibility nicety must never break the app.
}
