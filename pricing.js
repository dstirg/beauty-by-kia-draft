(function (root) {
  "use strict";

  const RANGE_NOTICE = "Final pricing within the displayed range may depend on hair length, thickness, condition, style complexity, product requirements, and time needed. Kia will confirm any adjustment before beginning the service.";
  const COLOR_NOTICE = "Final color pricing may depend on current hair color, hair length, thickness, product amount, corrective work, and the desired result. A consultation or photo review may be required.";
  const WEAVE_NOTICE = "Hair, wigs, bundles, closures, frontals, and accessories are not automatically included unless specifically stated in the service description.";
  const ALL_ADDONS = ["shampoo", "deep-conditioning", "trim", "finish", "hair-included", "extra-length", "extra-thickness", "same-day", "before-hours", "after-hours"];
  const BRAID_ADDONS = ["hair-included", "extra-length", "extra-thickness", "shampoo", "deep-conditioning", "trim", "same-day", "before-hours", "after-hours"];
  const service = (id, name, category, priceType, minPrice, maxPrice, description, extra = {}) => ({
    id: `svc-${id}`, name, category, priceType, minPrice, maxPrice, basePrice: minPrice,
    description, duration: extra.duration || 120, active: true, featured: Boolean(extra.featured),
    applicableAddOnIds: extra.applicableAddOnIds || ALL_ADDONS, ...extra
  });

  const services = [
    service("silk-press", "Silk Press", "Hair", "range", 75, 95, "A smooth, polished press tailored to the client’s hair needs.", { featured: true }),
    service("twist-out", "Twist Out", "Hair", "range", 60, 80, "A defined twist-out styled for shape, movement, and lasting definition."),
    service("perm-rod", "Perm Rod Set", "Hair", "range", 75, 95, "A polished rod set with curl placement suited to the requested finish."),
    service("flexi-rod", "Flexi Rod Set", "Hair", "range", 75, 95, "A flexible-rod style designed for soft, dimensional curls."),
    service("wash-go", "Wash & Go", "Hair", "range", 50, 70, "A curl-defining wash-and-go finish based on the client’s natural texture."),
    service("mini-twists", "Mini Twists", "Hair", "range", 130, 180, "Small two-strand twists customized to the client’s hair and desired finish.", { duration: 240 }),
    service("mini-braids", "Mini Braids", "Hair", "starting", 180, 250, "Detailed mini braids customized for size, length, and density.", { duration: 300 }),
    service("wash-blowout-trim", "Wash, Blowout & Trim", "Hair", "range", 50, 70, "Includes washing, blow-drying, and a basic trim as part of this service."),
    service("miracle-knots", "Miracle Knots", "Braids", "starting", 180, 300, "A customized knot-style braid service based on length, size, and density.", { duration: 300, applicableAddOnIds: BRAID_ADDONS, featured: true }),
    service("soft-locs", "Soft Locs", "Braids", "range", 180, 275, "Soft loc installation customized by length, density, and finish.", { duration: 300, applicableAddOnIds: BRAID_ADDONS }),
    service("man-braids", "Man Braids", "Braids", "range", 45, 90, "A tailored braided style with clean parting and a polished finish.", { applicableAddOnIds: BRAID_ADDONS }),
    service("full-color", "Full Head Color", "Color", "range", 110, 175, "All-over color customized after review of the current hair and desired result.", { notice: COLOR_NOTICE, requiredUploads: ["current", "inspiration"] }),
    service("color-touch-up", "Color Touch-Up", "Color", "range", 75, 100, "Targeted color maintenance based on existing color and regrowth.", { notice: COLOR_NOTICE, requiredUploads: ["current", "inspiration"] }),
    service("quick-weave-style", "Quick Weave & Style", "Weaves", "range", 75, 95, "A quick-weave installation finished in the selected style.", { notice: WEAVE_NOTICE, featured: true }),
    service("quick-weave-closure", "Quick Weave with Closure", "Weaves", "range", 100, 130, "A quick-weave installation designed for use with a closure.", { notice: WEAVE_NOTICE }),
    service("quick-weave-leave-out", "Quick Weave with Leave-Out", "Weaves", "range", 90, 120, "A quick-weave installation blended with leave-out.", { notice: WEAVE_NOTICE }),
    service("slick-ponytail", "Slick Back Ponytail", "Weaves", "range", 70, 95, "A sleek ponytail style tailored to the desired finish.", { notice: WEAVE_NOTICE }),
    service("braided-ponytail", "Braided Ponytail", "Weaves", "range", 85, 120, "A polished ponytail finished with a braided extension style.", { notice: WEAVE_NOTICE }),
    service("wig-install", "Wig Install", "Weaves", "range", 100, 150, "A customized wig installation and finish.", { notice: WEAVE_NOTICE }),
    service("wig-construction", "Wig Construction", "Weaves", "range", 150, 250, "Custom wig construction based on approved specifications.", { notice: WEAVE_NOTICE }),
    service("press-short", "Custom Press-On Set — Short", "Nails", "fixed", 35, 35, "A custom short press-on nail set made to the approved design.", { questionnaire: "pressOn", requiredUploads: ["inspiration"] }),
    service("press-medium", "Custom Press-On Set — Medium", "Nails", "fixed", 45, 45, "A custom medium press-on nail set made to the approved design.", { questionnaire: "pressOn", requiredUploads: ["inspiration"] }),
    service("press-long", "Custom Press-On Set — Long", "Nails", "fixed", 55, 55, "A custom long press-on nail set made to the approved design.", { questionnaire: "pressOn", requiredUploads: ["inspiration"] }),
    service("press-extra-long", "Custom Press-On Set — Extra Long", "Nails", "range", 65, 80, "An extra-long custom press-on set priced by design complexity.", { questionnaire: "pressOn", requiredUploads: ["inspiration"] }),
    service("press-premade", "Premade Press-On Set", "Nails", "range", 20, 40, "A ready-designed press-on set selected from available options.", { questionnaire: "pressOn", requiredUploads: ["inspiration"] }),
    service("manicure", "Manicure", "Nails", "range", 30, 45, "A professional manicure finished to the selected preferences."),
    service("pedicure", "Pedicure", "Nails", "range", 45, 65, "A professional pedicure finished to the selected preferences."),
    service("basic-glam", "BBK Basic Glam", "Makeup", "fixed", 65, 65, "A polished basic-glam makeup application."),
    service("full-glam", "BBK Full Glam", "Makeup", "fixed", 90, 90, "A full-glam makeup application with a more defined finish."),
    service("wedding-glam", "BBK Wedding Glam", "Makeup", "consultation", 150, 250, "A wedding makeup request reviewed for the look, location, schedule, party size, and trial needs.", { notice: "Wedding pricing may depend on the requested look, location, schedule, trial session, number of people, and other event requirements.", questionnaire: "wedding", requiredUploads: ["inspiration"], statusLabel: "Pending Kia’s review" })
  ];

  const addOns = [
    ["shampoo", "Shampoo", "range", 15, 20, "Professional cleansing service."],
    ["deep-conditioning", "Deep Conditioning Treatment", "range", 20, 30, "Conditioning treatment selected for the client’s needs."],
    ["trim", "Trim", "range", 15, 25, "A basic maintenance trim."],
    ["finish", "Curling or Flat-Iron Finish", "range", 15, 20, "A curling or flat-iron finish."],
    ["hair-included", "Hair Included", "starting", 40, null, "The final hair cost depends on the style, brand, color, length, quantity, and current product price."],
    ["extra-length", "Extra Length", "range", 20, 50, "Additional length beyond the standard service."],
    ["extra-thickness", "Extra Thickness", "range", 20, 40, "Additional time and work for extra thickness."],
    ["same-day", "Same-Day Appointment", "fixed", 25, 25, "Approved same-day appointment request."],
    ["before-hours", "Before-Hours Appointment", "range", 35, 50, "Approved appointment before regular hours."],
    ["after-hours", "After-Hours Appointment", "range", 35, 50, "Approved appointment after regular hours."]
  ].map(([id, name, priceType, minPrice, maxPrice, description]) => ({ id: `ao-${id}`, name, priceType, minPrice, maxPrice, price: minPrice, description, active: true }));

  function depositFor(total, consultationRequired = false) {
    if (consultationRequired) return 0;
    if (total < 100) return 25;
    if (total < 180) return 40;
    return 50;
  }
  function promotionIsActive(promotion, now = new Date()) {
    if (!promotion || !promotion.enabled) return false;
    const day = now.toISOString().slice(0, 10);
    return (!promotion.startDate || day >= promotion.startDate) && (!promotion.endDate || day <= promotion.endDate);
  }
  function formatPrice(item, formatter = n => `$${n}`) {
    if (item.priceType === "consultation") return `${formatter(item.minPrice)}–${formatter(item.maxPrice)} · Pending Kia’s review`;
    if (item.priceType === "starting") return `Starting at ${formatter(item.minPrice)}`;
    if (item.priceType === "range") return `${formatter(item.minPrice)}–${formatter(item.maxPrice)}`;
    return formatter(item.minPrice);
  }
  function calculate(serviceItem, selectedAddOns = [], promotion, now = new Date()) {
    const promoPrice = promotionIsActive(promotion, now) ? promotion.prices?.[serviceItem.id] : undefined;
    const base = Number(promoPrice ?? serviceItem.minPrice ?? 0);
    const addOnTotal = selectedAddOns.reduce((sum, item) => sum + Number(item.minPrice ?? item.price ?? 0), 0);
    const total = base + addOnTotal;
    const consultation = serviceItem.priceType === "consultation";
    const deposit = depositFor(total, consultation);
    return { base, addOns: addOnTotal, total, deposit, balance: Math.max(0, total - deposit), consultation, promotional: promoPrice !== undefined };
  }

  root.BBKPricing = { services, addOns, RANGE_NOTICE, COLOR_NOTICE, WEAVE_NOTICE, depositFor, promotionIsActive, formatPrice, calculate };
})(typeof window === "undefined" ? globalThis : window);
