export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryId: string | null;
  isActive: boolean;
};

export function validateProductRecord(value: Partial<ProductRecord>): value is ProductRecord {
  return Boolean(
    value.id &&
      value.name &&
      value.slug &&
      value.description &&
      typeof value.price === "number" &&
      typeof value.stock === "number" &&
      value.isActive !== undefined,
  );
}

export function sanitizeProductForResponse(record: ProductRecord) {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    price: record.price,
    imageUrl: record.imageUrl,
    stock: record.stock,
    categoryId: record.categoryId,
    isActive: record.isActive,
  };
}
