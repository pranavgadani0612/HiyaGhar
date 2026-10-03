import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { mukhwasProducts } from '../../data/mukhwasData';
import { fallbackTeaMasalaProductsData } from '../TeaMasala/TeaMasalaPage';
import { fallbackHandmadeSoapProducts } from '../HandmadeSoap/HandmadeSoapPage';
import { fallbackHairOilProductsData } from '../HairOil/HairOilPage';
import { CartService, triggerFlyingProductAnimation } from '../../cart';
import { WishlistService } from '../../services/wishlistService';
import { AnimatedNumber } from '../../components/common/AnimatedNumber';
import { ProductService, type Product as ApiProduct } from '../../services/productService';
import { ProductReviews } from '../../components/ProductReviews/ProductReviews';
import { navigateTo } from '../../utils/navigation';
import { formatVariantLabel } from '../../utils/productFormat';
import { parseProductFullDescription } from '../../utils/productMetaStore';
import './ProductDetailPage.css';

interface ProductDetailPageProps {
  productId: string;
  onNavigateHome: () => void;
  onNavigateMukhwas: () => void;
  onNavigateToDetail?: (id: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigateHome,
  onNavigateMukhwas,
}) => {
  const allStaticProducts: any[] = [
    ...mukhwasProducts,
    ...fallbackTeaMasalaProductsData,
    ...fallbackHandmadeSoapProducts,
    ...fallbackHairOilProductsData,
  ];

  const staticMatch = allStaticProducts.find(
    (p) => p.id === productId || p.id === productId.toLowerCase()
  );

  const numericId = Number(productId);
  const isNumericId = !isNaN(numericId) && numericId > 0;

  // For a real numeric catalog id, don't show ANY product until the live fetch
  // resolves — previously this defaulted to an unrelated static product
  // (mukhwasProducts[0]), which flashed on screen for ~1-2 seconds on every
  // single real product page. Static-slug routes still resolve synchronously
  // and correctly from staticMatch, so those keep their existing instant render.
  const [productData, setProductData] = useState<any>(isNumericId ? null : (staticMatch || mukhwasProducts[0]));
  const [isLoadingProduct, setIsLoadingProduct] = useState<boolean>(isNumericId);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'nutrition' | 'reviews'>('description');

  const mainImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isNumericId) {
      ProductService.getProductById(numericId).then((apiProd: ApiProduct | null) => {
        if (!apiProd) {
          // Live fetch genuinely came back empty (e.g. backend unreachable) — fall
          // back to static data as a last resort rather than leaving the skeleton
          // showing forever.
          setProductData(staticMatch || mukhwasProducts[0]);
          setIsLoadingProduct(false);
          return;
        }
        const defaultVar = apiProd.variants?.find((v) => v.isDefault) || apiProd.variants?.[0];
        const weightOpts = apiProd.variants?.map((v) => formatVariantLabel(v.variantName)) || ['100g', '250g', '500g'];
        const curPrice = defaultVar ? defaultVar.price : apiProd.basePrice;
        const origPrice = defaultVar?.originalPrice || apiProd.discountPrice || Math.round(curPrice * 1.25);

        // `images` is the authoritative gallery (backend sorts it primary-first and it
        // already includes the primary image itself) — use it directly instead of also
        // pushing `mainImagePath` separately, which used to create a duplicate thumbnail
        // (the "?v=2" cache-busting suffix on mainImagePath meant the dedup-by-string-match
        // below never recognized it as the same image as its entry in `images`).
        const imgs: string[] = [];
        if (apiProd.images && apiProd.images.length > 0) {
          apiProd.images.forEach((img) => {
            if (img.imagePath && !imgs.includes(img.imagePath)) {
              imgs.push(img.imagePath);
            }
          });
        }
        if (imgs.length === 0 && apiProd.mainImagePath) {
          imgs.push(apiProd.mainImagePath);
        }
        const finalImgs = imgs.length > 0 ? imgs : ['/image/ImageforMukhwash/Shahi Pan.webp'];

        const parsed = parseProductFullDescription(
          apiProd.fullDescription,
          apiProd.id,
          apiProd.category?.categoryName,
          apiProd.productName
        );

        setProductData({
          id: apiProd.id.toString(),
          name: apiProd.productName,
          category: 'special',
          categoryLabel: apiProd.category?.categoryName || 'Natural Product',
          shortDescription: apiProd.shortDescription || '100% natural organic product.',
          longDescription: parsed.cleanDescription,
          price: curPrice,
          originalPrice: origPrice,
          rating: apiProd.rating || 0,
          reviewsCount: apiProd.reviewCount || 0,
          image: finalImgs[0],
          gallery: finalImgs,
          weightOptions: weightOpts,
          variants: apiProd.variants || [],
          badge: apiProd.isFeatured ? 'Best Seller' : undefined,
          ingredients: parsed.ingredients,
          benefits: parsed.benefits,
          servingSize: parsed.servingSize || '100g',
          nutritionalInfo: parsed.nutritionalInfo,
        });

        setSelectedImage(finalImgs[0]);
        setGalleryImages(finalImgs);
        const defaultAttrs = (defaultVar as any)?.attributes;
        if (Array.isArray(defaultAttrs) && defaultAttrs.length > 0) {
          setSelectedAttrs(Object.fromEntries(defaultAttrs.map((a: any) => [a.attributeName, a.attributeValue])));
        } else {
          const initialWt = defaultVar ? formatVariantLabel(defaultVar.variantName) : (weightOpts[0] || '100g');
          setSelectedAttrs({ Weight: initialWt });
        }
        setIsLoadingProduct(false);
      });
    } else if (staticMatch) {
      setProductData(staticMatch);
      const defaultImg = staticMatch.image || '/image/ImageforMukhwash/Kalkatti-Pan 1.webp';
      const secondImg = staticMatch.secondaryImage || '/image/ImageforMukhwash/Shahi Pan.webp';
      const imgs = defaultImg === secondImg ? [defaultImg] : [defaultImg, secondImg];
      setSelectedImage(defaultImg);
      setGalleryImages(imgs);

      const initialWt = staticMatch.weightOptions && staticMatch.weightOptions.length > 0
        ? (staticMatch.weightOptions.includes('250g') ? '250g' : staticMatch.weightOptions[0])
        : '100g';
      setSelectedAttrs({ Weight: initialWt });
    }
  }, [productId]);

  // `product` is null while the real fetch for a numeric id is still in flight
  // (see isLoadingProduct/isNumericId above) — every direct `product.x` read below
  // uses optional chaining so this component never crashes during that window;
  // the JSX further down renders a loading skeleton instead of this real content
  // whenever isLoadingProduct/!product is true, so these derived values are simply
  // unused (but still safely computed, since hooks must run unconditionally) then.
  const product = productData;

  // Attribute groups: use the real, structured per-variant attributes when the API provided
  // them; otherwise fall back to treating the whole weightOptions list as one "Weight" group
  // (older/static products that only ever had a single flat attribute).
  const hasStructuredAttributes = (product?.variants || []).some(
    (v: any) => Array.isArray(v.attributes) && v.attributes.length > 0
  );

  const attributeGroups: { name: string; values: string[] }[] = hasStructuredAttributes
    ? (() => {
        const groups: Record<string, string[]> = {};
        (product?.variants || []).forEach((v: any) => {
          (v.attributes || []).forEach((a: any) => {
            if (!groups[a.attributeName]) groups[a.attributeName] = [];
            if (!groups[a.attributeName].includes(a.attributeValue)) groups[a.attributeName].push(a.attributeValue);
          });
        });
        return Object.keys(groups)
          .sort((a, b) => a.localeCompare(b))
          .map((name) => ({ name, values: groups[name] }));
      })()
    : (product?.weightOptions && product.weightOptions.length > 0 ? [{ name: 'Weight', values: product.weightOptions }] : []);

  const matchedVariant = hasStructuredAttributes
    ? (product?.variants || []).find((v: any) => {
        const attrs = v.attributes || [];
        const selectedKeys = Object.keys(selectedAttrs);
        if (attrs.length === 0 || attrs.length !== selectedKeys.length) return false;
        return attrs.every((a: any) => selectedAttrs[a.attributeName] === a.attributeValue);
      })
    : undefined;

  const selectedWeight = hasStructuredAttributes
    ? (matchedVariant ? formatVariantLabel(matchedVariant.variantName) : Object.values(selectedAttrs).join(' • '))
    : (selectedAttrs['Weight'] || (product?.weightOptions && product.weightOptions[0]) || '100g');

  // Picking a value shouldn't be able to land on a combination that was never saved as a
  // real variant. If the current picks + the new value don't match anything, snap the OTHER
  // groups to whatever a real variant that has this value actually pairs it with, instead of
  // leaving the shopper stuck on an unavailable combination.
  const handleSelectAttrValue = (groupName: string, value: string) => {
    if (!hasStructuredAttributes) {
      setSelectedAttrs((prev) => ({ ...prev, [groupName]: value }));
      return;
    }

    const candidate = { ...selectedAttrs, [groupName]: value };
    const candidateKeys = Object.keys(candidate);
    const existsAsIs = (product.variants || []).some((v: any) => {
      const attrs = v.attributes || [];
      return attrs.length === candidateKeys.length && attrs.every((a: any) => candidate[a.attributeName] === a.attributeValue);
    });
    if (existsAsIs) {
      setSelectedAttrs(candidate);
      return;
    }

    const fallbackVariant = (product.variants || []).find((v: any) =>
      (v.attributes || []).some((a: any) => a.attributeName === groupName && a.attributeValue === value)
    );
    if (fallbackVariant) {
      const snapped: Record<string, string> = {};
      (fallbackVariant.attributes || []).forEach((a: any) => { snapped[a.attributeName] = a.attributeValue; });
      setSelectedAttrs(snapped);
    } else {
      setSelectedAttrs(candidate);
    }
  };

  useEffect(() => {
    if (!product) return;
    setIsWishlisted(WishlistService.isInWishlist(product.id));
    const unsubscribe = WishlistService.subscribe(() => {
      setIsWishlisted(WishlistService.isInWishlist(product.id));
    });
    return () => unsubscribe();
  }, [product?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getVariantPrice = (weight: string) => {
    if (product?.variants && product.variants.length > 0) {
      const match = product.variants.find((v: any) => {
        const vName = (v.variantName || '').toLowerCase().replace(/[\s\-\>:]+/g, '');
        const vAttr = (v.attributeValue || '').toLowerCase().replace(/[\s\-\>:]+/g, '');
        const target = (weight || '').toLowerCase().replace(/[\s\-\>:]+/g, '');
        return vName === target || vAttr === target || (vName && target && vName.includes(target)) || (vAttr && target && target.includes(vAttr));
      });
      if (match) {
        return {
          price: match.price,
          originalPrice: match.originalPrice || match.price
        };
      }
    }
    let p = product?.price || 199;
    if (weight === '100g' || weight.includes('100g')) p = Math.round(p * 0.57);
    else if (weight === '250g' || weight.includes('250g')) p = p;
    else if (weight === '500g' || weight.includes('500g')) p = Math.round(p * 1.85);

    return {
      price: p,
      originalPrice: product?.originalPrice ? Math.round((p / (product.price || 1)) * product.originalPrice) : Math.round(p * 1.25)
    };
  };

  // When the API gave us real structured attributes, price comes from the exact matched
  // variant (or null if the current picks don't correspond to any saved variant). Otherwise
  // fall back to the legacy fuzzy-match/heuristic pricing for older single-attribute data.
  const currentPrices = hasStructuredAttributes
    ? (matchedVariant ? { price: matchedVariant.price, originalPrice: matchedVariant.originalPrice || matchedVariant.price } : null)
    : getVariantPrice(selectedWeight);
  const isCombinationAvailable = currentPrices !== null;
  const currentPrice = currentPrices?.price ?? 0;
  const currentOriginalPrice = currentPrices?.originalPrice ?? 0;
  const discountPercentage = currentOriginalPrice > currentPrice
    ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
    : 13;

  const handleWishlistToggle = () => {
    if (!isCombinationAvailable) return;
    const added = WishlistService.toggleWishlist({
      id: product.id,
      productId: product.id,
      name: product.name,
      image: selectedImage || product.image,
      price: currentPrice,
      originalPrice: currentOriginalPrice,
      weight: selectedWeight,
    });
    if (added) {
      showToast(`Saved ${product.name} to Wishlist!`);
    } else {
      showToast(`Removed from Wishlist`);
    }
  };

  const handleAddToCart = () => {
    if (!isCombinationAvailable) return;
    const itemId = CartService.addItem({
      productId: product.id,
      name: product.name,
      image: selectedImage || product.image,
      price: currentPrice,
      originalPrice: currentOriginalPrice,
      weight: selectedWeight,
      quantity: quantity,
    });
    if (!itemId) return; // blocked (not logged in) - CartService already showed why

    if (mainImgRef.current) {
      triggerFlyingProductAnimation(mainImgRef.current, product.id.toString());
    }

    showToast(`Added ${quantity} x ${product.name} (${selectedWeight}) to Cart!`);
  };

  const handleBuyNow = () => {
    if (!isCombinationAvailable) return;
    const itemId = CartService.addItem({
      productId: product.id,
      name: product.name,
      image: selectedImage || product.image,
      price: currentPrice,
      originalPrice: currentOriginalPrice,
      weight: selectedWeight,
      quantity: quantity,
    });
    if (!itemId) return; // blocked (not logged in) - CartService already showed why
    navigateTo('/checkout');
  };

  return (
    <div className="hiyaghar-product-detail-layout">
      <Header />

      <main className="hiyaghar-product-detail-main">
        {toastMessage && (
          <div className="hiyaghar-mukhwas-toast" role="status">
            <span>{toastMessage}</span>
          </div>
        )}

        {isLoadingProduct || !product ? (
          <div className="hiyaghar-container">
            <div className="hiyaghar-detail-hero-grid">
              <div className="hiyaghar-detail-gallery-col">
                <div className="hiyaghar-detail-skeleton-img" aria-hidden="true" />
              </div>
              <div className="hiyaghar-detail-info-col">
                <div className="hiyaghar-detail-skeleton-line hiyaghar-w-30" aria-hidden="true" />
                <div className="hiyaghar-detail-skeleton-line hiyaghar-w-70 hiyaghar-h-lg" aria-hidden="true" />
                <div className="hiyaghar-detail-skeleton-line hiyaghar-w-40" aria-hidden="true" />
                <div className="hiyaghar-detail-skeleton-line hiyaghar-w-25 hiyaghar-h-lg" aria-hidden="true" />
                <div className="hiyaghar-detail-skeleton-line hiyaghar-w-90" aria-hidden="true" />
                <div className="hiyaghar-detail-skeleton-line hiyaghar-w-60" aria-hidden="true" />
                <div className="hiyaghar-detail-skeleton-block" aria-hidden="true" />
              </div>
            </div>
          </div>
        ) : (
        <div className="hiyaghar-container">
          {/* Breadcrumbs */}
          <nav className="hiyaghar-detail-breadcrumb" aria-label="Breadcrumb navigation">
            <ul className="hiyaghar-detail-breadcrumb-list">
              <li>
                <a href="/" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>Home</a>
              </li>
              <li className="sep">/</li>
              <li>
                <a href="/mukhwas" onClick={(e) => { e.preventDefault(); onNavigateMukhwas(); }}>Mukhwas</a>
              </li>
              <li className="sep">/</li>
              <li className="current">{product.name}</li>
            </ul>
          </nav>

          {/* Hero Two-Column Container */}
          <div className="hiyaghar-detail-hero-grid">
            {/* Gallery Column */}
            <div className="hiyaghar-detail-gallery-col">
              <div className="hiyaghar-detail-main-img-card">
                {product.badge && (
                  <span className="hiyaghar-detail-badge">{product.badge}</span>
                )}
                <button
                  type="button"
                  className={`hiyaghar-detail-image-wishlist-btn ${isWishlisted ? 'is-active' : ''}`}
                  onClick={handleWishlistToggle}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                  aria-label={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? '#ef4444' : 'none'} stroke={isWishlisted ? '#ef4444' : 'currentColor'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                <img
                  ref={mainImgRef}
                  src={selectedImage || product.image}
                  alt={product.name}
                  className="hiyaghar-detail-main-img"
                />
              </div>

              {galleryImages.length > 1 && (
                <div className="hiyaghar-detail-thumbnails-row">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`hiyaghar-thumbnail-btn ${selectedImage === img ? 'is-active' : ''}`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <img src={img} alt={`${product.name} view ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Column */}
            <div className="hiyaghar-detail-info-col">
              <span className="hiyaghar-detail-cat">{product.categoryLabel || 'Mukhwas'}</span>
              <h1 className="hiyaghar-detail-title">{product.name}</h1>

              {/* Price Box */}

              <div className="hiyaghar-detail-price-box">
                <span className="hiyaghar-detail-price">
                  ₹<AnimatedNumber value={currentPrice} />
                </span>
                {currentOriginalPrice > currentPrice && (
                  <>
                    <span className="hiyaghar-detail-original-price">
                      ₹{currentOriginalPrice}
                    </span>
                    <span className="hiyaghar-detail-discount-tag">
                      {discountPercentage}% OFF
                    </span>
                  </>
                )}
                <div className="hiyaghar-tax-note">(Inclusive of all taxes)</div>
              </div>

              <p className="hiyaghar-detail-lead">{product.shortDescription}</p>

              {/* Attribute Selector - one labeled row per attribute (Weight, Packing, ...), alphabetical, all on one line */}
              {attributeGroups.length > 0 && (
                <div className="hiyaghar-detail-option-group">
                  {attributeGroups.map((group) => (
                    <div key={group.name} className="hiyaghar-attr-group-row">
                      <span className="hiyaghar-attr-group-label">{group.name}:</span>
                      {group.values.map((val) => (
                        <button
                          type="button"
                          key={val}
                          className={`hiyaghar-attr-pill ${selectedAttrs[group.name] === val ? 'is-selected' : ''}`}
                          onClick={() => handleSelectAttrValue(group.name, val)}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  ))}
                  {!isCombinationAvailable && (
                    <div style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 700 }}>
                      This combination isn't available.
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="hiyaghar-detail-option-group">
                <label className="hiyaghar-option-label">Quantity:</label>
                <div className="hiyaghar-qty-stepper">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="qty-val">{quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="hiyaghar-detail-actions-row">
                <button
                  type="button"
                  className="hiyaghar-detail-btn-cart"
                  onClick={handleAddToCart}
                  disabled={!isCombinationAvailable}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  Add to Cart
                </button>

                <button
                  type="button"
                  className="hiyaghar-detail-btn-buy"
                  onClick={handleBuyNow}
                  disabled={!isCombinationAvailable}
                >
                  Buy Now
                </button>
              </div>

              {/* Trust Micro Badges */}
              <div className="hiyaghar-detail-trust-pills">
                <div className="trust-pill">
                  <span className="icon" style={{ color: '#16a34a', display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                    </svg>
                  </span>
                  <span>100% Natural</span>
                </div>
                <div className="trust-pill">
                  <span className="icon" style={{ color: '#d97706', display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </span>
                  <span>Airtight Moisture Seal</span>
                </div>
                <div className="trust-pill">
                  <span className="icon" style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                  </span>
                  <span>Dispatched in 24 Hrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Details Tabs Section */}
          <div className="hiyaghar-detail-tabs-container">
            <div className="hiyaghar-detail-tabs-header">
              <button
                type="button"
                className={`hiyaghar-tab-btn ${activeTab === 'description' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                Product Description
              </button>
              {product.ingredients && product.ingredients.length > 0 && (
                <button
                  type="button"
                  className={`hiyaghar-tab-btn ${activeTab === 'ingredients' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('ingredients')}
                >
                  Ingredients & Benefits
                </button>
              )}
              {product.nutritionalInfo && (
                <button
                  type="button"
                  className={`hiyaghar-tab-btn ${activeTab === 'nutrition' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('nutrition')}
                >
                  Nutritional Facts
                </button>
              )}
              <button
                type="button"
                className={`hiyaghar-tab-btn ${activeTab === 'reviews' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </button>
            </div>

            <div className="hiyaghar-detail-tab-content">
              {activeTab === 'description' && (
                <div>
                  <p className="hiyaghar-tab-paragraph">
                    {product.longDescription || product.shortDescription}
                  </p>

                  <div className="hiyaghar-highlights-grid">
                    <div className="highlight-item">
                      <strong>Authentic Craftsmanship</strong>
                      <p>Handcrafted using traditional Kathiawadi & Ayurvedic methodologies.</p>
                    </div>

                    <div className="highlight-item">
                      <strong>Zero Artificial Additives</strong>
                      <p>Free from artificial colors, chemical preservatives, or synthetic flavors.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ingredients' && product.ingredients && (
                <div>
                  <h4 className="pane-subheading">Key Ingredients:</h4>
                  <div className="ingredients-pills-list" style={{ marginBottom: '24px' }}>
                    {product.ingredients?.map((ing: string, i: number) => (
                      <span key={i} className="ing-pill">{ing}</span>
                    ))}
                  </div>

                  {product.benefits && product.benefits.length > 0 && (
                    <>
                      <h4 className="pane-subheading">Health & Wellness Benefits:</h4>
                      <ul className="benefits-checklist">
                        {product.benefits?.map((b: string, i: number) => (
                          <li key={i}>
                            <span className="check-icon">✓</span> {b}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'nutrition' && product.nutritionalInfo && (
                <div>
                  <h4 className="pane-subheading">
                    Nutritional Values (per {selectedAttrs.Weight || product.servingSize || '100g'} serving):
                  </h4>
                  <table className="hiyaghar-nutrition-table">
                    <tbody>
                      {Object.entries(product.nutritionalInfo).map(([nutrientName, nutrientValue]) => (
                        <tr key={nutrientName}>
                          <td><strong>{nutrientName}</strong></td>
                          <td>{String(nutrientValue ?? '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'reviews' && (
                <ProductReviews productId={product.id} />
              )}
            </div>
          </div>
        </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
