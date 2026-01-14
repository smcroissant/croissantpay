"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Apple,
  Play,
  Upload,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Info,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

type ProductType =
  | "consumable"
  | "non_consumable"
  | "auto_renewable_subscription"
  | "non_renewing_subscription";

interface ParsedProduct {
  storeProductId: string;
  displayName: string;
  type: ProductType;
  subscriptionPeriod?: string;
  trialDuration?: string;
  subscriptionGroupId?: string;
  status: "ready" | "exists" | "error";
  error?: string;
}

// App Store Connect CSV column mappings
const APP_STORE_COLUMNS = {
  SKU: "SKU",
  REFERENCE_NAME: "Reference Name",
  PRODUCT_TYPE: "Type",
  SUBSCRIPTION_DURATION: "Duration",
  FREE_TRIAL: "Free Trial Duration",
  SUBSCRIPTION_GROUP: "Subscription Group",
  CLEARED_FOR_SALE: "Cleared For Sale",
};

// App Store Connect type mappings
const APP_STORE_TYPE_MAP: Record<string, ProductType> = {
  "Consumable": "consumable",
  "Non-Consumable": "non_consumable",
  "Auto-Renewable Subscription": "auto_renewable_subscription",
  "Non-Renewing Subscription": "non_renewing_subscription",
};

// Duration mappings (App Store Connect uses human-readable strings)
const DURATION_MAP: Record<string, string> = {
  "1 Week": "P7D",
  "1 Month": "P1M",
  "2 Months": "P2M",
  "3 Months": "P3M",
  "6 Months": "P6M",
  "1 Year": "P1Y",
  "3 Days": "P3D",
  "7 Days": "P7D",
  "14 Days": "P14D",
  "1 month": "P1M",
  // Also support raw ISO 8601 durations
  "P7D": "P7D",
  "P1M": "P1M",
  "P3M": "P3M",
  "P6M": "P6M",
  "P1Y": "P1Y",
};

export default function ImportProductsPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;

  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [appId, setAppId] = useState("");
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Fetch apps
  const { data: apps, isLoading: loadingApps } = trpc.apps.list.useQuery();
  const { data: existingProducts } = trpc.products.list.useQuery();

  // Import mutations
  const importAppStore = trpc.products.importFromAppStore.useMutation({
    onSuccess: (result) => {
      router.push(`/dashboard/${orgId}/products`);
      router.refresh();
    },
  });

  const importPlayStore = trpc.products.importFromPlayStore.useMutation({
    onSuccess: (result) => {
      router.push(`/dashboard/${orgId}/products`);
      router.refresh();
    },
  });

  const isImporting = importAppStore.isPending || importPlayStore.isPending;
  const importError = importAppStore.error || importPlayStore.error;

  // Auto-select first app if only one
  if (apps?.length === 1 && !appId) {
    setAppId(apps[0].id);
  }

  // Parse CSV content
  const parseCSV = useCallback(
    (content: string): ParsedProduct[] => {
      const lines = content.split("\n").map((line) => line.trim());
      if (lines.length < 2) {
        throw new Error("CSV file is empty or has no data rows");
      }

      // Parse header row (handle quoted values)
      const headers = parseCSVRow(lines[0]);
      const products: ParsedProduct[] = [];

      // Check for required columns based on platform
      const skuCol = headers.findIndex(
        (h) =>
          h === "SKU" ||
          h === "Product ID" ||
          h.toLowerCase().includes("product id") ||
          h.toLowerCase().includes("sku")
      );
      const nameCol = headers.findIndex(
        (h) =>
          h === "Reference Name" ||
          h === "Title" ||
          h === "Name" ||
          h.toLowerCase().includes("name") ||
          h.toLowerCase().includes("title")
      );
      const typeCol = headers.findIndex(
        (h) =>
          h === "Type" ||
          h === "Product Type" ||
          h.toLowerCase().includes("type")
      );

      if (skuCol === -1) {
        throw new Error(
          "Could not find Product ID/SKU column. Expected columns: SKU, Product ID"
        );
      }

      if (nameCol === -1) {
        throw new Error(
          "Could not find Name column. Expected columns: Reference Name, Title, Name"
        );
      }

      // Find optional columns
      const durationCol = headers.findIndex(
        (h) =>
          h === "Duration" ||
          h === "Period" ||
          h.toLowerCase().includes("duration") ||
          h.toLowerCase().includes("period")
      );
      const trialCol = headers.findIndex(
        (h) =>
          h === "Free Trial Duration" ||
          h === "Trial" ||
          h.toLowerCase().includes("trial")
      );
      const groupCol = headers.findIndex(
        (h) =>
          h === "Subscription Group" ||
          h.toLowerCase().includes("subscription group")
      );
      const statusCol = headers.findIndex(
        (h) =>
          h === "Cleared For Sale" ||
          h === "Status" ||
          h.toLowerCase().includes("status") ||
          h.toLowerCase().includes("cleared")
      );

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;

        const values = parseCSVRow(lines[i]);
        if (values.length < Math.max(skuCol, nameCol) + 1) continue;

        const storeProductId = values[skuCol]?.trim();
        const displayName = values[nameCol]?.trim();

        if (!storeProductId || !displayName) continue;

        // Skip if "Cleared For Sale" is "No" or status is inactive
        if (statusCol !== -1) {
          const status = values[statusCol]?.trim()?.toLowerCase();
          if (status === "no" || status === "inactive" || status === "false") {
            continue;
          }
        }

        // Determine type
        let type: ProductType = "non_consumable";
        if (typeCol !== -1 && values[typeCol]) {
          const rawType = values[typeCol].trim();
          type = APP_STORE_TYPE_MAP[rawType] || inferType(rawType);
        }

        // Get duration
        let subscriptionPeriod: string | undefined;
        if (durationCol !== -1 && values[durationCol]) {
          subscriptionPeriod =
            DURATION_MAP[values[durationCol].trim()] ||
            values[durationCol].trim();
        }

        // Get trial duration
        let trialDuration: string | undefined;
        if (trialCol !== -1 && values[trialCol]) {
          trialDuration =
            DURATION_MAP[values[trialCol].trim()] || values[trialCol].trim();
        }

        // Get subscription group
        let subscriptionGroupId: string | undefined;
        if (groupCol !== -1 && values[groupCol]) {
          subscriptionGroupId = values[groupCol].trim();
        }

        // Check if product already exists
        const exists = existingProducts?.some(
          (p) =>
            p.storeProductId === storeProductId &&
            p.platform === platform &&
            p.appId === appId
        );

        products.push({
          storeProductId,
          displayName,
          type,
          subscriptionPeriod,
          trialDuration,
          subscriptionGroupId,
          status: exists ? "exists" : "ready",
        });
      }

      return products;
    },
    [existingProducts, platform, appId]
  );

  // Parse CSV row handling quoted values
  const parseCSVRow = (row: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const nextChar = row[i + 1];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    return values;
  };

  // Infer type from string
  const inferType = (typeStr: string): ProductType => {
    const lower = typeStr.toLowerCase();
    if (lower.includes("auto") && lower.includes("renew")) {
      return "auto_renewable_subscription";
    }
    if (lower.includes("subscription") || lower.includes("non-renew")) {
      return "non_renewing_subscription";
    }
    if (lower.includes("consumable") && !lower.includes("non")) {
      return "consumable";
    }
    return "non_consumable";
  };

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setParseError(null);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      if (
        !file.name.endsWith(".csv") &&
        !file.name.endsWith(".txt") &&
        !file.type.includes("csv")
      ) {
        setParseError("Please upload a CSV file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const products = parseCSV(content);
          if (products.length === 0) {
            setParseError("No valid products found in the file");
          } else {
            setParsedProducts(products);
          }
        } catch (error) {
          setParseError(
            error instanceof Error ? error.message : "Failed to parse file"
          );
        }
      };
      reader.onerror = () => setParseError("Failed to read file");
      reader.readAsText(file);
    },
    [parseCSV]
  );

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setParseError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const products = parseCSV(content);
          if (products.length === 0) {
            setParseError("No valid products found in the file");
          } else {
            setParsedProducts(products);
          }
        } catch (error) {
          setParseError(
            error instanceof Error ? error.message : "Failed to parse file"
          );
        }
      };
      reader.readAsText(file);
    },
    [parseCSV]
  );

  // Handle import
  const handleImport = () => {
    const productsToImport = parsedProducts.filter(
      (p) => p.status === "ready" || (p.status === "exists" && updateExisting)
    );

    if (productsToImport.length === 0) {
      return;
    }

    if (platform === "ios") {
      importAppStore.mutate({
        appId,
        products: productsToImport,
        updateExisting,
      });
    } else {
      importPlayStore.mutate({
        appId,
        products: productsToImport,
        updateExisting,
      });
    }
  };

  const readyCount = parsedProducts.filter((p) => p.status === "ready").length;
  const existsCount = parsedProducts.filter((p) => p.status === "exists").length;

  if (loadingApps) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!apps || apps.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/dashboard/${orgId}/products`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>

        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Apps Yet</h2>
          <p className="text-muted-foreground mb-6">
            You need to create an app before you can import products.
          </p>
          <Link
            href={`/dashboard/${orgId}/apps/new`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Your First App
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href={`/dashboard/${orgId}/products`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Products</span>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Import Products</h1>
        <p className="text-muted-foreground">
          Import products from App Store Connect or Google Play Console using
          CSV export
        </p>
      </div>

      {/* Error */}
      {importError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
          {importError.message}
        </div>
      )}

      {/* Step 1: Select Platform */}
      {!platform && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Select Platform</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPlatform("ios")}
              className="p-6 rounded-xl border-2 border-border hover:border-primary/50 transition-all"
            >
              <Apple className="w-10 h-10 mx-auto mb-3" />
              <p className="font-medium">iOS</p>
              <p className="text-xs text-muted-foreground mt-1">
                Import from App Store Connect
              </p>
            </button>
            <button
              type="button"
              onClick={() => setPlatform("android")}
              className="p-6 rounded-xl border-2 border-border hover:border-primary/50 transition-all"
            >
              <Play className="w-10 h-10 mx-auto mb-3" />
              <p className="font-medium">Android</p>
              <p className="text-xs text-muted-foreground mt-1">
                Import from Google Play Console
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Configure & Upload */}
      {platform && parsedProducts.length === 0 && (
        <div className="space-y-6">
          {/* Platform Selection & App */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {platform === "ios" ? (
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Apple className="w-5 h-5 text-blue-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Play className="w-5 h-5 text-green-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {platform === "ios"
                      ? "App Store Connect"
                      : "Google Play Console"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload your product export CSV
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPlatform(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Change
              </button>
            </div>

            {/* App Selection */}
            {apps.length > 1 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select App
                </label>
                <select
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                >
                  <option value="">Select an app</option>
                  {apps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-400 mb-2">
                  How to export from{" "}
                  {platform === "ios"
                    ? "App Store Connect"
                    : "Google Play Console"}
                </p>
                {platform === "ios" ? (
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Go to App Store Connect → Your App → Monetization → In-App Purchases</li>
                    <li>Click the export button (⬇) to download your products</li>
                    <li>Select CSV format and download</li>
                    <li>Upload the downloaded file below</li>
                  </ol>
                ) : (
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Go to Google Play Console → Your App → Monetize → Products</li>
                    <li>Click "Export" to download your products list</li>
                    <li>Upload the downloaded CSV file below</li>
                  </ol>
                )}
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`bg-card border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            } ${!appId ? "opacity-50 pointer-events-none" : ""}`}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">
              Drop your CSV file here, or click to browse
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports CSV exports from{" "}
              {platform === "ios" ? "App Store Connect" : "Google Play Console"}
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer">
              <FileText className="w-4 h-4" />
              <span>Select File</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
                disabled={!appId}
              />
            </label>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Failed to parse file</p>
                <p className="text-sm opacity-80">{parseError}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Review & Import */}
      {parsedProducts.length > 0 && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Review Products</h2>
              <button
                onClick={() => setParsedProducts([])}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Upload Different File
              </button>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="flex-1 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-2xl font-bold text-green-400">{readyCount}</p>
                <p className="text-sm text-muted-foreground">New Products</p>
              </div>
              <div className="flex-1 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-2xl font-bold text-yellow-400">
                  {existsCount}
                </p>
                <p className="text-sm text-muted-foreground">Already Exist</p>
              </div>
            </div>

            {/* Update existing toggle */}
            {existsCount > 0 && (
              <label className="flex items-center gap-3 p-4 rounded-xl bg-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium">Update existing products</p>
                  <p className="text-sm text-muted-foreground">
                    Overwrite {existsCount} existing products with imported data
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Product List */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/50">
              <p className="font-medium">Products to Import</p>
            </div>
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {parsedProducts.map((product, index) => (
                <div
                  key={index}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium">{product.displayName}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {product.storeProductId}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                        {product.type.replace(/_/g, " ")}
                      </span>
                      {product.subscriptionPeriod && (
                        <span className="text-xs text-muted-foreground">
                          {product.subscriptionPeriod}
                        </span>
                      )}
                      {product.trialDuration && (
                        <span className="text-xs text-muted-foreground">
                          Trial: {product.trialDuration}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {product.status === "ready" && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">
                        <Check className="w-3 h-3" />
                        Ready
                      </span>
                    )}
                    {product.status === "exists" && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
                        <RefreshCw className="w-3 h-3" />
                        Exists
                      </span>
                    )}
                    {product.status === "error" && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        Error
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href={`/dashboard/${orgId}/products`}
              className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              onClick={handleImport}
              disabled={
                isImporting ||
                (readyCount === 0 && (!updateExisting || existsCount === 0))
              }
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <>
                  Import{" "}
                  {updateExisting
                    ? readyCount + existsCount
                    : readyCount}{" "}
                  Products
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
