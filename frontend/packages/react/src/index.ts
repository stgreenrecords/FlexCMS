'use client';

// @flexcms/react — React adapter for FlexCMS

export { FlexCmsProvider, useFlexCms, type FlexCmsRenderer, type FlexCmsContextValue, type FlexCmsProviderProps } from './FlexCmsProvider';
export { FlexCmsComponent, type FlexCmsComponentProps } from './FlexCmsComponent';
export { FlexCmsPage, type FlexCmsPageProps } from './FlexCmsPage';
export { useFlexCmsPage, type UseFlexCmsPageResult, type UseFlexCmsPageOptions } from './useFlexCmsPage';

// Re-export SDK essentials so consumers don't need a separate import
export { FlexCmsClient, ComponentMapper } from '@flexcms/sdk';
export type { PageResponse, ComponentNode, NavigationItem, FlexCmsConfig } from '@flexcms/sdk';

