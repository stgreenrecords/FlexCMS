/**
 * FlexCMS Vue plugin — registers the SDK client and component mapper globally.
 *
 * This is the Nuxt equivalent of the React <FlexCmsProvider>.
 */
import { FlexCmsClient, ComponentMapper } from '@flexcms/sdk';
import { FlexCmsPlugin, type FlexCmsVueRenderer } from '@flexcms/vue';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  const client = new FlexCmsClient({
    apiUrl: config.flexcmsApiUrl as string,
    defaultSite: config.flexcmsDefaultSite as string,
    defaultLocale: config.flexcmsDefaultLocale as string,
  });

  const componentMap = new ComponentMapper<FlexCmsVueRenderer>();
  // Register Vue component renderers here:
  // componentMap.register('myapp/hero-banner', HeroBanner);

  nuxtApp.vueApp.use(FlexCmsPlugin, { client, componentMap });
});

