export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <p className="footer-wordmark">
            northstar
          </p>
          <p className="footer-note">
            Considered pieces for a softer, more intentional everyday.
          </p>
        </div>

        <div>
          <p className="footer-heading">Explore</p>
          <ul>
            <li><a href="/products">Shop all</a></li>
            <li><a href="/products?category=home-living">Home & Living</a></li>
            <li><a href="/products?category=lighting">Lighting</a></li>
          </ul>
        </div>

        <div>
          <p className="footer-heading">Stay in the know</p>
          <p className="footer-note">Notes on new collections, good materials, and everyday rituals.</p>
          <form action="/products" method="get" className="footer-signup">
            <label className="sr-only" htmlFor="footer-email">Email address</label>
            <input id="footer-email" type="email" placeholder="Your email address" disabled aria-describedby="newsletter-note" />
            <button type="button" disabled aria-label="Newsletter signup coming soon">Join</button>
          </form>
          <p id="newsletter-note" className="footer-note">Newsletter signup coming soon.</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Northstar Studio</p>
        <p>Made for the things you keep.</p>
      </div>
    </footer>
  );
}
