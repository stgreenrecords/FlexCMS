// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  runtimeConfig: {
    flexcmsApiUrl: process.env.FLEXCMS_API_URL ?? 'http://localhost:8080',
    flexcmsDefaultSite: process.env.FLEXCMS_DEFAULT_SITE ?? 'corporate',
    flexcmsDefaultLocale: process.env.FLEXCMS_DEFAULT_LOCALE ?? 'en',
  },
});

