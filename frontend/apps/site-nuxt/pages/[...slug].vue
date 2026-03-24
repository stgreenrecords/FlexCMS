<template>
  <div>
    <!-- FlexCMS Nuxt site — catch-all route -->
    <FlexCmsPage v-if="pageData" :page-data="pageData" />
    <div v-else-if="error" class="min-h-screen flex items-center justify-center">
      <h1 class="text-2xl font-bold">Page not found</h1>
    </div>
    <div v-else class="min-h-screen flex items-center justify-center">
      <p>Loading...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Catch-all page route — fetches CMS content via @flexcms/sdk
 * and renders using @flexcms/vue. Zero HTML comes from the backend.
 */
import { FlexCmsPage, useFlexCms } from '@flexcms/vue';

const route = useRoute();
const { client } = useFlexCms();

const path = computed(() => {
  const slug = route.params.slug;
  if (Array.isArray(slug) && slug.length > 0) return '/' + slug.join('/');
  return '/homepage';
});

const { data: pageData, error } = await useAsyncData(
  `page-${path.value}`,
  () => client.getPage(path.value)
);
</script>

