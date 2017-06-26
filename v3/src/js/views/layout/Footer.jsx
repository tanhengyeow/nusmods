// @flow
import React from 'react';
import { Link } from 'react-router';

function Footer() {
  return (
    <footer className="nm-footer text-muted">
      <div className="container">
        <ul className="nm-footer-links">
          <li><a href="https://github.com/nusmodifications/nusmods">GitHub</a></li>
          <li><a href="https://www.facebook.com/nusmods">Facebook</a></li>
          <li><a href="https://twitter.com/nusmods">Twitter</a></li>
        </ul>
        <p>This...is my domain
        </p>
      </div>
    </footer>
  );
}

export default Footer;
