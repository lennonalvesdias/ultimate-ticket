import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { totalItems } = useCart();

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <Link to="/" className="navbar__logo">
          <h1>Ultimate Ticket</h1>
        </Link>
        
        <div className="navbar__menu">
          <Link to="/" className="navbar__link">
            Eventos
          </Link>
          
          <Link to="/checkout" className="navbar__cart">
            <span className="navbar__cart-icon">🛒</span>
            {totalItems > 0 && (
              <span className="navbar__cart-count">{totalItems}</span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 