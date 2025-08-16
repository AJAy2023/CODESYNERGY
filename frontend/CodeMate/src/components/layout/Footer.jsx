import React from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaGithub, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../../index.css"; // ensure styles are loaded

const Footer = () => {
  return (
    <footer className="footer-glass">
      <div className="footer-container">
        {/* Logo & Tagline */}
        <div className="footer-section">
          <h2 className="footer-logo">BuddyCode</h2>
          <p className="footer-tagline">
            Empowering coders through collaboration, competition, and creativity.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3 className="footer-heading">Quick Links</h3>
          <ul className="footer-links">
            <li><Link to="/" className="footer-link">Home</Link></li>
            <li><Link to="/register" className="footer-link">Problems</Link></li>
            <li><Link to="/" className="footer-link">Battle</Link></li>
            <li><Link to="/" className="footer-link">Discussion</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div className="footer-section">
          <h3 className="footer-heading">Support</h3>
          <ul className="footer-links">
            <li><Link to="#" className="footer-link">About Us</Link></li>
            <li><Link to="/" className="footer-link">Contact</Link></li>
            <li><Link to="/" className="footer-link">FAQ</Link></li>
          </ul>
        </div>

        {/* Social Icons */}
        <div className="footer-section">
          <h3 className="footer-heading">Follow Us</h3>
          <div className="footer-social">
            <a href="#" className="footer-icon"><FaFacebookF /></a>
            <a href="#" className="footer-icon"><FaTwitter /></a>
            <a href="#" className="footer-icon"><FaLinkedinIn /></a>
            <a href="#" className="footer-icon"><FaGithub /></a>
            <a href="#" className="footer-icon"><FaInstagram /></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} BuddyCode. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
