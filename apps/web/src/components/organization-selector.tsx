"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Loader2,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export function OrganizationSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();
  const { data: organizations, isLoading } =
    trpc.organizations.list.useQuery();

  // Extract orgId from URL: /dashboard/[orgId]/...
  const segments = pathname.split("/");
  const dashboardIndex = segments.indexOf("dashboard");
  const currentOrgId = dashboardIndex >= 0 ? segments[dashboardIndex + 1] : undefined;

  const currentOrg = organizations?.find((o) => o.id === currentOrgId);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectOrg = async (orgId: string) => {
    // Store selected org in cookie
    document.cookie = `selectedOrgId=${orgId}; path=/; max-age=31536000`;
    setIsOpen(false);
    
    // Invalidate all cached queries to force refetch with new org context
    await utils.invalidate();
    
    // Navigate to the same path but with the new orgId
    // Replace old orgId in URL with new one
    const segments = pathname.split("/");
    const dashboardIndex = segments.indexOf("dashboard");
    
    if (dashboardIndex >= 0 && segments[dashboardIndex + 1]) {
      // Replace the orgId segment
      segments[dashboardIndex + 1] = orgId;
      router.push(segments.join("/"));
    } else {
      // Navigate to the new org dashboard
      router.push(`/dashboard/${orgId}`);
    }
    
    // Force a full refresh to re-fetch server components data
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center rounded-lg bg-secondary min-w-[180px]">
          {/* Link to current org dashboard */}
          <Link
            href={currentOrgId ? `/dashboard/${currentOrgId}` : "/dashboard"}
            className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/80 transition-colors flex-1 rounded-l-lg"
          >
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-left text-sm font-medium truncate max-w-[120px]">
              {currentOrg?.name || "Select Organization"}
            </span>
          </Link>
          
          {/* Dropdown toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-2 py-2 hover:bg-secondary/80 transition-colors rounded-r-lg border-l border-border/50"
          >
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
            <div className="p-2 border-b border-border">
              <p className="text-xs text-muted-foreground px-2">
                Your Organizations
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {organizations?.map((org) => (
                <Link
                  key={org.id}
                  href={`/dashboard/${org.id}`}
                  onClick={() => handleSelectOrg(org.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {org.slug} • {org.role}
                    </p>
                  </div>
                  {org.id === currentOrgId && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </Link>
              ))}

              {(!organizations || organizations.length === 0) && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No organizations yet
                  </p>
                </div>
              )}
            </div>

            <div className="p-2 border-t border-border">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Organization</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(orgId) => {
            setShowCreateModal(false);
            handleSelectOrg(orgId);
          }}
        />
      )}
    </>
  );
}

function CreateOrganizationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (orgId: string) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);

  const utils = trpc.useUtils();

  const createOrg = trpc.organizations.create.useMutation({
    onSuccess: (data) => {
      utils.organizations.list.invalidate();
      onCreated(data.id);
    },
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (autoSlug && name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
  }, [name, autoSlug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    createOrg.mutate({ name: name.trim(), slug: slug.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Create Organization</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {createOrg.error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {createOrg.error.message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Organization Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Company"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Slug (URL identifier)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAutoSlug(false);
              }}
              placeholder="my-company"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Only lowercase letters, numbers, and hyphens
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createOrg.isPending || !name.trim() || !slug.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createOrg.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

