import type { ComponentType } from 'react';
import type { WkndComponent } from '@/lib/flexcms';

import { ContainerRenderer } from './renderers/ContainerRenderer';
import { TitleRenderer } from './renderers/TitleRenderer';
import { TextRenderer } from './renderers/TextRenderer';
import { ImageRenderer } from './renderers/ImageRenderer';
import { TeaserRenderer } from './renderers/TeaserRenderer';
import { CarouselRenderer } from './renderers/CarouselRenderer';
import { TabsRenderer } from './renderers/TabsRenderer';
import { BreadcrumbRenderer } from './renderers/BreadcrumbRenderer';
import { NavigationRenderer } from './renderers/NavigationRenderer';
import { ButtonRenderer } from './renderers/ButtonRenderer';
import { SeparatorRenderer } from './renderers/SeparatorRenderer';
import { ImageListRenderer } from './renderers/ImageListRenderer';
import { ExperienceFragmentRenderer } from './renderers/ExperienceFragmentRenderer';
import { SearchRenderer } from './renderers/SearchRenderer';

export type RendererComponent = ComponentType<{ component: WkndComponent }>;

export const COMPONENT_MAP: Record<string, RendererComponent> = {
  'wknd/components/container': ContainerRenderer,
  'wknd/components/title': TitleRenderer,
  'wknd/components/text': TextRenderer,
  'wknd/components/image': ImageRenderer,
  'wknd/components/teaser': TeaserRenderer,
  'wknd/components/carousel': CarouselRenderer,
  'wknd/components/tabs': TabsRenderer,
  'wknd/components/breadcrumb': BreadcrumbRenderer,
  'wknd/components/navigation': NavigationRenderer,
  'wknd/components/languagenavigation': NavigationRenderer,
  'wknd/components/button': ButtonRenderer,
  'wknd/components/separator': SeparatorRenderer,
  'wknd/components/image-list': ImageListRenderer,
  'wknd/components/search': SearchRenderer,
  'flexcms/experience-fragment': ExperienceFragmentRenderer,
  'wknd/components/xfpage': ContainerRenderer,
  // form components — render nothing
  'wknd/components/form/sign-in-buttons': ButtonRenderer,
};
