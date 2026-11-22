import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:5001/api/auth";
const PRODUCT_URL = "http://localhost:5001/api/products";
const SERVER_URL="http://localhost:5001";
const initialForm = {
  fullName: "",
  studentId: "",
  email: "",
  password: "",
  department: "AIML",
  year: "2nd Year"
};

const initialProduct = {
  name: "",
  description: "",
  price: "",
  category: "",
  image: "",
  condition: "Good",
  listingType: "Sell"
};

function App() {
  const [isLogin, setIsLogin] = useState(true);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [form, setForm] = useState(initialForm);
  const [productForm, setProductForm] = useState(initialProduct);
const [imagePreview, setImagePreview] = useState("");
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);

  const [showSell, setShowSell] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showMyProducts, setShowMyProducts] = useState(false);

  // Login form changes
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Product form changes
  const handleProductChange = (e) => {
    setProductForm({
      ...productForm,
      [e.target.name]: e.target.value
    });
  };
// Handle product image upload
const handleProductImageChange = (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image.");
    return;
  }

  if (file.size > 3 * 1024 * 1024) {
    alert("Please select an image smaller than 3 MB.");
    return;
  }

  setProductForm((prev) => ({
    ...prev,
    image: file
  }));

  const reader = new FileReader();

  reader.onloadend = () => {
    setImagePreview(reader.result);
  };

  reader.readAsDataURL(file);
};
  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch(PRODUCT_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load products");
      }

      setProducts(
        Array.isArray(data) ? data : data.products || []
      );
    } catch (error) {
      console.error(error);
      setMessage("Unable to load products. Check your backend.");
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  // Login and Registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/login" : "/register";

      const response = await fetch(API_URL + endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          isLogin
            ? {
                email: form.email,
                password: form.password
              }
            : form
        )
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (isLogin) {
        if (!data.user || !data.user._id) {
          throw new Error("Login response is missing user ID.");
        }

        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage("Login successful!");
      } else {
        setMessage("Registration successful! Please login.");
        setIsLogin(true);
        setForm(initialForm);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add Product
  const handleProductSubmit = async (e) => {
  e.preventDefault();

  if (!user || !user._id) {
    alert("Please login again.");
    return;
  }

  setProductLoading(true);

  try {
    const formData = new FormData();

    formData.append("name", productForm.name);
    formData.append("description", productForm.description);
    formData.append("price", Number(productForm.price) || 0);
    formData.append("category", productForm.category);
    formData.append("condition", productForm.condition);
    formData.append("listingType", productForm.listingType);
    formData.append("seller", user._id);

    if (productForm.image) {
      formData.append("image", productForm.image);
    }

    const response = await fetch(PRODUCT_URL + "/add", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Product could not be added");
    }

    alert("Product added successfully!");

    setProductForm(initialProduct);
    setImagePreview("");
    setShowSell(false);
    setActiveCategory("All");
    setShowMyProducts(false);

    await fetchProducts();

  } catch (error) {
    alert(error.message);
  } finally {
    setProductLoading(false);
  }
};

  // Delete Product
  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(PRODUCT_URL + "/" + id, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Delete failed");
      }

      alert("Product deleted successfully!");
      await fetchProducts();

    } catch (error) {
      alert(error.message);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("user");

    setUser(null);
    setProducts([]);
    setShowSell(false);
    setSearch("");
    setMessage("");
    setForm(initialForm);
  };

  // Check product owner
  const isMyProduct = (product) => {
    const sellerId =
      product.seller?._id || product.seller;

    return String(sellerId) === String(user?._id);
  };

  // Filter and Search
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "All" ||
      product.listingType === activeCategory;

    const matchesSearch =
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.category?.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase());

    const matchesOwner =
      !showMyProducts || isMyProduct(product);

    return matchesCategory && matchesSearch && matchesOwner;
  });

  // Contact Seller
  const contactSeller = (email, productName) => {
    if (!email) {
      alert("Seller contact information is not available.");
      return;
    }

    window.location.href =
      `mailto:${email}?subject=${encodeURIComponent(
        "Interested in " + productName
      )}&body=${encodeURIComponent(
        "Hello, I am interested in your product: " + productName
      )}`;
  };

  // Dashboard
  if (user) {
    return (
      <div className="dashboard">

        {/* Navbar */}
        <nav className="navbar">
          <div className="brand">
            <span className="brand-icon">🎓</span>
            <h2>CampusConnect</h2>
          </div>

          <div className="nav-right">
            <span className="nav-user">
              Hi, {user.fullName}
            </span>

            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </nav>

        {/* Welcome Section */}
        <section className="welcome-section">
          <div className="welcome-content">
            <span className="welcome-tag">STUDENT MARKETPLACE</span>

            <h1>
              Welcome, <span>{user.fullName}!</span>
            </h1>

            <p>
              Discover, buy, sell and exchange items
              with your fellow college students.
            </p>

            <button
              className="primary-btn"
              onClick={() => {
                setShowSell(true);
                setShowMyProducts(false);
              }}
            >
              + Sell Your Product
            </button>
          </div>

          <div className="welcome-art">🛍️</div>
        </section>

        {/* Student Information */}
        <section className="student-info">
          <div>
            <span>Student ID</span>
            <h3>{user.studentId}</h3>
          </div>

          <div>
            <span>Department</span>
            <h3>{user.department}</h3>
          </div>

          <div>
            <span>Academic Year</span>
            <h3>{user.year}</h3>
          </div>

          <div>
            <span>Total Products</span>
            <h3>{products.length}</h3>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="features">
          <div
            className="feature-card buy-card"
            onClick={() => {
              setActiveCategory("Sell");
              setShowSell(false);
              setShowMyProducts(false);
            }}
          >
            <div className="feature-icon">🛒</div>
            <h3>Buy Items</h3>
            <p>Find useful products from students.</p>
          </div>

          <div
            className="feature-card sell-card"
            onClick={() => {
              setShowSell(true);
              setShowMyProducts(false);
            }}
          >
            <div className="feature-icon">💰</div>
            <h3>Sell Items</h3>
            <p>Sell your unused products easily.</p>
          </div>

          <div
            className="feature-card free-card"
            onClick={() => {
              setActiveCategory("Free");
              setShowSell(false);
              setShowMyProducts(false);
            }}
          >
            <div className="feature-icon">🎁</div>
            <h3>Free Items</h3>
            <p>Discover products shared for free.</p>
          </div>

          <div
            className="feature-card exchange-card"
            onClick={() => {
              setActiveCategory("Exchange");
              setShowSell(false);
              setShowMyProducts(false);
            }}
          >
            <div className="feature-icon">🔄</div>
            <h3>Exchange</h3>
            <p>Exchange items with fellow students.</p>
          </div>
        </section>

        {/* Sell Product Form */}
        {showSell && (
          <section className="sell-section">
            <div className="section-heading">
              <div>
                <span className="section-tag">START SELLING</span>
                <h2>List Your Product</h2>
                <p>Share your product with your campus community.</p>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowSell(false)}
              >
                ✕
              </button>
            </div>

            <form
              className="product-form"
              onSubmit={handleProductSubmit}
            >
              <label>Product Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter product name"
                value={productForm.name}
                onChange={handleProductChange}
                required
              />

              <label>Description</label>
              <textarea
                name="description"
                placeholder="Describe your product"
                value={productForm.description}
                onChange={handleProductChange}
                required
              />

              <div className="form-grid">
                <div>
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    placeholder="Enter 0 for free"
                    value={productForm.price}
                    onChange={handleProductChange}
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label>Category</label>
                  <input
                    type="text"
                    name="category"
                    placeholder="Books, Electronics..."
                    value={productForm.category}
                    onChange={handleProductChange}
                    required
                  />
                </div>

                <div>
                  <label>Condition</label>
                  <select
                    name="condition"
                    value={productForm.condition}
                    onChange={handleProductChange}
                  >
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Used">Used</option>
                  </select>
                </div>

                <div>
                  <label>Listing Type</label>
                  <select
                    name="listingType"
                    value={productForm.listingType}
                    onChange={handleProductChange}
                  >
                    <option value="Sell">Sell</option>
                    <option value="Free">Free</option>
                    <option value="Exchange">Exchange</option>
                  </select>
                </div>
              </div>

              <label>Upload Product Image</label>

<input
  type="file"
  accept="image/*"
  onChange={handleProductImageChange}
  required
/>

{productForm.image && (
  <div className="image-preview">
    <img
  src={`${SERVER_URL}${product.image}`}
  alt={product.name}
  onError={(e) => {
    console.log("Image loading failed:", e.currentTarget.src);
    e.currentTarget.style.display = "none";
  }}
/>
    <button
      type="button"
      className="remove-image"
      onClick={() =>
        setProductForm({
          ...productForm,
          image: ""
        })
      }
    >
      Remove Image
    </button>
  </div>
)}

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={productLoading}
                >
                  {productLoading ? "Adding..." : "Add Product"}
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowSell(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Marketplace */}
        <section className="marketplace">

          <div className="section-heading">
            <div>
              <span className="section-tag">EXPLORE CAMPUS</span>
              <h2>Campus Marketplace</h2>
              <p>Find your next useful item here.</p>
            </div>

            <button
              className="refresh-btn"
              onClick={fetchProducts}
            >
              ↻ Refresh
            </button>
          </div>

          {/* Search */}
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search products, books, electronics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="filter-row">
            {["All", "Sell", "Free", "Exchange"].map((category) => (
              <button
                key={category}
                className={
                  activeCategory === category && !showMyProducts
                    ? "filter-btn active"
                    : "filter-btn"
                }
                onClick={() => {
                  setActiveCategory(category);
                  setShowMyProducts(false);
                }}
              >
                {category === "All"
                  ? "All Products"
                  : category === "Sell"
                  ? "Buy Items"
                  : category + " Items"}
              </button>
            ))}

            <button
              className={
                showMyProducts ? "filter-btn active" : "filter-btn"
              }
              onClick={() => {
                setShowMyProducts(true);
                setShowSell(false);
              }}
            >
              My Products
            </button>
          </div>

          <div className="products-heading">
            <h3>
              {showMyProducts
                ? "My Products"
                : activeCategory === "All"
                ? "All Products"
                : activeCategory === "Sell"
                ? "Products For Sale"
                : activeCategory + " Items"}
            </h3>

            <span>{filteredProducts.length} products found</span>
          </div>

          {/* Product Cards */}
          <div className="product-list">

            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <div>📦</div>
                <h3>No products found</h3>
                <p>
                  Try another search or add a product
                  to the marketplace.
                </p>
              </div>
            ) : (

              filteredProducts.map((product) => (

                <div className="product-card" key={product._id}>

                  <div className="product-image">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">
                        📦
                      </div>
                    )}

                    <span
                      className={`product-badge ${product.listingType?.toLowerCase()}`}
                    >
                      {product.listingType === "Sell"
                        ? "For Sale"
                        : product.listingType}
                    </span>
                  </div>

                  <div className="product-details">

                    <span className="product-category">
                      {product.category}
                    </span>

                    <h3>{product.name}</h3>

                    <p className="product-description">
                      {product.description}
                    </p>

                    <div className="product-meta">
                      <span>Condition: {product.condition}</span>
                    </div>

                    <div className="product-price">
                      {product.listingType === "Free"
                        ? "FREE"
                        : product.listingType === "Exchange"
                        ? "Exchange"
                        : "₹" + product.price}
                    </div>

                    <div className="seller-info">
                      <div className="seller-avatar">👤</div>

                      <div>
                        <strong>
                          {product.seller?.fullName || "Student"}
                        </strong>
                        <span>
                          {product.seller?.email || "Seller"}
                        </span>
                      </div>
                    </div>

                    <div className="product-actions">

                      {!isMyProduct(product) && (
                        <button
                          className="contact-btn"
                          onClick={() =>
                            contactSeller(
                              product.seller?.email,
                              product.name
                            )
                          }
                        >
                          ✉ Contact Seller
                        </button>
                      )}

                      {isMyProduct(product) && (
                        <button
                          className="delete-btn"
                          onClick={() => deleteProduct(product._id)}
                        >
                          🗑 Delete Product
                        </button>
                      )}

                    </div>

                  </div>
                </div>

              ))

            )}

          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <h3>🎓 CampusConnect</h3>
          <p>Your Campus. Your Marketplace.</p>
          <span>© 2026 CampusConnect. Made for students.</span>
        </footer>

      </div>
    );
  }

return (
    <div className="auth-page">

      <div className="auth-left">
        <div className="auth-brand">
          🎓 CampusConnect
        </div>

        <div className="auth-hero">
          <span className="welcome-tag">WELCOME TO YOUR CAMPUS MARKETPLACE</span>

          <h1>
            Your Campus.
            <br />
            Your <span>Marketplace.</span>
          </h1>

          <p>
            Buy, sell and exchange products with
            students in your college.
          </p>

          <div className="auth-illustration">🛍️</div>
        </div>

        <p className="auth-bottom">
          A smarter way to connect with your campus community.
        </p>
      </div>
<div className="auth-right">
        <form className="auth-form" onSubmit={handleSubmit}>

          <div className="form-logo">🎓</div>

          <h1>
            {isLogin ? "Welcome Back!" : "Create Account"}
          </h1>

          <p className="form-subtitle">
            {isLogin
              ? "Login to continue to your marketplace."
              : "Join the CampusConnect community today."}
          </p>

          {!isLogin && (
            <>
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange}
                required
              />
<label>Student ID</label>
              <input
                type="text"
                name="studentId"
                placeholder="Enter your student ID"
                value={form.studentId}
                onChange={handleChange}
                required
              />
            </>
          )}

          <label>Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />{!isLogin && (
            <>
              <label>Department</label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                <option value="AIML">AIML</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="IT">IT</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
              </select>

              <label>Academic Year</label>
              <select
                name="year"
                value={form.year}
                onChange={handleChange}
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option><option value="4th Year">4th Year</option>
              </select>
            </>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login to Account"
              : "Create Account"}
          </button>

          {message && (
            <p className="message">{message}</p>
          )}

          <p className="switch">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}<button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
              }}
            >
              {isLogin ? " Register" : " Login"}
            </button>
          </p>

        </form>
      </div>

    </div>
  );
}

export default App;