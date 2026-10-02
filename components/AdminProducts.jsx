'use client';

import { useEffect, useMemo, useState } from 'react';
import { money } from '@/lib/format';

const empty = {
  name: '',
  slug: '',
  description: '',
  price: '',
  compareAtPrice: '',
  stock: 10,
  expectedStock: null,
  categoryId: '',
  imageUrl: '/products/default.svg',
  featured: false,
  active: true,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [me, setMe] = useState(null);

  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [term, setTerm] = useState('');

  const isAdmin = me?.role === 'ADMIN';

  const permissions = useMemo(
    () => ({
      view: isAdmin || Boolean(me?.canViewProducts),
      create: isAdmin || Boolean(me?.canCreateProducts),
      edit: isAdmin || Boolean(me?.canEditProducts),
      remove: isAdmin || Boolean(me?.canDeleteProducts),
    }),
    [isAdmin, me]
  );

  async function load() {
    const [productResponse, categoryResponse, meResponse] =
      await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
        fetch('/api/auth/me'),
      ]);

    const [productData, categoryData, meData] =
      await Promise.all([
        productResponse.json(),
        categoryResponse.json(),
        meResponse.json(),
      ]);

    if (!productResponse.ok) {
      throw new Error(
        productData.error || 'Could not load products.'
      );
    }

    setProducts(productData.products || []);
    setCategories(categoryData.categories || []);
    setMe(meData.user || null);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err.message || 'Could not load products.')
    );
  }, []);

  function create() {
    if (!permissions.create) return;

    setEditing('');
    setForm({
      ...empty,
      categoryId: categories[0]?.id || '',
    });
    setError('');
    setShow(true);
  }

  function edit(product) {
    if (!permissions.edit) return;

    setEditing(product.id);

    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? '',
      stock: product.stock,
      expectedStock: product.stock,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      featured: product.featured,
      active: product.active,
    });

    setError('');
    setShow(true);
  }

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!permissions.create && !permissions.edit) {
      setError('You do not have permission to upload images.');
      return;
    }

    setError('');
    setBusy(true);

    const payload = new FormData();
    payload.set('image', file);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setForm((current) => ({
        ...current,
        imageUrl: data.url,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function save(event) {
    event.preventDefault();

    if (editing && !permissions.edit) return;
    if (!editing && !permissions.create) return;

    setBusy(true);
    setError('');

    try {
      const response = await fetch(
        editing
          ? '/api/admin/products/' + editing
          : '/api/admin/products',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...form,
            price: Number(form.price),
            stock: Number(form.stock),
            compareAtPrice:
              form.compareAtPrice === ''
                ? null
                : Number(form.compareAtPrice),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setShow(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function archive(product) {
    if (!permissions.remove) return;

    if (
      !confirm(
        `Hide "${product.name}" from the storefront?`
      )
    ) {
      return;
    }

    const response = await fetch(
      '/api/admin/products/' + product.id,
      { method: 'DELETE' }
    );

    if (response.ok) {
      load();
    } else {
      const data = await response
        .json()
        .catch(() => ({}));

      setError(
        data.error || 'Could not archive product.'
      );
    }
  }

  return (
    <>
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">
            INVENTORY CONTROL
          </span>

          <h1>Product Management</h1>

          <p className="muted">
            {permissions.edit
              ? 'View and edit the products you are allowed to manage.'
              : 'View products assigned to your staff access.'}
          </p>
        </div>

        {permissions.create && (
          <button
            className="btn btn-primary"
            onClick={create}
          >
            ＋ Add Product
          </button>
        )}
      </div>

      {!permissions.remove && me?.role === 'STAFF' && (
        <p className="tiny-muted">
          Your staff account cannot delete or archive products.
        </p>
      )}

      <div className="admin-search">
        <input
          value={term}
          onChange={(event) =>
            setTerm(event.target.value)
          }
          placeholder="Search by product name..."
        />
      </div>

      {error && !show && (
        <p className="error-text">{error}</p>
      )}

      {show && (
        <form
          className="panel admin-form"
          onSubmit={save}
        >
          <div className="section-heading compact">
            <h2>
              {editing ? 'Edit Product' : 'New Product'}
            </h2>

            <button
              type="button"
              onClick={() => setShow(false)}
            >
              ✕ Close
            </button>
          </div>

          <div className="form-grid">
            <label>
              Product Name *
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Slug (leave blank to generate from name)
              <input
                value={form.slug}
                onChange={(event) =>
                  setForm({
                    ...form,
                    slug: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Selling Price (৳) *
              <input
                required
                type="number"
                min="1"
                value={form.price}
                onChange={(event) =>
                  setForm({
                    ...form,
                    price: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Compare-at Price (৳)
              <input
                type="number"
                min="1"
                value={form.compareAtPrice}
                onChange={(event) =>
                  setForm({
                    ...form,
                    compareAtPrice:
                      event.target.value,
                  })
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
                onChange={(event) =>
                  setForm({
                    ...form,
                    stock: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Category *
              <select
                required
                value={form.categoryId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    categoryId:
                      event.target.value,
                  })
                }
              >
                <option value="">
                  Select a category
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
                rows="4"
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
              />
            </label>

            <label className="wide">
              Image URL (HTTPS or local path)
              <input
                value={form.imageUrl}
                onChange={(event) =>
                  setForm({
                    ...form,
                    imageUrl: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Upload Image (max 3MB)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={upload}
              />
            </label>

            <div className="admin-preview">
              <img
                src={
                  form.imageUrl ||
                  '/products/default.svg'
                }
                alt="Preview"
              />
            </div>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  setForm({
                    ...form,
                    featured:
                      event.target.checked,
                  })
                }
              />
              Featured Product
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm({
                    ...form,
                    active: event.target.checked,
                  })
                }
              />
              Visible in Store
            </label>
          </div>

          {error && (
            <p className="error-text">{error}</p>
          )}

          <button
            className="btn btn-primary"
            disabled={busy}
          >
            {busy ? 'Saving...' : 'Save Product'}
          </button>
        </form>
      )}

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products
              .filter((product) =>
                product.name
                  .toLowerCase()
                  .includes(term.toLowerCase())
              )
              .map((product) => (
                <tr key={product.id}>
                  <td>
                    <img
                      className="table-thumb"
                      src={product.imageUrl}
                      alt=""
                    />
                  </td>

                  <td>
                    <b>{product.name}</b>
                    <small>
                      {product.category?.name}
                    </small>
                  </td>

                  <td>
                    {money(product.price, 'en-BD')}
                  </td>

                  <td>{product.stock}</td>

                  <td>
                    <span className="status">
                      {product.active
                        ? 'Active'
                        : 'Hidden'}
                    </span>
                  </td>

                  <td>
                    <div className="inline-actions">
                      {permissions.edit && (
                        <button
                          onClick={() =>
                            edit(product)
                          }
                        >
                          Edit
                        </button>
                      )}

                      {permissions.remove && (
                        <button
                          className="danger-text"
                          onClick={() =>
                            archive(product)
                          }
                          disabled={!product.active}
                        >
                          Archive
                        </button>
                      )}

                      {!permissions.edit &&
                        !permissions.remove && (
                          <span className="tiny-muted">
                            View only
                          </span>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
