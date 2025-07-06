import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { CheckoutProvider } from './contexts/CheckoutContext';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import EventDetails from './pages/EventDetails/EventDetails';
import Checkout from './pages/Checkout/Checkout';
import OrderConfirmation from './pages/OrderConfirmation/OrderConfirmation';
import './App.css';

function App() {
  return (
    <CartProvider>
      <CheckoutProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/evento/:id" element={<EventDetails />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/confirmacao/:orderId" element={<OrderConfirmation />} />
              </Routes>
            </main>
          </div>
        </Router>
      </CheckoutProvider>
    </CartProvider>
  );
}

export default App; 