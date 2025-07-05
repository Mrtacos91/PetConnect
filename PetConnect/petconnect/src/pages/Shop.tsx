import { useState } from "react";
import {
  FaShoppingCart,
  FaTag,
  FaShieldAlt,
  FaTruck,
  FaCheck,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import BackButton from "../components/BackButton";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/Shop.css";

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  const products: Product[] = [
    {
      id: 1,
      name: "Collar Inteligente PetConnect",
      description:
        "Collar con tecnología NFC para la identificación segura de tu mascota. Resistente al agua y duradero.",
      price: 599,
      originalPrice: 799,
      image: "/images/collar_demo.png",
      features: [
        "Tecnología NFC integrada",
        "Resistente al agua IP67",
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

  const addToCart = (productId: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { id: productId, quantity }];
    });
    setQuantity(1);
    // Show success message or notification
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
            <div className="cart-icon">
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

      {selectedProduct && (
        <div className="product-modal-overlay" onClick={closeModal}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>
              ×
            </button>

            <div className="modal-content-shop">
              <div className="modal-image-shop">
                <img src={selectedProduct.image} alt={selectedProduct.name} />
              </div>

              <div className="modal-details-shop">
                <h2>{selectedProduct.name}</h2>
                <p className="modal-description">
                  {selectedProduct.description}
                </p>

                <div className="modal-pricing-shop">
                  <span className="current-price">
                    ${selectedProduct.price.toLocaleString("es-MX")} MXN
                  </span>
                  {selectedProduct.originalPrice && (
                    <span className="original-price">
                      ${selectedProduct.originalPrice.toLocaleString("es-MX")}{" "}
                      MXN
                    </span>
                  )}
                </div>

                <div className="features-list">
                  <h4>Características:</h4>
                  <ul>
                    {selectedProduct.features.map((feature, index) => (
                      <li key={index}>
                        <FaCheck className="feature-check" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="quantity-selector">
                  <button onClick={decrementQuantity} disabled={quantity <= 1}>
                    <FaMinus />
                  </button>
                  <span>{quantity}</span>
                  <button onClick={incrementQuantity}>
                    <FaPlus />
                  </button>
                </div>

                <button
                  className="add-to-cart-btn"
                  onClick={() => {
                    addToCart(selectedProduct.id);
                    closeModal();
                  }}
                >
                  <FaShoppingCart /> Añadir al carrito ($
                  {(selectedProduct.price * quantity).toLocaleString(
                    "es-MX"
                  )}{" "}
                  MXN)
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
