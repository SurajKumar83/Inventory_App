import { useCallback, useEffect, useState } from "react";
import { updateProduct } from "../../services/inventory.service.js";
import Button from "../common/Button.jsx";

/**
 * EditProductForm - Form component for editing existing products
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.product - Product to edit
 * @param {Function} props.onSubmit - Callback after successful update
 * @param {Function} props.onCancel - Callback when form is cancelled
 * @returns {ReactElement} Form component
 */
export default function EditProductForm({ product, onSubmit, onCancel }) {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    unit: "",
    imageUrls: [""],
    isActive: true,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category options matching backend enum
  const categories = [
    { value: "STAPLES", label: "Staples" },
    { value: "FRESH_PRODUCE", label: "Fresh Produce" },
    { value: "DAIRY", label: "Dairy" },
    { value: "PACKAGED_GOODS", label: "Packaged Goods" },
    { value: "SPICES", label: "Spices & Condiments" },
    { value: "PERSONAL_CARE", label: "Personal Care" },
    { value: "OTHER", label: "Other" },
  ];

  // Unit options matching backend enum
  const units = [
    { value: "KG", label: "Kilogram (kg)" },
    { value: "LITER", label: "Liter (L)" },
    { value: "PIECE", label: "Piece" },
    { value: "PACKET", label: "Packet" },
  ];

  // Initialize form with product data
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        category: product.category || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        unit: product.unit || "",
        imageUrls:
          product.imageUrls && product.imageUrls.length > 0
            ? product.imageUrls
            : [""],
        isActive: product.isActive ?? true,
      });
    }
  }, [product]);

  /**
   * Validate form data client-side before submission
   * @returns {boolean} True if form is valid
   */
  const validateForm = useCallback(() => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Product name is required";
    } else if (formData.name.length < 3) {
      errors.name = "Name must be at least 3 characters";
    } else if (formData.name.length > 100) {
      errors.name = "Name must be 100 characters or less";
    }

    // Category validation
    if (!formData.category) {
      errors.category = "Category is required";
    }

    // Unit validation
    if (!formData.unit.trim()) {
      errors.unit = "Unit is required";
    } else if (formData.unit.length > 20) {
      errors.unit = "Unit must be 20 characters or less";
    }

    // Price validation
    if (!formData.price) {
      errors.price = "Price is required";
    } else if (parseFloat(formData.price) <= 0) {
      errors.price = "Price must be greater than 0";
    } else if (!/^\d+(\.\d{1,2})?$/.test(formData.price)) {
      errors.price = "Price must have up to 2 decimal places";
    }

    // Image URLs validation (only if provided)
    const providedUrls = formData.imageUrls.filter((url) => url.trim());
    if (providedUrls.length > 0) {
      const validUrls = providedUrls.every((url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });
      if (!validUrls) {
        errors.imageUrls = "All image URLs must be valid";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  /**
   * Handle form input changes
   */
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      // Clear error for this field when user starts typing
      if (fieldErrors[name]) {
        setFieldErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
    },
    [fieldErrors],
  );

  /**
   * Handle image URL input changes
   */
  const handleImageUrlChange = useCallback(
    (index, value) => {
      setFormData((prev) => {
        const newUrls = [...prev.imageUrls];
        newUrls[index] = value;
        return {
          ...prev,
          imageUrls: newUrls,
        };
      });
      if (fieldErrors.imageUrls) {
        setFieldErrors((prev) => ({
          ...prev,
          imageUrls: "",
        }));
      }
    },
    [fieldErrors],
  );

  /**
   * Add new image URL input field
   */
  const handleAddImageUrl = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ""],
    }));
  }, []);

  /**
   * Remove image URL input field
   */
  const handleRemoveImageUrl = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build payload matching API contract
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        unit: formData.unit.trim(),
        price: parseFloat(formData.price),
        imageUrls: formData.imageUrls.filter((url) => url.trim()),
        isActive: formData.isActive,
      };

      // Call API via service
      await updateProduct(product.id, payload);

      // Callback to parent
      if (onSubmit) {
        await onSubmit();
      }
    } catch (error) {
      // Error handling
      if (error.response?.data?.details) {
        setFieldErrors(error.response.data.details);
      } else if (error.response?.data?.error) {
        setGlobalError(error.response.data.error);
      } else if (error.message) {
        setGlobalError(error.message);
      } else {
        setGlobalError("Failed to update product. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Global Error */}
      {globalError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {globalError}
        </div>
      )}

      {/* Product Info */}
      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">SKU:</span> {product.sku}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Note: SKU cannot be changed after creation
        </p>
      </div>

      {/* Two-column grid for desktop, single column for mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Basmati Rice Premium"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
            disabled={isSubmitting}
          />
          {fieldErrors.name && (
            <p className="text-rose-600 text-sm mt-1">{fieldErrors.name}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
            disabled={isSubmitting}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {fieldErrors.category && (
            <p className="text-rose-600 text-sm mt-1">{fieldErrors.category}</p>
          )}
        </div>

        {/* Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit <span className="text-red-500">*</span>
          </label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
            disabled={isSubmitting}
          >
            <option value="">Select unit</option>
            {units.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
          {fieldErrors.unit && (
            <p className="text-rose-600 text-sm mt-1">{fieldErrors.unit}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            placeholder="e.g., 150.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
            disabled={isSubmitting}
          />
          {fieldErrors.price && (
            <p className="text-rose-600 text-sm mt-1">{fieldErrors.price}</p>
          )}
        </div>

        {/* Active Status */}
        <div>
          <label className="flex items-center space-x-2 py-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-dukaan-green-600 focus:ring-dukaan-green-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <span className="text-sm font-medium text-gray-700">
              Product is active
            </span>
          </label>
          <p className="text-xs text-gray-500 ml-6">
            Inactive products won't appear in the storefront
          </p>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the product..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent resize-none"
            disabled={isSubmitting}
          />
          {fieldErrors.description && (
            <p className="text-rose-600 text-sm mt-1">
              {fieldErrors.description}
            </p>
          )}
        </div>

        {/* Image URLs */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URLs
          </label>
          {formData.imageUrls.map((url, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleImageUrlChange(index, e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              {formData.imageUrls.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRemoveImageUrl(index)}
                  disabled={isSubmitting}
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
          {fieldErrors.imageUrls && (
            <p className="text-rose-600 text-sm mt-1">
              {fieldErrors.imageUrls}
            </p>
          )}
          {formData.imageUrls.length < 5 && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddImageUrl}
              disabled={isSubmitting}
              className="mt-2"
            >
              + Add Image URL
            </Button>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Product"}
        </Button>
      </div>
    </form>
  );
}
