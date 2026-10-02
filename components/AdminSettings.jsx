'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';


import styles from './AdminSettings.module.css';

const defaultTheme = {
  primaryColor: "#235B37",
  primaryDarkColor: "#173F29",
  primaryLightColor: "#EDF4E8",
  logoUrl: "",
};

const emptyStaff = {
  name: '',
  email: '',
  phone: '',
  password: '',
  staffRole: 'Product Editor',
  staffActive: true,
  canViewProducts: true,
  canCreateProducts: false,
  canEditProducts: true,
  canDeleteProducts: false,
};

function normalizeHex(value) {
  return /^#[0-9A-F]{6}$/i.test(value || '')
    ? value.toUpperCase()
    : '';
}

function hexToRgb(hex) {
  const value = normalizeHex(hex);

  if (!value) return null;

  return {
    r: parseInt(value.slice(1, 3), 16),
    g: parseInt(value.slice(3, 5), 16),
    b: parseInt(value.slice(5, 7), 16),
  };
}

function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((value) =>
        Math.max(0, Math.min(255, value))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  ).toUpperCase();
}

function shade(hex, amount) {
  const rgb = hexToRgb(hex);

  if (!rgb) return hex;

  const target = amount < 0 ? 0 : 255;
  const ratio = Math.abs(amount);

  return rgbToHex(
    Math.round(
      rgb.r + (target - rgb.r) * ratio
    ),
    Math.round(
      rgb.g + (target - rgb.g) * ratio
    ),
    Math.round(
      rgb.b + (target - rgb.b) * ratio
    )
  );
}

export default function AdminSettings() {
  
  const [tab, setTab] = useState('theme');
  const [theme, setTheme] =
    useState(defaultTheme);

  const [staff, setStaff] = useState([]);
  const [staffForm, setStaffForm] =
    useState(emptyStaff);

  const [editingId, setEditingId] =
    useState('');

  const [busy, setBusy] = useState(false);
  const [message, setMessage] =
    useState('');
  const [error, setError] =
    useState('');

  const editing = useMemo(
    () =>
      staff.find(
        (item) => item.id === editingId
      ) || null,
    [editingId, staff]
  );

  async function readApiResponse(response, label) {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `${label}: Server returned an empty response (HTTP ${response.status})`
    );
  }

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `${label}: Server returned invalid JSON (HTTP ${response.status})`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `${label}: Request failed (HTTP ${response.status})`
    );
  }

  return data;
}

async function safeJson(response, name) {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `${name} API returned empty response - HTTP ${response.status}`
    );
  }

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `${name} API returned invalid JSON - HTTP ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `${name} request failed - HTTP ${response.status}`
    );
  }

  return data;
}

async function loadTheme() {
  try {
    const response = await fetch(
      "/api/admin/settings/theme",
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const text = await response.text();

    if (!text.trim()) {
      throw new Error(
        "Theme settings returned empty response."
      );
    }

    const data = JSON.parse(text);

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "Could not load theme settings."
      );
    }

    const savedTheme =
      data?.settings || {};

    setTheme({
      ...defaultTheme,
      primaryColor:
        savedTheme.primaryColor ||
        defaultTheme.primaryColor,

      primaryDarkColor:
        savedTheme.primaryDarkColor ||
        defaultTheme.primaryDarkColor,

      primaryLightColor:
        savedTheme.primaryLightColor ||
        defaultTheme.primaryLightColor,

      logoUrl:
        savedTheme.logoUrl || "",
    });
  } catch (err) {
    console.error(
      "Theme load error:",
      err
    );

    setError(
      err.message ||
        "Could not load theme."
    );
  }
}

async function loadStaff() {
  const response = await fetch(
    "/api/admin/settings/staff",
    {
      cache: "no-store",
    }
  );

  const data = await safeJson(
    response,
    "Staff Users"
  );

  setStaff(data.users || []);
}

  function updatePrimary(value) {
    const primary = normalizeHex(value);
    if (!primary) return;

    setTheme({
      primaryColor: primary,
      primaryDarkColor: shade(primary, -0.28),
      primaryLightColor: shade(primary, 0.87),
    });
  }

async function saveTheme() {
  setBusy(true);
  setError("");
  setMessage("");

  try {
    const response = await fetch(
      "/api/admin/settings/theme",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(theme),
      }
    );

    const text = await response.text();

    let data = {};

    if (text.trim()) {
      data = JSON.parse(text);
    }

    if (!response.ok) {
      throw new Error(
        data?.error || "Could not save theme."
      );
    }

    setTheme({
      ...defaultTheme,
      ...(data.settings || theme),
    });

    setMessage("Logo saved successfully.");
  } catch (err) {
    setError(
      err.message || "Could not save logo."
    );
  } finally {
    setBusy(false);
  }
}

  function startEdit(item) {
    setEditingId(item.id);

    setStaffForm({
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      password: '',
      staffRole:
        item.staffRole || 'Product Editor',
      staffActive:
        item.staffActive !== false,
      canViewProducts:
        Boolean(item.canViewProducts),
      canCreateProducts:
        Boolean(item.canCreateProducts),
      canEditProducts:
        Boolean(item.canEditProducts),
      canDeleteProducts:
        Boolean(item.canDeleteProducts),
    });

    setTab('staff');
    setError('');
    setMessage('');
  }

  function resetStaffForm() {
    setEditingId('');
    setStaffForm(emptyStaff);
  }

  async function saveStaff(event) {
    event.preventDefault();

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        editingId
          ? '/api/admin/settings/staff/' +
              editingId
          : '/api/admin/settings/staff',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(staffForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      await loadStaff();
      resetStaffForm();

      setMessage(
        editingId
          ? 'Staff permissions updated.'
          : 'New staff user created.'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleStaff(item) {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        '/api/admin/settings/staff/' +
          item.id,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...item,
            staffActive: !item.staffActive,
            password: '',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      await loadStaff();

      setMessage(
        data.user.staffActive
          ? 'Staff account activated.'
          : 'Staff account deactivated and signed out.'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  function handleLogoUpload(e) {
  const file = e.target.files?.[0];

  if (!file) return;

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    setError(
      "Only PNG, JPG or WebP logo allowed."
    );
    return;
  }

  if (file.size > 300 * 1024) {
    setError(
      "Logo size must be under 300 KB."
    );
    return;
  }

  setError("");

  const reader = new FileReader();

  reader.onload = () => {
    setTheme((prev) => ({
      ...prev,
      logoUrl: reader.result,
    }));
  };

  reader.readAsDataURL(file);
}




  return (
    <div className={styles.shell}>
      <div>
        <span className="eyebrow">
          STORE SETTINGS
        </span>

        <h1>Settings</h1>

        <p className="muted">
          Change the website color and manage
          restricted staff accounts.
        </p>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={
            tab === 'theme'
              ? styles.active
              : ''
          }
          onClick={() => setTab('theme')}
        >
          Theme Color
        </button>

        <button
          type="button"
          className={
            tab === 'staff'
              ? styles.active
              : ''
          }
          onClick={() => setTab('staff')}
        >
          Staff Users
        </button>
      </div>

      {error && (
        <p className="error-text">{error}</p>
      )}

      {message && (
        <p className="success-text">
          {message}
        </p>
      )}

      {tab === 'theme' && (
        <section className={styles.card}>
          <h2>Website Theme Color</h2>

          <p className="muted">
            Select the main brand color. Dark
            and light variants are generated
            automatically, but you can also
            adjust them manually.
          </p>

          <div className={styles.themeGrid}>
            <label className={styles.colorField}>
              Primary Color
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(event) =>
                  updatePrimary(
                    event.target.value
                  )
                }
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={(event) => {
                  const value =
                    normalizeHex(
                      event.target.value
                    );

                  if (value) {
                    updatePrimary(value);
                  }
                }}
              />
            </label>

            <label className={styles.colorField}>
              Dark Color
              <input
                type="color"
                value={
                  theme.primaryDarkColor
                }
                onChange={(event) =>
                  setTheme({
                    ...theme,
                    primaryDarkColor:
                      event.target.value.toUpperCase(),
                  })
                }
              />
              <input
                type="text"
                value={
                  theme.primaryDarkColor
                }
                onChange={(event) => {
                  const value =
                    normalizeHex(
                      event.target.value
                    );

                  if (value) {
                    setTheme({
                      ...theme,
                      primaryDarkColor: value,
                    });
                  }
                }}
              />
            </label>

            <label className={styles.colorField}>
              Light Color
              <input
                type="color"
                value={
                  theme.primaryLightColor
                }
                onChange={(event) =>
                  setTheme({
                    ...theme,
                    primaryLightColor:
                      event.target.value.toUpperCase(),
                  })
                }
              />
              <input
                type="text"
                value={
                  theme.primaryLightColor
                }
                onChange={(event) => {
                  const value =
                    normalizeHex(
                      event.target.value
                    );

                  if (value) {
                    setTheme({
                      ...theme,
                      primaryLightColor: value,
                    });
                  }
                }}
              />
            </label>
          </div>

          <div className={styles.preview}>
            <div
              className={styles.previewHeader}
              style={{
                background:
                  theme.primaryDarkColor,
              }}
            >
              ARONE BD Theme Preview
            </div>

            <div
              className={styles.previewBody}
              style={{
                background:
                  theme.primaryLightColor,
              }}
            >
              <span
                className={
                  styles.previewButton
                }
                style={{
                  background:
                    theme.primaryColor,
                }}
              >
                Example Button
              </span>
            </div>
          </div>

          <p style={{ marginTop: 15 }}>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy}
              onClick={saveTheme}
            >
              {busy
                ? 'Saving...'
                : 'Save Theme'}
            </button>
          </p>

          <div className="admin-logo-setting">
            <h3>Website Logo</h3>

            <p className="muted">
              Frontend-এ যে logo দেখাবে সেটি এখান থেকে পরিবর্তন করুন।
            </p>

            <label>
              Logo URL / Local Image Path

              <input
                type="text"
                value={theme.logoUrl || ''}
                placeholder="/uploads/arone-logo.webp"
                onChange={(event) =>
                  setTheme((prev) => ({
                    ...prev,
                    logoUrl: event.target.value,
                  }))
                }
              />
            </label>

            {theme.logoUrl && (
              <div className="admin-logo-preview">
                <img
                  src={theme.logoUrl}
                  alt="Website Logo Preview"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'staff' && (
        <section className={styles.card}>
          <h2>
            {editing
              ? 'Edit Staff User'
              : 'Add New Staff User'}
          </h2>

          <p className="muted">
            Staff permissions are enforced by
            the server API. Hiding a button is
            not the only protection.
          </p>

          <form
            className={styles.staffForm}
            onSubmit={saveStaff}
          >
            <label>
              Name *
              <input
                required
                value={staffForm.name}
                onChange={(event) =>
                  setStaffForm({
                    ...staffForm,
                    name: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Email *
              <input
                required
                type="email"
                disabled={Boolean(editingId)}
                value={staffForm.email}
                onChange={(event) =>
                  setStaffForm({
                    ...staffForm,
                    email: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Phone
              <input
                value={staffForm.phone}
                onChange={(event) =>
                  setStaffForm({
                    ...staffForm,
                    phone: event.target.value,
                  })
                }
              />
            </label>

            <label>
              {editingId
                ? 'New Password (optional)'
                : 'Password *'}

              <input
                required={!editingId}
                type="password"
                minLength={10}
                value={staffForm.password}
                onChange={(event) =>
                  setStaffForm({
                    ...staffForm,
                    password:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              Staff Role Name
              <select
                value={staffForm.staffRole}
                onChange={(event) => {
                  const role =
                    event.target.value;

                  if (role === 'Viewer') {
                    setStaffForm({
                      ...staffForm,
                      staffRole: role,
                      canViewProducts: true,
                      canCreateProducts: false,
                      canEditProducts: false,
                      canDeleteProducts: false,
                    });
                  } else if (
                    role === 'Product Editor'
                  ) {
                    setStaffForm({
                      ...staffForm,
                      staffRole: role,
                      canViewProducts: true,
                      canCreateProducts: false,
                      canEditProducts: true,
                      canDeleteProducts: false,
                    });
                  } else if (
                    role === 'Product Manager'
                  ) {
                    setStaffForm({
                      ...staffForm,
                      staffRole: role,
                      canViewProducts: true,
                      canCreateProducts: true,
                      canEditProducts: true,
                      canDeleteProducts: true,
                    });
                  } else {
                    setStaffForm({
                      ...staffForm,
                      staffRole: role,
                    });
                  }
                }}
              >
                <option>Viewer</option>
                <option>Product Editor</option>
                <option>Product Manager</option>
                <option>Custom</option>
              </select>
            </label>

            {editingId && (
              <label>
                Account Status
                <select
                  value={
                    staffForm.staffActive
                      ? 'active'
                      : 'disabled'
                  }
                  onChange={(event) =>
                    setStaffForm({
                      ...staffForm,
                      staffActive:
                        event.target.value ===
                        'active',
                    })
                  }
                >
                  <option value="active">
                    Active
                  </option>
                  <option value="disabled">
                    Disabled
                  </option>
                </select>
              </label>
            )}

            <div className={styles.permissionBox}>
              <label>
                <input
                  type="checkbox"
                  checked={
                    staffForm.canViewProducts
                  }
                  onChange={(event) =>
                    setStaffForm({
                      ...staffForm,
                      canViewProducts:
                        event.target.checked,
                      staffRole: 'Custom',
                    })
                  }
                />
                View Products
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={
                    staffForm.canCreateProducts
                  }
                  onChange={(event) =>
                    setStaffForm({
                      ...staffForm,
                      canCreateProducts:
                        event.target.checked,
                      canViewProducts:
                        event.target.checked
                          ? true
                          : staffForm.canViewProducts,
                      staffRole: 'Custom',
                    })
                  }
                />
                Add Products
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={
                    staffForm.canEditProducts
                  }
                  onChange={(event) =>
                    setStaffForm({
                      ...staffForm,
                      canEditProducts:
                        event.target.checked,
                      canViewProducts:
                        event.target.checked
                          ? true
                          : staffForm.canViewProducts,
                      staffRole: 'Custom',
                    })
                  }
                />
                Edit Products
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={
                    staffForm.canDeleteProducts
                  }
                  onChange={(event) =>
                    setStaffForm({
                      ...staffForm,
                      canDeleteProducts:
                        event.target.checked,
                      canViewProducts:
                        event.target.checked
                          ? true
                          : staffForm.canViewProducts,
                      staffRole: 'Custom',
                    })
                  }
                />
                Delete / Archive Products
              </label>
            </div>

            <div
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <button
                className="btn btn-primary"
                disabled={busy}
              >
                {busy
                  ? 'Saving...'
                  : editingId
                  ? 'Update Staff'
                  : 'Create Staff'}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetStaffForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="admin-logo-setting">
  <h3>Website Logo</h3>

  <p className="muted">
    Frontend-এ যে logo দেখাবে সেটি এখান থেকে পরিবর্তন করুন।
  </p>

  <label>
    Upload Logo

    <input
      type="file"
      accept="image/png,image/jpeg,image/webp"
      onChange={handleLogoUpload}
    />
  </label>

  <p
    style={{
      fontSize: "13px",
      color: "#777",
      marginTop: "6px",
    }}
  >
    PNG, JPG বা WebP — সর্বোচ্চ 300 KB
  </p>

  <div
    style={{
      marginTop: "18px",
    }}
  >
    <label>
      অথবা Logo URL / Local Image Path

      <input
        type="text"
        value={
          theme.logoUrl?.startsWith("data:image/")
            ? ""
            : theme.logoUrl || ""
        }
        placeholder="/uploads/arone-logo.webp"
        onChange={(e) =>
          setTheme((prev) => ({
            ...prev,
            logoUrl: e.target.value,
          }))
        }
      />
    </label>
  </div>

  {theme.logoUrl && (
    <div className="admin-logo-preview">
      <img
        src={theme.logoUrl}
        alt="Website Logo Preview"
      />
    </div>
  )}

  {theme.logoUrl && (
    <button
      type="button"
      onClick={() =>
        setTheme((prev) => ({
          ...prev,
          logoUrl: "",
        }))
      }
      style={{
        marginTop: "12px",
      }}
    >
      Remove Logo
    </button>
    

  )}
  <button
  type="button"
  onClick={saveTheme}
  disabled={busy}
  style={{
    marginTop: "16px",
    padding: "12px 22px",
    border: "0",
    borderRadius: "8px",
    background: "#20c75b",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  }}
>
  {busy ? "Saving..." : "Save Logo"}
</button>
</div>
        </section>
      )}
    </div>
  );
}