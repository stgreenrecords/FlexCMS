/**
 * Centralized data-testid selector constants.
 *
 * Usage:
 *   import { SELECTORS } from '../../src/fixtures/selectors';
 *   await page.getByTestId(SELECTORS.sidebar.dashboard).click();
 *
 * Every selector here MUST have a corresponding data-testid in the admin UI.
 * See docs/UI_TEST_AUTOMATION_PLAN.md §11 for the full list.
 */

export const SELECTORS = {
  // ── Sidebar navigation ──────────────────────────────────────────────────
  sidebar: {
    root:       'sidebar-nav',
    dashboard:  'sidebar-nav-dashboard',
    content:    'sidebar-nav-content',
    sites:      'sidebar-nav-sites',
    workflows:  'sidebar-nav-workflows',
    dam:        'sidebar-nav-dam',
    pim:        'sidebar-nav-pim',
    components: 'sidebar-nav-components',
    fragments:  'sidebar-nav-fragments',
    translations: 'sidebar-nav-translations',
  },

  // ── Common page elements ─────────────────────────────────────────────────
  common: {
    loadingSkeleton: 'loading-skeleton',
    emptyState:      'empty-state',
    breadcrumb:      'breadcrumb',
    breadcrumbItem:  'breadcrumb-item',
    searchInput:     'search-input',
  },

  // ── Content Tree ─────────────────────────────────────────────────────────
  content: {
    heading:         'content-tree-heading',
    searchInput:     'content-search',
    table:           'content-table',
    row:             'content-row',
    rowName:         'content-row-name',
    statusBadge:     'status-badge',
    navigateUp:      'navigate-up',
    breadcrumb:      'content-breadcrumb',
    breadcrumbItem:  'content-breadcrumb-item',
    actionMenuTrigger: 'action-menu-trigger',
    actionEdit:      'action-edit',
    actionPreview:   'action-preview',
    actionPublish:   'action-publish',
    actionDelete:    'action-delete',
    selectAll:       'select-all-checkbox',
    footer:          'content-table-footer',
    emptyState:      'content-empty-state',
    skeletonRow:     'skeleton-row',
  },

  // ── Page Editor ───────────────────────────────────────────────────────────
  editor: {
    root:            'editor-root',
    palette:         'component-palette',
    paletteItem:     'palette-item',
    canvas:          'editor-canvas',
    componentList:   'component-list',
    componentItem:   'component-item',
    propertyPanel:   'property-panel',
    saveButton:      'editor-save',
    publishButton:   'editor-publish',
    viewportDesktop: 'viewport-desktop',
    viewportTablet:  'viewport-tablet',
    viewportMobile:  'viewport-mobile',
    dragHandle:      'drag-handle',
  },

  // ── DAM Browser ───────────────────────────────────────────────────────────
  dam: {
    heading:       'dam-heading',
    searchInput:   'dam-search',
    assetGrid:     'asset-grid',
    assetList:     'asset-list',
    assetItem:     'asset-item',
    uploadButton:  'dam-upload-btn',
    uploadZone:    'dam-upload-zone',
    viewToggleGrid: 'view-toggle-grid',
    viewToggleList: 'view-toggle-list',
    bulkActions:   'bulk-actions',
    emptyState:    'dam-empty-state',
    skeletonItem:  'dam-skeleton-item',
  },

  // ── Workflows ─────────────────────────────────────────────────────────────
  workflows: {
    heading:       'workflow-heading',
    list:          'workflow-list',
    item:          'workflow-item',
    approveButton: 'workflow-approve',
    rejectButton:  'workflow-reject',
    commentInput:  'workflow-comment',
    tabPending:    'workflow-tab-pending',
    tabApproved:   'workflow-tab-approved',
    tabRejected:   'workflow-tab-rejected',
    emptyState:    'workflow-empty-state',
    skeleton:      'workflow-skeleton',
  },

  // ── Sites ─────────────────────────────────────────────────────────────────
  sites: {
    heading:        'sites-heading',
    grid:           'site-grid',
    list:           'site-list',
    item:           'site-item',
    createButton:   'create-site-btn',
    searchInput:    'sites-search',
    emptyState:     'sites-empty-state',
    viewToggleGrid: 'sites-view-toggle-grid',
    viewToggleList: 'sites-view-toggle-list',
  },

  // ── PIM ───────────────────────────────────────────────────────────────────
  pim: {
    heading:       'pim-heading',
    productGrid:   'product-grid',
    productItem:   'product-item',
    importStep:    'import-step',
    schemaEditor:  'schema-editor',
    fieldItem:     'schema-field-item',
    addFieldButton: 'add-field-btn',
    emptyState:    'pim-empty-state',
  },

  // ── Preview ───────────────────────────────────────────────────────────────
  preview: {
    iframe:          'preview-iframe',
    viewportDesktop: 'preview-viewport-desktop',
    viewportTablet:  'preview-viewport-tablet',
    viewportMobile:  'preview-viewport-mobile',
    draftToggle:     'preview-draft-toggle',
    publishedToggle: 'preview-published-toggle',
  },
} as const;

