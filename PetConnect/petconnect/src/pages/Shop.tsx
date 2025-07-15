import { useState } from "react";
import {
  FaShoppingCart,
  FaTag,
  FaShieldAlt,
  FaTruck,
  FaCheck,
  FaPlus,
  FaMinus,
  FaTimes,
  FaCreditCard,
  FaMoneyBillWave,
  FaChevronLeft,
  FaCheckCircle,
} from "react-icons/fa";
import BackButton from "../components/BackButton";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/Shop.css";
import "../styles/AddToCartModal.css";
import ModalShop from "../components/ModalShop";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  features: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
}

const Shop = () => {
  const [cart, setCart] = useState<{ id: number; quantity: number }[]>([]);
  const [cartItems, setCartItems] = useState<
    { product: Product; quantity: number }[]
  >([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "">("");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [cardErrors, setCardErrors] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [quantity, setQuantity] = useState(1);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [recentlyAddedProduct, setRecentlyAddedProduct] =
    useState<Product | null>(null);

  const products: Product[] = [
    {
      id: 1,
      name: "Collar Inteligente PetConnect",
      description:
        "Collar con tecnología GPS para la localización segura de tu mascota. Resistente al agua y duradero.",
      price: 599,
      originalPrice: 799,
      image: "/images/collar_demo.png",
      features: [
        "Tecnología GPS integrada",
        "Resistente al agua",
        "Ajustable para todo tipo de razas",
        "Material hipoalergénico",
        "Diseño elegante y cómodo",
      ],
      isBestSeller: true,
    },
    {
      id: 2,
      name: "Placa de Identificación NFC",
      description:
        "Placa ligera y resistente que se puede colgar en cualquier collar existente. Compatible con la aplicación PetConnect.",
      price: 299,
      originalPrice: 399,
      image: "/images/Nfc_demo.png",
      features: [
        "Compatible con cualquier collar",
        "Diseño delgado y liviano",
        "Resistente a la intemperie",
        "Fácil de instalar",
        "Personalizable con el nombre de tu mascota",
      ],
      isNew: true,
    },
  ];

  const handleViewCart = () => {
    // Close all modals and show the cart
    setShowAddToCartModal(false);
    setSelectedProduct(null);
    setShowCart(true);
    // Ensure the cart is visible by scrolling to it on mobile if needed
    if (window.innerWidth < 768) {
      setTimeout(() => {
        const cartElement = document.querySelector(".cart-sidebar");
        if (cartElement) {
          cartElement.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }, 100);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { id: product.id, quantity }];
    });

    // Update cart items with full product details
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id
      );
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity }];
    });

    // Show add to cart modal and set the recently added product
    setRecentlyAddedProduct(product);
    setShowAddToCartModal(true);
    setQuantity(1);
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  };

  const validateCardNumber = (number: string) => {
    // Remove all non-digit characters
    const cleanNumber = number.replace(/\D/g, "");

    // Check if the number is empty
    if (!cleanNumber) return "Número de tarjeta requerido";

    // Check if the number contains only digits
    if (!/^\d+$/.test(cleanNumber)) return "Solo se permiten números";

    // Check card length (13-19 digits for most cards)
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return "Número de tarjeta inválido";
    }

    // Luhn algorithm validation
    let sum = 0;
    let shouldDouble = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit = (digit % 10) + 1;
        }
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    if (sum % 10 !== 0) {
      return "Número de tarjeta inválido";
    }

    return "";
  };

  const validateExpiry = (expiry: string) => {
    if (!expiry) return "Fecha de vencimiento requerida";

    const [month, year] = expiry.split("/");
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      return "Formato inválido (MM/YY)";
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
      return "Fecha inválida";
    }

    if (
      yearNum < currentYear ||
      (yearNum === currentYear && monthNum < currentMonth)
    ) {
      return "La tarjeta ha expirado";
    }

    return "";
  };

  const validateCVV = (cvv: string) => {
    if (!cvv) return "CVV requerido";
    if (!/^\d{3,4}$/.test(cvv)) return "CVV inválido";
    return "";
  };

  const validateName = (name: string) => {
    if (!name.trim()) return "Nombre del titular requerido";
    if (!/^[a-zA-Z\s]+$/.test(name))
      return "Solo se permiten letras y espacios";
    return "";
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces every 4 digits
    if (name === "number") {
      const cleanValue = value.replace(/\D/g, "");
      formattedValue = cleanValue.replace(/(\d{4})(?=\d)/g, "$1 ").trim();

      // Validate as user types
      const error = validateCardNumber(cleanValue);
      setCardErrors((prev) => ({ ...prev, number: error }));
    }

    // Format expiry date as MM/YY
    if (name === "expiry") {
      const cleanValue = value.replace(/\D/g, "");
      if (cleanValue.length <= 2) {
        formattedValue = cleanValue;
      } else {
        formattedValue = `${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}`;
      }

      // Validate as user types
      const error = validateExpiry(formattedValue);
      setCardErrors((prev) => ({ ...prev, expiry: error }));
    }

    // Format CVV (limit to 3-4 digits)
    if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);

      // Validate as user types
      const error = validateCVV(formattedValue);
      setCardErrors((prev) => ({ ...prev, cvv: error }));
    }

    // Format cardholder name (letters and spaces only)
    if (name === "name") {
      formattedValue = value.replace(/[^a-zA-Z\s]/g, "");

      // Validate as user types
      const error = validateName(formattedValue);
      setCardErrors((prev) => ({ ...prev, name: error }));
    }

    setCardDetails((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const numberError = validateCardNumber(cardDetails.number);
    const nameError = validateName(cardDetails.name);
    const expiryError = validateExpiry(cardDetails.expiry);
    const cvvError = validateCVV(cardDetails.cvv);

    setCardErrors({
      number: numberError,
      name: nameError,
      expiry: expiryError,
      cvv: cvvError,
    });

    // If no errors, process payment
    if (!numberError && !nameError && !expiryError && !cvvError) {
      // Here you would typically send the payment details to your payment processor
      const totalPaid = getTotalPrice();
      setOrderTotal(totalPaid);
      setShowOrderConfirm(true);
      setCart([]);
      setCartItems([]);
      setPaymentMethod("");
      setShowPayment(false);
      setShowCardForm(false);
      setShowCart(false);
      setCardDetails({
        number: "",
        name: "",
        expiry: "",
        cvv: "",
      });
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const incrementQuantity = () => setQuantity((prev) => prev + 1);
  const decrementQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="shop-container">
      <BackButton />
      <header className="shop-header">
        <div className="shop-header-content">
          <h1>Tienda PetConnect</h1>
          <div className="shop-header-actions">
            <div className="cart-icon" onClick={() => setShowCart(true)}>
              <FaShoppingCart />
              {cart.length > 0 && (
                <span className="cart-badge">{getTotalItems()}</span>
              )}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="shop-main">
        <section className="features-banner">
          <div className="feature">
            <FaTruck className="feature-icon" />
            <span>Envío Gratis en compras superiores a $500</span>
          </div>
          <div className="feature">
            <FaShieldAlt className="feature-icon" />
            <span>Garantía de 1 año</span>
          </div>
          <div className="feature">
            <FaTag className="feature-icon" />
            <span>Precios especiales por lanzamiento</span>
          </div>
        </section>

        <section className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              {product.isNew && (
                <div className="product-badge new">¡Nuevo!</div>
              )}
              {product.isBestSeller && (
                <div className="product-badge best-seller">Más Vendido</div>
              )}

              <div className="product-image">
                <img src={product.image} alt={product.name} />
              </div>

              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-description">
                  {product.description.substring(0, 100)}...
                </p>

                <div className="product-pricing">
                  <span className="current-price">
                    ${product.price.toLocaleString("es-MX")} MXN
                  </span>
                  {product.originalPrice && (
                    <span className="original-price">
                      ${product.originalPrice.toLocaleString("es-MX")} MXN
                    </span>
                  )}
                </div>

                <button
                  className="view-details-btn"
                  onClick={() => openProductModal(product)}
                >
                  Ver detalles
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Cart Sidebar */}
      <div className={`cart-sidebar ${showCart ? "active" : ""}`}>
        <div className="cart-sidebar-header">
          <button className="cart-close-btn" onClick={() => setShowCart(false)}>
            <FaTimes />
          </button>
          <h2>Mi Carrito</h2>
        </div>

        <div className="cart-items-container">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>Tu carrito está vacío</p>
              <button
                className="continue-shopping-btn"
                onClick={() => setShowCart(false)}
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="cart-item">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="cart-item-image"
                    />
                    <div className="cart-item-details">
                      <h4>{item.product.name}</h4>
                      <div className="cart-item-price">
                        ${item.product.price.toLocaleString("es-MX")} MXN
                      </div>
                      <div className="cart-item-quantity">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          aria-label="Reducir cantidad"
                        >
                          <FaMinus size={12} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          aria-label="Aumentar cantidad"
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="remove-item-btn"
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label="Eliminar producto"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="cart-total">
                  <span>Total:</span>
                  <span>${getTotalPrice().toLocaleString("es-MX")} MXN</span>
                </div>
                <button
                  className="checkout-btn"
                  onClick={() => setShowPayment(true)}
                >
                  Proceder al pago
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            {!showCardForm ? (
              <>
                <div className="payment-modal-header">
                  <button
                    className="back-to-cart-btn"
                    onClick={() => setShowPayment(false)}
                  >
                    <FaChevronLeft /> Volver
                  </button>
                  <h2>Método de pago</h2>
                  <button
                    className="close-payment-btn"
                    onClick={() => setShowPayment(false)}
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="payment-options">
                  <div
                    className={`payment-option ${
                      paymentMethod === "card" ? "selected" : ""
                    }`}
                    onClick={() => {
                      setPaymentMethod("card");
                      setShowCardForm(true);
                    }}
                  >
                    <FaCreditCard className="payment-icon" />
                    <div className="payment-details">
                      <h3>Tarjeta de crédito/débito</h3>
                      <p>Pago seguro con tarjeta</p>
                    </div>
                    <div className="payment-radio">
                      {paymentMethod === "card" && (
                        <div className="radio-selected"></div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`payment-option ${
                      paymentMethod === "cash" ? "selected" : ""
                    }`}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <FaMoneyBillWave className="payment-icon" />
                    <div className="payment-details">
                      <h3>Efectivo</h3>
                      <p>Paga al recibir tu pedido</p>
                    </div>
                    <div className="payment-radio">
                      {paymentMethod === "cash" && (
                        <div className="radio-selected"></div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="payment-summary">
                  <div className="payment-total">
                    <span>Total a pagar:</span>
                    <span className="total-amount">
                      ${getTotalPrice().toLocaleString("es-MX")} MXN
                    </span>
                  </div>
                  <button
                    className={`confirm-payment-btn ${
                      !paymentMethod ? "disabled" : ""
                    }`}
                    disabled={!paymentMethod}
                    onClick={() => {
                      if (paymentMethod === "card") {
                        setShowCardForm(true);
                      } else {
                        // Handle cash payment
                        const totalPaid = getTotalPrice();
                        setOrderTotal(totalPaid);
                        setShowOrderConfirm(true);
                        setCart([]);
                        setCartItems([]);
                        setPaymentMethod("");
                        setShowPayment(false);
                        setShowCart(false);
                      }
                    }}
                  >
                    {paymentMethod === "card"
                      ? "Ingresar datos de pago"
                      : "Confirmar pago"}
                  </button>
                </div>
              </>
            ) : (
              <div className="shop-card-form-container">
                <div className="shop-card-form-header">
                  <button
                    className="back-to-payment-btn"
                    onClick={() => setShowCardForm(false)}
                  >
                    <FaChevronLeft /> Volver
                  </button>
                  <h2>Pagar con tarjeta</h2>
                  <button
                    className="close-payment-btn"
                    onClick={() => setShowPayment(false)}
                  >
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleCardSubmit} className="shop-card-form">
                  <div className="shop-form-group">
                    <label htmlFor="cardNumber">Número de tarjeta</label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="number"
                      value={cardDetails.number}
                      onChange={handleCardInputChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className={cardErrors.number ? "error" : ""}
                    />
                    {cardErrors.number && (
                      <span className="error-message">{cardErrors.number}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="cardName">Nombre del titular</label>
                    <input
                      type="text"
                      id="cardName"
                      name="name"
                      value={cardDetails.name}
                      onChange={handleCardInputChange}
                      placeholder="Como aparece en la tarjeta"
                      className={cardErrors.name ? "error" : ""}
                    />
                    {cardErrors.name && (
                      <span className="error-message">{cardErrors.name}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="expiryDate">Vencimiento</label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiry"
                        value={cardDetails.expiry}
                        onChange={handleCardInputChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        className={cardErrors.expiry ? "error" : ""}
                      />
                      {cardErrors.expiry && (
                        <span className="error-message">
                          {cardErrors.expiry}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="cvv">CVV</label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={cardDetails.cvv}
                        onChange={handleCardInputChange}
                        placeholder="123"
                        maxLength={4}
                        className={cardErrors.cvv ? "error" : ""}
                      />
                      {cardErrors.cvv && (
                        <span className="error-message">{cardErrors.cvv}</span>
                      )}
                    </div>
                  </div>

                  <div className="card-preview">
                    <div className="card-logo">
                      {cardDetails.number.startsWith("4")
                        ? "VISA"
                        : cardDetails.number.match(/^5[1-5]/)
                        ? "MASTERCARD"
                        : cardDetails.number.startsWith("3[47]")
                        ? "AMEX"
                        : "CARD"}
                    </div>
                    <div className="card-number">
                      {cardDetails.number || "•••• •••• •••• ••••"}
                    </div>
                    <div className="card-details">
                      <div className="card-name">
                        {cardDetails.name || "NOMBRE DEL TITULAR"}
                      </div>
                      <div className="card-expiry">
                        {cardDetails.expiry || "••/••"}
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="submit-payment-btn">
                    Pagar ${getTotalPrice().toLocaleString("es-MX")} MXN
                  </button>
                </form>

                <div className="secure-payment">
                  <FaShieldAlt />
                  <span>Pago seguro con cifrado de 256 bits</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      <ModalShop
        isOpen={showOrderConfirm}
        total={orderTotal}
        onClose={() => setShowOrderConfirm(false)}
      />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="shop-modal-overlay" onClick={closeModal}>
          <div className="shop-item-modal" onClick={(e) => e.stopPropagation()}>
            <button className="shop-close-modal" onClick={closeModal}>
              ×
            </button>

            <div className="shop-modal-content">
              <div className="shop-modal-image">
                <img src={selectedProduct.image} alt={selectedProduct.name} />
              </div>

              <div className="shop-modal-details">
                <h2>{selectedProduct.name}</h2>
                <p className="shop-modal-description">
                  {selectedProduct.description}
                </p>

                <div className="shop-modal-pricing">
                  <span className="shop-current-price">
                    ${selectedProduct.price.toLocaleString("es-MX")} MXN
                  </span>
                  {selectedProduct.originalPrice && (
                    <span className="shop-original-price">
                      ${selectedProduct.originalPrice.toLocaleString("es-MX")} {" "}
                      MXN
                    </span>
                  )}
                </div>

                <div className="shop-features-list">
                  <h4>Características:</h4>
                  <ul>
                    {selectedProduct.features.map((feature, index) => (
                      <li key={index}>
                        <FaCheck className="shop-feature-check" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="shop-quantity-selector">
                  <button onClick={decrementQuantity} disabled={quantity <= 1}>
                    <FaMinus />
                  </button>
                  <span>{quantity}</span>
                  <button onClick={incrementQuantity}>
                    <FaPlus />
                  </button>
                </div>

                <button
                  className="shop-add-to-cart-btn"
                  onClick={() => {
                    addToCart(selectedProduct);
                  }}
                >
                  <FaShoppingCart /> Añadir al carrito ($
                  {(selectedProduct.price * quantity).toLocaleString(
                    "es-MX"
                  )} {" "}
                  MXN)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Cart Modal */}
      {showAddToCartModal && recentlyAddedProduct && (
        <div
          className="add-to-cart-modal-overlay"
          onClick={() => setShowAddToCartModal(false)}
        >
          <div
            className="add-to-cart-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="add-to-cart-close"
              onClick={() => setShowAddToCartModal(false)}
            >
              ×
            </button>
            <div className="add-to-cart-content">
              <div className="add-to-cart-icon">
                <FaCheckCircle />
              </div>
              <h3>¡Producto agregado al carrito!</h3>
              <div className="added-product">
                <img
                  src={recentlyAddedProduct.image}
                  alt={recentlyAddedProduct.name}
                  className="added-product-image"
                />
                <div className="added-product-details">
                  <h4>{recentlyAddedProduct.name}</h4>
                  <p className="added-product-price">
                    ${recentlyAddedProduct.price.toLocaleString("es-MX")} MXN
                    {recentlyAddedProduct.originalPrice && (
                      <span className="original-price">
                        $
                        {recentlyAddedProduct.originalPrice.toLocaleString(
                          "es-MX"
                        )}
                      </span>
                    )}
                  </p>
                  <p className="added-product-quantity">Cantidad: {quantity}</p>
                </div>
              </div>
              <div className="add-to-cart-actions">
                <button
                  className="continue-shopping"
                  onClick={() => setShowAddToCartModal(false)}
                >
                  Seguir comprando
                </button>
                <button className="go-to-cart" onClick={handleViewCart}>
                  Ver carrito (
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
