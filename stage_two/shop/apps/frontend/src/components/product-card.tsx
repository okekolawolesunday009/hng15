import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { WishlistButton } from "@/components/wishlist-button";
import type { CatalogProduct } from "@/lib/catalog";
import { formatCurrency } from "@/lib/cart";

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <article className="product-card">
      <div
        className="product-card-media"
        role="img"
        aria-label={`${product.name} product image`}
        style={{
          backgroundImage: product.imageUrl
            ? `url("${product.imageUrl}")`
            : "linear-gradient(145deg, #f5e8fc, #e9ff70)",
        }}
      >
        <Link
          href={`/products/${product.slug}`}
          className="product-card-image-link"
          aria-label={`View ${product.name}`}
        />
        <WishlistButton productId={product.id} />
        {product.stock < 1 ? <span className="product-badge">Sold out</span> : null}
      </div>

      <div className="product-card-details">
        <div className="product-card-meta">
          <span>{product.categoryName ?? "Northstar objects"}</span>
          <span>{product.stock > 0 ? "In the collection" : "Restocking soon"}</span>
        </div>
        <div className="product-card-title-row">
          <Link href={`/products/${product.slug}`} className="product-card-title">
            {product.name}
          </Link>
          <span className="product-card-price">{formatCurrency(product.price)}</span>
        </div>
        <p className="product-card-description">{product.description}</p>
        <div className="product-card-actions">
          <Link href={`/products/${product.slug}`} className="text-link">
            Discover piece <span aria-hidden="true">↗</span>
          </Link>
          <AddToCartButton product={product} compact />
        </div>
      </div>
    </article>
  );
}