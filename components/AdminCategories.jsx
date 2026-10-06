"use client";

import { useEffect, useState } from "react";

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const editing = Boolean(form.id);

  async function loadCategories() {
    const response = await fetch("/api/admin/categories", {
      cache: "no-store",
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(data.error || "Could not load categories.");
    }

    setCategories(data.categories || []);
  }

  useEffect(() => {
    loadCategories().catch((err) =>
      setError(err.message || "Could not load categories.")
    );
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  function editCategory(category) {
    setForm({
      id: category.id,
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      imageUrl: category.imageUrl || "",
    });

    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveCategory(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const endpoint = editing
        ? `/api/admin/categories/${form.id}`
        : "/api/admin/categories";

      const response = await fetch(endpoint, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.error || "Could not save category.");
      }

      await loadCategories();
      setMessage(
        editing
          ? "Category updated successfully."
          : "Category created successfully."
      );
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || "Could not save category.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadCategoryImage(file) {
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError("Image size must be under 3MB.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.error || "Image upload failed.");
      }

      const url =
        data.url ||
        data.imageUrl ||
        data.path ||
        data.fileUrl ||
        "";

      if (!url) {
        throw new Error("Upload API did not return an image URL.");
      }

      setForm((prev) => ({
        ...prev,
        imageUrl: url,
      }));

      setMessage("Image uploaded. Click Save/Update Category.");
    } catch (err) {
      setError(err.message || "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteCategory(category) {
    const productCount = category._count?.products || 0;

    if (productCount > 0) {
      setError(
        `এই category-তে ${productCount}টি product আছে। আগে productগুলো অন্য category-তে move করুন।`
      );
      return;
    }

    if (!window.confirm(`"${category.name}" category delete করতে চান?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/categories/${category.id}`,
        { method: "DELETE" }
      );

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.error || "Could not delete category.");
      }

      await loadCategories();

      if (form.id === category.id) {
        setForm(emptyForm);
      }

      setMessage("Category deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete category.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="category-admin">
      <div>
        <span className="eyebrow">PRODUCT ORGANIZATION</span>
        <h1>Categories</h1>
        <p className="muted">
          Create, edit, change images and safely delete empty categories.
        </p>
      </div>

      {error && <div className="cat-alert error">{error}</div>}
      {message && <div className="cat-alert success">{message}</div>}

      <section className="cat-panel">
        <div className="cat-head">
          <h2>{editing ? "Edit Category" : "New Category"}</h2>

          {editing && (
            <button
              type="button"
              className="cat-secondary"
              onClick={resetForm}
            >
              ✕ Cancel Edit
            </button>
          )}
        </div>

        <form className="cat-form" onSubmit={saveCategory}>
          <label>
            Category Name *
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
              placeholder="leave blank to generate"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  slug: e.target.value,
                }))
              }
            />
          </label>

          <label className="wide">
            Description
            <textarea
              rows="4"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </label>

          <label className="wide">
            Image URL / Local Path
            <input
              value={form.imageUrl}
              placeholder="/uploads/category.webp"
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  imageUrl: e.target.value,
                }))
              }
            />
          </label>

          <label>
            Upload / Change Image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading}
              onChange={(e) =>
                uploadCategoryImage(e.target.files?.[0])
              }
            />
            <small className="muted">
              PNG, JPG or WebP — max 3MB
            </small>
          </label>

          <div className="cat-preview">
            <span>Preview</span>
            <img
              src={form.imageUrl || "/products/default.svg"}
              alt="Category preview"
              onError={(e) => {
                e.currentTarget.src = "/products/default.svg";
              }}
            />
          </div>

          <div className="wide cat-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || uploading}
            >
              {busy
                ? "Saving..."
                : editing
                  ? "Update Category"
                  : "Save Category"}
            </button>

            {editing && (
              <button
                type="button"
                className="cat-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="cat-panel">
        <div className="cat-head">
          <div>
            <h2>All Categories</h2>
            <p className="muted">{categories.length} categories</p>
          </div>
        </div>

        <div className="cat-grid">
          {categories.map((category) => {
            const productCount = category._count?.products || 0;

            return (
              <article key={category.id} className="cat-card">
                <div className="cat-image">
                  <img
                    src={category.imageUrl || "/products/default.svg"}
                    alt={category.name}
                    onError={(e) => {
                      e.currentTarget.src = "/products/default.svg";
                    }}
                  />
                </div>

                <div className="cat-body">
                  <div className="cat-top">
                    <div>
                      <h3>{category.name}</h3>
                      <small>/{category.slug}</small>
                    </div>

                    <span>{productCount} products</span>
                  </div>

                  {category.description && (
                    <p>{category.description}</p>
                  )}

                  <div className="cat-card-actions">
                    <button
                      type="button"
                      onClick={() => editCategory(category)}
                    >
                      ✎ Edit / Image
                    </button>

                    <button
                      type="button"
                      className="delete"
                      disabled={busy || productCount > 0}
                      onClick={() => deleteCategory(category)}
                    >
                      🗑 Delete
                    </button>
                  </div>

                  {productCount > 0 && (
                    <small className="lock">
                      Delete locked: move products first.
                    </small>
                  )}
                </div>
              </article>
            );
          })}

          {!categories.length && (
            <div className="empty">No categories found.</div>
          )}
        </div>
      </section>

      <style jsx>{`
        .category-admin{display:grid;gap:18px}
        .cat-panel{background:#fff;border:1px solid #dfe7da;border-radius:14px;padding:20px}
        .cat-head{display:flex;justify-content:space-between;gap:16px;margin-bottom:18px}
        .cat-head h2{margin:0}
        .cat-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
        .cat-form label{display:grid;gap:7px;font-weight:700}
        .cat-form input,.cat-form textarea{width:100%;border:1px solid #d8e1d4;border-radius:8px;padding:11px 12px}
        .wide{grid-column:1/-1}
        .cat-preview{min-height:130px;border:1px dashed #cbd8c6;border-radius:10px;padding:10px;display:grid;grid-template-columns:1fr 105px;align-items:center;gap:12px}
        .cat-preview img{width:105px;height:105px;object-fit:cover;border-radius:9px;background:#f1f5ed}
        .cat-actions{display:flex;gap:10px}
        .cat-secondary{border:1px solid #c8d4c4;background:#fff;color:#23472e;border-radius:7px;padding:10px 14px;font-weight:700;cursor:pointer}
        .cat-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .cat-card{border:1px solid #dfe7da;border-radius:12px;overflow:hidden;display:grid;grid-template-columns:125px 1fr;background:#fff}
        .cat-image{background:#f1f5ed;min-height:145px}
        .cat-image img{width:100%;height:100%;object-fit:cover}
        .cat-body{padding:14px;display:grid;gap:10px}
        .cat-top{display:flex;justify-content:space-between;gap:10px}
        .cat-top h3{margin:0}
        .cat-top span{background:#edf4e8;color:#235b37;border-radius:999px;padding:5px 8px;font-size:11px;font-weight:800;white-space:nowrap}
        .cat-body p{margin:0;color:#677464;font-size:13px}
        .cat-card-actions{display:flex;gap:8px;flex-wrap:wrap}
        .cat-card-actions button{border:1px solid #bfd0ba;background:#fff;border-radius:7px;padding:8px 10px;color:#235b37;font-weight:800;cursor:pointer}
        .cat-card-actions .delete{color:#a63a30;border-color:#e9c4bf}
        .cat-card-actions button:disabled{opacity:.45;cursor:not-allowed}
        .lock{color:#9b6a45}
        .cat-alert{border-radius:9px;padding:12px 14px;font-weight:700}
        .cat-alert.error{background:#fff2ef;border:1px solid #f0c9c2;color:#a63327}
        .cat-alert.success{background:#eff8ec;border:1px solid #c8dfc2;color:#235b37}
        @media(max-width:800px){.cat-form,.cat-grid{grid-template-columns:1fr}.wide{grid-column:auto}}
        @media(max-width:520px){.cat-card{grid-template-columns:90px 1fr}.cat-image{min-height:130px}.cat-top{display:grid}}
      `}</style>
    </div>
  );
}
