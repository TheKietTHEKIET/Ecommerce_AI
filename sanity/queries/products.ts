import { defineQuery } from "next-sanity";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants/stock";

// ==============================================
// Shared Query Fragments (DRY)
// ==============================================

/** 
 * Các điều kiện lọc sản phẩm chung (dùng cho nhiều query)
 */
const PRODUCT_FILTER_CONDITIONS = `
  _type == "product"
  && ($categorySlug == "" || category->slug.current == $categorySlug)
  && ($color == "" || color == $color)
  && ($material == "" || material == $material)
  && ($minPrice == 0 || price >= $minPrice)
  && ($maxPrice == 0 || price <= $maxPrice)
  && ($searchQuery == "" || name match $searchQuery + "*" || description match $searchQuery + "*")
  && ($inStock == false || stock > 0)
`;

/**
 * Projection cho danh sách sản phẩm đã lọc
 * (bao gồm nhiều ảnh để hiển thị hover/preview)
 */
const FILTERED_PRODUCT_PROJECTION = `
  _id,
  name,
  "slug": slug.current,
  price,
  "images": images[0...4]{
    _key,
    asset->{
      _id,
      url
    }
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  material,
  color,
  stock
`;

/** 
 * Scoring cho relevance-based search (tăng độ chính xác tìm kiếm)
 * - Tên sản phẩm được ưu tiên cao hơn (boost 3)
 * - Mô tả sản phẩm có trọng số thấp hơn (boost 1)
 */
const RELEVANCE_SCORE = `
  score(
    "*",

    boost(name match $searchQuery + "*", 3),
    boost(description match $searchQuery + "*", 1)
  )
`;

/**
 * Get all products with category expanded
 * Used on landing page (featured products, hero section, product grid...)
 */
export const ALL_PRODUCTS_QUERY = defineQuery(`
  *[_type == "product"]
  | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    description,
    price,
    "images": images[] {
      _key,
      asset->{
        _id,
        url
      },
      hotspot
    },
    category->{
      _id,
      title,
      "slug": slug.current
    },
    material,
    color,
    dimensions,
    stock,
    featured,
    assemblyRequired
  }
`);


/**
 * Get featured products for homepage carousel
 * - Chỉ lấy sản phẩm được đánh dấu featured = true
 * - Còn hàng (stock > 0)
 * - Giới hạn tối đa 6 sản phẩm
 * - Sắp xếp theo tên A-Z
 */
export const FEATURED_PRODUCTS_QUERY = defineQuery(`
  *[_type == "product" && featured == true && stock > 0]
  | order(name asc)[0...6] {
    _id,
    name,
    "slug": slug.current,
    description,
    price,
    "images": images[] {
      _key,
      asset->{
        _id,
        url
      },
      hotspot
    },
    category->{
      _id,
      title,
      "slug": slug.current
    },
    stock
  }
`);

/**
 * Get products by category slug
 * Lấy tất cả sản phẩm thuộc một danh mục cụ thể (dựa vào slug của category)
 * Sắp xếp theo tên A-Z
 */
export const PRODUCTS_BY_CATEGORY_QUERY = defineQuery(`
  *[_type == "product" && category->slug.current == $categorySlug]
  | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    price,
    "image": images[0]{
      asset->{
        _id,
        url
      },
      hotspot
    },
    category->{
      _id,
      title,
      "slug": slug.current
    },
    material,
    color,
    stock
  }
`);


/**
 * Get single product by slug
 * Used on product detail page
 */
export const PRODUCT_BY_SLUG_QUERY = defineQuery(`
  *[_type == "product" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    description,
    price,
    "images": images[] {
      _key,
      asset->{
        _id,
        url
      },
      hotspot
    },
    category->{
      _id,
      title,
      "slug": slug.current
    },
    material,
    color,
    dimensions,
    stock,
    featured,
    assemblyRequired
  }
`);

// ==============================================
// Search & Filter Queries (Server-Side)
// Uses GROQ score() for relevance ranking
// ==============================================

/**
 * Tìm kiếm sản phẩm với relevance scoring
 * - Sử dụng score() + boost() để ưu tiên tên sản phẩm hơn mô tả
 * - Sắp xếp theo độ liên quan giảm dần (relevance score desc)
 * - Chỉ trả về sản phẩm có match với từ khóa tìm kiếm
 */
export const SEARCH_PRODUCTS_QUERY = defineQuery(`
  *[_type == "product" && (
    $searchQuery == "" ||
    name match $searchQuery + "*" ||
    description match $searchQuery + "*"
  )]
  | score(
    boost(name match $searchQuery + "*", 3),
    boost(description match $searchQuery + "*", 1)
  )
  | order(_score desc) {
    _id,
    _score,
    name,
    "slug": slug.current,
    price,
    "image": images[0]{
      asset->{
        _id,
        url
      },
      hotspot
    },
    category->{
      _id,
      title,
      "slug": slug.current
    },
    material,
    color,
    stock
  }
`);


/**
 * Lọc sản phẩm - sắp xếp theo tên (A-Z)
 * Trả về tối đa 4 ảnh để hiển thị hover preview trên product card
 */
export const FILTERED_PRODUCTS_BY_NAME_QUERY = defineQuery(`
  *[
    ${PRODUCT_FILTER_CONDITIONS}
  ]
  | order(name asc) {
    ${FILTERED_PRODUCT_PROJECTION}
  }
`);

/**
 * Lọc sản phẩm - sắp xếp theo giá tăng dần (price asc)
 * Trả về tối đa 4 ảnh để hiển thị hover preview trên product card
 */
export const FILTERED_PRODUCTS_BY_PRICE_ASC_QUERY = defineQuery(`
  *[
    ${PRODUCT_FILTER_CONDITIONS}
  ]
  | order(price asc) {
    ${FILTERED_PRODUCT_PROJECTION}
  }
`);

/**
 * Lọc sản phẩm - sắp xếp theo giá giảm dần (price desc)
 * Trả về tối đa 4 ảnh để hiển thị hover preview trên product card
 */
export const FILTERED_PRODUCTS_BY_PRICE_DESC_QUERY = defineQuery(`
  *[
    ${PRODUCT_FILTER_CONDITIONS}
  ]
  | order(price desc) {
    ${FILTERED_PRODUCT_PROJECTION}
  }
`);

/**
 * Lọc sản phẩm - sắp xếp theo độ liên quan (relevance) khi có tìm kiếm
 * Sử dụng score() để xếp hạng theo mức độ khớp từ khóa
 * Ưu tiên tên sản phẩm (boost cao hơn), sau đó là mô tả
 * Sắp xếp theo _score giảm dần, nếu bằng nhau thì theo tên A-Z
 * Trả về tối đa 4 ảnh để hiển thị hover preview
 */
export const FILTER_PRODUCTS_BY_RELEVANCE_QUERY = defineQuery(`
  *[
    ${PRODUCT_FILTER_CONDITIONS}
  ]
  | ${RELEVANCE_SCORE}
  | order(_score desc, name asc) {
    ${FILTERED_PRODUCT_PROJECTION}
  }
`);



/**
 * Get products by IDs (for cart/checkout)
 * Lấy thông tin sản phẩm theo danh sách ID (dùng trong giỏ hàng/thanh toán)
 */
export const PRODUCTS_BY_IDS_QUERY = defineQuery(`
  *[_type == "product" && _id in $ids] {
    _id,
    name,
    "slug": slug.current,
    price,
    "image": images[0]{
      asset->{
        _id,
        url
      },
      hotspot
    },
    stock
  }
`);

/**
 * Get low stock products (admin)
 * Lấy sản phẩm sắp hết hàng (dùng LOW_STOCK_THRESHOLD từ constants)
 * Sắp xếp theo số lượng tồn kho tăng dần
 */
export const LOW_STOCK_PRODUCTS_QUERY = defineQuery(`
  *[_type == "product" && stock > 0 && stock <= ${LOW_STOCK_THRESHOLD}]
  | order(stock asc) {
    _id,
    name,
    "slug": slug.current,
    stock,
    "image": images[0]{
      asset->{
        _id,
        url
      }
    }
  }
`);

/**
 * Get out of stock products (admin)
 * Lấy danh sách sản phẩm đã hết hàng (stock = 0)
 * Sắp xếp theo tên A-Z
 * Dùng cho admin dashboard hoặc báo cáo tồn kho
 */
export const OUT_OF_STOCK_PRODUCTS_QUERY = defineQuery(`
  *[_type == "product" && stock == 0]
  | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    "image": images[0]{
      asset->{
        _id,
        url
      }
    }
  }
`);

// ==============================================
// AI Shopping Assistant Query
// Uses score() + boost() with all filters for AI agent
// ==============================================

/**
 * Tìm kiếm sản phẩm cho AI shopping assistant
 * - Full-featured search với tất cả các bộ lọc và chi tiết sản phẩm
 * - Tự động match theo từ khóa (tên, mô tả, tiêu đề danh mục)
 * - Giới hạn 20 sản phẩm, sắp xếp theo tên A-Z (có thể thay bằng relevance score sau)
 */
export const AI_SEARCH_PRODUCTS_QUERY = defineQuery(`
  *[_type == "product" && (
    $searchQuery == "" ||
    name match $searchQuery + "*" ||
    description match $searchQuery + "*" ||
    category->title match $searchQuery + "*"
  ) &&
    ($categorySlug == "" || category->slug.current == $categorySlug) &&
    ($material == "" || material == $material) &&
    ($color == "" || color == $color) &&
    ($minPrice == 0 || price >= $minPrice) &&
    ($maxPrice == 0 || price <= $maxPrice)
  ]
  | order(name asc)[0...20] {
    _id,
    name,
    "slug": slug.current,
    description,
    price,
    "image": images[0]{
      asset->{
        _id,
        url
      }
    },
    category->{
      _id,
      title,
      "slug": slug.current
    },
    material,
    color,
    dimensions,
    stock,
    featured,
    assemblyRequired
  }
`);