'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
  Button,
  DataTable,
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
  FileUpload, useFileUpload,
  Input,
  Skeleton,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
  type ColumnDef,
} from '@flexcms/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AssetType = 'image' | 'video' | 'pdf' | 'zip' | 'xlsx' | 'document' | 'other';
type AssetStatus = 'active' | 'processing' | 'error';

interface Asset {
  id: string;
  name: string;
  type: AssetType;
  size: string;          // formatted string e.g. "2.4 MB"
  sizeBytes: number;
  dimensions?: string;   // e.g. "2400 × 1200"
  duration?: string;     // video only e.g. "0:45"
  pages?: number;        // pdf
  sheets?: number;       // xlsx
  files?: number;        // zip
  folder: string;
  uploadedAt: string;
  status: AssetStatus;
  thumbnailBg?: string;  // gradient or color for non-image thumbnails
  previewUrl?: string;   // URL to stream asset content
  selected?: boolean;
}

interface Folder {
  id: string;
  name: string;
  count: number;
}

type ViewMode = 'grid' | 'list';

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_FLEXCMS_API ?? 'http://localhost:8080';

// Map backend Asset entity to UI Asset type
function apiToAsset(a: Record<string, unknown>): Asset {
  const mimeType = (a.mimeType as string) ?? '';
  let type: AssetType = 'other';
  const name = (a.name as string) ?? (a.originalFilename as string) ?? 'unnamed';
  if (mimeType.startsWith('image/')) type = 'image';
  else if (mimeType.startsWith('video/')) type = 'video';
  else if (mimeType === 'application/pdf' || name.endsWith('.pdf')) type = 'pdf';
  else if (name.endsWith('.zip') || name.endsWith('.gz') || name.endsWith('.tar')) type = 'zip';
  else if (name.endsWith('.xlsx') || name.endsWith('.xls')) type = 'xlsx';
  else if (mimeType.startsWith('application/')) type = 'document';

  const sizeBytes = (a.fileSize as number) ?? 0;
  const width = a.width as number | undefined;
  const height = a.height as number | undefined;
  const dimensions = width && height ? `${width} × ${height}` : undefined;

  const folder = inferFolder(type);

  const id = (a.id as string) ?? String(Math.random());
  const previewUrl = type === 'image' ? `${API_BASE}/api/author/assets/${id}/content` : undefined;

  return {
    id,
    name,
    type,
    size: formatBytes(sizeBytes),
    sizeBytes,
    dimensions,
    folder,
    uploadedAt: a.createdAt
      ? new Date(a.createdAt as string).toISOString().slice(0, 10)
      : '—',
    status: ((a.status as string) ?? 'ACTIVE').toLowerCase() === 'active' ? 'active'
      : ((a.status as string) ?? '').toLowerCase() === 'processing' ? 'processing'
      : 'error',
    previewUrl,
  };
}

function inferFolder(type: AssetType): string {
  switch (type) {
    case 'image': return 'images';
    case 'video': return 'videos';
    case 'pdf': case 'xlsx': case 'document': return 'documents';
    case 'zip': return 'archives';
    default: return 'documents';
  }
}


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAssetMeta(asset: Asset): string {
  if (asset.type === 'image' && asset.dimensions) return `${asset.size} • ${asset.dimensions}`;
  if (asset.type === 'video' && asset.dimensions) return `${asset.size} • ${asset.dimensions}`;
  if (asset.type === 'pdf' && asset.pages)   return `${asset.size} • ${asset.pages} Pages`;
  if (asset.type === 'xlsx' && asset.sheets) return `${asset.size} • ${asset.sheets} Sheets`;
  if (asset.type === 'zip' && asset.files)   return `${asset.size} • ${asset.files} Files`;
  return asset.size;
}

const TYPE_CONFIG: Record<AssetType, { label: string; color: string; icon: React.ReactNode }> = {
  image:    { label: 'Image',    color: 'var(--color-primary)',    icon: <ImageIcon /> },
  video:    { label: 'Video',    color: 'var(--color-primary)',    icon: <VideoIcon /> },
  pdf:      { label: 'PDF',      color: '#ef4444',                 icon: <PdfIcon /> },
  zip:      { label: 'ZIP',      color: '#3b82f6',                 icon: <ArchiveIcon /> },
  xlsx:     { label: 'XLSX',     color: '#34d399',                 icon: <SpreadsheetIcon /> },
  document: { label: 'Document', color: 'var(--color-foreground)', icon: <FileTextIcon /> },
  other:    { label: 'File',     color: 'var(--color-muted-foreground)', icon: <FileTextIcon /> },
};

const STATUS_BADGE: Record<AssetStatus, { label: string; className: string }> = {
  active:     { label: 'Active',     className: 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' },
  processing: { label: 'Processing', className: 'text-[#ffb59b] bg-[#ffb59b]/10' },
  error:      { label: 'Error',      className: 'text-[#ffb4ab] bg-[#93000a]/20' },
};

// ---------------------------------------------------------------------------
// Asset thumbnail component
// ---------------------------------------------------------------------------

function AssetThumbnail({ asset, size = 'md' }: { asset: Asset; size?: 'sm' | 'md' }) {
  const isLarge = size === 'md';
  const cfg = TYPE_CONFIG[asset.type];
  const iconSize = isLarge ? 'text-5xl' : 'text-2xl';

  if (asset.type === 'image') {
    return (
      <div className={`w-full aspect-square rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-muted)]/30 relative`}>
        {asset.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.previewUrl} alt={asset.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${cfg.color}22 0%, ${cfg.color}44 100%)` }}>
            <ImageIcon className={isLarge ? 'h-8 w-8' : 'h-5 w-5'} color={cfg.color} />
          </div>
        )}
        {asset.status === 'processing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <SpinnerIcon />
          </div>
        )}
      </div>
    );
  }

  if (asset.type === 'video') {
    return (
      <div className="w-full aspect-square rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-muted)]/30 relative flex items-center justify-center"
        style={{ background: 'rgba(176,198,255,0.05)' }}>
        <VideoIcon className={isLarge ? 'h-10 w-10' : 'h-5 w-5'} color={cfg.color} />
        {asset.duration && isLarge && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] text-white font-medium"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            {asset.duration}
          </span>
        )}
      </div>
    );
  }

  const typeLabel = TYPE_CONFIG[asset.type].label;
  return (
    <div className="w-full aspect-square rounded-[var(--radius-md)] overflow-hidden flex flex-col items-center justify-center gap-1.5"
      style={{ background: asset.thumbnailBg ?? 'var(--color-muted)/20)' }}>
      <span style={{ color: cfg.color, fontSize: isLarge ? '2.5rem' : '1.25rem' }}>
        {cfg.icon}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
        {typeLabel}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asset context menu
// ---------------------------------------------------------------------------

function AssetMenu({ asset, onDelete }: { asset: Asset; onDelete: (id: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7"
          aria-label="Asset actions" onClick={(e) => e.stopPropagation()}>
          <DotsIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dam/${asset.id}`}>
            <InfoIcon className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <DownloadIcon className="h-4 w-4 mr-2" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem>
          <MoveIcon className="h-4 w-4 mr-2" />
          Move to folder
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CopyIcon className="h-4 w-4 mr-2" />
          Copy URL
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-[var(--color-destructive)]"
          onClick={() => onDelete(asset.id)}>
          <TrashIcon className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function DamBrowserPage() {
  const router = useRouter();
  const [viewMode, setViewMode]       = useState<ViewMode>('grid');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [assets, setAssets]           = useState<Asset[]>([]);
  const [uploadOpen, setUploadOpen]   = useState(false);
  const [loading, setLoading]         = useState(true);

  const { files: uploadFiles, addFiles, clear: clearUploadFiles } = useFileUpload();

  // Compute folder list dynamically from loaded assets
  const folders: Folder[] = useMemo(() => {
    const folderNames = ['images', 'videos', 'documents', 'archives'];
    return folderNames.map((name) => ({
      id: name,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: assets.filter((a) => a.folder === name).length,
    }));
  }, [assets]);

  // Fetch assets from backend API
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/author/assets?size=200`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        const items: Asset[] = ((data.items ?? []) as Record<string, unknown>[]).map(apiToAsset);
        setAssets(items);
      })
      .catch(() => {
        setAssets([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter
  const filtered = useMemo(() => {
    return assets.filter((a) => {
      const matchFolder = !activeFolder || a.folder === activeFolder;
      const matchSearch = !search.trim() ||
        a.name.toLowerCase().includes(search.toLowerCase());
      return matchFolder && matchSearch;
    });
  }, [assets, activeFolder, search]);

  function toggleSelect(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  }

  function deleteAsset(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  function deleteSelected() {
    setAssets((prev) => prev.filter((a) => !selected.has(a.id)));
    setSelected(new Set());
  }

  function handleUpload() {
    // Upload each file via the real backend API
    const uploads = uploadFiles.map(async (uf) => {
      const formData = new FormData();
      formData.append('file', uf.file);
      formData.append('path', `/dam/${activeFolder ?? 'images'}/${uf.file.name}`);
      formData.append('siteId', 'corporate');
      formData.append('userId', 'admin');
      try {
        const res = await fetch(`${API_BASE}/api/author/assets`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const saved = await res.json();
          return apiToAsset(saved);
        }
      } catch { /* ignore, fallback below */ }
      // Fallback: create a local placeholder if API call fails
      return {
        id: `new-${Date.now()}-${Math.random()}`,
        name: uf.file.name,
        type: (uf.file.type.startsWith('image/') ? 'image'
          : uf.file.type.startsWith('video/') ? 'video'
          : uf.file.name.endsWith('.pdf') ? 'pdf'
          : uf.file.name.endsWith('.zip') ? 'zip'
          : uf.file.name.endsWith('.xlsx') ? 'xlsx'
          : 'other') as AssetType,
        size: formatBytes(uf.file.size),
        sizeBytes: uf.file.size,
        folder: activeFolder ?? 'images',
        uploadedAt: new Date().toISOString().slice(0, 10),
        status: 'processing' as AssetStatus,
      };
    });
    Promise.all(uploads).then((newAssets) => {
      setAssets((prev) => [...newAssets, ...prev]);
      clearUploadFiles();
      setUploadOpen(false);
    });
  }

  // List mode columns
  const columns: ColumnDef<Asset>[] = [
    {
      id: 'select',
      header: () => (
        <input type="checkbox" className="h-4 w-4 rounded accent-[var(--color-primary)]"
          checked={selected.size === filtered.length && filtered.length > 0}
          onChange={selectAll} aria-label="Select all" />
      ),
      cell: ({ row }) => (
        <input type="checkbox" className="h-4 w-4 rounded accent-[var(--color-primary)]"
          checked={selected.has(row.original.id)}
          onChange={(e) => { e.stopPropagation(); toggleSelect(row.original.id); }}
          aria-label={`Select ${row.original.name}`} />
      ),
      size: 40,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const asset = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-[var(--radius-sm)] overflow-hidden flex items-center justify-center"
              style={{ background: asset.thumbnailBg ?? 'var(--color-muted)/20' }}>
              <AssetThumbnail asset={asset} size="sm" />
            </div>
            <span className="font-medium text-[var(--color-foreground)] truncate max-w-[200px]">
              {asset.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const cfg = TYPE_CONFIG[row.original.type];
        return (
          <span className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: cfg.color }}>{cfg.label}</span>
        );
      },
      size: 80,
    },
    {
      id: 'meta',
      header: 'Info',
      cell: ({ row }) => (
        <span className="text-xs text-[var(--color-muted-foreground)]">{getAssetMeta(row.original)}</span>
      ),
    },
    {
      accessorKey: 'uploadedAt',
      header: 'Uploaded',
      cell: ({ row }) => (
        <span className="text-xs text-[var(--color-muted-foreground)]">{row.original.uploadedAt}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = STATUS_BADGE[row.original.status];
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.className}`}>
            {s.label}
          </span>
        );
      },
      size: 100,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <AssetMenu asset={row.original} onDelete={deleteAsset} />,
      size: 48,
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full min-h-0">
        {/* Breadcrumb */}
        <div className="px-6 pt-4 pb-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Assets</BreadcrumbPage>
              </BreadcrumbItem>
              {activeFolder && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="capitalize">{activeFolder}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left panel: folder tree */}
          <aside className="w-56 shrink-0 border-r border-[var(--color-border)] flex flex-col py-4 px-3 gap-1 overflow-y-auto">
            <p className="px-2 mb-2 text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              Folders
            </p>

            {/* All assets */}
            <button
              onClick={() => setActiveFolder(null)}
              className={`flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors w-full text-left
                ${!activeFolder
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--color-foreground)] hover:bg-[var(--color-accent)]'
                }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpenIcon className="h-4 w-4 shrink-0" />
                <span>All Assets</span>
              </div>
              <span className="text-[10px] text-[var(--color-muted-foreground)]">
                {assets.length}
              </span>
            </button>

            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors w-full text-left
                  ${activeFolder === folder.id
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--color-foreground)] hover:bg-[var(--color-accent)]'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <FolderIcon className="h-4 w-4 shrink-0" />
                  <span>{folder.name}</span>
                </div>
                <span className="text-[10px] text-[var(--color-muted-foreground)]">
                  {folder.count}
                </span>
              </button>
            ))}

            <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-col gap-1">
              <button className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-accent)] transition-colors w-full text-left">
                <ArchiveIcon className="h-4 w-4 shrink-0" />
                Archive
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-accent)] transition-colors w-full text-left">
                <TrashIcon className="h-4 w-4 shrink-0" />
                Trash
              </button>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-3 border-b border-[var(--color-border)] flex items-center gap-3 flex-wrap">
              {/* View toggle */}
              <div className="flex items-center bg-[var(--color-muted)]/30 rounded-[var(--radius-md)] p-1 gap-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                  className={`h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors
                    ${viewMode === 'grid'
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm'
                      : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'}`}
                >
                  <GridIcon />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  className={`h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors
                    ${viewMode === 'list'
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm'
                      : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'}`}
                >
                  <ListIcon />
                </button>
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[160px] max-w-xs">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search assets..."
                  className="pl-9 h-8 text-xs"
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                {/* Multi-select actions */}
                {selected.size > 0 && (
                  <div className="flex items-center gap-2 pr-3 mr-1 border-r border-[var(--color-border)]">
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      <span className="text-[var(--color-primary)] font-semibold">{selected.size}</span> selected
                    </span>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                      <DownloadIcon className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                      <MoveIcon className="h-3.5 w-3.5" />
                      Move
                    </Button>
                    <Button variant="destructive" size="sm" className="h-7 text-xs gap-1.5"
                      onClick={deleteSelected}>
                      <TrashIcon className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                )}

                {/* Upload button */}
                <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm" className="h-8 gap-1.5">
                      <UploadIcon className="h-4 w-4" />
                      Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Assets</DialogTitle>
                      <DialogDescription>
                        Drag and drop files or click to browse. Max 100 MB per file.
                      </DialogDescription>
                    </DialogHeader>
                    <FileUpload
                      onFiles={addFiles}
                      multiple
                      maxSize={100 * 1024 * 1024}
                      maxFiles={20}
                      accept="image/*,video/*,.pdf,.zip,.xlsx"
                    />
                    {uploadFiles.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto space-y-2">
                        {uploadFiles.map((uf) => (
                          <div key={uf.id} className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--color-muted)]/30 border border-[var(--color-border)] text-sm">
                            <FileTextIcon className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
                            <span className="flex-1 truncate font-medium text-[var(--color-foreground)]">{uf.file.name}</span>
                            <span className="text-xs text-[var(--color-muted-foreground)]">{formatBytes(uf.file.size)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { clearUploadFiles(); setUploadOpen(false); }}>
                        Cancel
                      </Button>
                      <Button variant="default" onClick={handleUpload}
                        disabled={uploadFiles.length === 0}>
                        Upload {uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Asset area */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                /* Loading skeleton */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="aspect-square rounded-[var(--radius-md)]" />
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-[var(--color-muted)]/30 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-[var(--color-muted-foreground)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-foreground)]">
                      {search ? 'No assets found' : 'No assets yet'}
                    </p>
                    <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                      {search
                        ? `No assets match "${search}"`
                        : 'Upload your first file to get started.'}
                    </p>
                  </div>
                  {!search && (
                    <Button variant="default" onClick={() => setUploadOpen(true)}>
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Upload Assets
                    </Button>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                /* Grid view */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {filtered.map((asset) => {
                    const isSelected = selected.has(asset.id);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => toggleSelect(asset.id)}
                        onDoubleClick={() => router.push(`/dam/${asset.id}`)}
                        className={`group relative rounded-[var(--radius-lg)] p-3 border-2 transition-all cursor-pointer
                          ${isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-lg'
                            : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-accent)]/30 hover:-translate-y-0.5'}`}
                      >
                        {/* Selection indicator */}
                        <div
                          className={`absolute top-2 left-2 h-5 w-5 rounded-[var(--radius-sm)] flex items-center justify-center transition-opacity z-10
                            ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`}
                          style={{ background: isSelected ? 'var(--color-primary)' : 'var(--color-muted)' }}
                        >
                          {isSelected && <CheckIcon className="h-3 w-3 text-[var(--color-primary-foreground)]" />}
                        </div>

                        {/* Thumbnail */}
                        <AssetThumbnail asset={asset} />

                        {/* Info */}
                        <div className="mt-2.5 flex flex-col gap-0.5">
                          <span className="text-xs font-semibold truncate text-[var(--color-foreground)]">
                            {asset.name}
                          </span>
                          <span className="text-[10px] text-[var(--color-muted-foreground)]">
                            {getAssetMeta(asset)}
                          </span>
                        </div>

                        {/* Action menu (hover) */}
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <AssetMenu asset={asset} onDelete={deleteAsset} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List view */
                <div className="overflow-x-auto">
                  <DataTable
                    columns={columns}
                    data={filtered}
                    pageSize={20}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right context rail */}
          <aside className="w-12 shrink-0 border-l border-[var(--color-border)] flex flex-col items-center py-5 gap-3">
            {[
              { icon: <InfoIcon />, label: 'Asset Details' },
              { icon: <HistoryIcon />, label: 'Version History' },
              { icon: <LockIcon />, label: 'Access Control' },
            ].map(({ icon, label }) => (
              <Tooltip key={label}>
                <TooltipTrigger asChild>
                  <button
                    className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-accent)] transition-colors"
                    aria-label={label}
                  >
                    {icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">{label}</TooltipContent>
              </Tooltip>
            ))}
            <div className="mt-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-accent)] transition-colors"
                    aria-label="Settings"
                  >
                    <SettingsIcon />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">Settings</TooltipContent>
              </Tooltip>
            </div>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ---------------------------------------------------------------------------
// SVG Icons (inline, no external deps)
// ---------------------------------------------------------------------------

function ImageIcon({ className, color }: { className?: string; color?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke={color ?? 'currentColor'} strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

function VideoIcon({ className, color }: { className?: string; color?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke={color ?? 'currentColor'} strokeWidth="2" aria-hidden="true">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <polyline points="21 8 21 21 3 21 3 8"/>
      <rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  );
}

function SpreadsheetIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function FolderOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      <polyline points="2 10 12 10 22 10"/>
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function MoveIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/>
      <circle cx="12" cy="19" r="1"/>
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-4 w-4'} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
      <polyline points="12 7 12 12 16 14"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-6 w-6 animate-spin text-[var(--color-primary-foreground)]"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" opacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
  );
}
