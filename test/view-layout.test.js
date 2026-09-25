import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function element(id, classes = []) {
  return {
    id,
    classes: new Set(classes),
    children: [],
    parentElement: null,
    append(child) {
      if (child.parentElement) child.parentElement.children = child.parentElement.children.filter(item => item !== child);
      child.parentElement = this;
      this.children.push(child);
    }
  };
}

test("normalization repairs the exact hidden-parent booking route failure", () => {
  const app = element("app");
  const home = element("view-home", ["view"]);
  const about = element("view-about", ["view"]);
  const malformedSection = element("beauty-philosophy");
  const book = element("view-book", ["view"]);
  const policies = element("view-policies", ["view"]);
  const admin = element("view-admin", ["view"]);
  const confirmation = element("view-confirmation", ["view"]);
  const footer = element("footer", ["site-footer"]);

  app.append(home);
  app.append(about);
  about.append(malformedSection);
  malformedSection.append(book);
  malformedSection.append(policies);
  malformedSection.append(admin);
  malformedSection.append(confirmation);
  malformedSection.append(footer);

  const views = [home, about, book, policies, admin, confirmation];
  const document = {
    getElementById: id => id === "app" ? app : views.find(view => view.id === id) || null,
    querySelector: selector => selector === ".site-footer" ? footer : null,
    querySelectorAll: selector => selector === ".view" ? views : []
  };
  const sandbox = { window: {}, globalThis: {} };
  vm.runInNewContext(fs.readFileSync("app-layout.js", "utf8"), sandbox);

  assert.equal(book.parentElement, malformedSection, "reproduction requires Book to start inside the hidden About subtree");
  sandbox.window.BBK_LAYOUT.normalizeViewLayout(document);

  for (const view of views) assert.equal(view.parentElement, app, `${view.id} must be a direct application child`);
  assert.equal(app.children.at(-1), footer, "footer remains after every routed view");

  const activeRoute = "view-book";
  const visibleViews = views.filter(view => view.id === activeRoute && view.parentElement === app);
  assert.deepEqual(visibleViews.map(view => view.id), ["view-book"]);
});
