import { useCallback, useState } from "react";
import { createProduct } from "../../services/inventory.service.js";
import Button from "../common/Button.jsx";
import Modal from "../common/Modal.jsx";

/**
 * AddProductForm - Modal form component for creating new products
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal should close
 * @param {Function} [props.onSuccess] - Callback after successful creation
 * @returns {ReactElement} Modal form component
 */
export default function AddProductForm({ isOpen, onClose, onSuccess }) {
  // Form state
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    description: "",
    unit: "",
    price: "",
    imageUrls: [""],
    reorderLevel: "",
    initialStockShop1: "",
    initialStockShop2: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category options matching backend enum
  const categories = [
    { value: "STAPLES", label: "Staples" },
    { value: "FRESH_PRODUCE", label: "Fresh Produce" },
    { value: "DAIRY", label: "Dairy" },
    { value: "PACKAGED_GOODS", label: "Packaged Goods" },
    { value: "SPICES", label: "Spices & Condiments" },
    { value: "PERSONAL_CARE", label: "Personal Care" },
  ];

  // Unit suggestions
  const unitSuggestions = ["kg", "L", "piece", "box", "pack"];

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData({
      sku: "",
      name: "",
      category: "",
      description: "",
      unit: "",
      price: "",
      imageUrls: [""],
      reorderLevel: "",
      initialStockShop1: "",
      initialStockShop2: "",
    });
    setFieldErrors({});
    setGlobalError("");
    setSuccessMessage("");
  }, []);

  /**
   * Handle modal close and reset form
   */
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  /**
   * Validate form data client-side before submission
   * @returns {boolean} True if form is valid
   */
  const validateForm = useCallback(() => {
    const errors = {};

    // SKU validation
    if (!formData.sku.trim()) {
      errors.sku = "SKU is required";
    } else if (formData.sku.length > 50) {
      errors.sku = "SKU must be 50 characters or less";
    } else if (!/^[A-Z0-9\-]+$/.test(formData.sku.toUpperCase())) {
      errors.sku =
        "SKU must contain only uppercase letters, numbers, and hyphens";
    }

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

    // Reorder Level validation
    if (!formData.reorderLevel) {
      errors.reorderLevel = "Reorder level is required";
    } else if (parseInt(formData.reorderLevel) < 1) {
      errors.reorderLevel = "Reorder level must be at least 1";
    }

    // Initial Stock Shop 1 validation
    if (formData.initialStockShop1 === "") {
      errors.initialStockShop1 = "Initial stock for Shop 1 is required";
    } else if (parseInt(formData.initialStockShop1) < 0) {
      errors.initialStockShop1 = "Stock cannot be negative";
    }

    // Initial Stock Shop 2 validation
    if (formData.initialStockShop2 === "") {
      errors.initialStockShop2 = "Initial stock for Shop 2 is required";
    } else if (parseInt(formData.initialStockShop2) < 0) {
      errors.initialStockShop2 = "Stock cannot be negative";
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
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
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
    setSuccessMessage("");

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build payload matching API contract
      const payload = {
        sku: formData.sku.toUpperCase().trim(),
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        unit: formData.unit.trim(),
        price: parseFloat(formData.price),
        imageUrls: formData.imageUrls.filter((url) => url.trim()),
        reorderLevel: parseInt(formData.reorderLevel),
        initialStock: {
          shop1: parseInt(formData.initialStockShop1),
          shop2: parseInt(formData.initialStockShop2),
        },
      };

      // Call API via service
      const response = await createProduct(payload);

      // Success handling
      setSuccessMessage("Product created successfully!");

      // Reset form
      resetForm();

      // Callback to parent
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Auto-close modal after 1.5 seconds
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      // Error handling
      if (error.response?.status === 409) {
        setFieldErrors((prev) => ({
          ...prev,
          sku: "This SKU already exists. Please use a different SKU.",
        }));
      } else if (error.response?.data?.details) {
        setFieldErrors(error.response.data.details);
      } else if (error.response?.data?.error) {
        setGlobalError(error.response.data.error);
      } else if (error.message) {
        setGlobalError(error.message);
      } else {
        setGlobalError("Failed to create product. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Product"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Global Error */}
        {globalError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {globalError}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {/* Two-column grid for desktop, single column for mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="e.g., RICE-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            {fieldErrors.sku && (
              <p className="text-rose-600 text-sm mt-1">{fieldErrors.sku}</p>
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
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="text-rose-600 text-sm mt-1">
                {fieldErrors.category}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Premium Basmati Rice"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            {fieldErrors.name && (
              <p className="text-rose-600 text-sm mt-1">{fieldErrors.name}</p>
            )}
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
              placeholder="Optional product description"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              placeholder="e.g., kg, L, piece"
              list="unit-suggestions"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <datalist id="unit-suggestions">
              {unitSuggestions.map((unit) => (
                <option key={unit} value={unit} />
              ))}
            </datalist>
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
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            {fieldErrors.price && (
              <p className="text-rose-600 text-sm mt-1">{fieldErrors.price}</p>
            )}
          </div>

          {/* Reorder Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reorder Level <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="reorderLevel"
              value={formData.reorderLevel}
              onChange={handleChange}
              placeholder="e.g., 20"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            {fieldErrors.reorderLevel && (
              <p className="text-rose-600 text-sm mt-1">
                {fieldErrors.reorderLevel}
              </p>
            )}
          </div>

          {/* Image URLs */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URLs (Optional)
            </label>
            <div className="space-y-2">
              {formData.imageUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) =>
                      handleImageUrlChange(index, e.target.value)
                    }
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                  {formData.imageUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImageUrl(index)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="text-sm text-dukaan-green-600 hover:text-dukaan-green-700 font-medium"
                disabled={isSubmitting}
              >
                + Add another image
              </button>
            </div>
            {fieldErrors.imageUrls && (
              <p className="text-rose-600 text-sm mt-1">
                {fieldErrors.imageUrls}
              </p>
            )}
          </div>

          {/* Shop 1 Initial Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop 1 Initial Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="initialStockShop1"
              value={formData.initialStockShop1}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            {fieldErrors.initialStockShop1 && (
              <p className="text-rose-600 text-sm mt-1">
                {fieldErrors.initialStockShop1}
              </p>
            )}
          </div>

          {/* Shop 2 Initial Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop 2 Initial Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="initialStockShop2"
              value={formData.initialStockShop2}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            {fieldErrors.initialStockShop2 && (
              <p className="text-rose-600 text-sm mt-1">
                {fieldErrors.initialStockShop2}
              </p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
