"use client";

import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  price: "",
  compareAtPrice: "",
  stock: "10",
  categoryId: "",
  description: "",
  imageUrl: "",
  imageUrls: [],
  featured: false,
  active: true,
};

export default function AdminProductsEnhanced() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [permissions, setPermissions] = useState({
    view: false,
    create: false,
    edit: false,
    delete: false,
  });

  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const editing = Boolean(form.id);

  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) =>
        String(a.name || "").localeCompare(
          String(b.name || "")
        )
      ),
    [products]
  );

  async function load() {
    const response = await fetch(
      "/api/admin/product-manager",
      { cache: "no-store" }
    );

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(
        data.error || "Could not load products."
      );
    }

    setProducts(data.products || []);
    setCategories(data.categories || []);
    setPermissions(
      data.permissions || {
        view: false,
        create: false,
        edit: false,
        delete: false,
      }
    );
  }

  useEffect(() => {
    load().catch((err) =>
      setError(
        err.message || "Could not load products."
      )
    );
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  function editProduct(product) {
    const gallery =
      product.images?.map((item) => item.imageUrl) || [];

    const imageUrls = gallery.length
      ? gallery
      : product.imageUrl &&
          product.imageUrl !== "/products/default.svg"
        ? [product.imageUrl]
        : [];

    setForm({
      id: product.id,
      name: product.name || "",
      slug: product.slug || "",
      price: String(product.price ?? ""),
      compareAtPrice:
        product.compareAtPrice === null ||
        product.compareAtPrice === undefined
          ? ""
          : String(product.compareAtPrice),
      stock: String(product.stock ?? 0),
      categoryId: product.categoryId || "",
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      imageUrls,
      featured: Boolean(product.featured),
      active: Boolean(product.active),
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function uploadOne(file) {
    const body = new FormData();
    body.append("file", file);

    const response = await fetch(
      "/api/admin/product-manager/upload",
      {
        method: "POST",
        body,
      }
    );

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(
        data.error || "Image upload failed."
      );
    }

    if (!data.url) {
      throw new Error(
        "Upload completed but no image URL was returned."
      );
    }

    return data.url;
  }

  async function uploadMultiple(files) {
    const list = Array.from(files || []);

    if (!list.length) return;

    const remaining =
      Math.max(0, 12 - form.imageUrls.length);

    if (!remaining) {
      setError(
        "Maximum 12 gallery images are allowed."
      );
      return;
    }

    const selected = list.slice(0, remaining);

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const uploaded = [];

      for (const file of selected) {
        if (file.size > 3 * 1024 * 1024) {
          throw new Error(
            `${file.name} is larger than 3MB.`
          );
        }

        const url = await uploadOne(file);
        uploaded.push(url);
      }

      setForm((prev) => {
        const imageUrls = [
          ...prev.imageUrls,
          ...uploaded,
        ];

        return {
          ...prev,
          imageUrls,
          imageUrl:
            prev.imageUrl &&
            prev.imageUrl !== "/products/default.svg"
              ? prev.imageUrl
              : imageUrls[0] || "",
        };
      });

      setMessage(
        `${uploaded.length} image(s) uploaded. Save the product to keep them.`
      );
    } catch (err) {
      setError(
        err.message || "Could not upload images."
      );
    } finally {
      setUploading(false);
    }
  }

  function removeGalleryImage(url) {
    setForm((prev) => {
      const next = prev.imageUrls.filter(
        (item) => item !== url
      );

      return {
        ...prev,
        imageUrls: next,
        imageUrl:
          prev.imageUrl === url
            ? next[0] || ""
            : prev.imageUrl,
      };
    });
  }

  function makeCover(url) {
    setForm((prev) => ({
      ...prev,
      imageUrl: url,
    }));
  }

  async function saveProduct(event) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const endpoint = editing
        ? `/api/admin/product-manager/${form.id}`
        : "/api/admin/product-manager";

      const response = await fetch(endpoint, {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          price: form.price,
          compareAtPrice: form.compareAtPrice,
          stock: form.stock,
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(
          data.error || "Could not save product."
        );
      }

      await load();

      setMessage(
        editing
          ? "Product updated successfully."
          : "Product created successfully."
      );

      setForm(emptyForm);
    } catch (err) {
      setError(
        err.message || "Could not save product."
      );
    } finally {
      setBusy(false);
    }
  }

  async function archiveProduct(product) {
    if (!permissions.edit) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compareAtPrice:
          product.compareAtPrice ?? "",
        stock: product.stock,
        categoryId: product.categoryId,
        description:
          product.description || "",
        imageUrl: product.imageUrl || "",
        imageUrls:
          product.images?.map(
            (item) => item.imageUrl
          ) || [],
        featured: Boolean(
          product.featured
        ),
        active: false,
      };

      const response = await fetch(
        `/api/admin/product-manager/${product.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(
          data.error || "Could not archive product."
        );
      }

      await load();
      setMessage("Product archived.");
    } catch (err) {
      setError(
        err.message ||
          "Could not archive product."
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product) {
    if (!permissions.delete) return;

    const typed = window.prompt(
      `Permanent delete করতে product name হুবহু লিখুন:\n\n${product.name}`
    );

    if (typed === null) return;

    if (typed !== product.name) {
      setError(
        "Product name did not match. Delete cancelled."
      );
      return;
    }

    const yes = window.confirm(
      `WARNING: "${product.name}" permanently delete হবে। এটি undo করা যাবে না। Continue?`
    );

    if (!yes) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/product-manager/${product.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            confirmName: typed,
          }),
        }
      );

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not permanently delete product."
        );
      }

      await load();

      if (form.id === product.id) {
        setForm(emptyForm);
      }

      setMessage(
        "Product permanently deleted."
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not permanently delete product."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pm-page">
      <div className="pm-title">
        <div>
          <span className="eyebrow">
            PRODUCT MANAGEMENT
          </span>
          <h1>Products</h1>
          <p className="muted">
            Upload multiple images, choose a
            cover, edit, archive or permanently
            delete unused products.
          </p>
        </div>
      </div>

      {error && (
        <div className="pm-alert error">
          {error}
        </div>
      )}

      {message && (
        <div className="pm-alert success">
          {message}
        </div>
      )}

      {(permissions.create ||
        (editing && permissions.edit)) && (
        <section className="pm-panel">
          <div className="pm-panel-head">
            <h2>
              {editing
                ? "Edit Product"
                : "New Product"}
            </h2>

            {editing && (
              <button
                type="button"
                className="pm-secondary"
                onClick={resetForm}
              >
                ✕ Close
              </button>
            )}
          </div>

          <form
            className="pm-form"
            onSubmit={saveProduct}
          >
            <label>
              Product Name *
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </label>

            <label>
              Slug
              <input
                value={form.slug}
                placeholder="leave blank to generate from name"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    slug: e.target.value,
                  }))
                }
              />
            </label>

            <label>
              Selling Price (৳) *
              <input
                required
                type="number"
                min="0"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    price: e.target.value,
                  }))
                }
              />
            </label>

            <label>
              Compare-at Price (৳)
              <input
                type="number"
                min="0"
                value={form.compareAtPrice}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    compareAtPrice:
                      e.target.value,
                  }))
                }
              />
            </label>

            <label>
              Stock *
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    stock: e.target.value,
                  }))
                }
              />
            </label>

            <label>
              Category *
              <select
                required
                value={form.categoryId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    categoryId:
                      e.target.value,
                  }))
                }
              >
                <option value="">
                  Select category
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="wide">
              Description
              <textarea
                rows="6"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description:
                      e.target.value,
                  }))
                }
              />
            </label>

            <label className="wide">
              Main Image URL / Local Path
              <input
                value={form.imageUrl}
                placeholder="/uploads/products/example.webp"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    imageUrl:
                      e.target.value,
                  }))
                }
              />
            </label>

            <label className="wide">
              Upload Multiple Images
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  uploadMultiple(
                    e.target.files
                  );
                  e.target.value = "";
                }}
              />
              <small className="muted">
                একসাথে একাধিক image select করুন।
                প্রতি image max 3MB, সর্বোচ্চ 12টি।
              </small>
            </label>

            {uploading && (
              <div className="wide pm-uploading">
                Uploading images...
              </div>
            )}

            {form.imageUrls.length > 0 && (
              <div className="wide">
                <div className="pm-gallery-title">
                  <b>
                    Product Gallery (
                    {form.imageUrls.length})
                  </b>
                  <span>
                    Cover image-এ “Main” badge থাকবে।
                  </span>
                </div>

                <div className="pm-gallery">
                  {form.imageUrls.map(
                    (url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className={
                          form.imageUrl === url
                            ? "pm-image-card main"
                            : "pm-image-card"
                        }
                      >
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                        />

                        {form.imageUrl ===
                          url && (
                          <span className="pm-main-badge">
                            Main
                          </span>
                        )}

                        <div className="pm-image-actions">
                          <button
                            type="button"
                            onClick={() =>
                              makeCover(url)
                            }
                          >
                            Set Main
                          </button>

                          <button
                            type="button"
                            className="remove"
                            onClick={() =>
                              removeGalleryImage(
                                url
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <label className="pm-check">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    featured:
                      e.target.checked,
                  }))
                }
              />
              Featured Product
            </label>

            <label className="pm-check">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    active:
                      e.target.checked,
                  }))
                }
              />
              Visible in Store
            </label>

            <div className="wide pm-form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  busy || uploading
                }
              >
                {busy
                  ? "Saving..."
                  : editing
                    ? "Update Product"
                    : "Save Product"}
              </button>

              {editing && (
                <button
                  type="button"
                  className="pm-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <section className="pm-panel">
        <div className="pm-panel-head">
          <div>
            <h2>All Products</h2>
            <p className="muted">
              {products.length} products
            </p>
          </div>
        </div>

        <div className="pm-products">
          {sortedProducts.map((product) => (
            <article
              key={product.id}
              className="pm-product-card"
            >
              <img
                src={
                  product.imageUrl ||
                  product.images?.[0]?.imageUrl ||
                  "/products/default.svg"
                }
                alt={product.name}
              />

              <div className="pm-product-body">
                <div className="pm-product-top">
                  <div>
                    <h3>{product.name}</h3>
                    <small>
                      {product.category?.name ||
                        "No category"}
                    </small>
                  </div>

                  <span
                    className={
                      product.active
                        ? "pm-status active"
                        : "pm-status archived"
                    }
                  >
                    {product.active
                      ? "Active"
                      : "Archived"}
                  </span>
                </div>

                <div className="pm-meta">
                  <span>
                    ৳{product.price}
                  </span>
                  <span>
                    Stock: {product.stock}
                  </span>
                  <span>
                    Images:{" "}
                    {product.images?.length ||
                      (product.imageUrl ? 1 : 0)}
                  </span>
                </div>

                <div className="pm-product-actions">
                  {permissions.edit && (
                    <button
                      type="button"
                      onClick={() =>
                        editProduct(product)
                      }
                    >
                      ✎ Edit
                    </button>
                  )}

                  {permissions.edit &&
                    product.active && (
                      <button
                        type="button"
                        onClick={() =>
                          archiveProduct(product)
                        }
                      >
                        Archive
                      </button>
                    )}

                  {permissions.delete && (
                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        deleteProduct(product)
                      }
                    >
                      🗑 Delete Permanently
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {!sortedProducts.length && (
            <div className="empty">
              No products found.
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .pm-page{display:grid;gap:18px}
        .pm-panel{background:#fff;border:1px solid #dfe7da;border-radius:14px;padding:20px}
        .pm-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:18px}
        .pm-panel-head h2{margin:0}
        .pm-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
        .pm-form label{display:grid;gap:7px;font-weight:700}
        .pm-form input,.pm-form textarea,.pm-form select{width:100%;border:1px solid #d8e1d4;border-radius:8px;padding:11px 12px;background:#fff}
        .wide{grid-column:1/-1}
        .pm-check{display:flex!important;align-items:center;gap:8px}
        .pm-check input{width:auto}
        .pm-form-actions{display:flex;gap:10px;flex-wrap:wrap}
        .pm-secondary{border:1px solid #c8d4c4;background:#fff;color:#23472e;border-radius:7px;padding:10px 14px;font-weight:700;cursor:pointer}
        .pm-alert{padding:12px 14px;border-radius:9px;font-weight:700}
        .pm-alert.error{background:#fff2ef;border:1px solid #f0c9c2;color:#a63327}
        .pm-alert.success{background:#eff8ec;border:1px solid #c8dfc2;color:#235b37}
        .pm-uploading{padding:10px;border-radius:8px;background:#f4f7f1;color:#235b37;font-weight:700}
        .pm-gallery-title{display:flex;justify-content:space-between;gap:15px;margin-bottom:10px}
        .pm-gallery-title span{color:#6f7b6b;font-size:12px}
        .pm-gallery{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
        .pm-image-card{position:relative;border:1px solid #d8e1d4;border-radius:10px;padding:7px;background:#fff}
        .pm-image-card.main{border:2px solid #235b37}
        .pm-image-card img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:7px;background:#f1f4ed}
        .pm-main-badge{position:absolute;top:12px;left:12px;background:#235b37;color:#fff;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:800}
        .pm-image-actions{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px}
        .pm-image-actions button{border:1px solid #cbd7c7;background:#fff;border-radius:6px;padding:6px;font-size:11px;font-weight:700}
        .pm-image-actions .remove{color:#a63327;border-color:#e9c4bf}
        .pm-products{display:grid;gap:12px}
        .pm-product-card{display:grid;grid-template-columns:100px 1fr;gap:14px;border:1px solid #e0e7dc;border-radius:11px;padding:12px}
        .pm-product-card>img{width:100px;height:100px;object-fit:cover;border-radius:9px;background:#f1f4ed}
        .pm-product-body{display:grid;gap:10px}
        .pm-product-top{display:flex;justify-content:space-between;gap:12px}
        .pm-product-top h3{margin:0 0 3px}
        .pm-product-top small{color:#758171}
        .pm-status{padding:5px 9px;border-radius:999px;font-size:11px;font-weight:800;height:max-content}
        .pm-status.active{background:#eaf5e5;color:#235b37}
        .pm-status.archived{background:#f3f0e9;color:#7b6848}
        .pm-meta{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:#586555}
        .pm-product-actions{display:flex;gap:8px;flex-wrap:wrap}
        .pm-product-actions button{border:1px solid #bfd0ba;background:#fff;border-radius:7px;padding:8px 11px;color:#235b37;font-weight:800;cursor:pointer}
        .pm-product-actions .danger{color:#a63327;border-color:#e3b5af;background:#fff6f4}
        @media(max-width:900px){.pm-gallery{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:700px){.pm-form{grid-template-columns:1fr}.wide{grid-column:auto}.pm-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.pm-gallery-title{display:grid}.pm-product-card{grid-template-columns:76px 1fr}.pm-product-card>img{width:76px;height:76px}}
      `}</style>
    </div>
  );
}
