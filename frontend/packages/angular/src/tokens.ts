/**
 * FlexCMS Angular Adapter — DI Tokens
 *
 * InjectionTokens that wire the FlexCMS client and component mapper
 * into Angular's DI system via provideFlexCms().
 */
import { InjectionToken } from '@angular/core';
import { FlexCmsClient, ComponentMapper } from '@flexcms/sdk';
import type { FlexCmsAngularComponentType } from './types';

/** Token for the FlexCmsClient instance */
export const FLEXCMS_CLIENT = new InjectionToken<FlexCmsClient>('FlexCmsClient');

/** Token for the ComponentMapper (maps resourceType → Angular component type) */
export const FLEXCMS_MAPPER = new InjectionToken<ComponentMapper<FlexCmsAngularComponentType>>(
  'FlexCmsMapper'
);

